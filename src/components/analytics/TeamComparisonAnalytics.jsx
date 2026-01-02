import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, LineChart, Line } from 'recharts';

export default function TeamComparisonAnalytics({ teams, assessments, evaluations, players }) {
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [comparisonMetric, setComparisonMetric] = useState('physical');

  const getTeamStats = (teamId) => {
    const teamPlayers = players.filter(p => p.team_id === teamId);
    const teamPlayerIds = teamPlayers?.map(p => p.id) || [];
    const teamAssessments = assessments.filter(a => teamPlayerIds.includes(a.player_id));
    const teamEvaluations = evaluations.filter(e => teamPlayerIds.includes(e.player_id));

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

    const assessmentsList = Object.values(latestAssessments);
    const evalsList = Object.values(latestEvals);

    const avg = (list, key) => list.length > 0 ? Math.round(list.reduce((sum, item) => sum + (item[key] || 0), 0) / list.length) : 0;

    return {
      teamId,
      playerCount: teamPlayers.length,
      avgSpeed: avg(assessmentsList, 'speed_score'),
      avgPower: avg(assessmentsList, 'power_score'),
      avgEndurance: avg(assessmentsList, 'endurance_score'),
      avgAgility: avg(assessmentsList, 'agility_score'),
      avgOverall: avg(assessmentsList, 'overall_score'),
      avgMental: Math.round((avg(evalsList, 'growth_mindset') + avg(evalsList, 'resilience') + avg(evalsList, 'team_focus')) / 3),
      avgDefending: Math.round((avg(evalsList, 'defending_organized') + avg(evalsList, 'defending_final_third') + avg(evalsList, 'defending_transition')) / 3),
      avgAttacking: Math.round((avg(evalsList, 'attacking_organized') + avg(evalsList, 'attacking_final_third') + avg(evalsList, 'attacking_in_transition')) / 3),
      avgAthleticism: avg(evalsList, 'athleticism'),
      assessmentRate: teamPlayers.length > 0 ? Math.round((assessmentsList.length / teamPlayers.length) * 100) : 0,
      evaluationRate: teamPlayers.length > 0 ? Math.round((evalsList.length / teamPlayers.length) * 100) : 0
    };
  };

  const comparisonData = selectedTeams?.map(teamId => {
    const team = teams.find(t => t.id === teamId);
    const stats = getTeamStats(teamId);
    return {
      name: team?.name || 'Unknown',
      ...stats
    };
  });

  const radarData = comparisonMetric === 'physical' ? [
    { attribute: 'Speed', ...selectedTeams.reduce((acc, teamId, idx) => ({ ...acc, [`team${idx}`]: comparisonData[idx]?.avgSpeed || 0 }), {}) },
    { attribute: 'Power', ...selectedTeams.reduce((acc, teamId, idx) => ({ ...acc, [`team${idx}`]: comparisonData[idx]?.avgPower || 0 }), {}) },
    { attribute: 'Endurance', ...selectedTeams.reduce((acc, teamId, idx) => ({ ...acc, [`team${idx}`]: comparisonData[idx]?.avgEndurance || 0 }), {}) },
    { attribute: 'Agility', ...selectedTeams.reduce((acc, teamId, idx) => ({ ...acc, [`team${idx}`]: comparisonData[idx]?.avgAgility || 0 }), {}) },
  ] : [
    { attribute: 'Mental', ...selectedTeams.reduce((acc, teamId, idx) => ({ ...acc, [`team${idx}`]: comparisonData[idx]?.avgMental || 0 }), {}) },
    { attribute: 'Defending', ...selectedTeams.reduce((acc, teamId, idx) => ({ ...acc, [`team${idx}`]: comparisonData[idx]?.avgDefending || 0 }), {}) },
    { attribute: 'Attacking', ...selectedTeams.reduce((acc, teamId, idx) => ({ ...acc, [`team${idx}`]: comparisonData[idx]?.avgAttacking || 0 }), {}) },
    { attribute: 'Athleticism', ...selectedTeams.reduce((acc, teamId, idx) => ({ ...acc, [`team${idx}`]: comparisonData[idx]?.avgAthleticism || 0 }), {}) },
  ];

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Team Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Teams to Compare (max 5)</label>
              <div className="space-y-2">
                {teams?.filter(t => t.name && typeof t.name === 'string')?.slice(0, 10)?.map(team => (
                  <label key={team.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTeams.includes(team.id)}
                      onChange={(e) => {
                        if (e.target.checked && selectedTeams.length < 5) {
                          setSelectedTeams([...selectedTeams, team.id]);
                        } else if (!e.target.checked) {
                          setSelectedTeams(selectedTeams.filter(id => id !== team.id));
                        }
                      }}
                      className="rounded border-slate-300"
                    />
                    <span className="text-sm">{team.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Comparison Type</label>
              <Select value={comparisonMetric} onValueChange={setComparisonMetric}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="physical">Physical Performance</SelectItem>
                  <SelectItem value="skills">Skills & Evaluation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedTeams.length >= 2 && (
            <>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <Card className="bg-slate-50">
                  <CardHeader>
                    <CardTitle className="text-sm">Comparative Radar Chart</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="attribute" tick={{ fontSize: 11 }} />
                        <PolarRadiusAxis domain={[0, comparisonMetric === 'physical' ? 100 : 10]} tick={{ fontSize: 10 }} />
                        {selectedTeams?.map((teamId, idx) => {
                          const team = teams.find(t => t.id === teamId);
                          return (
                            <Radar
                              key={teamId}
                              name={team?.name || `Team ${idx + 1}`}
                              dataKey={`team${idx}`}
                              stroke={COLORS[idx]}
                              fill={COLORS[idx]}
                              fillOpacity={0.2}
                              strokeWidth={2}
                            />
                          );
                        })}
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-slate-50">
                  <CardHeader>
                    <CardTitle className="text-sm">Overall Performance Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={comparisonData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, comparisonMetric === 'physical' ? 100 : 10]} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey={comparisonMetric === 'physical' ? 'avgOverall' : 'avgMental'} fill="#10b981" name="Overall" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-gradient-to-br from-emerald-50 to-white">
                <CardHeader>
                  <CardTitle className="text-sm">Team Statistics Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="px-3 py-2 text-left">Team</th>
                          <th className="px-3 py-2 text-center">Players</th>
                          <th className="px-3 py-2 text-center">Assessed</th>
                          <th className="px-3 py-2 text-center">Speed</th>
                          <th className="px-3 py-2 text-center">Power</th>
                          <th className="px-3 py-2 text-center">Endurance</th>
                          <th className="px-3 py-2 text-center">Agility</th>
                          <th className="px-3 py-2 text-center">Overall</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonData?.map((data, idx) => (
                          <tr key={idx} className="border-b hover:bg-slate-50">
                            <td className="px-3 py-2 font-medium">{data.name}</td>
                            <td className="px-3 py-2 text-center">{data.playerCount}</td>
                            <td className="px-3 py-2 text-center">
                              <Badge className="bg-blue-100 text-blue-800">{data.assessmentRate}%</Badge>
                            </td>
                            <td className="px-3 py-2 text-center font-semibold text-red-600">{data.avgSpeed}</td>
                            <td className="px-3 py-2 text-center font-semibold text-blue-600">{data.avgPower}</td>
                            <td className="px-3 py-2 text-center font-semibold text-emerald-600">{data.avgEndurance}</td>
                            <td className="px-3 py-2 text-center font-semibold text-pink-600">{data.avgAgility}</td>
                            <td className="px-3 py-2 text-center font-bold text-slate-900">{data.avgOverall}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {selectedTeams.length < 2 && (
            <div className="text-center py-12 text-slate-500">
              <p>Select at least 2 teams to compare</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}