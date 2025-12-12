import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Upload, Download, Users, Shield, UserCog, UserPlus, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import SmartImportDialog from '../components/import/SmartImportDialog';
import CleanSyncDataDialog from '../components/club/CleanSyncDataDialog';
import DeleteAllDialog from '../components/admin/DeleteAllDialog';

export default function AdminDataManagement() {
  const queryClient = useQueryClient();
  const [showParentDialog, setShowParentDialog] = useState(false);
  const [editingParent, setEditingParent] = useState(null);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importEntityType, setImportEntityType] = useState('');
  const [deleteAllType, setDeleteAllType] = useState(null);
  const [showCleanDialog, setShowCleanDialog] = useState(false);

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const parents = users.filter(u => u.role === 'parent');

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setShowParentDialog(false);
      setEditingParent(null);
      setSelectedPlayerIds([]);
    }
  });

  const updateTeamMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Team.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['teams'])
  });

  const updatePlayerMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Player.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['players'])
  });

  const exportCSV = (data, filename, headers) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        const value = row[h.toLowerCase().replace(/ /g, '_')] || '';
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const exportPlayers = () => {
    const data = players.map(p => ({
      parent_name: p.parent_name || '',
      email: p.email || '',
      phone_number: p.phone || '',
      player_last_name: p.full_name?.split(' ').pop() || '',
      player_first_name: p.full_name?.split(' ').slice(0, -1).join(' ') || '',
      date_of_birth: p.date_of_birth || '',
      gender: p.gender || '',
      grade: p.grade || '',
      team_name: teams.find(t => t.id === p.team_id)?.name || '',
      season: ''
    }));
    const headers = ['parent_name', 'email', 'phone_number', 'player_last_name', 'player_first_name', 'date_of_birth', 'gender', 'grade', 'team_name', 'season'];
    exportCSV(data, 'players.csv', headers);
  };

  const exportTeams = () => {
    const data = teams.map(t => {
      const teamCoach = coaches.find(c => c.team_ids?.includes(t.id));
      return {
        team_name: t.name || '',
        age_group: t.age_group || '',
        gender: t.gender || '',
        league: t.league || '',
        season: t.season || '',
        coach: teamCoach?.full_name || '',
        branch: ''
      };
    });
    const headers = ['team_name', 'age_group', 'gender', 'league', 'season', 'coach', 'branch'];
    exportCSV(data, 'teams.csv', headers);
  };

  const exportCoaches = () => {
    const data = coaches.map(c => ({
      first_name: c.first_name || c.full_name?.split(' ').slice(0, -1).join(' ') || '',
      last_name: c.last_name || c.full_name?.split(' ').pop() || '',
      email_address: c.email || '',
      phone_number: c.phone || '',
      branch: c.branch || ''
    }));
    const headers = ['first_name', 'last_name', 'email_address', 'phone_number', 'branch'];
    exportCSV(data, 'coaches.csv', headers);
  };

  const exportParents = () => {
    const parentData = parents.map(p => {
      const playerNames = (p.player_ids || []).map(pid => players.find(pl => pl.id === pid)?.full_name).filter(Boolean);
      return {
        full_name: p.full_name,
        email: p.email,
        player_names: playerNames.join(';')
      };
    });
    const headers = ['full_name', 'email', 'player_names'];
    exportCSV(parentData, 'parents.csv', headers);
  };

  const handleImportCallback = async (entityType, data) => {
    if (entityType === 'player') {
      const result = await base44.entities.Player.create(data);
      queryClient.invalidateQueries(['players']);
      return result;
    } else if (entityType === 'player_update') {
      await base44.entities.Player.update(data.id, data.data);
      queryClient.invalidateQueries(['players']);
    } else if (entityType === 'team') {
      const result = await base44.entities.Team.create(data);
      queryClient.invalidateQueries(['teams']);
      return result;
    } else if (entityType === 'team_update') {
      await base44.entities.Team.update(data.id, data.data);
      queryClient.invalidateQueries(['teams']);
    } else if (entityType === 'coach') {
      const result = await base44.entities.Coach.create(data);
      queryClient.invalidateQueries(['coaches']);
      return result;
    } else if (entityType === 'coach_update') {
      await base44.entities.Coach.update(data.id, data.data);
      queryClient.invalidateQueries(['coaches']);
    }
  };

  const openImportDialog = (type) => {
    setImportEntityType(type);
    setImportDialogOpen(true);
  };

  const handleEditParent = (parent) => {
    setEditingParent(parent);
    setSelectedPlayerIds(parent.player_ids || []);
    setShowParentDialog(true);
  };

  const handleSaveParent = () => {
    updateUserMutation.mutate({ id: editingParent.id, data: { player_ids: selectedPlayerIds } });
  };

  const handleDeleteEntity = async (entityId) => {
    if (deleteAllType === 'players') {
      await base44.entities.Player.delete(entityId);
    } else if (deleteAllType === 'teams') {
      await base44.entities.Team.delete(entityId);
    } else if (deleteAllType === 'coaches') {
      await base44.entities.Coach.delete(entityId);
    }
  };

  const handleDeleteAllComplete = () => {
    queryClient.invalidateQueries(['players']);
    queryClient.invalidateQueries(['teams']);
    queryClient.invalidateQueries(['coaches']);
    setDeleteAllType(null);
  };

  const handleCleanData = async (action, data) => {
    if (action === 'delete_player') {
      await base44.entities.Player.delete(data);
      queryClient.invalidateQueries(['players']);
    } else if (action === 'delete_team') {
      await base44.entities.Team.delete(data);
      queryClient.invalidateQueries(['teams']);
    } else if (action === 'delete_coach') {
      await base44.entities.Coach.delete(data);
      queryClient.invalidateQueries(['coaches']);
    } else if (action === 'update_player') {
      await base44.entities.Player.update(data.id, data.data);
      queryClient.invalidateQueries(['players']);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Shield className="w-6 h-6 md:w-8 md:h-8 text-emerald-600" />
            Admin Data Management
          </h1>
          <p className="text-slate-600 mt-1">Import/Export data and manage assignments</p>
        </div>
        <Button onClick={() => setShowCleanDialog(true)} variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50">
          <AlertTriangle className="w-4 h-4 mr-2" />
          Clean & Sync Data
        </Button>
      </div>

      <Tabs defaultValue="import-export" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="import-export">Import/Export</TabsTrigger>
          <TabsTrigger value="players-teams">Players → Teams</TabsTrigger>
          <TabsTrigger value="coaches-teams">Coaches → Teams</TabsTrigger>
          <TabsTrigger value="parents-players">Parents → Players</TabsTrigger>
        </TabsList>

        <TabsContent value="import-export">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><Users className="w-5 h-5 text-emerald-600" />Players ({players.length})</span>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => setDeleteAllType('players')}>
                    <Trash2 className="w-4 h-4 mr-1" />Delete All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={exportPlayers} className="w-full bg-emerald-600 hover:bg-emerald-700">
                  <Download className="w-4 h-4 mr-2" />Export Players CSV
                </Button>
                <Button onClick={() => openImportDialog('players')} variant="outline" className="w-full">
                  <Upload className="w-4 h-4 mr-2" />Import Players
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><Shield className="w-5 h-5 text-blue-600" />Teams ({teams.length})</span>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => setDeleteAllType('teams')}>
                    <Trash2 className="w-4 h-4 mr-1" />Delete All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={exportTeams} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Download className="w-4 h-4 mr-2" />Export Teams CSV
                </Button>
                <Button onClick={() => openImportDialog('teams')} variant="outline" className="w-full">
                  <Upload className="w-4 h-4 mr-2" />Import Teams
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><UserCog className="w-5 h-5 text-purple-600" />Coaches ({coaches.length})</span>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => setDeleteAllType('coaches')}>
                    <Trash2 className="w-4 h-4 mr-1" />Delete All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={exportCoaches} className="w-full bg-purple-600 hover:bg-purple-700">
                  <Download className="w-4 h-4 mr-2" />Export Coaches CSV
                </Button>
                <Button onClick={() => openImportDialog('coaches')} variant="outline" className="w-full">
                  <Upload className="w-4 h-4 mr-2" />Import Coaches
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-orange-600" />Parents ({parents.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={exportParents} className="w-full bg-orange-600 hover:bg-orange-700">
                  <Download className="w-4 h-4 mr-2" />Export Parents CSV
                </Button>
                <p className="text-xs text-slate-500">Parents must be invited via User Management</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="players-teams">
          <Card className="border-none shadow-lg">
            <CardHeader><CardTitle>Assign Players to Teams</CardTitle></CardHeader>
            <CardContent>
              <div className="max-h-[60vh] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead>Current Team</TableHead>
                      <TableHead>Assign to Team</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {players.slice(0, 100).map(player => (
                      <TableRow key={player.id}>
                        <TableCell className="font-medium">{player.full_name}</TableCell>
                        <TableCell><Badge variant="outline">{teams.find(t => t.id === player.team_id)?.name || 'Unassigned'}</Badge></TableCell>
                        <TableCell>
                          <Select value={player.team_id || ''} onValueChange={(v) => updatePlayerMutation.mutate({ id: player.id, data: { team_id: v || null } })}>
                            <SelectTrigger className="w-48"><SelectValue placeholder="Select team" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value={null}>Unassigned</SelectItem>
                              {teams.map(t => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coaches-teams">
          <Card className="border-none shadow-lg">
            <CardHeader><CardTitle>Assign Coaches to Teams</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead>Assigned Coaches</TableHead>
                    <TableHead>Add Coach</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map(team => (
                    <TableRow key={team.id}>
                      <TableCell className="font-medium">{team.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(team.coach_ids || []).map(cid => {
                            const coach = coaches.find(c => c.id === cid);
                            return coach ? (
                              <Badge key={cid} className="bg-purple-100 text-purple-800">
                                {coach.full_name}
                                <button className="ml-1 text-purple-600 hover:text-purple-800" onClick={() => {
                                  const newIds = (team.coach_ids || []).filter(id => id !== cid);
                                  updateTeamMutation.mutate({ id: team.id, data: { coach_ids: newIds } });
                                }}>×</button>
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select value="" onValueChange={(v) => {
                          const currentIds = team.coach_ids || [];
                          if (!currentIds.includes(v)) {
                            updateTeamMutation.mutate({ id: team.id, data: { coach_ids: [...currentIds, v] } });
                          }
                        }}>
                          <SelectTrigger className="w-48"><SelectValue placeholder="Add coach" /></SelectTrigger>
                          <SelectContent>
                            {coaches.filter(c => !(team.coach_ids || []).includes(c.id)).map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parents-players">
          <Card className="border-none shadow-lg">
            <CardHeader><CardTitle>Assign Parents to Players</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parent</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Assigned Players</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parents.map(parent => (
                    <TableRow key={parent.id}>
                      <TableCell className="font-medium">{parent.full_name}</TableCell>
                      <TableCell>{parent.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(parent.player_ids || []).map(pid => {
                            const player = players.find(p => p.id === pid);
                            return player ? (<Badge key={pid} className="bg-emerald-100 text-emerald-800">{player.full_name}</Badge>) : null;
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => handleEditParent(parent)}>Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showParentDialog} onOpenChange={setShowParentDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Assign Players to {editingParent?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-2 mt-4">
            {players.map(player => (
              <div key={player.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded">
                <Checkbox
                  checked={selectedPlayerIds.includes(player.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedPlayerIds([...selectedPlayerIds, player.id]);
                    } else {
                      setSelectedPlayerIds(selectedPlayerIds.filter(id => id !== player.id));
                    }
                  }}
                />
                <span>{player.full_name}</span>
                <Badge variant="outline" className="ml-auto text-xs">{teams.find(t => t.id === player.team_id)?.name || 'No Team'}</Badge>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowParentDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveParent} className="bg-emerald-600 hover:bg-emerald-700">Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      <SmartImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        entityType={importEntityType}
        existingData={importEntityType === 'players' ? players : importEntityType === 'teams' ? teams : coaches}
        teams={teams}
        coaches={coaches}
        players={players}
        onImport={handleImportCallback}
      />

      <DeleteAllDialog
        open={!!deleteAllType}
        onClose={() => handleDeleteAllComplete()}
        entityType={deleteAllType}
        entities={deleteAllType === 'players' ? players : deleteAllType === 'teams' ? teams : coaches}
        onDelete={handleDeleteEntity}
      />

      <CleanSyncDataDialog
        open={showCleanDialog}
        onClose={() => setShowCleanDialog(false)}
        players={players}
        teams={teams}
        coaches={coaches}
        onCleanData={handleCleanData}
      />
    </div>
  );
}