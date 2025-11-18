import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Users, Activity, Calendar, TrendingUp, BarChart3, Award, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import TeamPerformanceAnalytics from '../components/team/TeamPerformanceAnalytics';

export default function TeamDashboard() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const teamId = urlParams.get('teamId');

  const { data: team } = useQuery({
    queryKey: ['team', teamId],
    queryFn: async () => {
      const teams = await base44.entities.Team.list();
      return teams.find(t => t.id === teamId);
    }
  });

  const { data: players = [] } = useQuery({
    queryKey: ['teamPlayers', teamId],
    queryFn: async () => {
      const all = await base44.entities.Player.list();
      return all.filter(p => p.team_id === teamId);
    }
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['teamAssessments', teamId],
    queryFn: async () => {
      const all = await base44.entities.PhysicalAssessment.list();
      return all.filter(a => a.team_id === teamId);
    }
  });

  const { data: events = [] } = useQuery({
    queryKey: ['teamEvents', teamId],
    queryFn: async () => {
      const all = await base44.entities.TeamEvent.list();
      return all.filter(e => e.team_id === teamId);
    }
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ['teamAnnouncements', teamId],
    queryFn: async () => {
      const all = await base44.entities.TeamAnnouncement.list('-created_date', 5);
      return all.filter(a => a.team_id === teamId);
    }
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const teamCoaches = coaches.filter(c => c.team_ids?.includes(teamId));

  const upcomingEvents = events
    .filter(e => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  const positionBreakdown = players.reduce((acc, p) => {
    acc[p.position] = (acc[p.position] || 0) + 1;
    return acc;
  }, {});

  const positionData = Object.entries(positionBreakdown).map(([position, count]) => ({
    position,
    count
  }));

  const performanceTrend = assessments
    .sort((a, b) => new Date(a.assessment_date) - new Date(b.assessment_date))
    .slice(-10)
    .map(a => ({
      date: new Date(a.assessment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      overall: a.overall_score || 0
    }));

  const topPerformers = players
    .map(p => {
      const playerAssessments = assessments.filter(a => a.player_id === p.id);
      const latest = playerAssessments.sort((a, b) => new Date(b.assessment_date) - new Date(a.assessment_date))[0];
      return {
        ...p,
        latestScore: latest?.overall_score || 0
      };
    })
    .sort((a, b) => b.latestScore - a.latestScore)
    .slice(0, 5);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Teams
      </Button>

      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
            style={{ backgroundColor: team?.team_color || '#22c55e' }}
          >
            {team?.name?.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{team?.name}</h1>
            <p className="text-slate-600">{team?.age_group} • {team?.league}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Players</div>
                <div className="text-3xl font-bold text-slate-900">{players.length}</div>
              </div>
              <Users className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Coaches</div>
                <div className="text-3xl font-bold text-slate-900">{teamCoaches.length}</div>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Assessments</div>
                <div className="text-3xl font-bold text-slate-900">{assessments.length}</div>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Upcoming Events</div>
                <div className="text-3xl font-bold text-slate-900">{upcomingEvents.length}</div>
              </div>
              <Calendar className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="roster" className="w-full">
        <TabsList>
          <TabsTrigger value="roster">Roster</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
        </TabsList>

        <TabsContent value="roster" className="mt-6 space-y-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Team Roster</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {players.map(player => (
                  <button
                    key={player.id}
                    onClick={() => navigate(`${createPageUrl('PlayerProfile')}?id=${player.id}`)}
                    className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all text-left border-2 border-transparent hover:border-emerald-500"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                        {player.jersey_number || player.full_name?.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900">{player.full_name}</div>
                        <div className="text-sm text-slate-600">{player.position}</div>
                      </div>
                    </div>
                    <Badge className={player.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>
                      {player.status}
                    </Badge>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Position Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={positionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="position" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-600" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topPerformers.map((player, idx) => (
                    <div key={player.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{player.full_name}</div>
                          <div className="text-xs text-slate-600">{player.position}</div>
                        </div>
                      </div>
                      <div className="text-xl font-bold text-emerald-600">{player.latestScore}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <TeamPerformanceAnalytics teamId={teamId} teamName={team?.name} />
        </TabsContent>

        <TabsContent value="schedule" className="mt-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No upcoming events</p>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map(event => (
                    <div key={event.id} className="p-4 bg-slate-50 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold text-slate-900">{event.title}</div>
                          <div className="text-sm text-slate-600">{event.description}</div>
                        </div>
                        <Badge>{event.event_type}</Badge>
                      </div>
                      <div className="text-sm text-slate-600">
                        {new Date(event.date).toLocaleDateString()} • {event.start_time} - {event.end_time}
                      </div>
                      {event.location && (
                        <div className="text-sm text-slate-500 mt-1">📍 {event.location}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {performanceTrend.length > 0 && (
            <Card className="border-none shadow-lg mt-6">
              <CardHeader>
                <CardTitle>Performance Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={performanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="overall" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="announcements" className="mt-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-emerald-600" />
                Recent Announcements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {announcements.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No announcements</p>
              ) : (
                <div className="space-y-4">
                  {announcements.map(announcement => (
                    <div key={announcement.id} className="p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-slate-900">{announcement.title}</h3>
                        <Badge className={announcement.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-700'}>
                          {announcement.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-700 mb-2">{announcement.message}</p>
                      <div className="text-xs text-slate-500">
                        {new Date(announcement.created_date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}