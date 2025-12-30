import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, Plus, Trash2, Edit, Clock, MapPin, Repeat, ChevronLeft, ChevronRight, Share2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CoachAvailability() {
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showSlotDialog, setShowSlotDialog] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [slotToEdit, setSlotToEdit] = useState(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [slotForm, setSlotForm] = useState({
    date: '',
    start_time: '09:00',
    end_time: '17:00',
    location_id: '',
    service_names: [],
    buffer_before: 0,
    buffer_after: 0,
    is_recurring: false,
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
  
  const [activeTab, setActiveTab] = useState('calendar');
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [serviceForm, setServiceForm] = useState({ name: '', duration: 60, color: '#10b981' });
  
  const updateCoachMutation = useMutation({
    mutationFn: (data) => base44.entities.Coach.update(currentCoach.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['coaches']);
      setShowServiceDialog(false);
      setServiceForm({ name: '', duration: 60, color: '#10b981' });
      toast.success('Services updated');
    }
  });

  const handleAddService = () => {
    if (!serviceForm.name) {
      toast.error('Please enter a service name');
      return;
    }
    const updatedServices = [...services, serviceForm];
    updateCoachMutation.mutate({ services: updatedServices });
  };

  const handleDeleteService = (serviceName) => {
    const updatedServices = services.filter(s => s.name !== serviceName);
    updateCoachMutation.mutate({ services: updatedServices });
  };

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
    queryKey: ['bookings', currentCoach?.id],
    queryFn: () => base44.entities.Booking.filter({ coach_id: currentCoach.id }),
    enabled: !!currentCoach
  });

  const createSlotMutation = useMutation({
    mutationFn: (data) => base44.entities.TimeSlot.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['timeSlots']);
      setShowSlotDialog(false);
      resetSlotForm();
      showSuccess('Time slot created successfully');
    }
  });

  const updateSlotMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TimeSlot.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['timeSlots']);
      setShowEditDialog(false);
      showSuccess('Time slot updated successfully');
    }
  });

  const deleteSlotMutation = useMutation({
    mutationFn: (id) => base44.entities.TimeSlot.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['timeSlots']);
      setShowDeleteDialog(false);
      showSuccess('Time slot deleted');
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
      setShowSlotDialog(false);
      resetSlotForm();
      showSuccess('Recurring availability created successfully');
    }
  });

  const deleteRecurrenceMutation = useMutation({
    mutationFn: async (patternId) => {
      await base44.entities.RecurrencePattern.delete(patternId);
      
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
      setShowDeleteDialog(false);
      showSuccess('All recurring slots deleted');
    }
  });

  const deleteRemainingRecurrenceMutation = useMutation({
    mutationFn: async ({ patternId, fromDate }) => {
      const slots = await base44.entities.TimeSlot.filter({ recurrence_id: patternId });
      const slotsToDelete = slots.filter(s => s.date >= fromDate);
      
      for (const slot of slotsToDelete) {
        await base44.entities.TimeSlot.delete(slot.id);
      }
      
      // Update pattern end date
      await base44.entities.RecurrencePattern.update(patternId, {
        recurrence_end_date: fromDate
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['recurrencePatterns']);
      queryClient.invalidateQueries(['timeSlots']);
      setShowDeleteDialog(false);
      showSuccess('Remaining occurrences deleted');
    }
  });

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccessDialog(true);
    setTimeout(() => setShowSuccessDialog(false), 2000);
  };

  const resetSlotForm = () => {
    setSlotForm({
      date: '',
      start_time: '09:00',
      end_time: '17:00',
      location_id: '',
      service_names: [],
      buffer_before: 0,
      buffer_after: 0,
      is_recurring: false,
      recurrence_start_date: format(new Date(), 'yyyy-MM-dd'),
      recurrence_end_date: ''
    });
  };

  const handleCreateSlot = () => {
    if (!slotForm.location_id || slotForm.service_names.length === 0) {
      toast.error('Please select location and at least one service');
      return;
    }

    if (slotForm.is_recurring) {
      // FIX: Use parseISO to properly parse the date in local timezone
      const dayOfWeek = parseISO(slotForm.recurrence_start_date + 'T00:00:00').getDay();
      createRecurrenceMutation.mutate({
        coach_id: currentCoach.id,
        day_of_week: dayOfWeek,
        start_time: slotForm.start_time,
        end_time: slotForm.end_time,
        location_id: slotForm.location_id,
        service_names: slotForm.service_names,
        buffer_before: slotForm.buffer_before,
        buffer_after: slotForm.buffer_after,
        recurrence_start_date: slotForm.recurrence_start_date,
        recurrence_end_date: slotForm.recurrence_end_date || null
      });
    } else {
      // Create single slot
      createSlotMutation.mutate({
        coach_id: currentCoach.id,
        date: slotForm.date,
        start_time: slotForm.start_time,
        end_time: slotForm.end_time,
        location_id: slotForm.location_id,
        service_names: slotForm.service_names,
        buffer_before: slotForm.buffer_before,
        buffer_after: slotForm.buffer_after,
        is_available: true
      });
    }
  };

  const handleSlotClick = (e, slot) => {
    e.stopPropagation();
    setSlotToEdit(slot);
    setShowEditDialog(true);
  };

  const handleDeleteSingle = () => {
    deleteSlotMutation.mutate(slotToEdit.id);
  };

  const handleDeleteAllRecurring = () => {
    if (slotToEdit.recurrence_id) {
      deleteRecurrenceMutation.mutate(slotToEdit.recurrence_id);
    }
  };

  const handleDeleteRemaining = () => {
    if (slotToEdit.recurrence_id) {
      deleteRemainingRecurrenceMutation.mutate({
        patternId: slotToEdit.recurrence_id,
        fromDate: slotToEdit.date
      });
    }
  };

  const handleDateClick = (date) => {
    const isPast = date < new Date(new Date().setHours(0,0,0,0));
    if (isPast) return;
    
    setSlotForm({ ...slotForm, date: format(date, 'yyyy-MM-dd'), recurrence_start_date: format(date, 'yyyy-MM-dd') });
    setEditingSlot(null);
    setShowSlotDialog(true);
  };

  const bookingPageUrl = `${window.location.origin}${window.location.pathname}#/BookingPage?coach=${currentCoach?.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(bookingPageUrl);
    toast.success('Booking link copied to clipboard');
  };

  // Calendar rendering
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getSlotsForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const slots = timeSlots.filter(s => s.date === dateStr);
    
    // Check if each slot is booked
    return slots.map(slot => {
      const slotBookings = bookings.filter(b => 
        b.booking_date === slot.date && 
        b.start_time === slot.start_time && 
        b.end_time === slot.end_time
      );
      return {
        ...slot,
        isBooked: slotBookings.length > 0,
        bookingInfo: slotBookings[0]
      };
    });
  };

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (!currentCoach) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Calendar className="w-8 h-8 text-emerald-600" />
              Manage Availability
            </h1>
            <p className="text-slate-600 mt-1">Set your available times for player bookings</p>
          </div>
          <Button onClick={() => setShowShareDialog(true)} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            <Share2 className="w-4 h-4" />
            Share Booking Link
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="mt-6">
            <Card className="border-none shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <div className="flex justify-between items-center">
                  <CardTitle>Manage Services</CardTitle>
                  <Button onClick={() => setShowServiceDialog(true)} variant="ghost" className="text-white hover:bg-white/20">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Service
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {services.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500 mb-4">No services configured yet</p>
                    <Button onClick={() => setShowServiceDialog(true)} className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Service
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {services.map((service, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: service.color }}></div>
                          <div>
                            <div className="font-semibold">{service.name}</div>
                            <div className="text-sm text-slate-500">{service.duration} minutes</div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteService(service.name)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
        <Card className="border-none shadow-xl">
          <CardHeader className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white">
            <div className="flex justify-between items-center">
              <CardTitle>Calendar</CardTitle>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-semibold px-4 py-2">
                  {format(currentMonth, 'MMMM yyyy')}
                </span>
                <Button 
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-4 flex gap-4 text-xs flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-emerald-100 border-2 border-emerald-400 rounded"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-100 border-2 border-purple-400 rounded"></div>
                <span>Recurring</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-100 border-2 border-red-400 rounded"></div>
                <span>Booked</span>
              </div>
            </div>
            
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
                const hasRecurring = daySlots.some(s => s.is_recurring_instance);
                
                return (
                  <div
                    key={idx}
                    onClick={() => !isPast && handleDateClick(day)}
                    className={`min-h-[100px] p-2 border rounded-xl cursor-pointer transition-all ${
                      !isCurrentMonth ? 'bg-slate-50 opacity-50' :
                      isPast ? 'bg-slate-100 cursor-not-allowed' :
                      hasRecurring ? 'bg-purple-50 border-purple-300 hover:bg-purple-100' :
                      daySlots.length > 0 ? 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100' :
                      'bg-white hover:bg-slate-50 hover:border-emerald-200'
                    } ${isToday ? 'ring-2 ring-emerald-500' : ''}`}
                  >
                    <div className={`text-sm font-medium mb-2 ${isToday ? 'text-emerald-600' : ''}`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1">
                      {daySlots.slice(0, 2).map(slot => (
                        <div
                          key={slot.id}
                          onClick={(e) => handleSlotClick(e, slot)}
                          className={`group relative text-xs p-1.5 rounded-lg font-medium transition-all ${
                            slot.isBooked
                              ? 'bg-red-200 text-red-900 hover:bg-red-300'
                              : slot.is_recurring_instance
                              ? 'bg-purple-200 text-purple-900 hover:bg-purple-300'
                              : 'bg-emerald-200 text-emerald-900 hover:bg-emerald-300'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            {slot.is_recurring_instance && <Repeat className="w-2.5 h-2.5" />}
                            {slot.isBooked && <span className="text-[8px]">●</span>}
                            <span>{slot.start_time}-{slot.end_time}</span>
                          </div>
                        </div>
                      ))}
                      {daySlots.length > 2 && (
                        <div className="text-xs text-slate-500 text-center">+{daySlots.length - 2}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
          </TabsContent>
        </Tabs>

        {/* Service Dialog */}
        <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Service</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Service Name *</Label>
                <Input value={serviceForm.name} onChange={e => setServiceForm({...serviceForm, name: e.target.value})} placeholder="e.g., 1-on-1 Training" />
              </div>
              <div>
                <Label>Duration (minutes) *</Label>
                <Input type="number" min="15" step="15" value={serviceForm.duration} onChange={e => setServiceForm({...serviceForm, duration: parseInt(e.target.value)})} />
              </div>
              <div>
                <Label>Color</Label>
                <Input type="color" value={serviceForm.color} onChange={e => setServiceForm({...serviceForm, color: e.target.value})} />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowServiceDialog(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleAddService} className="flex-1 bg-purple-600 hover:bg-purple-700">Add Service</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add/Edit Slot Dialog */}
        <Dialog open={showSlotDialog} onOpenChange={setShowSlotDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                Add Availability
              </DialogTitle>
              <DialogDescription>
                Set up your available time for player bookings
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 mt-4">
              {/* Recurring Toggle */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border-2 border-purple-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Repeat className="w-5 h-5 text-purple-600" />
                    <div>
                      <Label className="text-base font-semibold text-slate-900">Make this recurring</Label>
                      <p className="text-xs text-slate-600">Repeat this availability weekly</p>
                    </div>
                  </div>
                  <Switch
                    checked={slotForm.is_recurring}
                    onCheckedChange={(checked) => setSlotForm({...slotForm, is_recurring: checked})}
                    className="data-[state=checked]:bg-purple-600"
                  />
                </div>
              </div>

              {/* Date or Day Selection */}
              {slotForm.is_recurring ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-2 text-sm font-semibold">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      Start Date *
                    </Label>
                    <Input
                      type="date"
                      value={slotForm.recurrence_start_date}
                      onChange={e => setSlotForm({...slotForm, recurrence_start_date: e.target.value})}
                      className="mt-1"
                      min={format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2 text-sm font-semibold">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      End Date (optional)
                    </Label>
                    <Input
                      type="date"
                      value={slotForm.recurrence_end_date}
                      onChange={e => setSlotForm({...slotForm, recurrence_end_date: e.target.value})}
                      className="mt-1"
                      min={slotForm.recurrence_start_date}
                    />
                    <p className="text-xs text-slate-500 mt-1">Leave empty for indefinite</p>
                  </div>
                </div>
              ) : (
                <div>
                  <Label className="flex items-center gap-2 text-sm font-semibold">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    Date *
                  </Label>
                  <Input
                    type="date"
                    value={slotForm.date}
                    onChange={e => setSlotForm({...slotForm, date: e.target.value})}
                    className="mt-1"
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
              )}

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2 text-sm font-semibold">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    Start Time *
                  </Label>
                  <Input
                    type="time"
                    value={slotForm.start_time}
                    onChange={e => setSlotForm({...slotForm, start_time: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2 text-sm font-semibold">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    End Time *
                  </Label>
                  <Input
                    type="time"
                    value={slotForm.end_time}
                    onChange={e => setSlotForm({...slotForm, end_time: e.target.value})}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  Location *
                </Label>
                <Select value={slotForm.location_id} onValueChange={v => setSlotForm({...slotForm, location_id: v})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Services */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Services Available *</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto p-3 bg-slate-50 rounded-lg">
                  {services.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">No services configured</p>
                  ) : (
                    services.map(service => (
                      <label key={service.name} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg transition-colors cursor-pointer">
                        <Checkbox
                          checked={slotForm.service_names.includes(service.name)}
                          onCheckedChange={checked => {
                            const updated = checked
                              ? [...slotForm.service_names, service.name]
                              : slotForm.service_names.filter(s => s !== service.name);
                            setSlotForm({...slotForm, service_names: updated});
                          }}
                        />
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: service.color }}></div>
                        <span className="flex-1">{service.name}</span>
                        <span className="text-xs text-slate-500">{service.duration} min</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Buffers */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Buffer Before (minutes)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="5"
                    value={slotForm.buffer_before}
                    onChange={e => setSlotForm({...slotForm, buffer_before: parseInt(e.target.value) || 0})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Buffer After (minutes)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="5"
                    value={slotForm.buffer_after}
                    onChange={e => setSlotForm({...slotForm, buffer_after: parseInt(e.target.value) || 0})}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t">
                <Button variant="outline" onClick={() => setShowSlotDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateSlot} 
                  disabled={
                    !slotForm.location_id || 
                    slotForm.service_names.length === 0 ||
                    (!slotForm.is_recurring && !slotForm.date) ||
                    (slotForm.is_recurring && !slotForm.recurrence_start_date)
                  }
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                >
                  {slotForm.is_recurring ? 'Create Recurring Availability' : 'Create Time Slot'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit/Delete Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Manage Time Slot</DialogTitle>
              <DialogDescription>
                {slotToEdit && format(new Date(slotToEdit.date), 'EEEE, MMMM d, yyyy')}
              </DialogDescription>
            </DialogHeader>
            
            {slotToEdit && (
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold">{slotToEdit.start_time} - {slotToEdit.end_time}</span>
                </div>
                <div className="text-sm text-slate-600">
                  Services: {slotToEdit.service_names?.join(', ')}
                </div>
                {slotToEdit.isBooked && (
                  <Badge className="mt-2 bg-red-100 text-red-800">
                    Booked by {slotToEdit.bookingInfo?.player_name}
                  </Badge>
                )}
                {slotToEdit.is_recurring_instance && (
                  <Badge className="mt-2 bg-purple-100 text-purple-800">
                    <Repeat className="w-3 h-3 mr-1" />
                    Recurring Event
                  </Badge>
                )}
              </div>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                    onClick={handleDeleteSingle}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete This Slot Only
                  </Button>

                  {slotToEdit.is_recurring_instance && (
                    <>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-orange-600 hover:bg-orange-50 hover:text-orange-700 border-orange-200"
                        onClick={handleDeleteRemaining}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete This & All Future Occurrences
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="w-full justify-start text-red-700 hover:bg-red-50 hover:text-red-800 border-red-300"
                        onClick={handleDeleteAllRecurring}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete All Occurrences in Series
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  variant="ghost"
                  onClick={() => setShowEditDialog(false)}
                  className="w-full mt-4"
                >
                  Cancel
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Share Dialog */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Share2 className="w-5 h-5 text-emerald-600" />
                Share Your Booking Page
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <p className="text-sm text-emerald-900 mb-3">
                  Share this link with players and parents. They can book sessions with you even if they're not on your teams.
                </p>
                <div className="flex gap-2">
                  <Input
                    value={bookingPageUrl}
                    readOnly
                    className="flex-1 bg-white font-mono text-xs"
                  />
                  <Button onClick={handleCopyLink} variant="outline" size="icon">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="max-w-sm">
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Success!</h3>
              <p className="text-slate-600">{successMessage}</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}