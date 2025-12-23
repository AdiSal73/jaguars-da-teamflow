import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Award, Users, BarChart3 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';

export default function EvaluationAnalytics() {
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterPosition, setFilterPosition] = useState('all');
  const [filterAgeGroup, setFilterAgeGroup] = useState('all');

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations'],
    queryFn: () => base44.entities.Evaluation.list()
  });

  const filteredEvaluations = useMemo(() => {
    return evaluations.filter(e => {
      const player = players.find(p => p.id === e.player_id);
      if (!player) return false;

      const team = teams.find(t => t.id === player.team_id);
      const matchesTeam = filterTeam === 'all' || player.team_id === filterTeam;
      const matchesPosition = filterPosition === 'all' || player.primary_position === filterPosition;
      const matchesAgeGroup = filterAgeGroup === 'all' || team?.age_group === filterAgeGroup;

      return matchesTeam && matchesPosition && matchesAgeGroup;
    });
  }, [evaluations, players, filterTeam, filterPosition, filterAgeGroup, teams]);

  // G.R.E.A.T Rating Distribution
  const ratingDistribution = useMemo(() => {
    const buckets = { '0-20': 0, '20-40': 0, '40-60': 0, '60-80': 0, '80-100': 0 };
    filteredEvaluations.forEach(e => {
      const score = e.overall_score || 0;
      if (score < 20) buckets['0-20']++;
      else if (score < 40) buckets['20-40']++;
      else if (score < 60) buckets['40-60']++;
      else if (score < 80) buckets['60-80']++;
      else buckets['80-100']++;
    });
    return Object.entries(buckets).map(([range, count]) => ({ range, count }));
  }, [filteredEvaluations]);

  // Top performers by G.R.E.A.T Rating
  const topPerformers = useMemo(() => {
    return filteredEvaluations
      .filter(e => e.overall_score)
      .sort((a, b) => b.overall_score - a.overall_score)
      .slice(0, 10)
      .map(e => {
        const player = players.find(p => p.id === e.player_id);
        return {
          name: e.player_name || player?.full_name,
          score: e.overall_score,
          position: player?.primary_position
        };
      });
  }, [filteredEvaluations, players]);

  // Component breakdown average
  const componentAverages = useMemo(() => {
    if (filteredEvaluations.length === 0) return null;

    const sum = filteredEvaluations.reduce((acc, e) => {
      const mental = (2*(e.growth_mindset||0) + 2*(e.resilience||0) + (e.efficiency_in_execution||0) + 4*(e.athleticism||0) + (e.team_focus||0)) / 10;
      const defending = (2*(e.defending_organized||0) + 2*(e.defending_transition||0) + 3*(e.defending_final_third||0) + (e.defending_set_pieces||0)) / 8;
      const attacking = (2*(e.attacking_organized||0) + 2*(e.attacking_in_transition||0) + 3*(e.attacking_final_third||0) + (e.attacking_set_pieces||0)) / 8;
      const positionRoles = ((e.position_role_1||0) + (e.position_role_2||0) + (e.position_role_3||0) + (e.position_role_4||0)) / 4;

      return {
        mental: acc.mental + (2 * mental),
        defending: acc.defending + (2 * defending),
        attacking: acc.attacking + (2 * attacking),
        positionRoles: acc.positionRoles + (4 * positionRoles)
      };
    }, { mental: 0, defending: 0, attacking: 0, positionRoles: 0 });

    const count = filteredEvaluations.length;
    return [
      { component: 'Mental & Character', value: Math.round((sum.mental / count) * 10) / 10 },
      { component: 'Defending', value: Math.round((sum.defending / count) * 10) / 10 },
      { component: 'Attacking', value: Math.round((sum.attacking / count) * 10) / 10 },
      { component: 'Position Roles', value: Math.round((sum.positionRoles / count) * 10) / 10 }
    ];
  }, [filteredEvaluations]);

  // Position comparison
  const positionComparison = useMemo(() => {
    const positionMap = {};
    filteredEvaluations.forEach(e => {
      const player = players.find(p => p.id === e.player_id);
      const position = player?.primary_position || 'Unknown';
      if (!positionMap[position]) {
        positionMap[position] = { scores: [], count: 0 };
      }
      if (e.overall_score) {
        positionMap[position].scores.push(e.overall_score);
        positionMap[position].count++;
      }
    });

    return Object.entries(positionMap)
      .map(([position, data]) => ({
        position,
        avgScore: Math.round((data.scores.reduce((a, b) => a + b, 0) / data.count) * 10) / 10,
        count: data.count
      }))
      .sort((a, b) => b.avgScore - a.avgScore);
  }, [filteredEvaluations, players]);

  // Attribute radar for average player
  const averageRadarData = useMemo(() => {
    if (filteredEvaluations.length === 0) return [];

    const sum = filteredEvaluations.reduce((acc, e) => ({
      growth_mindset: acc.growth_mindset + (e.growth_mindset || 0),
      resilience: acc.resilience + (e.resilience || 0),
      athleticism: acc.athleticism + (e.athleticism || 0),
      team_focus: acc.team_focus + (e.team_focus || 0),
      defending_organized: acc.defending_organized + (e.defending_organized || 0),
      defending_final_third: acc.defending_final_third + (e.defending_final_third || 0),
      attacking_organized: acc.attacking_organized + (e.attacking_organized || 0),
      attacking_final_third: acc.attacking_final_third + (e.attacking_final_third || 0)
    }), {
      growth_mindset: 0, resilience: 0, athleticism: 0, team_focus: 0,
      defending_organized: 0, defending_final_third: 0,
      attacking_organized: 0, attacking_final_third: 0
    });

    const count = filteredEvaluations.length;
    return [
      { attribute: 'Growth', value: Math.round((sum.growth_mindset / count) * 10) / 10 },
      { attribute: 'Resilience', value: Math.round((sum.resilience / count) * 10) / 10 },
      { attribute: 'Athleticism', value: Math.round((sum.athleticism / count) * 10) / 10 },
      { attribute: 'Team Focus', value: Math.round((sum.team_focus / count) * 10) / 10 },
      { attribute: 'Def Org', value: Math.round((sum.defending_organized / count) * 10) / 10 },
      { attribute: 'Def Final', value: Math.round((sum.defending_final_third / count) * 10) / 10 },
      { attribute: 'Att Org', value: Math.round((sum.attacking_organized / count) * 10) / 10 },
      { attribute: 'Att Final', value: Math.round((sum.attacking_final_third / count) * 10) / 10 }
    ];
  }, [filteredEvaluations]);

  const uniqueTeams = [...new Set(teams.map(t => t.name).filter(Boolean))];
  const uniqueAgeGroups = [...new Set(teams.map(t => t.age_group).filter(Boolean))];
  const POSITIONS = ['GK', 'Right Outside Back', 'Left Outside Back', 'Right Centerback', 'Left Centerback', 'Defensive Midfielder', 'Right Winger', 'Center Midfielder', 'Forward', 'Attacking Midfielder', 'Left Winger'];

  const avgGreatRating = filteredEvaluations.length > 0
    ? Math.round((filteredEvaluations.reduce((sum, e) => sum + (e.overall_score || 0), 0) / filteredEvaluations.length) * 10) / 10
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-[1800px] mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            Evaluation Analytics - G.R.E.A.T Rating System
          </h1>
          <p className="text-slate-600 mt-2">
            G.R.E.A.T(R) combines Mental, Defending, Attacking, and Position-Specific skills into a comprehensive rating
          </p>
        </div>

        {/* Filters */}
        <Card className="border-none shadow-lg mb-6">
          <CardContent className="p-4">
            <div className="grid md:grid-cols-4 gap-3">
              <Select value={filterTeam} onValueChange={setFilterTeam}>
                <SelectTrigger><SelectValue placeholder="All Teams" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {uniqueTeams.map(team => (
                    <SelectItem key={team} value={teams.find(t => t.name === team)?.id}>{team}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterAgeGroup} onValueChange={setFilterAgeGroup}>
                <SelectTrigger><SelectValue placeholder="All Age Groups" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Age Groups</SelectItem>
                  {uniqueAgeGroups.map(ag => (
                    <SelectItem key={ag} value={ag}>{ag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterPosition} onValueChange={setFilterPosition}>
                <SelectTrigger><SelectValue placeholder="All Positions" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Positions</SelectItem>
                  {POSITIONS.map(pos => (
                    <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Overview Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-6">
          <Card className="border-none shadow-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-8 h-8 opacity-80" />
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="text-3xl font-bold mb-1">{avgGreatRating}</div>
              <div className="text-sm opacity-90">Avg G.R.E.A.T Rating</div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 opacity-80" />
                <BarChart3 className="w-5 h-5" />
              </div>
              <div className="text-3xl font-bold mb-1">{filteredEvaluations.length}</div>
              <div className="text-sm opacity-90">Total Evaluations</div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-8 h-8 opacity-80" />
              </div>
              <div className="text-3xl font-bold mb-1">{topPerformers[0]?.score || 'N/A'}</div>
              <div className="text-sm opacity-90">Highest Rating</div>
              <div className="text-xs mt-1 truncate">{topPerformers[0]?.name || '-'}</div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-gradient-to-br from-orange-500 to-red-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="w-8 h-8 opacity-80" />
              </div>
              <div className="text-3xl font-bold mb-1">{positionComparison.length}</div>
              <div className="text-sm opacity-90">Positions Analyzed</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Rating Distribution */}
          <Card className="border-none shadow-xl">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                G.R.E.A.T Rating Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ratingDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#059669" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Component Breakdown */}
          {componentAverages && (
            <Card className="border-none shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  G.R.E.A.T Components Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={componentAverages}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="component" />
                    <YAxis domain={[0, 20]} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Top Performers */}
          <Card className="border-none shadow-xl">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Top 10 G.R.E.A.T Ratings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {topPerformers.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-600' : 'bg-slate-500'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <div className="text-xs text-slate-500">{p.position}</div>
                      </div>
                    </div>
                    <Badge className="bg-purple-600 text-white text-lg font-bold px-3 py-1">
                      {p.score}
                    </Badge>
                  </div>
                ))}
                {topPerformers.length === 0 && (
                  <p className="text-center text-slate-500 py-8">No evaluations available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Position Comparison */}
          <Card className="border-none shadow-xl">
            <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Avg G.R.E.A.T by Position
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {positionComparison.map((p, idx) => (
                  <div key={idx} className="p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-slate-900">{p.position}</div>
                      <Badge className="bg-orange-600 text-white font-bold">
                        {p.avgScore}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500">{p.count} player{p.count !== 1 ? 's' : ''}</div>
                    <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                        style={{ width: `${(p.avgScore / 100) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                {positionComparison.length === 0 && (
                  <p className="text-center text-slate-500 py-8">No data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Average Attribute Radar */}
        {averageRadarData.length > 0 && (
          <Card className="border-none shadow-xl">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Average Player Attribute Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={averageRadarData}>
                  <PolarGrid stroke="#cbd5e1" />
                  <PolarAngleAxis dataKey="attribute" tick={{ fill: '#475569', fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 10]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Radar name="Average" dataKey="value" stroke="#059669" fill="#059669" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}