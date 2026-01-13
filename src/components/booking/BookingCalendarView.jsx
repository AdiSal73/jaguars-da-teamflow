import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, MapPin } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';

export default function BookingCalendarView({ bookings, onBookingClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const bookingsByDate = useMemo(() => {
    const map = new Map();
    bookings?.forEach(booking => {
      const dateKey = booking.booking_date;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey).push(booking);
    });
    // Sort bookings by time
    map.forEach((bookings, date) => {
      bookings.sort((a, b) => a.start_time.localeCompare(b.start_time));
    });
    return map;
  }, [bookings]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500 border-green-600';
      case 'pending': return 'bg-yellow-500 border-yellow-600';
      case 'cancelled': return 'bg-red-500 border-red-600';
      case 'completed': return 'bg-blue-500 border-blue-600';
      default: return 'bg-slate-500 border-slate-600';
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-50 to-blue-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-slate-900">
              {format(currentDate, 'MMMM yyyy')}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar Grid */}
      <Card className="border-none shadow-xl">
        <CardContent className="p-4">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center font-bold text-sm text-slate-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(day => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayBookings = bookingsByDate.get(dateKey) || [];
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[120px] border rounded-lg p-2 transition-all ${
                    isCurrentMonth ? 'bg-white' : 'bg-slate-50'
                  } ${isToday ? 'border-2 border-emerald-500 shadow-md' : 'border-slate-200'} ${
                    dayBookings.length > 0 ? 'hover:shadow-lg cursor-pointer' : ''
                  }`}
                >
                  <div className={`text-sm font-semibold mb-1 ${
                    isToday ? 'text-emerald-600' : isCurrentMonth ? 'text-slate-900' : 'text-slate-400'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {dayBookings.slice(0, 3).map(booking => (
                      <div
                        key={booking.id}
                        onClick={() => onBookingClick?.(booking)}
                        className={`text-xs p-1.5 rounded border-l-2 ${getStatusColor(booking.status)} bg-white cursor-pointer hover:shadow-md transition-all`}
                      >
                        <div className="font-semibold text-slate-900 truncate">
                          {booking.start_time}
                        </div>
                        <div className="text-slate-600 truncate text-[10px]">
                          {booking.service_name}
                        </div>
                        {booking.player_name && (
                          <div className="text-slate-500 truncate text-[10px]">
                            {booking.player_name}
                          </div>
                        )}
                      </div>
                    ))}
                    {dayBookings.length > 3 && (
                      <div className="text-[10px] text-slate-500 font-semibold text-center py-0.5">
                        +{dayBookings.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="border-none shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-semibold text-slate-700">Status:</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs text-slate-600">Confirmed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-xs text-slate-600">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-xs text-slate-600">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-xs text-slate-600">Cancelled</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}