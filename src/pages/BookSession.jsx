import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, addWeeks, subWeeks, startOfWeek } from 'date-fns';
import { User, ChevronLeft, ChevronRight, Settings, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import CoachCalendarView from '../components/booking/CoachCalendarView';
import CoachAvailabilitySettings from '../components/booking/CoachAvailabilitySettings';

export default function BookSession() {
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [playerEmail, setPlayerEmail] = useState('');
  const [sessionType, setSessionType] = useState('Individual Training');
  const [notes, setNotes] = useState('');
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);

  const queryClient = useQueryClient();

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => base44.entities.Booking.list()
  });

  const createBookingMutation = useMutation({
    mutationFn: (data) => base44.entities.Booking.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      setShowBookingDialog(false);
      setSelectedDate(null);
      setSelectedTime(null);
      setPlayerName('');
      setPlayerEmail('');
      setNotes('');
    }
  });

  const updateCoachMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Coach.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['coaches']);
      setShowAvailabilityDialog(false);
    }
  });

  const adminUsers = users.filter(u => u.role === 'admin');
  const allCoachOptions = [
    ...coaches,
    ...adminUsers.map(admin => ({
      id: admin.id,
      full_name: admin.full_name,
      specialization: 'Admin',
      isAdmin: true,
      session_duration: 60,
      booking_enabled: true
    }))
  ];

  const coachBookings = selectedCoach
    ? bookings.filter(b => b.coach_id === selectedCoach.id)
    : [];

  const handleTimeSlotClick = (date, time) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setShowBookingDialog(true);
  };

  const handleConfirmBooking = () => {
    if (!selectedCoach || !selectedDate || !selectedTime) return;

    const bookingData = {
      coach_id: selectedCoach.id,
      coach_name: selectedCoach.full_name,
      player_name: playerName,
      player_email: playerEmail,
      date: format(selectedDate, 'yyyy-MM-dd'),
      start_time: selectedTime,
      duration: selectedCoach.session_duration || 60,
      session_type: sessionType,
      status: 'Scheduled',
      notes: notes
    };

    createBookingMutation.mutate(bookingData);
  };

  const handleSaveAvailability = (availabilityData) => {
    if (selectedCoach && !selectedCoach.isAdmin) {
      updateCoachMutation.mutate({
        id: selectedCoach.id,
        data: availabilityData
      });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Book a Training Session</h1>
        <p className="text-slate-600 mt-1">Schedule one-on-one sessions with our coaches</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600" />
                Select Coach
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {allCoachOptions.map(coach => (
                  <button
                    key={coach.id}
                    onClick={() => {
                      setSelectedCoach(coach);
                      setCurrentWeek(new Date());
                    }}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      selectedCoach?.id === coach.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          {coach.full_name}
                          {coach.isAdmin && <Shield className="w-4 h-4 text-slate-500" />}
                        </div>
                        <div className="text-sm text-slate-600">{coach.specialization}</div>
                      </div>
                      {selectedCoach?.id === coach.id && !coach.isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowAvailabilityDialog(true);
                          }}
                          className="h-8 w-8"
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          {!selectedCoach ? (
            <Card className="border-none shadow-lg">
              <CardContent className="p-12 text-center">
                <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Select a Coach</h3>
                <p className="text-slate-600">Choose a coach to view their calendar and availability</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle>{selectedCoach.full_name}'s Calendar</CardTitle>
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
          )}
        </div>
      </div>

      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Booking</DialogTitle>
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
                placeholder="Enter your name"
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
              <Label>Session Type</Label>
              <Select value={sessionType} onValueChange={setSessionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Individual Training">Individual Training</SelectItem>
                  <SelectItem value="Evaluation Session">Evaluation Session</SelectItem>
                  <SelectItem value="Physical Assessment">Physical Assessment</SelectItem>
                  <SelectItem value="Tactical Review">Tactical Review</SelectItem>
                  <SelectItem value="Mental Coaching">Mental Coaching</SelectItem>
                </SelectContent>
              </Select>
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
        </DialogContent>
      </Dialog>

      <Dialog open={showAvailabilityDialog} onOpenChange={setShowAvailabilityDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Availability - {selectedCoach?.full_name}</DialogTitle>
          </DialogHeader>
          {selectedCoach && (
            <CoachAvailabilitySettings
              coach={selectedCoach}
              onSave={handleSaveAvailability}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}