import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, User, X, MessageSquare, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import BookingCalendarSync from '../components/booking/BookingCalendarSync';

export default function MyBookings() {
  const queryClient = useQueryClient();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [messageForm, setMessageForm] = useState({ subject: '', content: '' });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => base44.entities.Booking.list('-booking_date')
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list()
  });

  const currentCoach = coaches.find(c => c.email === user?.email);
  const isCoach = !!currentCoach;

  const cancelBookingMutation = useMutation({
    mutationFn: async (id) => {
      const booking = bookings.find(b => b.id === id);
      await base44.entities.Booking.update(id, { status: 'cancelled' });
      
      // Send cancellation emails
      const location = locations.find(l => l.id === booking.location_id);
      const locationInfo = location ? `${location.name} - ${location.address}` : 'Location TBD';
      
      if (booking.parent_email) {
        await base44.functions.invoke('sendBookingEmail', {
          to: booking.parent_email,
          subject: `Booking Cancelled - ${booking.service_name}`,
          booking: { ...booking, location_info: locationInfo },
          type: 'cancellation'
        });
      }
      
      const coach = coaches.find(c => c.id === booking.coach_id);
      if (coach?.email) {
        await base44.functions.invoke('sendBookingEmail', {
          to: coach.email,
          subject: `Booking Cancelled - ${booking.player_name}`,
          booking: { ...booking, location_info: locationInfo },
          type: 'cancellation'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      setShowCancelDialog(false);
      setSelectedBooking(null);
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ to, subject, content }) => {
      await base44.integrations.Core.SendEmail({
        to,
        subject,
        body: content
      });
    },
    onSuccess: () => {
      toast.success('Message sent successfully');
      setShowMessageDialog(false);
      setMessageForm({ subject: '', content: '' });
    },
    onError: (error) => {
      toast.error(`Failed to send message: ${error.message}`);
    }
  });

  // Filter bookings for current user
  const myBookings = bookings.filter(b => {
    if (user?.role === 'admin') return true;
    const coach = coaches.find(c => c.email === user?.email);
    if (coach) return b.coach_id === coach.id;
    return b.parent_id === user?.id || b.created_by === user?.email;
  });

  const today = new Date().toISOString().split('T')[0];
  const upcomingBookings = myBookings.filter(b => b.booking_date >= today && b.status !== 'cancelled');
  const pastBookings = myBookings.filter(b => b.booking_date < today || b.status === 'cancelled');

  const formatTimeDisplay = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800'
  };

  const BookingCard = ({ booking }) => {
    const coach = coaches.find(c => c.id === booking.coach_id);
    const location = locations.find(l => l.id === booking.location_id);
    return (
      <Card className="border-none shadow-md hover:shadow-lg transition-all">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                {coach?.full_name?.charAt(0) || 'C'}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{booking.service_name}</h3>
                <p className="text-sm text-slate-600">with {coach?.full_name || booking.coach_name}</p>
                {booking.player_name && (
                  <p className="text-xs text-slate-500 mt-1">Player: {booking.player_name}</p>
                )}
                {location && (
                  <p className="text-xs text-slate-500 mt-1">📍 {location.name}</p>
                )}
              </div>
            </div>
            <Badge className={statusColors[booking.status]}>{booking.status}</Badge>
          </div>
          
          <div className="mt-4 flex items-center gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(booking.booking_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatTimeDisplay(booking.start_time)} - {formatTimeDisplay(booking.end_time)}
            </div>
          </div>
          
          {location && (
            <p className="mt-2 text-xs text-slate-600">{location.address}</p>
          )}
          
          {booking.notes && (
            <p className="mt-3 text-sm text-slate-500 bg-slate-50 p-2 rounded">{booking.notes}</p>
          )}
          
          {booking.status === 'confirmed' && booking.booking_date >= today && (
            <div className="mt-4 flex gap-2">
              <BookingCalendarSync booking={booking} coach={coach} location={location} />
              <Button variant="outline" size="sm" onClick={() => { setSelectedBooking(booking); setShowCancelDialog(true); }}>
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { 
                  setSelectedBooking(booking); 
                  setMessageForm({ 
                    subject: `Regarding Session on ${new Date(booking.booking_date).toLocaleDateString()}`,
                    content: '' 
                  });
                  setShowMessageDialog(true); 
                }}
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                Message {isCoach ? 'Client' : 'Coach'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Bookings</h1>
          <p className="text-slate-600 mt-1">View and manage your scheduled sessions</p>
        </div>
        <Link to={createPageUrl('Bookingpage')}>
          <Button className="bg-emerald-600 hover:bg-emerald-700">Book New Session</Button>
        </Link>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList className="mb-6 bg-slate-100">
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past & Cancelled ({pastBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {upcomingBookings.length === 0 ? (
            <Card className="border-none shadow-lg">
              <CardContent className="p-12 text-center">
                <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-slate-700 mb-2">No Upcoming Bookings</h2>
                <p className="text-slate-500 mb-4">You don't have any scheduled sessions.</p>
                <Link to={createPageUrl('BookCoach')}>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">Book a Session</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {upcomingBookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {pastBookings.length === 0 ? (
            <Card className="border-none shadow-lg">
              <CardContent className="p-12 text-center">
                <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No past bookings</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pastBookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-slate-600 mb-4">
              Are you sure you want to cancel this booking for{' '}
              <strong>{selectedBooking?.service_name}</strong> on{' '}
              <strong>{selectedBooking && new Date(selectedBooking.booking_date).toLocaleDateString()}</strong>?
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowCancelDialog(false)} className="flex-1">
                Keep Booking
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => cancelBookingMutation.mutate(selectedBooking?.id)}
                className="flex-1"
              >
                Cancel Booking
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>To</Label>
              <Input
                value={isCoach ? (selectedBooking?.parent_email || 'Client') : (coaches.find(c => c.id === selectedBooking?.coach_id)?.email || 'Coach')}
                disabled
                className="bg-slate-50"
              />
            </div>
            <div>
              <Label>Subject</Label>
              <Input
                value={messageForm.subject}
                onChange={(e) => setMessageForm({...messageForm, subject: e.target.value})}
                placeholder="Message subject"
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                value={messageForm.content}
                onChange={(e) => setMessageForm({...messageForm, content: e.target.value})}
                rows={5}
                placeholder="Type your message..."
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowMessageDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  const recipient = isCoach 
                    ? selectedBooking?.parent_email 
                    : coaches.find(c => c.id === selectedBooking?.coach_id)?.email;
                  sendMessageMutation.mutate({
                    to: recipient,
                    subject: messageForm.subject,
                    content: messageForm.content
                  });
                }}
                disabled={!messageForm.subject || !messageForm.content}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}