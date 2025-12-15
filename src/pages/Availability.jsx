import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, Plus, Edit, Trash2, Clock, CheckCircle, CalendarDays, List } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import SlotEditor from '../components/booking/SlotEditor';
import AvailabilityCalendarView from '../components/availability/AvailabilityCalendarView';
import { format } from 'date-fns';


export default function Availability() {
  const [showSlotDialog, setShowSlotDialog] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({ name: '', duration: 60, color: '#22c55e' });
  const [blackoutDates, setBlackoutDates] = useState([]);


  const queryClient = useQueryClient();


  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });


  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list()
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => base44.entities.Booking.list()
  });


  const currentCoach = coaches.find(c => c.email === user?.email);
  const isAdmin = user?.role === 'admin';
  
  // Filter bookings for coaches
  const relevantBookings = isAdmin 
    ? bookings 
    : bookings.filter(b => b.coach_id === currentCoach?.id);


  React.useEffect(() => {
    if (currentCoach?.services) {
      setServices(currentCoach.services);
    } else {
      setServices([
        { name: 'Individual Training', duration: 60, color: '#22c55e' },
        { name: 'Evaluation Session', duration: 45, color: '#3b82f6' },
        { name: 'Physical Assessment', duration: 30, color: '#f59e0b' }
      ]);
    }
    if (currentCoach?.blackout_dates) {
      setBlackoutDates(currentCoach.blackout_dates);
    }
  }, [currentCoach]);


  const updateCoachMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      if (id) {
        return await base44.entities.Coach.update(id, data);
      } else {
        return await base44.entities.Coach.create({
          full_name: user.full_name,
          email: user.email,
          specialization: 'General Coaching',
          is_admin: user.role === 'admin',
          booking_enabled: true,
          ...data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['coaches']);
    }
  });


  const availabilitySlots = currentCoach?.availability_slots || [];


  const handleSaveSlot = async (slotData) => {
    let updatedSlots = [...availabilitySlots];
   
    if (editingSlot) {
      updatedSlots = updatedSlots.map(s => s.id === slotData.id ? slotData : s);
    } else {
      updatedSlots.push(slotData);
    }


    await updateCoachMutation.mutateAsync({
      id: currentCoach?.id,
      data: { availability_slots: updatedSlots, services, blackout_dates: blackoutDates }
    });


    setShowSlotDialog(false);
    setEditingSlot(null);
  };


  const handleDeleteSlot = async (slotId) => {
    const updatedSlots = availabilitySlots.filter(s => s.id !== slotId);
    await updateCoachMutation.mutateAsync({
      id: currentCoach?.id,
      data: { availability_slots: updatedSlots, services, blackout_dates: blackoutDates }
    });
  };


  const handleDeleteRecurringSlots = async (slot) => {
    const updatedSlots = availabilitySlots.filter(s =>
      !(s.day_of_week === slot.day_of_week && s.start_time === slot.start_time && s.end_time === slot.end_time)
    );
    await updateCoachMutation.mutateAsync({
      id: currentCoach?.id,
      data: { availability_slots: updatedSlots, services, blackout_dates: blackoutDates }
    });
  };


  const handleAddBlackout = async (date) => {
    const updatedBlackouts = [...blackoutDates, date];
    setBlackoutDates(updatedBlackouts);
    await updateCoachMutation.mutateAsync({
      id: currentCoach?.id,
      data: { availability_slots: availabilitySlots, services, blackout_dates: updatedBlackouts }
    });
  };


  const handleRemoveBlackout = async (date) => {
    const updatedBlackouts = blackoutDates.filter(d => d !== date);
    setBlackoutDates(updatedBlackouts);
    await updateCoachMutation.mutateAsync({
      id: currentCoach?.id,
      data: { availability_slots: availabilitySlots, services, blackout_dates: updatedBlackouts }
    });
  };


  const handleSaveServices = async () => {
    if (!newService.name) return;
   
    const updatedServices = [...services, newService];
    setServices(updatedServices);
   
    await updateCoachMutation.mutateAsync({
      id: currentCoach?.id,
      data: { services: updatedServices, availability_slots: availabilitySlots, blackout_dates: blackoutDates }
    });
   
    setNewService({ name: '', duration: 60, color: '#22c55e' });
    setShowServiceDialog(false);
  };


  const handleDeleteService = async (serviceName) => {
    if (!window.confirm('Delete this service?')) return;
   
    const updatedServices = services.filter(s => s.name !== serviceName);
    setServices(updatedServices);
   
    await updateCoachMutation.mutateAsync({
      id: currentCoach?.id,
      data: { services: updatedServices, availability_slots: availabilitySlots, blackout_dates: blackoutDates }
    });
  };


  const groupSlotsByDay = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const grouped = {};
   
    days.forEach((day, idx) => {
      grouped[day] = availabilitySlots.filter(slot => slot.day_of_week === idx);
    });
   
    return grouped;
  };


  const slotsByDay = groupSlotsByDay();

  const getLocationName = (locationId) => {
    const location = locations.find(l => l.id === locationId);
    return location ? `${location.name}` : 'No location';
  };


  if (!user) return null;


  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Calendar className="w-7 h-7 md:w-8 md:h-8 text-emerald-600" />
          Manage Availability
        </h1>
        <p className="text-sm md:text-base text-slate-600 mt-1">Configure your booking schedule and services</p>
      </div>


      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            <span className="hidden sm:inline">Calendar View</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Weekly Schedule</span>
          </TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>


        <TabsContent value="calendar" className="space-y-6">
          <AvailabilityCalendarView
            slots={availabilitySlots}
            services={services}
            blackoutDates={blackoutDates}
            bookings={relevantBookings}
            onAddSlot={handleSaveSlot}
            onEditSlot={handleSaveSlot}
            onDeleteSlot={handleDeleteSlot}
            onDeleteRecurringSlots={handleDeleteRecurringSlots}
            onAddBlackout={handleAddBlackout}
            onRemoveBlackout={handleRemoveBlackout}
          />
        </TabsContent>


        <TabsContent value="schedule" className="space-y-6">
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-white">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-600" />
                  Availability Time Slots
                </CardTitle>
                <Button
                  onClick={() => { setEditingSlot(null); setShowSlotDialog(true); }}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Time Slot
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {availabilitySlots.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Availability Set</h3>
                  <p className="text-slate-600 mb-4">Add time slots to allow bookings</p>
                  <Button
                    onClick={() => setShowSlotDialog(true)}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Slot
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(slotsByDay).map(([day, slots]) => (
                    <div key={day}>
                      <h3 className="text-base md:text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <div className="w-2 h-6 md:h-8 bg-emerald-500 rounded-full" />
                        {day}
                      </h3>
                      {slots.length === 0 ? (
                        <p className="text-sm text-slate-500 ml-4 mb-4">No slots configured</p>
                      ) : (
                        <div className="grid gap-3 ml-4">
                          {slots.map(slot => (
                            <Card key={slot.id} className="border-l-4 border-l-emerald-500">
                              <CardContent className="p-3 md:p-4">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                      <Badge className="bg-slate-900 text-white text-xs">
                                        {slot.start_time} - {slot.end_time}
                                      </Badge>
                                      {slot.is_recurring && (
                                        <Badge variant="outline" className="text-emerald-600 border-emerald-600 text-xs">
                                          Recurring
                                        </Badge>
                                      )}
                                      {slot.location_id && (
                                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                                          {getLocationName(slot.location_id)}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap gap-1 mb-2">
                                      {slot.services?.map(serviceName => {
                                        const service = services.find(s => s.name === serviceName);
                                        return (
                                          <Badge key={serviceName} className="text-xs" style={{ backgroundColor: service?.color || '#6366f1' }}>
                                            {serviceName}
                                          </Badge>
                                        );
                                      })}
                                    </div>
                                    <div className="text-xs text-slate-500 space-y-1">
                                      {slot.buffer_before > 0 && <div>Buffer before: {slot.buffer_before} min</div>}
                                      {slot.buffer_after > 0 && <div>Buffer after: {slot.buffer_after} min</div>}
                                      {slot.is_recurring && (
                                        <div>
                                          {slot.recurring_start_date && `From: ${format(new Date(slot.recurring_start_date), 'MMM d, yyyy')}`}
                                          {slot.recurring_end_date && ` - Until: ${format(new Date(slot.recurring_end_date), 'MMM d, yyyy')}`}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => { setEditingSlot(slot); setShowSlotDialog(true); }}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                                      onClick={() => handleDeleteSlot(slot.id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>


          <Card className="border-none shadow-lg bg-blue-50">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">How it works</h3>
                  <ul className="text-sm text-slate-700 space-y-1">
                    <li>• Add time slots for each day you're available</li>
                    <li>• Select which services are bookable during each slot</li>
                    <li>• Set the location for each availability slot</li>
                    <li>• Set buffers to add padding between sessions</li>
                    <li>• Make slots recurring for consistent weekly availability</li>
                    <li>• Click on dates to add blackouts</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="services" className="space-y-6">
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-white">
              <div className="flex items-center justify-between">
                <CardTitle>Available Services</CardTitle>
                <Button
                  onClick={() => setShowServiceDialog(true)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Service
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {services.length === 0 ? (
                <div className="text-center py-12 text-slate-500">No services configured</div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {services.map((service, idx) => (
                    <Card key={idx} className="border-l-4" style={{ borderLeftColor: service.color }}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: service.color }} />
                              <h3 className="font-semibold text-slate-900">{service.name}</h3>
                            </div>
                            <p className="text-sm text-slate-600">{service.duration} minutes</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteService(service.name)}
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


      <Dialog open={showSlotDialog} onOpenChange={setShowSlotDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <SlotEditor
            slot={editingSlot}
            services={services}
            locations={locations}
            onSave={handleSaveSlot}
            onCancel={() => { setShowSlotDialog(false); setEditingSlot(null); }}
          />
        </DialogContent>
      </Dialog>


      <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Service Name</Label>
              <Input
                value={newService.name}
                onChange={(e) => setNewService({...newService, name: e.target.value})}
                placeholder="e.g., Individual Training"
              />
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                min="15"
                step="15"
                value={newService.duration}
                onChange={(e) => setNewService({...newService, duration: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <Label>Color</Label>
              <Input
                type="color"
                value={newService.color}
                onChange={(e) => setNewService({...newService, color: e.target.value})}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowServiceDialog(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSaveServices}
              disabled={!newService.name}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              Add Service
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}