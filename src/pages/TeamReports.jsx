import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FileDown, Share2, BarChart3, Users, TrendingUp, Activity, Printer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, LineChart, Line } from 'recharts';
import { generateCSV, downloadFile, generatePDFContent, printPDF } from '../components/export/ExportDialog';

export default function TeamReports() {
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [compareTeamId, setCompareTeamId] = useState('');
  const [reportSections, setReportSections] = useState({
    overview: true,
    roster: true,
    assessments: true,
    evaluations: true,
    tryouts: true,
    comparison: false
  });

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

  const { data: tryouts = [] } = useQuery({
    queryKey: ['tryouts'],
    queryFn: () => base44.entities.PlayerTryout.list()
  });

  const selectedTeam = teams.find(t => t.id === selectedTeamId);
  const compareTeam = teams.find(t => t.id === compareTeamId);

  const teamPlayers = players.filter(p => p.team_id === selectedTeamId);
  const teamPlayerIds = teamPlayers.map(p => p.id);
  
  const teamAssessments = assessments.filter(a => teamPlayerIds.includes(a.player_id));
  const teamEvaluations = evaluations.filter(e => teamPlayerIds.includes(e.player_id));
  const teamTryouts = tryouts.filter(t => teamPlayerIds.includes(t.player_id));

  // Calculate team statistics
  const teamStats = useMemo(() => {
    if (!selectedTeamId) return null;

    const latestAssessments = {};
    teamAssessments.forEach(a => {
      if (!latestAssessments[a.player_id] || new Date(a.assessment_date) > new Date(latestAssessments[a.player_id].assessment_date)) {
        latestAssessments[a.player_id] = a;
      }
    });

    const latestEvals = {};
    teamEvaluations.forEach(e => {
      if (!latestEvals[e.player_id] || new Date(e.created_date) > new Date(latestEvals[e.player_id].created_date)) {
        latestEvals[e.player_id] = e;
      }
    });

    const assessmentList = Object.values(latestAssessments);
    const evalList = Object.values(latestEvals);

    const avg = (list, key) => list.length > 0 ? Math.round(list.reduce((sum, item) => sum + (item[key] || 0), 0) / list.length * 10) / 10 : 0;

    return {
      playerCount: teamPlayers.length,
      assessedCount: assessmentList.length,
      evaluatedCount: evalList.length,
      avgSpeed: avg(assessmentList, 'speed_score'),
      avgPower: avg(assessmentList, 'power_score'),
      avgEndurance: avg(assessmentList, 'endurance_score'),
      avgAgility: avg(assessmentList, 'agility_score'),
      avgOverall: avg(assessmentList, 'overall_score'),
      avgGrowthMindset: avg(evalList, 'growth_mindset'),
      avgResilience: avg(evalList, 'resilience'),
      avgAthleticism: avg(evalList, 'athleticism'),
      avgTeamFocus: avg(evalList, 'team_focus'),
      avgDefending: Math.round((avg(evalList, 'defending_organized') + avg(evalList, 'defending_final_third') + avg(evalList, 'defending_transition')) / 3 * 10) / 10,
      avgAttacking: Math.round((avg(evalList, 'attacking_organized') + avg(evalList, 'attacking_final_third') + avg(evalList, 'attacking_in_transition')) / 3 * 10) / 10,
      tryoutBreakdown: {
        moveUp: teamTryouts.filter(t => t.recommendation === 'Move up').length,
        keep: teamTryouts.filter(t => t.recommendation === 'Keep').length,
        moveDown: teamTryouts.filter(t => t.recommendation === 'Move down').length
      },
      positionBreakdown: teamPlayers.reduce((acc, p) => {
        const pos = p.primary_position || 'Unassigned';
        acc[pos] = (acc[pos] || 0) + 1;
        return acc;
      }, {})
    };
  }, [selectedTeamId, teamPlayers, teamAssessments, teamEvaluations, teamTryouts]);

  // Comparison data
  const comparisonData = useMemo(() => {
    if (!compareTeamId || !teamStats) return null;

    const comparePlayers = players.filter(p => p.team_id === compareTeamId);
    const comparePlayerIds = comparePlayers.map(p => p.id);
    const compareAssessments = assessments.filter(a => comparePlayerIds.includes(a.player_id));
    const compareEvaluations = evaluations.filter(e => comparePlayerIds.includes(e.player_id));

    const latestAssessments = {};
    compareAssessments.forEach(a => {
      if (!latestAssessments[a.player_id] || new Date(a.assessment_date) > new Date(latestAssessments[a.player_id].assessment_date)) {
        latestAssessments[a.player_id] = a;
      }
    });

    const latestEvals = {};
    compareEvaluations.forEach(e => {
      if (!latestEvals[e.player_id] || new Date(e.created_date) > new Date(latestEvals[e.player_id].created_date)) {
        latestEvals[e.player_id] = e;
      }
    });

    const assessmentList = Object.values(latestAssessments);
    const evalList = Object.values(latestEvals);

    const avg = (list, key) => list.length > 0 ? Math.round(list.reduce((sum, item) => sum + (item[key] || 0), 0) / list.length * 10) / 10 : 0;

    return {
      playerCount: comparePlayers.length,
      avgSpeed: avg(assessmentList, 'speed_score'),
      avgPower: avg(assessmentList, 'power_score'),
      avgEndurance: avg(assessmentList, 'endurance_score'),
      avgAgility: avg(assessmentList, 'agility_score'),
      avgOverall: avg(assessmentList, 'overall_score'),
      avgDefending: Math.round((avg(evalList, 'defending_organized') + avg(evalList, 'defending_final_third') + avg(evalList, 'defending_transition')) / 3 * 10) / 10,
      avgAttacking: Math.round((avg(evalList, 'attacking_organized') + avg(evalList, 'attacking_final_third') + avg(evalList, 'attacking_in_transition')) / 3 * 10) / 10
    };
  }, [compareTeamId, players, assessments, evaluations]);

  const radarData = teamStats && comparisonData ? [
    { attribute: 'Speed', team1: teamStats.avgSpeed, team2: comparisonData.avgSpeed },
    { attribute: 'Power', team1: teamStats.avgPower, team2: comparisonData.avgPower },
    { attribute: 'Endurance', team1: teamStats.avgEndurance, team2: comparisonData.avgEndurance },
    { attribute: 'Agility', team1: teamStats.avgAgility, team2: comparisonData.avgAgility }
  ] : teamStats ? [
    { attribute: 'Speed', team1: teamStats.avgSpeed },
    { attribute: 'Power', team1: teamStats.avgPower },
    { attribute: 'Endurance', team1: teamStats.avgEndurance },
    { attribute: 'Agility', team1: teamStats.avgAgility }
  ] : [];

  const handleExportCSV = () => {
    if (!teamStats || !selectedTeam) return;

    const headers = ['Category', 'Metric', 'Value'];
    const rows = [
      ['Team', 'Name', selectedTeam.name],
      ['Team', 'Age Group', selectedTeam.age_group || ''],
      ['Team', 'Gender', selectedTeam.gender || ''],
      ['Team', 'Total Players', teamStats.playerCount],
      ['Team', 'Assessed Players', teamStats.assessedCount],
      ['Team', 'Evaluated Players', teamStats.evaluatedCount],
      ['Physical', 'Avg Speed', teamStats.avgSpeed],
      ['Physical', 'Avg Power', teamStats.avgPower],
      ['Physical', 'Avg Endurance', teamStats.avgEndurance],
      ['Physical', 'Avg Agility', teamStats.avgAgility],
      ['Physical', 'Avg Overall', teamStats.avgOverall],
      ['Mental', 'Growth Mindset', teamStats.avgGrowthMindset],
      ['Mental', 'Resilience', teamStats.avgResilience],
      ['Mental', 'Athleticism', teamStats.avgAthleticism],
      ['Mental', 'Team Focus', teamStats.avgTeamFocus],
      ['Technical', 'Avg Defending', teamStats.avgDefending],
      ['Technical', 'Avg Attacking', teamStats.avgAttacking],
      ['Tryouts', 'Move Up', teamStats.tryoutBreakdown.moveUp],
      ['Tryouts', 'Keep', teamStats.tryoutBreakdown.keep],
      ['Tryouts', 'Move Down', teamStats.tryoutBreakdown.moveDown]
    ];

    // Add player data
    rows.push(['', '', '']);
    rows.push(['Player Roster', '', '']);
    teamPlayers.forEach(player => {
      const tryout = teamTryouts.find(t => t.player_id === player.id);
      rows.push(['Player', player.full_name, player.primary_position || 'N/A']);
      if (tryout) {
        rows.push(['', 'Team Role', tryout.team_role || 'N/A']);
        rows.push(['', 'Recommendation', tryout.recommendation || 'N/A']);
      }
    });

    const csv = generateCSV(headers, rows);
    downloadFile(csv, `${selectedTeam.name}_report.csv`);
  };

  const handleExportPDF = () => {
    if (!teamStats || !selectedTeam) return;

    const sections = [
      {
        title: 'Team Overview',
        content: `
          <table>
            <tr><th>Team Name</th><td>${selectedTeam.name}</td></tr>
            <tr><th>Age Group</th><td>${selectedTeam.age_group || 'N/A'}</td></tr>
            <tr><th>Gender</th><td>${selectedTeam.gender || 'N/A'}</td></tr>
            <tr><th>Total Players</th><td>${teamStats.playerCount}</td></tr>
            <tr><th>Players Assessed</th><td>${teamStats.assessedCount}</td></tr>
            <tr><th>Players Evaluated</th><td>${teamStats.evaluatedCount}</td></tr>
          </table>
        `
      },
      {
        title: 'Physical Performance Averages',
        content: `
          <table>
            <tr><th>Metric</th><th>Score</th></tr>
            <tr><td>Speed</td><td>${teamStats.avgSpeed}</td></tr>
            <tr><td>Power</td><td>${teamStats.avgPower}</td></tr>
            <tr><td>Endurance</td><td>${teamStats.avgEndurance}</td></tr>
            <tr><td>Agility</td><td>${teamStats.avgAgility}</td></tr>
            <tr><td><strong>Overall</strong></td><td><strong>${teamStats.avgOverall}</strong></td></tr>
          </table>
        `
      },
      {
        title: 'Mental & Technical Averages',
        content: `
          <table>
            <tr><th>Attribute</th><th>Score</th></tr>
            <tr><td>Growth Mindset</td><td>${teamStats.avgGrowthMindset}/10</td></tr>
            <tr><td>Resilience</td><td>${teamStats.avgResilience}/10</td></tr>
            <tr><td>Athleticism</td><td>${teamStats.avgAthleticism}/10</td></tr>
            <tr><td>Team Focus</td><td>${teamStats.avgTeamFocus}/10</td></tr>
            <tr><td>Defending</td><td>${teamStats.avgDefending}/10</td></tr>
            <tr><td>Attacking</td><td>${teamStats.avgAttacking}/10</td></tr>
          </table>
        `
      },
      {
        title: 'Tryout Recommendations',
        content: `
          <table>
            <tr><th>Recommendation</th><th>Count</th></tr>
            <tr><td>Move Up</td><td>${teamStats.tryoutBreakdown.moveUp}</td></tr>
            <tr><td>Keep</td><td>${teamStats.tryoutBreakdown.keep}</td></tr>
            <tr><td>Move Down</td><td>${teamStats.tryoutBreakdown.moveDown}</td></tr>
          </table>
        `
      },
      {
        title: 'Player Roster',
        content: `
          <table>
            <tr><th>Player</th><th>Position</th><th>Role</th><th>Recommendation</th></tr>
            ${teamPlayers.map(p => {
              const tryout = teamTryouts.find(t => t.player_id === p.id);
              return `<tr><td>${p.full_name}</td><td>${p.primary_position || 'N/A'}</td><td>${tryout?.team_role || 'N/A'}</td><td>${tryout?.recommendation || 'N/A'}</td></tr>`;
            }).join('')}
          </table>
        `
      }
    ];

    const html = generatePDFContent(`Team Report: ${selectedTeam.name}`, sections);
    printPDF(html);
  };

  const handleShare = async () => {
    if (!selectedTeam) return;
    
    const shareData = {
      title: `Team Report: ${selectedTeam.name}`,
      text: `Check out the team report for ${selectedTeam.name}`,
      url: window.location.href
    };

    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-[1800px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Team Reports</h1>
        <p className="text-slate-600">Generate customizable reports with team statistics and comparisons</p>
      </div>

      {/* Team Selection */}
      <Card className="border-none shadow-lg mb-6">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label className="mb-2 block font-semibold">Select Team *</Label>
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.filter(team => team.name && typeof team.name === 'string').map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name} ({team.age_group})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block font-semibold">Compare With (Optional)</Label>
              <Select value={compareTeamId} onValueChange={setCompareTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select comparison team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {teams.filter(t => t.id !== selectedTeamId && t.name && typeof t.name === 'string').map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name} ({team.age_group})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleExportCSV} disabled={!selectedTeamId} variant="outline">
                <FileDown className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button onClick={handleExportPDF} disabled={!selectedTeamId} variant="outline">
                <Printer className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button onClick={handleShare} disabled={!selectedTeamId} variant="outline">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedTeamId && teamStats && (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-50 to-white">
              <CardContent className="p-4 text-center">
                <Users className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-slate-900">{teamStats.playerCount}</div>
                <div className="text-xs text-slate-600">Total Players</div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-white">
              <CardContent className="p-4 text-center">
                <Activity className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-slate-900">{teamStats.assessedCount}</div>
                <div className="text-xs text-slate-600">Assessed</div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-white">
              <CardContent className="p-4 text-center">
                <BarChart3 className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-slate-900">{teamStats.evaluatedCount}</div>
                <div className="text-xs text-slate-600">Evaluated</div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg bg-gradient-to-br from-orange-50 to-white">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-slate-900">{teamStats.avgOverall}</div>
                <div className="text-xs text-slate-600">Avg Overall</div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg bg-gradient-to-br from-red-50 to-white">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-slate-900">{teamStats.avgDefending}/10</div>
                <div className="text-xs text-slate-600">Avg Defending</div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-white">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-slate-900">{teamStats.avgAttacking}/10</div>
                <div className="text-xs text-slate-600">Avg Attacking</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="roster">Roster</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="comparison">Comparison</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-none shadow-lg">
                  <CardHeader>
                    <CardTitle>Physical Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="attribute" tick={{ fontSize: 12 }} />
                        <PolarRadiusAxis domain={[0, 100]} />
                        <Radar name={selectedTeam?.name} dataKey="team1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                        {comparisonData && (
                          <Radar name={compareTeam?.name} dataKey="team2" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                        )}
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-lg">
                  <CardHeader>
                    <CardTitle>Tryout Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={[
                        { name: 'Move Up', count: teamStats.tryoutBreakdown.moveUp, fill: '#10b981' },
                        { name: 'Keep', count: teamStats.tryoutBreakdown.keep, fill: '#3b82f6' },
                        { name: 'Move Down', count: teamStats.tryoutBreakdown.moveDown, fill: '#f59e0b' }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-lg md:col-span-2">
                  <CardHeader>
                    <CardTitle>Position Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(teamStats.positionBreakdown).map(([pos, count]) => (
                        <Badge key={pos} className="px-3 py-2 text-sm bg-slate-100 text-slate-800">
                          {pos}: {count}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="roster">
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle>Team Roster</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Player</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Position</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Team Role</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Recommendation</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold">Overall Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamPlayers.map(player => {
                          const tryout = teamTryouts.find(t => t.player_id === player.id);
                          const assessment = teamAssessments.find(a => a.player_id === player.id);
                          return (
                            <tr key={player.id} className="border-b hover:bg-slate-50">
                              <td className="px-4 py-3 font-medium">{player.full_name}</td>
                              <td className="px-4 py-3">{player.primary_position || 'N/A'}</td>
                              <td className="px-4 py-3">
                                {tryout?.team_role && (
                                  <Badge className="bg-purple-100 text-purple-800">{tryout.team_role}</Badge>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {tryout?.recommendation && (
                                  <Badge className={`${
                                    tryout.recommendation === 'Move up' ? 'bg-emerald-100 text-emerald-800' :
                                    tryout.recommendation === 'Move down' ? 'bg-orange-100 text-orange-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {tryout.recommendation}
                                  </Badge>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center font-bold">
                                {assessment?.overall_score || '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-none shadow-lg">
                  <CardHeader>
                    <CardTitle>Physical Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { label: 'Speed', value: teamStats.avgSpeed, color: '#ef4444' },
                        { label: 'Power', value: teamStats.avgPower, color: '#3b82f6' },
                        { label: 'Endurance', value: teamStats.avgEndurance, color: '#10b981' },
                        { label: 'Agility', value: teamStats.avgAgility, color: '#ec4899' },
                        { label: 'Overall', value: teamStats.avgOverall, color: '#8b5cf6' }
                      ].map(metric => (
                        <div key={metric.label} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{metric.label}</span>
                            <span className="font-bold">{metric.value}</span>
                          </div>
                          <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all"
                              style={{ width: `${metric.value}%`, backgroundColor: metric.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-lg">
                  <CardHeader>
                    <CardTitle>Mental & Technical Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { label: 'Growth Mindset', value: teamStats.avgGrowthMindset },
                        { label: 'Resilience', value: teamStats.avgResilience },
                        { label: 'Athleticism', value: teamStats.avgAthleticism },
                        { label: 'Team Focus', value: teamStats.avgTeamFocus },
                        { label: 'Defending', value: teamStats.avgDefending },
                        { label: 'Attacking', value: teamStats.avgAttacking }
                      ].map(metric => (
                        <div key={metric.label} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{metric.label}</span>
                            <span className="font-bold">{metric.value}/10</span>
                          </div>
                          <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-emerald-500 transition-all"
                              style={{ width: `${metric.value * 10}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="comparison">
              {compareTeamId && comparisonData ? (
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="border-none shadow-lg">
                    <CardHeader>
                      <CardTitle>Team Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={350}>
                        <RadarChart data={radarData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="attribute" />
                          <PolarRadiusAxis domain={[0, 100]} />
                          <Radar name={selectedTeam?.name} dataKey="team1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} strokeWidth={2} />
                          <Radar name={compareTeam?.name} dataKey="team2" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} strokeWidth={2} />
                          <Legend />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-lg">
                    <CardHeader>
                      <CardTitle>Side by Side</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-100">
                            <tr>
                              <th className="px-3 py-2 text-left">Metric</th>
                              <th className="px-3 py-2 text-center">{selectedTeam?.name}</th>
                              <th className="px-3 py-2 text-center">{compareTeam?.name}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b"><td className="px-3 py-2">Players</td><td className="px-3 py-2 text-center font-bold">{teamStats.playerCount}</td><td className="px-3 py-2 text-center font-bold">{comparisonData.playerCount}</td></tr>
                            <tr className="border-b"><td className="px-3 py-2">Avg Speed</td><td className="px-3 py-2 text-center font-bold text-red-600">{teamStats.avgSpeed}</td><td className="px-3 py-2 text-center font-bold text-red-600">{comparisonData.avgSpeed}</td></tr>
                            <tr className="border-b"><td className="px-3 py-2">Avg Power</td><td className="px-3 py-2 text-center font-bold text-blue-600">{teamStats.avgPower}</td><td className="px-3 py-2 text-center font-bold text-blue-600">{comparisonData.avgPower}</td></tr>
                            <tr className="border-b"><td className="px-3 py-2">Avg Endurance</td><td className="px-3 py-2 text-center font-bold text-emerald-600">{teamStats.avgEndurance}</td><td className="px-3 py-2 text-center font-bold text-emerald-600">{comparisonData.avgEndurance}</td></tr>
                            <tr className="border-b"><td className="px-3 py-2">Avg Agility</td><td className="px-3 py-2 text-center font-bold text-pink-600">{teamStats.avgAgility}</td><td className="px-3 py-2 text-center font-bold text-pink-600">{comparisonData.avgAgility}</td></tr>
                            <tr className="border-b"><td className="px-3 py-2">Avg Overall</td><td className="px-3 py-2 text-center font-bold">{teamStats.avgOverall}</td><td className="px-3 py-2 text-center font-bold">{comparisonData.avgOverall}</td></tr>
                            <tr className="border-b"><td className="px-3 py-2">Avg Defending</td><td className="px-3 py-2 text-center font-bold">{teamStats.avgDefending}/10</td><td className="px-3 py-2 text-center font-bold">{comparisonData.avgDefending}/10</td></tr>
                            <tr className="border-b"><td className="px-3 py-2">Avg Attacking</td><td className="px-3 py-2 text-center font-bold">{teamStats.avgAttacking}/10</td><td className="px-3 py-2 text-center font-bold">{comparisonData.avgAttacking}/10</td></tr>
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="border-none shadow-lg">
                  <CardContent className="p-12 text-center text-slate-500">
                    Select a comparison team above to see side-by-side analysis
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}

      {!selectedTeamId && (
        <Card className="border-none shadow-lg">
          <CardContent className="p-12 text-center text-slate-500">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold mb-2">Select a Team</h3>
            <p>Choose a team above to generate a comprehensive report</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}