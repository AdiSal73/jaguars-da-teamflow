import React from 'react';

export default function CircularChart({ speed = 0, agility = 0, power = 0, endurance = 0 }) {
  const size = 280;
  const center = size / 2;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const metrics = [
    { name: 'Speed', value: speed, color: '#ef4444', offset: 0 },
    { name: 'Agility', value: agility, color: '#22c55e', offset: 0.25 },
    { name: 'Power', value: power, color: '#3b82f6', offset: 0.5 },
    { name: 'Endurance', value: endurance, color: '#ec4899', offset: 0.75 }
  ];

  const createArc = (value, offset, color) => {
    const dashArray = (value / 100) * (circumference / 4);
    const dashOffset = -circumference * offset;
    
    return (
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${dashArray} ${circumference}`}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}
        className="transition-all duration-1000 ease-out"
      />
    );
  };

  return (
    <div className="relative inline-block">
      <svg width={size} height={size} className="transform -rotate-0">
        {/* Background circles */}
        {metrics.map((metric, idx) => (
          <circle
            key={`bg-${idx}`}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference / 4} ${circumference}`}
            strokeDashoffset={-circumference * metric.offset}
            transform={`rotate(-90 ${center} ${center})`}
          />
        ))}
        
        {/* Metric circles */}
        {metrics.map((metric, idx) => (
          <g key={`metric-${idx}`}>
            {createArc(metric.value, metric.offset, metric.color)}
          </g>
        ))}
        
        {/* Center text */}
        <text
          x={center}
          y={center - 10}
          textAnchor="middle"
          className="text-3xl font-bold fill-slate-900"
        >
          {Math.round((speed + agility + power + endurance) / 4)}
        </text>
        <text
          x={center}
          y={center + 15}
          textAnchor="middle"
          className="text-sm fill-slate-500"
        >
          Overall
        </text>
      </svg>

      {/* Legend indicators positioned around the circle */}
      <div className="absolute" style={{ top: '10%', right: '5%' }}>
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }}></div>
          <span className="text-xs font-medium text-slate-700">{speed}</span>
        </div>
      </div>
      
      <div className="absolute" style={{ top: '30%', right: '-10%' }}>
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#22c55e' }}></div>
          <span className="text-xs font-medium text-slate-700">{agility}</span>
        </div>
      </div>
      
      <div className="absolute" style={{ bottom: '30%', right: '-10%' }}>
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3b82f6' }}></div>
          <span className="text-xs font-medium text-slate-700">{power}</span>
        </div>
      </div>
      
      <div className="absolute" style={{ bottom: '10%', right: '5%' }}>
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ec4899' }}></div>
          <span className="text-xs font-medium text-slate-700">{endurance}</span>
        </div>
      </div>
    </div>
  );
}