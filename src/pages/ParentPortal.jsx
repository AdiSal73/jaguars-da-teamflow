import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Users, Calendar, MessageSquare, Phone, Mail, 
  User, Clock, MapPin, Trophy, TrendingUp, Activity,
  ChevronRight, Star
} from 'lucide-react';
import { format } from 'date-fns';

export default function ParentPortal() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list(),
    enabled: !!user
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => base44.entities.Booking.list('-booking_date'),
    enabled: !!user
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list(),
    enabled: !!user
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list(),
    enabled: !!user
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages'],
    queryFn: () => base44.entities.Message.list('-created_date'),
    enabled: !!user
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Notification.filter({ user_email: user?.email }, '-created_date', 10),
    enabled: !!user?.email
  });

  // Get parent's players
  const myPlayers = players.filter(p => 
    user?.player_ids?.includes(p.id) || 
    p.parent_emails?.some(e => e?.toLowerCase() === user?.email?.toLowerCase()) ||
    p.email?.toLowerCase() === user?.email?.toLowerCase()
  );

  // Get upcoming bookings for parent's players
  const today = new Date().toISOString().split('T')[0];
  const upcomingBookings = bookings.filter(b => 
    b.booking_date >= today && 
    b.status !== 'cancelled' &&
    myPlayers.some(p => p.id === b.player_id)
  ).slice(0, 5);

  // Get unread messages
  const myMessages = messages.filter(m => 
    m.recipient_email === user?.email && !m.read
  ).slice(0, 5);

  // Get coaches for parent's players
  const myCoaches = new Map();
  myPlayers.forEach(player => {
    if (player.team_id) {
      const team = teams.find(t => t.id === player.team_id);
      if (team?.coach_ids) {
        team.coach_ids.forEach(coachId => {
          const coach = coaches.find(c => c.id === coachId);
          if (coach && !myCoaches.has(coach.id)) {
            myCoaches.set(coach.id, { ...coach, teamName: team.name });
          }
        });
      }
    }
  });

  const formatTimeDisplay = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Welcome Back, {user?.full_name?.split(' ')[0]}!
          </h1>
          <p className="text-slate-600">Here's what's happening with your athletes</p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Player Cards - Takes up 2 columns on large screens */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-6 h-6 text-emerald-600" />
                Your Athletes
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myPlayers.map(player => {
                const team = teams.find(t => t.id === player.team_id);
                const playerBookings = upcomingBookings.filter(b => b.player_id === player.id);
                
                return (
                  <Card key={player.id} className="border-none shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-white to-slate-50 overflow-hidden group">
                    <div className="h-2 bg-gradient-to-r from-emerald-500 to-blue-500"></div>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            {player.full_name?.charAt(0)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{player.full_name}</CardTitle>
                            {team && (
                              <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                                <Trophy className="w-3 h-3" />
                                {team.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {player.age_group && (
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            {player.age_group}
                          </Badge>
                          {player.primary_position && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {player.primary_position}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {playerBookings.length > 0 && (
                        <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                          <p className="text-xs font-semibold text-emerald-900 mb-2">Upcoming Sessions</p>
                          <div className="space-y-1">
                            {playerBookings.slice(0, 2).map(booking => (
                              <div key={booking.id} className="text-xs text-emerald-800 flex items-center gap-2">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(booking.booking_date + 'T12:00:00'), 'MMM d')} at {formatTimeDisplay(booking.start_time)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <Link to={`${createPageUrl('PlayerDashboard')}?id=${player.id}`}>
                        <Button className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 group-hover:shadow-lg transition-all">
                          View Profile
                          <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
              
              {myPlayers.length === 0 && (
                <Card className="col-span-2 border-none shadow-lg">
                  <CardContent className="p-12 text-center">
                    <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No players associated with your account</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Right Column - Upcoming Bookings & Quick Actions */}
          <div className="space-y-6">
            {/* Upcoming Bookings */}
            <Card className="border-none shadow-lg bg-gradient-to-br from-white to-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Upcoming Sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingBookings.length > 0 ? (
                  <>
                    {upcomingBookings.slice(0, 4).map(booking => {
                      const player = players.find(p => p.id === booking.player_id);
                      const coach = coaches.find(c => c.id === booking.coach_id);
                      
                      return (
                        <div key={booking.id} className="bg-white rounded-lg p-3 border border-blue-100 hover:shadow-md transition-all">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900 text-sm">{booking.service_name}</p>
                              <p className="text-xs text-slate-600">{player?.full_name}</p>
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                              {format(new Date(booking.booking_date + 'T12:00:00'), 'MMM d')}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Clock className="w-3 h-3" />
                            {formatTimeDisplay(booking.start_time)}
                          </div>
                          {coach && (
                            <p className="text-xs text-slate-500 mt-1">with {coach.full_name}</p>
                          )}
                        </div>
                      );
                    })}
                    <Link to={createPageUrl('MyBookings')}>
                      <Button variant="outline" className="w-full mt-2">
                        View All Bookings
                      </Button>
                    </Link>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No upcoming sessions</p>
                    <Link to={createPageUrl('Bookingpage')}>
                      <Button className="mt-3 bg-emerald-600 hover:bg-emerald-700">
                        Book a Session
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Messages & Communications */}
            <Card className="border-none shadow-lg bg-gradient-to-br from-white to-purple-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                  Messages & Updates
                </CardTitle>
              </CardHeader>
              <CardContent>
                {myMessages.length > 0 || notifications.length > 0 ? (
                  <div className="space-y-2">
                    {myMessages.slice(0, 3).map(msg => (
                      <div key={msg.id} className="bg-white rounded-lg p-3 border border-purple-100 hover:shadow-md transition-all">
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-slate-900">{msg.subject}</p>
                            <p className="text-xs text-slate-600 line-clamp-2">{msg.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {notifications.slice(0, 2).map(notif => (
                      <div key={notif.id} className="bg-white rounded-lg p-3 border border-purple-100">
                        <p className="font-semibold text-sm text-slate-900">{notif.title}</p>
                        <p className="text-xs text-slate-600 line-clamp-2">{notif.message}</p>
                      </div>
                    ))}
                    <Link to={createPageUrl('Communications')}>
                      <Button variant="outline" className="w-full mt-2">
                        View All Messages
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No new messages</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Coaches Contact Info - Full Width */}
          <div className="lg:col-span-3">
            <Card className="border-none shadow-lg bg-gradient-to-br from-white to-slate-50">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Star className="w-6 h-6 text-amber-500" />
                  Your Coaches
                </CardTitle>
              </CardHeader>
              <CardContent>
                {myCoaches.size > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from(myCoaches.values()).map(coach => (
                      <div key={coach.id} className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-lg transition-all">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {coach.full_name?.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-slate-900">{coach.full_name}</h3>
                            <p className="text-xs text-slate-600">{coach.teamName}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {coach.email && (
                            <a href={`mailto:${coach.email}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 transition-colors">
                              <Mail className="w-4 h-4" />
                              {coach.email}
                            </a>
                          )}
                          {coach.phone && (
                            <a href={`tel:${coach.phone}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 transition-colors">
                              <Phone className="w-4 h-4" />
                              {coach.phone}
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-16 h-16 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No coaches assigned to your players' teams</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}