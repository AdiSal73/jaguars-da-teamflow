import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PerformanceHeatmap({ players, assessments, evaluations, metric = 'overall' }) {
  const positions = [
    'GK', 'Right Outside Back', 'Left Outside Back', 'Right Centerback', 'Left Centerback',
    'Defensive Midfielder', 'Right Winger', 'Center Midfielder', 'Forward', 
    'Attacking Midfielder', 'Left Winger'
  ];

  const getPositionPerformance = (position) => {
    const positionPlayers = players?.filter(p => p.primary_position === position) || [];
    const playerIds = positionPlayers?.map(p => p.id) || [];
    
    if (metric === 'overall' || metric === 'physical') {
      const posAssessments = assessments.filter(a => playerIds.includes(a.player_id));
      const latestByPlayer = {};
      posAssessments.forEach(a => {
        if (!latestByPlayer[a.player_id] || new Date(a.assessment_date) > new Date(latestByPlayer[a.player_id].assessment_date)) {
          latestByPlayer[a.player_id] = a;
        }
      });
      const latestAssessments = Object.values(latestByPlayer);
      return latestAssessments.length > 0
        ? Math.round(latestAssessments.reduce((sum, a) => sum + (a.overall_score || 0), 0) / latestAssessments.length)
        : 0;
    } else {
      const posEvals = evaluations.filter(e => playerIds.includes(e.player_id));
      const latestByPlayer = {};
      posEvals.forEach(e => {
        if (!latestByPlayer[e.player_id] || new Date(e.created_date) > new Date(latestByPlayer[e.player_id].created_date)) {
          latestByPlayer[e.player_id] = e;
        }
      });
      const latestEvals = Object.values(latestByPlayer);
      
      if (metric === 'defending') {
        return latestEvals.length > 0
          ? Math.round(latestEvals.reduce((sum, e) => sum + ((e.defending_organized || 0) + (e.defending_final_third || 0) + (e.defending_transition || 0)) / 3, 0) / latestEvals.length)
          : 0;
      } else if (metric === 'attacking') {
        return latestEvals.length > 0
          ? Math.round(latestEvals.reduce((sum, e) => sum + ((e.attacking_organized || 0) + (e.attacking_final_third || 0) + (e.attacking_in_transition || 0)) / 3, 0) / latestEvals.length)
          : 0;
      }
    }
    return 0;
  };

  const getColor = (value, max) => {
    const percentage = value / max;
    if (percentage >= 0.8) return 'bg-emerald-600';
    if (percentage >= 0.6) return 'bg-emerald-400';
    if (percentage >= 0.4) return 'bg-yellow-400';
    if (percentage >= 0.2) return 'bg-orange-400';
    return 'bg-red-400';
  };

  const maxValue = metric === 'overall' || metric === 'physical' ? 100 : 10;

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle className="text-sm">Performance Heatmap by Position</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {positions?.map(position => {
            const score = getPositionPerformance(position);
            const playerCount = players?.filter(p => p.primary_position === position)?.length || 0;
            return (
              <div
                key={position}
                className={`p-3 rounded-lg text-white transition-all hover:scale-105 cursor-pointer ${getColor(score, maxValue)}`}
              >
                <div className="text-xs font-medium mb-1 truncate">{position}</div>
                <div className="text-2xl font-bold">{score}</div>
                <div className="text-[10px] opacity-90">{playerCount} players</div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1"><div className="w-4 h-4 bg-red-400 rounded"></div><span>0-20</span></div>
          <div className="flex items-center gap-1"><div className="w-4 h-4 bg-orange-400 rounded"></div><span>20-40</span></div>
          <div className="flex items-center gap-1"><div className="w-4 h-4 bg-yellow-400 rounded"></div><span>40-60</span></div>
          <div className="flex items-center gap-1"><div className="w-4 h-4 bg-emerald-400 rounded"></div><span>60-80</span></div>
          <div className="flex items-center gap-1"><div className="w-4 h-4 bg-emerald-600 rounded"></div><span>80-100</span></div>
        </div>
      </CardContent>
    </Card>
  );
}