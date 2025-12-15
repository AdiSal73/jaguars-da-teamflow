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
import { Input } from '@/components/ui/input';
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

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (error) {
        return null;
      }
    },
    retry: false
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

  // Get players for this parent/user
  const myPlayers = useMemo(() => {
    if (!user) return [];
    // Check if user has linked players (is a parent)
    if (user.player_ids && user.player_ids.length > 0) {
      return players.filter(p => user.player_ids.includes(p.id));
    }
    return players.filter(p => p.email === user.email);
  }, [players, user]);

  // Get team IDs from my players
  const myTeamIds = useMemo(() => {
    return [...new Set(myPlayers.map(p => p.team_id).filter(Boolean))];
  }, [myPlayers]);

  // Filter coaches by team assignment
  const availableCoaches = useMemo(() => {
    return coaches.filter(c => {
      if (c.booking_enabled === false || !c.availability_slots?.length) return false;
      // If no teams assigned or no players, show all coaches
      if (myTeamIds.length === 0 || !c.team_ids?.length) return true;
      // Show coaches assigned to player's teams
      return c.team_ids.some(teamId => myTeamIds.includes(teamId));
    });
  }, [coaches, myTeamIds]);

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

  const parseTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const getAvailableSlotsForDate = (date) => {
    if (!selectedCoach) return [];

    const dayOfWeek = date.getDay();
    const dateStr = date.toISOString().split('T')[0];
    
    const coachSlots = selectedCoach.availability_slots?.filter(slot => {
      if (slot.specific_date) {
        return slot.specific_date === dateStr;
      }
      if (slot.is_recurring && slot.day_of_week === dayOfWeek) {
        const startDate = slot.recurring_start_date ? new Date(slot.recurring_start_date) : null;
        const endDate = slot.recurring_end_date ? new Date(slot.recurring_end_date) : null;
        if (startDate && date < startDate) return false;
        if (endDate && date > endDate) return false;
        return true;
      }
      return false;
    }) || [];

    const timeSlots = [];

    coachSlots.forEach(slot => {
      const services = slot.services || [];
      services.forEach(serviceName => {
        const service = selectedCoach.services?.find(s => s.name === serviceName);
        if (!service) return;
        
        let currentTime = parseTime(slot.start_time);
        const endTime = parseTime(slot.end_time);
        const bufferBefore = slot.buffer_before || 0;
        const bufferAfter = slot.buffer_after || 0;
        
        while (currentTime + service.duration <= endTime) {
          const slotStart = currentTime;
          const slotEnd = currentTime + service.duration;
          
          const isBooked = bookings.some(b => {
            if (b.coach_id !== selectedCoach.id || b.booking_date !== dateStr || b.status === 'cancelled') {
              return false;
            }
            const bookingStart = parseTime(b.start_time);
            const bookingEnd = parseTime(b.end_time);
            
            // Check for overlap considering buffers
            const bufferedSlotStart = slotStart - bufferBefore;
            const bufferedSlotEnd = slotEnd + bufferAfter;
            return (bufferedSlotStart < bookingEnd && bufferedSlotEnd > bookingStart);
          });
          
          if (!isBooked) {
            timeSlots.push({
              start_time: formatTime(slotStart),
              end_time: formatTime(slotEnd),
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

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              Book a Coaching Session
            </h1>
            <p className="text-slate-600 mt-2">Select your coach, pick a time, and get started</p>
          </div>
          <Button variant="outline" onClick={() => setShowShareDialog(true)} className="border-emerald-200 hover:bg-emerald-50">
            <Share2 className="w-4 h-4 mr-2" />
            Share Booking Page
          </Button>
        </div>

        {/* Coach Selection */}
        <Card className="border-none shadow-xl mb-8 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" />
              Select Your Coach
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {availableCoaches.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No coaches available for booking</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {availableCoaches.map(coach => (
                  <button
                    key={coach.id}
                    onClick={() => { setSelectedCoach(coach); setSelectedDate(null); setSelectedSlot(null); }}
                    className={`group p-4 rounded-2xl border-2 transition-all text-center hover:shadow-xl hover:-translate-y-1 ${
                      selectedCoach?.id === coach.id 
                        ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-blue-50 shadow-lg' 
                        : 'border-slate-200 hover:border-emerald-300 bg-white'
                    }`}
                  >
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3 transition-all ${
                      selectedCoach?.id === coach.id
                        ? 'bg-gradient-to-br from-emerald-500 to-blue-500 shadow-lg'
                        : 'bg-gradient-to-br from-slate-400 to-slate-500 group-hover:from-emerald-400 group-hover:to-blue-400'
                    }`}>
                      {coach.full_name?.charAt(0) || 'C'}
                    </div>
                    <p className="font-semibold text-slate-900 truncate text-sm">{coach.full_name}</p>
                    {coach.branch && (
                      <Badge className="mt-2 text-[10px] bg-emerald-100 text-emerald-700">{coach.branch}</Badge>
                    )}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedCoach && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Calendar */}
            <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                    Select Date
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="h-8 w-8">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="font-semibold min-w-[140px] text-center text-sm">
                      {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <Button variant="outline" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="h-8 w-8">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-7 gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-semibold text-slate-600 py-2">{day}</div>
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
                        className={`aspect-square rounded-xl text-sm font-medium transition-all ${
                          !day.isCurrentMonth ? 'text-slate-300 cursor-default' :
                          isPast ? 'text-slate-300 cursor-not-allowed' :
                          isSelected ? 'bg-gradient-to-br from-emerald-500 to-blue-500 text-white shadow-lg scale-105' :
                          isAvailable ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 hover:shadow-md hover:scale-105' :
                          'text-slate-400 cursor-default'
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
            <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-600" />
                  Available Times
                  {selectedDate && (
                    <span className="text-sm font-normal text-slate-500 ml-2">
                      {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {!selectedDate ? (
                  <div className="text-center py-16">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500 font-medium">Select a date to view available times</p>
                  </div>
                ) : getAvailableSlotsForDate(selectedDate).length === 0 ? (
                  <div className="text-center py-16">
                    <Clock className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500 font-medium">No available time slots</p>
                    <p className="text-slate-400 text-sm mt-2">Try selecting another date</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2">
                    {getAvailableSlotsForDate(selectedDate).map((slot, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setSelectedSlot(slot); setShowBookingDialog(true); }}
                        className="group p-4 rounded-xl border-2 transition-all hover:shadow-lg hover:-translate-y-1 text-left bg-white border-slate-200 hover:border-emerald-300"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-emerald-600" />
                            <span className="font-bold text-lg text-slate-900">{formatTimeDisplay(slot.start_time)}</span>
                          </div>
                          <div className="text-sm font-medium text-slate-700">
                            {slot.service_name}
                          </div>
                          <div className="flex items-start gap-1 text-xs text-slate-500">
                            <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{getLocationName(slot.location_id)}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                            {slot.duration} min
                          </Badge>
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
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Booking Confirmed!</h2>
                <p className="text-slate-600">Your session has been scheduled successfully.</p>
              </div>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl">Confirm Booking</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="bg-gradient-to-br from-emerald-50 to-blue-50 p-4 rounded-xl space-y-3 border border-emerald-100">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 text-sm">Coach</span>
                      <span className="font-semibold text-slate-900">{selectedCoach?.full_name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 text-sm">Service</span>
                      <span className="font-semibold text-slate-900">{selectedSlot?.service_name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 text-sm">Date</span>
                      <span className="font-semibold text-slate-900">{selectedDate?.toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 text-sm">Time</span>
                      <span className="font-semibold text-slate-900">{selectedSlot && formatTimeDisplay(selectedSlot.start_time)}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-slate-600 text-sm">Location</span>
                      <span className="font-semibold text-slate-900 text-right text-xs">{selectedSlot && getLocationName(selectedSlot.location_id)}</span>
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
                    <Button onClick={handleBookSlot} className="flex-1 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700">
                      Confirm Booking
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