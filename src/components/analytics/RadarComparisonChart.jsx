import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer } from 'recharts';

export default function RadarComparisonChart({ playerData, teamAverage, clubAverage }) {
  const data = [
    { attribute: 'Speed', player: playerData.speed || 0, team: teamAverage.speed || 0, club: clubAverage.speed || 0 },
    { attribute: 'Agility', player: playerData.agility || 0, team: teamAverage.agility || 0, club: clubAverage.agility || 0 },
    { attribute: 'Power', player: playerData.power || 0, team: teamAverage.power || 0, club: clubAverage.power || 0 },
    { attribute: 'Endurance', player: playerData.endurance || 0, team: teamAverage.endurance || 0, club: clubAverage.endurance || 0 },
  ];

  return (
    <ResponsiveContainer width="100%" height={350}>
      <RadarChart data={data}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis 
          dataKey="attribute" 
          style={{ fontSize: '12px', fontWeight: '500' }}
        />
        <PolarRadiusAxis angle={90} domain={[0, 100]} />
        <Radar 
          name="Player" 
          dataKey="player" 
          stroke="#3b82f6" 
          fill="#3b82f6" 
          fillOpacity={0.6}
          strokeWidth={2}
        />
        <Radar 
          name="Team Avg" 
          dataKey="team" 
          stroke="#22c55e" 
          fill="#22c55e" 
          fillOpacity={0.3}
          strokeWidth={2}
        />
        <Radar 
          name="Club Avg" 
          dataKey="club" 
          stroke="#f59e0b" 
          fill="#f59e0b" 
          fillOpacity={0.2}
          strokeWidth={2}
        />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );
}