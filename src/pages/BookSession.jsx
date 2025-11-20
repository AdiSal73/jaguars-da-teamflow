import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, getDay, parseISO, isBefore, isAfter, addMinutes, parse } from 'date-fns';
import { User, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function BookSession() {
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [playerEmail, setPlayerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    }
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => base44.entities.Booking.list()
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data) => {
      const booking = await base44.entities.Booking.create(data);
      
      // Send emails to coach and player
      await base44.integrations.Core.SendEmail({
        to: data.player_email,
        subject: 'Booking Confirmation - Pending Approval',
        body: `Hi ${data.player_name},\n\nYour booking request has been received:\n\nCoach: ${data.coach_name}\nDate: ${data.date}\nTime: ${data.start_time}\nDuration: ${data.duration} minutes\nSession: ${data.session_type}\n\nYour booking is pending approval from the coach. You will receive a confirmation email once approved.\n\nThank you!`
      });
      
      const coach = selectedCoach;
      if (coach?.email) {
        await base44.integrations.Core.SendEmail({
          to: coach.email,
          subject: 'New Booking Request',
          body: `Hi ${data.coach_name},\n\nYou have a new booking request:\n\nPlayer: ${data.player_name}\nEmail: ${data.player_email}\nDate: ${data.date}\nTime: ${data.start_time}\nDuration: ${data.duration} minutes\nSession: ${data.session_type}\n\nPlease review and confirm the booking.\n\nThank you!`
        });
      }
      
      return booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      setBookingConfirmed(true);
      setTimeout(() => {
        setShowBookingDialog(false);
        setSelectedDate(null);
        setSelectedTime(null);
        setSelectedService(null);
        setPlayerName('');
        setPlayerEmail('');
        setNotes('');
        setBookingConfirmed(false);
      }, 2000);
    }
  });

  React.useEffect(() => {
    if (coaches.length > 0 && !selectedCoach) {
      setSelectedCoach(coaches[0]);
    }
  }, [coaches, selectedCoach]);

  const getAvailableDates = () => {
    if (!selectedCoach?.availability_slots) return [];
    
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const allDays = eachDayOfInterval({ start, end });
    
    return allDays.filter(day => {
      if (isBefore(day, new Date())) return false;
      const dayOfWeek = getDay(day);
      const dateStr = format(day, 'yyyy-MM-dd');
      
      return selectedCoach.availability_slots.some(slot => {
        if (slot.day_of_week !== dayOfWeek) return false;
        
        if (slot.is_recurring) {
          if (slot.recurring_start_date && isBefore(day, parseISO(slot.recurring_start_date))) return false;
          if (slot.recurring_end_date && isAfter(day, parseISO(slot.recurring_end_date))) return false;
          return true;
        }
        
        return slot.specific_dates?.includes(dateStr);
      });
    });
  };

  const getAvailableTimeSlots = (date) => {
    if (!date || !selectedCoach) return [];
    
    const dayOfWeek = getDay(date);
    const dateStr = format(date, 'yyyy-MM-dd');
    
    const slots = selectedCoach.availability_slots?.filter(slot => {
      if (slot.day_of_week !== dayOfWeek) return false;
      
      if (slot.is_recurring) {
        if (slot.recurring_start_date && isBefore(date, parseISO(slot.recurring_start_date))) return false;
        if (slot.recurring_end_date && isAfter(date, parseISO(slot.recurring_end_date))) return false;
        return true;
      }
      
      return slot.specific_dates?.includes(dateStr);
    }) || [];

    const timeSlots = [];
    const dayBookings = bookings.filter(b => 
      b.coach_id === selectedCoach.id && 
      b.date === dateStr &&
      b.status !== 'Cancelled'
    );

    slots.forEach(slot => {
      const services = slot.services || [];
      const availableServices = selectedCoach.services?.filter(s => services.includes(s.name)) || [];
      
      if (availableServices.length === 0) return;

      const startTime = parse(slot.start_time, 'HH:mm', date);
      const endTime = parse(slot.end_time, 'HH:mm', date);
      const bufferBefore = slot.buffer_before || 0;
      const bufferAfter = slot.buffer_after || 0;
      
      availableServices.forEach(service => {
        let currentTime = startTime;
        
        while (currentTime < endTime) {
          const sessionEnd = addMinutes(currentTime, service.duration);
          const totalEnd = addMinutes(sessionEnd, bufferAfter);
          
          if (totalEnd <= endTime) {
            const timeStr = format(currentTime, 'HH:mm');
            const isBooked = dayBookings.some(b => b.start_time === timeStr && b.session_type === service.name);
            
            if (!isBooked) {
              timeSlots.push({
                time: timeStr,
                service: service.name,
                duration: service.duration,
                color: service.color,
                displayTime: format(currentTime, 'h:mm a')
              });
            }
          } else {
            break;
          }
          
          currentTime = addMinutes(currentTime, service.duration + bufferAfter);
        }
      });
    });

    return timeSlots.sort((a, b) => a.time.localeCompare(b.time));
  };

  const handleConfirmBooking = async () => {
    if (!selectedCoach || !selectedDate || !selectedTime || !selectedService) return;

    const bookingData = {
      coach_id: selectedCoach.id,
      coach_name: selectedCoach.full_name,
      player_name: playerName,
      player_email: playerEmail,
      date: format(selectedDate, 'yyyy-MM-dd'),
      start_time: selectedTime,
      duration: selectedService.duration,
      session_type: selectedService.service,
      status: 'Pending',
      notes: notes
    };

    createBookingMutation.mutate(bookingData);
  };

  const availableDates = getAvailableDates();
  const availableTimeSlots = selectedDate ? getAvailableTimeSlots(selectedDate) : [];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Book a Training Session</h1>
        <p className="text-sm md:text-base text-slate-600 mt-1">Select a coach, date, and time for your session</p>
      </div>

      {/* Coach Selection */}
      <Card className="border-none shadow-lg mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-600" />
            Select Coach
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {coaches.map(coach => (
              <button
                key={coach.id}
                onClick={() => {
                  setSelectedCoach(coach);
                  setSelectedDate(null);
                  setSelectedTime(null);
                }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedCoach?.id === coach.id
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 hover:border-emerald-300'
                }`}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-2">
                    {coach.full_name.charAt(0)}
                  </div>
                  <div className="font-semibold text-slate-900">{coach.full_name}</div>
                  <div className="text-xs text-slate-600">{coach.specialization}</div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedCoach && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Calendar */}
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-emerald-600" />
                  Select Date
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium px-4">
                    {format(currentMonth, 'MMMM yyyy')}
                  </span>
                  <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-xs font-semibold text-slate-600 py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {eachDayOfInterval({
                  start: startOfMonth(currentMonth),
                  end: endOfMonth(currentMonth)
                }).map((day, idx) => {
                  const isAvailable = availableDates.some(d => isSameDay(d, day));
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isPast = isBefore(day, new Date()) && !isToday(day);
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => isAvailable && setSelectedDate(day)}
                      disabled={!isAvailable || isPast}
                      className={`
                        aspect-square rounded-lg text-sm font-medium transition-all
                        ${isSelected ? 'bg-emerald-600 text-white shadow-lg' : ''}
                        ${isAvailable && !isSelected ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : ''}
                        ${!isAvailable ? 'text-slate-300 cursor-not-allowed' : ''}
                        ${isToday(day) && !isSelected ? 'border-2 border-emerald-500' : ''}
                      `}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Time Slots */}
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                Available Times
                {selectedDate && (
                  <span className="text-sm font-normal text-slate-600 ml-2">
                    {format(selectedDate, 'EEEE, MMM d')}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {!selectedDate ? (
                <div className="text-center py-12">
                  <CalendarIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Select a date to view available times</p>
                </div>
              ) : availableTimeSlots.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No available time slots for this date</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {availableTimeSlots.map((slot, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedTime(slot.time);
                        setSelectedService({ service: slot.service, duration: slot.duration });
                        setShowBookingDialog(true);
                      }}
                      className="w-full p-4 rounded-xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: slot.color }}
                          />
                          <div>
                            <div className="font-semibold text-slate-900">{slot.displayTime}</div>
                            <div className="text-sm text-slate-600">{slot.service} ({slot.duration} min)</div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="max-w-md">
          {bookingConfirmed ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Booking Confirmed!</h3>
              <p className="text-slate-600">You'll receive a confirmation email shortly.</p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Confirm Your Booking</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="p-4 bg-emerald-50 rounded-lg">
                  <div className="text-sm text-slate-600">Coach</div>
                  <div className="font-semibold text-slate-900">{selectedCoach?.full_name}</div>
                  <div className="text-sm text-slate-600 mt-2">
                    {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')} at {selectedTime && format(parse(selectedTime, 'HH:mm', new Date()), 'h:mm a')}
                  </div>
                  <div className="text-sm text-emerald-700 font-medium mt-1">
                    {selectedService?.service} ({selectedService?.duration} minutes)
                  </div>
                </div>
                <div>
                  <Label>Your Name *</Label>
                  <Input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label>Your Email *</Label>
                  <Input
                    type="email"
                    value={playerEmail}
                    onChange={(e) => setPlayerEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any specific goals or requests..."
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowBookingDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmBooking}
                  disabled={!playerName || !playerEmail || createBookingMutation.isPending}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  Confirm Booking
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}