import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Upload, TrendingUp, Users, Activity, BarChart3, Shield, RefreshCw, Trash2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AutoSyncDialog from '../components/club/AutoSyncDialog';
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
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [showDuplicatesDialog, setShowDuplicatesDialog] = useState(false);
  const [duplicateReport, setDuplicateReport] = useState(null);
  const [filterAgeGroup, setFilterAgeGroup] = useState('all');
  const [filterCoach, setFilterCoach] = useState('all');
  const [filterClub, setFilterClub] = useState('all');
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

  const findDuplicates = async () => {
    const duplicates = {
      players: [],
      teams: [],
      assessments: [],
      evaluations: []
    };

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

    const teamsByName = {};
    for (const team of teams) {
      if (team.name && typeof team.name === 'string') {
        const key = team.name.toLowerCase().trim();
        if (key && key.length > 0) {
          if (!teamsByName[key]) teamsByName[key] = [];
          teamsByName[key].push(team);
        }
      }
    }
    for (const key in teamsByName) {
      if (teamsByName[key].length > 1) {
        duplicates.teams.push({ name: key, count: teamsByName[key].length, records: teamsByName[key] });
      }
    }

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

  const calculateOverallScore = (assessment) => {
    const speed = assessment.speed || 0;
    const agility = assessment.agility || 0;
    const power = assessment.power || 0;
    const endurance = assessment.endurance || 0;
    return Math.round(((5 * speed) + agility + (3 * power) + (6 * endurance)) / 60);
  };

  const teamStats = teams?.map(team => {
    const teamPlayers = players?.filter(p => p.team_id === team.id) || [];
    const teamPlayerIds = teamPlayers?.map(p => p.id) || [];
    const teamAssessments = assessments.filter(a => teamPlayerIds.includes(a.player_id));
    const teamEvaluations = evaluations.filter(e => teamPlayerIds.includes(e.player_id));

    const avgPhysical = teamAssessments.length > 0
      ? Math.round(teamAssessments.reduce((sum, a) => sum + (a.overall_score || calculateOverallScore(a)), 0) / teamAssessments.length)
      : 0;

    const avgRating = teamEvaluations.length > 0
      ? Math.round(teamEvaluations.reduce((sum, e) => sum + (e.overall_rating || 0), 0) / teamEvaluations.length)
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

  const clubStats = {
    totalPlayers: players.length,
    totalTeams: teams.length,
    totalCoaches: coaches.length,
    totalAssessments: assessments.length,
    totalEvaluations: evaluations.length,
    avgPhysical: assessments.length > 0
      ? Math.round(assessments.reduce((sum, a) => sum + (a.overall_score || calculateOverallScore(a)), 0) / assessments.length)
      : 0
  };

  const comparisonData = teamStats
    ?.filter(team => team.name && typeof team.name === 'string')
    ?.slice(0, 8)
    ?.map(team => ({
      name: team.name.substring(0, 10),
      players: team.playerCount,
      physical: team.avgPhysical,
      rating: team.avgRating
    }));

  const uniqueClubs = [...new Set(teams?.map(t => t.league).filter(Boolean) || [])];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-7 h-7 md:w-8 md:h-8 text-emerald-600" />
            Club Management
          </h1>
          <p className="text-sm md:text-base text-slate-600 mt-1">Comprehensive overview of your club's performance</p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3">
          <Button onClick={findDuplicates} variant="outline" size="sm" className="text-xs md:text-sm">
            <Trash2 className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            Find Duplicates
          </Button>
          <Button onClick={() => setShowSyncDialog(true)} variant="outline" size="sm" className="text-xs md:text-sm">
            <RefreshCw className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            Auto-Sync
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6 mb-6 md:mb-8">
        <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs md:text-sm text-slate-600">Teams</div>
                <div className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">{clubStats.totalTeams}</div>
              </div>
              <Shield className="w-6 h-6 md:w-8 md:h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs md:text-sm text-slate-600">Players</div>
                <div className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">{clubStats.totalPlayers}</div>
              </div>
              <Users className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs md:text-sm text-slate-600">Coaches</div>
                <div className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">{clubStats.totalCoaches}</div>
              </div>
              <Users className="w-6 h-6 md:w-8 md:h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs md:text-sm text-slate-600">Assessments</div>
                <div className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">{clubStats.totalAssessments}</div>
              </div>
              <Activity className="w-6 h-6 md:w-8 md:h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-pink-50 to-white col-span-2 md:col-span-1">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs md:text-sm text-slate-600">Avg Score</div>
                <div className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">{clubStats.avgPhysical}</div>
              </div>
              <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-pink-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-lg mb-6 md:mb-8">
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Team Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" style={{ fontSize: '10px' }} />
              <YAxis style={{ fontSize: '10px' }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="players" name="Players" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="physical" name="Avg Physical" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rating" name="Avg Rating" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="mb-6 border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Filter Teams</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div>
              <Label className="mb-2 block text-xs md:text-sm">Age Group</Label>
              <Select value={filterAgeGroup} onValueChange={setFilterAgeGroup}>
                <SelectTrigger className="h-9 md:h-10 text-xs md:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Age Groups</SelectItem>
                  {[...new Set(teams?.map(t => t.age_group).filter(Boolean) || [])].sort((a, b) => {
                    const extractAge = (ag) => {
                      const match = ag?.match(/U-?(\d+)/i);
                      return match ? parseInt(match[1]) : 0;
                    };
                    return extractAge(b) - extractAge(a);
                  })?.map(ag => (
                    <SelectItem key={ag} value={ag}>{ag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block text-xs md:text-sm">Coach</Label>
              <Select value={filterCoach} onValueChange={setFilterCoach}>
                <SelectTrigger className="h-9 md:h-10 text-xs md:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Coaches</SelectItem>
                  {coaches?.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block text-xs md:text-sm">Club</Label>
              <Select value={filterClub} onValueChange={setFilterClub}>
                <SelectTrigger className="h-9 md:h-10 text-xs md:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clubs</SelectItem>
                  {uniqueClubs?.map(club => (
                    <SelectItem key={club} value={club}>{club}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block text-xs md:text-sm">Birthday Range</Label>
              <div className="flex gap-2">
                <Input 
                  type="date" 
                  value={birthdayFrom} 
                  onChange={(e) => setBirthdayFrom(e.target.value)} 
                  className="h-9 md:h-10 text-xs"
                />
                <Input 
                  type="date" 
                  value={birthdayTo} 
                  onChange={(e) => setBirthdayTo(e.target.value)} 
                  className="h-9 md:h-10 text-xs"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {teamStats
          .filter(team => {
            if (filterAgeGroup !== 'all' && team.age_group !== filterAgeGroup) return false;
            if (filterClub !== 'all' && team.league !== filterClub) return false;
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
            <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-blue-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center text-white text-base md:text-xl font-bold shadow-md group-hover:scale-110 transition-transform">
                    {team.age_group || team.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm md:text-lg truncate">{team.name}</CardTitle>
                    <p className="text-xs md:text-sm text-slate-600">{team.age_group}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 md:pt-6 p-4">
                <div className="grid grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
                  <div className="text-center p-2 md:p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg md:text-2xl font-bold text-blue-600">{team.playerCount}</div>
                    <div className="text-[10px] md:text-xs text-slate-600 mt-1">Players</div>
                  </div>
                  <div className="text-center p-2 md:p-3 bg-emerald-50 rounded-lg">
                    <div className="text-lg md:text-2xl font-bold text-emerald-600">{team.avgPhysical}</div>
                    <div className="text-[10px] md:text-xs text-slate-600 mt-1">Avg Physical</div>
                  </div>
                </div>
                <div className="space-y-1 md:space-y-2 text-xs md:text-sm">
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
                <Button variant="outline" className="w-full mt-3 md:mt-4 text-xs md:text-sm h-8 md:h-9">
                  <BarChart3 className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                  View Dashboard
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <AutoSyncDialog
        open={showSyncDialog}
        onOpenChange={setShowSyncDialog}
        onComplete={() => {
          queryClient.invalidateQueries();
        }}
      />

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
                  {duplicateReport.assessments.slice(0, 5).map((dup, i) => (
                    <div key={i} className="p-3 bg-red-50 rounded text-sm mb-2 border border-red-200">
                      <div className="font-medium">{dup.playerName}</div>
                      <div className="text-slate-600">
                        Date: {new Date(dup.date).toLocaleDateString()} - {dup.count} duplicates found
                      </div>
                    </div>
                  ))}
                  {duplicateReport.assessments.length > 5 && (
                    <p className="text-sm text-slate-500">...and {duplicateReport.assessments.length - 5} more</p>
                  )}
                </div>
              )}
              {duplicateReport.evaluations.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-red-600">Duplicate Evaluations ({duplicateReport.evaluations.length})</h3>
                  {duplicateReport.evaluations.slice(0, 5).map((dup, i) => (
                    <div key={i} className="p-3 bg-red-50 rounded text-sm mb-2 border border-red-200">
                      <div className="font-medium">{dup.playerName}</div>
                      <div className="text-slate-600">
                        Date: {new Date(dup.date).toLocaleDateString()} - {dup.count} duplicates found
                      </div>
                    </div>
                  ))}
                  {duplicateReport.evaluations.length > 5 && (
                    <p className="text-sm text-slate-500">...and {duplicateReport.evaluations.length - 5} more</p>
                  )}
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