import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, TrendingUp, Clock, Users, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CoachDashboard() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const currentCoach = coaches.find(c => c.email === user?.email);

  const { data: bookings = [] } = useQuery({
    queryKey: ['coachBookings'],
    queryFn: async () => {
      const all = await base44.entities.Booking.list();
      return all.filter(b => b.coach_id === currentCoach?.id);
    },
    enabled: !!currentCoach
  });

  const { data: players = [] } = useQuery({
    queryKey: ['coachPlayers'],
    queryFn: async () => {
      const all = await base44.entities.Player.list();
      return all.filter(p => currentCoach?.team_ids?.includes(p.team_id));
    },
    enabled: !!currentCoach
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['coachAssessments'],
    queryFn: async () => {
      const all = await base44.entities.PhysicalAssessment.list('-assessment_date', 50);
      return all.filter(a => currentCoach?.team_ids?.includes(a.team_id));
    },
    enabled: !!currentCoach
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const upcomingBookings = bookings
    .filter(b => b.status === 'Scheduled' && new Date(b.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  const pendingBookings = bookings.filter(b => b.status === 'Scheduled').length;

  const teamPerformance = currentCoach?.team_ids?.map(teamId => {
    const team = teams.find(t => t.id === teamId);
    const teamAssessments = assessments.filter(a => a.team_id === teamId);
    const avgOverall = teamAssessments.length > 0
      ? Math.round(teamAssessments.reduce((sum, a) => sum + (a.overall_score || 0), 0) / teamAssessments.length)
      : 0;
    return {
      name: team?.name || 'Unknown',
      score: avgOverall
    };
  }) || [];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Coach Dashboard</h1>
        <p className="text-slate-600 mt-1">Welcome back, {user?.full_name}</p>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">My Teams</div>
                <div className="text-3xl font-bold text-slate-900 mt-1">{currentCoach?.team_ids?.length || 0}</div>
              </div>
              <Users className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Total Players</div>
                <div className="text-3xl font-bold text-slate-900 mt-1">{players.length}</div>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Pending Bookings</div>
                <div className="text-3xl font-bold text-slate-900 mt-1">{pendingBookings}</div>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Assessments</div>
                <div className="text-3xl font-bold text-slate-900 mt-1">{assessments.length}</div>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              Upcoming Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No upcoming sessions</p>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map(booking => (
                  <div key={booking.id} className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-slate-900">{booking.player_name}</p>
                        <p className="text-sm text-slate-600">{booking.session_type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-emerald-600">{booking.start_time}</p>
                        <p className="text-xs text-slate-500">{new Date(booking.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Team Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {teamPerformance.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No team data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={teamPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid md:grid-cols-3 gap-4">
        <Link to={createPageUrl('Availability')}>
          <Card className="border-none shadow-lg hover:shadow-xl transition-all cursor-pointer">
            <CardContent className="p-6 text-center">
              <Clock className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900">Manage Availability</h3>
            </CardContent>
          </Card>
        </Link>
        <Link to={createPageUrl('TrainingPlans')}>
          <Card className="border-none shadow-lg hover:shadow-xl transition-all cursor-pointer">
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900">Training Plans</h3>
            </CardContent>
          </Card>
        </Link>
        <Link to={createPageUrl('Teams')}>
          <Card className="border-none shadow-lg hover:shadow-xl transition-all cursor-pointer">
            <CardContent className="p-6 text-center">
              <Users className="w-12 h-12 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900">My Teams</h3>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}