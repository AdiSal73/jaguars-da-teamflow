import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, User } from 'lucide-react';
import { format } from 'date-fns';

export default function UpcomingBookings({ playerId }) {
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: player } = useQuery({
    queryKey: ['player', playerId],
    queryFn: async () => {
      const players = await base44.entities.Player.filter({ id: playerId });
      return players[0];
    },
    enabled: !!playerId
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['upcomingBookings', playerId],
    queryFn: async () => {
      // Get all bookings for this player
      const allBookings = await base44.entities.Booking.list();
      
      const today = new Date().toISOString().split('T')[0];
      
      // Filter bookings that are:
      // 1. For this player (player_id matches)
      // 2. OR booked by a parent who has this player in their player_ids
      const relevantBookings = allBookings.filter(b => {
        if (b.booking_date < today) return false;
        if (b.status !== 'confirmed') return false;
        
        // Direct player booking
        if (b.player_id === playerId) return true;
        
        // Booking made by parent on behalf of this player
        if (b.parent_email && player?.parent_emails?.includes(b.parent_email)) return true;
        if (b.parent_email && b.parent_email === player?.email) return true;
        
        return false;
      });

      return relevantBookings
        .sort((a, b) => new Date(a.booking_date) - new Date(b.booking_date))
        .slice(0, 3);
    },
    enabled: !!playerId && !!player
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
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md">
        <CardContent className="p-4 text-center">
          <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs text-slate-300">No upcoming sessions</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md">
      <CardContent className="p-4">
        <h3 className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          Upcoming Sessions
        </h3>
        <div className="space-y-2">
          {bookings.map(booking => {
            const coach = coaches.find(c => c.id === booking.coach_id);
            const location = locations.find(l => l.id === booking.location_id);
            
            return (
              <div key={booking.id} className="bg-white/10 rounded-lg p-3 border border-white/20">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-sm text-white">{booking.service_name}</div>
                    <div className="text-xs text-slate-300 flex items-center gap-1 mt-1">
                      <User className="w-3 h-3 text-emerald-400" />
                      {coach?.full_name || 'Coach'}
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs">
                    {booking.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-emerald-400" />
                    {format(new Date(booking.booking_date), 'MMM d')}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-400" />
                    {booking.start_time}
                  </div>
                  {location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-400" />
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