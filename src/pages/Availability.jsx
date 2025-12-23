import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, Plus, Edit, Trash2, Clock, CheckCircle, CalendarDays, List, Search, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import SlotEditor from '../components/booking/SlotEditor';
import AvailabilityCalendarView from '../components/availability/AvailabilityCalendarView';
import ShareBookingLinkDialog from '../components/booking/ShareBookingLinkDialog';
import { format } from 'date-fns';


export default function Availability() {
  const [showSlotDialog, setShowSlotDialog] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({ name: '', duration: 60, color: '#22c55e' });
  const [blackoutDates, setBlackoutDates] = useState([]);
  const [selectedCoachIds, setSelectedCoachIds] = useState([]);
  const [coachSearchTerm, setCoachSearchTerm] = useState('');
  const [showShareDialog, setShowShareDialog] = useState(false);

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
  
  // For admins, show only selected coaches. For regular coaches, show themselves.
  const viewingCoaches = isAdmin && selectedCoachIds.length > 0 
    ? coaches.filter(c => selectedCoachIds.includes(c.id))
    : currentCoach ? [currentCoach] : [];
  
  // Filter bookings based on selected coaches
  const relevantBookings = isAdmin && selectedCoachIds.length > 0
    ? bookings.filter(b => selectedCoachIds.includes(b.coach_id))
    : bookings.filter(b => b.coach_id === currentCoach?.id);

  // Filter coaches based on search
  const filteredCoaches = coaches.filter(c => 
    c.full_name?.toLowerCase().includes(coachSearchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(coachSearchTerm.toLowerCase())
  );

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

  const availabilitySlots = viewingCoaches.flatMap(c => 
    (c?.availability_slots || []).map(slot => ({ ...slot, coach_id: c.id, coach_name: c.full_name }))
  );

  const handleSaveSlot = async (slotData) => {
    const targetCoachId = editingSlot?.coach_id || currentCoach?.id;
    const targetCoach = coaches.find(c => c.id === targetCoachId);
    
    if (!targetCoach) return;

    const coachSlots = targetCoach.availability_slots || [];
    let updatedSlots;

    if (editingSlot) {
      updatedSlots = coachSlots.map(s => s.id === slotData.id ? slotData : s);
    } else {
      updatedSlots = [...coachSlots, slotData];
    }

    await updateCoachMutation.mutateAsync({
      id: targetCoach.id,
      data: { 
        availability_slots: updatedSlots
      }
    });

    setShowSlotDialog(false);
    setEditingSlot(null);
  };

  const handleDeleteSlot = async (slotId) => {
    const slotToDelete = availabilitySlots.find(s => s.id === slotId);
    const targetCoach = coaches.find(c => c.id === slotToDelete?.coach_id);
    
    if (!targetCoach) return;

    const updatedSlots = (targetCoach.availability_slots || []).filter(s => s.id !== slotId);
    await updateCoachMutation.mutateAsync({
      id: targetCoach.id,
      data: { 
        availability_slots: updatedSlots
      }
    });
  };

  const handleDeleteRecurringSlots = async (slot) => {
    const targetCoach = coaches.find(c => c.id === slot.coach_id);
    if (!targetCoach) return;

    const updatedSlots = (targetCoach.availability_slots || []).filter(s =>
      !(s.day_of_week === slot.day_of_week && s.start_time === slot.start_time && s.end_time === slot.end_time && s.is_recurring)
    );
    await updateCoachMutation.mutateAsync({
      id: targetCoach.id,
      data: { 
        availability_slots: updatedSlots
      }
    });
  };

  const handleAddBlackout = async (date) => {
    const updatedBlackouts = [...blackoutDates, date];
    setBlackoutDates(updatedBlackouts);
    await updateCoachMutation.mutateAsync({
      id: currentCoach?.id,
      data: { blackout_dates: updatedBlackouts }
    });
  };

  const handleRemoveBlackout = async (date) => {
    const updatedBlackouts = blackoutDates.filter(d => d !== date);
    setBlackoutDates(updatedBlackouts);
    await updateCoachMutation.mutateAsync({
      id: currentCoach?.id,
      data: { blackout_dates: updatedBlackouts }
    });
  };

  const handleSaveServices = async () => {
    if (!newService.name) return;
   
    const updatedServices = [...services, newService];
    setServices(updatedServices);
   
    await updateCoachMutation.mutateAsync({
      id: currentCoach?.id,
      data: { services: updatedServices }
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
      data: { services: updatedServices }
    });
  };

  const groupSlotsByDay = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const grouped = {};
   
    days.forEach((day, idx) => {
      grouped[day] = availabilitySlots.filter(slot => slot.day_of_week === idx).sort((a, b) => {
        const aTime = a.start_time || '';
        const bTime = b.start_time || '';
        return aTime.localeCompare(bTime);
      });
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
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Calendar className="w-7 h-7 md:w-8 md:h-8 text-emerald-600" />
              Manage Availability
            </h1>
            <p className="text-sm md:text-base text-slate-600 mt-1">Configure your booking schedule and services</p>
          </div>
          {currentCoach && !isAdmin && (
            <Button 
              variant="outline" 
              onClick={() => setShowShareDialog(true)}
              className="gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share Booking Link
            </Button>
          )}
          {isAdmin && (
            <div className="flex-1 max-w-md">
              <Label className="text-xs text-slate-600 mb-2 block">Search & Select Coaches</Label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Search coaches..." 
                  value={coachSearchTerm}
                  onChange={(e) => setCoachSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              {selectedCoachIds.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {selectedCoachIds.map(id => {
                    const coach = coaches.find(c => c.id === id);
                    return (
                      <Badge key={id} className="bg-emerald-100 text-emerald-800">
                        {coach?.full_name}
                        <button onClick={() => setSelectedCoachIds(prev => prev.filter(cid => cid !== id))} className="ml-1">×</button>
                      </Badge>
                    );
                  })}
                </div>
              )}
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-lg">
                {filteredCoaches.length === 0 ? (
                  <p className="text-xs text-slate-500">No coaches found</p>
                ) : (
                  filteredCoaches.map(coach => (
                    <Badge 
                      key={coach.id} 
                      className={`cursor-pointer ${
                        selectedCoachIds.includes(coach.id)
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                      onClick={() => {
                        if (selectedCoachIds.includes(coach.id)) {
                          setSelectedCoachIds(prev => prev.filter(id => id !== coach.id));
                        } else {
                          setSelectedCoachIds(prev => [...prev, coach.id]);
                        }
                      }}
                    >
                      {selectedCoachIds.includes(coach.id) ? '✓ ' : '+ '}
                      {coach.full_name}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
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
            onEditSlot={(slotData) => handleSaveSlot({ ...slotData, coach_id: slotData.coach_id || currentCoach?.id })}
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
                {!isAdmin || selectedCoachIds.length === 0 ? (
                  <Button
                    onClick={() => { setEditingSlot(null); setShowSlotDialog(true); }}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Time Slot
                  </Button>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {availabilitySlots.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Availability Set</h3>
                  <p className="text-slate-600 mb-4">
                    {isAdmin && selectedCoachIds.length > 0 
                      ? 'Selected coaches have no availability configured'
                      : 'Add time slots to allow bookings'}
                  </p>
                  {(!isAdmin || selectedCoachIds.length === 0) && (
                    <Button
                      onClick={() => setShowSlotDialog(true)}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Slot
                    </Button>
                  )}
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
                                      {isAdmin && viewingCoaches.length > 1 && (
                                        <Badge className="bg-purple-100 text-purple-800 text-xs">
                                          {slot.coach_name}
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
                                  {(!isAdmin || slot.coach_id === currentCoach?.id) && (
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
                                  )}
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

      <ShareBookingLinkDialog
        open={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        coach={currentCoach}
      />
    </div>
  );
}