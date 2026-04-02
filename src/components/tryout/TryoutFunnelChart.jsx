import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

const STAGES = [
  { key: 'Not Offered Yet', label: 'Not Offered', color: '#94a3b8' },
  { key: 'Considering Offer', label: 'Considering', color: '#f59e0b' },
  { key: 'Accepted Offer', label: 'Accepted', color: '#10b981' },
  { key: 'Signed', label: 'Signed', color: '#059669' },
];

export default function TryoutFunnelChart({ tryouts, players }) {
  // Count players at each stage
  const tryoutMap = Object.fromEntries((tryouts || []).map(t => [t.player_id, t]));

  const counts = STAGES.map(stage => {
    let count;
    if (stage.key === 'Not Offered Yet') {
      // Players with no tryout record or explicitly "Not Offered Yet"
      count = (players || []).filter(p => {
        const t = tryoutMap[p.id];
        return !t || !t.next_season_status || t.next_season_status === 'Not Offered Yet';
      }).length;
    } else {
      count = (tryouts || []).filter(t => t.next_season_status === stage.key).length;
    }
    return { ...stage, count };
  });

  const total = (players || []).length;

  return (
    <Card className="border shadow-md">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          Tryout Recruitment Funnel
          <span className="ml-auto text-xs font-normal text-slate-400">{total} total players</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-3">
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={counts} margin={{ top: 4, right: 8, bottom: 4, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
            <Tooltip
              formatter={(value, name, props) => [value, props.payload.label]}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {counts.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-3 justify-center mt-1 flex-wrap">
          {counts.map(s => (
            <div key={s.key} className="flex items-center gap-1 text-xs text-slate-600">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
              <span className="font-semibold">{s.count}</span>
              <span className="text-slate-400">{s.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}