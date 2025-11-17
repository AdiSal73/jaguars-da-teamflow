import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Upload, TrendingUp, Users, Activity, BarChart3, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BulkImportDialog from '../components/import/BulkImportDialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ClubManagement() {
  const [showImportDialog, setShowImportDialog] = useState(false);

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => base44.entities.PhysicalAssessment.list()
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations'],
    queryFn: () => base44.entities.Evaluation.list()
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  // Calculate team statistics
  const teamStats = teams.map(team => {
    const teamPlayers = players.filter(p => p.team_id === team.id);
    const teamPlayerIds = teamPlayers.map(p => p.id);
    const teamAssessments = assessments.filter(a => teamPlayerIds.includes(a.player_id));
    const teamEvaluations = evaluations.filter(e => teamPlayerIds.includes(e.player_id));

    const avgPhysical = teamAssessments.length > 0
      ? Math.round(
          teamAssessments.reduce((sum, a) => 
            sum + ((a.speed + a.agility + a.power + a.endurance) / 4), 0
          ) / teamAssessments.length
        )
      : 0;

    const avgRating = teamEvaluations.length > 0
      ? Math.round(
          teamEvaluations.reduce((sum, e) => sum + (e.overall_rating || 0), 0) / teamEvaluations.length
        )
      : 0;

    return {
      ...team,
      playerCount: teamPlayers.length,
      assessmentCount: teamAssessments.length,
      evaluationCount: teamEvaluations.length,
      avgPhysical,
      avgRating
    };
  });

  // Club-wide statistics
  const clubStats = {
    totalPlayers: players.length,
    totalTeams: teams.length,
    totalCoaches: coaches.length,
    totalAssessments: assessments.length,
    totalEvaluations: evaluations.length,
    avgPhysical: assessments.length > 0
      ? Math.round(
          assessments.reduce((sum, a) => 
            sum + ((a.speed + a.agility + a.power + a.endurance) / 4), 0
          ) / assessments.length
        )
      : 0
  };

  // Team comparison data
  const comparisonData = teamStats.map(team => ({
    name: team.name.substring(0, 10),
    players: team.playerCount,
    physical: team.avgPhysical,
    rating: team.avgRating
  }));

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Club Management</h1>
          <p className="text-slate-600 mt-1">Comprehensive overview of your club's performance</p>
        </div>
        <Button onClick={() => setShowImportDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Upload className="w-4 h-4 mr-2" />
          Bulk Import
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Teams</div>
                <div className="text-3xl font-bold text-slate-900 mt-1">{clubStats.totalTeams}</div>
              </div>
              <Shield className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Players</div>
                <div className="text-3xl font-bold text-slate-900 mt-1">{clubStats.totalPlayers}</div>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Coaches</div>
                <div className="text-3xl font-bold text-slate-900 mt-1">{clubStats.totalCoaches}</div>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Assessments</div>
                <div className="text-3xl font-bold text-slate-900 mt-1">{clubStats.totalAssessments}</div>
              </div>
              <Activity className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Avg Score</div>
                <div className="text-3xl font-bold text-slate-900 mt-1">{clubStats.avgPhysical}</div>
              </div>
              <TrendingUp className="w-8 h-8 text-pink-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-lg mb-8">
        <CardHeader>
          <CardTitle>Team Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" style={{ fontSize: '12px' }} />
              <YAxis style={{ fontSize: '12px' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="players" name="Players" fill="#3b82f6" />
              <Bar dataKey="physical" name="Avg Physical" fill="#22c55e" />
              <Bar dataKey="rating" name="Avg Rating" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {teamStats.map(team => (
          <Link key={team.id} to={`${createPageUrl('TeamDashboard')}?id=${team.id}`}>
            <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="border-b border-slate-100" style={{ backgroundColor: `${team.team_color}20` }}>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
                    style={{ backgroundColor: team.team_color }}
                  >
                    {team.name.charAt(0)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                    <p className="text-sm text-slate-600">{team.age_group}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{team.playerCount}</div>
                    <div className="text-xs text-slate-600 mt-1">Players</div>
                  </div>
                  <div className="text-center p-3 bg-emerald-50 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-600">{team.avgPhysical}</div>
                    <div className="text-xs text-slate-600 mt-1">Avg Physical</div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Assessments:</span>
                    <span className="font-semibold">{team.assessmentCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Evaluations:</span>
                    <span className="font-semibold">{team.evaluationCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Avg Rating:</span>
                    <span className="font-semibold">{team.avgRating}/10</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Dashboard
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <BulkImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onSuccess={() => {
          // Refresh all data
          window.location.reload();
        }}
      />
    </div>
  );
}