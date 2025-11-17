import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export default function PerformanceTrendChart({ data, metrics }) {
  const chartData = data.map(item => ({
    date: format(new Date(item.assessment_date || item.evaluation_date), 'MMM dd'),
    ...metrics.reduce((acc, metric) => {
      acc[metric.key] = item[metric.key] || 0;
      return acc;
    }, {})
  }));

  const colors = ['#ef4444', '#22c55e', '#3b82f6', '#ec4899', '#f59e0b', '#8b5cf6'];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis 
          dataKey="date" 
          stroke="#64748b"
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          stroke="#64748b"
          style={{ fontSize: '12px' }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#fff', 
            border: '1px solid #e2e8f0',
            borderRadius: '8px'
          }}
        />
        <Legend />
        {metrics.map((metric, idx) => (
          <Line
            key={metric.key}
            type="monotone"
            dataKey={metric.key}
            name={metric.label}
            stroke={colors[idx % colors.length]}
            strokeWidth={2}
            dot={{ fill: colors[idx % colors.length], r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}