import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function AvailabilityCalendar({ selectedDates = [], onDateSelect }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get starting day offset (0 = Sunday)
  const startingDayOfWeek = getDay(monthStart);
  const emptyDays = Array(startingDayOfWeek).fill(null);
  
  const isDateSelected = (date) => {
    return selectedDates.some(d => isSameDay(new Date(d), date));
  };
  
  const handleDateClick = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (isDateSelected(date)) {
      onDateSelect(selectedDates.filter(d => d !== dateStr));
    } else {
      onDateSelect([...selectedDates, dateStr]);
    }
  };
  
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-slate-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-semibold text-slate-500 py-2">
            {day}
          </div>
        ))}
        
        {emptyDays.map((_, idx) => (
          <div key={`empty-${idx}`} className="aspect-square" />
        ))}
        
        {days.map(day => {
          const isSelected = isDateSelected(day);
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, currentMonth);
          
          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDateClick(day)}
              disabled={!isCurrentMonth}
              className={`
                aspect-square rounded-lg text-sm font-medium transition-all duration-200
                ${!isCurrentMonth ? 'text-slate-300 cursor-not-allowed' : ''}
                ${isSelected ? 'bg-emerald-500 text-white shadow-md hover:bg-emerald-600' : 'bg-white text-slate-700 hover:bg-emerald-50'}
                ${isToday && !isSelected ? 'ring-2 ring-emerald-400' : ''}
              `}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </Card>
  );
}