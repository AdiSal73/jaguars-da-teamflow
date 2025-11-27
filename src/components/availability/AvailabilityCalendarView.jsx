import React, { useState, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, startOfWeek, endOfWeek, addDays, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ChevronLeft, ChevronRight, Plus, Edit, Trash2, Ban, Calendar } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

export default function AvailabilityCalendarView({ 
  slots = [], 
  services = [], 
  blackoutDates = [],
  onAddSlot,
  onEditSlot,
  onDeleteSlot,
  onDeleteRecurringSlots,
  onAddBlackout,
  onRemoveBlackout
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showSlotDialog, setShowSlotDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState(null);
  const [editingSlot, setEditingSlot] = useState(null);
  const [draggedSlot, setDraggedSlot] = useState(null);
  
  const [slotForm, setSlotForm] = useState({
    start_time: '09:00',
    end_time: '17:00',
    services: [],
    is_recurring: true,
    buffer_before: 0,
    buffer_after: 0
  });

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getSlotsForDay = (date) => {
    const dayOfWeek = getDay(date);
    return slots.filter(slot => {
      if (slot.day_of_week !== dayOfWeek) return false;
      
      if (slot.is_recurring) {
        if (slot.recurring_start_date && new Date(slot.recurring_start_date) > date) return false;
        if (slot.recurring_end_date && new Date(slot.recurring_end_date) < date) return false;
        return true;
      } else {
        return slot.specific_dates?.some(d => isSameDay(new Date(d), date));
      }
    });
  };

  const isBlackoutDate = (date) => {
    return blackoutDates.some(d => isSameDay(new Date(d), date));
  };

  const handleDateClick = (date) => {
    if (isBlackoutDate(date)) {
      if (window.confirm('Remove this blackout date?')) {
        onRemoveBlackout?.(format(date, 'yyyy-MM-dd'));
      }
      return;
    }
    
    setSelectedDate(date);
    const daySlots = getSlotsForDay(date);
    
    if (daySlots.length === 0) {
      // Option to add blackout or slot
      const choice = window.confirm('Click OK to add availability slot, Cancel to mark as blackout');
      if (choice) {
        setSlotForm({
          ...slotForm,
          day_of_week: getDay(date),
          start_time: '09:00',
          end_time: '17:00'
        });
        setEditingSlot(null);
        setShowSlotDialog(true);
      } else {
        onAddBlackout?.(format(date, 'yyyy-MM-dd'));
      }
    }
  };

  const handleSlotClick = (e, slot, date) => {
    e.stopPropagation();
    setSelectedDate(date);
    setEditingSlot(slot);
    setSlotForm({
      ...slot,
      services: slot.services || []
    });
    setShowSlotDialog(true);
  };

  const handleDeleteClick = (e, slot) => {
    e.stopPropagation();
    setSlotToDelete(slot);
    setShowDeleteDialog(true);
  };

  const handleSaveSlot = () => {
    const slotData = {
      ...slotForm,
      id: editingSlot?.id || `slot-${Date.now()}`,
      day_of_week: selectedDate ? getDay(selectedDate) : slotForm.day_of_week
    };

    if (editingSlot) {
      onEditSlot?.(slotData);
    } else {
      onAddSlot?.(slotData);
    }
    
    setShowSlotDialog(false);
    setEditingSlot(null);
    setSlotForm({
      start_time: '09:00',
      end_time: '17:00',
      services: [],
      is_recurring: true,
      buffer_before: 0,
      buffer_after: 0
    });
  };

  const handleDeleteConfirm = (deleteAll) => {
    if (deleteAll) {
      onDeleteRecurringSlots?.(slotToDelete);
    } else {
      onDeleteSlot?.(slotToDelete.id);
    }
    setShowDeleteDialog(false);
    setSlotToDelete(null);
  };

  const handleDragStart = (e, slot) => {
    setDraggedSlot(slot);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetDate) => {
    e.preventDefault();
    if (!draggedSlot) return;

    const newDayOfWeek = getDay(targetDate);
    const updatedSlot = {
      ...draggedSlot,
      day_of_week: newDayOfWeek
    };

    onEditSlot?.(updatedSlot);
    setDraggedSlot(null);
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-white">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            Availability Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-semibold text-slate-900 min-w-[140px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-100 border border-emerald-300 rounded"></div>
            <span className="text-slate-600">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
            <span className="text-slate-600">Blackout</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-slate-100 border border-slate-300 rounded"></div>
            <span className="text-slate-600">No availability</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Header */}
          {days.map(day => (
            <div key={day} className="text-center text-sm font-semibold text-slate-600 py-2">
              {day}
            </div>
          ))}

          {/* Days */}
          {calendarDays.map((day, idx) => {
            const daySlots = getSlotsForDay(day);
            const isBlackout = isBlackoutDate(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={idx}
                onClick={() => handleDateClick(day)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, day)}
                className={`min-h-[100px] p-1 border rounded-lg cursor-pointer transition-all ${
                  !isCurrentMonth ? 'bg-slate-50 opacity-50' :
                  isBlackout ? 'bg-red-50 border-red-200 hover:bg-red-100' :
                  daySlots.length > 0 ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100' :
                  'bg-white border-slate-200 hover:bg-slate-50'
                } ${isToday ? 'ring-2 ring-emerald-500' : ''}`}
              >
                <div className={`text-right text-sm font-medium mb-1 ${
                  isToday ? 'text-emerald-600' : 'text-slate-700'
                }`}>
                  {format(day, 'd')}
                </div>
                
                {isBlackout && (
                  <div className="flex items-center justify-center py-2">
                    <Ban className="w-4 h-4 text-red-500" />
                  </div>
                )}

                <div className="space-y-1">
                  {daySlots.slice(0, 2).map((slot, slotIdx) => (
                    <div
                      key={slotIdx}
                      draggable
                      onDragStart={(e) => handleDragStart(e, slot)}
                      onClick={(e) => handleSlotClick(e, slot, day)}
                      className="group relative text-xs p-1 bg-emerald-100 rounded text-emerald-800 truncate hover:bg-emerald-200 cursor-grab active:cursor-grabbing"
                    >
                      <span className="font-medium">{slot.start_time}-{slot.end_time}</span>
                      <button
                        onClick={(e) => handleDeleteClick(e, slot)}
                        className="absolute right-0 top-0 p-0.5 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </button>
                    </div>
                  ))}
                  {daySlots.length > 2 && (
                    <div className="text-xs text-slate-500 text-center">
                      +{daySlots.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>

      {/* Add/Edit Slot Dialog */}
      <Dialog open={showSlotDialog} onOpenChange={setShowSlotDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSlot ? 'Edit Time Slot' : 'Add Time Slot'}
            </DialogTitle>
            <DialogDescription>
              {selectedDate && `For ${format(selectedDate, 'EEEE, MMMM d, yyyy')}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={slotForm.start_time}
                  onChange={(e) => setSlotForm({...slotForm, start_time: e.target.value})}
                />
              </div>
              <div>
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={slotForm.end_time}
                  onChange={(e) => setSlotForm({...slotForm, end_time: e.target.value})}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="recurring"
                checked={slotForm.is_recurring}
                onCheckedChange={(checked) => setSlotForm({...slotForm, is_recurring: checked})}
              />
              <Label htmlFor="recurring">Repeat every week</Label>
            </div>

            <div>
              <Label className="mb-2 block">Services Available</Label>
              <div className="space-y-2">
                {services.map(service => (
                  <div key={service.name} className="flex items-center gap-2">
                    <Checkbox
                      id={service.name}
                      checked={slotForm.services?.includes(service.name)}
                      onCheckedChange={(checked) => {
                        const newServices = checked
                          ? [...(slotForm.services || []), service.name]
                          : slotForm.services?.filter(s => s !== service.name) || [];
                        setSlotForm({...slotForm, services: newServices});
                      }}
                    />
                    <Label htmlFor={service.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: service.color }}></div>
                      {service.name} ({service.duration} min)
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Buffer Before (min)</Label>
                <Input
                  type="number"
                  min="0"
                  step="5"
                  value={slotForm.buffer_before}
                  onChange={(e) => setSlotForm({...slotForm, buffer_before: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label>Buffer After (min)</Label>
                <Input
                  type="number"
                  min="0"
                  step="5"
                  value={slotForm.buffer_after}
                  onChange={(e) => setSlotForm({...slotForm, buffer_after: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSlotDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveSlot} className="bg-emerald-600 hover:bg-emerald-700">
              {editingSlot ? 'Update Slot' : 'Add Slot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Time Slot</AlertDialogTitle>
            <AlertDialogDescription>
              {slotToDelete?.is_recurring 
                ? 'This is a recurring slot. Would you like to delete just this occurrence or all future occurrences?'
                : 'Are you sure you want to delete this time slot?'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {slotToDelete?.is_recurring ? (
              <>
                <Button variant="outline" onClick={() => handleDeleteConfirm(false)}>
                  Delete This Only
                </Button>
                <AlertDialogAction 
                  onClick={() => handleDeleteConfirm(true)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete All Recurring
                </AlertDialogAction>
              </>
            ) : (
              <AlertDialogAction 
                onClick={() => handleDeleteConfirm(false)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}