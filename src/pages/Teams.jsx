import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Plus, Users, User, Edit, Trash2, BarChart3, Table, Grid, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import TeamAnalyticsCard from '../components/team/TeamAnalyticsCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CoachSelector from '../components/team/CoachSelector';
import { BRANCH_OPTIONS, getLeaguesForGender, getTeamBorderColor } from '../components/constants/leagueOptions';

export default function Teams() {
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [deleteTeamId, setDeleteTeamId] = useState(null);
  const [viewAnalyticsTeam, setViewAnalyticsTeam] = useState(null);
  const [filterAgeGroup, setFilterAgeGroup] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [filterCoach, setFilterCoach] = useState('all');
  const [filterLeague, setFilterLeague] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');
  const [viewMode, setViewMode] = useState('cards');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [teamForm, setTeamForm] = useState({
    name: '',
    age_group: '',
    league: '',
    branch: '',
    gender: 'Female',
    season: '',
    coach_ids: []
  });

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const genderParam = params.get('gender');
    if (genderParam) {
      setFilterGender(genderParam);
    }
  }, []);

  const queryClient = useQueryClient();

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list('-created_date')
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const currentCoach = coaches.find(c => c.email === user?.email);

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
          await base44.entities.Coach.update(coach.id, { team_ids: [...(coach.team_ids || []), editingTeam.id] });
        } else if (!shouldHaveTeam && hasTeam) {
          await base44.entities.Coach.update(coach.id, { team_ids: coach.team_ids.filter(tid => tid !== editingTeam.id) });
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
    onSuccess: () => queryClient.invalidateQueries(['teams'])
  });

  const resetForm = () => {
    setTeamForm({ name: '', age_group: '', league: '', branch: '', gender: 'Female', season: '', coach_ids: [] });
  };

  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      const BATCH_SIZE = 5;
      const DELAY_MS = 300;
      for (let i = 0; i < selectedTeams.length; i += BATCH_SIZE) {
        const batch = selectedTeams.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(id => base44.entities.Team.delete(id)));
        if (i + BATCH_SIZE < selectedTeams.length) {
          await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['teams']);
      setSelectedTeams([]);
      setShowBulkDeleteDialog(false);
    }
  });

  const handleEdit = (team) => {
    setEditingTeam(team);
    const assignedCoaches = coaches.filter(c => c.team_ids?.includes(team.id)).map(c => c.id);
    setTeamForm({
      name: team.name || '',
      age_group: team.age_group || '',
      league: team.league || '',
      branch: team.branch || '',
      gender: team.gender || 'Female',
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

  // Filter out coaches from teams - only show actual teams
  const actualTeams = teams.filter(team => team.name && team.age_group);

  const filteredTeams = useMemo(() => {
    let teamList = actualTeams;
    
    // Coaches only see their assigned teams
    if (currentCoach && user?.role !== 'admin') {
      const coachTeamIds = currentCoach.team_ids || [];
      teamList = teamList.filter(t => coachTeamIds.includes(t.id));
    }
    
    let result = teamList.filter(team => {
      if (filterAgeGroup !== 'all' && team.age_group !== filterAgeGroup) return false;
      if (filterLeague !== 'all' && team.league !== filterLeague) return false;
      if (filterBranch !== 'all' && team.branch !== filterBranch) return false;
      if (filterGender !== 'all') {
        if (filterGender === 'Boys' && team.gender !== 'Male') return false;
        if (filterGender === 'Girls' && team.gender !== 'Female') return false;
        if (filterGender !== 'Boys' && filterGender !== 'Girls' && team.gender !== filterGender) return false;
      }
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
      return sortDirection === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

    return result;
  }, [actualTeams, filterAgeGroup, filterLeague, filterBranch, filterGender, filterCoach, coaches, sortField, sortDirection, players, currentCoach, user]);

  const uniqueLeagues = [...new Set(teams.map(t => t.league).filter(Boolean))];
  const uniqueBranches = [...new Set(teams.map(t => t.branch).filter(Boolean))];

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
    return sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />;
  };

  return (
    <div className="p-4 md:p-8 max-w-[1800px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Teams Management</h1>
          <p className="text-sm text-slate-600 mt-1">Manage teams and assign coaches</p>
        </div>
        <Button onClick={() => { setEditingTeam(null); resetForm(); setShowDialog(true); }} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Team
        </Button>
      </div>

      <Card className="mb-6 border-none shadow-lg">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-end justify-between">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 flex-1">
              <div>
                <Label className="mb-2 block text-xs">Age Group</Label>
                <Select value={filterAgeGroup} onValueChange={setFilterAgeGroup}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Age Groups</SelectItem>
                    {[...new Set(teams.map(t => t.age_group).filter(Boolean))].sort().map(ag => (
                      <SelectItem key={ag} value={ag}>{ag}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-xs">Gender</Label>
                <Select value={filterGender} onValueChange={setFilterGender}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="Girls">Girls</SelectItem>
                    <SelectItem value="Boys">Boys</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-xs">League</Label>
                <Select value={filterLeague} onValueChange={setFilterLeague}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Leagues</SelectItem>
                    {uniqueLeagues.map(league => (
                      <SelectItem key={league} value={league}>{league}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-xs">Branch</Label>
                <Select value={filterBranch} onValueChange={setFilterBranch}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {BRANCH_OPTIONS.map(branch => (
                      <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-xs">Coach</Label>
                <Select value={filterCoach} onValueChange={setFilterCoach}>
                  <SelectTrigger className="h-9 text-xs">
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
            </div>
            <div className="flex gap-2">
              <Button variant={viewMode === 'cards' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('cards')} className={viewMode === 'cards' ? 'bg-emerald-600' : ''}>
                <Grid className="w-4 h-4" />
              </Button>
              <Button variant={viewMode === 'table' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('table')} className={viewMode === 'table' ? 'bg-emerald-600' : ''}>
                <Table className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {viewMode === 'cards' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map(team => {
            const teamPlayers = players.filter(p => p.team_id === team.id);
            const teamCoaches = coaches.filter(c => c.team_ids?.includes(team.id));
            const isMaleTeam = team.gender === 'Male';
            const borderColorClass = getTeamBorderColor(team.league);

            return (
              <Card 
                key={team.id} 
                className={`shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer relative border-l-4 ${borderColorClass} ${isMaleTeam ? 'bg-slate-800' : 'bg-white'}`}
                onClick={() => navigate(`${createPageUrl('TeamDashboard')}?teamId=${team.id}`)}
              >
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setViewAnalyticsTeam(team); }} className={`h-8 w-8 shadow-sm ${isMaleTeam ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-white'}`}>
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(team); }} className={`h-8 w-8 shadow-sm ${isMaleTeam ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-white'}`}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteTeamId(team.id); }} className={`h-8 w-8 shadow-sm hover:bg-red-50 hover:text-red-600 ${isMaleTeam ? 'bg-slate-700 text-white' : 'bg-white'}`}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <CardHeader className={`border-b p-4 ${isMaleTeam ? 'bg-slate-900 border-slate-700' : 'border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100'}`}>
                  <CardTitle className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-md group-hover:scale-110 transition-transform ${isMaleTeam ? 'bg-slate-700 text-white' : 'bg-gradient-to-br from-emerald-500 to-blue-500 text-white'}`}>
                      {team.age_group || team.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold truncate ${isMaleTeam ? 'text-white' : ''}`}>{team.name}</div>
                      <div className={`text-xs font-normal ${isMaleTeam ? 'text-slate-400' : 'text-slate-600'}`}>{team.age_group}</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className={`pt-4 p-4 ${isMaleTeam ? 'text-slate-300' : ''}`}>
                  <div className="space-y-2">
                    {team.league && (
                      <div className="flex justify-between text-xs">
                        <span className={isMaleTeam ? 'text-slate-400' : 'text-slate-600'}>League:</span>
                        <span className={`font-medium ${isMaleTeam ? 'text-white' : 'text-slate-900'}`}>{team.league}</span>
                      </div>
                    )}
                    {team.branch && (
                      <div className="flex justify-between text-xs">
                        <span className={isMaleTeam ? 'text-slate-400' : 'text-slate-600'}>Branch:</span>
                        <span className={`font-medium ${isMaleTeam ? 'text-white' : 'text-slate-900'}`}>{team.branch}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs">
                      <span className={isMaleTeam ? 'text-slate-400' : 'text-slate-600'}>Players:</span>
                      <span className={`font-medium flex items-center gap-1 ${isMaleTeam ? 'text-white' : 'text-slate-900'}`}>
                        <Users className="w-3 h-3" />{teamPlayers.length}
                      </span>
                    </div>
                    <div className={`pt-2 border-t ${isMaleTeam ? 'border-slate-700' : 'border-slate-100'}`}>
                      <div className={`text-[10px] mb-1 ${isMaleTeam ? 'text-slate-400' : 'text-slate-600'}`}>Coaches:</div>
                      {teamCoaches.length > 0 ? (
                        teamCoaches.slice(0, 2).map(coach => (
                          <div key={coach.id} className="flex items-center gap-1 text-xs mb-1">
                            <User className={`w-3 h-3 ${isMaleTeam ? 'text-emerald-400' : 'text-emerald-600'}`} />
                            <span className={`truncate ${isMaleTeam ? 'text-slate-300' : 'text-slate-700'}`}>{coach.full_name}</span>
                          </div>
                        ))
                      ) : (
                        <div className={`text-xs italic ${isMaleTeam ? 'text-slate-500' : 'text-slate-400'}`}>No coaches assigned</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-none shadow-xl">
          {selectedTeams.length > 0 && (
            <div className="p-4 bg-slate-100 border-b flex items-center justify-between">
              <span className="text-sm font-medium">{selectedTeams.length} teams selected</span>
              <Button variant="destructive" size="sm" onClick={() => setShowBulkDeleteDialog(true)}>
                <Trash2 className="w-4 h-4 mr-2" />Delete Selected
              </Button>
            </div>
          )}
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                  <tr>
                    <th className="px-4 py-3 w-12">
                      <Checkbox 
                        checked={selectedTeams.length === filteredTeams.length && filteredTeams.length > 0}
                        onCheckedChange={(checked) => setSelectedTeams(checked ? filteredTeams.map(t => t.id) : [])}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold cursor-pointer hover:bg-slate-700" onClick={() => handleSort('name')}>
                      <div className="flex items-center">Team Name <SortIcon field="name" /></div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold cursor-pointer hover:bg-slate-700" onClick={() => handleSort('age_group')}>
                      <div className="flex items-center">Age Group <SortIcon field="age_group" /></div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold">Gender</th>
                    <th className="px-4 py-3 text-left text-xs font-bold">League</th>
                    <th className="px-4 py-3 text-left text-xs font-bold">Branch</th>
                    <th className="px-4 py-3 text-left text-xs font-bold cursor-pointer hover:bg-slate-700" onClick={() => handleSort('playerCount')}>
                      <div className="flex items-center">Players <SortIcon field="playerCount" /></div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold">Coaches</th>
                    <th className="px-4 py-3 text-center text-xs font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeams.map((team, idx) => {
                    const teamCoaches = coaches.filter(c => c.team_ids?.includes(team.id));
                    const teamPlayers = players.filter(p => p.team_id === team.id);
                    const leagueOptions = getLeaguesForGender(team.gender);
                    return (
                      <tr key={team.id} className={`border-b hover:bg-slate-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                        <td className="px-4 py-3">
                          <Checkbox 
                            checked={selectedTeams.includes(team.id)}
                            onCheckedChange={(checked) => setSelectedTeams(checked ? [...selectedTeams, team.id] : selectedTeams.filter(id => id !== team.id))}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input value={team.name || ''} onChange={(e) => updateTeamFieldMutation.mutate({ id: team.id, field: 'name', value: e.target.value })} className="border-transparent hover:border-slate-300 font-semibold text-xs h-8" />
                        </td>
                        <td className="px-4 py-3">
                          <Input value={team.age_group || ''} onChange={(e) => updateTeamFieldMutation.mutate({ id: team.id, field: 'age_group', value: e.target.value })} className="border-transparent hover:border-slate-300 text-xs h-8" />
                        </td>
                        <td className="px-4 py-3">
                          <Select value={team.gender || ''} onValueChange={(v) => updateTeamFieldMutation.mutate({ id: team.id, field: 'gender', value: v })}>
                            <SelectTrigger className="h-8 text-xs w-24"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Female">Female</SelectItem>
                              <SelectItem value="Male">Male</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3">
                          <Select value={team.league || ''} onValueChange={(v) => updateTeamFieldMutation.mutate({ id: team.id, field: 'league', value: v })}>
                            <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="Select league" /></SelectTrigger>
                            <SelectContent>
                              {leagueOptions.map(league => (
                                <SelectItem key={league} value={league}>{league}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3">
                          <Select value={team.branch || ''} onValueChange={(v) => updateTeamFieldMutation.mutate({ id: team.id, field: 'branch', value: v })}>
                            <SelectTrigger className="h-8 text-xs w-32"><SelectValue placeholder="Select branch" /></SelectTrigger>
                            <SelectContent>
                              {BRANCH_OPTIONS.map(branch => (
                                <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 text-xs font-medium"><Users className="w-3 h-3 text-slate-500" />{teamPlayers.length}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {teamCoaches.slice(0, 2).map(coach => (
                              <span key={coach.id} className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">{coach.full_name}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`${createPageUrl('TeamDashboard')}?teamId=${team.id}`)}><BarChart3 className="w-3 h-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(team)}><Edit className="w-3 h-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-50 hover:text-red-600" onClick={() => setDeleteTeamId(team.id)}><Trash2 className="w-3 h-3" /></Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTeam ? 'Edit Team' : 'Create New Team'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Team Name *</Label>
              <Input value={teamForm.name} onChange={(e) => setTeamForm({...teamForm, name: e.target.value})} className="mt-1" />
            </div>
            <div>
              <Label>Age Group *</Label>
              <Input value={teamForm.age_group} onChange={(e) => setTeamForm({...teamForm, age_group: e.target.value})} className="mt-1" />
            </div>
            <div>
              <Label>Gender *</Label>
              <Select value={teamForm.gender} onValueChange={(v) => setTeamForm({...teamForm, gender: v})}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>League</Label>
              <Select value={teamForm.league} onValueChange={(v) => setTeamForm({...teamForm, league: v})}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select league" /></SelectTrigger>
                <SelectContent>
                  {getLeaguesForGender(teamForm.gender).map(league => (
                    <SelectItem key={league} value={league}>{league}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Branch</Label>
              <Select value={teamForm.branch} onValueChange={(v) => setTeamForm({...teamForm, branch: v})}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>
                  {BRANCH_OPTIONS.map(branch => (
                    <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Season</Label>
              <Input value={teamForm.season} onChange={(e) => setTeamForm({...teamForm, season: e.target.value})} className="mt-1" />
            </div>
            <div>
              <Label className="mb-2 block">Assign Coaches</Label>
              <CoachSelector coaches={coaches} selectedCoachIds={teamForm.coach_ids} onCoachesChange={(ids) => setTeamForm({...teamForm, coach_ids: ids})} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => { setShowDialog(false); setEditingTeam(null); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={!teamForm.name || !teamForm.age_group} className="bg-emerald-600 hover:bg-emerald-700">
              {editingTeam ? 'Update Team' : 'Create Team'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTeamId} onOpenChange={() => setDeleteTeamId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this team.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTeamMutation.mutate(deleteTeamId)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!viewAnalyticsTeam} onOpenChange={() => setViewAnalyticsTeam(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Team Analytics - {viewAnalyticsTeam?.name}</DialogTitle>
          </DialogHeader>
          {viewAnalyticsTeam && <TeamAnalyticsCard teamId={viewAnalyticsTeam.id} teamName={viewAnalyticsTeam.name} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedTeams.length} Teams?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the selected teams.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => bulkDeleteMutation.mutate()} className="bg-red-600 hover:bg-red-700">Delete Teams</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}