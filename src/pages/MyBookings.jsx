import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, Clock, User, MapPin, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function MyBookings() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['myBookings'],
    queryFn: async () => {
      const all = await base44.entities.Booking.list('-created_date');
      return all.filter(b => b.player_email === user?.email);
    },
    enabled: !!user
  });

  const cancelBookingMutation = useMutation({
    mutationFn: (id) => base44.entities.Booking.update(id, { status: 'Cancelled' }),
    onSuccess: () => queryClient.invalidateQueries(['myBookings'])
  });

  const upcoming = bookings.filter(b => 
    b.status === 'Scheduled' && new Date(b.date) >= new Date()
  );

  const past = bookings.filter(b => 
    b.status === 'Completed' || new Date(b.date) < new Date()
  );

  const cancelled = bookings.filter(b => b.status === 'Cancelled');

  const statusColors = {
    Scheduled: 'bg-emerald-100 text-emerald-800',
    Completed: 'bg-blue-100 text-blue-800',
    Cancelled: 'bg-red-100 text-red-800',
    'No-show': 'bg-orange-100 text-orange-800'
  };

  const BookingCard = ({ booking, showCancel }) => (
    <Card className="border-none shadow-lg">
      <CardHeader className="border-b">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{booking.session_type}</CardTitle>
            <Badge className={statusColors[booking.status] + ' mt-2'}>{booking.status}</Badge>
          </div>
          {showCancel && booking.status === 'Scheduled' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (window.confirm('Cancel this booking?')) {
                  cancelBookingMutation.mutate(booking.id);
                }
              }}
              className="hover:text-red-600"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-slate-400" />
            <span className="text-slate-700">Coach: {booking.coach_name}</span>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-700">{new Date(booking.date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-slate-700">{booking.start_time} ({booking.duration} min)</span>
          </div>
          {booking.meeting_location && (
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span className="text-slate-700">{booking.meeting_location}</span>
            </div>
          )}
          {booking.notes && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
              <div className="text-xs text-slate-600 mb-1">Notes:</div>
              <p className="text-sm text-slate-700">{booking.notes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">My Bookings</h1>
        <p className="text-slate-600 mt-1">View and manage your training sessions</p>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({cancelled.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {upcoming.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No upcoming bookings</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcoming.map(booking => (
                <BookingCard key={booking.id} booking={booking} showCancel={true} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {past.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No past bookings</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {past.map(booking => (
                <BookingCard key={booking.id} booking={booking} showCancel={false} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="mt-6">
          {cancelled.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No cancelled bookings</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cancelled.map(booking => (
                <BookingCard key={booking.id} booking={booking} showCancel={false} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}