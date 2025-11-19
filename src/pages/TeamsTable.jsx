import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trash2, Filter, Upload, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import BulkImportTeams from '../components/teams/BulkImportTeams';
import CoachSelector from '../components/team/CoachSelector';

export default function TeamsTable() {
  const [filterLeague, setFilterLeague] = useState('all');
  const [filterCoach, setFilterCoach] = useState('all');
  const [filterAgeGroup, setFilterAgeGroup] = useState('all');
  const [birthYearFrom, setBirthYearFrom] = useState('');
  const [birthYearTo, setBirthYearTo] = useState('');
  const [deleteTeamId, setDeleteTeamId] = useState(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const queryClient = useQueryClient();

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const updateTeamMutation = useMutation({
    mutationFn: ({ id, field, value }) => {
      return base44.entities.Team.update(id, { [field]: value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['teams']);
    }
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (id) => base44.entities.Team.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['teams']);
      setDeleteTeamId(null);
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (teamIds) => {
      for (const id of teamIds) {
        await base44.entities.Team.delete(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['teams']);
      setSelectedTeams([]);
      setShowBulkDeleteDialog(false);
    }
  });

  const updateTeamCoachesMutation = useMutation({
    mutationFn: async ({ teamId, coachIds }) => {
      await base44.entities.Team.update(teamId, { coach_ids: coachIds });
      
      for (const coach of coaches) {
        const shouldHaveTeam = coachIds.includes(coach.id);
        const hasTeam = coach.team_ids?.includes(teamId);
        
        if (shouldHaveTeam && !hasTeam) {
          await base44.entities.Coach.update(coach.id, { 
            team_ids: [...(coach.team_ids || []), teamId] 
          });
        } else if (!shouldHaveTeam && hasTeam) {
          await base44.entities.Coach.update(coach.id, { 
            team_ids: coach.team_ids.filter(tid => tid !== teamId) 
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['teams']);
      queryClient.invalidateQueries(['coaches']);
    }
  });

  const bulkImportTeams = async (teamsData) => {
    for (const team of teamsData) {
      await base44.entities.Team.create(team);
    }
    queryClient.invalidateQueries(['teams']);
    setShowBulkImport(false);
  };

  const handleCellEdit = (teamId, field, value) => {
    updateTeamMutation.mutate({ id: teamId, field, value });
  };

  const filteredTeams = teams.filter(team => {
    if (filterLeague !== 'all' && team.league !== filterLeague) return false;
    if (filterCoach !== 'all' && !team.coach_ids?.includes(filterCoach)) return false;
    if (filterAgeGroup !== 'all' && team.age_group !== filterAgeGroup) return false;
    
    if (birthYearFrom || birthYearTo) {
      const ageMatch = team.age_group?.match(/U-?(\d+)/i);
      if (ageMatch) {
        const age = parseInt(ageMatch[1]);
        const currentYear = new Date().getFullYear();
        const teamBirthYear = currentYear - age;
        
        if (birthYearFrom && teamBirthYear < parseInt(birthYearFrom)) return false;
        if (birthYearTo && teamBirthYear > parseInt(birthYearTo)) return false;
      }
    }
    
    return true;
  });

  const uniqueLeagues = [...new Set(teams.map(t => t.league).filter(Boolean))];
  const uniqueAgeGroups = [...new Set(teams.map(t => t.age_group).filter(Boolean))];

  return (
    <div className="p-8 max-w-[1800px] mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Teams Table View</h1>
          <p className="text-slate-600 mt-1">View and edit all team information</p>
        </div>
        <Button onClick={() => setShowBulkImport(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Upload className="w-4 h-4 mr-2" />
          Bulk Import Teams
        </Button>
      </div>

      <Card className="border-none shadow-xl mb-6 bg-gradient-to-br from-white to-slate-50">
        <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-blue-50">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-emerald-600" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">League</label>
              <Select value={filterLeague} onValueChange={setFilterLeague}>
                <SelectTrigger className="border-2">
                  <SelectValue placeholder="All Leagues" />
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
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Coach</label>
              <Select value={filterCoach} onValueChange={setFilterCoach}>
                <SelectTrigger className="border-2">
                  <SelectValue placeholder="All Coaches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Coaches</SelectItem>
                  {coaches.map(coach => (
                    <SelectItem key={coach.id} value={coach.id}>{coach.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Age Group</label>
              <Select value={filterAgeGroup} onValueChange={setFilterAgeGroup}>
                <SelectTrigger className="border-2">
                  <SelectValue placeholder="All Age Groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Age Groups</SelectItem>
                  {uniqueAgeGroups.map(age => (
                    <SelectItem key={age} value={age}>{age}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Birth Year From</label>
              <Input
                type="number"
                value={birthYearFrom}
                onChange={(e) => setBirthYearFrom(e.target.value)}
                placeholder="e.g. 2008"
                className="border-2"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Birth Year To</label>
              <Input
                type="number"
                value={birthYearTo}
                onChange={(e) => setBirthYearTo(e.target.value)}
                placeholder="e.g. 2010"
                className="border-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedTeams.length > 0 && (
        <Card className="border-none shadow-lg mb-6 bg-gradient-to-br from-red-50 to-orange-50">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div className="font-semibold text-slate-900">{selectedTeams.length} teams selected</div>
              <Button 
                onClick={() => setShowBulkDeleteDialog(true)}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected Teams
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-none shadow-xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                <tr>
                  <th className="px-6 py-4 text-center text-sm font-bold w-12">
                    <Checkbox
                      checked={selectedTeams.length === filteredTeams.length && filteredTeams.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTeams(filteredTeams.map(t => t.id));
                        } else {
                          setSelectedTeams([]);
                        }
                      }}
                      className="border-white"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Team Name</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Age Group</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">League</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Season</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Coaches</th>
                  <th className="px-6 py-4 text-center text-sm font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeams.map((team, idx) => {
                  const teamCoaches = coaches.filter(c => c.team_ids?.includes(team.id));
                  return (
                    <tr key={team.id} className={`border-b hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                      <td className="px-6 py-4 text-center">
                        <Checkbox
                          checked={selectedTeams.includes(team.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTeams([...selectedTeams, team.id]);
                            } else {
                              setSelectedTeams(selectedTeams.filter(id => id !== team.id));
                            }
                          }}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <Input
                          value={team.name || ''}
                          onChange={(e) => handleCellEdit(team.id, 'name', e.target.value)}
                          className="border-slate-300 focus:border-emerald-500 font-semibold"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <Input
                          value={team.age_group || ''}
                          onChange={(e) => handleCellEdit(team.id, 'age_group', e.target.value)}
                          className="border-slate-300 focus:border-emerald-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <Input
                          value={team.league || ''}
                          onChange={(e) => handleCellEdit(team.id, 'league', e.target.value)}
                          className="border-slate-300 focus:border-emerald-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <Input
                          value={team.season || ''}
                          onChange={(e) => handleCellEdit(team.id, 'season', e.target.value)}
                          className="border-slate-300 focus:border-emerald-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <CoachSelector
                          coaches={coaches}
                          selectedCoachIds={team.coach_ids || []}
                          onCoachesChange={(coachIds) => updateTeamCoachesMutation.mutate({ teamId: team.id, coachIds })}
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTeamId(team.id)}
                          className="hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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

      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedTeams.length} Teams?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all selected teams. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => bulkDeleteMutation.mutate(selectedTeams)} className="bg-red-600 hover:bg-red-700">
              Delete Teams
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Import Teams</DialogTitle>
          </DialogHeader>
          <BulkImportTeams onImportComplete={bulkImportTeams} />
        </DialogContent>
      </Dialog>
    </div>
  );
}