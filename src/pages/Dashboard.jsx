
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Users, Shield, Calendar, Activity, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: players = [], isLoading: loadingPlayers } = useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const allPlayers = await base44.entities.Player.list();
      if (user?.role === 'user') {
        return allPlayers.filter(p => p.email === user.email);
      }
      if (user?.role === 'coach') {
        const coaches = await base44.entities.Coach.list();
        const currentCoach = coaches.find(c => c.email === user.email);
        if (currentCoach?.team_ids) {
          return allPlayers.filter(p => currentCoach.team_ids.includes(p.team_id));
        }
      }
      return allPlayers;
    },
    enabled: !!user
  });

  const { data: teams = [], isLoading: loadingTeams } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const allTeams = await base44.entities.Team.list();
      if (user?.role === 'user') return [];
      if (user?.role === 'coach') {
        const coaches = await base44.entities.Coach.list();
        const currentCoach = coaches.find(c => c.email === user.email);
        if (currentCoach?.team_ids) {
          return allTeams.filter(t => currentCoach.team_ids.includes(t.id));
        }
      }
      return allTeams;
    },
    enabled: !!user
  });

  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const allBookings = await base44.entities.Booking.list('-created_date', 10);
      if (user?.role === 'user') {
        return allBookings.filter(b => b.player_email === user.email);
      }
      if (user?.role === 'coach') {
        const coaches = await base44.entities.Coach.list();
        const currentCoach = coaches.find(c => c.email === user.email);
        return allBookings.filter(b => b.coach_id === currentCoach?.id);
      }
      return allBookings;
    },
    enabled: !!user
  });

  const { data: assessments = [], isLoading: loadingAssessments } = useQuery({
    queryKey: ['assessments'],
    queryFn: async () => {
      const allAssessments = await base44.entities.PhysicalAssessment.list('-assessment_date', 10);
      if (user?.role === 'user') {
        const playerIds = players.map(p => p.id);
        return allAssessments.filter(a => playerIds.includes(a.player_id));
      }
      if (user?.role === 'coach') {
        const playerIds = players.map(p => p.id);
        return allAssessments.filter(a => playerIds.includes(a.player_id));
      }
      return allAssessments;
    },
    enabled: !!user && players.length > 0
  });

  // Redirect players to their profile
  React.useEffect(() => {
    if (user?.role === 'user' && players.length > 0) {
      window.location.href = `${createPageUrl('PlayerProfile')}?id=${players[0].id}`;
    }
  }, [user, players]);

  if (user?.role === 'user') {
    return <div className="p-8 text-center">Redirecting to your profile...</div>;
  }

  const upcomingBookings = bookings.filter(b => 
    b.status === 'Scheduled' && new Date(b.date) >= new Date()
  ).slice(0, 5);

  const recentAssessments = assessments.slice(0, 4);

  const stats = [
    { 
      title: 'Total Players', 
      value: players.length, 
      icon: Users, 
      color: 'bg-blue-500',
      link: createPageUrl('Players')
    },
    { 
      title: 'Active Teams', 
      value: teams.length, 
      icon: Shield, 
      color: 'bg-emerald-500',
      link: createPageUrl('Teams')
    },
    { 
      title: 'Upcoming Sessions', 
      value: upcomingBookings.length, 
      icon: Calendar, 
      color: 'bg-purple-500',
      link: createPageUrl('BookSession')
    },
    { 
      title: 'Recent Assessments', 
      value: assessments.length, 
      icon: Activity, 
      color: 'bg-orange-500',
      link: createPageUrl('Assessments')
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to Soccer Hub</h1>
        <p className="text-slate-600">Manage your club's players, teams, and training sessions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Link key={stat.title} to={stat.link}>
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-none bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`${stat.color} p-2 rounded-lg`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">
                  {loadingPlayers || loadingTeams || loadingBookings || loadingAssessments ? (
                    <Skeleton className="h-10 w-16" />
                  ) : (
                    stat.value
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-md">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              Upcoming Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {loadingBookings ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : upcomingBookings.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No upcoming sessions</p>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map(booking => (
                  <div key={booking.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <div>
                      <p className="font-semibold text-slate-900">{booking.player_name || 'Player'}</p>
                      <p className="text-sm text-slate-600">{booking.coach_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-emerald-600">{booking.start_time}</p>
                      <p className="text-xs text-slate-500">{new Date(booking.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Recent Assessments
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {loadingAssessments ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : recentAssessments.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No assessments yet</p>
            ) : (
              <div className="space-y-3">
                {recentAssessments.map(assessment => (
                  <div key={assessment.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <div>
                      <p className="font-semibold text-slate-900">Physical Assessment</p>
                      <p className="text-xs text-slate-500">{new Date(assessment.assessment_date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="text-center">
                        <div className="text-xs text-slate-500">Avg</div>
                        <div className="text-sm font-bold text-slate-900">
                          {Math.round((assessment.speed + assessment.agility + assessment.power + assessment.endurance) / 4)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
