import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, User, Mail, Phone, Calendar, Ruler, Weight, TrendingUp, Plus, ChevronLeft, ChevronRight, X, BarChart3, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CircularChart from '../components/physical/CircularChart';
import PerformanceTrendChart from '../components/analytics/PerformanceTrendChart';
import RadarComparisonChart from '../components/analytics/RadarComparisonChart';
import GoalTracker from '../components/goals/GoalTracker';
import PlayerDocuments from '../components/player/PlayerDocuments';
import ComprehensiveEvaluationForm from '../components/evaluation/ComprehensiveEvaluationForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PlayerProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const playerId = urlParams.get('id');

  const [showAssessmentDialog, setShowAssessmentDialog] = useState(false);
  const [showEvaluationDialog, setShowEvaluationDialog] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);

  const [newAssessment, setNewAssessment] = useState({
    player_id: playerId,
    team_id: '',
    assessment_date: new Date().toISOString().split('T')[0],
    sprint: '',
    vertical: '',
    yirt: '',
    shuttle: '',
    notes: ''
  });



  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list(),
    enabled: !!user
  });

  const userRole = React.useMemo(() => {
    if (!user) return null;
    if (user.role === 'admin') return 'admin';
    const isCoach = coaches.find(c => c.email === user.email);
    if (isCoach) return 'coach';
    return 'user';
  }, [user, coaches]);

  const { data: player } = useQuery({
    queryKey: ['player', playerId],
    queryFn: async () => {
      const players = await base44.entities.Player.list();
      return players.find(p => p.id === playerId);
    },
    enabled: !!playerId
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments', playerId],
    queryFn: () => base44.entities.PhysicalAssessment.filter({ player_id: playerId }, '-assessment_date')
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations', playerId],
    queryFn: () => base44.entities.Evaluation.filter({ player_id: playerId }, '-evaluation_date')
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const { data: allAssessments = [] } = useQuery({
    queryKey: ['allAssessments'],
    queryFn: () => base44.entities.PhysicalAssessment.list()
  });

  const { data: allPlayers = [] } = useQuery({
    queryKey: ['allPlayers'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: tryout } = useQuery({
    queryKey: ['tryout', playerId],
    queryFn: async () => {
      const tryouts = await base44.entities.PlayerTryout.filter({ player_id: playerId });
      return tryouts[0] || null;
    },
    enabled: !!playerId
  });

  const calculateScores = (sprint, vertical, yirt, shuttle) => {
    const speed = sprint > 0 ? 5 * (20 - 10 * (3.5 * (sprint - 2.8) / sprint)) : 0;
    let power = 0;
    if (vertical > 13) {
      power = 5 * (20 - (20 * (26 - vertical) / vertical));
    } else if (vertical === 13) power = 10;
    else if (vertical === 12) power = 9;
    else if (vertical === 11) power = 8;
    else if (vertical === 10) power = 7;
    else if (vertical < 10) power = 5;
    const endurance = yirt > 0 ? 5 * (20 - 10 * (55 - yirt) / 32) : 0;
    const agility = shuttle > 0 ? 5 * (20 - 10 * (5.2 * (shuttle - 4.6) / shuttle)) : 0;
    const overall = ((6 * speed) + (3 * power) + (6 * endurance)) / 15;
    return {
      speed_score: Math.max(0, Math.min(100, Math.round(speed))),
      power_score: Math.max(0, Math.min(100, Math.round(power))),
      endurance_score: Math.max(0, Math.min(100, Math.round(endurance))),
      agility_score: Math.max(0, Math.min(100, Math.round(agility))),
      overall_score: Math.max(0, Math.min(100, Math.round(overall)))
    };
  };

  const createAssessmentMutation = useMutation({
    mutationFn: (data) => {
      const scores = calculateScores(data.sprint, data.vertical, data.yirt, data.shuttle);
      return base44.entities.PhysicalAssessment.create({
        ...data,
        player_name: player?.full_name || '',
        team_id: player?.team_id || data.team_id,
        ...scores
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['assessments', playerId]);
      queryClient.invalidateQueries(['allAssessments']);
      setShowAssessmentDialog(false);
      setNewAssessment({
        player_id: playerId,
        team_id: player?.team_id || '',
        assessment_date: new Date().toISOString().split('T')[0],
        sprint: '',
        vertical: '',
        yirt: '',
        shuttle: '',
        notes: ''
      });
    }
  });

  // Sync all assessments with player team
  React.useEffect(() => {
    if (player?.team_id && assessments.length > 0) {
      assessments.forEach(assessment => {
        if (assessment.team_id !== player.team_id) {
          base44.entities.PhysicalAssessment.update(assessment.id, { team_id: player.team_id });
        }
      });
    }
  }, [player, assessments]);

  const createEvaluationMutation = useMutation({
    mutationFn: (data) => base44.entities.Evaluation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['evaluations', playerId]);
      setShowEvaluationDialog(false);
    }
  });

  const saveTryoutMutation = useMutation({
    mutationFn: (data) => {
      if (tryout?.id) {
        return base44.entities.PlayerTryout.update(tryout.id, data);
      } else {
        return base44.entities.PlayerTryout.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tryout', playerId]);
    }
  });

  const calculateTrapped = (dateOfBirth) => {
    if (!dateOfBirth) return 'Unknown';
    const date = new Date(dateOfBirth);
    const month = date.getMonth() + 1;
    return (month >= 9 && month <= 12) ? 'Yes' : 'No';
  };

  const handleTryoutFieldUpdate = (field, value) => {
    const data = {
      ...tryout,
      player_id: playerId,
      player_name: player?.full_name,
      current_team: team?.name,
      [field]: value
    };
    saveTryoutMutation.mutate(data);
  };

  const trapped = calculateTrapped(player?.date_of_birth);

  if (!player) return null;

  // Sort players alphabetically by last name
  const sortedPlayers = [...allPlayers].sort((a, b) => {
    const lastNameA = a.full_name?.split(' ').pop() || '';
    const lastNameB = b.full_name?.split(' ').pop() || '';
    return lastNameA.localeCompare(lastNameB);
  });

  const currentPlayerIndex = sortedPlayers.findIndex(p => p.id === playerId);
  const previousPlayer = currentPlayerIndex > 0 ? sortedPlayers[currentPlayerIndex - 1] : null;
  const nextPlayer = currentPlayerIndex < sortedPlayers.length - 1 ? sortedPlayers[currentPlayerIndex + 1] : null;

  const team = teams.find(t => t.id === player.team_id);
  const latestAssessment = assessments[0];



  const teamPlayers = allPlayers.filter(p => p.team_id === player.team_id);
  const teamPlayerIds = teamPlayers.map(p => p.id);
  const teamAssessments = allAssessments.filter(a => teamPlayerIds.includes(a.player_id));

  const calculateAverages = (assessmentList) => {
    if (assessmentList.length === 0) return { speed: 0, agility: 0, power: 0, endurance: 0 };
    const totals = assessmentList.reduce((acc, a) => ({
      speed: acc.speed + (a.speed_score || 0),
      agility: acc.agility + (a.agility_score || 0),
      power: acc.power + (a.power_score || 0),
      endurance: acc.endurance + (a.endurance_score || 0)
    }), { speed: 0, agility: 0, power: 0, endurance: 0 });
    return {
      speed: Math.round(totals.speed / assessmentList.length),
      agility: Math.round(totals.agility / assessmentList.length),
      power: Math.round(totals.power / assessmentList.length),
      endurance: Math.round(totals.endurance / assessmentList.length)
    };
  };

  const teamAverage = calculateAverages(teamAssessments);
  const clubAverage = calculateAverages(allAssessments);
  const playerHistoricalAvg = calculateAverages(assessments);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`${createPageUrl('PlayerAssessmentAnalytics')}?playerId=${playerId}`)}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            View Analytics
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={!previousPlayer}
            onClick={() => navigate(`/player-profile?id=${previousPlayer.id}`)}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={!nextPlayer}
            onClick={() => navigate(`/player-profile?id=${nextPlayer.id}`)}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white text-5xl font-bold mb-4">
                {player.jersey_number || <User className="w-16 h-16" />}
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">{player.full_name}</h2>
              <p className="text-slate-600 mb-4">{player.position}</p>
              <Badge className="mb-6">{player.status}</Badge>

              <div className="w-full space-y-3 text-left">
                {player.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700">{player.email}</span>
                  </div>
                )}
                {player.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700">{player.phone}</span>
                  </div>
                )}
                {player.date_of_birth && (
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700">{new Date(player.date_of_birth).toLocaleDateString()}</span>
                  </div>
                )}
                {player.height && (
                  <div className="flex items-center gap-3 text-sm">
                    <Ruler className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700">{player.height} cm</span>
                  </div>
                )}
                {player.weight && (
                  <div className="flex items-center gap-3 text-sm">
                    <Weight className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700">{player.weight} kg</span>
                  </div>
                )}
                {team && (
                  <div className="flex items-center gap-3 text-sm">
                    <TrendingUp className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700">{team.name}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Tabs defaultValue="physical" className="w-full">
            <TabsList className={`grid w-full ${userRole === 'admin' || userRole === 'coach' ? 'grid-cols-6' : 'grid-cols-5'}`}>
              <TabsTrigger value="physical">Physical</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
              {(userRole === 'admin' || userRole === 'coach') && (
                <TabsTrigger value="tryout">Tryout</TabsTrigger>
              )}
              <TabsTrigger value="goals">Goals</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="physical" className="space-y-6">
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex justify-between items-center">
                    <CardTitle>Physical Assessment</CardTitle>
                    <Button onClick={() => setShowAssessmentDialog(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="w-4 h-4 mr-2" />
                      New Assessment
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  {latestAssessment ? (
                    <div>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-4 bg-red-50 rounded-xl">
                          <div className="text-xs text-red-600 mb-1">Sprint (20m)</div>
                          <div className="text-2xl font-bold text-red-700">{latestAssessment.sprint?.toFixed(2)}s</div>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-xl">
                          <div className="text-xs text-blue-600 mb-1">Vertical Jump</div>
                          <div className="text-2xl font-bold text-blue-700">{latestAssessment.vertical}"</div>
                        </div>
                        <div className="p-4 bg-emerald-50 rounded-xl">
                          <div className="text-xs text-emerald-600 mb-1">YIRT</div>
                          <div className="text-2xl font-bold text-emerald-700">{latestAssessment.yirt}</div>
                        </div>
                        <div className="p-4 bg-pink-50 rounded-xl">
                          <div className="text-xs text-pink-600 mb-1">Shuttle</div>
                          <div className="text-2xl font-bold text-pink-700">{latestAssessment.shuttle?.toFixed(2)}s</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        {[
                          { label: 'Speed', score: latestAssessment.speed_score, color: '#ef4444' },
                          { label: 'Power', score: latestAssessment.power_score, color: '#3b82f6' },
                          { label: 'Endurance', score: latestAssessment.endurance_score, color: '#10b981' },
                          { label: 'Agility', score: latestAssessment.agility_score, color: '#ec4899' }
                        ].map(({ label, score, color }) => (
                          <div key={label} className="flex flex-col items-center">
                            <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                              <svg className="w-full h-full transform -rotate-90">
                                <circle cx="50%" cy="50%" r="28" stroke="#e5e7eb" strokeWidth="6" fill="none" />
                                <circle 
                                  cx="50%" 
                                  cy="50%" 
                                  r="28" 
                                  stroke={color} 
                                  strokeWidth="6" 
                                  fill="none"
                                  strokeDasharray={`${2 * Math.PI * 28}`}
                                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - (score || 0) / 100)}`}
                                  strokeLinecap="round"
                                  className="transition-all duration-500"
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-sm sm:text-base font-bold text-slate-900">{score || 0}</span>
                              </div>
                            </div>
                            <span className="text-xs text-slate-600 mt-2">{label}</span>
                          </div>
                        ))}
                      </div>
                      <div className="text-center p-4 bg-slate-900 rounded-xl">
                        <div className="text-sm text-white mb-1">Overall Score</div>
                        <div className="text-4xl font-bold text-white">{latestAssessment.overall_score || 0}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      No physical assessments yet
                    </div>
                  )}
                </CardContent>
              </Card>

              {assessments.length > 0 && (
                <Card className="border-none shadow-lg">
                  <CardHeader>
                    <CardTitle>Assessment History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {assessments.map(assessment => (
                        <button
                          key={assessment.id}
                          onClick={() => setSelectedAssessment(assessment)}
                          className="w-full p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-left"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <span className="font-medium text-slate-900">
                              {new Date(assessment.assessment_date).toLocaleDateString()}
                            </span>
                            <span className="text-2xl font-bold text-emerald-600">
                              {assessment.overall_score || 0}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="text-slate-600">Sprint: </span>
                              <span className="font-semibold">{assessment.sprint?.toFixed(2) || 'N/A'}s</span>
                            </div>
                            <div>
                              <span className="text-slate-600">Vertical: </span>
                              <span className="font-semibold">{assessment.vertical || 'N/A'}"</span>
                            </div>
                            <div>
                              <span className="text-slate-600">YIRT: </span>
                              <span className="font-semibold">{assessment.yirt || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-slate-600">Shuttle: </span>
                              <span className="font-semibold">{assessment.shuttle?.toFixed(2) || 'N/A'}s</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle>Physical Performance Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  {assessments.length > 1 ? (
                    <div>
                      <PerformanceTrendChart
                        data={assessments.slice().reverse()}
                        metrics={[
                          { key: 'speed_score', label: 'Speed' },
                          { key: 'agility_score', label: 'Agility' },
                          { key: 'power_score', label: 'Power' },
                          { key: 'endurance_score', label: 'Endurance' }
                        ]}
                      />
                      <div className="grid grid-cols-4 gap-4 mt-6">
                        {['speed_score', 'agility_score', 'power_score', 'endurance_score'].map((metric, idx) => {
                          const label = ['Speed', 'Agility', 'Power', 'Endurance'][idx];
                          const avgKey = ['speed', 'agility', 'power', 'endurance'][idx];
                          const current = latestAssessment?.[metric] || 0;
                          const historical = playerHistoricalAvg[avgKey];
                          const change = current - historical;
                          const percentChange = historical !== 0 ? ((change / historical) * 100).toFixed(1) : (current !== 0 ? 'N/A' : '0.0');

                          return (
                            <div key={metric} className="p-3 bg-slate-50 rounded-xl">
                              <div className="text-xs text-slate-600 mb-1">{label}</div>
                              <div className="text-lg font-bold text-slate-900">{current}</div>
                              {historical !== 0 && change !== 0 && (
                                <div className={`text-xs flex items-center gap-1 mt-1 ${change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {change > 0 ? '↑' : '↓'} {Math.abs(parseFloat(percentChange))}%
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      Need at least 2 assessments to show physical trends
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle>Physical Comparison Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  {latestAssessment ? (
                    <>
                      <RadarComparisonChart
                        playerData={{
                          speed: latestAssessment.speed_score,
                          agility: latestAssessment.agility_score,
                          power: latestAssessment.power_score,
                          endurance: latestAssessment.endurance_score
                        }}
                        teamAverage={teamAverage}
                        clubAverage={clubAverage}
                      />
                      <div className="grid grid-cols-3 gap-4 mt-6">
                        <div className="text-center p-4 bg-blue-50 rounded-xl">
                          <div className="text-2xl font-bold text-blue-600">
                            {latestAssessment.overall_score || 0}
                          </div>
                          <div className="text-sm text-slate-600 mt-1">Player</div>
                        </div>
                        <div className="text-center p-4 bg-emerald-50 rounded-xl">
                          <div className="text-2xl font-bold text-emerald-600">
                            {Math.round((teamAverage.speed + teamAverage.agility + teamAverage.power + teamAverage.endurance) / 4)}
                          </div>
                          <div className="text-sm text-slate-600 mt-1">Team Avg</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-xl">
                          <div className="text-2xl font-bold text-orange-600">
                            {Math.round((clubAverage.speed + clubAverage.agility + clubAverage.power + clubAverage.endurance) / 4)}
                          </div>
                          <div className="text-sm text-slate-600 mt-1">Club Avg</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      No physical assessment data available for comparison
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle>Evaluation Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  {evaluations.length > 1 ? (
                    <PerformanceTrendChart
                      data={evaluations.slice().reverse()}
                      metrics={[
                        { key: 'technical_skills', label: 'Technical' },
                        { key: 'tactical_awareness', label: 'Tactical' },
                        { key: 'physical_attributes', label: 'Physical' },
                        { key: 'mental_attributes', label: 'Mental' },
                        { key: 'overall_rating', label: 'Overall' }
                      ]}
                    />
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      Need at least 2 evaluations to show trends
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="evaluations" className="space-y-6 mt-6">
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex justify-between items-center">
                    <CardTitle>Comprehensive Evaluations</CardTitle>
                    <Button onClick={() => setShowEvaluationDialog(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="w-4 h-4 mr-2" />
                      New Evaluation
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {evaluations.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      No evaluations yet
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {evaluations.map(evaluation => (
                        <Card key={evaluation.id} className="border-none shadow-xl hover:shadow-2xl transition-all">
                          <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 border-b">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-bold text-xl text-slate-900">{evaluation.evaluator || 'Coach'}</div>
                                <div className="flex gap-4 mt-2 text-sm text-slate-600">
                                  <span>{new Date(evaluation.created_date).toLocaleDateString()}</span>
                                  <span>•</span>
                                  <span>Position: {evaluation.primary_position}</span>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-6">
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                              <div className="space-y-4">
                                <h3 className="font-bold text-lg text-slate-900 border-b-2 border-emerald-500 pb-2">Mental & Physical</h3>
                                <div className="space-y-3">
                                  {[
                                    { label: 'Growth Mindset', value: evaluation.growth_mindset },
                                    { label: 'Resilience', value: evaluation.resilience },
                                    { label: 'Efficiency', value: evaluation.efficiency_in_execution },
                                    { label: 'Athleticism', value: evaluation.athleticism },
                                    { label: 'Team Focus', value: evaluation.team_focus }
                                  ].map(item => (
                                    <div key={item.label} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                                      <span className="text-sm font-medium text-slate-700">{item.label}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-emerald-600">{item.value}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="space-y-4">
                                <h3 className="font-bold text-lg text-slate-900 border-b-2 border-blue-500 pb-2">Defending</h3>
                                <div className="space-y-3">
                                  {[
                                    { label: 'Organized', value: evaluation.defending_organized },
                                    { label: 'Final Third', value: evaluation.defending_final_third },
                                    { label: 'Transition', value: evaluation.defending_transition }
                                  ].map(item => (
                                    <div key={item.label} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                                      <span className="text-sm font-medium text-slate-700">{item.label}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-blue-600">{item.value}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                
                                <h3 className="font-bold text-lg text-slate-900 border-b-2 border-orange-500 pb-2 mt-6">Attacking</h3>
                                <div className="space-y-3">
                                  {[
                                    { label: 'Organized', value: evaluation.attacking_organized },
                                    { label: 'Final Third', value: evaluation.attacking_final_third },
                                    { label: 'Transition', value: evaluation.attacking_in_transition }
                                  ].map(item => (
                                    <div key={item.label} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                                      <span className="text-sm font-medium text-slate-700">{item.label}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-orange-600">{item.value}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-4">
                                <h3 className="font-bold text-lg text-slate-900 border-b-2 border-purple-500 pb-2">Development Notes</h3>
                                {evaluation.my_goals && (
                                  <div className="p-3 bg-purple-50 rounded-lg">
                                    <div className="text-xs font-semibold text-purple-700 mb-1">Goals</div>
                                    <div className="text-sm text-slate-700">{evaluation.my_goals}</div>
                                  </div>
                                )}
                                {evaluation.player_strengths && (
                                  <div className="p-3 bg-green-50 rounded-lg">
                                    <div className="text-xs font-semibold text-green-700 mb-1">Strengths</div>
                                    <div className="text-sm text-slate-700">{evaluation.player_strengths}</div>
                                  </div>
                                )}
                                {evaluation.areas_of_growth && (
                                  <div className="p-3 bg-orange-50 rounded-lg">
                                    <div className="text-xs font-semibold text-orange-700 mb-1">Areas of Growth</div>
                                    <div className="text-sm text-slate-700">{evaluation.areas_of_growth}</div>
                                  </div>
                                )}
                                {evaluation.training_focus && (
                                  <div className="p-3 bg-blue-50 rounded-lg">
                                    <div className="text-xs font-semibold text-blue-700 mb-1">Training Focus</div>
                                    <div className="text-sm text-slate-700">{evaluation.training_focus}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {(userRole === 'admin' || userRole === 'coach') && (
              <TabsContent value="tryout" className="space-y-6">
              <Card className="border-none shadow-xl bg-gradient-to-br from-white to-slate-50">
                <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-blue-50">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <div className="w-2 h-8 bg-emerald-500 rounded-full" />
                    Tryout Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-8">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-4 bg-white rounded-xl shadow-sm border-2 border-slate-200">
                      <Label className="text-xs text-slate-500 uppercase tracking-wider">Player Name</Label>
                      <div className="text-lg font-semibold text-slate-900 mt-1">{player.full_name}</div>
                    </div>
                    <div className="p-4 bg-white rounded-xl shadow-sm border-2 border-slate-200">
                      <Label className="text-xs text-slate-500 uppercase tracking-wider">Current Team</Label>
                      <div className="text-lg font-semibold text-slate-900 mt-1">{team?.name || 'N/A'}</div>
                    </div>
                    <div className={`p-4 rounded-xl shadow-sm border-2 ${trapped === 'Yes' ? 'bg-red-50 border-red-300' : 'bg-emerald-50 border-emerald-300'}`}>
                      <Label className="text-xs text-slate-500 uppercase tracking-wider">Trapped Player</Label>
                      <div className="text-lg font-bold mt-1 flex items-center gap-2">
                        {trapped === 'Yes' ? (
                          <>
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            <span className="text-red-700">Yes</span>
                          </>
                        ) : (
                          <span className="text-emerald-700">No</span>
                        )}
                      </div>
                      {player.date_of_birth && (
                        <div className="text-xs text-slate-600 mt-1">
                          Born: {new Date(player.date_of_birth).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div className="p-4 bg-white rounded-xl shadow-sm border-2 border-slate-200">
                      <Label className="text-xs text-slate-500 uppercase tracking-wider">Date of Birth</Label>
                      <div className="text-lg font-semibold text-slate-900 mt-1">
                        {player.date_of_birth ? new Date(player.date_of_birth).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border-2 border-slate-200 p-4">
                      <Label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Primary Position</Label>
                      <Select 
                        value={player.primary_position || ''} 
                        onValueChange={async (value) => {
                          await base44.entities.Player.update(playerId, { primary_position: value });
                          queryClient.invalidateQueries(['player', playerId]);
                        }}
                      >
                        <SelectTrigger className="border-2 border-slate-300 h-12">
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GK">GK</SelectItem>
                          <SelectItem value="Right Outside Back">Right Outside Back</SelectItem>
                          <SelectItem value="Left Outside Back">Left Outside Back</SelectItem>
                          <SelectItem value="Right Centerback">Right Centerback</SelectItem>
                          <SelectItem value="Left Centerback">Left Centerback</SelectItem>
                          <SelectItem value="Defensive Midfielder">Defensive Midfielder</SelectItem>
                          <SelectItem value="Right Winger">Right Winger</SelectItem>
                          <SelectItem value="Center Midfielder">Center Midfielder</SelectItem>
                          <SelectItem value="Forward">Forward</SelectItem>
                          <SelectItem value="Attacking Midfielder">Attacking Midfielder</SelectItem>
                          <SelectItem value="Left Winger">Left Winger</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border-2 border-slate-200 p-4">
                      <Label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Dominant Foot</Label>
                      <Select 
                        value={tryout?.dominant_foot || ''} 
                        onValueChange={(value) => handleTryoutFieldUpdate('dominant_foot', value)}
                      >
                        <SelectTrigger className="border-2 border-slate-300 h-12">
                          <SelectValue placeholder="Select dominant foot" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Left">Left</SelectItem>
                          <SelectItem value="Right">Right</SelectItem>
                          <SelectItem value="Both">Both</SelectItem>
                          <SelectItem value="Neither">Neither</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border-2 border-slate-200 p-4">
                      <Label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Team Role</Label>
                      <Select 
                        value={tryout?.team_role || ''} 
                        onValueChange={(value) => handleTryoutFieldUpdate('team_role', value)}
                      >
                        <SelectTrigger className="border-2 border-slate-300 h-12">
                          <SelectValue placeholder="Select team role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Indispensable Player">Indispensable Player</SelectItem>
                          <SelectItem value="GA Starter">GA Starter</SelectItem>
                          <SelectItem value="GA Rotation">GA Rotation</SelectItem>
                          <SelectItem value="Aspire Starter">Aspire Starter</SelectItem>
                          <SelectItem value="Aspire Rotation">Aspire Rotation</SelectItem>
                          <SelectItem value="United Starter">United Starter</SelectItem>
                          <SelectItem value="United Rotation">United Rotation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border-2 border-slate-200 p-4">
                      <Label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Recommendation</Label>
                      <Select 
                        value={tryout?.recommendation || ''} 
                        onValueChange={(value) => handleTryoutFieldUpdate('recommendation', value)}
                      >
                        <SelectTrigger className="border-2 border-slate-300 h-12">
                          <SelectValue placeholder="Select recommendation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Move up">🔼 Move up</SelectItem>
                          <SelectItem value="Keep">✅ Keep</SelectItem>
                          <SelectItem value="Move down">🔽 Move down</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border-2 border-slate-200 p-4">
                      <Label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Next Year's Team</Label>
                      <Input 
                        value={tryout?.next_year_team || ''} 
                        onChange={(e) => handleTryoutFieldUpdate('next_year_team', e.target.value)}
                        placeholder="Enter team name"
                        className="border-2 border-slate-300 h-12"
                      />
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border-2 border-slate-200 p-4">
                      <Label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Next Season Status</Label>
                      <Select 
                        value={tryout?.next_season_status || 'N/A'} 
                        onValueChange={(value) => handleTryoutFieldUpdate('next_season_status', value)}
                      >
                        <SelectTrigger className="border-2 border-slate-300 h-12">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="N/A">N/A</SelectItem>
                          <SelectItem value="Accepted Offer">✅ Accepted Offer</SelectItem>
                          <SelectItem value="Rejected Offer">❌ Rejected Offer</SelectItem>
                          <SelectItem value="Considering Offer">🤔 Considering Offer</SelectItem>
                          <SelectItem value="Not Offered">⏳ Not Offered</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border-2 border-slate-200 p-4">
                      <Label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Registration Status</Label>
                      <Select 
                        value={tryout?.registration_status || 'Not Signed'} 
                        onValueChange={(value) => handleTryoutFieldUpdate('registration_status', value)}
                      >
                        <SelectTrigger className="border-2 border-slate-300 h-12">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Not Signed">⏳ Not Signed</SelectItem>
                          <SelectItem value="Signed and Paid">✅ Signed and Paid</SelectItem>
                          <SelectItem value="Signed">📝 Signed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border-2 border-slate-200 p-4">
                      <Label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Team Ranking</Label>
                      <Input 
                        type="number"
                        value={tryout?.team_ranking || ''} 
                        onChange={(e) => handleTryoutFieldUpdate('team_ranking', parseInt(e.target.value))}
                        placeholder="e.g., 1, 2, 3"
                        className="border-2 border-slate-300 h-12"
                      />
                    </div>
                    <div className="md:col-span-2 bg-white rounded-xl shadow-sm border-2 border-slate-200 p-4">
                      <Label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Notes</Label>
                      <Textarea 
                        value={tryout?.notes || ''} 
                        onChange={(e) => handleTryoutFieldUpdate('notes', e.target.value)}
                        placeholder="Additional notes..."
                        rows={4}
                        className="border-2 border-slate-300 resize-none"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            )}

            <TabsContent value="goals" className="space-y-6">
              <GoalTracker playerId={playerId} playerName={player.full_name} goals={player.goals || []} />
            </TabsContent>

            <TabsContent value="documents" className="space-y-6">
              <PlayerDocuments playerId={playerId} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={showAssessmentDialog} onOpenChange={setShowAssessmentDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <div className="w-2 h-8 bg-gradient-to-b from-red-500 to-orange-500 rounded-full" />
              New Physical Assessment
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6 mt-6">
            <div className="col-span-2">
              <Label className="font-semibold text-slate-700">Date *</Label>
              <Input type="date" value={newAssessment.assessment_date} 
                onChange={(e) => setNewAssessment({...newAssessment, assessment_date: e.target.value})}
                className="border-2 h-12 mt-2" />
            </div>
            <div>
              <Label className="font-semibold text-slate-700">Sprint (seconds) *</Label>
              <Input type="number" step="0.01" value={newAssessment.sprint} 
                onChange={(e) => setNewAssessment({...newAssessment, sprint: e.target.value})} 
                placeholder="e.g., 3.5"
                className="border-2 h-12 mt-2" />
            </div>
            <div>
              <Label className="font-semibold text-slate-700">Vertical Jump (inches) *</Label>
              <Input type="number" value={newAssessment.vertical} 
                onChange={(e) => setNewAssessment({...newAssessment, vertical: e.target.value})} 
                placeholder="e.g., 15"
                className="border-2 h-12 mt-2" />
            </div>
            <div>
              <Label className="font-semibold text-slate-700">YIRT (levels) *</Label>
              <Input type="number" value={newAssessment.yirt} 
                onChange={(e) => setNewAssessment({...newAssessment, yirt: e.target.value})} 
                placeholder="e.g., 45"
                className="border-2 h-12 mt-2" />
            </div>
            <div>
              <Label className="font-semibold text-slate-700">Shuttle (seconds) *</Label>
              <Input type="number" step="0.01" value={newAssessment.shuttle} 
                onChange={(e) => setNewAssessment({...newAssessment, shuttle: e.target.value})} 
                placeholder="e.g., 4.8"
                className="border-2 h-12 mt-2" />
            </div>
            <div className="col-span-2">
              <Label className="font-semibold text-slate-700">Notes</Label>
              <Textarea value={newAssessment.notes} 
                onChange={(e) => setNewAssessment({...newAssessment, notes: e.target.value})}
                className="border-2 mt-2 resize-none"
                rows={3} />
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
            <Button variant="outline" onClick={() => setShowAssessmentDialog(false)} className="h-12 px-8">Cancel</Button>
            <Button 
              onClick={() => createAssessmentMutation.mutate({...newAssessment, team_id: player?.team_id || ''})}
              disabled={!newAssessment.sprint || !newAssessment.vertical || !newAssessment.yirt || !newAssessment.shuttle}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 h-12 px-8 text-base font-semibold shadow-lg"
            >
              Create Assessment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEvaluationDialog} onOpenChange={setShowEvaluationDialog}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <div className="w-2 h-8 bg-gradient-to-b from-emerald-500 to-blue-500 rounded-full" />
              New Comprehensive Evaluation
            </DialogTitle>
          </DialogHeader>
          <ComprehensiveEvaluationForm
            player={player}
            teams={teams}
            onSave={(data) => createEvaluationMutation.mutate(data)}
            onCancel={() => setShowEvaluationDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedAssessment} onOpenChange={() => setSelectedAssessment(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>Assessment Details</DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setSelectedAssessment(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          {selectedAssessment && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-red-50 rounded-xl">
                  <div className="text-sm text-red-600 mb-2">Sprint</div>
                  <div className="text-2xl font-bold text-red-700">{selectedAssessment.sprint?.toFixed(2)}s</div>
                  <div className="text-sm text-slate-600 mt-2">Score: {selectedAssessment.speed_score}</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="text-sm text-blue-600 mb-2">Vertical</div>
                  <div className="text-2xl font-bold text-blue-700">{selectedAssessment.vertical}"</div>
                  <div className="text-sm text-slate-600 mt-2">Score: {selectedAssessment.power_score}</div>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl">
                  <div className="text-sm text-emerald-600 mb-2">YIRT</div>
                  <div className="text-2xl font-bold text-emerald-700">{selectedAssessment.yirt}</div>
                  <div className="text-sm text-slate-600 mt-2">Score: {selectedAssessment.endurance_score}</div>
                </div>
                <div className="p-4 bg-pink-50 rounded-xl">
                  <div className="text-sm text-pink-600 mb-2">Shuttle</div>
                  <div className="text-2xl font-bold text-pink-700">{selectedAssessment.shuttle?.toFixed(2)}s</div>
                  <div className="text-sm text-slate-600 mt-2">Score: {selectedAssessment.agility_score}</div>
                </div>
              </div>
              <div className="text-center p-4 bg-slate-900 rounded-xl">
                <div className="text-sm text-white mb-1">Overall Score</div>
                <div className="text-4xl font-bold text-white">{selectedAssessment.overall_score}</div>
              </div>
              {selectedAssessment.notes && (
                <div>
                  <Label>Notes</Label>
                  <div className="text-slate-700 mt-2 p-4 bg-slate-50 rounded-xl">{selectedAssessment.notes}</div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}