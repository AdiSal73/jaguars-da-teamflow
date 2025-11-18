import React from 'react';
import { format, startOfWeek, addDays, isSameDay, parseISO, getDay, isAfter, isBefore, addMinutes, parse } from 'date-fns';
import { Clock, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CoachCalendarView({ 
  selectedWeek, 
  coach, 
  bookings = [],
  onTimeSlotClick 
}) {
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  const availabilitySlots = coach?.availability_slots || [];
  const services = coach?.services || [];
  
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
  ];

  const isTimeSlotAvailable = (day, time) => {
    const dayOfWeek = getDay(day);
    const dateStr = format(day, 'yyyy-MM-dd');
    
    // Find matching availability slots for this day of week
    const matchingSlots = availabilitySlots.filter(slot => {
      if (slot.day_of_week !== dayOfWeek) return false;
      
      // Check if slot is recurring and within range
      if (slot.is_recurring) {
        if (slot.recurring_start_date) {
          const startDate = parseISO(slot.recurring_start_date);
          if (isBefore(day, startDate)) return false;
        }
        if (slot.recurring_end_date) {
          const endDate = parseISO(slot.recurring_end_date);
          if (isAfter(day, endDate)) return false;
        }
        return true;
      }
      
      // Check specific dates for non-recurring slots
      if (slot.specific_dates && slot.specific_dates.includes(dateStr)) {
        return true;
      }
      
      return false;
    });
    
    if (matchingSlots.length === 0) return false;
    
    // Check if time falls within any available slot
    return matchingSlots.some(slot => {
      const slotStart = parse(slot.start_time, 'HH:mm', day);
      const slotEnd = parse(slot.end_time, 'HH:mm', day);
      const checkTime = parse(time, 'HH:mm', day);
      
      // Apply buffer
      const bufferedStart = addMinutes(slotStart, slot.buffer_before || 0);
      const bufferedEnd = addMinutes(slotEnd, -(slot.buffer_after || 0));
      
      return !isBefore(checkTime, bufferedStart) && isBefore(checkTime, bufferedEnd);
    });
  };

  const getBookingForSlot = (day, time) => {
    return bookings.find(booking => 
      isSameDay(parseISO(booking.date), day) && booking.start_time === time
    );
  };

  const getAvailableServices = (day, time) => {
    const dayOfWeek = getDay(day);
    const matchingSlots = availabilitySlots.filter(slot => {
      if (slot.day_of_week !== dayOfWeek) return false;
      const slotStart = parse(slot.start_time, 'HH:mm', day);
      const slotEnd = parse(slot.end_time, 'HH:mm', day);
      const checkTime = parse(time, 'HH:mm', day);
      return !isBefore(checkTime, slotStart) && isBefore(checkTime, slotEnd);
    });
    
    const allServices = new Set();
    matchingSlots.forEach(slot => {
      slot.services?.forEach(s => allServices.add(s));
    });
    
    return Array.from(allServices);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="grid grid-cols-8 border-b border-slate-200">
        <div className="p-4 bg-slate-50 border-r border-slate-200">
          <Clock className="w-5 h-5 text-slate-400" />
        </div>
        {weekDays.map(day => (
          <div key={day.toISOString()} className="p-4 bg-slate-50 border-r border-slate-200 last:border-r-0">
            <div className="text-center">
              <div className="text-xs font-medium text-slate-500 uppercase">
                {format(day, 'EEE')}
              </div>
              <div className={`text-lg font-bold mt-1 ${
                isSameDay(day, new Date()) ? 'text-emerald-600' : 'text-slate-900'
              }`}>
                {format(day, 'd')}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="max-h-[500px] overflow-y-auto">
        {timeSlots.map(time => (
          <div key={time} className="grid grid-cols-8 border-b border-slate-100 last:border-b-0">
            <div className="p-3 bg-slate-50 border-r border-slate-200 flex items-center justify-center">
              <span className="text-sm font-medium text-slate-600">{time}</span>
            </div>
            {weekDays.map(day => {
              const isAvailable = isTimeSlotAvailable(day, time);
              const booking = getBookingForSlot(day, time);
              const isPast = new Date(day.setHours(...time.split(':').map(Number))) < new Date();

              return (
                <div
                  key={`${day.toISOString()}-${time}`}
                  className={`p-2 border-r border-slate-100 last:border-r-0 min-h-[60px] ${
                    !isAvailable || isPast
                      ? 'bg-slate-50 cursor-not-allowed'
                      : booking
                      ? 'bg-emerald-50 cursor-pointer hover:bg-emerald-100'
                      : 'bg-white cursor-pointer hover:bg-blue-50'
                  } transition-colors`}
                  onClick={() => {
                    if (isAvailable && !isPast && !booking) {
                      onTimeSlotClick(day, time);
                    }
                  }}
                >
                  {booking ? (
                    <div className="text-xs">
                      <Badge className="bg-emerald-600 text-white text-[10px] mb-1">
                        Booked
                      </Badge>
                      <div className="font-medium text-slate-900 truncate">
                        {booking.player_name || 'Session'}
                      </div>
                    </div>
                  ) : !isAvailable ? (
                    <div className="flex items-center justify-center h-full">
                      <X className="w-4 h-4 text-slate-300" />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}