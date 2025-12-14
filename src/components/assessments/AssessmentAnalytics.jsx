import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';

export default function AssessmentAnalytics({ assessments, players }) {
  const [selectedPlayer, setSelectedPlayer] = useState('all');
  const [comparePlayer1, setComparePlayer1] = useState('');
  const [comparePlayer2, setComparePlayer2] = useState('');

  // Filter assessments by player
  const filteredAssessments = selectedPlayer === 'all' 
    ? assessments 
    : assessments.filter(a => a.player_id === selectedPlayer);

  // Get historical trend data
  const trendData = filteredAssessments
    .slice()
    .reverse()
    .map(a => ({
      date: new Date(a.assessment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: a.assessment_date,
      Speed: a.speed_score || 0,
      Power: a.power_score || 0,
      Endurance: a.endurance_score || 0,
      Agility: a.agility_score || 0,
      Overall: a.overall_score || 0,
      sprint: a.sprint,
      vertical: a.vertical,
      yirt: a.yirt,
      shuttle: a.shuttle
    }));

  // Calculate improvements
  const calculateImprovement = (metric) => {
    if (filteredAssessments.length < 2) return null;
    const latest = filteredAssessments[0];
    const previous = filteredAssessments[1];
    const change = (latest[metric] || 0) - (previous[metric] || 0);
    const percentChange = previous[metric] ? ((change / previous[metric]) * 100) : 0;
    return { change, percentChange };
  };

  // Comparison data
  const getComparisonData = () => {
    if (!comparePlayer1 || !comparePlayer2) return null;

    const p1Assessments = assessments.filter(a => a.player_id === comparePlayer1);
    const p2Assessments = assessments.filter(a => a.player_id === comparePlayer2);

    if (p1Assessments.length === 0 || p2Assessments.length === 0) return null;

    const p1Latest = p1Assessments[0];
    const p2Latest = p2Assessments[0];
    const p1Player = players.find(p => p.id === comparePlayer1);
    const p2Player = players.find(p => p.id === comparePlayer2);

    return {
      players: [p1Player?.full_name || 'Player 1', p2Player?.full_name || 'Player 2'],
      data: [
        {
          metric: 'Speed',
          [p1Player?.full_name || 'Player 1']: p1Latest.speed_score || 0,
          [p2Player?.full_name || 'Player 2']: p2Latest.speed_score || 0
        },
        {
          metric: 'Power',
          [p1Player?.full_name || 'Player 1']: p1Latest.power_score || 0,
          [p2Player?.full_name || 'Player 2']: p2Latest.power_score || 0
        },
        {
          metric: 'Endurance',
          [p1Player?.full_name || 'Player 1']: p1Latest.endurance_score || 0,
          [p2Player?.full_name || 'Player 2']: p2Latest.endurance_score || 0
        },
        {
          metric: 'Agility',
          [p1Player?.full_name || 'Player 1']: p1Latest.agility_score || 0,
          [p2Player?.full_name || 'Player 2']: p2Latest.agility_score || 0
        },
        {
          metric: 'Overall',
          [p1Player?.full_name || 'Player 1']: p1Latest.overall_score || 0,
          [p2Player?.full_name || 'Player 2']: p2Latest.overall_score || 0
        }
      ]
    };
  };

  const comparisonData = getComparisonData();

  const metrics = [
    { key: 'speed_score', label: 'Speed', color: '#ef4444' },
    { key: 'power_score', label: 'Power', color: '#3b82f6' },
    { key: 'endurance_score', label: 'Endurance', color: '#10b981' },
    { key: 'agility_score', label: 'Agility', color: '#ec4899' },
    { key: 'overall_score', label: 'Overall', color: '#64748b' }
  ];

  const playersWithAssessments = players.filter(p => 
    assessments.some(a => a.player_id === p.id)
  );

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-xl bg-gradient-to-br from-emerald-50 to-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              Assessment Analytics
            </CardTitle>
            <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select player" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Players - Aggregate</SelectItem>
                {playersWithAssessments.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAssessments.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No assessment data available</p>
          ) : (
            <div className="space-y-6">
              {/* Improvement Indicators */}
              {filteredAssessments.length >= 2 && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {metrics.map(({ key, label, color }) => {
                    const improvement = calculateImprovement(key);
                    if (!improvement) return null;
                    
                    return (
                      <div key={key} className="p-3 bg-white rounded-lg border-2 border-slate-200">
                        <div className="text-xs text-slate-600 mb-1">{label}</div>
                        <div className="flex items-center gap-2">
                          <div className="text-2xl font-bold" style={{ color }}>
                            {filteredAssessments[0][key] || 0}
                          </div>
                          {improvement.change !== 0 && (
                            <Badge className={`text-[9px] ${improvement.change > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                              {improvement.change > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                              {improvement.change > 0 ? '+' : ''}{improvement.change.toFixed(0)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Historical Trends Chart */}
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold text-sm text-slate-900 mb-3">Performance Trends Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ fontSize: 11 }} 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border rounded shadow-lg text-xs">
                              <p className="font-bold mb-2">{data.date}</p>
                              <div className="space-y-1 mb-2">
                                <p className="text-slate-600">Sprint: {data.sprint?.toFixed(2)}s</p>
                                <p className="text-slate-600">Vertical: {data.vertical}"</p>
                                <p className="text-slate-600">YIRT: {data.yirt}</p>
                                <p className="text-slate-600">Shuttle: {data.shuttle?.toFixed(2)}s</p>
                              </div>
                              <hr className="my-1" />
                              {payload.map((p, i) => (
                                <p key={i} style={{ color: p.color }} className="font-semibold">
                                  {p.name}: {p.value}
                                </p>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="Speed" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Power" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Endurance" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Agility" stroke="#ec4899" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Overall" stroke="#64748b" strokeWidth={3} dot={{ r: 5 }} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Side-by-Side Comparison */}
      <Card className="border-none shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg">Player Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-2 block">Player 1</label>
              <Select value={comparePlayer1} onValueChange={setComparePlayer1}>
                <SelectTrigger>
                  <SelectValue placeholder="Select player" />
                </SelectTrigger>
                <SelectContent>
                  {playersWithAssessments.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-2 block">Player 2</label>
              <Select value={comparePlayer2} onValueChange={setComparePlayer2}>
                <SelectTrigger>
                  <SelectValue placeholder="Select player" />
                </SelectTrigger>
                <SelectContent>
                  {playersWithAssessments.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {comparisonData ? (
            <div className="bg-white p-4 rounded-lg border">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="metric" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey={comparisonData.players[0]} fill="#10b981" />
                  <Bar dataKey={comparisonData.players[1]} fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">
              Select two players to compare their latest assessments
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}