import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  User, Calendar, MessageSquare, BookOpen, Activity, 
  TrendingUp, Dumbbell, Brain, ArrowRight, Clock, Trophy
} from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list(),
    enabled: !!user
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list(),
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

  // Determine user role
  const isCoach = coaches.some(c => c.email === user?.email);
  const isAdmin = user?.role === 'admin' || user?.role === 'director';
  const myChildren = players.filter(p => (user?.player_ids || []).includes(p.id));
  const isParent = myChildren.length > 0;
  const isPlayer = players.some(p => p.email === user?.email);

  // Get upcoming bookings
  const upcomingBookings = bookings.filter(b => 
    (myChildren.some(child => child.id === b.player_id) || players.find(p => p.email === user?.email)?.id === b.player_id) &&
    new Date(b.booking_date) >= new Date() && 
    b.status !== 'cancelled'
  ).slice(0, 3);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-blue-50">
        <div className="animate-pulse text-emerald-600 font-semibold">Loading...</div>
      </div>
    );
  }

  // Redirect admins and coaches
  if (isAdmin || isCoach) {
    navigate(createPageUrl('Communications'));
    return null;
  }

  // Player/Parent Portal
  if (!user || isParent || isPlayer) {
    const activePlayer = isPlayer 
      ? players.find(p => p.email === user?.email)
      : myChildren[0];

    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 text-white">
          <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Welcome {user ? `Back, ${user.full_name?.split(' ')[0]}` : 'to Michigan Jaguars'}! 🎉
              </h1>
              <p className="text-lg md:text-xl opacity-90 mb-8">
                {isParent ? 'Track your child\'s progress and manage their development' : 
                 isPlayer ? 'Your journey to excellence starts here' : 
                 'Please log in to access your portal'}
              </p>
              {!user && (
                <Button 
                  onClick={() => base44.auth.redirectToLogin()}
                  size="lg"
                  className="bg-white text-emerald-600 hover:bg-slate-100 font-bold text-lg px-8 py-6"
                >
                  Login / Register
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {user && activePlayer && (
          <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
            {/* Player Selector for Parents */}
            {isParent && myChildren.length > 1 && (
              <Card className="mb-8 border-none shadow-xl bg-gradient-to-br from-white to-slate-50">
                <CardContent className="p-6">
                  <Label className="text-sm font-bold text-slate-700 mb-4 block">Select Player</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {myChildren.map(child => {
                      const childTeam = teams.find(t => t.id === child.team_id);
                      return (
                        <button
                          key={child.id}
                          onClick={() => navigate(`${createPageUrl('PlayerDashboard')}?id=${child.id}`)}
                          className="p-4 rounded-xl border-2 border-slate-200 hover:border-emerald-500 bg-white hover:shadow-lg transition-all text-left"
                        >
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center text-white text-xl font-bold mb-3">
                            {child.jersey_number || child.full_name?.charAt(0)}
                          </div>
                          <div className="font-bold text-sm truncate">{child.full_name}</div>
                          <div className="text-xs text-slate-600 mt-1">{childTeam?.name}</div>
                          <Badge className="mt-2 text-[10px]">{child.primary_position}</Badge>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card 
                onClick={() => navigate(`${createPageUrl('PlayerDashboard')}?id=${activePlayer.id}`)}
                className="border-none shadow-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white cursor-pointer hover:scale-105 transition-transform"
              >
                <CardContent className="p-6">
                  <User className="w-10 h-10 mb-3 opacity-90" />
                  <h3 className="text-xl font-bold mb-1">Player Profile</h3>
                  <p className="text-sm opacity-90">View complete development profile</p>
                  <ArrowRight className="w-5 h-5 mt-3" />
                </CardContent>
              </Card>

              <Card 
                onClick={() => navigate(createPageUrl('Bookingpage'))}
                className="border-none shadow-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white cursor-pointer hover:scale-105 transition-transform"
              >
                <CardContent className="p-6">
                  <Calendar className="w-10 h-10 mb-3 opacity-90" />
                  <h3 className="text-xl font-bold mb-1">Book Session</h3>
                  <p className="text-sm opacity-90">Schedule 1-on-1 coaching</p>
                  <Badge className="mt-3 bg-white/30 text-white">{upcomingBookings.length} upcoming</Badge>
                </CardContent>
              </Card>

              <Card 
                onClick={() => navigate(createPageUrl('Communications'))}
                className="border-none shadow-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white cursor-pointer hover:scale-105 transition-transform"
              >
                <CardContent className="p-6">
                  <MessageSquare className="w-10 h-10 mb-3 opacity-90" />
                  <h3 className="text-xl font-bold mb-1">Messages</h3>
                  <p className="text-sm opacity-90">Chat with coaches</p>
                  <ArrowRight className="w-5 h-5 mt-3" />
                </CardContent>
              </Card>

              <Card 
                onClick={() => navigate(createPageUrl('FitnessResources'))}
                className="border-none shadow-xl bg-gradient-to-br from-orange-500 to-red-600 text-white cursor-pointer hover:scale-105 transition-transform"
              >
                <CardContent className="p-6">
                  <Dumbbell className="w-10 h-10 mb-3 opacity-90" />
                  <h3 className="text-xl font-bold mb-1">Training</h3>
                  <p className="text-sm opacity-90">Fitness resources & plans</p>
                  <ArrowRight className="w-5 h-5 mt-3" />
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Upcoming Sessions */}
              <Card className="md:col-span-2 border-none shadow-xl">
                <CardHeader className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Upcoming Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {upcomingBookings.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-500 mb-4">No upcoming sessions</p>
                      <Button 
                        onClick={() => navigate(createPageUrl('Bookingpage'))}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        Book Your First Session
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingBookings.map(booking => (
                        <div key={booking.id} className="p-4 bg-emerald-50 rounded-xl border-2 border-emerald-200 hover:border-emerald-400 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-bold text-base">{booking.service_name}</div>
                              <div className="text-sm text-slate-600 mt-1">
                                {new Date(booking.booking_date).toLocaleDateString('en-US', { 
                                  weekday: 'long', month: 'long', day: 'numeric' 
                                })}
                              </div>
                              <div className="text-sm text-slate-600">
                                {booking.start_time} - {booking.end_time}
                              </div>
                              <div className="text-xs text-slate-500 mt-2">
                                Coach: {booking.coach_name}
                              </div>
                            </div>
                            <Badge className="bg-emerald-500 text-white">
                              {booking.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      <Button 
                        onClick={() => navigate(createPageUrl('MyBookings'))}
                        variant="outline"
                        className="w-full mt-4"
                      >
                        View All Bookings
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Resources */}
              <Card className="border-none shadow-xl">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Brain className="w-5 h-5" />
                    Resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <Button
                      onClick={() => navigate(createPageUrl('JaguarsKnowledgeBank'))}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Knowledge Bank
                    </Button>
                    <Button
                      onClick={() => navigate(createPageUrl('FitnessResources'))}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Dumbbell className="w-4 h-4 mr-2" />
                      Fitness Plans
                    </Button>
                    <Button
                      onClick={() => navigate(createPageUrl('CoachingResources'))}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Trophy className="w-4 h-4 mr-2" />
                      Training Videos
                    </Button>
                    <Button
                      onClick={() => navigate(createPageUrl('Leaderboard'))}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Leaderboards
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Development Goals */}
            {activePlayer?.goals?.length > 0 && (
              <Card className="mt-6 border-none shadow-xl">
                <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Active Development Goals
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    {activePlayer.goals.filter(g => !g.completed).slice(0, 4).map(goal => (
                      <div key={goal.id} className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border-2 border-slate-200">
                        <h4 className="font-bold text-sm mb-2">{goal.description}</h4>
                        {goal.plan_of_action && (
                          <p className="text-xs text-slate-600 mb-3">{goal.plan_of_action}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-300 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all"
                              style={{ width: `${goal.progress || 0}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-700">{goal.progress || 0}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button 
                    onClick={() => navigate(`${createPageUrl('PlayerDashboard')}?id=${activePlayer.id}`)}
                    variant="outline"
                    className="w-full mt-4"
                  >
                    View All Goals
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {!user && (
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-none shadow-xl hover:shadow-2xl transition-all">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Player Profiles</h3>
                  <p className="text-slate-600 text-sm">Track progress, goals, and development</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-xl hover:shadow-2xl transition-all">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Easy Booking</h3>
                  <p className="text-slate-600 text-sm">Schedule coaching sessions online</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-xl hover:shadow-2xl transition-all">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Track Growth</h3>
                  <p className="text-slate-600 text-sm">Monitor performance and achievements</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}