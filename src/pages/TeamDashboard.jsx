import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Users, TrendingUp, Target, Sparkles, Save, Loader2, Edit2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ScatterChart, Scatter, ZAxis } from 'recharts';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import EditablePlayerCard from '../components/player/EditablePlayerCard';
import { TeamRoleBadge } from '../components/utils/teamRoleBadge';
import TeamAnalyticsDashboard from '../components/team/TeamAnalyticsDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TeamDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const teamId = urlParams.get('teamId');

  const [showEvalDialog, setShowEvalDialog] = useState(false);
  const [showGoalsDialog, setShowGoalsDialog] = useState(false);
  const [showTrainingDialog, setShowTrainingDialog] = useState(false);
  const [generatingGoals, setGeneratingGoals] = useState(false);
  const [generatingTraining, setGeneratingSessions] = useState(false);
  const [teamGoals, setTeamGoals] = useState('');
  const [trainingSessions, setTrainingSessions] = useState('');
  const [editingGoals, setEditingGoals] = useState(false);
  const [editingTraining, setEditingTraining] = useState(false);
  const [activeTab, setActiveTab] = useState('roster');

  const { data: team } = useQuery({
    queryKey: ['team', teamId],
    queryFn: async () => {
      const teams = await base44.entities.Team.filter({ id: teamId });
      return teams[0] || null;
    },
    enabled: !!teamId
  });

  const { data: players = [] } = useQuery({
    queryKey: ['teamPlayers', teamId],
    queryFn: () => base44.entities.Player.filter({ team_id: teamId }),
    enabled: !!teamId
  });

  const { data: allTeams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const { data: tryouts = [] } = useQuery({
    queryKey: ['tryouts'],
    queryFn: () => base44.entities.PlayerTryout.list()
  });

  const { data: clubSettings = [] } = useQuery({
    queryKey: ['clubSettings'],
    queryFn: () => base44.entities.ClubSettings.list()
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => base44.entities.PhysicalAssessment.list()
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations'],
    queryFn: () => base44.entities.Evaluation.list()
  });

  const { data: teamEvaluations = [] } = useQuery({
    queryKey: ['teamEvaluations', teamId],
    queryFn: () => base44.entities.TeamEvaluation.filter({ team_id: teamId }, '-created_date'),
    enabled: !!teamId
  });

  const [evalForm, setEvalForm] = useState({
    growth_mindset: 5,
    resilience: 5,
    efficiency_in_execution: 5,
    athleticism: 5,
    team_focus: 5,
    defending_organized: 5,
    defending_final_third: 5,
    defending_transition: 5,
    pressing: 5,
    defending_set_pieces: 5,
    attacking_organized: 5,
    attacking_final_third: 5,
    attacking_in_transition: 5,
    building_out: 5,
    attacking_set_pieces: 5,
    team_strengths: '',
    areas_of_growth: '',
    training_focus: ''
  });

  const createTeamEvalMutation = useMutation({
    mutationFn: (data) => base44.entities.TeamEvaluation.create({
      team_id: teamId,
      team_name: team?.name,
      ...data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['teamEvaluations']);
      setShowEvalDialog(false);
      toast.success('Team evaluation created');
    }
  });

  const latestTeamEval = teamEvaluations[0] || null;

  const teamAssessments = assessments.filter(a => 
    players.some(p => p.id === a.player_id)
  );

  const teamPlayerEvals = evaluations.filter(e => 
    players.some(p => p.id === e.player_id)
  );

  const avgPhysicalScores = {
    speed: Math.round(teamAssessments.reduce((acc, a) => acc + (a.speed_score || 0), 0) / teamAssessments.length) || 0,
    power: Math.round(teamAssessments.reduce((acc, a) => acc + (a.power_score || 0), 0) / teamAssessments.length) || 0,
    endurance: Math.round(teamAssessments.reduce((acc, a) => acc + (a.endurance_score || 0), 0) / teamAssessments.length) || 0,
    agility: Math.round(teamAssessments.reduce((acc, a) => acc + (a.agility_score || 0), 0) / teamAssessments.length) || 0
  };

  const teamRadarData = latestTeamEval ? [
    { category: 'Mental', value: Math.round(((latestTeamEval.growth_mindset || 0) + (latestTeamEval.resilience || 0) + (latestTeamEval.team_focus || 0)) / 3) },
    { category: 'Physical', value: latestTeamEval.athleticism || 0 },
    { category: 'Defending', value: Math.round(((latestTeamEval.defending_organized || 0) + (latestTeamEval.defending_final_third || 0) + (latestTeamEval.defending_transition || 0)) / 3) },
    { category: 'Attacking', value: Math.round(((latestTeamEval.attacking_organized || 0) + (latestTeamEval.attacking_final_third || 0) + (latestTeamEval.attacking_in_transition || 0)) / 3) },
    { category: 'Technical', value: latestTeamEval.efficiency_in_execution || 0 }
  ] : [];

  const positionDistribution = players.reduce((acc, p) => {
    const pos = p.primary_position || 'Unassigned';
    acc[pos] = (acc[pos] || 0) + 1;
    return acc;
  }, {});

  const positionData = Object.keys(positionDistribution).map(pos => ({
    position: pos,
    count: positionDistribution[pos]
  }));

  const depthChartByPosition = {};
  players.forEach(p => {
    const pos = p.primary_position || 'Unassigned';
    if (!depthChartByPosition[pos]) depthChartByPosition[pos] = [];
    const tryout = tryouts.find(t => t.player_id === p.id);
    depthChartByPosition[pos].push({ ...p, tryout });
  });

  Object.keys(depthChartByPosition).forEach(pos => {
    depthChartByPosition[pos].sort((a, b) => {
      const rankA = a.tryout?.team_ranking || 9999;
      const rankB = b.tryout?.team_ranking || 9999;
      return rankA - rankB;
    });
  });

  const handleDepthChartDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination } = result;
    
    if (source.droppableId === destination.droppableId) {
      const position = source.droppableId;
      const items = Array.from(depthChartByPosition[position]);
      const [removed] = items.splice(source.index, 1);
      items.splice(destination.index, 0, removed);
      
      items.forEach((player, idx) => {
        const tryout = tryouts.find(t => t.player_id === player.id);
        if (tryout) {
          base44.entities.PlayerTryout.update(tryout.id, { team_ranking: idx + 1 });
        }
      });
      
      queryClient.invalidateQueries(['tryouts']);
      toast.success('Depth chart updated');
    }
  };

  const generateTeamGoals = async () => {
    setGeneratingGoals(true);
    try {
      const prompt = `You are a soccer coach analyzing team ${team?.name}.

Team Stats:
- Total Players: ${players.length}
- Position Distribution: ${Object.keys(positionDistribution).map(pos => `${pos}: ${positionDistribution[pos]}`).join(', ')}
- Average Physical Scores: Speed ${avgPhysicalScores.speed}, Power ${avgPhysicalScores.power}, Endurance ${avgPhysicalScores.endurance}, Agility ${avgPhysicalScores.agility}

${latestTeamEval ? `Latest Team Evaluation:
- Mental Attributes: Growth Mindset ${latestTeamEval.growth_mindset}/10, Resilience ${latestTeamEval.resilience}/10
- Defending: ${latestTeamEval.defending_organized}/10
- Attacking: ${latestTeamEval.attacking_organized}/10` : ''}

Generate 3-5 SMART goals for this team for the upcoming season. Format as a bulleted list with specific, measurable objectives.`;

      const response = await base44.integrations.Core.InvokeLLM({ prompt });
      setTeamGoals(response);
      toast.success('Team goals generated');
    } catch (error) {
      toast.error('Failed to generate goals');
    } finally {
      setGeneratingGoals(false);
    }
  };

  const generateTrainingSessions = async () => {
    setGeneratingSessions(true);
    try {
      const prompt = `You are a soccer coach planning training for team ${team?.name}.

Team Profile:
- Age Group: ${team?.age_group}
- League: ${team?.league}
- Total Players: ${players.length}

${latestTeamEval ? `Team Evaluation Insights:
- Strengths: ${latestTeamEval.team_strengths}
- Areas of Growth: ${latestTeamEval.areas_of_growth}
- Training Focus: ${latestTeamEval.training_focus}` : ''}

Generate 3 detailed training session plans for this week. For each session include:
1. Session Title & Duration
2. Objectives (2-3 bullet points)
3. Main Drills (3-4 specific drills with brief descriptions)
4. Cool Down

Format with clear headers and structure.`;

      const response = await base44.integrations.Core.InvokeLLM({ prompt });
      setTrainingSessions(response);
      toast.success('Training sessions generated');
    } catch (error) {
      toast.error('Failed to generate sessions');
    } finally {
      setGeneratingSessions(false);
    }
  };

  const SliderField = ({ label, value, onChange }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium">{label}</Label>
        <span className="text-sm font-bold text-emerald-600">{value}</span>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={1} max={10} step={1} />
    </div>
  );

  if (!team) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-blue-50">
      <div className="relative bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-2xl">
        <div className="max-w-[1800px] mx-auto p-6 md:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-white hover:bg-white/20">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">{team.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-emerald-500/30 backdrop-blur-sm text-white border-emerald-300/40">
                    {team.age_group}
                  </Badge>
                  <Badge className="bg-green-500/30 backdrop-blur-sm text-white border-green-300/40">
                    {team.league}
                  </Badge>
                  <Badge className="bg-blue-500/30 backdrop-blur-sm text-white border-blue-300/40">
                    {players.length} Players
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto p-4 md:p-6 -mt-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-none shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold">{players.length}</div>
              <div className="text-xs opacity-90">Total Players</div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold">{teamAssessments.length}</div>
              <div className="text-xs opacity-90">Assessments</div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold">{teamPlayerEvals.length}</div>
              <div className="text-xs opacity-90">Evaluations</div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold">{avgPhysicalScores.speed}</div>
              <div className="text-xs opacity-90">Avg Speed</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md mb-6">
            <TabsTrigger value="roster">Team Roster</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <TeamAnalyticsDashboard 
              team={team}
              players={players}
              evaluations={evaluations}
              assessments={assessments}
              tryouts={tryouts}
            />
          </TabsContent>

          <TabsContent value="evaluation">
        {/* Team Evaluation & Analytics */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <Card className="border-none shadow-2xl bg-gradient-to-br from-white to-purple-50">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  🎯 Team Performance
                </CardTitle>
                {!latestTeamEval ? (
                  <Button size="sm" variant="ghost" onClick={() => setShowEvalDialog(true)} className="text-white hover:bg-white/20">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => setShowEvalDialog(true)} className="text-white hover:bg-white/20">
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {latestTeamEval ? (
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={teamRadarData}>
                    <defs>
                      <linearGradient id="teamRadarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="category" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
                    <PolarRadiusAxis domain={[0, 10]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Radar dataKey="value" stroke="#a855f7" fill="url(#teamRadarGradient)" strokeWidth={3} dot={{ r: 5, fill: '#a855f7', stroke: '#fff', strokeWidth: 2 }} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-500 mb-4">No team evaluation yet</p>
                  <Button onClick={() => setShowEvalDialog(true)} className="bg-purple-600 hover:bg-purple-700">
                    Create Evaluation
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl bg-gradient-to-br from-white to-blue-50">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-b">
              <CardTitle className="text-lg">📊 Position Heatmap</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={positionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="position" type="category" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl bg-gradient-to-br from-white to-orange-50">
            <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white border-b">
              <CardTitle className="text-lg">💪 Physical Averages</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Speed</span>
                    <span className="font-bold text-red-600">{avgPhysicalScores.speed}</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full" style={{ width: `${avgPhysicalScores.speed}%` }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Power</span>
                    <span className="font-bold text-blue-600">{avgPhysicalScores.power}</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" style={{ width: `${avgPhysicalScores.power}%` }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Endurance</span>
                    <span className="font-bold text-emerald-600">{avgPhysicalScores.endurance}</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full" style={{ width: `${avgPhysicalScores.endurance}%` }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Agility</span>
                    <span className="font-bold text-pink-600">{avgPhysicalScores.agility}</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-pink-500 to-pink-600 rounded-full" style={{ width: `${avgPhysicalScores.agility}%` }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Generated Content */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Card className="border-none shadow-2xl bg-gradient-to-br from-white to-emerald-50">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-600 text-white border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Team Goals
                </CardTitle>
                <Button size="sm" variant="ghost" onClick={generateTeamGoals} disabled={generatingGoals} className="text-white hover:bg-white/20">
                  {generatingGoals ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4 mr-1" />Adil's Suggestions</>}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {teamGoals ? (
                editingGoals ? (
                  <Textarea 
                    value={teamGoals} 
                    onChange={(e) => setTeamGoals(e.target.value)}
                    rows={12}
                    className="text-sm"
                  />
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <div className="text-sm text-slate-700 whitespace-pre-wrap">{teamGoals}</div>
                  </div>
                )
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Click Generate to create AI-powered team goals
                </div>
              )}
              {teamGoals && (
                <div className="flex justify-end mt-3">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setEditingGoals(!editingGoals)}
                  >
                    {editingGoals ? 'Done' : 'Edit'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl bg-gradient-to-br from-white to-blue-50">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Training Sessions
                </CardTitle>
                <Button size="sm" variant="ghost" onClick={generateTrainingSessions} disabled={generatingTraining} className="text-white hover:bg-white/20">
                  {generatingTraining ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4 mr-1" />Adil's Suggestions</>}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {trainingSessions ? (
                editingTraining ? (
                  <Textarea 
                    value={trainingSessions} 
                    onChange={(e) => setTrainingSessions(e.target.value)}
                    rows={12}
                    className="text-sm"
                  />
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <div className="text-sm text-slate-700 whitespace-pre-wrap">{trainingSessions}</div>
                  </div>
                )
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Click Generate to create AI-powered training plans
                </div>
              )}
              {trainingSessions && (
                <div className="flex justify-end mt-3">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setEditingTraining(!editingTraining)}
                  >
                    {editingTraining ? 'Done' : 'Edit'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Depth Chart */}
        <Card className="border-none shadow-2xl mb-6 bg-gradient-to-br from-white to-slate-50">
          <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white border-b">
            <CardTitle className="text-lg">📋 Depth Chart by Position - Drag to Reorder</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <DragDropContext onDragEnd={handleDepthChartDragEnd}>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.keys(depthChartByPosition).map(position => (
                  <div key={position} className="bg-white rounded-xl border-2 border-slate-200 p-3">
                    <div className="text-sm font-bold text-slate-900 mb-2 pb-2 border-b">{position}</div>
                    <Droppable droppableId={position}>
                      {(provided, snapshot) => (
                        <div 
                          {...provided.droppableProps} 
                          ref={provided.innerRef}
                          className={`space-y-2 min-h-[40px] ${snapshot.isDraggingOver ? 'bg-emerald-50 rounded-lg p-2' : ''}`}
                        >
                          {depthChartByPosition[position].map((player, idx) => (
                            <Draggable key={player.id} draggableId={player.id} index={idx}>
                              {(provided, snapshot) => (
                                <div 
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`flex items-center gap-2 text-xs p-2 rounded-lg transition-all cursor-grab active:cursor-grabbing ${
                                    snapshot.isDragging ? 'bg-emerald-100 shadow-lg scale-105' : 'bg-slate-50 hover:bg-slate-100'
                                  }`}
                                >
                                  <span className="w-5 h-5 bg-slate-800 rounded-full flex items-center justify-center text-white font-bold text-[9px]">
                                    {idx + 1}
                                  </span>
                                  <span className="flex-1 truncate font-medium">{player.full_name}</span>
                                  {player.tryout?.team_role && (
                                   <TeamRoleBadge role={player.tryout.team_role} size="small" />
                                  )}
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                ))}
              </div>
            </DragDropContext>
          </CardContent>
        </Card>

          </TabsContent>

          <TabsContent value="roster">
        {/* Team Roster */}
        <Card className="border-none shadow-2xl bg-gradient-to-br from-white to-emerald-50">
          <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-600 text-white border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Roster
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {players.map(player => {
                const playerTryout = tryouts.find(t => t.player_id === player.id);
                const playerTeam = allTeams.find(t => t.id === player.team_id);
                return (
                  <EditablePlayerCard
                    key={player.id}
                    player={player}
                    tryout={playerTryout}
                    team={playerTeam}
                    teams={allTeams}
                    clubSettings={clubSettings}
                  />
                );
              })}
            </div>
            {players.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                No players assigned to this team
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Team Evaluation Dialog */}
      <Dialog open={showEvalDialog} onOpenChange={setShowEvalDialog}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden bg-gradient-to-br from-white to-emerald-50">
          <DialogHeader className="bg-gradient-to-r from-emerald-600 to-green-600 -mx-6 -mt-6 px-6 py-4 text-white">
            <DialogTitle className="text-2xl">📊 Team Evaluation - {team.name}</DialogTitle>
            <p className="text-sm text-white/80 mt-1">Ratings are 1-10. Evaluate the team as a whole.</p>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-[calc(95vh-180px)] px-6 py-4 space-y-6">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl shadow-sm">
              <h3 className="font-bold mb-4 text-purple-900 text-lg">🧠 Mental & Character</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <SliderField label="Growth Mindset" value={evalForm.growth_mindset} onChange={v => setEvalForm({...evalForm, growth_mindset: v})} />
                <SliderField label="Resilience" value={evalForm.resilience} onChange={v => setEvalForm({...evalForm, resilience: v})} />
                <SliderField label="Efficiency" value={evalForm.efficiency_in_execution} onChange={v => setEvalForm({...evalForm, efficiency_in_execution: v})} />
                <SliderField label="Athleticism" value={evalForm.athleticism} onChange={v => setEvalForm({...evalForm, athleticism: v})} />
                <SliderField label="Team Focus" value={evalForm.team_focus} onChange={v => setEvalForm({...evalForm, team_focus: v})} />
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-xl shadow-sm">
              <h3 className="font-bold mb-4 text-red-900 text-lg">🛡️ Defending</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <SliderField label="Defending Organized" value={evalForm.defending_organized} onChange={v => setEvalForm({...evalForm, defending_organized: v})} />
                <SliderField label="Defending Final Third" value={evalForm.defending_final_third} onChange={v => setEvalForm({...evalForm, defending_final_third: v})} />
                <SliderField label="Defending Transition" value={evalForm.defending_transition} onChange={v => setEvalForm({...evalForm, defending_transition: v})} />
                <SliderField label="Pressing" value={evalForm.pressing} onChange={v => setEvalForm({...evalForm, pressing: v})} />
                <SliderField label="Defending Set Pieces" value={evalForm.defending_set_pieces} onChange={v => setEvalForm({...evalForm, defending_set_pieces: v})} />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl shadow-sm">
              <h3 className="font-bold mb-4 text-blue-900 text-lg">⚽ Attacking</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <SliderField label="Attacking Organized" value={evalForm.attacking_organized} onChange={v => setEvalForm({...evalForm, attacking_organized: v})} />
                <SliderField label="Attacking Final Third" value={evalForm.attacking_final_third} onChange={v => setEvalForm({...evalForm, attacking_final_third: v})} />
                <SliderField label="Attacking in Transition" value={evalForm.attacking_in_transition} onChange={v => setEvalForm({...evalForm, attacking_in_transition: v})} />
                <SliderField label="Building Out" value={evalForm.building_out} onChange={v => setEvalForm({...evalForm, building_out: v})} />
                <SliderField label="Attacking Set Pieces" value={evalForm.attacking_set_pieces} onChange={v => setEvalForm({...evalForm, attacking_set_pieces: v})} />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border-2 border-emerald-100">
                <Label className="font-semibold text-emerald-900 mb-2 block">Team Strengths</Label>
                <Textarea rows={4} value={evalForm.team_strengths} onChange={e => setEvalForm({...evalForm, team_strengths: e.target.value})} className="text-sm" />
              </div>
              <div className="bg-white p-4 rounded-xl border-2 border-orange-100">
                <Label className="font-semibold text-orange-900 mb-2 block">Areas of Growth</Label>
                <Textarea rows={4} value={evalForm.areas_of_growth} onChange={e => setEvalForm({...evalForm, areas_of_growth: e.target.value})} className="text-sm" />
              </div>
              <div className="bg-white p-4 rounded-xl border-2 border-blue-100">
                <Label className="font-semibold text-blue-900 mb-2 block">Training Focus</Label>
                <Textarea rows={4} value={evalForm.training_focus} onChange={e => setEvalForm({...evalForm, training_focus: e.target.value})} className="text-sm" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 px-6 pb-4 border-t bg-slate-50 -mx-6 -mb-6">
            <Button variant="outline" onClick={() => setShowEvalDialog(false)}>Cancel</Button>
            <Button onClick={() => createTeamEvalMutation.mutate(evalForm)} className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700">
              <Save className="w-4 h-4 mr-2" />
              Save Evaluation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}