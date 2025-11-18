import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Search, Plus } from 'lucide-react';

export default function CoachSelector({ coaches, selectedCoachIds, onCoachesChange }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const selectedCoaches = coaches.filter(c => selectedCoachIds.includes(c.id));
  const availableCoaches = coaches.filter(c => 
    !selectedCoachIds.includes(c.id) && 
    (c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     c.specialization?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const addCoach = (coachId) => {
    onCoachesChange([...selectedCoachIds, coachId]);
    setSearchTerm('');
  };

  const removeCoach = (coachId) => {
    onCoachesChange(selectedCoachIds.filter(id => id !== coachId));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {selectedCoaches.map(coach => (
          <Badge key={coach.id} className="bg-emerald-100 text-emerald-800 px-3 py-1 flex items-center gap-2">
            {coach.full_name}
            <button onClick={() => removeCoach(coach.id)} className="hover:text-emerald-900">
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
      
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search and add coaches..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="pl-10"
          />
        </div>
        
        {isOpen && searchTerm && availableCoaches.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {availableCoaches.map(coach => (
              <button
                key={coach.id}
                onClick={() => {
                  addCoach(coach.id);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium text-slate-900">{coach.full_name}</div>
                  <div className="text-xs text-slate-600">{coach.specialization}</div>
                </div>
                <Plus className="w-4 h-4 text-emerald-600" />
              </button>
            ))}
          </div>
        )}
      </div>

      {availableCoaches.length === 0 && searchTerm && isOpen && (
        <div className="text-sm text-slate-500 text-center py-2">No coaches found</div>
      )}
    </div>
  );
}