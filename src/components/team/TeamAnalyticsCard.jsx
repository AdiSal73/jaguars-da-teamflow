import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Users, Activity, Target, BarChart3 } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function TeamAnalyticsCard({ teamId, teamName, onClose }) {
  const { data: players = [] } = useQuery({
    queryKey: ['teamPlayers', teamId],
    queryFn: async () => {
      const all = await base44.entities.Player.list();
      return all.filter(p => p.team_id === teamId);
    }
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['teamAssessments', teamId],
    queryFn: async () => {
      const all = await base44.entities.PhysicalAssessment.list();
      return all.filter(a => a.team_id === teamId);
    }
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ['teamEvaluations', teamId],
    queryFn: async () => {
      const all = await base44.entities.Evaluation.list();
      const playerIds = players?.map(p => p.id) || [];
      return all.filter(e => playerIds.includes(e.player_id));
    },
    enabled: players.length > 0
  });

  const { data: allTeams = [] } = useQuery({
    queryKey: ['allTeams'],
    queryFn: () => base44.entities.Team.list()
  });

  const { data: allAssessments = [] } = useQuery({
    queryKey: ['allAssessments'],
    queryFn: () => base44.entities.PhysicalAssessment.list()
  });

  // Calculate team stats
  const calculateStats = () => {
    const playersWithAssessments = players.filter(p => 
      assessments.some(a => a.player_id === p.id)
    );
    
    const assessmentRate = players.length > 0 
      ? Math.round((playersWithAssessments.length / players.length) * 100)
      : 0;

    const avgPhysical = assessments.length > 0
      ? {
          speed: Math.round(assessments.reduce((sum, a) => sum + (a.speed_score || 0), 0) / assessments.length),
          power: Math.round(assessments.reduce((sum, a) => sum + (a.power_score || 0), 0) / assessments.length),
          endurance: Math.round(assessments.reduce((sum, a) => sum + (a.endurance_score || 0), 0) / assessments.length),
          agility: Math.round(assessments.reduce((sum, a) => sum + (a.agility_score || 0), 0) / assessments.length),
          overall: Math.round(assessments.reduce((sum, a) => sum + (a.overall_score || 0), 0) / assessments.length),
        }
      : { speed: 0, power: 0, endurance: 0, agility: 0, overall: 0 };

    const avgEvaluation = evaluations.length > 0
      ? {
          growth: Math.round(evaluations.reduce((sum, e) => sum + (e.growth_mindset || 0), 0) / evaluations.length),
          resilience: Math.round(evaluations.reduce((sum, e) => sum + (e.resilience || 0), 0) / evaluations.length),
          teamFocus: Math.round(evaluations.reduce((sum, e) => sum + (e.team_focus || 0), 0) / evaluations.length),
        }
      : { growth: 0, resilience: 0, teamFocus: 0 };

    const activePlayers = players.filter(p => p.status === 'Active').length;
    const retentionRate = players.length > 0 
      ? Math.round((activePlayers / players.length) * 100)
      : 0;

    return { assessmentRate, avgPhysical, avgEvaluation, retentionRate, activePlayers };
  };

  const stats = calculateStats();

  // Get current team info for comparison
  const currentTeam = allTeams.find(t => t.id === teamId);
  const sameClubTeams = allTeams.filter(t => 
    t.id !== teamId && (t.age_group === currentTeam?.age_group || t.league === currentTeam?.league)
  );

  // Calculate comparison data
  const comparisonData = sameClubTeams?.slice(0, 4)?.map(team => {
    const teamAssess = allAssessments.filter(a => a.team_id === team.id);
    const avgScore = teamAssess.length > 0
      ? Math.round(teamAssess.reduce((sum, a) => sum + (a.overall_score || 0), 0) / teamAssess.length)
      : 0;
    return {
      name: team.name?.substring(0, 12) || 'Unknown',
      score: avgScore
    };
  });

  comparisonData.unshift({
    name: teamName?.substring(0, 12) || 'Current',
    score: stats.avgPhysical.overall,
    fill: '#10b981'
  });

  const radarData = [
    { attribute: 'Speed', value: stats.avgPhysical.speed, fullMark: 100 },
    { attribute: 'Power', value: stats.avgPhysical.power, fullMark: 100 },
    { attribute: 'Endurance', value: stats.avgPhysical.endurance, fullMark: 100 },
    { attribute: 'Agility', value: stats.avgPhysical.agility, fullMark: 100 },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-md bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{players.length}</p>
                <p className="text-xs text-slate-600">Total Players</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.avgPhysical.overall}</p>
                <p className="text-xs text-slate-600">Avg Physical Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.assessmentRate}%</p>
                <p className="text-xs text-slate-600">Assessment Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                {stats.retentionRate >= 80 ? (
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-orange-600" />
                )}
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.retentionRate}%</p>
                <p className="text-xs text-slate-600">Retention Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Physical Attributes Radar */}
        <Card className="border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Physical Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="attribute" tick={{ fill: '#64748b', fontSize: 12 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar 
                  name="Team Average" 
                  dataKey="value" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Club Comparison */}
        <Card className="border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Club Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            {comparisonData.length > 1 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar 
                    dataKey="score" 
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-500">
                No comparison data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <Card className="border-none shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Detailed Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-red-50 rounded-xl">
              <p className="text-sm text-red-600 font-medium">Speed</p>
              <p className="text-2xl font-bold text-red-700">{stats.avgPhysical.speed}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-600 font-medium">Power</p>
              <p className="text-2xl font-bold text-blue-700">{stats.avgPhysical.power}</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl">
              <p className="text-sm text-emerald-600 font-medium">Endurance</p>
              <p className="text-2xl font-bold text-emerald-700">{stats.avgPhysical.endurance}</p>
            </div>
            <div className="p-4 bg-pink-50 rounded-xl">
              <p className="text-sm text-pink-600 font-medium">Agility</p>
              <p className="text-2xl font-bold text-pink-700">{stats.avgPhysical.agility}</p>
            </div>
          </div>

          {evaluations.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-semibold text-slate-700 mb-3">Evaluation Averages</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-lg font-bold text-purple-700">{stats.avgEvaluation.growth}</p>
                  <p className="text-xs text-slate-600">Growth Mindset</p>
                </div>
                <div className="text-center p-3 bg-indigo-50 rounded-lg">
                  <p className="text-lg font-bold text-indigo-700">{stats.avgEvaluation.resilience}</p>
                  <p className="text-xs text-slate-600">Resilience</p>
                </div>
                <div className="text-center p-3 bg-cyan-50 rounded-lg">
                  <p className="text-lg font-bold text-cyan-700">{stats.avgEvaluation.teamFocus}</p>
                  <p className="text-xs text-slate-600">Team Focus</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}