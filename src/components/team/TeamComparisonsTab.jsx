import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Users, TrendingUp, Target, Award } from 'lucide-react';

export default function TeamComparisonsTab({ 
  allTeams, 
  allPlayers, 
  allAssessments, 
  allEvaluations, 
  allTryouts 
}) {
  const [selectedTeamIds, setSelectedTeamIds] = useState([]);

  const toggleTeamSelection = (teamId) => {
    if (selectedTeamIds.includes(teamId)) {
      setSelectedTeamIds(selectedTeamIds.filter(id => id !== teamId));
    } else {
      setSelectedTeamIds([...selectedTeamIds, teamId]);
    }
  };

  const teamStats = useMemo(() => {
    return allTeams.map(team => {
      const teamPlayers = allPlayers.filter(p => p.team_id === team.id);
      const teamAssessments = allAssessments.filter(a => 
        teamPlayers.some(p => p.id === a.player_id)
      );
      const teamEvaluations = allEvaluations.filter(e => 
        teamPlayers.some(p => p.id === e.player_id)
      );
      const teamTryouts = allTryouts.filter(t => 
        teamPlayers.some(p => p.id === t.player_id)
      );

      const avgPhysical = teamAssessments.length > 0 ? {
        speed: Math.round(teamAssessments.reduce((sum, a) => sum + (a.speed_score || 0), 0) / teamAssessments.length),
        power: Math.round(teamAssessments.reduce((sum, a) => sum + (a.power_score || 0), 0) / teamAssessments.length),
        endurance: Math.round(teamAssessments.reduce((sum, a) => sum + (a.endurance_score || 0), 0) / teamAssessments.length),
        agility: Math.round(teamAssessments.reduce((sum, a) => sum + (a.agility_score || 0), 0) / teamAssessments.length),
        overall: Math.round(teamAssessments.reduce((sum, a) => sum + (a.overall_score || 0), 0) / teamAssessments.length),
      } : { speed: 0, power: 0, endurance: 0, agility: 0, overall: 0 };

      const latestEvalsByPlayer = {};
      teamEvaluations.forEach(e => {
        if (!latestEvalsByPlayer[e.player_id] || new Date(e.created_date) > new Date(latestEvalsByPlayer[e.player_id].created_date)) {
          latestEvalsByPlayer[e.player_id] = e;
        }
      });

      const latestEvals = Object.values(latestEvalsByPlayer);
      const avgEval = latestEvals.length > 0 ? {
        mental: Math.round(latestEvals.reduce((sum, e) => sum + ((e.growth_mindset || 0) + (e.resilience || 0) + (e.team_focus || 0)) / 3, 0) / latestEvals.length * 10) / 10,
        defending: Math.round(latestEvals.reduce((sum, e) => sum + ((e.defending_organized || 0) + (e.defending_final_third || 0) + (e.defending_transition || 0)) / 3, 0) / latestEvals.length * 10) / 10,
        attacking: Math.round(latestEvals.reduce((sum, e) => sum + ((e.attacking_organized || 0) + (e.attacking_final_third || 0) + (e.attacking_in_transition || 0)) / 3, 0) / latestEvals.length * 10) / 10,
        athleticism: Math.round(latestEvals.reduce((sum, e) => sum + (e.athleticism || 0), 0) / latestEvals.length * 10) / 10
      } : { mental: 0, defending: 0, attacking: 0, athleticism: 0 };

      const assessmentRate = teamPlayers.length > 0 
        ? Math.round((teamPlayers.filter(p => teamAssessments.some(a => a.player_id === p.id)).length / teamPlayers.length) * 100)
        : 0;

      const retentionRate = teamPlayers.length > 0
        ? Math.round((teamPlayers.filter(p => p.status === 'Active').length / teamPlayers.length) * 100)
        : 0;

      const registrationRate = teamTryouts.length > 0
        ? Math.round((teamTryouts.filter(t => t.registration_status === 'Signed and Paid').length / teamTryouts.length) * 100)
        : 0;

      return {
        id: team.id,
        name: team.name,
        age_group: team.age_group,
        league: team.league,
        playerCount: teamPlayers.length,
        ...avgPhysical,
        ...avgEval,
        assessmentRate,
        retentionRate,
        registrationRate
      };
    });
  }, [allTeams, allPlayers, allAssessments, allEvaluations, allTryouts]);

  const selectedTeams = teamStats.filter(t => selectedTeamIds.includes(t.id));

  const comparisonBarData = selectedTeams.length > 0 ? [
    {
      metric: 'Physical',
      ...selectedTeams.reduce((acc, team, idx) => ({
        ...acc,
        [team.name]: team.overall
      }), {})
    },
    {
      metric: 'Mental',
      ...selectedTeams.reduce((acc, team) => ({
        ...acc,
        [team.name]: team.mental
      }), {})
    },
    {
      metric: 'Defending',
      ...selectedTeams.reduce((acc, team) => ({
        ...acc,
        [team.name]: team.defending
      }), {})
    },
    {
      metric: 'Attacking',
      ...selectedTeams.reduce((acc, team) => ({
        ...acc,
        [team.name]: team.attacking
      }), {})
    },
    {
      metric: 'Assessment %',
      ...selectedTeams.reduce((acc, team) => ({
        ...acc,
        [team.name]: team.assessmentRate
      }), {})
    },
    {
      metric: 'Retention %',
      ...selectedTeams.reduce((acc, team) => ({
        ...acc,
        [team.name]: team.retentionRate
      }), {})
    }
  ] : [];

  const radarData = ['Speed', 'Power', 'Endurance', 'Agility'].map(attr => {
    const dataPoint = { attribute: attr };
    selectedTeams.forEach(team => {
      dataPoint[team.name] = team[attr.toLowerCase()];
    });
    return dataPoint;
  });

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 border-b">
          <CardTitle className="text-lg">Select Teams to Compare</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {teamStats.map(team => (
              <div
                key={team.id}
                className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                  selectedTeamIds.includes(team.id)
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => toggleTeamSelection(team.id)}
              >
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={selectedTeamIds.includes(team.id)}
                    onCheckedChange={() => toggleTeamSelection(team.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-slate-900">{team.name}</div>
                    <div className="text-xs text-slate-600">{team.age_group} • {team.league}</div>
                    <Badge variant="outline" className="text-[10px] mt-1">{team.playerCount} players</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedTeams.length === 0 && (
        <Card className="border-none shadow-lg">
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Select teams above to see comparisons</p>
          </CardContent>
        </Card>
      )}

      {selectedTeams.length > 0 && (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {selectedTeams.map((team, idx) => (
              <Card key={team.id} className="border-none shadow-lg" style={{ borderTop: `4px solid ${COLORS[idx % COLORS.length]}` }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{team.name}</CardTitle>
                  <p className="text-xs text-slate-500">{team.age_group} • {team.league}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-slate-50 rounded text-center">
                      <div className="text-lg font-bold text-slate-900">{team.playerCount}</div>
                      <div className="text-[10px] text-slate-600">Players</div>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded text-center">
                      <div className="text-lg font-bold text-emerald-700">{team.overall}</div>
                      <div className="text-[10px] text-slate-600">Avg Score</div>
                    </div>
                    <div className="p-2 bg-blue-50 rounded text-center">
                      <div className="text-lg font-bold text-blue-700">{team.assessmentRate}%</div>
                      <div className="text-[10px] text-slate-600">Assessed</div>
                    </div>
                    <div className="p-2 bg-purple-50 rounded text-center">
                      <div className="text-lg font-bold text-purple-700">{team.retentionRate}%</div>
                      <div className="text-[10px] text-slate-600">Retention</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={comparisonBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="metric" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {selectedTeams.map((team, idx) => (
                    <Bar 
                      key={team.id} 
                      dataKey={team.name} 
                      fill={COLORS[idx % COLORS.length]} 
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Physical Attributes Comparison</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="attribute" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  {selectedTeams.map((team, idx) => (
                    <Radar
                      key={team.id}
                      name={team.name}
                      dataKey={team.name}
                      stroke={COLORS[idx % COLORS.length]}
                      fill={COLORS[idx % COLORS.length]}
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Detailed Comparison Table</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Metric</th>
                      {selectedTeams.map(team => (
                        <th key={team.id} className="px-4 py-3 text-center text-xs font-bold text-slate-700">
                          {team.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">Players</td>
                      {selectedTeams.map(team => (
                        <td key={team.id} className="px-4 py-3 text-center text-sm">{team.playerCount}</td>
                      ))}
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">Overall Physical Score</td>
                      {selectedTeams.map(team => (
                        <td key={team.id} className="px-4 py-3 text-center">
                          <span className="text-sm font-bold text-emerald-600">{team.overall}</span>
                        </td>
                      ))}
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">Speed</td>
                      {selectedTeams.map(team => (
                        <td key={team.id} className="px-4 py-3 text-center text-sm">{team.speed}</td>
                      ))}
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">Power</td>
                      {selectedTeams.map(team => (
                        <td key={team.id} className="px-4 py-3 text-center text-sm">{team.power}</td>
                      ))}
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">Endurance</td>
                      {selectedTeams.map(team => (
                        <td key={team.id} className="px-4 py-3 text-center text-sm">{team.endurance}</td>
                      ))}
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">Agility</td>
                      {selectedTeams.map(team => (
                        <td key={team.id} className="px-4 py-3 text-center text-sm">{team.agility}</td>
                      ))}
                    </tr>
                    <tr className="hover:bg-slate-50 bg-blue-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">Mental/Character</td>
                      {selectedTeams.map(team => (
                        <td key={team.id} className="px-4 py-3 text-center">
                          <span className="text-sm font-bold text-purple-600">{team.mental}</span>
                        </td>
                      ))}
                    </tr>
                    <tr className="hover:bg-slate-50 bg-red-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">Defending</td>
                      {selectedTeams.map(team => (
                        <td key={team.id} className="px-4 py-3 text-center">
                          <span className="text-sm font-bold text-red-600">{team.defending}</span>
                        </td>
                      ))}
                    </tr>
                    <tr className="hover:bg-slate-50 bg-green-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">Attacking</td>
                      {selectedTeams.map(team => (
                        <td key={team.id} className="px-4 py-3 text-center">
                          <span className="text-sm font-bold text-green-600">{team.attacking}</span>
                        </td>
                      ))}
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">Assessment Rate</td>
                      {selectedTeams.map(team => (
                        <td key={team.id} className="px-4 py-3 text-center text-sm">{team.assessmentRate}%</td>
                      ))}
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">Retention Rate</td>
                      {selectedTeams.map(team => (
                        <td key={team.id} className="px-4 py-3 text-center text-sm">{team.retentionRate}%</td>
                      ))}
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">Registration Rate</td>
                      {selectedTeams.map(team => (
                        <td key={team.id} className="px-4 py-3 text-center text-sm">{team.registrationRate}%</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}