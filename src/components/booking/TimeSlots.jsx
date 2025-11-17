import React from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

export default function TimeSlots({ 
  selectedDate, 
  selectedTime, 
  onTimeSelect, 
  bookedTimes = [],
  availableSlots = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']
}) {
  if (!selectedDate) {
    return (
      <div className="text-center py-12 text-slate-500">
        Please select a date first
      </div>
    );
  }

  const isTimeBooked = (time) => {
    return bookedTimes.includes(time);
  };

  return (
    <div className="space-y-3">
      {availableSlots.map(time => {
        const isBooked = isTimeBooked(time);
        const isSelected = selectedTime === time;

        return (
          <Button
            key={time}
            onClick={() => !isBooked && onTimeSelect(time)}
            disabled={isBooked}
            variant={isSelected ? "default" : "outline"}
            className={`
              w-full h-14 text-base font-medium transition-all duration-200
              ${isSelected ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
              ${isBooked ? 'opacity-40 cursor-not-allowed' : ''}
              ${!isSelected && !isBooked ? 'hover:border-emerald-500 hover:text-emerald-600' : ''}
            `}
          >
            <span className="flex items-center justify-between w-full px-2">
              <span>{time}</span>
              {isSelected && <Check className="w-5 h-5" />}
            </span>
          </Button>
        );
      })}
    </div>
  );
}