import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Plus, Users, User, Edit, Trash2, BarChart3, Scan, Table, Grid, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import TeamAnalyticsCard from '../components/team/TeamAnalyticsCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CoachSelector from '../components/team/CoachSelector';

export default function Teams() {
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [deleteTeamId, setDeleteTeamId] = useState(null);
  const [viewAnalyticsTeam, setViewAnalyticsTeam] = useState(null);
  const [filterAgeGroup, setFilterAgeGroup] = useState('all');
  const [filterCoach, setFilterCoach] = useState('all');
  const [filterClub, setFilterClub] = useState('all');
  const [viewMode, setViewMode] = useState('cards');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
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

  const updateTeamFieldMutation = useMutation({
    mutationFn: ({ id, field, value }) => base44.entities.Team.update(id, { [field]: value }),
    onSuccess: () => {
      queryClient.invalidateQueries(['teams']);
    }
  });

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

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredTeams = useMemo(() => {
    let result = teams.filter(team => {
      if (filterAgeGroup !== 'all' && team.age_group !== filterAgeGroup) return false;
      if (filterClub !== 'all' && team.league !== filterClub) return false;
      if (filterCoach !== 'all') {
        const coach = coaches.find(c => c.id === filterCoach);
        if (!coach?.team_ids?.includes(team.id)) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      
      if (sortField === 'playerCount') {
        aVal = players.filter(p => p.team_id === a.id).length;
        bVal = players.filter(p => p.team_id === b.id).length;
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return result;
  }, [teams, filterAgeGroup, filterClub, filterCoach, coaches, sortField, sortDirection, players]);

  const uniqueClubs = [...new Set(teams.map(t => t.league).filter(Boolean))];

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
    return sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />;
  };

  return (
    <div className="p-4 md:p-8 max-w-[1800px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Teams Management</h1>
          <p className="text-sm md:text-base text-slate-600 mt-1">Manage teams and assign coaches</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => { setEditingTeam(null); resetForm(); setShowDialog(true); }} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Team
          </Button>
        </div>
      </div>

      <Card className="mb-6 border-none shadow-lg">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-end justify-between">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 flex-1">
              <div>
                <Label className="mb-2 block text-xs md:text-sm">Age Group</Label>
                <Select value={filterAgeGroup} onValueChange={setFilterAgeGroup}>
                  <SelectTrigger className="h-9 md:h-10 text-xs md:text-sm">
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
                <Label className="mb-2 block text-xs md:text-sm">Coach</Label>
                <Select value={filterCoach} onValueChange={setFilterCoach}>
                  <SelectTrigger className="h-9 md:h-10 text-xs md:text-sm">
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
                <Label className="mb-2 block text-xs md:text-sm">Club</Label>
                <Select value={filterClub} onValueChange={setFilterClub}>
                  <SelectTrigger className="h-9 md:h-10 text-xs md:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clubs</SelectItem>
                    {uniqueClubs.map(club => (
                      <SelectItem key={club} value={club}>{club}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className={viewMode === 'cards' ? 'bg-emerald-600' : ''}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
                className={viewMode === 'table' ? 'bg-emerald-600' : ''}
              >
                <Table className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {viewMode === 'cards' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredTeams.map(team => {
            const teamPlayers = players.filter(p => p.team_id === team.id);
            const teamCoaches = coaches.filter(c => c.team_ids?.includes(team.id));

            return (
              <Card key={team.id} className="border-none shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer relative"
                onClick={() => navigate(`${createPageUrl('TeamDashboard')}?teamId=${team.id}`)}
              >
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setViewAnalyticsTeam(team); }} className="h-8 w-8 bg-white shadow-sm">
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(team); }} className="h-8 w-8 bg-white shadow-sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteTeamId(team.id); }} className="h-8 w-8 bg-white shadow-sm hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-blue-50 p-4">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold shadow-md group-hover:scale-110 transition-transform">
                      {team.age_group || team.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm md:text-lg truncate">{team.name}</div>
                      <div className="text-xs md:text-sm font-normal text-slate-600">{team.age_group}</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 md:pt-6 p-4">
                  <div className="space-y-2 md:space-y-3">
                    {team.league && (
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-slate-600">Club:</span>
                        <span className="font-medium text-slate-900">{team.league}</span>
                      </div>
                    )}
                    {team.season && (
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-slate-600">Season:</span>
                        <span className="font-medium text-slate-900">{team.season}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs md:text-sm">
                      <span className="text-slate-600">Players:</span>
                      <span className="font-medium text-slate-900 flex items-center gap-1">
                        <Users className="w-3 h-3 md:w-4 md:h-4" />
                        {teamPlayers.length}
                      </span>
                    </div>
                    {teamCoaches.length > 0 && (
                      <div className="pt-2 md:pt-3 border-t border-slate-100">
                        <div className="text-[10px] md:text-xs text-slate-600 mb-1 md:mb-2">Assigned Coaches:</div>
                        {teamCoaches.slice(0, 2).map(coach => (
                          <div key={coach.id} className="flex items-center gap-1 md:gap-2 text-xs md:text-sm mb-1">
                            <User className="w-3 h-3 text-emerald-600" />
                            <span className="text-slate-700 truncate">{coach.full_name}</span>
                          </div>
                        ))}
                        {teamCoaches.length > 2 && (
                          <span className="text-[10px] text-slate-500">+{teamCoaches.length - 2} more</span>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-none shadow-xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                  <tr>
                    <th 
                      className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-bold cursor-pointer hover:bg-slate-700"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        Team Name <SortIcon field="name" />
                      </div>
                    </th>
                    <th 
                      className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-bold cursor-pointer hover:bg-slate-700"
                      onClick={() => handleSort('age_group')}
                    >
                      <div className="flex items-center">
                        Age Group <SortIcon field="age_group" />
                      </div>
                    </th>
                    <th 
                      className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-bold cursor-pointer hover:bg-slate-700"
                      onClick={() => handleSort('league')}
                    >
                      <div className="flex items-center">
                        Club <SortIcon field="league" />
                      </div>
                    </th>
                    <th 
                      className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-bold cursor-pointer hover:bg-slate-700"
                      onClick={() => handleSort('season')}
                    >
                      <div className="flex items-center">
                        Season <SortIcon field="season" />
                      </div>
                    </th>
                    <th 
                      className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-bold cursor-pointer hover:bg-slate-700"
                      onClick={() => handleSort('playerCount')}
                    >
                      <div className="flex items-center">
                        Players <SortIcon field="playerCount" />
                      </div>
                    </th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-bold">Coaches</th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeams.map((team, idx) => {
                    const teamCoaches = coaches.filter(c => c.team_ids?.includes(team.id));
                    const teamPlayers = players.filter(p => p.team_id === team.id);
                    
                    return (
                      <tr 
                        key={team.id} 
                        className={`border-b hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                      >
                        <td className="px-4 md:px-6 py-3 md:py-4">
                          <Input
                            value={team.name || ''}
                            onChange={(e) => updateTeamFieldMutation.mutate({ id: team.id, field: 'name', value: e.target.value })}
                            className="border-transparent hover:border-slate-300 focus:border-emerald-500 font-semibold text-xs md:text-sm h-8 md:h-9"
                          />
                        </td>
                        <td className="px-4 md:px-6 py-3 md:py-4">
                          <Input
                            value={team.age_group || ''}
                            onChange={(e) => updateTeamFieldMutation.mutate({ id: team.id, field: 'age_group', value: e.target.value })}
                            className="border-transparent hover:border-slate-300 focus:border-emerald-500 text-xs md:text-sm h-8 md:h-9"
                          />
                        </td>
                        <td className="px-4 md:px-6 py-3 md:py-4">
                          <Input
                            value={team.league || ''}
                            onChange={(e) => updateTeamFieldMutation.mutate({ id: team.id, field: 'league', value: e.target.value })}
                            className="border-transparent hover:border-slate-300 focus:border-emerald-500 text-xs md:text-sm h-8 md:h-9"
                          />
                        </td>
                        <td className="px-4 md:px-6 py-3 md:py-4">
                          <Input
                            value={team.season || ''}
                            onChange={(e) => updateTeamFieldMutation.mutate({ id: team.id, field: 'season', value: e.target.value })}
                            className="border-transparent hover:border-slate-300 focus:border-emerald-500 text-xs md:text-sm h-8 md:h-9"
                          />
                        </td>
                        <td className="px-4 md:px-6 py-3 md:py-4">
                          <span className="flex items-center gap-1 text-xs md:text-sm font-medium">
                            <Users className="w-3 h-3 md:w-4 md:h-4 text-slate-500" />
                            {teamPlayers.length}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-3 md:py-4">
                          <div className="flex flex-wrap gap-1">
                            {teamCoaches.slice(0, 2).map(coach => (
                              <span key={coach.id} className="text-[10px] md:text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                {coach.full_name}
                              </span>
                            ))}
                            {teamCoaches.length > 2 && (
                              <span className="text-[10px] md:text-xs text-slate-500">+{teamCoaches.length - 2}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 md:h-8 md:w-8"
                              onClick={() => navigate(`${createPageUrl('TeamDashboard')}?teamId=${team.id}`)}
                            >
                              <BarChart3 className="w-3 h-3 md:w-4 md:h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 md:h-8 md:w-8"
                              onClick={() => handleEdit(team)}
                            >
                              <Edit className="w-3 h-3 md:w-4 md:h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 md:h-8 md:w-8 hover:bg-red-50 hover:text-red-600"
                              onClick={() => setDeleteTeamId(team.id)}
                            >
                              <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredTeams.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  No teams found matching your filters
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {teams.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">No teams yet. Create your first team to get started.</p>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <div className="w-2 h-6 md:h-8 bg-gradient-to-b from-emerald-500 to-blue-500 rounded-full" />
              {editingTeam ? 'Edit Team' : 'Create New Team'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 md:space-y-6 mt-4 md:mt-6">
            <div>
              <Label className="font-semibold text-slate-700 text-sm">Team Name *</Label>
              <Input
                value={teamForm.name}
                onChange={(e) => setTeamForm({...teamForm, name: e.target.value})}
                placeholder="e.g., Elite Squad"
                className="border-2 h-10 md:h-12 mt-2"
              />
            </div>
            <div>
              <Label className="font-semibold text-slate-700 text-sm">Age Group *</Label>
              <Input
                value={teamForm.age_group}
                onChange={(e) => setTeamForm({...teamForm, age_group: e.target.value})}
                placeholder="e.g., U-15, U-18, Senior"
                className="border-2 h-10 md:h-12 mt-2"
              />
            </div>
            <div>
              <Label className="font-semibold text-slate-700 text-sm">Club</Label>
              <Input
                value={teamForm.league}
                onChange={(e) => setTeamForm({...teamForm, league: e.target.value})}
                placeholder="e.g., Soccer Academy"
                className="border-2 h-10 md:h-12 mt-2"
              />
            </div>
            <div>
              <Label className="font-semibold text-slate-700 text-sm">Season</Label>
              <Input
                value={teamForm.season}
                onChange={(e) => setTeamForm({...teamForm, season: e.target.value})}
                placeholder="e.g., 2024/2025"
                className="border-2 h-10 md:h-12 mt-2"
              />
            </div>
            <div>
              <Label className="mb-3 block text-sm">Assign Coaches</Label>
              <CoachSelector 
                coaches={coaches}
                selectedCoachIds={teamForm.coach_ids}
                onCoachesChange={(ids) => setTeamForm({...teamForm, coach_ids: ids})}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 md:gap-4 mt-6 md:mt-8 pt-4 md:pt-6 border-t">
            <Button variant="outline" onClick={() => { setShowDialog(false); setEditingTeam(null); resetForm(); }} className="h-10 md:h-12 px-6 md:px-8">
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!teamForm.name || !teamForm.age_group}
              className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 h-10 md:h-12 px-6 md:px-8 text-sm md:text-base font-semibold shadow-lg"
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              Team Analytics - {viewAnalyticsTeam?.name}
            </DialogTitle>
          </DialogHeader>
          {viewAnalyticsTeam && (
            <TeamAnalyticsCard teamId={viewAnalyticsTeam.id} teamName={viewAnalyticsTeam.name} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}