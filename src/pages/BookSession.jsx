import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { User, Clock, MapPin } from 'lucide-react';
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
import BookingCalendar from '../components/booking/BookingCalendar';
import TimeSlots from '../components/booking/TimeSlots';

export default function BookSession() {
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [playerEmail, setPlayerEmail] = useState('');
  const [sessionType, setSessionType] = useState('Individual Training');
  const [notes, setNotes] = useState('');

  const queryClient = useQueryClient();

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => base44.entities.Booking.list()
  });

  const createBookingMutation = useMutation({
    mutationFn: (data) => base44.entities.Booking.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      setSelectedDate(null);
      setSelectedTime(null);
      setPlayerName('');
      setPlayerEmail('');
      setNotes('');
    }
  });

  const coachBookings = selectedCoach && selectedDate
    ? bookings.filter(b => 
        b.coach_id === selectedCoach.id && 
        b.date === format(selectedDate, 'yyyy-MM-dd')
      )
    : [];

  const bookedTimes = coachBookings.map(b => b.start_time);
  const bookedDates = bookings
    .filter(b => b.coach_id === selectedCoach?.id)
    .map(b => b.date);

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

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Book a Training Session</h1>
        <p className="text-slate-600 mt-1">Schedule one-on-one sessions with our coaches</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="border-none shadow-lg mb-6">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600" />
                Select Coach
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {coaches.map(coach => (
                  <button
                    key={coach.id}
                    onClick={() => {
                      setSelectedCoach(coach);
                      setSelectedDate(null);
                      setSelectedTime(null);
                    }}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      selectedCoach?.id === coach.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="font-semibold text-slate-900">{coach.full_name}</div>
                    <div className="text-sm text-slate-600">{coach.specialization}</div>
                    {coach.session_duration && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {coach.session_duration} min
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedCoach && selectedDate && selectedTime && (
            <Card className="border-none shadow-lg bg-emerald-50">
              <CardHeader>
                <CardTitle className="text-emerald-900">Booking Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                <Button
                  onClick={handleConfirmBooking}
                  disabled={!playerName || !playerEmail || createBookingMutation.isPending}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  Confirm Booking
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          {!selectedCoach ? (
            <Card className="border-none shadow-lg">
              <CardContent className="p-12 text-center">
                <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Select a Coach</h3>
                <p className="text-slate-600">Choose a coach from the list to view available time slots</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Select a Date</h3>
                <BookingCalendar
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  bookedDates={bookedDates}
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a Time'}
                </h3>
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <TimeSlots
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    onTimeSelect={setSelectedTime}
                    bookedTimes={bookedTimes}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}