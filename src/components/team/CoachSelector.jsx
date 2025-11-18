import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Search, ChevronDown } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

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
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            {selectedCoaches.length > 0 ? `${selectedCoaches.length} coach${selectedCoaches.length > 1 ? 'es' : ''} selected` : 'Select coaches'}
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search coaches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {availableCoaches.length === 0 ? (
              <div className="p-4 text-sm text-slate-500 text-center">
                {searchTerm ? 'No coaches found' : 'All coaches selected'}
              </div>
            ) : (
              availableCoaches.map(coach => (
                <button
                  key={coach.id}
                  onClick={() => {
                    addCoach(coach.id);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between border-b last:border-b-0"
                >
                  <div>
                    <div className="font-medium text-slate-900">{coach.full_name}</div>
                    <div className="text-xs text-slate-600">{coach.specialization}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}