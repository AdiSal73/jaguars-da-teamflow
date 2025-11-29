import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Calendar, Save, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const metricColors = {
  growth_mindset: '#8b5cf6',
  resilience: '#ec4899',
  efficiency_in_execution: '#f59e0b',
  athleticism: '#10b981',
  team_focus: '#3b82f6',
  defending_organized: '#ef4444',
  defending_final_third: '#f97316',
  defending_transition: '#eab308',
  attacking_organized: '#22c55e',
  attacking_final_third: '#14b8a6',
  attacking_in_transition: '#06b6d4'
};

const metricLabels = {
  growth_mindset: 'Growth Mindset',
  resilience: 'Resilience',
  efficiency_in_execution: 'Efficiency',
  athleticism: 'Athleticism',
  team_focus: 'Team Focus',
  defending_organized: 'Def. Organized',
  defending_final_third: 'Def. Final Third',
  defending_transition: 'Def. Transition',
  attacking_organized: 'Att. Organized',
  attacking_final_third: 'Att. Final Third',
  attacking_in_transition: 'Att. Transition'
};

function SliderBar({ label, value, color }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-slate-700">{label}</span>
        <span className="text-sm font-bold" style={{ color }}>{value || 0}</span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${(value || 0) * 10}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function PlayerDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const playerId = urlParams.get('id');

  const [isEditing, setIsEditing] = useState(false);
  const [playerForm, setPlayerForm] = useState({});
  const [tryoutForm, setTryoutForm] = useState({});

  const { data: player, isLoading: playerLoading } = useQuery({
    queryKey: ['player', playerId],
    queryFn: async () => {
      const players = await base44.entities.Player.list();
      return players.find(p => p.id === playerId);
    },
    enabled: !!playerId
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const { data: tryout } = useQuery({
    queryKey: ['tryout', playerId],
    queryFn: async () => {
      const tryouts = await base44.entities.PlayerTryout.filter({ player_id: playerId });
      return tryouts[0] || null;
    },
    enabled: !!playerId
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments', playerId],
    queryFn: () => base44.entities.PhysicalAssessment.filter({ player_id: playerId }, '-assessment_date'),
    enabled: !!playerId
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations', playerId],
    queryFn: () => base44.entities.Evaluation.filter({ player_id: playerId }, '-created_date'),
    enabled: !!playerId
  });

  const { data: allPlayers = [] } = useQuery({
    queryKey: ['allPlayers'],
    queryFn: () => base44.entities.Player.list()
  });

  const latestAssessment = assessments[0];
  const latestEvaluation = evaluations[0];
  const team = teams.find(t => t.id === player?.team_id);

  React.useEffect(() => {
    if (player) {
      setPlayerForm({
        full_name: player.full_name || '',
        email: player.email || '',
        phone: player.phone || '',
        date_of_birth: player.date_of_birth || '',
        jersey_number: player.jersey_number || '',
        primary_position: player.primary_position || '',
        parent_name: player.parent_name || '',
        status: player.status || 'Active'
      });
    }
  }, [player]);

  React.useEffect(() => {
    if (tryout) {
      setTryoutForm({
        team_role: tryout.team_role || '',
        recommendation: tryout.recommendation || '',
        next_year_team: tryout.next_year_team || '',
        next_season_status: tryout.next_season_status || 'N/A',
        registration_status: tryout.registration_status || 'Not Signed',
        dominant_foot: tryout.dominant_foot || '',
        notes: tryout.notes || ''
      });
    }
  }, [tryout]);

  const updatePlayerMutation = useMutation({
    mutationFn: (data) => base44.entities.Player.update(playerId, data),
    onSuccess: () => queryClient.invalidateQueries(['player', playerId])
  });

  const updateTryoutMutation = useMutation({
    mutationFn: (data) => {
      if (tryout?.id) {
        return base44.entities.PlayerTryout.update(tryout.id, data);
      } else {
        return base44.entities.PlayerTryout.create({ player_id: playerId, player_name: player?.full_name, ...data });
      }
    },
    onSuccess: () => queryClient.invalidateQueries(['tryout', playerId])
  });

  const handleSaveAll = async () => {
    await updatePlayerMutation.mutateAsync(playerForm);
    await updateTryoutMutation.mutateAsync(tryoutForm);
    setIsEditing(false);
  };

  // Navigation
  const sortedPlayers = [...allPlayers].sort((a, b) => {
    const lastNameA = a.full_name?.split(' ').pop() || '';
    const lastNameB = b.full_name?.split(' ').pop() || '';
    return lastNameA.localeCompare(lastNameB);
  });
  const currentPlayerIndex = sortedPlayers.findIndex(p => p.id === playerId);
  const previousPlayer = currentPlayerIndex > 0 ? sortedPlayers[currentPlayerIndex - 1] : null;
  const nextPlayer = currentPlayerIndex < sortedPlayers.length - 1 ? sortedPlayers[currentPlayerIndex + 1] : null;

  // Analytics data
  const physicalTrendData = assessments.slice().reverse().map(a => ({
    date: new Date(a.assessment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Speed: a.speed_score || 0,
    Power: a.power_score || 0,
    Endurance: a.endurance_score || 0,
    Agility: a.agility_score || 0
  }));

  const evaluationTrendData = evaluations.slice().reverse().map(e => ({
    date: new Date(e.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Mental: Math.round(((e.growth_mindset || 0) + (e.resilience || 0) + (e.team_focus || 0)) / 3),
    Physical: e.athleticism || 0,
    Defending: Math.round(((e.defending_organized || 0) + (e.defending_final_third || 0) + (e.defending_transition || 0)) / 3),
    Attacking: Math.round(((e.attacking_organized || 0) + (e.attacking_final_third || 0) + (e.attacking_in_transition || 0)) / 3)
  }));

  if (playerLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-slate-500">Player not found</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">{player.full_name}</h1>
          <Badge className={player.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>
            {player.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={!previousPlayer} onClick={() => navigate(`?id=${previousPlayer?.id}`)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" disabled={!nextPlayer} onClick={() => navigate(`?id=${nextPlayer?.id}`)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button onClick={() => isEditing ? handleSaveAll() : setIsEditing(true)} className="bg-emerald-600 hover:bg-emerald-700">
            {isEditing ? <><Save className="w-4 h-4 mr-2" />Save All</> : 'Edit'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Player Info & Contact */}
        <Card className="border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="w-4 h-4" /> Player Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-center mb-3">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {player.jersey_number || player.full_name?.charAt(0)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-slate-500">Name</Label>
                {isEditing ? (
                  <Input value={playerForm.full_name} onChange={e => setPlayerForm({...playerForm, full_name: e.target.value})} className="h-8 text-xs" />
                ) : (
                  <p className="text-sm font-medium">{player.full_name}</p>
                )}
              </div>
              <div>
                <Label className="text-[10px] text-slate-500">Jersey #</Label>
                {isEditing ? (
                  <Input type="number" value={playerForm.jersey_number} onChange={e => setPlayerForm({...playerForm, jersey_number: e.target.value})} className="h-8 text-xs" />
                ) : (
                  <p className="text-sm font-medium">{player.jersey_number || 'N/A'}</p>
                )}
              </div>
              <div>
                <Label className="text-[10px] text-slate-500">Position</Label>
                {isEditing ? (
                  <Select value={playerForm.primary_position} onValueChange={v => setPlayerForm({...playerForm, primary_position: v})}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['GK','Right Outside Back','Left Outside Back','Right Centerback','Left Centerback','Defensive Midfielder','Right Winger','Center Midfielder','Forward','Attacking Midfielder','Left Winger'].map(pos => (
                        <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm font-medium">{player.primary_position || 'N/A'}</p>
                )}
              </div>
              <div>
                <Label className="text-[10px] text-slate-500">Team</Label>
                <p className="text-sm font-medium">{team?.name || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-[10px] text-slate-500">DOB</Label>
                {isEditing ? (
                  <Input type="date" value={playerForm.date_of_birth} onChange={e => setPlayerForm({...playerForm, date_of_birth: e.target.value})} className="h-8 text-xs" />
                ) : (
                  <p className="text-sm font-medium">{player.date_of_birth ? new Date(player.date_of_birth).toLocaleDateString() : 'N/A'}</p>
                )}
              </div>
              <div>
                <Label className="text-[10px] text-slate-500">Parent</Label>
                {isEditing ? (
                  <Input value={playerForm.parent_name} onChange={e => setPlayerForm({...playerForm, parent_name: e.target.value})} className="h-8 text-xs" />
                ) : (
                  <p className="text-sm font-medium">{player.parent_name || 'N/A'}</p>
                )}
              </div>
            </div>
            <div className="border-t pt-2 space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="w-3 h-3 text-slate-400" />
                {isEditing ? (
                  <Input type="email" value={playerForm.email} onChange={e => setPlayerForm({...playerForm, email: e.target.value})} className="h-7 text-xs flex-1" />
                ) : (
                  <span className="text-xs text-slate-600">{player.email || 'N/A'}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3 text-slate-400" />
                {isEditing ? (
                  <Input value={playerForm.phone} onChange={e => setPlayerForm({...playerForm, phone: e.target.value})} className="h-7 text-xs flex-1" />
                ) : (
                  <span className="text-xs text-slate-600">{player.phone || 'N/A'}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tryout Info */}
        <Card className="border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tryout Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-slate-500">Team Role</Label>
                {isEditing ? (
                  <Select value={tryoutForm.team_role} onValueChange={v => setTryoutForm({...tryoutForm, team_role: v})}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {['Indispensable Player','GA Starter','GA Rotation','Aspire Starter','Aspire Rotation','United Starter','United Rotation'].map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className="bg-purple-100 text-purple-800 text-[10px]">{tryout?.team_role || 'N/A'}</Badge>
                )}
              </div>
              <div>
                <Label className="text-[10px] text-slate-500">Recommendation</Label>
                {isEditing ? (
                  <Select value={tryoutForm.recommendation} onValueChange={v => setTryoutForm({...tryoutForm, recommendation: v})}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Move up">🔼 Move up</SelectItem>
                      <SelectItem value="Keep">✅ Keep</SelectItem>
                      <SelectItem value="Move down">🔽 Move down</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={`text-[10px] ${tryout?.recommendation === 'Move up' ? 'bg-emerald-100 text-emerald-800' : tryout?.recommendation === 'Move down' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                    {tryout?.recommendation || 'N/A'}
                  </Badge>
                )}
              </div>
              <div>
                <Label className="text-[10px] text-slate-500">Dominant Foot</Label>
                {isEditing ? (
                  <Select value={tryoutForm.dominant_foot} onValueChange={v => setTryoutForm({...tryoutForm, dominant_foot: v})}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Left">Left</SelectItem>
                      <SelectItem value="Right">Right</SelectItem>
                      <SelectItem value="Both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm font-medium">{tryout?.dominant_foot || 'N/A'}</p>
                )}
              </div>
              <div>
                <Label className="text-[10px] text-slate-500">Next Year Team</Label>
                {isEditing ? (
                  <Input value={tryoutForm.next_year_team} onChange={e => setTryoutForm({...tryoutForm, next_year_team: e.target.value})} className="h-8 text-xs" />
                ) : (
                  <p className="text-sm font-medium">{tryout?.next_year_team || 'N/A'}</p>
                )}
              </div>
              <div>
                <Label className="text-[10px] text-slate-500">Next Season Status</Label>
                {isEditing ? (
                  <Select value={tryoutForm.next_season_status} onValueChange={v => setTryoutForm({...tryoutForm, next_season_status: v})}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N/A">N/A</SelectItem>
                      <SelectItem value="Accepted Offer">Accepted</SelectItem>
                      <SelectItem value="Rejected Offer">Rejected</SelectItem>
                      <SelectItem value="Considering Offer">Considering</SelectItem>
                      <SelectItem value="Not Offered">Not Offered</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm font-medium">{tryout?.next_season_status || 'N/A'}</p>
                )}
              </div>
              <div>
                <Label className="text-[10px] text-slate-500">Registration</Label>
                {isEditing ? (
                  <Select value={tryoutForm.registration_status} onValueChange={v => setTryoutForm({...tryoutForm, registration_status: v})}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Not Signed">Not Signed</SelectItem>
                      <SelectItem value="Signed">Signed</SelectItem>
                      <SelectItem value="Signed and Paid">Signed & Paid</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={`text-[10px] ${tryout?.registration_status === 'Signed and Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
                    {tryout?.registration_status || 'Not Signed'}
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <Label className="text-[10px] text-slate-500">Notes</Label>
              {isEditing ? (
                <Textarea value={tryoutForm.notes} onChange={e => setTryoutForm({...tryoutForm, notes: e.target.value})} className="text-xs" rows={2} />
              ) : (
                <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded">{tryout?.notes || 'No notes'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Physical Assessment */}
        <Card className="border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Physical Assessment
              {latestAssessment && <span className="text-[10px] font-normal text-slate-500">{new Date(latestAssessment.assessment_date).toLocaleDateString()}</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {latestAssessment ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-red-50 rounded-lg text-center">
                    <div className="text-[10px] text-red-600">Sprint (20m)</div>
                    <div className="text-lg font-bold text-red-700">{latestAssessment.sprint?.toFixed(2)}s</div>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg text-center">
                    <div className="text-[10px] text-blue-600">Vertical</div>
                    <div className="text-lg font-bold text-blue-700">{latestAssessment.vertical}"</div>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded-lg text-center">
                    <div className="text-[10px] text-emerald-600">YIRT</div>
                    <div className="text-lg font-bold text-emerald-700">{latestAssessment.yirt}</div>
                  </div>
                  <div className="p-2 bg-pink-50 rounded-lg text-center">
                    <div className="text-[10px] text-pink-600">Shuttle</div>
                    <div className="text-lg font-bold text-pink-700">{latestAssessment.shuttle?.toFixed(2)}s</div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { label: 'Speed', score: latestAssessment.speed_score, color: '#ef4444' },
                    { label: 'Power', score: latestAssessment.power_score, color: '#3b82f6' },
                    { label: 'Endurance', score: latestAssessment.endurance_score, color: '#10b981' },
                    { label: 'Agility', score: latestAssessment.agility_score, color: '#ec4899' }
                  ].map(({ label, score, color }) => (
                    <div key={label} className="text-center">
                      <div className="relative w-10 h-10 mx-auto">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="20" cy="20" r="16" stroke="#e5e7eb" strokeWidth="4" fill="none" />
                          <circle cx="20" cy="20" r="16" stroke={color} strokeWidth="4" fill="none"
                            strokeDasharray={`${2 * Math.PI * 16}`}
                            strokeDashoffset={`${2 * Math.PI * 16 * (1 - (score || 0) / 100)}`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">{score || 0}</div>
                      </div>
                      <div className="text-[8px] text-slate-500 mt-1">{label}</div>
                    </div>
                  ))}
                </div>
                <div className="text-center p-2 bg-slate-900 rounded-lg">
                  <div className="text-[10px] text-white/70">Overall</div>
                  <div className="text-xl font-bold text-white">{latestAssessment.overall_score || 0}</div>
                </div>
              </div>
            ) : (
              <p className="text-center text-slate-500 py-6 text-sm">No assessments yet</p>
            )}
          </CardContent>
        </Card>

        {/* Evaluation Metrics */}
        <Card className="border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Evaluation
              {latestEvaluation && <span className="text-[10px] font-normal text-slate-500">{new Date(latestEvaluation.created_date).toLocaleDateString()}</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {latestEvaluation ? (
              <div className="space-y-2">
                <div className="text-[10px] font-semibold text-slate-700 mb-1">Mental & Character</div>
                {['growth_mindset', 'resilience', 'efficiency_in_execution', 'athleticism', 'team_focus'].map(key => (
                  <SliderBar
                    key={key}
                    label={metricLabels[key]}
                    value={latestEvaluation[key]}
                    color={metricColors[key]}
                  />
                ))}
                <div className="text-[10px] font-semibold text-slate-700 mt-3 mb-1">Defending</div>
                {['defending_organized', 'defending_final_third', 'defending_transition'].map(key => (
                  <SliderBar
                    key={key}
                    label={metricLabels[key]}
                    value={latestEvaluation[key]}
                    color={metricColors[key]}
                  />
                ))}
                <div className="text-[10px] font-semibold text-slate-700 mt-3 mb-1">Attacking</div>
                {['attacking_organized', 'attacking_final_third', 'attacking_in_transition'].map(key => (
                  <SliderBar
                    key={key}
                    label={metricLabels[key]}
                    value={latestEvaluation[key]}
                    color={metricColors[key]}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-500 py-6 text-sm">No evaluations yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics Row */}
      {(assessments.length > 1 || evaluations.length > 1) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          {assessments.length > 1 && (
            <Card className="border-none shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Physical Progress ({assessments.length} assessments)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={physicalTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="Speed" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Power" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Endurance" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Agility" stroke="#ec4899" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {evaluations.length > 1 && (
            <Card className="border-none shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  Evaluation Progress ({evaluations.length} evaluations)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={evaluationTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="Mental" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Physical" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Defending" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Attacking" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Development Notes */}
      {latestEvaluation && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <Card className="border-none shadow-lg bg-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-800">Strengths</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-700">{latestEvaluation.player_strengths || 'Not specified'}</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-lg bg-orange-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-orange-800">Areas of Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-orange-700">{latestEvaluation.areas_of_growth || 'Not specified'}</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-lg bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-800">Training Focus</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-700">{latestEvaluation.training_focus || 'Not specified'}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}