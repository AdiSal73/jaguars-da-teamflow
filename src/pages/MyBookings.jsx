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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showReminderDialog, setShowReminderDialog] = useState(false);
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
      
      const location = locations.find(l => l.id === booking.location_id);
      const locationInfo = location ? `${location.name} - ${location.address}` : 'Location TBD';
      const coach = coaches.find(c => c.id === booking.coach_id);
      
      // Send cancellation email to parent
      if (booking.parent_email) {
        await base44.functions.invoke('sendBookingEmail', {
          to: booking.parent_email,
          subject: `Booking Cancelled - ${booking.service_name}`,
          booking: { ...booking, location_info: locationInfo, booked_by_name: user?.full_name || 'Guest' },
          type: 'cancellation'
        });
        
        await base44.entities.Notification.create({
          user_email: booking.parent_email,
          type: 'training',
          title: 'Booking Cancelled',
          message: `Your session on ${new Date(booking.booking_date).toLocaleDateString()} at ${booking.start_time} has been cancelled.`,
          priority: 'high'
        });
      }
      
      // Send cancellation email to coach
      if (coach?.email) {
        await base44.functions.invoke('sendBookingEmail', {
          to: coach.email,
          subject: `Booking Cancelled - ${booking.player_name}`,
          booking: { ...booking, location_info: locationInfo, booked_by_name: user?.full_name || booking.parent_email },
          type: 'cancellation'
        });
        
        await base44.entities.Notification.create({
          user_email: coach.email,
          type: 'training',
          title: 'Booking Cancelled',
          message: `${booking.player_name}'s session on ${new Date(booking.booking_date).toLocaleDateString()} at ${booking.start_time} was cancelled.`,
          priority: 'medium'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      setShowCancelDialog(false);
      setSelectedBooking(null);
      toast.success('Booking cancelled and notifications sent');
    },
    onError: (error) => {
      console.error('Cancel error:', error);
      toast.error(`Failed to cancel booking: ${error.message}`);
    }
  });

  const deleteBookingMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.Booking.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      setShowDeleteDialog(false);
      setSelectedBooking(null);
      toast.success('Booking deleted');
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ to, subject, content, sendNotification }) => {
      await base44.functions.invoke('sendEmail', {
        to,
        subject,
        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">${subject}</h2>
          <div style="white-space: pre-wrap; line-height: 1.6;">${content}</div>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;"/>
          <p style="color: #6b7280; font-size: 12px;">Michigan Jaguars Player Development System</p>
        </div>`,
        text: content
      });

      if (sendNotification) {
        await base44.entities.Notification.create({
          user_email: to,
          type: 'message',
          title: subject,
          message: content.substring(0, 200),
          priority: 'medium'
        });
      }
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

  const sendReminderMutation = useMutation({
    mutationFn: async (booking) => {
      const coach = coaches.find(c => c.id === booking.coach_id);
      const location = locations.find(l => l.id === booking.location_id);
      const locationInfo = location ? `${location.name} - ${location.address}` : 'Location TBD';
      
      const reminderSubject = `Reminder: ${booking.service_name} Session Tomorrow`;
      const reminderContent = `Hi ${booking.player_name},\n\nThis is a friendly reminder about your upcoming session:\n\n📅 Date: ${new Date(booking.booking_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}\n⏰ Time: ${booking.start_time} - ${booking.end_time}\n👨‍🏫 Coach: ${coach?.full_name || booking.coach_name}\n📍 Location: ${locationInfo}\n🎯 Service: ${booking.service_name}\n\nWe look forward to seeing you!\n\nMichigan Jaguars`;
      
      await base44.functions.invoke('sendEmail', {
        to: booking.parent_email,
        subject: reminderSubject,
        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Reminder: Session Tomorrow</h2>
          <p>Hi ${booking.player_name},</p>
          <p>This is a friendly reminder about your upcoming session:</p>
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>📅 Date:</strong> ${new Date(booking.booking_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
            <p><strong>⏰ Time:</strong> ${booking.start_time} - ${booking.end_time}</p>
            <p><strong>👨‍🏫 Coach:</strong> ${coach?.full_name || booking.coach_name}</p>
            <p><strong>📍 Location:</strong> ${locationInfo}</p>
            <p><strong>🎯 Service:</strong> ${booking.service_name}</p>
          </div>
          <p>We look forward to seeing you!</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;"/>
          <p style="color: #6b7280; font-size: 12px;">Michigan Jaguars Player Development System</p>
        </div>`,
        text: reminderContent
      });

      await base44.entities.Notification.create({
        user_email: booking.parent_email,
        type: 'training',
        title: 'Session Reminder',
        message: `Your session with ${coach?.full_name} is tomorrow at ${booking.start_time}`,
        priority: 'high'
      });
    },
    onSuccess: () => {
      toast.success('Reminder sent');
      setShowReminderDialog(false);
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
    
    // Parse date correctly to avoid timezone shift
    const [year, month, day] = booking.booking_date.split('-').map(Number);
    const bookingDate = new Date(year, month - 1, day);
    
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
              {bookingDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
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
            <div className="mt-4 flex flex-wrap gap-2">
              <BookingCalendarSync booking={booking} coach={coach} location={location} />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { 
                  setSelectedBooking(booking); 
                  setMessageForm({ 
                    subject: `Regarding Session on ${new Date(booking.booking_date).toLocaleDateString()}`,
                    content: `Hi,\n\nI wanted to reach out regarding our session:\n\nDate: ${new Date(booking.booking_date).toLocaleDateString()}\nTime: ${booking.start_time} - ${booking.end_time}\nService: ${booking.service_name}\n\n` 
                  });
                  setShowMessageDialog(true); 
                }}
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                Message {isCoach ? 'Player' : 'Coach'}
              </Button>
              {isCoach && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => { 
                    setSelectedBooking(booking); 
                    setShowReminderDialog(true); 
                  }}
                  className="border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  <Send className="w-4 h-4 mr-1" />
                  Send Reminder
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => { setSelectedBooking(booking); setShowCancelDialog(true); }} className="border-orange-300 text-orange-600 hover:bg-orange-50">
                <X className="w-4 h-4 mr-1" />
                Cancel Booking
              </Button>
              {(user?.role === 'admin' || isCoach) && (
                <Button variant="outline" size="sm" onClick={() => { setSelectedBooking(booking); setShowDeleteDialog(true); }} className="border-red-300 text-red-600 hover:bg-red-50">
                  <X className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              )}
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
                <Link to={createPageUrl('Bookingpage')}>
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

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Booking</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-slate-600 mb-4">
              Are you sure you want to permanently delete this booking? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => deleteBookingMutation.mutate(selectedBooking?.id)}
                disabled={deleteBookingMutation.isPending}
                className="flex-1"
              >
                {deleteBookingMutation.isPending ? 'Deleting...' : 'Delete Booking'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reminder Dialog */}
      <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Session Reminder</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
              <p className="text-sm text-blue-900">
                This will send an email and notification reminder to:
              </p>
              <p className="font-semibold text-blue-900 mt-2">{selectedBooking?.parent_email}</p>
              <p className="text-xs text-blue-700 mt-1">Player: {selectedBooking?.player_name}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowReminderDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={() => sendReminderMutation.mutate(selectedBooking)}
                disabled={sendReminderMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4 mr-2" />
                {sendReminderMutation.isPending ? 'Sending...' : 'Send Reminder'}
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
                value={isCoach ? (selectedBooking?.parent_email || 'Player') : (coaches.find(c => c.id === selectedBooking?.coach_id)?.email || 'Coach')}
                disabled
                className="bg-slate-50"
              />
            </div>
            <div>
              <Label>Subject *</Label>
              <Input
                value={messageForm.subject}
                onChange={(e) => setMessageForm({...messageForm, subject: e.target.value})}
                placeholder="Message subject"
              />
            </div>
            <div>
              <Label>Message *</Label>
              <Textarea
                value={messageForm.content}
                onChange={(e) => setMessageForm({...messageForm, content: e.target.value})}
                rows={6}
                placeholder="Type your message..."
              />
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="text-xs text-emerald-900">
                ✓ Email will be sent via Resend<br/>
                ✓ In-app notification will be created
              </p>
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
                    content: messageForm.content,
                    sendNotification: true
                  });
                }}
                disabled={!messageForm.subject || !messageForm.content || sendMessageMutation.isPending}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <Send className="w-4 h-4 mr-2" />
                {sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}