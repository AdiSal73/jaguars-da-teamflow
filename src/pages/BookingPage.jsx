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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, User, CheckCircle, MapPin } from 'lucide-react';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, parse, addMinutes } from 'date-fns';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';

export default function BookingPage() {
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedBookableSlot, setSelectedBookableSlot] = useState(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    player_name: '',
    parent_email: '',
    phone: '',
    notes: ''
  });

  const findNextAvailableSlot = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 90; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() + i);
      const slots = getBookableSlotsForDate(checkDate);
      if (slots.length > 0) {
        setCurrentMonth(checkDate);
        setSelectedDate(checkDate);
        return;
      }
    }
  };

  const urlParams = new URLSearchParams(window.location.search);
  const coachIdParam = urlParams.get('coach');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
    retry: false
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list(),
    enabled: !!user
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list()
  });

  const myPlayers = useMemo(() => {
    if (!user) return [];
    // Parents have player_ids array
    if (user.player_ids?.length > 0) {
      return players.filter(p => user.player_ids.includes(p.id));
    }
    // Regular users linked by email
    return players.filter(p => p.email === user.email);
  }, [players, user]);

  React.useEffect(() => {
    if (!selectedPlayer && myPlayers.length === 1) {
      setSelectedPlayer(myPlayers[0]);
    }
  }, [myPlayers, selectedPlayer]);

  const myTeamIds = useMemo(() => {
    return [...new Set(myPlayers.map(p => p.team_id).filter(Boolean))];
  }, [myPlayers]);

  const availableCoaches = useMemo(() => {
    if (coachIdParam) {
      const coach = coaches.find(c => c.id === coachIdParam);
      return coach ? [coach] : [];
    }
    
    if (user && myTeamIds?.length > 0) {
      return coaches.filter(c => {
        if (c.booking_enabled === false) return false;
        if (!c.team_ids?.length) return false;
        return c.team_ids.some(teamId => myTeamIds.includes(teamId));
      });
    }
    
    return [];
  }, [coaches, coachIdParam, user, myTeamIds]);

  React.useEffect(() => {
    if (coachIdParam && availableCoaches.length === 1 && !selectedCoach) {
      setSelectedCoach(availableCoaches[0]);
    }
  }, [coachIdParam, availableCoaches, selectedCoach]);

  const { data: timeSlots = [] } = useQuery({
    queryKey: ['timeSlots', selectedCoach?.id],
    queryFn: () => base44.entities.TimeSlot.filter({ 
      coach_id: selectedCoach.id
    }),
    enabled: !!selectedCoach
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => base44.entities.Booking.list()
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.Booking.create(data);
    },
    onSuccess: async (booking) => {
      queryClient.invalidateQueries(['bookings']);
      queryClient.invalidateQueries(['timeSlots']);
      
      const location = locations.find(l => l.id === booking.location_id);
      const locationInfo = location ? `${location.name} - ${location.address}` : 'Location TBD';
      
      try {
        const clientEmail = user?.email || booking.parent_email;
        const coach = coaches.find(c => c.id === booking.coach_id);
        const player = players.find(p => p.id === booking.player_id);

        // Gather all recipients
        const allRecipients = [];
        if (clientEmail) allRecipients.push(clientEmail);
        if (coach?.email) allRecipients.push(coach.email);
        if (player?.parent_emails?.length > 0) {
          player.parent_emails.forEach(email => {
            if (!allRecipients.includes(email)) allRecipients.push(email);
          });
        }
        if (player?.player_email && !allRecipients.includes(player.player_email)) {
          allRecipients.push(player.player_email);
        }

        // Send one email to all parties
        if (allRecipients.length > 0) {
          await base44.functions.invoke('sendBookingEmail', {
            to: allRecipients[0],
            additionalRecipients: allRecipients.slice(1),
            subject: `Booking Confirmed - ${booking.service_name}`,
            booking: { 
              ...booking, 
              location_info: locationInfo,
              booked_by_name: user?.full_name || 'Guest'
            },
            type: 'confirmation_client'
          });

          // Create notifications for all
          for (const email of allRecipients) {
            await base44.entities.Notification.create({
              user_email: email,
              type: 'training',
              title: 'Session Booked',
              message: `Session: ${booking.service_name} with ${coach?.full_name} on ${new Date(booking.booking_date).toLocaleDateString()} at ${booking.start_time}`,
              link: createPageUrl('MyBookings'),
              priority: 'high'
            });
          }
        }
        toast.success('Booking confirmed and notifications sent to all parties');
      } catch (error) {
        console.error('Email/Notification error:', error);
        toast.error('Booking confirmed, but notifications failed to send');
      }

      setBookingSuccess(true);
      setTimeout(() => {
        setShowConfirmDialog(false);
        setBookingSuccess(false);
        setSelectedBookableSlot(null);
        setSelectedPlayer(null);
      }, 2000);
    }
  });

  // Generate bookable slots from time slots
  const getBookableSlotsForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const daySlots = timeSlots.filter(s => s.date === dateStr);
    
    const bookableSlots = [];
    
    daySlots.forEach(slot => {
      const services = selectedCoach.services || [];
      
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
          
          // Check if this specific slot time is already booked
          const isBooked = bookings.some(b => 
            b.booking_date === dateStr &&
            b.coach_id === selectedCoach.id &&
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

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getSlotsForDate = (date) => {
    return getBookableSlotsForDate(date);
  };

  const handleSlotClick = (bookableSlot) => {
    setSelectedBookableSlot(bookableSlot);
    setShowBookingDialog(true);
  };

  const handleConfirmBooking = () => {
    if (!user && (!bookingForm.player_name || !bookingForm.parent_email)) {
      toast.error('Please fill in required fields');
      return;
    }

    if (user && myPlayers?.length > 1 && !selectedPlayer) {
      toast.error('Please select a player');
      return;
    }

    const playerName = selectedPlayer?.full_name || myPlayers?.[0]?.full_name || bookingForm.player_name;
    const playerId = selectedPlayer?.id || myPlayers?.[0]?.id || null;
    const parentEmail = user?.email || bookingForm.parent_email;

    createBookingMutation.mutate({
      coach_id: selectedCoach.id,
      coach_name: selectedCoach.full_name,
      player_id: playerId,
      player_name: playerName,
      parent_id: user?.id || null,
      parent_email: parentEmail,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            Book a Coaching Session
          </h1>
          <p className="text-slate-600 mt-2">Select your coach, pick a time, and get started</p>
        </div>

        {/* Coach Selection */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600" />
                Select Your Coach
              </CardTitle>
              {selectedCoach && (
                <Button onClick={findNextAvailableSlot} variant="outline" className="gap-2">
                  <Clock className="w-4 h-4" />
                  Next Available Slot
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {availableCoaches.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-600">No coaches available for booking</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {availableCoaches?.map(coach => (
                  <button
                    key={coach.id}
                    onClick={() => {
                      setSelectedCoach(coach);
                      setSelectedDate(null);
                      setSelectedBookableSlot(null);
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedCoach?.id === coach.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-500 text-white text-2xl font-bold mx-auto mb-2 flex items-center justify-center">
                      {coach.full_name?.charAt(0)}
                    </div>
                    <p className="font-semibold truncate">{coach.full_name}</p>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedCoach && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Calendar */}
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
                    const daySlots = getSlotsForDate(day);
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

            {/* Time Slots */}
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
                    {getSlotsForDate(selectedDate).length === 0 ? (
                      <p className="text-center text-slate-500 py-8">No slots available</p>
                    ) : (
                      getSlotsForDate(selectedDate)?.map((bookableSlot, idx) => (
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
        )}

        {/* Booking Dialog */}
        <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {user && myPlayers?.length > 1 && (
                <div>
                  <Label>Select Player *</Label>
                  <Select value={selectedPlayer?.id || ''} onValueChange={(id) => setSelectedPlayer(myPlayers.find(p => p.id === id))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose which player to book for" />
                    </SelectTrigger>
                    <SelectContent>
                      {myPlayers?.map(player => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {!user && (
                <>
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
                </>
              )}
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
                  disabled={
                    (!user && (!bookingForm.player_name || !bookingForm.parent_email)) ||
                    (user && myPlayers?.length > 1 && !selectedPlayer)
                  }
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
                      <span className="font-bold">{selectedPlayer?.full_name || myPlayers?.[0]?.full_name || bookingForm.player_name}</span>
                    </div>
                    <div className="flex justify-between border-b border-emerald-200 pb-3">
                      <span className="text-slate-600 font-semibold">Coach</span>
                      <span className="font-bold">{selectedCoach?.full_name}</span>
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
                    {bookingForm.notes && (
                      <div className="border-t border-emerald-200 pt-3">
                        <div className="text-slate-600 font-semibold mb-1">Notes</div>
                        <div className="text-sm text-slate-700 bg-white p-2 rounded">{bookingForm.notes}</div>
                      </div>
                    )}
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