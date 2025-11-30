import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];

export default function PlayerComparisonModal({ open, onClose, players, assessments, evaluations, tryouts }) {
  if (!players || players.length === 0) return null;

  const getPlayerData = (player) => {
    const playerAssessments = assessments.filter(a => a.player_id === player.id);
    const latestAssessment = playerAssessments.sort((a, b) => new Date(b.assessment_date) - new Date(a.assessment_date))[0];
    
    const playerEvaluations = evaluations.filter(e => e.player_id === player.id);
    const latestEvaluation = playerEvaluations.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
    
    const tryout = tryouts.find(t => t.player_id === player.id);
    const birthYear = player.date_of_birth ? new Date(player.date_of_birth).getFullYear() : null;

    return { player, latestAssessment, latestEvaluation, tryout, birthYear };
  };

  const playersData = players.map(getPlayerData);

  // Physical Assessment Data
  const physicalComparisonData = [
    { metric: 'Speed', ...Object.fromEntries(playersData.map((pd, i) => [`player${i}`, pd.latestAssessment?.speed_score || 0])) },
    { metric: 'Power', ...Object.fromEntries(playersData.map((pd, i) => [`player${i}`, pd.latestAssessment?.power_score || 0])) },
    { metric: 'Endurance', ...Object.fromEntries(playersData.map((pd, i) => [`player${i}`, pd.latestAssessment?.endurance_score || 0])) },
    { metric: 'Agility', ...Object.fromEntries(playersData.map((pd, i) => [`player${i}`, pd.latestAssessment?.agility_score || 0])) },
    { metric: 'Overall', ...Object.fromEntries(playersData.map((pd, i) => [`player${i}`, pd.latestAssessment?.overall_score || 0])) },
  ];

  // Mental & Physical Data
  const mentalPhysicalData = [
    { metric: 'Growth Mindset', ...Object.fromEntries(playersData.map((pd, i) => [`player${i}`, pd.latestEvaluation?.growth_mindset || 0])) },
    { metric: 'Resilience', ...Object.fromEntries(playersData.map((pd, i) => [`player${i}`, pd.latestEvaluation?.resilience || 0])) },
    { metric: 'Efficiency', ...Object.fromEntries(playersData.map((pd, i) => [`player${i}`, pd.latestEvaluation?.efficiency_in_execution || 0])) },
    { metric: 'Athleticism', ...Object.fromEntries(playersData.map((pd, i) => [`player${i}`, pd.latestEvaluation?.athleticism || 0])) },
    { metric: 'Team Focus', ...Object.fromEntries(playersData.map((pd, i) => [`player${i}`, pd.latestEvaluation?.team_focus || 0])) },
  ];

  // Defending Data
  const defendingData = [
    { metric: 'Organized', ...Object.fromEntries(playersData.map((pd, i) => [`player${i}`, pd.latestEvaluation?.defending_organized || 0])) },
    { metric: 'Final Third', ...Object.fromEntries(playersData.map((pd, i) => [`player${i}`, pd.latestEvaluation?.defending_final_third || 0])) },
    { metric: 'Transition', ...Object.fromEntries(playersData.map((pd, i) => [`player${i}`, pd.latestEvaluation?.defending_transition || 0])) },
  ];

  // Attacking Data
  const attackingData = [
    { metric: 'Organized', ...Object.fromEntries(playersData.map((pd, i) => [`player${i}`, pd.latestEvaluation?.attacking_organized || 0])) },
    { metric: 'Final Third', ...Object.fromEntries(playersData.map((pd, i) => [`player${i}`, pd.latestEvaluation?.attacking_final_third || 0])) },
    { metric: 'In Transition', ...Object.fromEntries(playersData.map((pd, i) => [`player${i}`, pd.latestEvaluation?.attacking_in_transition || 0])) },
  ];

  // Radar data for physical
  const radarData = ['Speed', 'Power', 'Endurance', 'Agility'].map(attr => ({
    attribute: attr,
    ...Object.fromEntries(playersData.map((pd, i) => [
      `player${i}`,
      attr === 'Speed' ? pd.latestAssessment?.speed_score || 0 :
      attr === 'Power' ? pd.latestAssessment?.power_score || 0 :
      attr === 'Endurance' ? pd.latestAssessment?.endurance_score || 0 :
      pd.latestAssessment?.agility_score || 0
    ]))
  }));

  // Radar data for evaluation
  const evalRadarData = ['Growth Mindset', 'Resilience', 'Athleticism', 'Team Focus', 'Efficiency'].map(attr => ({
    attribute: attr,
    ...Object.fromEntries(playersData.map((pd, i) => [
      `player${i}`,
      attr === 'Growth Mindset' ? pd.latestEvaluation?.growth_mindset || 0 :
      attr === 'Resilience' ? pd.latestEvaluation?.resilience || 0 :
      attr === 'Athleticism' ? pd.latestEvaluation?.athleticism || 0 :
      attr === 'Team Focus' ? pd.latestEvaluation?.team_focus || 0 :
      pd.latestEvaluation?.efficiency_in_execution || 0
    ]))
  }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Player Comparison ({players.length} players)</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Player Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {playersData.map((pd, idx) => (
              <div key={pd.player.id} className="p-3 rounded-lg border-2" style={{ borderColor: COLORS[idx % COLORS.length] }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }}>
                    {pd.player.jersey_number || pd.player.full_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{pd.player.full_name}</div>
                    <div className="text-xs text-slate-500">{pd.player.primary_position}</div>
                  </div>
                </div>
                <div className="space-y-1 text-xs">
                  {pd.birthYear && <div className="text-slate-600">Born: {pd.birthYear}</div>}
                  {pd.tryout?.team_role && (
                    <Badge className="text-[9px] bg-purple-100 text-purple-800">{pd.tryout.team_role}</Badge>
                  )}
                  {pd.tryout?.recommendation && (
                    <Badge className={`text-[9px] ml-1 ${
                      pd.tryout.recommendation === 'Move up' ? 'bg-emerald-100 text-emerald-800' :
                      pd.tryout.recommendation === 'Move down' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {pd.tryout.recommendation}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Physical Assessment */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-50 p-4 rounded-xl">
              <h3 className="font-semibold text-slate-900 mb-3">Physical Assessment</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={physicalComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  {playersData.map((pd, idx) => (
                    <Bar key={idx} dataKey={`player${idx}`} name={pd.player.full_name} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl">
              <h3 className="font-semibold text-slate-900 mb-3">Physical Profile Overlay</h3>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="attribute" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 8 }} />
                  {playersData.map((pd, idx) => (
                    <Radar key={idx} name={pd.player.full_name} dataKey={`player${idx}`} stroke={COLORS[idx % COLORS.length]} fill={COLORS[idx % COLORS.length]} fillOpacity={0.2} />
                  ))}
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Mental & Physical */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-purple-50 p-4 rounded-xl">
              <h3 className="font-semibold text-slate-900 mb-3">Mental & Physical</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={mentalPhysicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" tick={{ fontSize: 9 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  {playersData.map((pd, idx) => (
                    <Bar key={idx} dataKey={`player${idx}`} name={pd.player.full_name} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-purple-50 p-4 rounded-xl">
              <h3 className="font-semibold text-slate-900 mb-3">Mental & Physical Profile</h3>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={evalRadarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="attribute" tick={{ fontSize: 9 }} />
                  <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 8 }} />
                  {playersData.map((pd, idx) => (
                    <Radar key={idx} name={pd.player.full_name} dataKey={`player${idx}`} stroke={COLORS[idx % COLORS.length]} fill={COLORS[idx % COLORS.length]} fillOpacity={0.2} />
                  ))}
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Defending & Attacking */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-red-50 p-4 rounded-xl">
              <h3 className="font-semibold text-slate-900 mb-3">Defending</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={defendingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  {playersData.map((pd, idx) => (
                    <Bar key={idx} dataKey={`player${idx}`} name={pd.player.full_name} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-green-50 p-4 rounded-xl">
              <h3 className="font-semibold text-slate-900 mb-3">Attacking</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={attackingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  {playersData.map((pd, idx) => (
                    <Bar key={idx} dataKey={`player${idx}`} name={pd.player.full_name} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Stats Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-2 text-left">Metric</th>
                  {playersData.map((pd, idx) => (
                    <th key={idx} className="p-2 text-center" style={{ color: COLORS[idx % COLORS.length] }}>
                      {pd.player.full_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-slate-200"><td colSpan={playersData.length + 1} className="p-2 font-bold text-slate-700">Physical Assessment</td></tr>
                <tr className="border-b"><td className="p-2 font-medium">Overall Score</td>{playersData.map((pd, i) => <td key={i} className="p-2 text-center font-bold">{pd.latestAssessment?.overall_score || '-'}</td>)}</tr>
                <tr className="border-b bg-slate-50"><td className="p-2 font-medium">Speed</td>{playersData.map((pd, i) => <td key={i} className="p-2 text-center">{pd.latestAssessment?.speed_score || '-'}</td>)}</tr>
                <tr className="border-b"><td className="p-2 font-medium">Power</td>{playersData.map((pd, i) => <td key={i} className="p-2 text-center">{pd.latestAssessment?.power_score || '-'}</td>)}</tr>
                <tr className="border-b bg-slate-50"><td className="p-2 font-medium">Endurance</td>{playersData.map((pd, i) => <td key={i} className="p-2 text-center">{pd.latestAssessment?.endurance_score || '-'}</td>)}</tr>
                <tr className="border-b"><td className="p-2 font-medium">Agility</td>{playersData.map((pd, i) => <td key={i} className="p-2 text-center">{pd.latestAssessment?.agility_score || '-'}</td>)}</tr>
                <tr className="border-b bg-slate-50"><td className="p-2 font-medium">Sprint (20m)</td>{playersData.map((pd, i) => <td key={i} className="p-2 text-center">{pd.latestAssessment?.sprint?.toFixed(2) || '-'}s</td>)}</tr>
                <tr className="border-b"><td className="p-2 font-medium">Vertical</td>{playersData.map((pd, i) => <td key={i} className="p-2 text-center">{pd.latestAssessment?.vertical || '-'}"</td>)}</tr>
                <tr className="border-b bg-slate-50"><td className="p-2 font-medium">YIRT</td>{playersData.map((pd, i) => <td key={i} className="p-2 text-center">{pd.latestAssessment?.yirt || '-'}</td>)}</tr>
                <tr className="border-b"><td className="p-2 font-medium">Shuttle</td>{playersData.map((pd, i) => <td key={i} className="p-2 text-center">{pd.latestAssessment?.shuttle?.toFixed(2) || '-'}s</td>)}</tr>
                
                <tr className="bg-purple-100"><td colSpan={playersData.length + 1} className="p-2 font-bold text-slate-700">Mental & Physical</td></tr>
                <tr className="border-b bg-purple-50"><td className="p-2 font-medium">Growth Mindset</td>{playersData.map((pd, i) => <td key={i} className="p-2 text-center">{pd.latestEvaluation?.growth_mindset || '-'}</td>)}</tr>
                <tr className="border-b"><td className="p-2 font-medium">Resilience</td>{playersData.map((pd, i) => <td key={i} className="p-2 text-center">{pd.latestEvaluation?.resilience || '-'}</td>)}</tr>
                <tr className="border-b bg-purple-50"><td className="p-2 font-medium">Efficiency</td>{playersData.map((pd, i) => <td key={i} className="p-2 text-center">{pd.latestEvaluation?.efficiency_in_execution || '-'}</td>)}</tr>
                <tr className="border-b"><td className="p-2 font-medium">Athleticism</td>{playersData.map((pd, i) => <td key={i} className="p-2 text-center">{pd.latestEvaluation?.athleticism || '-'}</td>)}</tr>
                <tr className="border-b bg-purple-50"><td className="p-2 font-medium">Team Focus</td>{playersData.map((pd, i) => <td key={i} className="p-2 text-center">{pd.latestEvaluation?.team_focus || '-'}</td>)}</tr>
                
                <tr className="bg-red-100"><td colSpan={playersData.length + 1} className="p-2 font-bold text-slate-700">Defending</td></tr>
                <tr className="border-b bg-red-50"><td className="p-2 font-medium">Organized</td>{playersData.map((pd, i) => <td key={i} className="p-2 text-center">{pd.latestEvaluation?.defending_organized || '-'}</td>)}</tr>
                <tr className="border-b"><td className="p-2 font-medium">Final Third</td>{playersData.map((pd, i) => <td key={i} className="p-2 text-center">{pd.latestEvaluation?.defending_final_third || '-'}</td>)}</tr>
                <tr className="border-b bg-red-50"><td className="p-2 font-medium">Transition</td>{playersData.map((pd, i) => <td key={i} className="p-2 text-center">{pd.latestEvaluation?.defending_transition || '-'}</td>)}</tr>
                
                <tr className="bg-green-100"><td colSpan={playersData.length + 1} className="p-2 font-bold text-slate-700">Attacking</td></tr>
                <tr className="border-b bg-green-50"><td className="p-2 font-medium">Organized</td>{playersData.map((pd, i) => <td key={i} className="p-2 text-center">{pd.latestEvaluation?.attacking_organized || '-'}</td>)}</tr>
                <tr className="border-b"><td className="p-2 font-medium">Final Third</td>{playersData.map((pd, i) => <td key={i} className="p-2 text-center">{pd.latestEvaluation?.attacking_final_third || '-'}</td>)}</tr>
                <tr className="border-b bg-green-50"><td className="p-2 font-medium">In Transition</td>{playersData.map((pd, i) => <td key={i} className="p-2 text-center">{pd.latestEvaluation?.attacking_in_transition || '-'}</td>)}</tr>
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}