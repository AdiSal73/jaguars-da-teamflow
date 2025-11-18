import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, User, Mail, Phone, Calendar, Ruler, Weight, TrendingUp, Plus, ChevronLeft, ChevronRight, X, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CircularChart from '../components/physical/CircularChart';
import PerformanceTrendChart from '../components/analytics/PerformanceTrendChart';
import RadarComparisonChart from '../components/analytics/RadarComparisonChart';
import GoalTracker from '../components/goals/GoalTracker';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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

  const [newEvaluation, setNewEvaluation] = useState({
    player_id: playerId,
    evaluation_date: new Date().toISOString().split('T')[0],
    technical_skills: 5,
    tactical_awareness: 5,
    physical_attributes: 5,
    mental_attributes: 5,
    teamwork: 5,
    overall_rating: 5,
    strengths: '',
    areas_for_improvement: '',
    notes: ''
  });

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

  const createEvaluationMutation = useMutation({
    mutationFn: (data) => base44.entities.Evaluation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['evaluations', playerId]);
      setShowEvaluationDialog(false);
    }
  });

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

  const calculateOverall = (assessment) => {
    const speed = assessment.speed_score || 0;
    const agility = assessment.agility_score || 0;
    const power = assessment.vertical_score || 0;
    const endurance = assessment.yirt_score || 0;
    
    if (agility === 0 || !agility) { // If agility score is not available, adjust the average calculation
      return Math.round(((5 * speed) + (3 * power) + (6 * endurance)) / 14); // Weighted average: Speed (x5), Power (x3), Endurance (x6)
    } else {
      return Math.round(((5 * speed) + agility + (3 * power) + (6 * endurance)) / 15); // Weighted average: Speed (x5), Agility (x1), Power (x3), Endurance (x6)
    }
  };

  // Calculate team and club averages
  const teamPlayers = allPlayers.filter(p => p.team_id === player.team_id);
  const teamPlayerIds = teamPlayers.map(p => p.id);
  const teamAssessments = allAssessments.filter(a => teamPlayerIds.includes(a.player_id));

  const calculateAverages = (assessmentList) => {
    if (assessmentList.length === 0) return { speed: 0, agility: 0, power: 0, endurance: 0 };

    const totals = assessmentList.reduce((acc, a) => ({
      speed: acc.speed + (a.speed || 0),
      agility: acc.agility + (a.agility || 0),
      power: acc.power + (a.power || 0),
      endurance: acc.endurance + (a.endurance || 0)
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
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="physical">Physical</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
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
                      <div className="grid grid-cols-4 gap-3 mb-4">
                        {[
                          { label: 'Speed', score: latestAssessment.speed_score, color: '#ef4444' },
                          { label: 'Power', score: latestAssessment.power_score, color: '#3b82f6' },
                          { label: 'Endurance', score: latestAssessment.endurance_score, color: '#10b981' },
                          { label: 'Agility', score: latestAssessment.agility_score, color: '#ec4899' }
                        ].map(({ label, score, color }) => (
                          <CircularChart key={label} value={score || 0} label={label} color={color} />
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
                              {calculateOverall(assessment)}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="text-slate-600">Speed: </span>
                              <span className="font-semibold">{assessment.linear_20m?.toFixed(2) || 'N/A'}s</span>
                            </div>
                            <div>
                              <span className="text-slate-600">Vertical: </span>
                              <span className="font-semibold">{assessment.vertical_jump?.toFixed(1) || 'N/A'}"</span>
                            </div>
                            <div>
                              <span className="text-slate-600">YIRT: </span>
                              <span className="font-semibold">{assessment.yirt || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-slate-600">5-10-5: </span>
                              <span className="font-semibold">{assessment.agility_5_10_5?.toFixed(2) || 'N/A'}s</span>
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
                          { key: 'speed', label: 'Speed' },
                          { key: 'agility', label: 'Agility' },
                          { key: 'power', label: 'Power' },
                          { key: 'endurance', label: 'Endurance' }
                        ]}
                      />
                      <div className="grid grid-cols-4 gap-4 mt-6">
                        {['speed', 'agility', 'power', 'endurance'].map(metric => {
                          const current = latestAssessment?.[metric] || 0;
                          const historical = playerHistoricalAvg[metric];
                          const change = current - historical;
                          // Handle division by zero for percentChange if historical is 0
                          const percentChange = historical !== 0 ? ((change / historical) * 100).toFixed(1) : (current !== 0 ? 'N/A' : '0.0');

                          return (
                            <div key={metric} className="p-3 bg-slate-50 rounded-xl">
                              <div className="text-xs text-slate-600 capitalize mb-1">{metric}</div>
                              <div className="text-lg font-bold text-slate-900">{current}</div>
                              {historical !== 0 && change !== 0 && (
                                <div className={`text-xs flex items-center gap-1 mt-1 ${change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {change > 0 ? '↑' : '↓'} {Math.abs(parseFloat(percentChange))}% vs avg
                                </div>
                              )}
                              {historical === 0 && current !== 0 && (
                                <div className="text-xs flex items-center gap-1 mt-1 text-emerald-600">
                                  ↑ New data (no historical avg)
                                </div>
                              )}
                              {historical === 0 && current === 0 && (
                                <div className="text-xs flex items-center gap-1 mt-1 text-slate-500">
                                  No data
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
                        playerData={latestAssessment}
                        teamAverage={teamAverage}
                        clubAverage={clubAverage}
                      />
                      <div className="grid grid-cols-3 gap-4 mt-6">
                        <div className="text-center p-4 bg-blue-50 rounded-xl">
                          <div className="text-2xl font-bold text-blue-600">
                            {Math.round((latestAssessment.speed + latestAssessment.agility + latestAssessment.power + latestAssessment.endurance) / 4)}
                          </div>
                          <div className="text-sm text-slate-600 mt-1">Player Avg</div>
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

            <TabsContent value="evaluations" className="space-y-6">
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex justify-between items-center">
                    <CardTitle>Performance Evaluations</CardTitle>
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
                    <div className="space-y-4">
                      {evaluations.map(evaluation => (
                        <div key={evaluation.id} className="p-6 bg-slate-50 rounded-xl">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <div className="font-semibold text-slate-900 mb-1">
                                {new Date(evaluation.evaluation_date).toLocaleDateString()}
                              </div>
                              <div className="text-sm text-slate-600">
                                Evaluated by: {evaluation.evaluator_name || 'Coach'}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-emerald-600">
                                {evaluation.overall_rating}/10
                              </div>
                              <div className="text-xs text-slate-500">Overall</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Technical:</span>
                              <span className="font-semibold">{evaluation.technical_skills}/10</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Tactical:</span>
                              <span className="font-semibold">{evaluation.tactical_awareness}/10</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Physical:</span>
                              <span className="font-semibold">{evaluation.physical_attributes}/10</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Mental:</span>
                              <span className="font-semibold">{evaluation.mental_attributes}/10</span>
                            </div>
                          </div>
                          {evaluation.strengths && (
                            <div className="mb-2">
                              <div className="text-sm font-medium text-slate-700 mb-1">Strengths:</div>
                              <div className="text-sm text-slate-600">{evaluation.strengths}</div>
                            </div>
                          )}
                          {evaluation.areas_for_improvement && (
                            <div>
                              <div className="text-sm font-medium text-slate-700 mb-1">Areas for Improvement:</div>
                              <div className="text-sm text-slate-600">{evaluation.areas_for_improvement}</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="goals" className="space-y-6">
              <GoalTracker playerId={playerId} playerName={player.full_name} goals={player.goals || []} />
            </TabsContent>

            <TabsContent value="documents" className="space-y-6">
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle>Player Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-slate-500 py-8">Document management coming soon</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={showAssessmentDialog} onOpenChange={setShowAssessmentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Physical Assessment</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="col-span-2">
              <Label>Date *</Label>
              <Input type="date" value={newAssessment.assessment_date} 
                onChange={(e) => setNewAssessment({...newAssessment, assessment_date: e.target.value})} />
            </div>
            <div>
              <Label>Sprint (seconds) *</Label>
              <Input type="number" step="0.01" value={newAssessment.sprint} 
                onChange={(e) => setNewAssessment({...newAssessment, sprint: e.target.value})} 
                placeholder="e.g., 3.5" />
            </div>
            <div>
              <Label>Vertical Jump (inches) *</Label>
              <Input type="number" value={newAssessment.vertical} 
                onChange={(e) => setNewAssessment({...newAssessment, vertical: e.target.value})} 
                placeholder="e.g., 15" />
            </div>
            <div>
              <Label>YIRT (levels) *</Label>
              <Input type="number" value={newAssessment.yirt} 
                onChange={(e) => setNewAssessment({...newAssessment, yirt: e.target.value})} 
                placeholder="e.g., 45" />
            </div>
            <div>
              <Label>Shuttle (seconds) *</Label>
              <Input type="number" step="0.01" value={newAssessment.shuttle} 
                onChange={(e) => setNewAssessment({...newAssessment, shuttle: e.target.value})} 
                placeholder="e.g., 4.8" />
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <Input value={newAssessment.notes} 
                onChange={(e) => setNewAssessment({...newAssessment, notes: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowAssessmentDialog(false)}>Cancel</Button>
            <Button 
              onClick={() => createAssessmentMutation.mutate({...newAssessment, team_id: player?.team_id || ''})}
              disabled={!newAssessment.sprint || !newAssessment.vertical || !newAssessment.yirt || !newAssessment.shuttle}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Create Assessment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEvaluationDialog} onOpenChange={setShowEvaluationDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Evaluation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="evaluation_date">Evaluation Date</Label>
              <Input
                id="evaluation_date"
                type="date"
                value={newEvaluation.evaluation_date}
                onChange={(e) => setNewEvaluation({...newEvaluation, evaluation_date: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {['technical_skills', 'tactical_awareness', 'physical_attributes', 'mental_attributes', 'teamwork'].map(field => (
                <div key={field}>
                  <Label htmlFor={`${field}_range`}>{field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} (1-10): {newEvaluation[field]}</Label>
                  <input
                    id={`${field}_range`}
                    type="range"
                    min="1"
                    max="10"
                    value={newEvaluation[field]}
                    onChange={(e) => setNewEvaluation({...newEvaluation, [field]: parseInt(e.target.value)})}
                    className="w-full"
                  />
                </div>
              ))}
              <div>
                <Label htmlFor="overall_rating_range">Overall Rating (1-10): {newEvaluation.overall_rating}</Label>
                <input
                  id="overall_rating_range"
                  type="range"
                  min="1"
                  max="10"
                  value={newEvaluation.overall_rating}
                  onChange={(e) => setNewEvaluation({...newEvaluation, overall_rating: parseInt(e.target.value)})}
                  className="w-full"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="evaluation_strengths">Strengths</Label>
              <Textarea
                id="evaluation_strengths"
                value={newEvaluation.strengths}
                onChange={(e) => setNewEvaluation({...newEvaluation, strengths: e.target.value})}
                placeholder="Key strengths..."
              />
            </div>
            <div>
              <Label htmlFor="evaluation_improvements">Areas for Improvement</Label>
              <Textarea
                id="evaluation_improvements"
                value={newEvaluation.areas_for_improvement}
                onChange={(e) => setNewEvaluation({...newEvaluation, areas_for_improvement: e.target.value})}
                placeholder="What to work on..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowEvaluationDialog(false)}>Cancel</Button>
            <Button onClick={() => createEvaluationMutation.mutate(newEvaluation)} className="bg-emerald-600 hover:bg-emerald-700">
              Save Evaluation
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedAssessment} onOpenChange={() => setSelectedAssessment(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>Physical Assessment Details</DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setSelectedAssessment(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          {selectedAssessment && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <div className="text-lg font-semibold">{new Date(selectedAssessment.assessment_date).toLocaleDateString()}</div>
                </div>
                <div>
                  <Label>Position</Label>
                  <div className="text-lg font-semibold">{selectedAssessment.position || 'N/A'}</div>
                </div>
                <div>
                  <Label>Age</Label>
                  <div className="text-lg font-semibold">{selectedAssessment.age || 'N/A'}</div>
                </div>
                <div>
                  <Label>Overall Score</Label>
                  <div className="text-3xl font-bold text-emerald-600">{calculateOverall(selectedAssessment)}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="p-4 bg-red-50 rounded-xl">
                  <div className="text-sm text-red-600 mb-2">20m Linear Sprint</div>
                  <div className="text-2xl font-bold text-red-700">{selectedAssessment.linear_20m?.toFixed(2) || 'N/A'} sec</div>
                  <div className="text-sm text-slate-600 mt-2">Speed Score: {selectedAssessment.speed_score || 'N/A'}</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="text-sm text-blue-600 mb-2">Vertical Jump</div>
                  <div className="text-2xl font-bold text-blue-700">{selectedAssessment.vertical_jump?.toFixed(1) || 'N/A'} in</div>
                  <div className="text-sm text-slate-600 mt-2">Vertical Score: {selectedAssessment.vertical_score || 'N/A'}</div>
                </div>
                <div className="p-4 bg-pink-50 rounded-xl">
                  <div className="text-sm text-pink-600 mb-2">YIRT Level</div>
                  <div className="text-2xl font-bold text-pink-700">{selectedAssessment.yirt || 'N/A'}</div>
                  <div className="text-sm text-slate-600 mt-2">YIRT Score: {selectedAssessment.yirt_score || 'N/A'}</div>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl">
                  <div className="text-sm text-emerald-600 mb-2">5-10-5 Agility</div>
                  <div className="text-2xl font-bold text-emerald-700">{selectedAssessment.agility_5_10_5?.toFixed(2) || 'N/A'} sec</div>
                  <div className="text-sm text-slate-600 mt-2">Agility Score: {selectedAssessment.agility_score || 'N/A'}</div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <Label>Energy Score</Label>
                <div className="text-2xl font-bold text-slate-900 mt-2">{selectedAssessment.energy_score || 'N/A'}</div>
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