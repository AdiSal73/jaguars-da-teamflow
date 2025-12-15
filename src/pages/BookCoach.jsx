import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, ChevronLeft, ChevronRight, User, CheckCircle, Share2, Copy, Mail, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function BookCoach() {
  const queryClient = useQueryClient();
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingNotes, setBookingNotes] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareEmail, setShareEmail] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => base44.entities.Booking.list()
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list()
  });

  // Get players for this parent
  const myPlayers = useMemo(() => {
    if (user?.role === 'parent' && user?.player_ids) {
      return players.filter(p => user.player_ids.includes(p.id));
    }
    return players.filter(p => p.email === user?.email);
  }, [players, user]);

  const createBookingMutation = useMutation({
    mutationFn: (data) => base44.entities.Booking.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      setBookingSuccess(true);
      setTimeout(() => {
        setShowBookingDialog(false);
        setBookingSuccess(false);
        setSelectedSlot(null);
        setBookingNotes('');
      }, 2000);
    }
  });

  const availableCoaches = coaches.filter(c => c.booking_enabled !== false && c.availability_slots?.length > 0);

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
    return days;
  };

  const getAvailableSlotsForDate = (date) => {
    if (!selectedCoach) return [];
    const dayOfWeek = date.getDay();
    const dateStr = date.toISOString().split('T')[0];
    
    const slots = selectedCoach.availability_slots?.filter(slot => {
      // Check if specific date or recurring
      if (slot.specific_date) {
        return slot.specific_date === dateStr;
      }
      
      if (slot.day_of_week !== dayOfWeek) return false;
      
      // Check recurring date range
      if (slot.is_recurring) {
        if (slot.recurring_start_date && date < new Date(slot.recurring_start_date)) return false;
        if (slot.recurring_end_date && date > new Date(slot.recurring_end_date)) return false;
      }
      
      return true;
    }) || [];

    // Generate time slots based on services
    const timeSlots = [];
    slots.forEach(slot => {
      const services = slot.services || [];
      services.forEach(serviceName => {
        const service = selectedCoach.services?.find(s => s.name === serviceName);
        if (!service) return;
        
        let currentTime = parseTime(slot.start_time);
        const endTime = parseTime(slot.end_time);
        const bufferBefore = slot.buffer_before || 0;
        const bufferAfter = slot.buffer_after || 0;
        
        while (currentTime + service.duration <= endTime) {
          const startTimeStr = formatTime(currentTime);
          const endTimeStr = formatTime(currentTime + service.duration);
          
          // Check if slot is already booked or conflicts with buffer
          const isBooked = bookings.some(b => {
            if (b.coach_id !== selectedCoach.id || b.booking_date !== dateStr || b.status === 'cancelled') {
              return false;
            }
            
            const bookingStart = parseTime(b.start_time);
            const bookingEnd = parseTime(b.end_time);
            const slotStart = currentTime;
            const slotEnd = currentTime + service.duration;
            
            // Check overlap including buffers
            return !(slotEnd + bufferAfter <= bookingStart || slotStart - bufferBefore >= bookingEnd);
          });
          
          if (!isBooked) {
            timeSlots.push({
              start_time: startTimeStr,
              end_time: endTimeStr,
              service_name: serviceName,
              duration: service.duration,
              location_id: slot.location_id
            });
          }
          
          currentTime += service.duration + bufferAfter;
        }
      });
    });
    
    return timeSlots.sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  const parseTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const formatTimeDisplay = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const calendarDays = getDaysInMonth(currentMonth);
  const availableDates = useMemo(() => {
    if (!selectedCoach) return new Set();
    const dates = new Set();
    calendarDays.forEach(day => {
      if (day.isCurrentMonth && getAvailableSlotsForDate(day.date).length > 0) {
        dates.add(day.date.toDateString());
      }
    });
    return dates;
  }, [selectedCoach, calendarDays, bookings]);

  const handleBookSlot = () => {
    const player = myPlayers.find(p => p.id === selectedPlayerId) || myPlayers[0];
    createBookingMutation.mutate({
      coach_id: selectedCoach.id,
      coach_name: selectedCoach.full_name,
      player_id: player?.id,
      player_name: player?.full_name,
      parent_id: user?.id,
      location_id: selectedSlot.location_id,
      service_name: selectedSlot.service_name,
      booking_date: selectedDate.toISOString().split('T')[0],
      start_time: selectedSlot.start_time,
      end_time: selectedSlot.end_time,
      duration: selectedSlot.duration,
      status: 'confirmed',
      notes: bookingNotes
    });
  };

  const getLocationName = (locationId) => {
    const location = locations.find(l => l.id === locationId);
    return location ? `${location.name} - ${location.address}` : 'Location TBD';
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Booking page link copied');
  };

  const handleShareEmail = async () => {
    if (!shareEmail) return;
    
    await base44.integrations.Core.SendEmail({
      to: shareEmail,
      subject: 'Book a Session with Our Coaches',
      body: `You've been invited to book a coaching session.\n\nClick here to view available times and book: ${window.location.href}\n\nSelect your preferred coach, date, and time to get started.`
    });
    
    toast.success('Invitation sent');
    setShareEmail('');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Book a Session</h1>
          <p className="text-slate-600 mt-1">Select a coach, date, and time slot to book</p>
        </div>
        <Button variant="outline" onClick={() => setShowShareDialog(true)}>
          <Share2 className="w-4 h-4 mr-2" />
          Share Booking Page
        </Button>
      </div>

      {/* Coach Selection */}
      <Card className="border-none shadow-lg mb-6">
        <CardHeader>
          <CardTitle>Select Coach</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {availableCoaches.map(coach => (
              <button
                key={coach.id}
                onClick={() => { setSelectedCoach(coach); setSelectedDate(null); setSelectedSlot(null); }}
                className={`p-4 rounded-xl border-2 transition-all text-center hover:shadow-lg ${
                  selectedCoach?.id === coach.id 
                    ? 'border-emerald-500 bg-emerald-50' 
                    : 'border-slate-200 hover:border-emerald-300'
                }`}
              >
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-2">
                  {coach.full_name?.charAt(0) || 'C'}
                </div>
                <p className="font-medium text-slate-900 truncate">{coach.full_name}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedCoach && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Calendar */}
          <Card className="border-none shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Select Date
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-medium min-w-[120px] text-center">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-slate-500 py-2">{day}</div>
                ))}
                {calendarDays.map((day, idx) => {
                  const isAvailable = availableDates.has(day.date.toDateString());
                  const isSelected = selectedDate?.toDateString() === day.date.toDateString();
                  const isPast = day.date < new Date(new Date().setHours(0,0,0,0));
                  
                  return (
                    <button
                      key={idx}
                      disabled={!day.isCurrentMonth || !isAvailable || isPast}
                      onClick={() => { setSelectedDate(day.date); setSelectedSlot(null); }}
                      className={`p-2 rounded-lg text-sm transition-all ${
                        !day.isCurrentMonth ? 'text-slate-300' :
                        isPast ? 'text-slate-300 cursor-not-allowed' :
                        isSelected ? 'bg-emerald-500 text-white font-bold' :
                        isAvailable ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-medium' :
                        'text-slate-400'
                      }`}
                    >
                      {day.date.getDate()}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Time Slots */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Available Times
                {selectedDate && (
                  <span className="text-sm font-normal text-slate-500">
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedDate ? (
                <div className="text-center py-12 text-slate-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>Select a date to view available times</p>
                </div>
              ) : getAvailableSlotsForDate(selectedDate).length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>No available time slots for this date</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                  {getAvailableSlotsForDate(selectedDate).map((slot, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setSelectedSlot(slot); setShowBookingDialog(true); }}
                      className={`p-3 rounded-lg border-2 transition-all hover:shadow-md ${
                        selectedSlot === slot 
                          ? 'border-emerald-500 bg-emerald-50' 
                          : 'border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="text-left space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-emerald-600" />
                          <span className="font-semibold text-sm">{formatTimeDisplay(slot.start_time)}</span>
                        </div>
                        <div className="text-xs text-slate-600">
                          {slot.service_name}
                        </div>
                        <div className="text-xs text-slate-500 flex items-start gap-1">
                          <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{getLocationName(slot.location_id)}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{slot.duration} min</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-emerald-600" />
              Share Booking Page
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Copy Link</Label>
              <div className="flex gap-2 mt-2">
                <Input value={window.location.href} readOnly className="flex-1 bg-slate-50 text-xs" />
                <Button onClick={handleCopyLink} variant="outline">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <Label>Share via Email</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="recipient@email.com"
                  className="flex-1"
                />
                <Button onClick={handleShareEmail} disabled={!shareEmail} className="bg-emerald-600 hover:bg-emerald-700">
                  <Mail className="w-4 h-4 mr-1" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Confirmation Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="max-w-md">
          {bookingSuccess ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">Booking Confirmed!</h2>
              <p className="text-slate-600">Your session has been scheduled.</p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Confirm Booking</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Coach</span>
                    <span className="font-medium">{selectedCoach?.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Service</span>
                    <span className="font-medium">{selectedSlot?.service_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Date</span>
                    <span className="font-medium">{selectedDate?.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Time</span>
                    <span className="font-medium">{selectedSlot && formatTimeDisplay(selectedSlot.start_time)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Location</span>
                    <span className="font-medium text-right text-sm">{selectedSlot && getLocationName(selectedSlot.location_id)}</span>
                  </div>
                </div>
                
                {myPlayers.length > 1 && (
                  <div>
                    <Label className="mb-2 block">Select Player</Label>
                    <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                      <SelectTrigger><SelectValue placeholder="Select player" /></SelectTrigger>
                      <SelectContent>
                        {myPlayers.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div>
                  <Label className="mb-2 block">Notes (optional)</Label>
                  <Textarea
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    placeholder="Any notes for the coach..."
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowBookingDialog(false)} className="flex-1">Cancel</Button>
                  <Button onClick={handleBookSlot} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                    Confirm Booking
                  </Button>
                </div>
                
                <div className="pt-3 border-t text-xs text-slate-500 text-center">
                  After booking, you'll receive a calendar invite to sync with Google/Apple Calendar
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}