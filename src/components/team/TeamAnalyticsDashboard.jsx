import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Target, Award, AlertCircle } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';
import { Badge } from '@/components/ui/badge';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444'];

export default function TeamAnalyticsDashboard({ team, players, evaluations, assessments, tryouts }) {
  const teamPlayers = players.filter(p => p.team_id === team.id);
  const teamEvaluations = evaluations.filter(e => teamPlayers.some(p => p.id === e.player_id));
  const teamAssessments = assessments.filter(a => teamPlayers.some(p => p.id === a.player_id));
  const teamTryouts = tryouts.filter(t => teamPlayers.some(p => p.id === t.player_id));

  const avgEvalMetrics = React.useMemo(() => {
    if (teamEvaluations.length === 0) return null;
    
    const metrics = [
      'growth_mindset', 'resilience', 'efficiency_in_execution', 'athleticism', 'team_focus',
      'defending_organized', 'defending_final_third', 'defending_transition', 'pressing', 'defending_set_pieces',
      'attacking_organized', 'attacking_final_third', 'attacking_in_transition', 'building_out', 'attacking_set_pieces'
    ];

    const averages = {};
    metrics.forEach(metric => {
      const values = teamEvaluations.map(e => e[metric]).filter(v => v != null);
      averages[metric] = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    });

    return averages;
  }, [teamEvaluations]);

  const radarData = avgEvalMetrics ? [
    { category: 'Mental', value: ((avgEvalMetrics.growth_mindset + avgEvalMetrics.resilience + avgEvalMetrics.team_focus) / 3).toFixed(1) },
    { category: 'Physical', value: avgEvalMetrics.athleticism?.toFixed(1) || 0 },
    { category: 'Defending', value: ((avgEvalMetrics.defending_organized + avgEvalMetrics.defending_final_third + avgEvalMetrics.defending_transition) / 3).toFixed(1) },
    { category: 'Attacking', value: ((avgEvalMetrics.attacking_organized + avgEvalMetrics.attacking_final_third + avgEvalMetrics.attacking_in_transition) / 3).toFixed(1) },
    { category: 'Efficiency', value: avgEvalMetrics.efficiency_in_execution?.toFixed(1) || 0 }
  ] : [];

  const positionDistribution = React.useMemo(() => {
    const dist = {};
    teamPlayers.forEach(p => {
      const pos = p.primary_position || 'Unassigned';
      dist[pos] = (dist[pos] || 0) + 1;
    });
    return Object.entries(dist).map(([position, count]) => ({ position, count }));
  }, [teamPlayers]);

  const roleDistribution = React.useMemo(() => {
    const dist = {};
    teamTryouts.forEach(t => {
      const role = t.team_role || 'Unassigned';
      dist[role] = (dist[role] || 0) + 1;
    });
    return Object.entries(dist).map(([role, count]) => ({ role, count }));
  }, [teamTryouts]);

  const physicalTrend = React.useMemo(() => {
    const byMonth = {};
    teamAssessments.forEach(a => {
      const month = new Date(a.assessment_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!byMonth[month]) {
        byMonth[month] = { month, speed: [], power: [], endurance: [], agility: [] };
      }
      byMonth[month].speed.push(a.speed_score || 0);
      byMonth[month].power.push(a.power_score || 0);
      byMonth[month].endurance.push(a.endurance_score || 0);
      byMonth[month].agility.push(a.agility_score || 0);
    });

    return Object.values(byMonth).map(m => ({
      month: m.month,
      Speed: (m.speed.reduce((a, b) => a + b, 0) / m.speed.length).toFixed(0),
      Power: (m.power.reduce((a, b) => a + b, 0) / m.power.length).toFixed(0),
      Endurance: (m.endurance.reduce((a, b) => a + b, 0) / m.endurance.length).toFixed(0),
      Agility: (m.agility.reduce((a, b) => a + b, 0) / m.agility.length).toFixed(0)
    }));
  }, [teamAssessments]);

  const topPerformers = React.useMemo(() => {
    return teamPlayers
      .map(p => {
        const playerEvals = evaluations.filter(e => e.player_id === p.id);
        const avgScore = playerEvals.length > 0 
          ? playerEvals.reduce((sum, e) => sum + (e.overall_score || 0), 0) / playerEvals.length 
          : 0;
        return { ...p, avgScore };
      })
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 5);
  }, [teamPlayers, evaluations]);

  const strengthsWeaknesses = React.useMemo(() => {
    if (!avgEvalMetrics) return { strengths: [], weaknesses: [] };
    
    const metrics = [
      { key: 'defending_organized', label: 'Defending Organized' },
      { key: 'attacking_organized', label: 'Attacking Organized' },
      { key: 'defending_final_third', label: 'Defending Final Third' },
      { key: 'attacking_final_third', label: 'Attacking Final Third' },
      { key: 'pressing', label: 'Pressing' },
      { key: 'building_out', label: 'Building Out' }
    ];

    const sorted = metrics.map(m => ({ ...m, value: avgEvalMetrics[m.key] || 0 })).sort((a, b) => b.value - a.value);
    
    return {
      strengths: sorted.slice(0, 3),
      weaknesses: sorted.slice(-3).reverse()
    };
  }, [avgEvalMetrics]);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-50 to-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">Total Players</p>
                <p className="text-2xl font-bold text-emerald-700">{teamPlayers.length}</p>
              </div>
              <Users className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">Avg Evaluation</p>
                <p className="text-2xl font-bold text-blue-700">
                  {teamEvaluations.length > 0 
                    ? (teamEvaluations.reduce((sum, e) => sum + (e.overall_score || 0), 0) / teamEvaluations.length).toFixed(1)
                    : 'N/A'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">Assessments</p>
                <p className="text-2xl font-bold text-purple-700">{teamAssessments.length}</p>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg bg-gradient-to-br from-orange-50 to-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">Indispensable</p>
                <p className="text-2xl font-bold text-orange-700">
                  {teamTryouts.filter(t => t.team_role === 'Indispensable Player').length}
                </p>
              </div>
              <Award className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-none shadow-xl">
          <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-600 text-white pb-3">
            <CardTitle className="text-base">Team Performance Profile</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="category" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 10]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Radar name="Team Avg" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                <p>No evaluation data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white pb-3">
            <CardTitle className="text-base">Position Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={positionDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="position" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-none shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white pb-3">
            <CardTitle className="text-base">Team Strengths</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {strengthsWeaknesses.strengths.length > 0 ? (
              <div className="space-y-3">
                {strengthsWeaknesses.strengths.map((s, i) => (
                  <div key={s.key} className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">{s.label}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-32 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${s.value * 10}%` }} />
                      </div>
                      <span className="text-sm font-bold text-emerald-600 w-8">{s.value.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-500 py-6">No data available</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl">
          <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white pb-3">
            <CardTitle className="text-base">Areas for Development</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {strengthsWeaknesses.weaknesses.length > 0 ? (
              <div className="space-y-3">
                {strengthsWeaknesses.weaknesses.map((w, i) => (
                  <div key={w.key} className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">{w.label}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-32 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: `${w.value * 10}%` }} />
                      </div>
                      <span className="text-sm font-bold text-orange-600 w-8">{w.value.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-500 py-6">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {physicalTrend.length > 0 && (
        <Card className="border-none shadow-xl">
          <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white pb-3">
            <CardTitle className="text-base">Physical Performance Trend</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={physicalTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="Speed" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="Power" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="Endurance" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="Agility" stroke="#ec4899" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card className="border-none shadow-xl">
        <CardHeader className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white pb-3">
          <CardTitle className="text-base">Top Performers</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-2">
            {topPerformers.map((player, index) => (
              <div key={player.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{player.full_name}</p>
                    <p className="text-xs text-slate-500">{player.primary_position}</p>
                  </div>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800">
                  {player.avgScore.toFixed(1)}
                </Badge>
              </div>
            ))}
            {topPerformers.length === 0 && (
              <p className="text-center text-slate-500 py-6">No evaluation data available</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-xl">
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white pb-3">
          <CardTitle className="text-base">Team Role Distribution</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={roleDistribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="role" type="category" tick={{ fontSize: 10 }} width={150} />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}