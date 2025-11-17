import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Upload, TrendingUp, Users, Activity, BarChart3, Shield, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BulkImportDialog from '../components/import/BulkImportDialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function ClubManagement() {
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const queryClient = useQueryClient();

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

  const { data: unassignedEvaluations = [] } = useQuery({
    queryKey: ['unassignedEvaluations'],
    queryFn: () => base44.entities.UnassignedEvaluation.filter({ assigned: false })
  });

  const { data: unassignedAssessments = [] } = useQuery({
    queryKey: ['unassignedAssessments'],
    queryFn: () => base44.entities.UnassignedPhysicalAssessment.filter({ assigned: false })
  });

  const handleAutoSync = async () => {
    setSyncing(true);
    let syncedCount = 0;
    let deletedCount = 0;

    try {
      // Auto-assign unassigned evaluations
      for (const unassignedEval of unassignedEvaluations) {
        const player = players.find(p => 
          p.full_name?.toLowerCase() === unassignedEval.player_name?.toLowerCase()
        );
        
        if (player) {
          await base44.entities.Evaluation.create({
            player_id: player.id,
            evaluation_date: unassignedEval.date,
            evaluator_name: unassignedEval.evaluator,
            technical_skills: unassignedEval.technical_skills,
            tactical_awareness: unassignedEval.tactical_awareness,
            physical_attributes: unassignedEval.physical_attributes,
            mental_attributes: unassignedEval.mental_attributes,
            teamwork: unassignedEval.teamwork,
            overall_rating: unassignedEval.overall_rating,
            strengths: unassignedEval.strengths,
            areas_for_improvement: unassignedEval.areas_for_improvement,
            notes: unassignedEval.notes
          });
          
          await base44.entities.UnassignedEvaluation.update(unassignedEval.id, { assigned: true });
          syncedCount++;
        }
      }

      // Auto-assign unassigned assessments
      for (const unassignedAssess of unassignedAssessments) {
        const player = players.find(p => 
          p.full_name?.toLowerCase() === unassignedAssess.player_name?.toLowerCase()
        );
        
        if (player) {
          await base44.entities.PhysicalAssessment.create({
            player_id: player.id,
            assessment_date: unassignedAssess.assessment_date,
            speed: unassignedAssess.speed,
            agility: unassignedAssess.agility,
            power: unassignedAssess.power,
            endurance: unassignedAssess.endurance,
            sprint_time: unassignedAssess.sprint_time,
            vertical_jump: unassignedAssess.vertical_jump,
            cooper_test: unassignedAssess.cooper_test,
            assessor: unassignedAssess.team_name,
            notes: `Position: ${unassignedAssess.position || 'N/A'}`
          });
          
          await base44.entities.UnassignedPhysicalAssessment.update(unassignedAssess.id, { assigned: true });
          syncedCount++;
        }
      }

      // Remove duplicates in players
      const playersByName = {};
      for (const player of players) {
        const key = player.full_name?.toLowerCase();
        if (!playersByName[key]) {
          playersByName[key] = [];
        }
        playersByName[key].push(player);
      }

      for (const key in playersByName) {
        const duplicates = playersByName[key];
        if (duplicates.length > 1) {
          for (let i = 1; i < duplicates.length; i++) {
            await base44.entities.Player.delete(duplicates[i].id);
            deletedCount++;
          }
        }
      }

      // Remove duplicates in teams
      const teamsByName = {};
      for (const team of teams) {
        const key = team.name?.toLowerCase();
        if (!teamsByName[key]) {
          teamsByName[key] = [];
        }
        teamsByName[key].push(team);
      }

      for (const key in teamsByName) {
        const duplicates = teamsByName[key];
        if (duplicates.length > 1) {
          for (let i = 1; i < duplicates.length; i++) {
            await base44.entities.Team.delete(duplicates[i].id);
            deletedCount++;
          }
        }
      }

      queryClient.invalidateQueries();
      alert(`Auto-sync complete! Synced ${syncedCount} records and removed ${deletedCount} duplicates.`);
    } catch (error) {
      alert('Error during auto-sync: ' + error.message);
    }

    setSyncing(false);
    setShowSyncDialog(false);
  };

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
        <div className="flex gap-3">
          <Button onClick={() => setShowSyncDialog(true)} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Auto-Sync Data
          </Button>
          <Button onClick={() => setShowImportDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Import
          </Button>
        </div>
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
          <Link key={team.id} to={`${createPageUrl('TeamDetail')}?id=${team.id}`}>
            <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
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
          queryClient.invalidateQueries();
        }}
      />

      <AlertDialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Auto-Sync All Data</AlertDialogTitle>
            <AlertDialogDescription>
              This will automatically assign unassigned records by matching names and remove duplicate players and teams. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAutoSync} disabled={syncing} className="bg-emerald-600 hover:bg-emerald-700">
              {syncing ? 'Syncing...' : 'Start Auto-Sync'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}