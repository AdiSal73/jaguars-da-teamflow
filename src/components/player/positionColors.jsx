// Position-based border colors for player cards
export const getPositionBorderColor = (position) => {
  const positionColors = {
    'GK': 'border-red-500',
    'Left Centerback': 'border-orange-500',
    'Right Centerback': 'border-orange-500',
    'Right Outside Back': 'border-yellow-500',
    'Left Outside Back': 'border-yellow-500',
    'Defensive Midfielder': 'border-green-500',
    'Center Midfielder': 'border-green-500',
    'Attacking Midfielder': 'border-blue-500',
    'Right Winger': 'border-indigo-500',
    'Left Winger': 'border-indigo-500',
    'Forward': 'border-violet-500'
  };
  return positionColors[position] || 'border-slate-300';
};

export const getPositionBorderStyle = (position) => {
  const positionColors = {
    'GK': '#ef4444',
    'Left Centerback': '#f97316',
    'Right Centerback': '#f97316',
    'Right Outside Back': '#eab308',
    'Left Outside Back': '#eab308',
    'Defensive Midfielder': '#22c55e',
    'Center Midfielder': '#22c55e',
    'Attacking Midfielder': '#3b82f6',
    'Right Winger': '#6366f1',
    'Left Winger': '#6366f1',
    'Forward': '#8b5cf6'
  };
  return positionColors[position] || '#94a3b8';
};

export const POSITION_LEGEND = [
  { position: 'GK', color: '#ef4444', label: 'Goalkeeper' },
  { position: 'Centerback', color: '#f97316', label: 'Centerback' },
  { position: 'Outside Back', color: '#eab308', label: 'Outside Back' },
  { position: 'Midfielder', color: '#22c55e', label: 'Def/Center Mid' },
  { position: 'Attacking Mid', color: '#3b82f6', label: 'Attacking Mid' },
  { position: 'Winger', color: '#6366f1', label: 'Winger' },
  { position: 'Forward', color: '#8b5cf6', label: 'Forward' }
];