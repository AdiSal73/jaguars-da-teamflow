import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, TrendingUp, Activity, Award, Trophy, TrendingDown, AlertTriangle, Target, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import TeamStrengthsHeatmap from '../components/analytics/TeamStrengthsHeatmap';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TeamDashboard() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const teamId = urlParams.get('id');

  const { data: team } = useQuery({
    queryKey: ['team', teamId],
    queryFn: async () => {
      const teams = await base44.entities.Team.list();
      return teams.find(t => t.id === teamId);
    },
    enabled: !!teamId
  });

  const { data: players = [] } = useQuery({
    queryKey: ['teamPlayers', teamId],
    queryFn: () => base44.entities.Player.filter({ team_id: teamId })
  });

  const { data: allAssessments = [] } = useQuery({
    queryKey: ['allAssessments'],
    queryFn: () => base44.entities.PhysicalAssessment.list('-assessment_date')
  });

  const { data: allEvaluations = [] } = useQuery({
    queryKey: ['allEvaluations'],
    queryFn: () => base44.entities.Evaluation.list('-evaluation_date')
  });

  const { data: allTeams = [] } = useQuery({
    queryKey: ['allTeams'],
    queryFn: () => base44.entities.Team.list()
  });

  const { data: allPlayers = [] } = useQuery({
    queryKey: ['allPlayers'],
    queryFn: () => base44.entities.Player.list()
  });

  if (!team) return null;

  const playerIds = players.map(p => p.id);
  const teamAssessments = allAssessments.filter(a => playerIds.includes(a.player_id));
  const teamEvaluations = allEvaluations.filter(e => playerIds.includes(e.player_id));

  // Calculate overall score using new formula
  const calculateOverallScore = (assessment) => {
    const speed = assessment.speed || 0;
    const agility = assessment.agility || 0;
    const power = assessment.power || 0;
    const endurance = assessment.endurance || 0;
    return Math.round(((5 * speed) + agility + (3 * power) + (6 * endurance)) / 60);
  };

  // Player leaderboard data
  const playerStats = players.map(player => {
    const playerAssessments = allAssessments.filter(a => a.player_id === player.id);
    const playerEvaluations = allEvaluations.filter(e => e.player_id === player.id);
    const latestAssessment = playerAssessments[0];
    const latestEvaluation = playerEvaluations[0];

    const avgSpeed = latestAssessment?.speed || 0;
    const avgAgility = latestAssessment?.agility || 0;
    const avgPower = latestAssessment?.power || 0;
    const avgEndurance = latestAssessment?.endurance || 0;
    const physicalScore = latestAssessment ? calculateOverallScore(latestAssessment) : 0;
    
    const evalScore = latestEvaluation?.overall_rating || 0;

    return {
      ...player,
      avgSpeed,
      avgAgility,
      avgPower,
      avgEndurance,
      physicalScore,
      evalScore,
      overallScore: Math.round((physicalScore + evalScore * 10) / 2)
    };
  }).sort((a, b) => b.overallScore - a.overallScore);

  // Historical season analysis
  const assessmentsByDate = {};
  teamAssessments.forEach(a => {
    const date = new Date(a.assessment_date);
    const year = date.getFullYear();
    const month = date.getMonth();
    const season = `${year}-${(year + 1).toString().slice(2)}`;
    
    if (!assessmentsByDate[season]) {
      assessmentsByDate[season] = [];
    }
    assessmentsByDate[season].push(a);
  });

  const seasonalTrends = Object.keys(assessmentsByDate).map(season => {
    const assessments = assessmentsByDate[season];
    const avgSpeed = assessments.reduce((sum, a) => sum + (a.speed || 0), 0) / assessments.length;
    const avgAgility = assessments.reduce((sum, a) => sum + (a.agility || 0), 0) / assessments.length;
    const avgPower = assessments.reduce((sum, a) => sum + (a.power || 0), 0) / assessments.length;
    const avgEndurance = assessments.reduce((sum, a) => sum + (a.endurance || 0), 0) / assessments.length;
    
    return {
      season,
      speed: Math.round(avgSpeed),
      agility: Math.round(avgAgility),
      power: Math.round(avgPower),
      endurance: Math.round(avgEndurance),
      overall: Math.round(((5 * avgSpeed) + avgAgility + (3 * avgPower) + (6 * avgEndurance)) / 60)
    };
  }).sort((a, b) => a.season.localeCompare(b.season));

  // Team comparison data
  const teamComparisons = allTeams.map(t => {
    const tPlayers = allPlayers.filter(p => p.team_id === t.id);
    const tPlayerIds = tPlayers.map(p => p.id);
    const tAssessments = allAssessments.filter(a => tPlayerIds.includes(a.player_id));
    const tEvaluations = allEvaluations.filter(e => tPlayerIds.includes(e.player_id));

    const avgPhysical = tAssessments.length > 0
      ? Math.round(
          tAssessments.reduce((sum, a) => sum + calculateOverallScore(a), 0) / tAssessments.length
        )
      : 0;

    const avgEvaluation = tEvaluations.length > 0
      ? Math.round(
          tEvaluations.reduce((sum, e) => sum + (e.overall_rating || 0), 0) / tEvaluations.length
        )
      : 0;

    return {
      name: t.name,
      id: t.id,
      playerCount: tPlayers.length,
      avgPhysical,
      avgEvaluation,
      overallScore: Math.round((avgPhysical + avgEvaluation * 10) / 2)
    };
  }).sort((a, b) => b.overallScore - a.overallScore);

  const currentTeamRank = teamComparisons.findIndex(t => t.id === teamId) + 1;

  const calculateTeamAverages = () => {
    if (teamAssessments.length === 0) return { speed: 0, agility: 0, power: 0, endurance: 0 };
    
    const totals = teamAssessments.reduce((acc, a) => ({
      speed: acc.speed + (a.speed || 0),
      agility: acc.agility + (a.agility || 0),
      power: acc.power + (a.power || 0),
      endurance: acc.endurance + (a.endurance || 0)
    }), { speed: 0, agility: 0, power: 0, endurance: 0 });
    
    return {
      speed: Math.round(totals.speed / teamAssessments.length),
      agility: Math.round(totals.agility / teamAssessments.length),
      power: Math.round(totals.power / teamAssessments.length),
      endurance: Math.round(totals.endurance / teamAssessments.length)
    };
  };

  const teamAverages = calculateTeamAverages();
  const topPerformers = playerStats.slice(0, 5);

  // Club average
  const clubAssessments = allAssessments;
  const clubTotals = clubAssessments.reduce((acc, a) => ({
    speed: acc.speed + (a.speed || 0),
    agility: acc.agility + (a.agility || 0),
    power: acc.power + (a.power || 0),
    endurance: acc.endurance + (a.endurance || 0)
  }), { speed: 0, agility: 0, power: 0, endurance: 0 });
  
  const clubAverage = clubAssessments.length > 0 ? {
    speed: Math.round(clubTotals.speed / clubAssessments.length),
    agility: Math.round(clubTotals.agility / clubAssessments.length),
    power: Math.round(clubTotals.power / clubAssessments.length),
    endurance: Math.round(clubTotals.endurance / clubAssessments.length)
  } : { speed: 0, agility: 0, power: 0, endurance: 0 };

  const comparisonData = [
    { name: 'Team', ...teamAverages },
    { name: 'Club Avg', ...clubAverage }
  ];

  // Evaluation averages
  const evalAvg = teamEvaluations.length > 0 ? {
    technical: teamEvaluations.reduce((sum, e) => sum + (e.technical_skills || 0), 0) / teamEvaluations.length,
    tactical: teamEvaluations.reduce((sum, e) => sum + (e.tactical_awareness || 0), 0) / teamEvaluations.length,
    physical: teamEvaluations.reduce((sum, e) => sum + (e.physical_attributes || 0), 0) / teamEvaluations.length,
    mental: teamEvaluations.reduce((sum, e) => sum + (e.mental_attributes || 0), 0) / teamEvaluations.length,
    teamwork: teamEvaluations.reduce((sum, e) => sum + (e.teamwork || 0), 0) / teamEvaluations.length
  } : { technical: 0, tactical: 0, physical: 0, mental: 0, teamwork: 0 };

  // Strengths and Weaknesses Analysis
  const metrics = [
    { key: 'speed', value: teamAverages.speed, label: 'Speed', clubAvg: clubAverage.speed },
    { key: 'agility', value: teamAverages.agility, label: 'Agility', clubAvg: clubAverage.agility },
    { key: 'power', value: teamAverages.power, label: 'Power', clubAvg: clubAverage.power },
    { key: 'endurance', value: teamAverages.endurance, label: 'Endurance', clubAvg: clubAverage.endurance }
  ];

  const strengths = metrics.filter(m => m.value >= m.clubAvg + 5).sort((a, b) => (b.value - b.clubAvg) - (a.value - a.clubAvg));
  const weaknesses = metrics.filter(m => m.value < m.clubAvg - 5).sort((a, b) => (a.value - a.clubAvg) - (b.value - b.clubAvg));

  // Strategic recommendations
  const recommendations = [];
  if (weaknesses.length > 0) {
    weaknesses.forEach(w => {
      recommendations.push({
        type: 'improvement',
        title: `Focus on ${w.label}`,
        description: `Team is ${Math.abs(w.value - w.clubAvg)} points below club average. Implement targeted ${w.label.toLowerCase()} training programs.`
      });
    });
  }
  if (strengths.length > 0) {
    recommendations.push({
      type: 'maintain',
      title: `Maintain ${strengths[0].label} Excellence`,
      description: `Continue current ${strengths[0].label.toLowerCase()} training regime as team performs ${strengths[0].value - strengths[0].clubAvg} points above club average.`
    });
  }
  if (seasonalTrends.length > 1) {
    const latestSeason = seasonalTrends[seasonalTrends.length - 1];
    const previousSeason = seasonalTrends[seasonalTrends.length - 2];
    const trend = latestSeason.overall - previousSeason.overall;
    if (trend > 0) {
      recommendations.push({
        type: 'trend',
        title: 'Positive Season Trend',
        description: `Team improved by ${trend} points from last season. Build on this momentum.`
      });
    } else if (trend < 0) {
      recommendations.push({
        type: 'alert',
        title: 'Performance Decline Alert',
        description: `Team declined by ${Math.abs(trend)} points from last season. Review training methods and player development.`
      });
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
              style={{ backgroundColor: team.team_color }}
            >
              {team.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{team.name}</h1>
              <p className="text-slate-600">{team.age_group} • {team.division}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-600">Club Ranking</div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              <span className="text-2xl font-bold text-slate-900">#{currentTeamRank}</span>
              <span className="text-sm text-slate-500">of {allTeams.length}</span>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="benchmarking">Benchmarking</TabsTrigger>
          <TabsTrigger value="strategy">Strategic Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="border-none shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-600">Total Players</div>
                    <div className="text-3xl font-bold text-slate-900 mt-1">{players.length}</div>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-600">Assessments</div>
                    <div className="text-3xl font-bold text-slate-900 mt-1">{teamAssessments.length}</div>
                  </div>
                  <Activity className="w-8 h-8 text-emerald-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-600">Evaluations</div>
                    <div className="text-3xl font-bold text-slate-900 mt-1">{teamEvaluations.length}</div>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-600">Avg Performance</div>
                    <div className="text-3xl font-bold text-slate-900 mt-1">
                      {teamAssessments.length > 0 ? Math.round(teamAssessments.reduce((sum, a) => sum + calculateOverallScore(a), 0) / teamAssessments.length) : 0}
                    </div>
                  </div>
                  <Award className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Player Leaderboard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topPerformers.map((player, idx) => (
                    <Link key={player.id} to={`${createPageUrl('PlayerProfile')}?id=${player.id}`}>
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                            idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-orange-600' : 'bg-slate-300'
                          }`}>
                            {idx + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{player.full_name}</div>
                            <div className="text-sm text-slate-600">{player.position}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-emerald-600">{player.overallScore}</div>
                          <div className="text-xs text-slate-500">Overall Score</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Team Physical Attributes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-red-50 rounded-xl">
                    <div className="text-sm text-red-600 mb-1">Speed</div>
                    <div className="text-3xl font-bold text-red-700">{teamAverages.speed}</div>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-xl">
                    <div className="text-sm text-emerald-600 mb-1">Agility</div>
                    <div className="text-3xl font-bold text-emerald-700">{teamAverages.agility}</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <div className="text-sm text-blue-600 mb-1">Power</div>
                    <div className="text-3xl font-bold text-blue-700">{teamAverages.power}</div>
                  </div>
                  <div className="p-4 bg-pink-50 rounded-xl">
                    <div className="text-sm text-pink-600 mb-1">Endurance</div>
                    <div className="text-3xl font-bold text-pink-700">{teamAverages.endurance}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <TeamStrengthsHeatmap teamData={evalAvg} />

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Club Team Rankings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {teamComparisons.slice(0, 5).map((t, idx) => (
                    <div
                      key={t.id}
                      className={`flex items-center justify-between p-3 rounded-xl ${
                        t.id === teamId ? 'bg-emerald-100 border-2 border-emerald-500' : 'bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-sm font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{t.name}</div>
                          <div className="text-xs text-slate-600">{t.playerCount} players</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-slate-900">{t.overallScore}</div>
                        <div className="text-xs text-slate-500">Score</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="benchmarking" className="space-y-6">
          {seasonalTrends.length > 1 && (
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Historical Season Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={seasonalTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="season" style={{ fontSize: '12px' }} />
                    <YAxis style={{ fontSize: '12px' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="speed" stroke="#ef4444" strokeWidth={2} />
                    <Line type="monotone" dataKey="agility" stroke="#22c55e" strokeWidth={2} />
                    <Line type="monotone" dataKey="power" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="endurance" stroke="#ec4899" strokeWidth={2} />
                    <Line type="monotone" dataKey="overall" stroke="#8b5cf6" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Team vs Club Average Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" style={{ fontSize: '12px' }} />
                  <YAxis style={{ fontSize: '12px' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="speed" name="Speed" fill="#ef4444" />
                  <Bar dataKey="agility" name="Agility" fill="#22c55e" />
                  <Bar dataKey="power" name="Power" fill="#3b82f6" />
                  <Bar dataKey="endurance" name="Endurance" fill="#ec4899" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {strengths.length > 0 && (
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-emerald-600" />
                    Team Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {strengths.map(strength => (
                      <div key={strength.key} className="p-4 bg-emerald-50 rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-semibold text-slate-900">{strength.label}</div>
                          <Badge className="bg-emerald-600">{strength.value}</Badge>
                        </div>
                        <div className="text-sm text-slate-600">
                          +{strength.value - strength.clubAvg} above club average
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {weaknesses.length > 0 && (
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    Areas for Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {weaknesses.map(weakness => (
                      <div key={weakness.key} className="p-4 bg-red-50 rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-semibold text-slate-900">{weakness.label}</div>
                          <Badge className="bg-red-600">{weakness.value}</Badge>
                        </div>
                        <div className="text-sm text-slate-600">
                          {Math.abs(weakness.value - weakness.clubAvg)} below club average
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="strategy" className="space-y-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                Strategic Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className={`p-4 rounded-xl ${
                    rec.type === 'improvement' ? 'bg-orange-50 border-l-4 border-orange-500' :
                    rec.type === 'maintain' ? 'bg-emerald-50 border-l-4 border-emerald-500' :
                    rec.type === 'trend' ? 'bg-blue-50 border-l-4 border-blue-500' :
                    'bg-red-50 border-l-4 border-red-500'
                  }`}>
                    <div className="flex items-start gap-3">
                      <Target className="w-5 h-5 mt-1 text-slate-700" />
                      <div>
                        <div className="font-semibold text-slate-900 mb-1">{rec.title}</div>
                        <div className="text-sm text-slate-600">{rec.description}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {recommendations.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    More data needed for strategic recommendations
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Focus Areas for Next Season</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {weaknesses.slice(0, 2).map((weakness, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center font-bold">
                        {idx + 1}
                      </div>
                      <div className="font-semibold text-slate-900">{weakness.label} Development</div>
                    </div>
                    <div className="text-sm text-slate-600 space-y-2">
                      <p>• Implement specialized {weakness.label.toLowerCase()} training drills</p>
                      <p>• Monitor progress weekly with assessments</p>
                      <p>• Target: Improve to {weakness.clubAvg} (club average)</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}