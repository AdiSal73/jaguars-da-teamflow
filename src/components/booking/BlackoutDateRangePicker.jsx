import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, isWithinInterval } from 'date-fns';

export default function BlackoutDateRangePicker({ blackoutDates, onBlackoutDatesChange }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectionMode, setSelectionMode] = useState('start'); // 'start' or 'end'
  const [tempStart, setTempStart] = useState(null);
  const [tempEnd, setTempEnd] = useState(null);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const isDateBlocked = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return blackoutDates.includes(dateStr);
  };

  const isDateInRange = (date) => {
    if (!tempStart || !tempEnd) return false;
    try {
      return isWithinInterval(date, { start: tempStart, end: tempEnd });
    } catch {
      return false;
    }
  };

  const handleDateClick = (date) => {
    if (selectionMode === 'start') {
      setTempStart(date);
      setTempEnd(null);
      setSelectionMode('end');
    } else {
      if (date < tempStart) {
        setTempEnd(tempStart);
        setTempStart(date);
      } else {
        setTempEnd(date);
      }
      setSelectionMode('start');
    }
  };

  const handleApplyRange = () => {
    if (!tempStart || !tempEnd) return;

    const rangeDates = eachDayOfInterval({ start: tempStart, end: tempEnd });
    const newDates = rangeDates.map(d => format(d, 'yyyy-MM-dd'));
    
    // Toggle: if all dates in range are blocked, unblock them; otherwise block them
    const allBlocked = newDates.every(d => blackoutDates.includes(d));
    
    let updatedDates;
    if (allBlocked) {
      updatedDates = blackoutDates.filter(d => !newDates.includes(d));
    } else {
      updatedDates = [...new Set([...blackoutDates, ...newDates])];
    }
    
    onBlackoutDatesChange(updatedDates);
    setTempStart(null);
    setTempEnd(null);
    setSelectionMode('start');
  };

  const handleClear = () => {
    setTempStart(null);
    setTempEnd(null);
    setSelectionMode('start');
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-600" />
            <span>Blackout Date Range</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900 font-medium mb-2">
            {selectionMode === 'start' ? '1. Select Start Date' : '2. Select End Date'}
          </p>
          {tempStart && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Selected:</span>
              <span>{format(tempStart, 'MMM d, yyyy')}</span>
              {tempEnd && (
                <>
                  <span>→</span>
                  <span>{format(tempEnd, 'MMM d, yyyy')}</span>
                  <span className="text-blue-600 ml-2">
                    ({Math.ceil((tempEnd - tempStart) / (1000 * 60 * 60 * 24)) + 1} days)
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs font-semibold text-slate-600 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {daysInMonth.map((date, index) => {
            const isBlocked = isDateBlocked(date);
            const isInSelection = isDateInRange(date);
            const isStartDate = tempStart && isSameDay(date, tempStart);
            const isEndDate = tempEnd && isSameDay(date, tempEnd);

            return (
              <button
                key={index}
                onClick={() => handleDateClick(date)}
                className={`
                  aspect-square rounded-lg text-sm font-medium transition-all duration-200
                  ${isStartDate || isEndDate ? 'bg-emerald-600 text-white shadow-md scale-105' : ''}
                  ${isInSelection && !isStartDate && !isEndDate ? 'bg-emerald-200 text-emerald-900' : ''}
                  ${isBlocked && !isInSelection ? 'bg-red-100 text-red-800 line-through' : ''}
                  ${!isBlocked && !isInSelection && !isStartDate && !isEndDate ? 'bg-slate-100 hover:bg-slate-200 text-slate-900' : ''}
                  ${!isSameMonth(date, currentMonth) ? 'opacity-30' : ''}
                `}
              >
                {format(date, 'd')}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex gap-3">
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={!tempStart && !tempEnd}
            className="flex-1"
          >
            Clear Selection
          </Button>
          <Button
            onClick={handleApplyRange}
            disabled={!tempStart || !tempEnd}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            {tempStart && tempEnd && blackoutDates.some(d => {
              const rangeDates = eachDayOfInterval({ start: tempStart, end: tempEnd });
              return rangeDates.some(rd => format(rd, 'yyyy-MM-dd') === d);
            }) ? 'Remove Dates' : 'Block Dates'}
          </Button>
        </div>

        {blackoutDates.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium text-slate-700 mb-2">
              Blocked Dates ({blackoutDates.length})
            </p>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {blackoutDates.sort().map(date => (
                <div key={date} className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs flex items-center gap-1">
                  {new Date(date).toLocaleDateString()}
                  <button
                    onClick={() => onBlackoutDatesChange(blackoutDates.filter(d => d !== date))}
                    className="hover:text-red-900 font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}