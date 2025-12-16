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
import { Calendar, Clock, ChevronLeft, ChevronRight, User, CheckCircle, Share2, Copy, Mail, MapPin, Sparkles } from 'lucide-react';
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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [sendingEmails, setSendingEmails] = useState(false);

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

  // Filter coaches by team assignment - only show coaches for player's teams
  const availableCoaches = useMemo(() => {
    // If user has no players or teams, show no coaches
    if (myTeamIds.length === 0) return [];
    
    return coaches.filter(c => {
      if (c.booking_enabled === false || !c.availability_slots?.length) return false;
      // Only show coaches assigned to the player's specific teams
      if (!c.team_ids?.length) return false;
      return c.team_ids.some(teamId => myTeamIds.includes(teamId));
    });
  }, [coaches, myTeamIds]);

  const createBookingMutation = useMutation({
    mutationFn: async (data) => {
      const booking = await base44.entities.Booking.create(data);
      return booking;
    },
    onSuccess: async (booking) => {
      queryClient.invalidateQueries(['bookings']);
      
      // Send email confirmations
      setSendingEmails(true);
      try {
        const location = locations.find(l => l.id === booking.location_id);
        const locationInfo = location ? `${location.name}\n${location.address}` : 'Location TBD';
        
        // Email to client
        await base44.functions.invoke('sendEmail', {
          to: user.email,
          subject: `Booking Confirmation - ${booking.service_name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 10px;">
              <h2 style="color: #059669; margin-bottom: 20px;">✓ Booking Confirmed</h2>
              <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: #334155; margin-bottom: 15px;">Session Details:</h3>
                <p style="margin: 8px 0;"><strong>Coach:</strong> ${booking.coach_name}</p>
                <p style="margin: 8px 0;"><strong>Player:</strong> ${booking.player_name}</p>
                <p style="margin: 8px 0;"><strong>Service:</strong> ${booking.service_name}</p>
                <p style="margin: 8px 0;"><strong>Date:</strong> ${new Date(booking.booking_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p style="margin: 8px 0;"><strong>Time:</strong> ${formatTimeDisplay(booking.start_time)} - ${formatTimeDisplay(booking.end_time)}</p>
                <p style="margin: 8px 0;"><strong>Duration:</strong> ${booking.duration} minutes</p>
                <p style="margin: 8px 0;"><strong>Location:</strong><br>${locationInfo}</p>
                ${booking.notes ? `<p style="margin: 8px 0;"><strong>Notes:</strong> ${booking.notes}</p>` : ''}
              </div>
              <p style="color: #64748b; font-size: 14px;">If you need to reschedule or cancel, please contact your coach directly.</p>
            </div>
          `,
          text: `Booking Confirmed\n\nCoach: ${booking.coach_name}\nPlayer: ${booking.player_name}\nService: ${booking.service_name}\nDate: ${new Date(booking.booking_date).toLocaleDateString()}\nTime: ${booking.start_time} - ${booking.end_time}\nLocation: ${locationInfo}${booking.notes ? '\nNotes: ' + booking.notes : ''}`
        });

        // Email to coach
        const coach = coaches.find(c => c.id === booking.coach_id);
        if (coach?.email) {
          await base44.functions.invoke('sendEmail', {
            to: coach.email,
            subject: `New Booking - ${booking.player_name}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 10px;">
                <h2 style="color: #059669; margin-bottom: 20px;">New Session Booked</h2>
                <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <h3 style="color: #334155; margin-bottom: 15px;">Session Details:</h3>
                  <p style="margin: 8px 0;"><strong>Player:</strong> ${booking.player_name}</p>
                  <p style="margin: 8px 0;"><strong>Booked by:</strong> ${user.full_name} (${user.email})</p>
                  <p style="margin: 8px 0;"><strong>Service:</strong> ${booking.service_name}</p>
                  <p style="margin: 8px 0;"><strong>Date:</strong> ${new Date(booking.booking_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p style="margin: 8px 0;"><strong>Time:</strong> ${formatTimeDisplay(booking.start_time)} - ${formatTimeDisplay(booking.end_time)}</p>
                  <p style="margin: 8px 0;"><strong>Duration:</strong> ${booking.duration} minutes</p>
                  <p style="margin: 8px 0;"><strong>Location:</strong><br>${locationInfo}</p>
                  ${booking.notes ? `<p style="margin: 8px 0;"><strong>Client Notes:</strong> ${booking.notes}</p>` : ''}
                </div>
              </div>
            `,
            text: `New Session Booked\n\nPlayer: ${booking.player_name}\nBooked by: ${user.full_name} (${user.email})\nService: ${booking.service_name}\nDate: ${new Date(booking.booking_date).toLocaleDateString()}\nTime: ${booking.start_time} - ${booking.end_time}\nLocation: ${locationInfo}${booking.notes ? '\nNotes: ' + booking.notes : ''}`
          });
        }
      } catch (error) {
        console.error('Email send error:', error);
      } finally {
        setSendingEmails(false);
      }

      setBookingSuccess(true);
      setTimeout(() => {
        setShowBookingDialog(false);
        setShowConfirmDialog(false);
        setBookingSuccess(false);
        setSelectedSlot(null);
        setBookingNotes('');
        setSelectedPlayerId('');
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
          
          timeSlots.push({
            start_time: formatTime(slotStart),
            end_time: formatTime(slotEnd),
            service_name: serviceName,
            duration: service.duration,
            location_id: slot.location_id,
            isBooked
          });
          
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

  const handleProceedToConfirm = () => {
    setShowBookingDialog(false);
    setShowConfirmDialog(true);
  };

  const handleConfirmBooking = () => {
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
                <p className="text-slate-600 font-semibold mb-2">No coaches available for your team</p>
                <p className="text-slate-500 text-sm">There are no coaches assigned to your player's team with booking enabled. Please contact your club administrator.</p>
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
                        onClick={() => { if (!slot.isBooked) { setSelectedSlot(slot); setShowBookingDialog(true); } }}
                        disabled={slot.isBooked}
                        className={`group p-4 rounded-xl border-2 transition-all text-left ${
                          slot.isBooked 
                            ? 'bg-red-50 border-red-200 cursor-not-allowed opacity-75' 
                            : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-lg hover:-translate-y-1'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Clock className={`w-4 h-4 ${slot.isBooked ? 'text-red-600' : 'text-emerald-600'}`} />
                            <span className={`font-bold text-lg ${slot.isBooked ? 'text-slate-900 line-through' : 'text-slate-900'}`}>
                              {formatTimeDisplay(slot.start_time)}
                            </span>
                            {slot.isBooked && <Badge className="bg-red-500 text-white text-[10px]">Booked</Badge>}
                          </div>
                          <div className={`text-sm font-medium ${slot.isBooked ? 'text-slate-700' : 'text-slate-700'}`}>
                            {slot.service_name}
                          </div>
                          <div className="flex items-start gap-1 text-xs text-slate-500">
                            <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{getLocationName(slot.location_id)}</span>
                          </div>
                          <Badge variant="outline" className={`text-[10px] ${slot.isBooked ? 'bg-red-100 text-red-800 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
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

        {/* Booking Details Dialog */}
        <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">Booking Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
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
                <Button onClick={handleProceedToConfirm} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                  Continue
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Booking Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="max-w-lg">
            {bookingSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Booking Confirmed!</h2>
                <p className="text-slate-600 mb-4">Your session has been scheduled successfully.</p>
                {sendingEmails && (
                  <p className="text-xs text-slate-500">Sending confirmation emails...</p>
                )}
              </div>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                    Confirm Your Booking
                  </DialogTitle>
                </DialogHeader>
                <div className="mt-6">
                  <div className="bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 p-6 rounded-2xl border-2 border-emerald-200 space-y-4">
                    <h3 className="font-bold text-slate-900 text-lg mb-4">Session Details</h3>
                    
                    <div className="grid gap-3">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                        <span className="text-slate-600 font-medium">Coach</span>
                        <span className="font-bold text-slate-900">{selectedCoach?.full_name}</span>
                      </div>
                      
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                        <span className="text-slate-600 font-medium">Player</span>
                        <span className="font-bold text-slate-900">
                          {myPlayers.find(p => p.id === selectedPlayerId)?.full_name || myPlayers[0]?.full_name}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                        <span className="text-slate-600 font-medium">Service</span>
                        <span className="font-bold text-slate-900">{selectedSlot?.service_name}</span>
                      </div>
                      
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                        <span className="text-slate-600 font-medium">Date</span>
                        <span className="font-bold text-slate-900">
                          {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                        <span className="text-slate-600 font-medium">Time</span>
                        <span className="font-bold text-slate-900">
                          {selectedSlot && `${formatTimeDisplay(selectedSlot.start_time)} - ${formatTimeDisplay(selectedSlot.end_time)}`}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                        <span className="text-slate-600 font-medium">Duration</span>
                        <span className="font-bold text-slate-900">{selectedSlot?.duration} minutes</span>
                      </div>
                      
                      <div className="flex justify-between items-start pb-2">
                        <span className="text-slate-600 font-medium">Location</span>
                        <span className="font-bold text-slate-900 text-right max-w-[60%]">
                          {selectedSlot && getLocationName(selectedSlot.location_id)}
                        </span>
                      </div>
                      
                      {bookingNotes && (
                        <div className="pt-2 border-t border-slate-200">
                          <span className="text-slate-600 font-medium block mb-2">Notes</span>
                          <p className="text-sm text-slate-700 bg-white/50 p-3 rounded-lg">{bookingNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-900 flex items-start gap-2">
                      <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Confirmation emails will be sent to you and your coach.</span>
                    </p>
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowConfirmDialog(false);
                        setShowBookingDialog(true);
                      }} 
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={handleConfirmBooking} 
                      disabled={createBookingMutation.isPending}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 font-semibold"
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