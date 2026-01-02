import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Calendar, MessageSquare, DollarSign, TrendingUp, BookOpen, Activity, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function ParentPortal() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => base44.entities.Booking.list('-booking_date')
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations'],
    queryFn: () => base44.entities.Evaluation.list()
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => base44.entities.PhysicalAssessment.list()
  });

  const myChildren = players.filter(p => 
    (user?.player_ids || []).includes(p.id)
  );

  const activePlayer = selectedPlayerId 
    ? myChildren.find(p => p.id === selectedPlayerId) 
    : myChildren[0];

  React.useEffect(() => {
    if (!selectedPlayerId && myChildren.length > 0) {
      setSelectedPlayerId(myChildren[0].id);
    }
  }, [myChildren, selectedPlayerId]);

  const playerTeam = teams.find(t => t.id === activePlayer?.team_id);
  const playerBookings = bookings.filter(b => b.player_id === activePlayer?.id);
  const upcomingBookings = playerBookings.filter(b => 
    new Date(b.booking_date) >= new Date() && b.status !== 'cancelled'
  ).slice(0, 3);
  
  const playerEvaluations = evaluations.filter(e => e.player_id === activePlayer?.id)
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  const latestEval = playerEvaluations[0];

  const playerAssessments = assessments.filter(a => a.player_id === activePlayer?.id)
    .sort((a, b) => new Date(b.assessment_date) - new Date(a.assessment_date));
  const latestAssessment = playerAssessments[0];

  if (!user || myChildren.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <User className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">No Players Linked</h2>
            <p className="text-slate-600">
              Your account is not linked to any players yet. Please contact your club administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Parent Portal
          </h1>
          <p className="text-slate-600">Welcome, {user?.full_name}</p>
        </div>

        {/* Player Selector */}
        {myChildren.length > 1 && (
          <Card className="mb-6 border-none shadow-lg">
            <CardContent className="p-4">
              <Label className="text-sm font-semibold text-slate-700 mb-3 block">Select Player</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {myChildren.map(child => {
                  const childTeam = teams.find(t => t.id === child.team_id);
                  return (
                    <button
                      key={child.id}
                      onClick={() => setSelectedPlayerId(child.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        selectedPlayerId === child.id
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 hover:border-emerald-300 bg-white'
                      }`}
                    >
                      <div className="font-bold text-sm">{child.full_name}</div>
                      <div className="text-xs text-slate-600 mt-1">{childTeam?.name}</div>
                      <Badge className="text-[9px] mt-2">{child.primary_position}</Badge>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-500 to-green-600 text-white">
            <CardContent className="p-6">
              <Activity className="w-8 h-8 mb-2 opacity-80" />
              <div className="text-2xl font-bold">{playerEvaluations.length}</div>
              <div className="text-sm opacity-90">Evaluations</div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-lg bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
            <CardContent className="p-6">
              <TrendingUp className="w-8 h-8 mb-2 opacity-80" />
              <div className="text-2xl font-bold">{playerAssessments.length}</div>
              <div className="text-sm opacity-90">Assessments</div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white">
            <CardContent className="p-6">
              <Calendar className="w-8 h-8 mb-2 opacity-80" />
              <div className="text-2xl font-bold">{upcomingBookings.length}</div>
              <div className="text-sm opacity-90">Upcoming Sessions</div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-lg bg-gradient-to-br from-orange-500 to-red-600 text-white">
            <CardContent className="p-6">
              <BookOpen className="w-8 h-8 mb-2 opacity-80" />
              <div className="text-2xl font-bold">{activePlayer?.goals?.length || 0}</div>
              <div className="text-sm opacity-90">Development Goals</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bookings">Sessions</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Player Profile Summary */}
              <Card className="border-none shadow-xl">
                <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-600 text-white">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Player Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                      {activePlayer?.jersey_number || activePlayer?.full_name?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{activePlayer?.full_name}</h3>
                      <p className="text-sm text-slate-600">{playerTeam?.name}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                    <div>
                      <Label className="text-xs text-slate-600">Position</Label>
                      <p className="font-semibold">{activePlayer?.primary_position}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-600">Jersey</Label>
                      <p className="font-semibold">{activePlayer?.jersey_number || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-600">Age Group</Label>
                      <p className="font-semibold">{playerTeam?.age_group}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-600">Status</Label>
                      <Badge className="bg-green-100 text-green-800">{activePlayer?.status}</Badge>
                    </div>
                  </div>
                  <Button 
                    onClick={() => navigate(`${createPageUrl('PlayerDashboard')}?id=${activePlayer?.id}`)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4"
                  >
                    View Full Profile
                  </Button>
                </CardContent>
              </Card>

              {/* Latest Evaluation */}
              {latestEval && (
                <Card className="border-none shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Latest Evaluation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-xs text-slate-600 mb-4">
                      {new Date(latestEval.created_date).toLocaleDateString()}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Mental', value: Math.round(((latestEval.growth_mindset || 0) + (latestEval.resilience || 0) + (latestEval.team_focus || 0)) / 3) },
                        { label: 'Physical', value: latestEval.athleticism || 0 },
                        { label: 'Defending', value: Math.round(((latestEval.defending_organized || 0) + (latestEval.defending_final_third || 0)) / 2) },
                        { label: 'Attacking', value: Math.round(((latestEval.attacking_organized || 0) + (latestEval.attacking_final_third || 0)) / 2) }
                      ].map(metric => (
                        <div key={metric.label} className="p-3 bg-blue-50 rounded-lg">
                          <div className="text-xs text-slate-600">{metric.label}</div>
                          <div className="text-2xl font-bold text-blue-600">{metric.value}<span className="text-sm">/10</span></div>
                        </div>
                      ))}
                    </div>
                    {latestEval.player_strengths && (
                      <div className="mt-4 p-3 bg-green-50 rounded-lg">
                        <Label className="text-xs font-semibold text-green-900">Strengths</Label>
                        <p className="text-sm text-slate-700 mt-1">{latestEval.player_strengths}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Development Goals */}
            {activePlayer?.goals?.length > 0 && (
              <Card className="border-none shadow-xl">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  <CardTitle className="text-lg">Development Goals</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {activePlayer.goals.slice(0, 5).map(goal => (
                      <div key={goal.id} className="p-4 bg-slate-50 rounded-lg border-2 border-slate-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">{goal.description}</h4>
                            {goal.plan_of_action && (
                              <p className="text-xs text-slate-600 mt-1">{goal.plan_of_action}</p>
                            )}
                          </div>
                          <Badge className={goal.completed ? 'bg-green-500' : 'bg-blue-500'}>
                            {goal.completed ? 'Completed' : `${goal.progress || 0}%`}
                          </Badge>
                        </div>
                        {goal.progress > 0 && !goal.completed && (
                          <div className="mt-3">
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                                style={{ width: `${goal.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            <Card className="border-none shadow-xl">
              <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-600 text-white">
                <div className="flex items-center justify-between">
                  <CardTitle>Coaching Sessions</CardTitle>
                  <Button 
                    onClick={() => navigate(createPageUrl('BookingPage'))}
                    className="bg-white/20 hover:bg-white/30 text-white"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Book New Session
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {upcomingBookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 mb-4">No upcoming sessions</p>
                    <Button onClick={() => navigate(createPageUrl('BookingPage'))} className="bg-emerald-600">
                      Book a Session
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingBookings.map(booking => (
                      <div key={booking.id} className="p-4 bg-emerald-50 rounded-xl border-2 border-emerald-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-bold text-sm">{booking.service_name}</div>
                            <div className="text-xs text-slate-600 mt-1">
                              {new Date(booking.booking_date).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </div>
                            <div className="text-xs text-slate-600">
                              {booking.start_time} - {booking.end_time}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              Coach: {booking.coach_name}
                            </div>
                          </div>
                          <Badge className="bg-emerald-500 text-white">
                            {booking.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Button 
                  onClick={() => navigate(createPageUrl('MyBookings'))}
                  variant="outline"
                  className="w-full mt-4"
                >
                  View All Bookings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <Card className="border-none shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Communications
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-sm text-blue-900 mb-2">Contact Your Coach</h3>
                    <p className="text-sm text-slate-600 mb-3">
                      Use the communications system to send messages to your child's coaches
                    </p>
                    <Button 
                      onClick={() => navigate(createPageUrl('Communications'))}
                      className="bg-blue-600 hover:bg-blue-700 w-full"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Go to Messages
                    </Button>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h3 className="font-semibold text-sm text-purple-900 mb-2">Quick Actions</h3>
                    <div className="space-y-2">
                      <Button 
                        onClick={() => navigate(createPageUrl('Communications'))}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        Ask about progress
                      </Button>
                      <Button 
                        onClick={() => navigate(createPageUrl('Communications'))}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        Schedule a meeting
                      </Button>
                      <Button 
                        onClick={() => navigate(createPageUrl('Communications'))}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        Report an absence
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card className="border-none shadow-xl">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Billing & Payments
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-sm text-green-900 mb-2">Payment Information</h3>
                    <p className="text-sm text-slate-600 mb-3">
                      For billing inquiries and payment management, please contact your club administrator.
                    </p>
                    <div className="grid md:grid-cols-2 gap-3 mt-4">
                      <div className="p-3 bg-white rounded-lg">
                        <Label className="text-xs text-slate-600">Player Name</Label>
                        <p className="font-semibold text-sm">{activePlayer?.full_name}</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg">
                        <Label className="text-xs text-slate-600">Team</Label>
                        <p className="font-semibold text-sm">{playerTeam?.name}</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg">
                        <Label className="text-xs text-slate-600">Season</Label>
                        <p className="font-semibold text-sm">{playerTeam?.season || '2025/2026'}</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg">
                        <Label className="text-xs text-slate-600">League</Label>
                        <p className="font-semibold text-sm">{playerTeam?.league}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-sm text-blue-900 mb-2">Session Bookings</h3>
                    <p className="text-sm text-slate-600">
                      Individual coaching sessions are booked through the booking system
                    </p>
                    <Button 
                      onClick={() => navigate(createPageUrl('BookingPage'))}
                      className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
                    >
                      Book Training Session
                    </Button>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg border">
                    <h3 className="font-semibold text-sm mb-2">Contact Administration</h3>
                    <p className="text-sm text-slate-600 mb-3">
                      For billing questions, payment plans, or financial assistance:
                    </p>
                    <a 
                      href="mailto:billing@michiganjaguars.com"
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold"
                    >
                      billing@michiganjaguars.com
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}