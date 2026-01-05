import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, User } from 'lucide-react';
import { format } from 'date-fns';

export default function UpcomingBookings({ playerId }) {
  const { data: bookings = [] } = useQuery({
    queryKey: ['upcomingBookings', playerId],
    queryFn: async () => {
      const allBookings = await base44.entities.Booking.filter({ 
        player_id: playerId,
        status: 'confirmed'
      }, '-booking_date');
      
      const today = new Date().toISOString().split('T')[0];
      return allBookings.filter(b => b.booking_date >= today).slice(0, 3);
    },
    enabled: !!playerId
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list()
  });

  if (bookings.length === 0) {
    return (
      <Card className="bg-white/50 border-white/20 backdrop-blur-md">
        <CardContent className="p-4 text-center">
          <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs text-slate-400">No upcoming sessions</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/50 border-white/20 backdrop-blur-md">
      <CardContent className="p-4">
        <h3 className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Upcoming Sessions
        </h3>
        <div className="space-y-2">
          {bookings.map(booking => {
            const coach = coaches.find(c => c.id === booking.coach_id);
            const location = locations.find(l => l.id === booking.location_id);
            
            return (
              <div key={booking.id} className="bg-white/80 rounded-lg p-3 border border-white/40">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-sm text-slate-900">{booking.service_name}</div>
                    <div className="text-xs text-slate-600 flex items-center gap-1 mt-1">
                      <User className="w-3 h-3" />
                      {coach?.full_name || 'Coach'}
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                    {booking.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(booking.booking_date), 'MMM d')}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {booking.start_time}
                  </div>
                  {location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {location.name}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}