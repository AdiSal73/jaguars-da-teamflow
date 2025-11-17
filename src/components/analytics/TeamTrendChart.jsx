import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function TeamTrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis 
          dataKey="month" 
          stroke="#64748b"
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          stroke="#64748b"
          style={{ fontSize: '12px' }}
          domain={[0, 10]}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px'
          }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="technical" 
          stroke="#3b82f6" 
          strokeWidth={2}
          name="Technical"
        />
        <Line 
          type="monotone" 
          dataKey="tactical" 
          stroke="#8b5cf6" 
          strokeWidth={2}
          name="Tactical"
        />
        <Line 
          type="monotone" 
          dataKey="physical" 
          stroke="#10b981" 
          strokeWidth={2}
          name="Physical"
        />
        <Line 
          type="monotone" 
          dataKey="overall" 
          stroke="#ef4444" 
          strokeWidth={3}
          name="Overall"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}