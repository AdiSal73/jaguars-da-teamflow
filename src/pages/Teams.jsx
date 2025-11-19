import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Plus, Users, User, Edit, Trash2, BarChart3, Scan } from 'lucide-react';
import TeamPerformanceAnalytics from '../components/team/TeamPerformanceAnalytics';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import CoachSelector from '../components/team/CoachSelector';

export default function Teams() {
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [deleteTeamId, setDeleteTeamId] = useState(null);
  const [viewAnalyticsTeam, setViewAnalyticsTeam] = useState(null);
  const [teamForm, setTeamForm] = useState({
    name: '',
    age_group: '',
    league: '',
    season: '',
    team_color: '#22c55e',
    coach_ids: []
  });

  const queryClient = useQueryClient();

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list('-created_date')
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const createTeamMutation = useMutation({
    mutationFn: (data) => base44.entities.Team.create(data),
    onSuccess: async (newTeam) => {
      for (const coachId of teamForm.coach_ids) {
        const coach = coaches.find(c => c.id === coachId);
        if (coach) {
          const updatedTeamIds = [...(coach.team_ids || []), newTeam.id];
          await base44.entities.Coach.update(coachId, { team_ids: updatedTeamIds });
        }
      }
      queryClient.invalidateQueries(['teams']);
      queryClient.invalidateQueries(['coaches']);
      setShowDialog(false);
      resetForm();
    }
  });

  const updateTeamMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Team.update(id, data),
    onSuccess: async () => {
      for (const coach of coaches) {
        const shouldHaveTeam = teamForm.coach_ids.includes(coach.id);
        const hasTeam = coach.team_ids?.includes(editingTeam.id);
        
        if (shouldHaveTeam && !hasTeam) {
          await base44.entities.Coach.update(coach.id, { 
            team_ids: [...(coach.team_ids || []), editingTeam.id] 
          });
        } else if (!shouldHaveTeam && hasTeam) {
          await base44.entities.Coach.update(coach.id, { 
            team_ids: coach.team_ids.filter(tid => tid !== editingTeam.id) 
          });
        }
      }
      queryClient.invalidateQueries(['teams']);
      queryClient.invalidateQueries(['coaches']);
      setShowDialog(false);
      setEditingTeam(null);
      resetForm();
    }
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (id) => base44.entities.Team.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['teams']);
      setDeleteTeamId(null);
    }
  });

  const scanAndCreateTeams = async () => {
    const uniqueTeamNames = [...new Set(players.map(p => p.team_id).filter(Boolean))];
    const existingTeamIds = teams.map(t => t.id);
    
    let createdCount = 0;
    for (const teamId of uniqueTeamNames) {
      if (!existingTeamIds.includes(teamId)) {
        const teamPlayers = players.filter(p => p.team_id === teamId);
        if (teamPlayers.length > 0) {
          const firstPlayer = teamPlayers[0];
          const teamName = firstPlayer.team_id;
          
          const ageMatch = teamName.match(/U-?(\d+)/i);
          const ageGroup = ageMatch ? `U-${ageMatch[1]}` : 'Senior';
          
          await base44.entities.Team.create({
            name: teamName,
            age_group: ageGroup,
            league: '',
            coach_ids: []
          });
          createdCount++;
        }
      }
    }
    
    queryClient.invalidateQueries(['teams']);
    alert(`Created ${createdCount} new teams from player data!`);
  };

  const resetForm = () => {
    setTeamForm({
      name: '',
      age_group: '',
      league: '',
      season: '',
      coach_ids: []
    });
  };

  const handleEdit = (team) => {
    setEditingTeam(team);
    const assignedCoaches = coaches.filter(c => c.team_ids?.includes(team.id)).map(c => c.id);
    setTeamForm({
      name: team.name || '',
      age_group: team.age_group || '',
      league: team.league || '',
      season: team.season || '',
      coach_ids: assignedCoaches
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (editingTeam) {
      updateTeamMutation.mutate({ id: editingTeam.id, data: teamForm });
    } else {
      createTeamMutation.mutate(teamForm);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Teams Management</h1>
          <p className="text-slate-600 mt-1">Manage teams and assign coaches</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate(createPageUrl('TeamsTable'))} variant="outline">
            View Table
          </Button>
          <Button onClick={scanAndCreateTeams} variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
            <Scan className="w-4 h-4 mr-2" />
            Scan & Create Teams
          </Button>
          <Button onClick={() => { setEditingTeam(null); resetForm(); setShowDialog(true); }} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Team
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map(team => {
          const teamPlayers = players.filter(p => p.team_id === team.id);
          const teamCoaches = coaches.filter(c => c.team_ids?.includes(team.id));

          return (
            <Card key={team.id} className="border-none shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer"
              onClick={() => navigate(`${createPageUrl('TeamDashboard')}?teamId=${team.id}`)}
            >
                <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-blue-50">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                      {team.age_group || team.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="text-lg">{team.name}</div>
                      <div className="text-sm font-normal text-slate-600">{team.age_group}</div>
                    </div>
                  </CardTitle>
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(team); }} className="bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteTeamId(team.id); }} className="bg-white shadow-sm hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {team.league && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">League:</span>
                      <span className="font-medium text-slate-900">{team.league}</span>
                    </div>
                  )}
                  {team.season && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Season:</span>
                      <span className="font-medium text-slate-900">{team.season}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Players:</span>
                    <span className="font-medium text-slate-900 flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {teamPlayers.length}
                    </span>
                  </div>
                  {teamCoaches.length > 0 && (
                    <div className="pt-3 border-t border-slate-100">
                      <div className="text-xs text-slate-600 mb-2">Assigned Coaches:</div>
                      {teamCoaches.map(coach => (
                        <div key={coach.id} className="flex items-center gap-2 text-sm mb-1">
                          <User className="w-3 h-3 text-emerald-600" />
                          <span className="text-slate-700">{coach.full_name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {teams.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">No teams yet. Create your first team to get started.</p>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <div className="w-2 h-8 bg-gradient-to-b from-emerald-500 to-blue-500 rounded-full" />
              {editingTeam ? 'Edit Team' : 'Create New Team'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-6">
            <div>
              <Label className="font-semibold text-slate-700">Team Name *</Label>
              <Input
                value={teamForm.name}
                onChange={(e) => setTeamForm({...teamForm, name: e.target.value})}
                placeholder="e.g., Elite Squad"
                className="border-2 h-12 mt-2"
              />
            </div>
            <div>
              <Label className="font-semibold text-slate-700">Age Group *</Label>
              <Input
                value={teamForm.age_group}
                onChange={(e) => setTeamForm({...teamForm, age_group: e.target.value})}
                placeholder="e.g., U-15, U-18, Senior"
                className="border-2 h-12 mt-2"
              />
            </div>
            <div>
              <Label className="font-semibold text-slate-700">League</Label>
              <Input
                value={teamForm.league}
                onChange={(e) => setTeamForm({...teamForm, league: e.target.value})}
                placeholder="e.g., Premier League"
                className="border-2 h-12 mt-2"
              />
            </div>
            <div>
              <Label className="font-semibold text-slate-700">Season</Label>
              <Input
                value={teamForm.season}
                onChange={(e) => setTeamForm({...teamForm, season: e.target.value})}
                placeholder="e.g., 2024/2025"
                className="border-2 h-12 mt-2"
              />
            </div>
            <div>
              <Label className="mb-3 block">Assign Coaches</Label>
              <CoachSelector 
                coaches={coaches}
                selectedCoachIds={teamForm.coach_ids}
                onCoachesChange={(ids) => setTeamForm({...teamForm, coach_ids: ids})}
              />
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
            <Button variant="outline" onClick={() => { setShowDialog(false); setEditingTeam(null); resetForm(); }} className="h-12 px-8">
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!teamForm.name || !teamForm.age_group}
              className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 h-12 px-8 text-base font-semibold shadow-lg"
            >
              {editingTeam ? 'Update Team' : 'Create Team'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTeamId} onOpenChange={() => setDeleteTeamId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this team. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTeamMutation.mutate(deleteTeamId)} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!viewAnalyticsTeam} onOpenChange={() => setViewAnalyticsTeam(null)}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Team Performance Analytics - {viewAnalyticsTeam?.name}</DialogTitle>
          </DialogHeader>
          {viewAnalyticsTeam && (
            <TeamPerformanceAnalytics teamId={viewAnalyticsTeam.id} teamName={viewAnalyticsTeam.name} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}