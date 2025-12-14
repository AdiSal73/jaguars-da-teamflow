import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, TrendingUp, Trophy, Calendar, Grid3x3, Activity } from 'lucide-react';
import EventsTimeline from '../components/player/EventsTimeline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function PlayerProgressDashboard() {
  const urlParams = new URLSearchParams(window.location.search);
  const playerId = urlParams.get('id');

  const { data: player } = useQuery({
    queryKey: ['player', playerId],
    queryFn: async () => {
      const players = await base44.entities.Player.list();
      return players.find(p => p.id === playerId);
    },
    enabled: !!playerId
  });

  const { data: pathway } = useQuery({
    queryKey: ['pathway', playerId],
    queryFn: async () => {
      const pathways = await base44.entities.DevelopmentPathway.filter({ player_id: playerId });
      return pathways[0] || null;
    },
    enabled: !!playerId
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments', playerId],
    queryFn: () => base44.entities.PhysicalAssessment.filter({ player_id: playerId }, '-assessment_date'),
    enabled: !!playerId
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations', playerId],
    queryFn: () => base44.entities.Evaluation.filter({ player_id: playerId }, '-created_date'),
    enabled: !!playerId
  });

  if (!player) return <div className="p-8">Loading...</div>;

  const goals = player.goals || [];
  const completedGoals = goals.filter(g => g.completed).length;
  const completedModules = pathway?.training_modules?.filter(m => m.completed).length || 0;
  const totalModules = pathway?.training_modules?.length || 0;

  const physicalProgress = assessments.slice(0, 5).reverse().map(a => ({
    date: new Date(a.assessment_date).toLocaleDateString('en-US', { month: 'short' }),
    Speed: a.speed_score,
    Power: a.power_score,
    Endurance: a.endurance_score,
    Agility: a.agility_score
  }));

  const activeModules = pathway?.training_modules?.filter(m => {
    if (!m.start_date) return false;
    const start = new Date(m.start_date);
    const end = m.end_date ? new Date(m.end_date) : new Date(start.getTime() + (m.number_of_weeks || 4) * 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    return now >= start && now <= end;
  }) || [];

  return (
    <div className="p-4 md:p-8 max-w-[1800px] mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">{player.full_name}</h1>
        <p className="text-slate-600">Complete Development Overview</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardContent className="p-4">
            <div className="text-xs text-emerald-700 mb-1">Active Goals</div>
            <div className="text-3xl font-bold text-emerald-900">{goals.length - completedGoals}</div>
            <Progress value={goals.length > 0 ? (completedGoals / goals.length) * 100 : 0} className="h-1 mt-2" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="text-xs text-blue-700 mb-1">Training Modules</div>
            <div className="text-3xl font-bold text-blue-900">{completedModules}/{totalModules}</div>
            <Progress value={totalModules > 0 ? (completedModules / totalModules) * 100 : 0} className="h-1 mt-2" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="text-xs text-purple-700 mb-1">Skills Tracked</div>
            <div className="text-3xl font-bold text-purple-900">{pathway?.skill_matrix?.length || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg bg-gradient-to-br from-amber-50 to-amber-100">
          <CardContent className="p-4">
            <div className="text-xs text-amber-700 mb-1">Events Attended</div>
            <div className="text-3xl font-bold text-amber-900">{pathway?.events_camps?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="goals">Goals ({goals.length})</TabsTrigger>
          <TabsTrigger value="skills">Skill Matrix</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  Physical Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                {physicalProgress.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={physicalProgress}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="Speed" stroke="#ef4444" strokeWidth={2} />
                      <Line type="monotone" dataKey="Power" stroke="#3b82f6" strokeWidth={2} />
                      <Line type="monotone" dataKey="Endurance" stroke="#10b981" strokeWidth={2} />
                      <Line type="monotone" dataKey="Agility" stroke="#ec4899" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-slate-500 py-8">No assessment data</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Active Training
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeModules.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No active training modules</p>
                ) : (
                  <div className="space-y-2">
                    {activeModules.map(m => (
                      <div key={m.id} className="p-3 bg-emerald-50 rounded-lg border-l-4 border-l-emerald-500">
                        <div className="font-semibold text-sm">{m.title}</div>
                        <div className="flex gap-2 mt-1">
                          <Badge className="text-[9px]">{m.training_type}</Badge>
                          <Badge className="text-[9px]">{m.weekly_sessions}x/week</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="goals">
          <div className="grid md:grid-cols-2 gap-4">
            {goals.map(goal => (
              <Card key={goal.id} className="border-none shadow-lg">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-slate-900 mb-2">{goal.description}</h4>
                  <Badge className="text-[9px] mb-2">{goal.category}</Badge>
                  <Progress value={goal.progress} className="h-2 mb-1" />
                  <div className="text-xs text-slate-600">{goal.progress}% complete</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="skills">
          <div className="grid md:grid-cols-3 gap-4">
            {pathway?.skill_matrix?.map((skill, idx) => (
              <Card key={idx} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-sm mb-2">{skill.skill_name}</h4>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Current: {skill.current_rating}/10</span>
                    <span>Target: {skill.target_rating}/10</span>
                  </div>
                  <Progress value={(skill.current_rating / 10) * 100} className="h-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="training">
          <div className="space-y-4">
            {pathway?.training_modules?.map(module => (
              <Card key={module.id} className={module.completed ? 'bg-blue-50' : ''}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{module.title}</h4>
                      <p className="text-xs text-slate-600 mt-1">{module.description}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge className="text-[9px]">{module.training_type}</Badge>
                        <Badge className="text-[9px]">{module.weekly_sessions}x/week • {module.number_of_weeks}w</Badge>
                      </div>
                    </div>
                    {module.completed && <CheckCircle className="w-5 h-5 text-blue-600" />}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="events">
          <EventsTimeline 
            events={pathway?.events_camps || []} 
            onUpdate={() => {}}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}