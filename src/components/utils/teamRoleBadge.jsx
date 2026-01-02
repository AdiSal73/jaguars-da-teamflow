import React from 'react';
import { Badge } from '@/components/ui/badge';

export function getRoleBadgeColor(role) {
  const colors = {
    'Indispensable Player': 'bg-purple-600 text-white border-purple-700',
    'GA Starter': 'bg-emerald-600 text-white border-emerald-700',
    'GA Rotation': 'bg-emerald-400 text-white border-emerald-500',
    'Aspire Starter': 'bg-blue-600 text-white border-blue-700',
    'Aspire Rotation': 'bg-blue-400 text-white border-blue-500',
    'United Starter': 'bg-orange-600 text-white border-orange-700',
    'United Rotation': 'bg-orange-400 text-white border-orange-500'
  };
  return colors[role] || 'bg-slate-400 text-white border-slate-500';
}

export function TeamRoleBadge({ role, size = 'default' }) {
  if (!role) return null;

  const sizeClasses = {
    small: 'text-[8px] px-1.5 py-0.5',
    default: 'text-xs px-2 py-1'
  };

  const roleLabels = {
    'Indispensable Player': 'IND',
    'GA Starter': 'GA-S',
    'GA Rotation': 'GA-R',
    'Aspire Starter': 'ASP-S',
    'Aspire Rotation': 'ASP-R',
    'United Starter': 'UNI-S',
    'United Rotation': 'UNI-R'
  };

  return (
    <Badge className={`${getRoleBadgeColor(role)} ${sizeClasses[size]} font-bold`}>
      {roleLabels[role] || role}
    </Badge>
  );
}