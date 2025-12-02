import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Clock, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, List } from 'lucide-react';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Availability() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('calendar');
  const [showSlotDialog, setShowSlotDialog] = useState(false);
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const [slotForm, setSlotForm] = useState({
    day_of_week: 0,
    start_time: '09:00',
    end_time: '17:00',
    services: [],
    buffer_before: 0,
    buffer_after: 0,
    is_recurring: true,
    recurring_start_date: '',
    recurring_end_date: ''
  });
  
  const [serviceForm, setServiceForm] = useState({
    name: '',
    duration: 30,
    color: '#10b981'
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

  const updateCoachMutation = useMutation({
    mutationFn: (data) => base44.entities.Coach.update(currentCoach.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['coaches']);
      setShowSlotDialog(false);
      setShowServiceDialog(false);
      setEditingSlot(null);
    }
  });

  const availabilitySlots = currentCoach?.availability_slots || [];
  const services = currentCoach?.services || [];

  const handleSaveSlot = () => {
    const newSlot = {
      ...slotForm,
      id: editingSlot?.id || `slot_${Date.now()}`
    };
    
    let updatedSlots;
    if (editingSlot) {
      updatedSlots = availabilitySlots.map(s => s.id === editingSlot.id ? newSlot : s);
    } else {
      updatedSlots = [...availabilitySlots, newSlot];
    }
    
    updateCoachMutation.mutate({ availability_slots: updatedSlots });
  };

  const handleDeleteSlot = (slotId) => {
    const updatedSlots = availabilitySlots.filter(s => s.id !== slotId);
    updateCoachMutation.mutate({ availability_slots: updatedSlots });
  };

  const handleSaveService = () => {
    const newService = { ...serviceForm };
    const updatedServices = [...services, newService];
    updateCoachMutation.mutate({ services: updatedServices });
    setServiceForm({ name: '', duration: 30, color: '#10b981' });
  };

  const handleDeleteService = (serviceName) => {
    const updatedServices = services.filter(s => s.name !== serviceName);
    updateCoachMutation.mutate({ services: updatedServices });
  };

  const openEditSlot = (slot) => {
    setEditingSlot(slot);
    setSlotForm({
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      services: slot.services || [],
      buffer_before: slot.buffer_before || 0,
      buffer_after: slot.buffer_after || 0,
      is_recurring: slot.is_recurring !== false,
      recurring_start_date: slot.recurring_start_date || '',
      recurring_end_date: slot.recurring_end_date || ''
    });
    setShowSlotDialog(true);
  };

  const openAddSlot = () => {
    setEditingSlot(null);
    setSlotForm({
      day_of_week: 0,
      start_time: '09:00',
      end_time: '17:00',
      services: [],
      buffer_before: 0,
      buffer_after: 0,
      is_recurring: true,
      recurring_start_date: '',
      recurring_end_date: ''
    });
    setShowSlotDialog(true);
  };

  // Calendar logic
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startingDay; i++) {
      const prevDate = new Date(year, month, -startingDay + i + 1);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    return days;
  };

  const getSlotForDate = (date) => {
    const dayOfWeek = date.getDay();
    return availabilitySlots.filter(slot => {
      if (slot.day_of_week !== dayOfWeek) return false;
      if (slot.recurring_start_date) {
        const startDate = new Date(slot.recurring_start_date);
        if (date < startDate) return false;
      }
      if (slot.recurring_end_date) {
        const endDate = new Date(slot.recurring_end_date);
        if (date > endDate) return false;
      }
      return true;
    });
  };

  const calendarDays = getDaysInMonth(currentMonth);

  if (!currentCoach) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <Card className="border-none shadow-lg">
          <CardContent className="p-12 text-center">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-700 mb-2">Coach Profile Required</h2>
            <p className="text-slate-500">You need to be registered as a coach to manage availability.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Calendar className="w-8 h-8 text-emerald-600" />
          Manage Availability
        </h1>
        <p className="text-slate-600 mt-1">Configure your booking schedule and services</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 bg-slate-100">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            Weekly Schedule
          </TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <Card className="border-none shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Availability Calendar
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 bg-emerald-100 border border-emerald-300 rounded" />
                  <span>Available</span>
                  <div className="w-4 h-4 bg-red-100 border border-red-300 rounded ml-2" />
                  <span>Blackout</span>
                  <div className="w-4 h-4 bg-slate-100 border border-slate-300 rounded ml-2" />
                  <span>No availability</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="font-medium min-w-[140px] text-center">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <Button variant="outline" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="bg-slate-50 p-2 text-center text-sm font-medium text-slate-600">
                    {day}
                  </div>
                ))}
                {calendarDays.map((day, idx) => {
                  const slots = getSlotForDate(day.date);
                  const hasAvailability = slots.length > 0;
                  return (
                    <div
                      key={idx}
                      className={`bg-white p-2 min-h-[100px] ${!day.isCurrentMonth ? 'bg-slate-50 text-slate-400' : ''} ${hasAvailability ? 'bg-emerald-50' : ''}`}
                    >
                      <div className="text-sm font-medium mb-1">{day.date.getDate()}</div>
                      {slots.map((slot, i) => (
                        <div key={i} className="text-xs bg-emerald-100 text-emerald-800 rounded px-1 py-0.5 mb-1">
                          {slot.start_time}-{slot.end_time}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly">
          <Card className="border-none shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Availability Time Slots
              </CardTitle>
              <Button onClick={openAddSlot} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Time Slot
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {DAYS_OF_WEEK.map((day, dayIndex) => {
                  const daySlots = availabilitySlots.filter(s => s.day_of_week === dayIndex);
                  return (
                    <div key={day} className="border-l-4 border-emerald-500 pl-4">
                      <h3 className="font-bold text-slate-900 mb-2">{day}</h3>
                      {daySlots.length === 0 ? (
                        <p className="text-sm text-slate-400">No slots configured</p>
                      ) : (
                        <div className="space-y-2">
                          {daySlots.map((slot, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                              <div className="flex items-center gap-4">
                                <Badge variant="outline" className="font-mono">
                                  {slot.start_time} - {slot.end_time}
                                </Badge>
                                {slot.is_recurring && <Badge className="bg-blue-100 text-blue-800">Recurring</Badge>}
                                {slot.services?.map(s => (
                                  <Badge key={s} className="bg-emerald-100 text-emerald-800">{s}</Badge>
                                ))}
                                {slot.buffer_after > 0 && (
                                  <span className="text-xs text-slate-500">Buffer after: {slot.buffer_after} min</span>
                                )}
                                {slot.recurring_start_date && (
                                  <span className="text-xs text-slate-500">
                                    From {new Date(slot.recurring_start_date).toLocaleDateString()} - Until {slot.recurring_end_date ? new Date(slot.recurring_end_date).toLocaleDateString() : 'indefinite'}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={() => openEditSlot(slot)}>
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteSlot(slot.id)}>
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card className="border-none shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Available Services</CardTitle>
              <Button onClick={() => setShowServiceDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Service
              </Button>
            </CardHeader>
            <CardContent>
              {services.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No services configured yet</p>
              ) : (
                <div className="space-y-3">
                  {services.map((service, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border-l-4" style={{ borderColor: service.color }}>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: service.color }} />
                        <span className="font-medium">{service.name}</span>
                        <span className="text-sm text-slate-500">{service.duration} minutes</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteService(service.name)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Slot Dialog */}
      <Dialog open={showSlotDialog} onOpenChange={setShowSlotDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSlot ? 'Edit Time Slot' : 'Add Time Slot'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4" />
                Day of Week
              </Label>
              <Select value={String(slotForm.day_of_week)} onValueChange={(v) => setSlotForm({...slotForm, day_of_week: parseInt(v)})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day, idx) => (
                    <SelectItem key={idx} value={String(idx)}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4" />
                  Start Time
                </Label>
                <Input type="time" value={slotForm.start_time} onChange={(e) => setSlotForm({...slotForm, start_time: e.target.value})} />
              </div>
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4" />
                  End Time
                </Label>
                <Input type="time" value={slotForm.end_time} onChange={(e) => setSlotForm({...slotForm, end_time: e.target.value})} />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Available Services</Label>
              <div className="space-y-2">
                {services.map(service => (
                  <div key={service.name} className="flex items-center gap-2">
                    <Checkbox
                      checked={slotForm.services.includes(service.name)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSlotForm({...slotForm, services: [...slotForm.services, service.name]});
                        } else {
                          setSlotForm({...slotForm, services: slotForm.services.filter(s => s !== service.name)});
                        }
                      }}
                    />
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: service.color }} />
                    <span>{service.name}</span>
                    <span className="text-xs text-slate-500">{service.duration} minutes</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Buffer Before (minutes)</Label>
                <Input type="number" value={slotForm.buffer_before} onChange={(e) => setSlotForm({...slotForm, buffer_before: parseInt(e.target.value) || 0})} />
              </div>
              <div>
                <Label className="mb-2 block">Buffer After (minutes)</Label>
                <Input type="number" value={slotForm.buffer_after} onChange={(e) => setSlotForm({...slotForm, buffer_after: parseInt(e.target.value) || 0})} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={slotForm.is_recurring} onCheckedChange={(checked) => setSlotForm({...slotForm, is_recurring: checked})} />
              <Label>Recurring Weekly</Label>
            </div>
            {slotForm.is_recurring && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block">Recurring From</Label>
                  <Input type="date" value={slotForm.recurring_start_date} onChange={(e) => setSlotForm({...slotForm, recurring_start_date: e.target.value})} />
                </div>
                <div>
                  <Label className="mb-2 block">Recurring Until</Label>
                  <Input type="date" value={slotForm.recurring_end_date} onChange={(e) => setSlotForm({...slotForm, recurring_end_date: e.target.value})} />
                  <span className="text-xs text-slate-500">Leave empty for indefinite</span>
                </div>
              </div>
            )}
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowSlotDialog(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSaveSlot} className="flex-1 bg-emerald-600 hover:bg-emerald-700">Save Slot</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Service Dialog */}
      <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="mb-2 block">Service Name</Label>
              <Input value={serviceForm.name} onChange={(e) => setServiceForm({...serviceForm, name: e.target.value})} placeholder="e.g., IDP Meeting" />
            </div>
            <div>
              <Label className="mb-2 block">Duration (minutes)</Label>
              <Input type="number" value={serviceForm.duration} onChange={(e) => setServiceForm({...serviceForm, duration: parseInt(e.target.value) || 30})} />
            </div>
            <div>
              <Label className="mb-2 block">Color</Label>
              <Input type="color" value={serviceForm.color} onChange={(e) => setServiceForm({...serviceForm, color: e.target.value})} className="h-10 w-full" />
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowServiceDialog(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSaveService} disabled={!serviceForm.name} className="flex-1 bg-emerald-600 hover:bg-emerald-700">Add Service</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}