import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { Download, TrendingUp, Users, Target, Activity } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function AnalyticsDashboard() {
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedPlayer, setSelectedPlayer] = useState('all');
  const [timeRange, setTimeRange] = useState('6months');
  const [reportType, setReportType] = useState('player');

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => base44.entities.PhysicalAssessment.list()
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations'],
    queryFn: () => base44.entities.Evaluation.list()
  });

  // Filter data based on selections
  const filteredPlayers = useMemo(() => {
    if (selectedTeam === 'all') return players;
    return players.filter(p => p.team_id === selectedTeam);
  }, [players, selectedTeam]);

  // Player Progress Over Time
  const playerProgressData = useMemo(() => {
    const playerIds = selectedPlayer === 'all' 
      ? filteredPlayers.map(p => p.id) 
      : [selectedPlayer];

    const playerAssessments = assessments.filter(a => playerIds.includes(a.player_id));
    const sortedAssessments = playerAssessments.sort((a, b) => 
      new Date(a.assessment_date) - new Date(b.assessment_date)
    );

    return sortedAssessments.map(a => ({
      date: new Date(a.assessment_date).toLocaleDateString(),
      speed: a.speed_score || 0,
      power: a.power_score || 0,
      endurance: a.endurance_score || 0,
      agility: a.agility_score || 0,
      overall: a.overall_score || 0,
      player: players.find(p => p.id === a.player_id)?.full_name || 'Unknown'
    }));
  }, [assessments, players, selectedPlayer, filteredPlayers]);

  // Evaluation Progress Over Time
  const evaluationProgressData = useMemo(() => {
    const playerIds = selectedPlayer === 'all' 
      ? filteredPlayers.map(p => p.id) 
      : [selectedPlayer];

    const playerEvals = evaluations.filter(e => playerIds.includes(e.player_id));
    const sortedEvals = playerEvals.sort((a, b) => 
      new Date(a.created_date) - new Date(b.created_date)
    );

    return sortedEvals.map(e => ({
      date: new Date(e.created_date).toLocaleDateString(),
      overall: e.overall_score || 0,
      mental: ((e.growth_mindset || 0) + (e.resilience || 0) + (e.team_focus || 0)) / 3,
      defending: ((e.defending_organized || 0) + (e.defending_final_third || 0) + (e.defending_transition || 0)) / 3,
      attacking: ((e.attacking_organized || 0) + (e.attacking_final_third || 0) + (e.attacking_in_transition || 0)) / 3,
      player: players.find(p => p.id === e.player_id)?.full_name || 'Unknown'
    }));
  }, [evaluations, players, selectedPlayer, filteredPlayers]);

  // Team Comparison Data
  const teamComparisonData = useMemo(() => {
    return teams.map(team => {
      const teamPlayers = players.filter(p => p.team_id === team.id);
      const teamAssessments = assessments.filter(a => 
        teamPlayers.some(p => p.id === a.player_id)
      );

      const avgSpeed = teamAssessments.reduce((sum, a) => sum + (a.speed_score || 0), 0) / (teamAssessments.length || 1);
      const avgPower = teamAssessments.reduce((sum, a) => sum + (a.power_score || 0), 0) / (teamAssessments.length || 1);
      const avgEndurance = teamAssessments.reduce((sum, a) => sum + (a.endurance_score || 0), 0) / (teamAssessments.length || 1);
      const avgAgility = teamAssessments.reduce((sum, a) => sum + (a.agility_score || 0), 0) / (teamAssessments.length || 1);
      const avgOverall = teamAssessments.reduce((sum, a) => sum + (a.overall_score || 0), 0) / (teamAssessments.length || 1);

      return {
        name: team.name,
        speed: Math.round(avgSpeed),
        power: Math.round(avgPower),
        endurance: Math.round(avgEndurance),
        agility: Math.round(avgAgility),
        overall: Math.round(avgOverall),
        playerCount: teamPlayers.length
      };
    }).filter(t => t.playerCount > 0);
  }, [teams, players, assessments]);

  // Player Benchmark Comparison
  const playerBenchmarkData = useMemo(() => {
    if (selectedPlayer === 'all') return [];

    const player = players.find(p => p.id === selectedPlayer);
    if (!player) return [];

    const playerAssessments = assessments.filter(a => a.player_id === selectedPlayer);
    const latestAssessment = playerAssessments.sort((a, b) => 
      new Date(b.assessment_date) - new Date(a.assessment_date)
    )[0];

    if (!latestAssessment) return [];

    // Calculate team average
    const teamPlayers = players.filter(p => p.team_id === player.team_id);
    const teamAssessments = assessments.filter(a => 
      teamPlayers.some(p => p.id === a.player_id)
    );

    const teamAvgSpeed = teamAssessments.reduce((sum, a) => sum + (a.speed_score || 0), 0) / (teamAssessments.length || 1);
    const teamAvgPower = teamAssessments.reduce((sum, a) => sum + (a.power_score || 0), 0) / (teamAssessments.length || 1);
    const teamAvgEndurance = teamAssessments.reduce((sum, a) => sum + (a.endurance_score || 0), 0) / (teamAssessments.length || 1);
    const teamAvgAgility = teamAssessments.reduce((sum, a) => sum + (a.agility_score || 0), 0) / (teamAssessments.length || 1);

    return [
      { attribute: 'Speed', player: latestAssessment.speed_score || 0, teamAvg: Math.round(teamAvgSpeed) },
      { attribute: 'Power', player: latestAssessment.power_score || 0, teamAvg: Math.round(teamAvgPower) },
      { attribute: 'Endurance', player: latestAssessment.endurance_score || 0, teamAvg: Math.round(teamAvgEndurance) },
      { attribute: 'Agility', player: latestAssessment.agility_score || 0, teamAvg: Math.round(teamAvgAgility) }
    ];
  }, [selectedPlayer, players, assessments]);

  const exportToPDF = async () => {
    try {
      const dashboardElement = document.getElementById('analytics-dashboard');
      const canvas = await html2canvas(dashboardElement, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`analytics-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF report exported successfully');
    } catch (error) {
      toast.error('Failed to export PDF');
      console.error(error);
    }
  };

  const exportToCSV = () => {
    try {
      let csvContent = '';
      
      if (reportType === 'player' && playerProgressData.length > 0) {
        csvContent = 'Date,Player,Speed,Power,Endurance,Agility,Overall\n';
        playerProgressData.forEach(row => {
          csvContent += `${row.date},${row.player},${row.speed},${row.power},${row.endurance},${row.agility},${row.overall}\n`;
        });
      } else if (reportType === 'team' && teamComparisonData.length > 0) {
        csvContent = 'Team,Speed,Power,Endurance,Agility,Overall,Player Count\n';
        teamComparisonData.forEach(row => {
          csvContent += `${row.name},${row.speed},${row.power},${row.endurance},${row.agility},${row.overall},${row.playerCount}\n`;
        });
      }

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('CSV report exported successfully');
    } catch (error) {
      toast.error('Failed to export CSV');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-[1800px] mx-auto" id="analytics-dashboard">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Analytics Dashboard</h1>
          <p className="text-slate-600">Comprehensive player and team performance analytics</p>
        </div>

        {/* Filters */}
        <Card className="mb-6 border-none shadow-lg">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Team</label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Player</label>
                <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select player" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Players</SelectItem>
                    {filteredPlayers.map(player => (
                      <SelectItem key={player.id} value={player.id}>{player.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Report Type</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="player">Player Progress</SelectItem>
                    <SelectItem value="team">Team Comparison</SelectItem>
                    <SelectItem value="evaluation">Evaluations</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end gap-2">
                <Button onClick={exportToPDF} variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button onClick={exportToCSV} variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card className="border-none shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-90">Total Players</div>
                  <div className="text-3xl font-bold">{filteredPlayers.length}</div>
                </div>
                <Users className="w-12 h-12 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-90">Total Assessments</div>
                  <div className="text-3xl font-bold">{assessments.length}</div>
                </div>
                <Activity className="w-12 h-12 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-90">Total Evaluations</div>
                  <div className="text-3xl font-bold">{evaluations.length}</div>
                </div>
                <Target className="w-12 h-12 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-90">Avg Overall Score</div>
                  <div className="text-3xl font-bold">
                    {Math.round(assessments.reduce((sum, a) => sum + (a.overall_score || 0), 0) / (assessments.length || 1))}
                  </div>
                </div>
                <TrendingUp className="w-12 h-12 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Analytics */}
        <Tabs defaultValue="progress" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl">
            <TabsTrigger value="progress">Progress Over Time</TabsTrigger>
            <TabsTrigger value="comparison">Comparative Analytics</TabsTrigger>
            <TabsTrigger value="team">Team Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="space-y-6">
            {/* Physical Progress */}
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-cyan-50">
                <CardTitle>Physical Assessment Progress</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {playerProgressData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={playerProgressData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="speed" stroke="#ef4444" strokeWidth={2} name="Speed" />
                      <Line type="monotone" dataKey="power" stroke="#3b82f6" strokeWidth={2} name="Power" />
                      <Line type="monotone" dataKey="endurance" stroke="#10b981" strokeWidth={2} name="Endurance" />
                      <Line type="monotone" dataKey="agility" stroke="#ec4899" strokeWidth={2} name="Agility" />
                      <Line type="monotone" dataKey="overall" stroke="#6366f1" strokeWidth={3} name="Overall" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-slate-500">No assessment data available</div>
                )}
              </CardContent>
            </Card>

            {/* Evaluation Progress */}
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle>Evaluation Progress</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {evaluationProgressData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={evaluationProgressData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} domain={[0, 10]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="mental" stroke="#a855f7" strokeWidth={2} name="Mental" />
                      <Line type="monotone" dataKey="defending" stroke="#ef4444" strokeWidth={2} name="Defending" />
                      <Line type="monotone" dataKey="attacking" stroke="#3b82f6" strokeWidth={2} name="Attacking" />
                      <Line type="monotone" dataKey="overall" stroke="#10b981" strokeWidth={3} name="Overall" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-slate-500">No evaluation data available</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6">
            {/* Player vs Team Benchmark */}
            {selectedPlayer !== 'all' && playerBenchmarkData.length > 0 && (
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-teal-50">
                  <CardTitle>Player vs Team Average</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={playerBenchmarkData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="attribute" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="player" fill="#6366f1" name="Player Score" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="teamAvg" fill="#94a3b8" name="Team Average" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Position Comparison */}
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-orange-50 to-red-50">
                <CardTitle>Performance by Position</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="speed" name="Speed" tick={{ fontSize: 12 }} domain={[0, 100]} />
                    <YAxis dataKey="power" name="Power" tick={{ fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Legend />
                    <Scatter 
                      name="Players" 
                      data={assessments.map(a => ({
                        speed: a.speed_score || 0,
                        power: a.power_score || 0
                      }))} 
                      fill="#6366f1" 
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            {/* Team Comparison */}
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
                <CardTitle>Team Physical Comparison</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {teamComparisonData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={teamComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={100} />
                      <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="speed" fill="#ef4444" name="Speed" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="power" fill="#3b82f6" name="Power" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="endurance" fill="#10b981" name="Endurance" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="agility" fill="#ec4899" name="Agility" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-slate-500">No team data available</div>
                )}
              </CardContent>
            </Card>

            {/* Team Size & Performance */}
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle>Team Size vs Overall Performance</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {teamComparisonData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="playerCount" name="Player Count" tick={{ fontSize: 12 }} />
                      <YAxis dataKey="overall" name="Overall Score" tick={{ fontSize: 12 }} domain={[0, 100]} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Legend />
                      <Scatter name="Teams" data={teamComparisonData} fill="#10b981" />
                    </ScatterChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-slate-500">No team data available</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}