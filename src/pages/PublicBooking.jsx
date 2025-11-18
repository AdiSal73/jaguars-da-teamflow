import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, addWeeks, subWeeks, startOfWeek } from 'date-fns';
import { User, ChevronLeft, ChevronRight, Calendar, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CoachCalendarView from '../components/booking/CoachCalendarView';

export default function PublicBooking() {
  const urlParams = new URLSearchParams(window.location.search);
  const coachId = urlParams.get('coach');
  
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [specializationFilter, setSpecializationFilter] = useState('all');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [playerEmail, setPlayerEmail] = useState('');
  const [playerPhone, setPlayerPhone] = useState('');
  const [sessionType, setSessionType] = useState('');
  const [notes, setNotes] = useState('');
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const queryClient = useQueryClient();

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings', selectedCoach?.id],
    queryFn: () => base44.entities.Booking.list(),
    enabled: !!selectedCoach
  });

  React.useEffect(() => {
    if (coachId && coaches.length > 0) {
      const coach = coaches.find(c => c.id === coachId);
      if (coach) setSelectedCoach(coach);
    } else if (coaches.length > 0 && !selectedCoach) {
      setSelectedCoach(coaches[0]);
    }
  }, [coachId, coaches, selectedCoach]);

  const createBookingMutation = useMutation({
    mutationFn: (data) => base44.entities.Booking.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      setBookingConfirmed(true);
      setTimeout(() => {
        setShowBookingDialog(false);
        setSelectedDate(null);
        setSelectedTime(null);
        setPlayerName('');
        setPlayerEmail('');
        setPlayerPhone('');
        setNotes('');
        setBookingConfirmed(false);
      }, 3000);
    }
  });

  const coachBookings = selectedCoach
    ? bookings.filter(b => b.coach_id === selectedCoach.id)
    : [];

  const availableServices = selectedCoach?.services || [];

  const handleTimeSlotClick = (date, time) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setShowBookingDialog(true);
  };

  const handleConfirmBooking = () => {
    if (!selectedCoach || !selectedDate || !selectedTime) return;

    const selectedService = availableServices.find(s => s.name === sessionType);

    const bookingData = {
      coach_id: selectedCoach.id,
      coach_name: selectedCoach.full_name,
      player_name: playerName,
      player_email: playerEmail,
      date: format(selectedDate, 'yyyy-MM-dd'),
      start_time: selectedTime,
      duration: selectedService?.duration || 60,
      session_type: sessionType,
      status: 'Scheduled',
      notes: notes,
      meeting_location: 'TBD'
    };

    createBookingMutation.mutate(bookingData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Book a Training Session</h1>
          <p className="text-slate-600">Schedule your coaching session in just a few clicks</p>
        </div>

        {selectedCoach && (
          <Card className="border-none shadow-xl mb-8">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-white border-b">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{selectedCoach.full_name}</CardTitle>
                  <p className="text-slate-600">{selectedCoach.specialization}</p>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        <Card className="border-none shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Filter by Specialty</Label>
                <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Specialties</SelectItem>
                    <SelectItem value="Technical Training">Technical Training</SelectItem>
                    <SelectItem value="Tactical Analysis">Tactical Analysis</SelectItem>
                    <SelectItem value="Physical Conditioning">Physical Conditioning</SelectItem>
                    <SelectItem value="Goalkeeping">Goalkeeping</SelectItem>
                    <SelectItem value="Mental Coaching">Mental Coaching</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Select Coach</Label>
                <Select value={selectedCoach?.id} onValueChange={(id) => setSelectedCoach(coaches.find(c => c.id === id))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a coach" />
                  </SelectTrigger>
                  <SelectContent>
                    {coaches.filter(c => specializationFilter === 'all' || c.specialization === specializationFilter).map(coach => (
                      <SelectItem key={coach.id} value={coach.id}>
                        {coach.full_name} - {coach.specialization}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedCoach ? (
          <Card className="border-none shadow-xl">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  Available Times
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium px-4">
                    {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), 'MMM d')} - 
                    {format(addWeeks(startOfWeek(currentWeek, { weekStartsOn: 1 }), 1), 'MMM d, yyyy')}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <CoachCalendarView
                selectedWeek={currentWeek}
                coach={selectedCoach}
                bookings={coachBookings}
                onTimeSlotClick={handleTimeSlotClick}
              />
            </CardContent>
          </Card>
        ) : (
          <Card className="border-none shadow-lg">
            <CardContent className="p-12 text-center">
              <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Coaches Available</h3>
              <p className="text-slate-600">Please check back later for available booking times</p>
            </CardContent>
          </Card>
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
                  <DialogTitle>Book Your Session</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <div className="text-sm text-slate-600">Booking with</div>
                    <div className="font-semibold text-slate-900">{selectedCoach?.full_name}</div>
                    <div className="text-sm text-slate-600 mt-2">
                      {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')} at {selectedTime}
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
                    <Label>Your Phone</Label>
                    <Input
                      type="tel"
                      value={playerPhone}
                      onChange={(e) => setPlayerPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  {availableServices.length > 0 && (
                    <div>
                      <Label>Session Type *</Label>
                      <Select value={sessionType} onValueChange={setSessionType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose session type" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableServices.map(service => (
                            <SelectItem key={service.name} value={service.name}>
                              {service.name} ({service.duration} min)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
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
                    disabled={!playerName || !playerEmail || !sessionType || createBookingMutation.isPending}
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
    </div>
  );
}