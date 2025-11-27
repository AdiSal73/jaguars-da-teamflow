import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Users, Activity, Calendar, BarChart3, Award, Megaphone, Edit2, Save, TrendingUp, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import TeamPerformanceAnalytics from '../components/team/TeamPerformanceAnalytics';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TeamDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const teamId = urlParams.get('teamId');

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editTeamForm, setEditTeamForm] = useState({
    name: '',
    age_group: '',
    league: '',
    season: '',
    head_coach_id: ''
  });

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

  React.useEffect(() => {
    if (team) {
      setEditTeamForm({
        name: team.name || '',
        age_group: team.age_group || '',
        league: team.league || '',
        season: team.season || '',
        head_coach_id: team.head_coach_id || ''
      });
    }
  }, [team]);

  const updateTeamMutation = useMutation({
    mutationFn: (updatedData) => base44.entities.Team.update(teamId, updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries(['team', teamId]);
      setShowEditDialog(false);
    }
  });

  const handleEditSubmit = () => {
    updateTeamMutation.mutate(editTeamForm);
  };

  const teamCoaches = coaches.filter(c => c.team_ids?.includes(teamId));

  // Calculate detailed team analytics
  const teamAnalytics = React.useMemo(() => {
    const playersWithAssessments = players.filter(p => 
      assessments.some(a => a.player_id === p.id)
    );
    
    const assessmentRate = players.length > 0 
      ? Math.round((playersWithAssessments.length / players.length) * 100)
      : 0;

    const activePlayers = players.filter(p => p.status === 'Active').length;
    const retentionRate = players.length > 0 
      ? Math.round((activePlayers / players.length) * 100)
      : 0;

    const avgPhysical = assessments.length > 0
      ? {
          speed: Math.round(assessments.reduce((sum, a) => sum + (a.speed_score || 0), 0) / assessments.length),
          power: Math.round(assessments.reduce((sum, a) => sum + (a.power_score || 0), 0) / assessments.length),
          endurance: Math.round(assessments.reduce((sum, a) => sum + (a.endurance_score || 0), 0) / assessments.length),
          agility: Math.round(assessments.reduce((sum, a) => sum + (a.agility_score || 0), 0) / assessments.length),
          overall: Math.round(assessments.reduce((sum, a) => sum + (a.overall_score || 0), 0) / assessments.length),
        }
      : { speed: 0, power: 0, endurance: 0, agility: 0, overall: 0 };

    return { assessmentRate, retentionRate, avgPhysical, activePlayers };
  }, [players, assessments]);

  const radarData = [
    { attribute: 'Speed', value: teamAnalytics.avgPhysical.speed, fullMark: 100 },
    { attribute: 'Power', value: teamAnalytics.avgPhysical.power, fullMark: 100 },
    { attribute: 'Endurance', value: teamAnalytics.avgPhysical.endurance, fullMark: 100 },
    { attribute: 'Agility', value: teamAnalytics.avgPhysical.agility, fullMark: 100 },
  ];

  const upcomingEvents = events
    .filter(e => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  const positionBreakdown = players.reduce((acc, p) => {
    acc[p.primary_position] = (acc[p.primary_position] || 0) + 1;
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
    .filter(Boolean)
    .sort((a, b) => b.latestScore - a.latestScore)
    .slice(0, 5);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 md:mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Teams
      </Button>

      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div 
            className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-white text-xl md:text-2xl font-bold"
            style={{ backgroundColor: team?.team_color || '#22c55e' }}
          >
            {team?.name?.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{team?.name}</h1>
              <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
                <Edit2 className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="hidden md:inline">Edit Team</span>
              </Button>
            </div>
            <p className="text-sm md:text-base text-slate-600">{team?.age_group} • {team?.league}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 md:gap-4 mb-6 md:mb-8">
        <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] md:text-xs text-slate-600">Players</div>
                <div className="text-lg md:text-2xl font-bold text-slate-900">{players.length}</div>
              </div>
              <Users className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] md:text-xs text-slate-600">Avg Score</div>
                <div className="text-lg md:text-2xl font-bold text-slate-900">{teamAnalytics.avgPhysical.overall}</div>
              </div>
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] md:text-xs text-slate-600">Assessment Rate</div>
                <div className="text-lg md:text-2xl font-bold text-slate-900">{teamAnalytics.assessmentRate}%</div>
              </div>
              <Target className="w-5 h-5 md:w-6 md:h-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] md:text-xs text-slate-600">Retention</div>
                <div className="text-lg md:text-2xl font-bold text-slate-900">{teamAnalytics.retentionRate}%</div>
              </div>
              <Activity className="w-5 h-5 md:w-6 md:h-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-pink-50 to-white">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] md:text-xs text-slate-600">Assessments</div>
                <div className="text-lg md:text-2xl font-bold text-slate-900">{assessments.length}</div>
              </div>
              <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-pink-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-cyan-50 to-white">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] md:text-xs text-slate-600">Events</div>
                <div className="text-lg md:text-2xl font-bold text-slate-900">{upcomingEvents.length}</div>
              </div>
              <Calendar className="w-5 h-5 md:w-6 md:h-6 text-cyan-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="roster" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="roster">Roster</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
        </TabsList>

        <TabsContent value="roster" className="mt-4 md:mt-6 space-y-4 md:space-y-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Team Roster</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {players.map(player => (
                  <button
                    key={player.id}
                    onClick={() => navigate(`${createPageUrl('PlayerProfile')}?id=${player.id}`)}
                    className="p-3 md:p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all text-left border-2 border-transparent hover:border-emerald-500"
                  >
                    <div className="flex items-center gap-2 md:gap-3 mb-2">
                      <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base">
                        {player.jersey_number || player.full_name?.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900 text-sm md:text-base">{player.full_name}</div>
                        <div className="text-xs text-slate-600">{player.primary_position}</div>
                      </div>
                    </div>
                    <Badge className={`text-[10px] ${player.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {player.status}
                    </Badge>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Position Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={positionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="position" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Award className="w-4 h-4 md:w-5 md:h-5 text-yellow-600" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="space-y-2 md:space-y-3">
                  {topPerformers.map((player, idx) => (
                    <div key={player.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-xs md:text-sm">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm md:text-base">{player.full_name}</div>
                          <div className="text-xs text-slate-600">{player.primary_position}</div>
                        </div>
                      </div>
                      <div className="text-lg md:text-xl font-bold text-emerald-600">{player.latestScore}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            </div>

            {/* Team Physical Profile */}
            <Card className="border-none shadow-lg mt-6">
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Team Physical Profile</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="attribute" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar 
                      name="Team Average" 
                      dataKey="value" 
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-red-50 rounded-xl text-center">
                    <p className="text-2xl md:text-3xl font-bold text-red-600">{teamAnalytics.avgPhysical.speed}</p>
                    <p className="text-xs text-slate-600 mt-1">Speed</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl text-center">
                    <p className="text-2xl md:text-3xl font-bold text-blue-600">{teamAnalytics.avgPhysical.power}</p>
                    <p className="text-xs text-slate-600 mt-1">Power</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-xl text-center">
                    <p className="text-2xl md:text-3xl font-bold text-emerald-600">{teamAnalytics.avgPhysical.endurance}</p>
                    <p className="text-xs text-slate-600 mt-1">Endurance</p>
                  </div>
                  <div className="p-4 bg-pink-50 rounded-xl text-center">
                    <p className="text-2xl md:text-3xl font-bold text-pink-600">{teamAnalytics.avgPhysical.agility}</p>
                    <p className="text-xs text-slate-600 mt-1">Agility</p>
                  </div>
                </div>
              </div>
            </CardContent>
            </Card>
            </TabsContent>

        <TabsContent value="performance" className="mt-4 md:mt-6">
          <TeamPerformanceAnalytics teamId={teamId} teamName={team?.name} />
        </TabsContent>

        <TabsContent value="schedule" className="mt-4 md:mt-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Calendar className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {upcomingEvents.length === 0 ? (
                <p className="text-center text-slate-500 py-6 md:py-8 text-sm">No upcoming events</p>
              ) : (
                <div className="space-y-2 md:space-y-3">
                  {upcomingEvents.map(event => (
                    <div key={event.id} className="p-3 bg-slate-50 rounded-xl">
                      <div className="flex justify-between items-start mb-1 md:mb-2">
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">{event.title}</div>
                          <div className="text-xs text-slate-600">{event.description}</div>
                        </div>
                        <Badge className="text-[10px]">{event.event_type}</Badge>
                      </div>
                      <div className="text-xs text-slate-600">
                        {new Date(event.date).toLocaleDateString()} • {event.start_time} - {event.end_time}
                      </div>
                      {event.location && (
                        <div className="text-xs text-slate-500 mt-1">📍 {event.location}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {performanceTrend.length > 0 && (
            <Card className="border-none shadow-lg mt-4 md:mt-6">
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Performance Trend</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={performanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="overall" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="announcements" className="mt-4 md:mt-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Megaphone className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
                Recent Announcements
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {announcements.length === 0 ? (
                <p className="text-center text-slate-500 py-6 md:py-8 text-sm">No announcements</p>
              ) : (
                <div className="space-y-2 md:space-y-3">
                  {announcements.map(announcement => (
                    <div key={announcement.id} className="p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-start justify-between mb-1 md:mb-2">
                        <h3 className="font-semibold text-slate-900 text-sm">{announcement.title}</h3>
                        <Badge className={`text-[10px] ${announcement.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-700'}`}>
                          {announcement.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-700 mb-1 md:mb-2">{announcement.message}</p>
                      <div className="text-[10px] text-slate-500">
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

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
          </DialogHeader>
          {team && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="teamName" className="mb-2 block">Team Name</Label>
                <Input
                  id="teamName"
                  value={editTeamForm.name}
                  onChange={(e) => setEditTeamForm({ ...editTeamForm, name: e.target.value })}
                  className="h-10"
                />
              </div>
              <div>
                <Label htmlFor="ageGroup" className="mb-2 block">Age Group</Label>
                <Input
                  id="ageGroup"
                  value={editTeamForm.age_group}
                  onChange={(e) => setEditTeamForm({ ...editTeamForm, age_group: e.target.value })}
                  className="h-10"
                />
              </div>
              <div>
                <Label htmlFor="league" className="mb-2 block">League</Label>
                <Input
                  id="league"
                  value={editTeamForm.league}
                  onChange={(e) => setEditTeamForm({ ...editTeamForm, league: e.target.value })}
                  className="h-10"
                />
              </div>
              <div>
                <Label htmlFor="season" className="mb-2 block">Season</Label>
                <Input
                  id="season"
                  value={editTeamForm.season}
                  onChange={(e) => setEditTeamForm({ ...editTeamForm, season: e.target.value })}
                  className="h-10"
                />
              </div>
              <div>
                <Label htmlFor="headCoach" className="mb-2 block">Head Coach</Label>
                <Select
                  value={editTeamForm.head_coach_id || ''}
                  onValueChange={(value) => setEditTeamForm({ ...editTeamForm, head_coach_id: value })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select a coach" />
                  </SelectTrigger>
                  <SelectContent>
                    {coaches.map(coach => (
                      <SelectItem key={coach.id} value={coach.id}>{coach.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleEditSubmit} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}