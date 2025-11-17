import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, TrendingUp, Activity, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function TeamDashboard() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const teamId = urlParams.get('id');

  const { data: team } = useQuery({
    queryKey: ['team', teamId],
    queryFn: async () => {
      const teams = await base44.entities.Team.list();
      return teams.find(t => t.id === teamId);
    },
    enabled: !!teamId
  });

  const { data: players = [] } = useQuery({
    queryKey: ['teamPlayers', teamId],
    queryFn: () => base44.entities.Player.filter({ team_id: teamId })
  });

  const { data: allAssessments = [] } = useQuery({
    queryKey: ['allAssessments'],
    queryFn: () => base44.entities.PhysicalAssessment.list()
  });

  const { data: allEvaluations = [] } = useQuery({
    queryKey: ['allEvaluations'],
    queryFn: () => base44.entities.Evaluation.list()
  });

  const { data: allTeams = [] } = useQuery({
    queryKey: ['allTeams'],
    queryFn: () => base44.entities.Team.list()
  });

  const { data: allPlayers = [] } = useQuery({
    queryKey: ['allPlayers'],
    queryFn: () => base44.entities.Player.list()
  });

  if (!team) return null;

  const playerIds = players.map(p => p.id);
  const teamAssessments = allAssessments.filter(a => playerIds.includes(a.player_id));
  const teamEvaluations = allEvaluations.filter(e => playerIds.includes(e.player_id));

  // Calculate team averages
  const calculateTeamAverages = () => {
    if (teamAssessments.length === 0) return { speed: 0, agility: 0, power: 0, endurance: 0 };
    
    const totals = teamAssessments.reduce((acc, a) => ({
      speed: acc.speed + (a.speed || 0),
      agility: acc.agility + (a.agility || 0),
      power: acc.power + (a.power || 0),
      endurance: acc.endurance + (a.endurance || 0)
    }), { speed: 0, agility: 0, power: 0, endurance: 0 });
    
    return {
      speed: Math.round(totals.speed / teamAssessments.length),
      agility: Math.round(totals.agility / teamAssessments.length),
      power: Math.round(totals.power / teamAssessments.length),
      endurance: Math.round(totals.endurance / teamAssessments.length)
    };
  };

  const teamAverages = calculateTeamAverages();

  // Top performers
  const topPerformers = players.map(player => {
    const playerAssessments = allAssessments.filter(a => a.player_id === player.id);
    const latestAssessment = playerAssessments[0];
    
    if (!latestAssessment) return { ...player, overall: 0 };
    
    const overall = Math.round(
      (latestAssessment.speed + latestAssessment.agility + 
       latestAssessment.power + latestAssessment.endurance) / 4
    );
    
    return { ...player, overall };
  }).sort((a, b) => b.overall - a.overall).slice(0, 5);

  // Comparison with other teams in same age group
  const sameAgeTeams = allTeams.filter(t => t.age_group === team.age_group && t.id !== team.id);
  
  const comparisonData = [team, ...sameAgeTeams].map(t => {
    const tPlayers = allPlayers.filter(p => p.team_id === t.id);
    const tPlayerIds = tPlayers.map(p => p.id);
    const tAssessments = allAssessments.filter(a => tPlayerIds.includes(a.player_id));
    
    if (tAssessments.length === 0) {
      return { name: t.name, speed: 0, agility: 0, power: 0, endurance: 0 };
    }
    
    const totals = tAssessments.reduce((acc, a) => ({
      speed: acc.speed + (a.speed || 0),
      agility: acc.agility + (a.agility || 0),
      power: acc.power + (a.power || 0),
      endurance: acc.endurance + (a.endurance || 0)
    }), { speed: 0, agility: 0, power: 0, endurance: 0 });
    
    return {
      name: t.name.substring(0, 10),
      speed: Math.round(totals.speed / tAssessments.length),
      agility: Math.round(totals.agility / tAssessments.length),
      power: Math.round(totals.power / tAssessments.length),
      endurance: Math.round(totals.endurance / tAssessments.length)
    };
  });

  // Evaluation averages
  const evalAvg = teamEvaluations.length > 0 ? {
    technical: Math.round(teamEvaluations.reduce((sum, e) => sum + (e.technical_skills || 0), 0) / teamEvaluations.length),
    tactical: Math.round(teamEvaluations.reduce((sum, e) => sum + (e.tactical_awareness || 0), 0) / teamEvaluations.length),
    physical: Math.round(teamEvaluations.reduce((sum, e) => sum + (e.physical_attributes || 0), 0) / teamEvaluations.length),
    mental: Math.round(teamEvaluations.reduce((sum, e) => sum + (e.mental_attributes || 0), 0) / teamEvaluations.length),
    overall: Math.round(teamEvaluations.reduce((sum, e) => sum + (e.overall_rating || 0), 0) / teamEvaluations.length)
  } : null;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
            style={{ backgroundColor: team.team_color }}
          >
            {team.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{team.name}</h1>
            <p className="text-slate-600">{team.age_group} • {team.division}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Total Players</div>
                <div className="text-3xl font-bold text-slate-900 mt-1">{players.length}</div>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Assessments</div>
                <div className="text-3xl font-bold text-slate-900 mt-1">{teamAssessments.length}</div>
              </div>
              <Activity className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Evaluations</div>
                <div className="text-3xl font-bold text-slate-900 mt-1">{teamEvaluations.length}</div>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Avg Performance</div>
                <div className="text-3xl font-bold text-slate-900 mt-1">
                  {Math.round((teamAverages.speed + teamAverages.agility + teamAverages.power + teamAverages.endurance) / 4)}
                </div>
              </div>
              <Award className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Team Physical Attributes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-red-50 rounded-xl">
                <div className="text-sm text-red-600 mb-1">Speed</div>
                <div className="text-3xl font-bold text-red-700">{teamAverages.speed}</div>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl">
                <div className="text-sm text-emerald-600 mb-1">Agility</div>
                <div className="text-3xl font-bold text-emerald-700">{teamAverages.agility}</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl">
                <div className="text-sm text-blue-600 mb-1">Power</div>
                <div className="text-3xl font-bold text-blue-700">{teamAverages.power}</div>
              </div>
              <div className="p-4 bg-pink-50 rounded-xl">
                <div className="text-sm text-pink-600 mb-1">Endurance</div>
                <div className="text-3xl font-bold text-pink-700">{teamAverages.endurance}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {evalAvg && (
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Team Skills Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: 'Technical Skills', value: evalAvg.technical, color: 'bg-blue-500' },
                  { label: 'Tactical Awareness', value: evalAvg.tactical, color: 'bg-emerald-500' },
                  { label: 'Physical Attributes', value: evalAvg.physical, color: 'bg-purple-500' },
                  { label: 'Mental Attributes', value: evalAvg.mental, color: 'bg-orange-500' },
                  { label: 'Overall Rating', value: evalAvg.overall, color: 'bg-slate-700' }
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{item.label}</span>
                      <span className="font-semibold">{item.value}/10</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${item.color}`}
                        style={{ width: `${(item.value / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="border-none shadow-lg mb-6">
        <CardHeader>
          <CardTitle>Comparison with {team.age_group} Teams</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" style={{ fontSize: '12px' }} />
              <YAxis style={{ fontSize: '12px' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="speed" name="Speed" fill="#ef4444" />
              <Bar dataKey="agility" name="Agility" fill="#22c55e" />
              <Bar dataKey="power" name="Power" fill="#3b82f6" />
              <Bar dataKey="endurance" name="Endurance" fill="#ec4899" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topPerformers.map((player, idx) => (
              <Link key={player.id} to={`${createPageUrl('PlayerProfile')}?id=${player.id}`}>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{player.full_name}</div>
                      <div className="text-sm text-slate-600">{player.position}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-600">{player.overall}</div>
                    <div className="text-xs text-slate-500">Overall</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}