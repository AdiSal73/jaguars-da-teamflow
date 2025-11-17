import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, TrendingUp, Activity, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import TeamStrengthsHeatmap from '../components/analytics/TeamStrengthsHeatmap';
import TeamTrendChart from '../components/analytics/TeamTrendChart';

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
    queryFn: () => base44.entities.PhysicalAssessment.list('-assessment_date')
  });

  const { data: allEvaluations = [] } = useQuery({
    queryKey: ['allEvaluations'],
    queryFn: () => base44.entities.Evaluation.list('-evaluation_date')
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

  // Team performance trends over time
  const assessmentsByMonth = {};
  teamAssessments.forEach(a => {
    const month = new Date(a.assessment_date).toLocaleString('default', { month: 'short' });
    if (!assessmentsByMonth[month]) {
      assessmentsByMonth[month] = { speed: [], agility: [], power: [], endurance: [] };
    }
    assessmentsByMonth[month].speed.push(a.speed || 0);
    assessmentsByMonth[month].agility.push(a.agility || 0);
    assessmentsByMonth[month].power.push(a.power || 0);
    assessmentsByMonth[month].endurance.push(a.endurance || 0);
  });

  const trendData = Object.keys(assessmentsByMonth).map(month => {
    const data = assessmentsByMonth[month];
    return {
      month,
      speed: Math.round(data.speed.reduce((a, b) => a + b, 0) / data.speed.length),
      agility: Math.round(data.agility.reduce((a, b) => a + b, 0) / data.agility.length),
      power: Math.round(data.power.reduce((a, b) => a + b, 0) / data.power.length),
      endurance: Math.round(data.endurance.reduce((a, b) => a + b, 0) / data.endurance.length)
    };
  }).map(d => ({ ...d, overall: Math.round((d.speed + d.agility + d.power + d.endurance) / 4) }));

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

  // Comparison with club average
  const clubAssessments = allAssessments;
  const clubTotals = clubAssessments.reduce((acc, a) => ({
    speed: acc.speed + (a.speed || 0),
    agility: acc.agility + (a.agility || 0),
    power: acc.power + (a.power || 0),
    endurance: acc.endurance + (a.endurance || 0)
  }), { speed: 0, agility: 0, power: 0, endurance: 0 });
  
  const clubAverage = clubAssessments.length > 0 ? {
    speed: Math.round(clubTotals.speed / clubAssessments.length),
    agility: Math.round(clubTotals.agility / clubAssessments.length),
    power: Math.round(clubTotals.power / clubAssessments.length),
    endurance: Math.round(clubTotals.endurance / clubAssessments.length)
  } : { speed: 0, agility: 0, power: 0, endurance: 0 };

  const comparisonData = [
    { name: 'Team', ...teamAverages },
    { name: 'Club Avg', ...clubAverage }
  ];

  // Evaluation averages for heatmap
  const evalAvg = teamEvaluations.length > 0 ? {
    technical: teamEvaluations.reduce((sum, e) => sum + (e.technical_skills || 0), 0) / teamEvaluations.length,
    tactical: teamEvaluations.reduce((sum, e) => sum + (e.tactical_awareness || 0), 0) / teamEvaluations.length,
    physical: teamEvaluations.reduce((sum, e) => sum + (e.physical_attributes || 0), 0) / teamEvaluations.length,
    mental: teamEvaluations.reduce((sum, e) => sum + (e.mental_attributes || 0), 0) / teamEvaluations.length,
    teamwork: teamEvaluations.reduce((sum, e) => sum + (e.teamwork || 0), 0) / teamEvaluations.length
  } : { technical: 0, tactical: 0, physical: 0, mental: 0, teamwork: 0 };

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
        <TeamStrengthsHeatmap teamData={evalAvg} />

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
      </div>

      {trendData.length > 0 && (
        <Card className="border-none shadow-lg mb-6">
          <CardHeader>
            <CardTitle>Performance Trends Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <TeamTrendChart data={trendData} />
          </CardContent>
        </Card>
      )}

      <Card className="border-none shadow-lg mb-6">
        <CardHeader>
          <CardTitle>Team vs Club Average</CardTitle>
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