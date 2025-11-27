import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Upload, TrendingUp, Users, Activity, BarChart3, Shield, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  const [showDuplicatesDialog, setShowDuplicatesDialog] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [duplicateReport, setDuplicateReport] = useState(null);
  const [filterAgeGroup, setFilterAgeGroup] = useState('all');
  const [filterCoach, setFilterCoach] = useState('all');
  const [filterLeague, setFilterLeague] = useState('all');
  const [birthdayFrom, setBirthdayFrom] = useState('');
  const [birthdayTo, setBirthdayTo] = useState('');

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

  const findDuplicates = async () => {
    const duplicates = {
      players: [],
      teams: [],
      assessments: [],
      evaluations: []
    };

    // Find duplicate players
    const playersByName = {};
    for (const player of players) {
      const key = player.full_name?.toLowerCase().trim();
      if (key && key.length > 0) {
        if (!playersByName[key]) playersByName[key] = [];
        playersByName[key].push(player);
      }
    }
    for (const key in playersByName) {
      if (playersByName[key].length > 1) {
        duplicates.players.push({ name: key, count: playersByName[key].length, records: playersByName[key] });
      }
    }

    // Find duplicate teams
    const teamsByName = {};
    for (const team of teams) {
      const key = team.name?.toLowerCase().trim();
      if (key && key.length > 0) {
        if (!teamsByName[key]) teamsByName[key] = [];
        teamsByName[key].push(team);
      }
    }
    for (const key in teamsByName) {
      if (teamsByName[key].length > 1) {
        duplicates.teams.push({ name: key, count: teamsByName[key].length, records: teamsByName[key] });
      }
    }

    // Find duplicate assessments - by player name AND date
    const assessmentsByKey = {};
    for (const assessment of assessments) {
      const player = players.find(p => p.id === assessment.player_id);
      if (player) {
        const key = `${player.full_name?.toLowerCase().trim()}_${assessment.assessment_date}`;
        if (!assessmentsByKey[key]) assessmentsByKey[key] = [];
        assessmentsByKey[key].push({ ...assessment, playerName: player.full_name });
      }
    }
    for (const key in assessmentsByKey) {
      if (assessmentsByKey[key].length > 1) {
        duplicates.assessments.push({
          key,
          playerName: assessmentsByKey[key][0].playerName,
          date: assessmentsByKey[key][0].assessment_date,
          count: assessmentsByKey[key].length,
          records: assessmentsByKey[key]
        });
      }
    }

    // Find duplicate evaluations - by player name AND date
    const evaluationsByKey = {};
    for (const evaluation of evaluations) {
      const player = players.find(p => p.id === evaluation.player_id);
      if (player) {
        const key = `${player.full_name?.toLowerCase().trim()}_${evaluation.evaluation_date}`;
        if (!evaluationsByKey[key]) evaluationsByKey[key] = [];
        evaluationsByKey[key].push({ ...evaluation, playerName: player.full_name });
      }
    }
    for (const key in evaluationsByKey) {
      if (evaluationsByKey[key].length > 1) {
        duplicates.evaluations.push({
          key,
          playerName: evaluationsByKey[key][0].playerName,
          date: evaluationsByKey[key][0].evaluation_date,
          count: evaluationsByKey[key].length,
          records: evaluationsByKey[key]
        });
      }
    }

    setDuplicateReport(duplicates);
    setShowDuplicatesDialog(true);
  };

  const deleteDuplicates = async () => {
    if (!duplicateReport) return;

    let deletedCount = 0;

    try {
      for (const group of duplicateReport.players) {
        for (let i = 1; i < group.records.length; i++) {
          await base44.entities.Player.delete(group.records[i].id);
          deletedCount++;
        }
      }

      for (const group of duplicateReport.teams) {
        for (let i = 1; i < group.records.length; i++) {
          await base44.entities.Team.delete(group.records[i].id);
          deletedCount++;
        }
      }

      for (const group of duplicateReport.assessments) {
        for (let i = 1; i < group.records.length; i++) {
          await base44.entities.PhysicalAssessment.delete(group.records[i].id);
          deletedCount++;
        }
      }

      for (const group of duplicateReport.evaluations) {
        for (let i = 1; i < group.records.length; i++) {
          await base44.entities.Evaluation.delete(group.records[i].id);
          deletedCount++;
        }
      }

      queryClient.invalidateQueries();
      alert(`Deleted ${deletedCount} duplicate records!`);
    } catch (error) {
      alert('Error deleting duplicates: ' + error.message);
    } finally {
      setShowDuplicatesDialog(false);
      setDuplicateReport(null);
    }
  };

  const handleAutoSync = async () => {
    setSyncing(true);
    let syncedCount = 0;

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

      queryClient.invalidateQueries();
      alert(`Auto-sync complete! Synced ${syncedCount} records.`);
    } catch (error) {
      alert('Error during auto-sync: ' + error.message);
    }

    setSyncing(false);
    setShowSyncDialog(false);
  };

  const calculateOverallScore = (assessment) => {
    const speed = assessment.speed || 0;
    const agility = assessment.agility || 0;
    const power = assessment.power || 0;
    const endurance = assessment.endurance || 0;
    return Math.round(((5 * speed) + agility + (3 * power) + (6 * endurance)) / 60);
  };

  // Calculate team statistics
  const teamStats = teams.map(team => {
    const teamPlayers = players.filter(p => p.team_id === team.id);
    const teamPlayerIds = teamPlayers.map(p => p.id);
    const teamAssessments = assessments.filter(a => teamPlayerIds.includes(a.player_id));
    const teamEvaluations = evaluations.filter(e => teamPlayerIds.includes(e.player_id));

    const avgPhysical = teamAssessments.length > 0
      ? Math.round(
          teamAssessments.reduce((sum, a) => sum + calculateOverallScore(a), 0) / teamAssessments.length
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
          assessments.reduce((sum, a) => sum + calculateOverallScore(a), 0) / assessments.length
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
          <Button onClick={findDuplicates} variant="outline">
            <Trash2 className="w-4 h-4 mr-2" />
            Find Duplicates
          </Button>
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

      <Card className="mb-6 border-none shadow-lg">
        <CardHeader>
          <CardTitle>Filter Teams</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <Label className="mb-2 block">Age Group</Label>
              <Select value={filterAgeGroup} onValueChange={setFilterAgeGroup}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Age Groups</SelectItem>
                  {[...new Set(teams.map(t => t.age_group).filter(Boolean))].sort((a, b) => {
                    const extractAge = (ag) => {
                      const match = ag?.match(/U-?(\d+)/i);
                      return match ? parseInt(match[1]) : 0;
                    };
                    return extractAge(b) - extractAge(a);
                  }).map(ag => (
                    <SelectItem key={ag} value={ag}>{ag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Coach</Label>
              <Select value={filterCoach} onValueChange={setFilterCoach}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Coaches</SelectItem>
                  {coaches.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">League</Label>
              <Select value={filterLeague} onValueChange={setFilterLeague}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Leagues</SelectItem>
                  {[...new Set(teams.map(t => t.league).filter(Boolean))].map(league => (
                    <SelectItem key={league} value={league}>{league}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Birthday Range</Label>
              <div className="flex gap-2">
                <Input type="date" value={birthdayFrom} onChange={(e) => setBirthdayFrom(e.target.value)} placeholder="From" />
                <Input type="date" value={birthdayTo} onChange={(e) => setBirthdayTo(e.target.value)} placeholder="To" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {teamStats
          .filter(team => {
            if (filterAgeGroup !== 'all' && team.age_group !== filterAgeGroup) return false;
            if (filterLeague !== 'all' && team.league !== filterLeague) return false;
            if (filterCoach !== 'all') {
              const coach = coaches.find(c => c.id === filterCoach);
              if (!coach?.team_ids?.includes(team.id)) return false;
            }
            if (birthdayFrom || birthdayTo) {
              const teamPlayers = players.filter(p => p.team_id === team.id);
              return teamPlayers.some(p => {
                if (!p.date_of_birth) return false;
                const dob = new Date(p.date_of_birth);
                if (birthdayFrom && dob < new Date(birthdayFrom)) return false;
                if (birthdayTo && dob > new Date(birthdayTo)) return false;
                return true;
              });
            }
            return true;
          })
          .map(team => (
          <Link key={team.id} to={`${createPageUrl('TeamDashboard')}?teamId=${team.id}`}>
            <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-blue-50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-md">
                    {team.age_group || team.name.charAt(0)}
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
            <AlertDialogTitle>Auto-Sync Unassigned Data</AlertDialogTitle>
            <AlertDialogDescription>
              This will automatically assign unassigned evaluations and physical assessments by matching player names.
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

      <AlertDialog open={showDuplicatesDialog} onOpenChange={setShowDuplicatesDialog}>
        <AlertDialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicate Records Found</AlertDialogTitle>
            <AlertDialogDescription>
              Review the duplicate records below. Clicking "Delete Duplicates" will keep the first record and delete all others.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {duplicateReport && (
            <div className="space-y-4">
              {duplicateReport.players.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-red-600">Duplicate Players ({duplicateReport.players.length})</h3>
                  {duplicateReport.players.map((dup, i) => (
                    <div key={i} className="p-3 bg-red-50 rounded text-sm mb-2 border border-red-200">
                      <div className="font-medium">{dup.name}</div>
                      <div className="text-slate-600">{dup.count} duplicates found</div>
                    </div>
                  ))}
                </div>
              )}
              {duplicateReport.teams.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-red-600">Duplicate Teams ({duplicateReport.teams.length})</h3>
                  {duplicateReport.teams.map((dup, i) => (
                    <div key={i} className="p-3 bg-red-50 rounded text-sm mb-2 border border-red-200">
                      <div className="font-medium">{dup.name}</div>
                      <div className="text-slate-600">{dup.count} duplicates found</div>
                    </div>
                  ))}
                </div>
              )}
              {duplicateReport.assessments.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-red-600">Duplicate Assessments ({duplicateReport.assessments.length})</h3>
                  {duplicateReport.assessments.map((dup, i) => (
                    <div key={i} className="p-3 bg-red-50 rounded text-sm mb-2 border border-red-200">
                      <div className="font-medium">{dup.playerName}</div>
                      <div className="text-slate-600">
                        Date: {new Date(dup.date).toLocaleDateString()} - {dup.count} duplicates found
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {duplicateReport.evaluations.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-red-600">Duplicate Evaluations ({duplicateReport.evaluations.length})</h3>
                  {duplicateReport.evaluations.map((dup, i) => (
                    <div key={i} className="p-3 bg-red-50 rounded text-sm mb-2 border border-red-200">
                      <div className="font-medium">{dup.playerName}</div>
                      <div className="text-slate-600">
                        Date: {new Date(dup.date).toLocaleDateString()} - {dup.count} duplicates found
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {duplicateReport.players.length === 0 && duplicateReport.teams.length === 0 && duplicateReport.assessments.length === 0 && duplicateReport.evaluations.length === 0 && (
                <div className="text-center py-8 text-slate-500">No duplicates found!</div>
              )}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteDuplicates}
              disabled={!duplicateReport || (duplicateReport.players.length + duplicateReport.teams.length + duplicateReport.assessments.length + duplicateReport.evaluations.length === 0)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Duplicates
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}