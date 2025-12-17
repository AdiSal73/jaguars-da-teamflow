import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function EvaluationRadarChart({ evaluation }) {
  if (!evaluation) return null;

  const data = [
    {
      category: 'Mental',
      value: Math.round(((evaluation.growth_mindset || 0) + (evaluation.resilience || 0) + (evaluation.team_focus || 0)) / 3),
      fullMark: 10
    },
    {
      category: 'Physical',
      value: evaluation.athleticism || 0,
      fullMark: 10
    },
    {
      category: 'Defending',
      value: Math.round(((evaluation.defending_organized || 0) + (evaluation.defending_final_third || 0) + (evaluation.defending_transition || 0)) / 3),
      fullMark: 10
    },
    {
      category: 'Attacking',
      value: Math.round(((evaluation.attacking_organized || 0) + (evaluation.attacking_final_third || 0) + (evaluation.attacking_in_transition || 0)) / 3),
      fullMark: 10
    },
    {
      category: 'Technical',
      value: evaluation.efficiency_in_execution || 0,
      fullMark: 10
    }
  ];

  return (
    <Card className="border-none shadow-2xl overflow-hidden bg-gradient-to-br from-white to-purple-50 backdrop-blur-sm hover:shadow-3xl transition-all">
      <CardHeader className="pb-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-b border-purple-400/30">
        <CardTitle className="text-base flex items-center gap-2 font-bold">
          🎯 Performance Radar
        </CardTitle>
        {evaluation.created_date && (
          <p className="text-xs text-white/80 mt-1">
            {new Date(evaluation.created_date).toLocaleDateString()}
          </p>
        )}
      </CardHeader>
      <CardContent className="p-4">
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={data}>
            <defs>
              <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.3}/>
              </linearGradient>
            </defs>
            <PolarGrid stroke="#e2e8f0" strokeWidth={1.5} />
            <PolarAngleAxis 
              dataKey="category" 
              tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 10]} 
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              tickCount={6}
            />
            <Radar 
              name="Performance" 
              dataKey="value" 
              stroke="#8b5cf6" 
              fill="url(#radarGradient)"
              strokeWidth={3}
              fillOpacity={0.6}
              dot={{ r: 5, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                border: '2px solid #8b5cf6',
                borderRadius: '12px',
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: 600
              }}
              formatter={(value) => [`${value}/10`, 'Score']}
            />
          </RadarChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-5 gap-2 mt-4">
          {data.map((item, idx) => (
            <div key={idx} className="text-center">
              <div className="text-2xl font-bold text-purple-600">{item.value}</div>
              <div className="text-[9px] text-slate-600">{item.category}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}