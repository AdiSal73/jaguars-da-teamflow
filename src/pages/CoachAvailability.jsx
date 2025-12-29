import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, Plus, Trash2, Edit, Clock, MapPin, Repeat } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay } from 'date-fns';

export default function CoachAvailability() {
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showAddSlotDialog, setShowAddSlotDialog] = useState(false);
  const [showAddRecurrenceDialog, setShowAddRecurrenceDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [slotForm, setSlotForm] = useState({
    date: '',
    start_time: '09:00',
    end_time: '17:00',
    location_id: '',
    service_names: [],
    buffer_before: 0,
    buffer_after: 0
  });
  const [recurrenceForm, setRecurrenceForm] = useState({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00',
    location_id: '',
    service_names: [],
    buffer_before: 0,
    buffer_after: 0,
    recurrence_start_date: format(new Date(), 'yyyy-MM-dd'),
    recurrence_end_date: ''
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const currentCoach = coaches.find(c => c.email === user?.email);
  const services = currentCoach?.services || [];

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list()
  });

  const { data: timeSlots = [] } = useQuery({
    queryKey: ['timeSlots', currentCoach?.id],
    queryFn: () => base44.entities.TimeSlot.filter({ coach_id: currentCoach.id }),
    enabled: !!currentCoach
  });

  const { data: recurrencePatterns = [] } = useQuery({
    queryKey: ['recurrencePatterns', currentCoach?.id],
    queryFn: () => base44.entities.RecurrencePattern.filter({ coach_id: currentCoach.id }),
    enabled: !!currentCoach
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => base44.entities.Booking.list()
  });

  const createSlotMutation = useMutation({
    mutationFn: (data) => base44.entities.TimeSlot.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['timeSlots']);
      toast.success('Time slot created');
      setShowAddSlotDialog(false);
      resetSlotForm();
    }
  });

  const deleteSlotMutation = useMutation({
    mutationFn: (id) => base44.entities.TimeSlot.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['timeSlots']);
      toast.success('Time slot deleted');
    }
  });

  const createRecurrenceMutation = useMutation({
    mutationFn: async (data) => {
      const pattern = await base44.entities.RecurrencePattern.create(data);
      
      // Generate slots for next 3 months
      const generateUntil = new Date();
      generateUntil.setMonth(generateUntil.getMonth() + 3);
      
      await base44.functions.invoke('generateRecurringSlots', {
        pattern_id: pattern.id,
        generate_until_date: format(generateUntil, 'yyyy-MM-dd')
      });
      
      return pattern;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['recurrencePatterns']);
      queryClient.invalidateQueries(['timeSlots']);
      toast.success('Recurring availability created');
      setShowAddRecurrenceDialog(false);
      resetRecurrenceForm();
    }
  });

  const deleteRecurrenceMutation = useMutation({
    mutationFn: async (patternId) => {
      // Delete the pattern
      await base44.entities.RecurrencePattern.delete(patternId);
      
      // Delete all future time slots from this pattern
      const slots = await base44.entities.TimeSlot.filter({ recurrence_id: patternId });
      const today = format(new Date(), 'yyyy-MM-dd');
      const futureSlots = slots.filter(s => s.date >= today);
      
      for (const slot of futureSlots) {
        await base44.entities.TimeSlot.delete(slot.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['recurrencePatterns']);
      queryClient.invalidateQueries(['timeSlots']);
      toast.success('Recurring pattern deleted');
    }
  });

  const resetSlotForm = () => {
    setSlotForm({
      date: '',
      start_time: '09:00',
      end_time: '17:00',
      location_id: '',
      service_names: [],
      buffer_before: 0,
      buffer_after: 0
    });
  };

  const resetRecurrenceForm = () => {
    setRecurrenceForm({
      day_of_week: 1,
      start_time: '09:00',
      end_time: '17:00',
      location_id: '',
      service_names: [],
      buffer_before: 0,
      buffer_after: 0,
      recurrence_start_date: format(new Date(), 'yyyy-MM-dd'),
      recurrence_end_date: ''
    });
  };

  const handleCreateSlot = () => {
    if (!slotForm.location_id || slotForm.service_names.length === 0) {
      toast.error('Please select location and at least one service');
      return;
    }
    
    createSlotMutation.mutate({
      coach_id: currentCoach.id,
      ...slotForm
    });
  };

  const handleCreateRecurrence = () => {
    if (!recurrenceForm.location_id || recurrenceForm.service_names.length === 0) {
      toast.error('Please select location and at least one service');
      return;
    }
    
    createRecurrenceMutation.mutate({
      coach_id: currentCoach.id,
      ...recurrenceForm
    });
  };

  const handleDeleteSlot = (slotId) => {
    if (window.confirm('Delete this time slot?')) {
      deleteSlotMutation.mutate(slotId);
    }
  };

  const handleDeleteRecurrence = (patternId) => {
    if (window.confirm('Delete this recurrence pattern and all future occurrences?')) {
      deleteRecurrenceMutation.mutate(patternId);
    }
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setSlotForm({ ...slotForm, date: format(date, 'yyyy-MM-dd') });
    setShowAddSlotDialog(true);
  };

  // Calendar rendering
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getSlotsForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return timeSlots.filter(s => s.date === dateStr && s.is_available);
  };

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (!currentCoach) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Calendar className="w-8 h-8 text-emerald-600" />
          Manage Availability
        </h1>
        <p className="text-slate-600 mt-1">Set your available times for player bookings</p>
      </div>

      <Tabs defaultValue="calendar">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="recurring">Recurring Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <Card>
            <CardHeader className="border-b">
              <div className="flex justify-between items-center">
                <CardTitle>Calendar</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                  <span className="font-semibold px-4 py-2">
                    {format(currentMonth, 'MMMM yyyy')}
                  </span>
                  <Button 
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-semibold text-slate-600 py-2">
                    {day}
                  </div>
                ))}
                
                {calendarDays.map((day, idx) => {
                  const daySlots = getSlotsForDate(day);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isToday = isSameDay(day, new Date());
                  const isPast = day < new Date(new Date().setHours(0,0,0,0));
                  
                  return (
                    <div
                      key={idx}
                      onClick={() => !isPast && handleDateClick(day)}
                      className={`min-h-[100px] p-2 border rounded-lg cursor-pointer transition-all ${
                        !isCurrentMonth ? 'bg-slate-50 opacity-50' :
                        isPast ? 'bg-slate-100 cursor-not-allowed' :
                        daySlots.length > 0 ? 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100' :
                        'bg-white hover:bg-slate-50'
                      } ${isToday ? 'ring-2 ring-emerald-500' : ''}`}
                    >
                      <div className="text-sm font-medium mb-2">{format(day, 'd')}</div>
                      <div className="space-y-1">
                        {daySlots.slice(0, 2).map(slot => (
                          <div
                            key={slot.id}
                            className="group relative bg-emerald-100 text-emerald-800 text-xs p-1 rounded"
                          >
                            <div>{slot.start_time}-{slot.end_time}</div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSlot(slot.id);
                              }}
                              className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-100 rounded"
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </button>
                          </div>
                        ))}
                        {daySlots.length > 2 && (
                          <div className="text-xs text-slate-500">+{daySlots.length - 2} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recurring">
          <Card>
            <CardHeader className="border-b">
              <div className="flex justify-between items-center">
                <CardTitle>Recurring Patterns</CardTitle>
                <Button onClick={() => setShowAddRecurrenceDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Recurring Availability
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {recurrencePatterns.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  No recurring patterns set up yet
                </div>
              ) : (
                <div className="space-y-4">
                  {recurrencePatterns.map(pattern => (
                    <Card key={pattern.id} className="border-l-4 border-l-emerald-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Repeat className="w-4 h-4 text-emerald-600" />
                              <span className="font-bold">{daysOfWeek[pattern.day_of_week]}</span>
                              <Badge>{pattern.start_time} - {pattern.end_time}</Badge>
                            </div>
                            <div className="text-sm text-slate-600 space-y-1">
                              <div>Services: {pattern.service_names?.join(', ')}</div>
                              <div>From: {format(new Date(pattern.recurrence_start_date), 'MMM d, yyyy')}</div>
                              {pattern.recurrence_end_date && (
                                <div>Until: {format(new Date(pattern.recurrence_end_date), 'MMM d, yyyy')}</div>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteRecurrence(pattern.id)}
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Single Slot Dialog */}
      <Dialog open={showAddSlotDialog} onOpenChange={setShowAddSlotDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Time Slot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Date</Label>
              <Input type="date" value={slotForm.date} onChange={e => setSlotForm({...slotForm, date: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time</Label>
                <Input type="time" value={slotForm.start_time} onChange={e => setSlotForm({...slotForm, start_time: e.target.value})} />
              </div>
              <div>
                <Label>End Time</Label>
                <Input type="time" value={slotForm.end_time} onChange={e => setSlotForm({...slotForm, end_time: e.target.value})} />
              </div>
            </div>
            <div>
              <Label>Location</Label>
              <Select value={slotForm.location_id} onValueChange={v => setSlotForm({...slotForm, location_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>
                  {locations.map(loc => (
                    <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Services</Label>
              <div className="space-y-2 mt-2">
                {services.map(service => (
                  <label key={service.name} className="flex items-center gap-2">
                    <Checkbox
                      checked={slotForm.service_names.includes(service.name)}
                      onCheckedChange={checked => {
                        const updated = checked
                          ? [...slotForm.service_names, service.name]
                          : slotForm.service_names.filter(s => s !== service.name);
                        setSlotForm({...slotForm, service_names: updated});
                      }}
                    />
                    <span>{service.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowAddSlotDialog(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleCreateSlot} className="flex-1 bg-emerald-600 hover:bg-emerald-700">Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Recurrence Dialog */}
      <Dialog open={showAddRecurrenceDialog} onOpenChange={setShowAddRecurrenceDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Recurring Availability</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Day of Week</Label>
              <Select value={recurrenceForm.day_of_week.toString()} onValueChange={v => setRecurrenceForm({...recurrenceForm, day_of_week: parseInt(v)})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {daysOfWeek.map((day, idx) => (
                    <SelectItem key={idx} value={idx.toString()}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time</Label>
                <Input type="time" value={recurrenceForm.start_time} onChange={e => setRecurrenceForm({...recurrenceForm, start_time: e.target.value})} />
              </div>
              <div>
                <Label>End Time</Label>
                <Input type="time" value={recurrenceForm.end_time} onChange={e => setRecurrenceForm({...recurrenceForm, end_time: e.target.value})} />
              </div>
            </div>
            <div>
              <Label>Location</Label>
              <Select value={recurrenceForm.location_id} onValueChange={v => setRecurrenceForm({...recurrenceForm, location_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>
                  {locations.map(loc => (
                    <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Services</Label>
              <div className="space-y-2 mt-2">
                {services.map(service => (
                  <label key={service.name} className="flex items-center gap-2">
                    <Checkbox
                      checked={recurrenceForm.service_names.includes(service.name)}
                      onCheckedChange={checked => {
                        const updated = checked
                          ? [...recurrenceForm.service_names, service.name]
                          : recurrenceForm.service_names.filter(s => s !== service.name);
                        setRecurrenceForm({...recurrenceForm, service_names: updated});
                      }}
                    />
                    <span>{service.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={recurrenceForm.recurrence_start_date} onChange={e => setRecurrenceForm({...recurrenceForm, recurrence_start_date: e.target.value})} />
            </div>
            <div>
              <Label>End Date (optional)</Label>
              <Input type="date" value={recurrenceForm.recurrence_end_date} onChange={e => setRecurrenceForm({...recurrenceForm, recurrence_end_date: e.target.value})} />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowAddRecurrenceDialog(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleCreateRecurrence} className="flex-1 bg-emerald-600 hover:bg-emerald-700">Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}