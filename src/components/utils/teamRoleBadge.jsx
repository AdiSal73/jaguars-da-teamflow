import React from 'react';
import { Badge } from '@/components/ui/badge';

// Team role color mapping for badge styling
const colorMap = {
  'United Rotation': 'bg-red-500 text-white',
  'United Starter': 'bg-orange-500 text-white',
  'Aspire Rotation': 'bg-yellow-500 text-white',
  'Aspire Starter': 'bg-green-500 text-white',
  'GA Rotation': 'bg-blue-500 text-white',
  'GA Starter': 'bg-indigo-500 text-white',
  'Indispensable Player': 'bg-purple-500 text-white',
  
  // Male roles
  'Development': 'bg-red-500 text-white',
  'Academy Rotation': 'bg-orange-500 text-white',
  'Academy Starter': 'bg-yellow-500 text-white',
  'Premier Rotation': 'bg-green-500 text-white',
  'Premier Starter': 'bg-blue-500 text-white',
  'Elite Rotation': 'bg-indigo-500 text-white',
  'Elite Starter': 'bg-purple-500 text-white'
};

export function getRoleBadgeColor(role) {
  return colorMap[role] || 'bg-slate-500 text-white';
}

export function TeamRoleBadge({ role, className = '', size = 'default' }) {
  if (!role) return null;
  
  const sizeClass = size === 'small' ? 'text-[9px] px-1.5 py-0' : 'text-xs px-2 py-0.5';
  
  return (
    <Badge className={`${getRoleBadgeColor(role)} ${sizeClass} ${className} font-medium`}>
      {role}
    </Badge>
  );
}