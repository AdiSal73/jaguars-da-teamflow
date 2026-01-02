import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { TrendingUp, BarChart3, Target, Users } from 'lucide-react';
import { Label } from '@/components/ui/label';

const POSITIONS = ['GK', 'Right Outside Back', 'Left Outside Back', 'Right Centerback', 'Left Centerback', 'Defensive Midfielder', 'Right Winger', 'Center Midfielder', 'Forward', 'Attacking Midfielder', 'Left Winger'];

export default function AdvancedAnalytics() {
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [metricType, setMetricType] = useState('physical');
  const [timeRange, setTimeRange] = useState('all');
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');

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
    queryFn: () => base44.entities.Evaluation.list('-created_date')
  });

  const filteredPlayers = players.filter(p => {
    const teamMatch = selectedTeam === 'all' || p.team_id === selectedTeam;
    const positionMatch = selectedPosition === 'all' || p.primary_position === selectedPosition;
    return teamMatch && positionMatch;
  });

  const togglePlayer = (playerId) => {
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter(id => id !== playerId));
    } else {
      setSelectedPlayers([...selectedPlayers, playerId]);
    }
  };

  const playerPerformanceData = useMemo(() => {
    return selectedPlayers?.map(playerId => {
      const player = players.find(p => p.id === playerId);
      const playerAssessments = assessments.filter(a => a.player_id === playerId);
      const playerEvaluations = evaluations.filter(e => e.player_id === playerId);

      const timelineData = [];

      if (metricType === 'physical') {
        playerAssessments.forEach(a => {
          timelineData.push({
            date: new Date(a.assessment_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            speed: a.speed_score || 0,
            power: a.power_score || 0,
            endurance: a.endurance_score || 0,
            agility: a.agility_score || 0,
            overall: a.overall_score || 0
          });
        });
      } else {
        playerEvaluations.forEach(e => {
          timelineData.push({
            date: new Date(e.created_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            mental: Math.round(((e.growth_mindset || 0) + (e.resilience || 0) + (e.team_focus || 0)) / 3),
            defending: Math.round(((e.defending_organized || 0) + (e.defending_final_third || 0) + (e.defending_transition || 0)) / 3),
            attacking: Math.round(((e.attacking_organized || 0) + (e.attacking_final_third || 0) + (e.attacking_in_transition || 0)) / 3),
            athleticism: e.athleticism || 0
          });
        });
      }

      return {
        player,
        data: timelineData.sort((a, b) => new Date(a.date) - new Date(b.date))
      };
    });
  }, [selectedPlayers, assessments, evaluations, metricType, players]);

  const positionHeatmapData = useMemo(() => {
    const heatmap = {};

    POSITIONS.forEach(position => {
      const positionPlayers = players.filter(p => p.primary_position === position);
      const positionAssessments = assessments.filter(a => 
        positionPlayers.some(p => p.id === a.player_id)
      );
      const positionEvaluations = evaluations.filter(e => 
        positionPlayers.some(p => p.id === e.player_id)
      );

      if (positionAssessments.length > 0) {
        heatmap[position] = {
          position,
          playerCount: positionPlayers.length,
          avgSpeed: Math.round(positionAssessments.reduce((sum, a) => sum + (a.speed_score || 0), 0) / positionAssessments.length),
          avgPower: Math.round(positionAssessments.reduce((sum, a) => sum + (a.power_score || 0), 0) / positionAssessments.length),
          avgEndurance: Math.round(positionAssessments.reduce((sum, a) => sum + (a.endurance_score || 0), 0) / positionAssessments.length),
          avgAgility: Math.round(positionAssessments.reduce((sum, a) => sum + (a.agility_score || 0), 0) / positionAssessments.length),
          avgOverall: Math.round(positionAssessments.reduce((sum, a) => sum + (a.overall_score || 0), 0) / positionAssessments.length),
        };

        if (positionEvaluations.length > 0) {
          const latestByPlayer = {};
          positionEvaluations.forEach(e => {
            if (!latestByPlayer[e.player_id] || new Date(e.created_date) > new Date(latestByPlayer[e.player_id].created_date)) {
              latestByPlayer[e.player_id] = e;
            }
          });
          const latestEvals = Object.values(latestByPlayer);
          
          heatmap[position].avgMental = Math.round(latestEvals.reduce((sum, e) => sum + ((e.growth_mindset || 0) + (e.resilience || 0) + (e.team_focus || 0)) / 3, 0) / latestEvals.length);
          heatmap[position].avgDefending = Math.round(latestEvals.reduce((sum, e) => sum + ((e.defending_organized || 0) + (e.defending_final_third || 0) + (e.defending_transition || 0)) / 3, 0) / latestEvals.length);
          heatmap[position].avgAttacking = Math.round(latestEvals.reduce((sum, e) => sum + ((e.attacking_organized || 0) + (e.attacking_final_third || 0) + (e.attacking_in_transition || 0)) / 3, 0) / latestEvals.length);
        }
      }
    });

    return Object.values(heatmap);
  }, [players, assessments, evaluations]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];

  const getHeatColor = (value, max = 100) => {
    const intensity = value / max;
    if (intensity > 0.8) return 'bg-green-500';
    if (intensity > 0.6) return 'bg-emerald-400';
    if (intensity > 0.4) return 'bg-yellow-400';
    if (intensity > 0.2) return 'bg-orange-400';
    return 'bg-red-400';
  };

  return (
    <div className="p-4 md:p-8 max-w-[1800px] mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Advanced Analytics Dashboard</h1>
        <p className="text-slate-600">Deep performance insights and player comparisons</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div>
          <Label className="mb-2 block">Metric Type</Label>
          <Select value={metricType} onValueChange={setMetricType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="physical">Physical Assessments</SelectItem>
              <SelectItem value="evaluation">Evaluations</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-2 block">Position Filter</Label>
          <Select value={selectedPosition} onValueChange={setSelectedPosition}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Positions</SelectItem>
              {POSITIONS?.map(pos => (
                <SelectItem key={pos} value={pos}>{pos}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-2 block">Team Filter</Label>
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams?.filter(team => team.name && typeof team.name === 'string')?.map(team => (
                <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-none shadow-lg mb-6">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Select Players to Compare ({selectedPlayers.length} selected)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto">
            {filteredPlayers?.map(player => {
              const team = teams.find(t => t.id === player.team_id);
              const isSelected = selectedPlayers.includes(player.id);
              return (
                <div
                  key={player.id}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => togglePlayer(player.id)}
                >
                  <div className="flex items-start gap-2">
                    <Checkbox checked={isSelected} className="mt-1" />
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-slate-900">{player.full_name}</div>
                      <div className="text-xs text-slate-600">{player.primary_position}</div>
                      {team && <div className="text-xs text-slate-500">{team.name}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedPlayers.length > 0 && (
        <Card className="border-none shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Performance Over Time
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={400}>
              {metricType === 'physical' ? (
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {playerPerformanceData?.map((playerData, idx) => (
                    <React.Fragment key={playerData.player.id}>
                      <Line 
                        data={playerData.data}
                        type="monotone" 
                        dataKey="overall" 
                        stroke={COLORS[idx % COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name={playerData.player.full_name}
                      />
                    </React.Fragment>
                  ))}
                </LineChart>
              ) : (
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {playerPerformanceData?.map((playerData, idx) => (
                    <React.Fragment key={playerData.player.id}>
                      <Line 
                        data={playerData.data}
                        type="monotone" 
                        dataKey="mental" 
                        stroke={COLORS[idx % COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name={`${playerData.player.full_name} - Mental`}
                      />
                    </React.Fragment>
                  ))}
                </LineChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card className="border-none shadow-lg mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Position-Specific Performance Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2">
                  <th className="text-left p-3 text-sm font-bold text-slate-700">Position</th>
                  <th className="text-center p-3 text-sm font-bold text-slate-700">Players</th>
                  <th className="text-center p-3 text-sm font-bold text-slate-700">Speed</th>
                  <th className="text-center p-3 text-sm font-bold text-slate-700">Power</th>
                  <th className="text-center p-3 text-sm font-bold text-slate-700">Endurance</th>
                  <th className="text-center p-3 text-sm font-bold text-slate-700">Agility</th>
                  <th className="text-center p-3 text-sm font-bold text-slate-700">Overall</th>
                  <th className="text-center p-3 text-sm font-bold text-slate-700">Mental</th>
                  <th className="text-center p-3 text-sm font-bold text-slate-700">Defending</th>
                  <th className="text-center p-3 text-sm font-bold text-slate-700">Attacking</th>
                </tr>
              </thead>
              <tbody>
                {positionHeatmapData?.map(pos => (
                  <tr key={pos.position} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-semibold text-sm text-slate-900">{pos.position}</td>
                    <td className="p-3 text-center">
                      <Badge variant="outline">{pos.playerCount}</Badge>
                    </td>
                    <td className="p-3">
                      <div className={`w-full h-8 ${getHeatColor(pos.avgSpeed)} rounded flex items-center justify-center text-white font-bold text-sm`}>
                        {pos.avgSpeed}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className={`w-full h-8 ${getHeatColor(pos.avgPower)} rounded flex items-center justify-center text-white font-bold text-sm`}>
                        {pos.avgPower}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className={`w-full h-8 ${getHeatColor(pos.avgEndurance)} rounded flex items-center justify-center text-white font-bold text-sm`}>
                        {pos.avgEndurance}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className={`w-full h-8 ${getHeatColor(pos.avgAgility)} rounded flex items-center justify-center text-white font-bold text-sm`}>
                        {pos.avgAgility}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className={`w-full h-8 ${getHeatColor(pos.avgOverall)} rounded flex items-center justify-center text-white font-bold text-sm`}>
                        {pos.avgOverall}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className={`w-full h-8 ${getHeatColor(pos.avgMental || 0, 10)} rounded flex items-center justify-center text-white font-bold text-sm`}>
                        {pos.avgMental || 'N/A'}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className={`w-full h-8 ${getHeatColor(pos.avgDefending || 0, 10)} rounded flex items-center justify-center text-white font-bold text-sm`}>
                        {pos.avgDefending || 'N/A'}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className={`w-full h-8 ${getHeatColor(pos.avgAttacking || 0, 10)} rounded flex items-center justify-center text-white font-bold text-sm`}>
                        {pos.avgAttacking || 'N/A'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-500 rounded"></div>
              <span>Excellent (80-100)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-emerald-400 rounded"></div>
              <span>Good (60-80)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-400 rounded"></div>
              <span>Average (40-60)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-orange-400 rounded"></div>
              <span>Below Avg (20-40)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-400 rounded"></div>
              <span>Needs Work (0-20)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedPlayers.length > 0 && metricType === 'physical' && (
        <div className="grid md:grid-cols-2 gap-6">
          {['speed', 'power', 'endurance', 'agility']?.map(metric => (
            <Card key={metric} className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-base capitalize">{metric} Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={playerPerformanceData.flatMap(pd => 
                    pd.data.map(d => ({
                      ...d,
                      player: pd.player.full_name
                    }))
                  )}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {playerPerformanceData?.map((pd, idx) => (
                      <Bar 
                        key={pd.player.id}
                        data={pd.data}
                        dataKey={metric}
                        fill={COLORS[idx % COLORS.length]}
                        name={pd.player.full_name}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}