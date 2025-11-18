import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, AlertTriangle, BarChart3, Download, Star } from 'lucide-react';
import { toast } from 'sonner';
import { LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Analytics() {
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [comparisonTeam, setComparisonTeam] = useState('');

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => base44.entities.PhysicalAssessment.list('-assessment_date')
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations'],
    queryFn: () => base44.entities.Evaluation.list('-evaluation_date')
  });

  // Filter data based on selected team
  const filteredPlayers = selectedTeam === 'all' ? players : players.filter(p => p.team_id === selectedTeam);
  const playerIds = filteredPlayers.map(p => p.id);
  const filteredAssessments = assessments.filter(a => playerIds.includes(a.player_id));
  const filteredEvaluations = evaluations.filter(e => playerIds.includes(e.player_id));

  // Historical trend analysis
  const getTrendData = () => {
    const monthlyData = {};
    filteredAssessments.forEach(assessment => {
      const month = new Date(assessment.assessment_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      if (!monthlyData[month]) {
        monthlyData[month] = { month, speed: [], agility: [], power: [], endurance: [] };
      }
      monthlyData[month].speed.push(assessment.speed_score || 0);
      monthlyData[month].agility.push(assessment.agility_score || 0);
      monthlyData[month].power.push(assessment.vertical_score || 0);
      monthlyData[month].endurance.push(assessment.yirt_score || 0);
    });

    return Object.values(monthlyData).map(data => ({
      month: data.month,
      speed: Math.round(data.speed.reduce((a, b) => a + b, 0) / data.speed.length),
      agility: Math.round(data.agility.reduce((a, b) => a + b, 0) / data.agility.length),
      power: Math.round(data.power.reduce((a, b) => a + b, 0) / data.power.length),
      endurance: Math.round(data.endurance.reduce((a, b) => a + b, 0) / data.endurance.length)
    })).sort((a, b) => new Date(a.month) - new Date(b.month));
  };

  // Team comparison data
  const getTeamComparisonData = () => {
    if (!comparisonTeam || selectedTeam === 'all') return [];

    const calculateTeamAvg = (teamId) => {
      const teamPlayers = players.filter(p => p.team_id === teamId);
      const teamPlayerIds = teamPlayers.map(p => p.id);
      const teamAssessments = assessments.filter(a => teamPlayerIds.includes(a.player_id));
      
      if (teamAssessments.length === 0) return null;

      return {
        speed: Math.round(teamAssessments.reduce((sum, a) => sum + (a.speed_score || 0), 0) / teamAssessments.length),
        agility: Math.round(teamAssessments.reduce((sum, a) => sum + (a.agility_score || 0), 0) / teamAssessments.length),
        power: Math.round(teamAssessments.reduce((sum, a) => sum + (a.vertical_score || 0), 0) / teamAssessments.length),
        endurance: Math.round(teamAssessments.reduce((sum, a) => sum + (a.yirt_score || 0), 0) / teamAssessments.length)
      };
    };

    const team1Avg = calculateTeamAvg(selectedTeam);
    const team2Avg = calculateTeamAvg(comparisonTeam);

    if (!team1Avg || !team2Avg) return [];

    const team1Name = teams.find(t => t.id === selectedTeam)?.name || 'Team 1';
    const team2Name = teams.find(t => t.id === comparisonTeam)?.name || 'Team 2';

    return [
      { attribute: 'Speed', [team1Name]: team1Avg.speed, [team2Name]: team2Avg.speed },
      { attribute: 'Agility', [team1Name]: team1Avg.agility, [team2Name]: team2Avg.agility },
      { attribute: 'Power', [team1Name]: team1Avg.power, [team2Name]: team2Avg.power },
      { attribute: 'Endurance', [team1Name]: team1Avg.endurance, [team2Name]: team2Avg.endurance }
    ];
  };

  // Performance distribution
  const getPerformanceDistribution = () => {
    const ranges = { 'Below 40': 0, '40-59': 0, '60-79': 0, '80-89': 0, '90+': 0 };
    
    filteredAssessments.forEach(assessment => {
      const avg = Math.round((
        (assessment.speed_score || 0) + 
        (assessment.agility_score || 0) + 
        (assessment.vertical_score || 0) + 
        (assessment.yirt_score || 0)
      ) / 4);
      
      if (avg < 40) ranges['Below 40']++;
      else if (avg < 60) ranges['40-59']++;
      else if (avg < 80) ranges['60-79']++;
      else if (avg < 90) ranges['80-89']++;
      else ranges['90+']++;
    });

    return Object.entries(ranges).map(([range, count]) => ({ range, count }));
  };

  // Injury/performance risk prediction
  const getRiskPlayers = () => {
    const riskPlayers = [];
    
    filteredPlayers.forEach(player => {
      const playerAssessments = assessments
        .filter(a => a.player_id === player.id)
        .sort((a, b) => new Date(b.assessment_date) - new Date(a.assessment_date))
        .slice(0, 3);

      if (playerAssessments.length >= 2) {
        const latest = playerAssessments[0];
        const previous = playerAssessments[1];
        
        const latestAvg = ((latest.speed_score || 0) + (latest.agility_score || 0) + (latest.vertical_score || 0) + (latest.yirt_score || 0)) / 4;
        const prevAvg = ((previous.speed_score || 0) + (previous.agility_score || 0) + (previous.vertical_score || 0) + (previous.yirt_score || 0)) / 4;
        
        const decline = prevAvg - latestAvg;
        
        if (decline > 10) {
          riskPlayers.push({
            player,
            decline: decline.toFixed(1),
            latestScore: latestAvg.toFixed(0),
            previousScore: prevAvg.toFixed(0)
          });
        }
      }
    });

    return riskPlayers.sort((a, b) => b.decline - a.decline);
  };

  // Top performers
  const getTopPerformers = () => {
    const playerScores = filteredPlayers.map(player => {
      const playerAssessments = assessments.filter(a => a.player_id === player.id);
      if (playerAssessments.length === 0) return null;

      const latestAssessment = playerAssessments.sort((a, b) => new Date(b.assessment_date) - new Date(a.assessment_date))[0];
      const avg = Math.round(((latestAssessment.speed_score || 0) + (latestAssessment.agility_score || 0) + (latestAssessment.vertical_score || 0) + (latestAssessment.yirt_score || 0)) / 4);

      return { player, score: avg };
    }).filter(Boolean);

    return playerScores.sort((a, b) => b.score - a.score).slice(0, 10);
  };

  const trendData = getTrendData();
  const comparisonData = getTeamComparisonData();
  const distributionData = getPerformanceDistribution();
  const riskPlayers = getRiskPlayers();
  const topPerformers = getTopPerformers();

  const handleExportData = () => {
    const data = {
      assessments: filteredAssessments.map(a => ({
        player: players.find(p => p.id === a.player_id)?.full_name,
        date: a.assessment_date,
        speed: a.speed_score,
        power: a.power_score,
        endurance: a.endurance_score,
        agility: a.agility_score,
        overall: a.overall_score
      })),
      evaluations: filteredEvaluations.map(e => ({
        player: players.find(p => p.id === e.player_id)?.full_name,
        date: e.evaluation_date,
        technical: e.technical_skills,
        tactical: e.tactical_awareness,
        physical: e.physical_attributes,
        mental: e.mental_attributes,
        teamwork: e.teamwork,
        overall: e.overall_rating
      }))
    };
    
    const csv = [
      ['=== PHYSICAL ASSESSMENTS ==='],
      ['Player', 'Date', 'Speed', 'Power', 'Endurance', 'Agility', 'Overall'],
      ...data.assessments.map(a => [a.player, a.date, a.speed, a.power, a.endurance, a.agility, a.overall]),
      [],
      ['=== EVALUATIONS ==='],
      ['Player', 'Date', 'Technical', 'Tactical', 'Physical', 'Mental', 'Teamwork', 'Overall'],
      ...data.evaluations.map(e => [e.player, e.date, e.technical, e.tactical, e.physical, e.mental, e.teamwork, e.overall])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_${selectedTeam === 'all' ? 'all_teams' : teams.find(t => t.id === selectedTeam)?.name}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Analytics exported!');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Performance Analytics</h1>
        <p className="text-slate-600">Comprehensive insights and trends across your teams</p>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <Select value={selectedTeam} onValueChange={setSelectedTeam}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teams</SelectItem>
            {teams.map(team => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={handleExportData} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="predictions">At Risk</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Players Analyzed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-slate-900">{filteredPlayers.length}</div>
                <p className="text-sm text-slate-600 mt-2">{filteredAssessments.length} assessments recorded</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Avg Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-slate-900">
                  {filteredAssessments.length > 0 ? Math.round(
                    filteredAssessments.reduce((sum, a) => sum + ((a.speed_score || 0) + (a.agility_score || 0) + (a.vertical_score || 0) + (a.yirt_score || 0)) / 4, 0) / filteredAssessments.length
                  ) : 0}
                </div>
                <p className="text-sm text-slate-600 mt-2">Overall score</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  At Risk
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-orange-600">{riskPlayers.length}</div>
                <p className="text-sm text-slate-600 mt-2">Players showing decline</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Performance Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={distributionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#22c55e" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topPerformers.map((item, idx) => (
                  <div key={item.player.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{item.player.full_name}</div>
                        <div className="text-xs text-slate-600">{item.player.position}</div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-emerald-600">{item.score}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessments" className="space-y-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Physical Assessment Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredAssessments.map(assessment => {
                  const player = players.find(p => p.id === assessment.player_id);
                  return (
                    <div key={assessment.id} className="p-4 bg-slate-50 rounded-xl">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-semibold text-slate-900">{player?.full_name}</div>
                          <div className="text-sm text-slate-600">{new Date(assessment.assessment_date).toLocaleDateString()}</div>
                        </div>
                        <div className="text-2xl font-bold text-emerald-600">{assessment.overall_score || 0}</div>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="text-center p-2 bg-red-50 rounded-lg">
                          <div className="text-xs text-red-600">Speed</div>
                          <div className="font-bold text-red-700">{assessment.speed_score || 0}</div>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded-lg">
                          <div className="text-xs text-blue-600">Power</div>
                          <div className="font-bold text-blue-700">{assessment.power_score || 0}</div>
                        </div>
                        <div className="text-center p-2 bg-emerald-50 rounded-lg">
                          <div className="text-xs text-emerald-600">Endurance</div>
                          <div className="font-bold text-emerald-700">{assessment.endurance_score || 0}</div>
                        </div>
                        <div className="text-center p-2 bg-pink-50 rounded-lg">
                          <div className="text-xs text-pink-600">Agility</div>
                          <div className="font-bold text-pink-700">{assessment.agility_score || 0}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluations" className="space-y-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-600" />
                Evaluation Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredEvaluations.map(evaluation => {
                  const player = players.find(p => p.id === evaluation.player_id);
                  return (
                    <div key={evaluation.id} className="p-4 bg-slate-50 rounded-xl">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-semibold text-slate-900">{player?.full_name}</div>
                          <div className="text-sm text-slate-600">{new Date(evaluation.evaluation_date).toLocaleDateString()}</div>
                          <div className="text-xs text-slate-500 mt-1">By: {evaluation.evaluator_name}</div>
                        </div>
                        <div className="text-2xl font-bold text-blue-600">{evaluation.overall_rating || 0}</div>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        <div className="text-center p-2 bg-blue-50 rounded-lg">
                          <div className="text-xs text-blue-600">Technical</div>
                          <div className="font-bold text-blue-700">{evaluation.technical_skills || 0}</div>
                        </div>
                        <div className="text-center p-2 bg-purple-50 rounded-lg">
                          <div className="text-xs text-purple-600">Tactical</div>
                          <div className="font-bold text-purple-700">{evaluation.tactical_awareness || 0}</div>
                        </div>
                        <div className="text-center p-2 bg-emerald-50 rounded-lg">
                          <div className="text-xs text-emerald-600">Physical</div>
                          <div className="font-bold text-emerald-700">{evaluation.physical_attributes || 0}</div>
                        </div>
                        <div className="text-center p-2 bg-orange-50 rounded-lg">
                          <div className="text-xs text-orange-600">Mental</div>
                          <div className="font-bold text-orange-700">{evaluation.mental_attributes || 0}</div>
                        </div>
                        <div className="text-center p-2 bg-pink-50 rounded-lg">
                          <div className="text-xs text-pink-600">Teamwork</div>
                          <div className="font-bold text-pink-700">{evaluation.teamwork || 0}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Historical Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="speed" stroke="#ef4444" strokeWidth={2} name="Speed" />
                  <Line type="monotone" dataKey="agility" stroke="#22c55e" strokeWidth={2} name="Agility" />
                  <Line type="monotone" dataKey="power" stroke="#3b82f6" strokeWidth={2} name="Power" />
                  <Line type="monotone" dataKey="endurance" stroke="#f59e0b" strokeWidth={2} name="Endurance" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          {selectedTeam !== 'all' && (
            <div className="mb-6">
              <Select value={comparisonTeam} onValueChange={setComparisonTeam}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select team to compare" />
                </SelectTrigger>
                <SelectContent>
                  {teams.filter(t => t.id !== selectedTeam).map(team => 
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {comparisonData.length > 0 ? (
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Team Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="attribute" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey={Object.keys(comparisonData[0])[1]} fill="#22c55e" radius={[8, 8, 0, 0]} />
                    <Bar dataKey={Object.keys(comparisonData[0])[2]} fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-none shadow-lg">
              <CardContent className="p-12 text-center">
                <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Select Teams to Compare</h3>
                <p className="text-slate-600">Choose a specific team and a comparison team to view insights</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Players at Risk - Performance Decline Detected
              </CardTitle>
            </CardHeader>
            <CardContent>
              {riskPlayers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-500">No players showing significant performance decline</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {riskPlayers.map(item => (
                    <div key={item.player.id} className="p-4 bg-orange-50 border-l-4 border-orange-500 rounded-xl">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-slate-900">{item.player.full_name}</div>
                          <div className="text-sm text-slate-600 mt-1">{item.player.position}</div>
                          <div className="text-sm text-orange-600 mt-2">
                            Performance declined by {item.decline} points
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-500">Latest</div>
                          <div className="text-2xl font-bold text-orange-600">{item.latestScore}</div>
                          <div className="text-xs text-slate-500 mt-1">Previous: {item.previousScore}</div>
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-slate-700">
                        <strong>Recommendation:</strong> Schedule assessment or rest period to prevent potential injury
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}