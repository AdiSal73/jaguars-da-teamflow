import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

const PHYSICAL_METRICS = ['speed_score', 'power_score', 'endurance_score', 'agility_score', 'overall_score'];
const MENTAL_METRICS = ['growth_mindset', 'resilience', 'efficiency_in_execution', 'athleticism', 'team_focus'];
const DEFENDING_METRICS = ['defending_organized', 'defending_final_third', 'defending_transition'];
const ATTACKING_METRICS = ['attacking_organized', 'attacking_final_third', 'attacking_in_transition'];

const METRIC_LABELS = {
  speed_score: 'Speed', power_score: 'Power', endurance_score: 'Endurance', agility_score: 'Agility', overall_score: 'Overall',
  growth_mindset: 'Growth Mindset', resilience: 'Resilience', efficiency_in_execution: 'Efficiency', athleticism: 'Athleticism', team_focus: 'Team Focus',
  defending_organized: 'Def Organized', defending_final_third: 'Def Final Third', defending_transition: 'Def Transition',
  attacking_organized: 'Att Organized', attacking_final_third: 'Att Final Third', attacking_in_transition: 'Att Transition'
};

export default function EnhancedPlayerComparisonModal({ open, onClose, players, assessments, evaluations, tryouts }) {
  const [selectedMetrics, setSelectedMetrics] = useState([...PHYSICAL_METRICS]);
  const [assessmentDateIndex, setAssessmentDateIndex] = useState({});
  const [evaluationDateIndex, setEvaluationDateIndex] = useState({});

  // Get all assessments and evaluations per player sorted by date
  const playerDataMap = useMemo(() => {
    const map = {};
    players.forEach(player => {
      const playerAssessments = assessments
        .filter(a => a.player_id === player.id)
        .sort((a, b) => new Date(b.assessment_date) - new Date(a.assessment_date));
      const playerEvaluations = evaluations
        .filter(e => e.player_id === player.id)
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      const tryout = tryouts.find(t => t.player_id === player.id);
      map[player.id] = { player, assessments: playerAssessments, evaluations: playerEvaluations, tryout };
    });
    return map;
  }, [players, assessments, evaluations, tryouts]);

  // Initialize date indices
  useMemo(() => {
    const aIdx = {}, eIdx = {};
    players.forEach(p => { aIdx[p.id] = 0; eIdx[p.id] = 0; });
    setAssessmentDateIndex(aIdx);
    setEvaluationDateIndex(eIdx);
  }, [players]);

  const cycleAssessment = (playerId, direction) => {
    const max = playerDataMap[playerId]?.assessments?.length || 1;
    setAssessmentDateIndex(prev => ({
      ...prev,
      [playerId]: Math.max(0, Math.min(max - 1, (prev[playerId] || 0) + direction))
    }));
  };

  const cycleEvaluation = (playerId, direction) => {
    const max = playerDataMap[playerId]?.evaluations?.length || 1;
    setEvaluationDateIndex(prev => ({
      ...prev,
      [playerId]: Math.max(0, Math.min(max - 1, (prev[playerId] || 0) + direction))
    }));
  };

  const getCurrentAssessment = (playerId) => {
    return playerDataMap[playerId]?.assessments?.[assessmentDateIndex[playerId] || 0];
  };

  const getCurrentEvaluation = (playerId) => {
    return playerDataMap[playerId]?.evaluations?.[evaluationDateIndex[playerId] || 0];
  };

  // Build comparison data for selected metrics
  const comparisonBarData = useMemo(() => {
    return selectedMetrics.map(metric => {
      const row = { metric: METRIC_LABELS[metric] || metric };
      players.forEach((p, i) => {
        const assessment = getCurrentAssessment(p.id);
        const evaluation = getCurrentEvaluation(p.id);
        row[`player${i}`] = assessment?.[metric] || evaluation?.[metric] || 0;
      });
      return row;
    });
  }, [players, selectedMetrics, assessmentDateIndex, evaluationDateIndex, playerDataMap]);

  // Radar data
  const radarData = useMemo(() => {
    return selectedMetrics.slice(0, 8).map(metric => {
      const row = { attribute: METRIC_LABELS[metric] || metric };
      players.forEach((p, i) => {
        const assessment = getCurrentAssessment(p.id);
        const evaluation = getCurrentEvaluation(p.id);
        row[`player${i}`] = assessment?.[metric] || evaluation?.[metric] || 0;
      });
      return row;
    });
  }, [players, selectedMetrics, assessmentDateIndex, evaluationDateIndex, playerDataMap]);

  // Trend data (all assessments over time)
  const trendData = useMemo(() => {
    const allDates = new Set();
    players.forEach(p => {
      (playerDataMap[p.id]?.assessments || []).forEach(a => allDates.add(a.assessment_date));
    });
    const sortedDates = [...allDates].sort();
    return sortedDates.map(date => {
      const row = { date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
      players.forEach((p, i) => {
        const assessment = playerDataMap[p.id]?.assessments?.find(a => a.assessment_date === date);
        row[`player${i}`] = assessment?.overall_score || null;
      });
      return row;
    });
  }, [players, playerDataMap]);

  const toggleMetric = (metric) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) ? prev.filter(m => m !== metric) : [...prev, metric]
    );
  };

  if (!players || players.length === 0) return null;

  const maxDomain = selectedMetrics.some(m => PHYSICAL_METRICS.includes(m)) ? 100 : 10;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Player Comparison ({players.length} players)</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="comparison" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
            <TabsTrigger value="radar">Radar</TabsTrigger>
            <TabsTrigger value="trend">Trend Analysis</TabsTrigger>
            <TabsTrigger value="table">Details</TabsTrigger>
          </TabsList>

          {/* Player Cards with Date Cycling */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 my-4">
            {players.map((player, idx) => {
              const pd = playerDataMap[player.id];
              const currentAssessment = getCurrentAssessment(player.id);
              const currentEvaluation = getCurrentEvaluation(player.id);
              return (
                <div key={player.id} className="p-2 rounded-lg border-2 text-xs" style={{ borderColor: COLORS[idx % COLORS.length] }}>
                  <div className="flex items-center gap-1 mb-1">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[10px]" style={{ backgroundColor: COLORS[idx % COLORS.length] }}>
                      {player.jersey_number || idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{player.full_name}</div>
                      <div className="text-[10px] text-slate-500">{player.primary_position}</div>
                    </div>
                  </div>
                  {/* Assessment date cycler */}
                  {pd.assessments.length > 0 && (
                    <div className="flex items-center justify-between bg-slate-50 rounded px-1 py-0.5 mb-1">
                      <button onClick={() => cycleAssessment(player.id, 1)} disabled={(assessmentDateIndex[player.id] || 0) >= pd.assessments.length - 1} className="disabled:opacity-30">
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <span className="text-[9px]">
                        {currentAssessment ? new Date(currentAssessment.assessment_date).toLocaleDateString() : '-'}
                      </span>
                      <button onClick={() => cycleAssessment(player.id, -1)} disabled={(assessmentDateIndex[player.id] || 0) <= 0} className="disabled:opacity-30">
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {pd?.tryout?.team_role && (
                    <Badge className="text-[8px] bg-purple-100 text-purple-800">{pd.tryout.team_role}</Badge>
                  )}
                </div>
              );
            })}
          </div>

          {/* Metric Selection */}
          <div className="p-3 bg-slate-50 rounded-lg mb-4">
            <div className="text-xs font-semibold mb-2">Select Metrics to Compare:</div>
            <div className="flex flex-wrap gap-2">
              {[...PHYSICAL_METRICS, ...MENTAL_METRICS, ...DEFENDING_METRICS, ...ATTACKING_METRICS].map(metric => (
                <label key={metric} className="flex items-center gap-1 text-xs cursor-pointer">
                  <Checkbox checked={selectedMetrics.includes(metric)} onCheckedChange={() => toggleMetric(metric)} />
                  <span>{METRIC_LABELS[metric]}</span>
                </label>
              ))}
            </div>
          </div>

          <TabsContent value="comparison">
            <div className="bg-white p-4 rounded-xl">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={comparisonBarData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis domain={[0, maxDomain]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  {players.map((p, idx) => (
                    <Bar key={idx} dataKey={`player${idx}`} name={p.full_name} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="radar">
            <div className="bg-white p-4 rounded-xl">
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="attribute" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis domain={[0, maxDomain]} tick={{ fontSize: 8 }} />
                  {players.map((p, idx) => (
                    <Radar key={idx} name={p.full_name} dataKey={`player${idx}`} stroke={COLORS[idx % COLORS.length]} fill={COLORS[idx % COLORS.length]} fillOpacity={0.2} />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="trend">
            <div className="bg-white p-4 rounded-xl">
              <h3 className="font-semibold mb-2">Overall Score Trend Over Time</h3>
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    {players.map((p, idx) => (
                      <Line key={idx} type="monotone" dataKey={`player${idx}`} name={p.full_name} stroke={COLORS[idx % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-slate-500 py-8">No assessment history available</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="table">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-2 text-left">Metric</th>
                    {players.map((p, idx) => (
                      <th key={idx} className="p-2 text-center" style={{ color: COLORS[idx % COLORS.length] }}>
                        {p.full_name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedMetrics.map((metric, i) => (
                    <tr key={metric} className={i % 2 === 0 ? 'bg-slate-50' : ''}>
                      <td className="p-2 font-medium">{METRIC_LABELS[metric]}</td>
                      {players.map((p, idx) => {
                        const assessment = getCurrentAssessment(p.id);
                        const evaluation = getCurrentEvaluation(p.id);
                        const value = assessment?.[metric] || evaluation?.[metric] || '-';
                        return <td key={idx} className="p-2 text-center">{value}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}