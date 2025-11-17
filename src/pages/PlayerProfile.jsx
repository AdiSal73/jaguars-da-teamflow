
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Calendar, Ruler, Weight, TrendingUp, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CircularChart from '../components/physical/CircularChart';
import PerformanceTrendChart from '../components/analytics/PerformanceTrendChart';
import RadarComparisonChart from '../components/analytics/RadarComparisonChart';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  
  const [newAssessment, setNewAssessment] = useState({
    player_id: playerId,
    assessment_date: new Date().toISOString().split('T')[0],
    speed: 50,
    agility: 50,
    power: 50,
    endurance: 50,
    sprint_time: '',
    vertical_jump: '',
    cooper_test: '',
    assessor: '',
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

  const createAssessmentMutation = useMutation({
    mutationFn: (data) => base44.entities.PhysicalAssessment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['assessments', playerId]);
      queryClient.invalidateQueries(['allAssessments']);
      setShowAssessmentDialog(false);
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

  const team = teams.find(t => t.id === player.team_id);
  const latestAssessment = assessments[0];

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

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="physical">Physical Profile</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
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
                    <div className="flex flex-col items-center">
                      <CircularChart
                        speed={latestAssessment.speed || 0}
                        agility={latestAssessment.agility || 0}
                        power={latestAssessment.power || 0}
                        endurance={latestAssessment.endurance || 0}
                      />
                      <div className="mt-8 grid grid-cols-4 gap-6 w-full">
                        <div className="text-center">
                          <div className="text-sm text-slate-600 mb-1">Speed</div>
                          <div className="text-2xl font-bold text-red-500">{latestAssessment.speed}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-slate-600 mb-1">Agility</div>
                          <div className="text-2xl font-bold text-emerald-500">{latestAssessment.agility}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-slate-600 mb-1">Power</div>
                          <div className="text-2xl font-bold text-blue-500">{latestAssessment.power}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-slate-600 mb-1">Endurance</div>
                          <div className="text-2xl font-bold text-pink-500">{latestAssessment.endurance}</div>
                        </div>
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
                        <div key={assessment.id} className="p-4 bg-slate-50 rounded-xl">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-slate-900">
                              {new Date(assessment.assessment_date).toLocaleDateString()}
                            </span>
                            <span className="text-sm text-slate-600">
                              Avg: {Math.round((assessment.speed + assessment.agility + assessment.power + assessment.endurance) / 4)}
                            </span>
                          </div>
                          {assessment.notes && (
                            <p className="text-sm text-slate-600">{assessment.notes}</p>
                          )}
                        </div>
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
                    <PerformanceTrendChart
                      data={assessments.slice().reverse()} // Reverse to show chronologically on chart
                      metrics={[
                        { key: 'speed', label: 'Speed' },
                        { key: 'agility', label: 'Agility' },
                        { key: 'power', label: 'Power' },
                        { key: 'endurance', label: 'Endurance' }
                      ]}
                    />
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
                      data={evaluations.slice().reverse()} // Reverse to show chronologically on chart
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
          </Tabs>
        </div>
      </div>

      <Dialog open={showAssessmentDialog} onOpenChange={setShowAssessmentDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Physical Assessment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="assessment_date">Assessment Date</Label>
              <Input
                id="assessment_date"
                type="date"
                value={newAssessment.assessment_date}
                onChange={(e) => setNewAssessment({...newAssessment, assessment_date: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="speed_range">Speed (0-100): {newAssessment.speed}</Label>
                <input
                  id="speed_range"
                  type="range"
                  min="0"
                  max="100"
                  value={newAssessment.speed}
                  onChange={(e) => setNewAssessment({...newAssessment, speed: parseInt(e.target.value)})}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="agility_range">Agility (0-100): {newAssessment.agility}</Label>
                <input
                  id="agility_range"
                  type="range"
                  min="0"
                  max="100"
                  value={newAssessment.agility}
                  onChange={(e) => setNewAssessment({...newAssessment, agility: parseInt(e.target.value)})}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="power_range">Power (0-100): {newAssessment.power}</Label>
                <input
                  id="power_range"
                  type="range"
                  min="0"
                  max="100"
                  value={newAssessment.power}
                  onChange={(e) => setNewAssessment({...newAssessment, power: parseInt(e.target.value)})}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="endurance_range">Endurance (0-100): {newAssessment.endurance}</Label>
                <input
                  id="endurance_range"
                  type="range"
                  min="0"
                  max="100"
                  value={newAssessment.endurance}
                  onChange={(e) => setNewAssessment({...newAssessment, endurance: parseInt(e.target.value)})}
                  className="w-full"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="assessment_notes">Notes</Label>
              <Textarea
                id="assessment_notes"
                value={newAssessment.notes}
                onChange={(e) => setNewAssessment({...newAssessment, notes: e.target.value})}
                placeholder="Additional notes..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowAssessmentDialog(false)}>Cancel</Button>
            <Button onClick={() => createAssessmentMutation.mutate(newAssessment)} className="bg-emerald-600 hover:bg-emerald-700">
              Save Assessment
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
    </div>
  );
}
