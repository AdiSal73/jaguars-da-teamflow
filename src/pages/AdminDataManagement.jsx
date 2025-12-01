import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Upload, Download, Users, Shield, UserCog, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function AdminDataManagement() {
  const queryClient = useQueryClient();
  const [showParentDialog, setShowParentDialog] = useState(false);
  const [editingParent, setEditingParent] = useState(null);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);

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

  // CSV Export Functions
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
    const headers = ['full_name', 'email', 'phone', 'date_of_birth', 'gender', 'primary_position', 'team_id', 'jersey_number', 'status'];
    exportCSV(players, 'players.csv', headers);
  };

  const exportTeams = () => {
    const headers = ['name', 'age_group', 'league', 'gender', 'season'];
    exportCSV(teams, 'teams.csv', headers);
  };

  const exportCoaches = () => {
    const headers = ['full_name', 'email', 'phone', 'specialization'];
    exportCSV(coaches, 'coaches.csv', headers);
  };

  const exportParents = () => {
    const parentData = parents.map(p => ({
      full_name: p.full_name,
      email: p.email,
      player_ids: (p.player_ids || []).join(';')
    }));
    const headers = ['full_name', 'email', 'player_ids'];
    exportCSV(parentData, 'parents.csv', headers);
  };

  // CSV Import Functions
  const handleImport = async (file, entityType) => {
    const text = await file.text();
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const records = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].match(/(".*?"|[^,]+)/g) || [];
      const record = {};
      headers.forEach((h, idx) => {
        let val = (values[idx] || '').replace(/^"|"$/g, '').replace(/""/g, '"');
        record[h] = val;
      });
      records.push(record);
    }

    try {
      if (entityType === 'players') {
        for (const record of records) {
          await base44.entities.Player.create(record);
        }
      } else if (entityType === 'teams') {
        for (const record of records) {
          await base44.entities.Team.create(record);
        }
      } else if (entityType === 'coaches') {
        for (const record of records) {
          await base44.entities.Coach.create(record);
        }
      }
      queryClient.invalidateQueries([entityType]);
      toast.success(`Imported ${records.length} ${entityType}`);
    } catch (error) {
      toast.error(`Import failed: ${error.message}`);
    }
  };

  const handleEditParent = (parent) => {
    setEditingParent(parent);
    setSelectedPlayerIds(parent.player_ids || []);
    setShowParentDialog(true);
  };

  const handleSaveParent = () => {
    updateUserMutation.mutate({
      id: editingParent.id,
      data: { player_ids: selectedPlayerIds }
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Shield className="w-8 h-8 text-emerald-600" />
          Admin Data Management
        </h1>
        <p className="text-slate-600 mt-1">Import/Export data and manage assignments</p>
      </div>

      <Tabs defaultValue="import-export" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="import-export">Import/Export</TabsTrigger>
          <TabsTrigger value="players-teams">Players → Teams</TabsTrigger>
          <TabsTrigger value="coaches-teams">Coaches → Teams</TabsTrigger>
          <TabsTrigger value="parents-players">Parents → Players</TabsTrigger>
        </TabsList>

        <TabsContent value="import-export">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Players */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  Players ({players.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={exportPlayers} className="w-full bg-emerald-600 hover:bg-emerald-700">
                  <Download className="w-4 h-4 mr-2" />
                  Export Players CSV
                </Button>
                <div>
                  <Label>Import Players CSV</Label>
                  <Input 
                    type="file" 
                    accept=".csv"
                    onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0], 'players')}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Teams */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Teams ({teams.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={exportTeams} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Download className="w-4 h-4 mr-2" />
                  Export Teams CSV
                </Button>
                <div>
                  <Label>Import Teams CSV</Label>
                  <Input 
                    type="file" 
                    accept=".csv"
                    onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0], 'teams')}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Coaches */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="w-5 h-5 text-purple-600" />
                  Coaches ({coaches.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={exportCoaches} className="w-full bg-purple-600 hover:bg-purple-700">
                  <Download className="w-4 h-4 mr-2" />
                  Export Coaches CSV
                </Button>
                <div>
                  <Label>Import Coaches CSV</Label>
                  <Input 
                    type="file" 
                    accept=".csv"
                    onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0], 'coaches')}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Parents */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-orange-600" />
                  Parents ({parents.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={exportParents} className="w-full bg-orange-600 hover:bg-orange-700">
                  <Download className="w-4 h-4 mr-2" />
                  Export Parents CSV
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="players-teams">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Assign Players to Teams</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Current Team</TableHead>
                    <TableHead>Assign to Team</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players.slice(0, 50).map(player => (
                    <TableRow key={player.id}>
                      <TableCell className="font-medium">{player.full_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {teams.find(t => t.id === player.team_id)?.name || 'Unassigned'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={player.team_id || ''} 
                          onValueChange={(v) => updatePlayerMutation.mutate({ id: player.id, data: { team_id: v } })}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select team" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={null}>Unassigned</SelectItem>
                            {teams.map(t => (
                              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
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

        <TabsContent value="coaches-teams">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Assign Coaches to Teams (Multiple Allowed)</CardTitle>
            </CardHeader>
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
                                <button 
                                  className="ml-1 text-purple-600 hover:text-purple-800"
                                  onClick={() => {
                                    const newIds = (team.coach_ids || []).filter(id => id !== cid);
                                    updateTeamMutation.mutate({ id: team.id, data: { coach_ids: newIds } });
                                  }}
                                >×</button>
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value="" 
                          onValueChange={(v) => {
                            const currentIds = team.coach_ids || [];
                            if (!currentIds.includes(v)) {
                              updateTeamMutation.mutate({ id: team.id, data: { coach_ids: [...currentIds, v] } });
                            }
                          }}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Add coach" />
                          </SelectTrigger>
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
            <CardHeader>
              <CardTitle>Assign Parents to Players (Multiple Players per Parent)</CardTitle>
            </CardHeader>
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
                            return player ? (
                              <Badge key={pid} className="bg-emerald-100 text-emerald-800">
                                {player.full_name}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => handleEditParent(parent)}>
                          Edit Assignments
                        </Button>
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
          <DialogHeader>
            <DialogTitle>Assign Players to {editingParent?.full_name}</DialogTitle>
          </DialogHeader>
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
                <Badge variant="outline" className="ml-auto text-xs">
                  {teams.find(t => t.id === player.team_id)?.name || 'No Team'}
                </Badge>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowParentDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveParent} className="bg-emerald-600 hover:bg-emerald-700">
              Save Assignments
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}