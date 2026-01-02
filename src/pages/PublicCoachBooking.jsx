import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, User, CheckCircle, MapPin } from 'lucide-react';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, parse, addMinutes } from 'date-fns';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';

export default function PublicCoachBooking() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const coachId = urlParams.get('coach');

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedBookableSlot, setSelectedBookableSlot] = useState(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    player_name: '',
    parent_email: '',
    phone: '',
    notes: ''
  });

  const { data: coach, isLoading: coachLoading } = useQuery({
    queryKey: ['coach', coachId],
    queryFn: async () => {
      if (!coachId) return null;
      const response = await fetch(`${base44.apiUrl}/api/entities/Coach/${coachId}`, {
        headers: { 'x-app-id': base44.appId }
      });
      if (!response.ok) return null;
      return await response.json();
    },
    enabled: !!coachId
  });

  const { data: timeSlots = [] } = useQuery({
    queryKey: ['timeSlots', coachId],
    queryFn: async () => {
      const response = await fetch(`${base44.apiUrl}/api/entities/TimeSlot?coach_id=${coachId}`, {
        headers: { 'x-app-id': base44.appId }
      });
      if (!response.ok) return [];
      return await response.json();
    },
    enabled: !!coachId
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const response = await fetch(`${base44.apiUrl}/api/entities/Booking`, {
        headers: { 'x-app-id': base44.appId }
      });
      if (!response.ok) return [];
      return await response.json();
    }
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const response = await fetch(`${base44.apiUrl}/api/entities/Location`, {
        headers: { 'x-app-id': base44.appId }
      });
      if (!response.ok) return [];
      return await response.json();
    }
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch(`${base44.apiUrl}/api/entities/Booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-id': base44.appId
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create booking');
      return await response.json();
    },
    onSuccess: async (booking) => {
      queryClient.invalidateQueries(['bookings']);
      
      const location = locations.find(l => l.id === booking.location_id);
      const locationInfo = location ? `${location.name} - ${location.address}` : 'Location TBD';
      
      try {
        // Send email to client
        const response = await fetch(`${base44.apiUrl}/api/functions/sendBookingEmail`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-app-id': base44.appId
          },
          body: JSON.stringify({
            to: booking.parent_email,
            subject: `Booking Confirmed - ${booking.service_name}`,
            booking: { ...booking, location_info: locationInfo, booked_by_name: 'Guest' },
            type: 'confirmation_client'
          })
        });

        // Send email to coach
        if (coach?.email) {
          await fetch(`${base44.apiUrl}/api/functions/sendBookingEmail`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-app-id': base44.appId
            },
            body: JSON.stringify({
              to: coach.email,
              subject: `New Booking - ${booking.player_name}`,
              booking: { ...booking, location_info: locationInfo, booked_by_name: booking.parent_email },
              type: 'confirmation_coach'
            })
          });
        }
        
        toast.success('Booking confirmed!');
      } catch (error) {
        console.error('Email error:', error);
        toast.error('Booking confirmed, but email failed to send');
      }

      setBookingSuccess(true);
      setTimeout(() => {
        setShowConfirmDialog(false);
        setBookingSuccess(false);
        setSelectedBookableSlot(null);
      }, 2000);
    }
  });

  const getBookableSlotsForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const daySlots = timeSlots.filter(s => s.date === dateStr);
    
    const bookableSlots = [];
    
    daySlots.forEach(slot => {
      const services = coach?.services || [];
      
      services.forEach(service => {
        if (!slot.service_names?.includes(service.name)) return;
        
        const startTime = parse(slot.start_time, 'HH:mm', new Date());
        const endTime = parse(slot.end_time, 'HH:mm', new Date());
        const serviceDuration = service.duration;
        const bufferBefore = slot.buffer_before || 0;
        const bufferAfter = slot.buffer_after || 0;
        
        let currentTime = addMinutes(startTime, bufferBefore);
        
        while (addMinutes(currentTime, serviceDuration + bufferAfter) <= endTime) {
          const slotStartTime = format(currentTime, 'HH:mm');
          const slotEndTime = format(addMinutes(currentTime, serviceDuration), 'HH:mm');
          
          const isBooked = bookings.some(b => 
            b.booking_date === dateStr &&
            b.coach_id === coachId &&
            b.start_time === slotStartTime &&
            b.service_name === service.name &&
            b.status !== 'cancelled'
          );
          
          bookableSlots.push({
            parentSlotId: slot.id,
            date: dateStr,
            start_time: slotStartTime,
            end_time: slotEndTime,
            service: service,
            location_id: slot.location_id,
            duration: serviceDuration,
            isBooked: isBooked
          });
          
          currentTime = addMinutes(currentTime, serviceDuration + bufferBefore + bufferAfter);
        }
      });
    });
    
    return bookableSlots;
  };

  const handleSlotClick = (bookableSlot) => {
    setSelectedBookableSlot(bookableSlot);
    setShowBookingDialog(true);
  };

  const handleConfirmBooking = () => {
    if (!bookingForm.player_name || !bookingForm.parent_email) {
      toast.error('Please fill in required fields');
      return;
    }

    createBookingMutation.mutate({
      coach_id: coachId,
      coach_name: coach?.full_name,
      player_name: bookingForm.player_name,
      parent_email: bookingForm.parent_email,
      location_id: selectedBookableSlot.location_id,
      service_name: selectedBookableSlot.service.name,
      booking_date: selectedBookableSlot.date,
      start_time: selectedBookableSlot.start_time,
      end_time: selectedBookableSlot.end_time,
      duration: selectedBookableSlot.duration,
      status: 'confirmed',
      notes: bookingForm.notes
    });
  };

  const getLocationName = (locationId) => {
    const location = locations.find(l => l.id === locationId);
    return location ? `${location.name} - ${location.address}` : 'Location TBD';
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  if (coachLoading || !coach) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            Book with {coach.full_name}
          </h1>
          <p className="text-slate-600 mt-2">Select a date and time for your session</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  Select Date
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}>
                    Previous
                  </Button>
                  <span className="font-semibold px-4 py-2 text-sm">
                    {format(currentMonth, 'MMMM yyyy')}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                    Next
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']?.map(day => (
                  <div key={day} className="text-center text-xs font-semibold text-slate-600 py-2">{day}</div>
                ))}
                
                {calendarDays?.map((day, idx) => {
                  const daySlots = getBookableSlotsForDate(day);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isToday = isSameDay(day, new Date());
                  const isPast = day < new Date(new Date().setHours(0,0,0,0));
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  
                  return (
                    <button
                      key={idx}
                      disabled={!isCurrentMonth || isPast || daySlots.length === 0}
                      onClick={() => setSelectedDate(day)}
                      className={`aspect-square rounded-lg text-sm font-medium transition-all ${
                        !isCurrentMonth ? 'text-slate-300 cursor-default' :
                        isPast ? 'text-slate-300 cursor-not-allowed' :
                        isSelected ? 'bg-emerald-500 text-white shadow-lg' :
                        daySlots.length > 0 ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' :
                        'text-slate-400 cursor-default'
                      } ${isToday ? 'ring-2 ring-emerald-500' : ''}`}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                Available Time Slots
                {selectedDate && (
                  <span className="text-sm font-normal text-slate-500">
                    {format(selectedDate, 'MMM d')}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedDate ? (
                <div className="text-center py-16">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">Select a date to view available slots</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {getBookableSlotsForDate(selectedDate).length === 0 ? (
                    <p className="text-center text-slate-500 py-8">No available slots</p>
                  ) : (
                    getBookableSlotsForDate(selectedDate)?.map((bookableSlot, idx) => (
                      <button
                        key={idx}
                        onClick={() => !bookableSlot.isBooked && handleSlotClick(bookableSlot)}
                        disabled={bookableSlot.isBooked}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                          bookableSlot.isBooked 
                            ? 'border-red-300 bg-red-50 cursor-not-allowed opacity-60' 
                            : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className={`font-semibold flex items-center gap-2 ${bookableSlot.isBooked ? 'text-red-700' : ''}`}>
                              <Clock className={`w-4 h-4 ${bookableSlot.isBooked ? 'text-red-600' : 'text-emerald-600'}`} />
                              {bookableSlot.start_time} - {bookableSlot.end_time}
                            </div>
                            <div className={`text-sm mt-1 ${bookableSlot.isBooked ? 'text-red-600' : 'text-slate-600'}`}>
                              {bookableSlot.service.name} ({bookableSlot.duration} min)
                            </div>
                            <div className={`text-xs mt-1 flex items-center gap-1 ${bookableSlot.isBooked ? 'text-red-500' : 'text-slate-500'}`}>
                              <MapPin className="w-3 h-3" />
                              {getLocationName(bookableSlot.location_id)}
                            </div>
                          </div>
                          <Badge className={bookableSlot.isBooked ? 'bg-red-500 text-white' : ''} style={!bookableSlot.isBooked ? { backgroundColor: bookableSlot.service.color, color: 'white' } : {}}>
                            {bookableSlot.isBooked ? 'Booked' : 'Book'}
                          </Badge>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Booking Dialog */}
        <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Player Name *</Label>
                <Input value={bookingForm.player_name} onChange={e => setBookingForm({...bookingForm, player_name: e.target.value})} />
              </div>
              <div>
                <Label>Parent Email *</Label>
                <Input type="email" value={bookingForm.parent_email} onChange={e => setBookingForm({...bookingForm, parent_email: e.target.value})} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={bookingForm.phone} onChange={e => setBookingForm({...bookingForm, phone: e.target.value})} />
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Textarea value={bookingForm.notes} onChange={e => setBookingForm({...bookingForm, notes: e.target.value})} rows={3} />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowBookingDialog(false)} className="flex-1">Cancel</Button>
                <Button 
                  onClick={() => {
                    setShowBookingDialog(false);
                    setShowConfirmDialog(true);
                  }}
                  disabled={!bookingForm.player_name || !bookingForm.parent_email}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  Continue
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="max-w-lg">
            {bookingSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
                <p className="text-slate-600">Your session has been scheduled successfully.</p>
              </div>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl">Confirm Your Booking</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="bg-emerald-50 p-6 rounded-xl space-y-3">
                    <div className="flex justify-between border-b border-emerald-200 pb-3">
                      <span className="text-slate-600 font-semibold">Player Name</span>
                      <span className="font-bold">{bookingForm.player_name}</span>
                    </div>
                    <div className="flex justify-between border-b border-emerald-200 pb-3">
                      <span className="text-slate-600 font-semibold">Coach</span>
                      <span className="font-bold">{coach?.full_name}</span>
                    </div>
                    <div className="flex justify-between border-b border-emerald-200 pb-3">
                      <span className="text-slate-600 font-semibold">Service</span>
                      <span className="font-bold">{selectedBookableSlot?.service.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-emerald-200 pb-3">
                      <span className="text-slate-600 font-semibold">Date</span>
                      <span className="font-bold">{selectedBookableSlot && (() => {
                        const [year, month, day] = selectedBookableSlot.date.split('-').map(Number);
                        const bookingDate = new Date(year, month - 1, day);
                        return bookingDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
                      })()}</span>
                    </div>
                    <div className="flex justify-between border-b border-emerald-200 pb-3">
                      <span className="text-slate-600 font-semibold">Time</span>
                      <span className="font-bold">{selectedBookableSlot && `${selectedBookableSlot.start_time} - ${selectedBookableSlot.end_time}`}</span>
                    </div>
                    <div className="flex justify-between border-b border-emerald-200 pb-3">
                      <span className="text-slate-600 font-semibold">Duration</span>
                      <span className="font-bold">{selectedBookableSlot?.duration} minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-semibold">Location</span>
                      <span className="font-bold text-right text-sm">{selectedBookableSlot && getLocationName(selectedBookableSlot.location_id)}</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => {
                      setShowConfirmDialog(false);
                      setShowBookingDialog(true);
                    }} className="flex-1">Back</Button>
                    <Button 
                      onClick={handleConfirmBooking}
                      disabled={createBookingMutation.isPending}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    >
                      {createBookingMutation.isPending ? 'Confirming...' : 'Confirm Booking'}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}