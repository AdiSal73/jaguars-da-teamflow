import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Search, User, Calendar, MapPin, Users, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function GlobalSearch({ open, onClose }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => base44.entities.Booking.list()
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list()
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const term = searchTerm.toLowerCase();
    const results = [];

    // Search players
    players.forEach(player => {
      if (
        player.full_name?.toLowerCase().includes(term) ||
        player.email?.toLowerCase().includes(term) ||
        player.primary_position?.toLowerCase().includes(term)
      ) {
        results.push({
          type: 'player',
          id: player.id,
          title: player.full_name,
          subtitle: `${player.primary_position || 'N/A'} • ${teams.find(t => t.id === player.team_id)?.name || 'No Team'}`,
          icon: User,
          url: `${createPageUrl('PlayerDashboard')}?id=${player.id}`
        });
      }
    });

    // Search coaches
    coaches.forEach(coach => {
      if (
        coach.full_name?.toLowerCase().includes(term) ||
        coach.email?.toLowerCase().includes(term)
      ) {
        results.push({
          type: 'coach',
          id: coach.id,
          title: coach.full_name,
          subtitle: coach.email,
          icon: User,
          url: createPageUrl('CoachManagement')
        });
      }
    });

    // Search bookings
    bookings.forEach(booking => {
      if (
        booking.player_name?.toLowerCase().includes(term) ||
        booking.coach_name?.toLowerCase().includes(term) ||
        booking.service_name?.toLowerCase().includes(term)
      ) {
        results.push({
          type: 'booking',
          id: booking.id,
          title: `${booking.service_name} - ${booking.player_name}`,
          subtitle: `${new Date(booking.booking_date).toLocaleDateString()} at ${booking.start_time}`,
          icon: Calendar,
          url: createPageUrl('MyBookings')
        });
      }
    });

    // Search locations
    locations.forEach(location => {
      if (
        location.name?.toLowerCase().includes(term) ||
        location.address?.toLowerCase().includes(term)
      ) {
        results.push({
          type: 'location',
          id: location.id,
          title: location.name,
          subtitle: location.address,
          icon: MapPin,
          url: createPageUrl('CoachManagement')
        });
      }
    });

    // Search teams
    teams.forEach(team => {
      if (team.name?.toLowerCase().includes(term)) {
        results.push({
          type: 'team',
          id: team.id,
          title: team.name,
          subtitle: `${team.age_group || 'N/A'} • ${team.branch || 'N/A'}`,
          icon: Users,
          url: `${createPageUrl('TeamDashboard')}?id=${team.id}`
        });
      }
    });

    return results.slice(0, 50);
  }, [searchTerm, players, coaches, bookings, locations, teams]);

  const handleResultClick = (result) => {
    navigate(result.url);
    onClose();
    setSearchTerm('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <div className="p-4 border-b flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search players, coaches, bookings, locations..."
            className="border-0 focus-visible:ring-0 text-lg"
            autoFocus
          />
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {searchTerm.trim() && searchResults.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              No results found for "{searchTerm}"
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="p-2">
              {searchResults.map((result, idx) => {
                const Icon = result.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleResultClick(result)}
                    className="w-full p-3 rounded-lg hover:bg-slate-50 transition-colors text-left flex items-center gap-3"
                  >
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{result.title}</div>
                      <div className="text-sm text-slate-500 truncate">{result.subtitle}</div>
                    </div>
                    <Badge className="bg-slate-200 text-slate-700 text-xs">
                      {result.type}
                    </Badge>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}