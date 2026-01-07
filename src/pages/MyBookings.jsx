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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, User, X, MessageSquare, Send, Filter, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import BookingCalendarSync from '../components/booking/BookingCalendarSync';
import SendConfirmDialog from '../components/messaging/SendConfirmDialog';

export default function MyBookings() {
  const queryClient = useQueryClient();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [messageForm, setMessageForm] = useState({ subject: '', content: '' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [coachFilter, setCoachFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [sendRecipient, setSendRecipient] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => base44.entities.Booking.list('booking_date,start_time')
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list()
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
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
      const player = players.find(p => p.id === booking.player_id);

      // Gather all recipients - coach, player, and all parents
      const allRecipients = new Set();
      
      // Add coach
      if (coach?.email) allRecipients.add(coach.email);
      
      // Add parent who booked
      if (booking.parent_email) allRecipients.add(booking.parent_email);
      
      // Add player email
      if (player?.player_email) allRecipients.add(player.player_email);
      
      // Add all parent emails from player record
      if (player?.parent_emails?.length > 0) {
        player.parent_emails.forEach(email => allRecipients.add(email));
      }

      // Send cancellation email to all parties
      const recipientArray = Array.from(allRecipients);
      if (recipientArray.length > 0) {
        await base44.functions.invoke('sendBookingEmail', {
          to: recipientArray[0],
          additionalRecipients: recipientArray.slice(1),
          subject: `Booking Cancelled - ${booking.service_name}`,
          booking: { 
            ...booking, 
            location_info: locationInfo, 
            booked_by_name: user?.full_name || 'Guest',
            cancelled_by: user?.full_name || user?.email || 'User'
          },
          type: 'cancellation'
        });

        // Create notifications for all
        for (const email of recipientArray) {
          await base44.entities.Notification.create({
            user_email: email,
            type: 'training',
            title: 'Booking Cancelled',
            message: `Session on ${new Date(booking.booking_date + 'T12:00:00').toLocaleDateString()} at ${booking.start_time} has been cancelled by ${user?.full_name || 'a user'}.`,
            priority: 'high'
          });
        }
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
    
    // Match by parent_id, created_by, or parent_email
    if (b.parent_id === user?.id || b.created_by === user?.email || b.parent_email === user?.email) {
      return true;
    }
    
    // Check if user's player_ids match the booking
    if (user?.player_ids && user.player_ids.length > 0) {
      if (user.player_ids.includes(b.player_id)) return true;
    }
    
    return false;
  }).sort((a, b) => {
    // Sort by date first, then time
    const dateCompare = a.booking_date.localeCompare(b.booking_date);
    if (dateCompare !== 0) return dateCompare;
    return a.start_time.localeCompare(b.start_time);
  });

  // Apply filters
  const filteredBookings = myBookings.filter(b => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (coachFilter !== 'all' && b.coach_id !== coachFilter) return false;
    if (dateRange.from && b.booking_date < dateRange.from) return false;
    if (dateRange.to && b.booking_date > dateRange.to) return false;
    return true;
  });

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  const upcomingBookings = filteredBookings.filter(b => b.booking_date >= today && b.status !== 'cancelled');
  const todayBookings = upcomingBookings.filter(b => b.booking_date === today);
  const tomorrowBookings = upcomingBookings.filter(b => b.booking_date === tomorrowStr);
  const pastBookings = filteredBookings.filter(b => b.booking_date < today || b.status === 'cancelled');

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
    const player = players.find(p => p.id === booking.player_id);
    
    // Parse date correctly to avoid timezone shift
    const [year, month, day] = booking.booking_date.split('-').map(Number);
    const bookingDate = new Date(year, month - 1, day);
    
    return (
      <Card className="border-none shadow-md hover:shadow-xl transition-all bg-gradient-to-br from-white to-slate-50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex gap-4 flex-1">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                {coach?.full_name?.charAt(0) || 'C'}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-slate-900">{booking.service_name}</h3>
                <p className="text-sm text-slate-600">with {coach?.full_name || booking.coach_name}</p>
                {booking.player_name && player && (
                  <Link to={`${createPageUrl('PlayerDashboard')}?id=${player.id}`} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium hover:underline mt-1 inline-block">
                    {booking.player_name} →
                  </Link>
                )}
                {booking.player_name && !player && (
                  <p className="text-sm text-slate-500 mt-1">{booking.player_name}</p>
                )}
              </div>
            </div>
            <Badge className={`${statusColors[booking.status]} text-xs px-3 py-1`}>{booking.status}</Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
              <div className="flex items-center gap-2 text-emerald-700 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-semibold">Date</span>
              </div>
              <p className="font-bold text-slate-900">{bookingDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="flex items-center gap-2 text-blue-700 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-semibold">Time</span>
              </div>
              <p className="font-bold text-slate-900">{formatTimeDisplay(booking.start_time)} - {formatTimeDisplay(booking.end_time)}</p>
            </div>
          </div>
          
          {location && (
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <p className="text-xs text-slate-600 mb-1 font-semibold">Location</p>
              <p className="text-sm text-slate-900 font-medium">{location.name}</p>
              <p className="text-xs text-slate-600">{location.address}</p>
            </div>
          )}
          
          {booking.notes && (
            <p className="mt-3 text-sm text-slate-500 bg-slate-50 p-2 rounded">{booking.notes}</p>
          )}
          
          {(booking.status === 'confirmed' || booking.status === 'pending') && booking.booking_date >= today && (
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
              {isCoach && booking.booking_date >= today && (
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
              {booking.booking_date >= today && (
                <Button variant="outline" size="sm" onClick={() => { setSelectedBooking(booking); setShowCancelDialog(true); }} className="border-orange-300 text-orange-600 hover:bg-orange-50">
                <X className="w-4 h-4 mr-1" />
                Cancel Booking
                </Button>
                )}
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">My Bookings</h1>
            <p className="text-slate-600 mt-2">View and manage your scheduled training sessions</p>
          </div>
          <Link to={createPageUrl('Bookingpage')}>
            <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              Book New Session
            </Button>
          </Link>
        </div>

      {/* Filters - Admin Only */}
      {user?.role === 'admin' && (
        <Card className="mb-6 border-none shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-slate-600" />
              <span className="font-semibold text-slate-900">Filters</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Coach</Label>
                <Select value={coachFilter} onValueChange={setCoachFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Coaches</SelectItem>
                    {coaches?.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">From Date</Label>
                <Input 
                  type="date" 
                  value={dateRange.from} 
                  onChange={e => setDateRange({...dateRange, from: e.target.value})}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs">To Date</Label>
                <Input 
                  type="date" 
                  value={dateRange.to} 
                  onChange={e => setDateRange({...dateRange, to: e.target.value})}
                  className="h-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="upcoming">
        <TabsList className="mb-6 bg-slate-100">
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past & Cancelled ({pastBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-8">
          {/* Today's Sessions */}
          {todayBookings.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl p-6 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Calendar className="w-6 h-6" />
                </div>
                Today's Sessions
              </h2>
              <div className="grid gap-4">
                {todayBookings.map(booking => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            </div>
          )}

          {/* Tomorrow's Sessions */}
          {tomorrowBookings.length > 0 && (
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-6 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Clock className="w-6 h-6" />
                </div>
                Tomorrow's Sessions
              </h2>
              <div className="grid gap-4">
                {tomorrowBookings.map(booking => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            </div>
          )}

          {/* All Upcoming Section */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-600" />
              All Upcoming Sessions
            </h2>
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
                {upcomingBookings?.map(booking => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </div>
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
              {pastBookings?.map(booking => (
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
                  setSendRecipient(recipient);
                  setShowSendConfirm(true);
                }}
                disabled={!messageForm.subject || !messageForm.content || sendMessageMutation.isPending}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SendConfirmDialog
        open={showSendConfirm}
        onClose={() => setShowSendConfirm(false)}
        onConfirm={() => {
          sendMessageMutation.mutate({
            to: sendRecipient,
            subject: messageForm.subject,
            content: messageForm.content,
            sendNotification: true
          });
          setShowSendConfirm(false);
        }}
        title="Send Message?"
        recipients={[sendRecipient]}
        isLoading={sendMessageMutation.isPending}
      />
      </div>
    </div>
  );
}