import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TeamStrengthsHeatmap({ teamData }) {
  const categories = [
    { key: 'technical', label: 'Technical Skills', data: teamData.technical },
    { key: 'tactical', label: 'Tactical Awareness', data: teamData.tactical },
    { key: 'physical', label: 'Physical', data: teamData.physical },
    { key: 'mental', label: 'Mental', data: teamData.mental },
    { key: 'teamwork', label: 'Teamwork', data: teamData.teamwork }
  ];

  const getColor = (value) => {
    if (value >= 8) return 'bg-emerald-600';
    if (value >= 6) return 'bg-emerald-400';
    if (value >= 4) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  const getTextColor = (value) => {
    if (value >= 8) return 'text-white';
    if (value >= 6) return 'text-white';
    if (value >= 4) return 'text-slate-900';
    return 'text-white';
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle>Team Strengths Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-3">
          {categories.map(category => (
            <div key={category.key} className="space-y-2">
              <div className="text-xs font-medium text-slate-600 text-center">
                {category.label}
              </div>
              <div className={`rounded-xl p-6 ${getColor(category.data)} transition-all hover:scale-105`}>
                <div className={`text-3xl font-bold text-center ${getTextColor(category.data)}`}>
                  {category.data.toFixed(1)}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-400 rounded"></div>
            <span className="text-slate-600">Needs Work (&lt;4)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-400 rounded"></div>
            <span className="text-slate-600">Average (4-6)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-400 rounded"></div>
            <span className="text-slate-600">Good (6-8)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-600 rounded"></div>
            <span className="text-slate-600">Excellent (8+)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}