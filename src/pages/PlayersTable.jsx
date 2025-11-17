import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Users } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function PlayersTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [bulkTeamId, setBulkTeamId] = useState('');

  const queryClient = useQueryClient();

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const updatePlayerMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Player.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['players']);
    }
  });

  const bulkUpdateTeamMutation = useMutation({
    mutationFn: async (teamId) => {
      for (const playerId of selectedPlayers) {
        await base44.entities.Player.update(playerId, { team_id: teamId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['players']);
      setSelectedPlayers([]);
      setBulkTeamId('');
    }
  });

  const handleFieldUpdate = (playerId, field, value) => {
    updatePlayerMutation.mutate({ id: playerId, data: { [field]: value } });
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedPlayers(filteredPlayers.map(p => p.id));
    } else {
      setSelectedPlayers([]);
    }
  };

  const handleSelectPlayer = (playerId, checked) => {
    if (checked) {
      setSelectedPlayers([...selectedPlayers, playerId]);
    } else {
      setSelectedPlayers(selectedPlayers.filter(id => id !== playerId));
    }
  };

  const filteredPlayers = players.filter(player =>
    player.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Players Table</h1>
        <p className="text-slate-600 mt-1">Edit and manage player records</p>
      </div>

      <Card className="border-none shadow-lg mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Bulk Actions</CardTitle>
            <div className="text-sm text-slate-600">{selectedPlayers.length} players selected</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Select value={bulkTeamId} onValueChange={setBulkTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team to assign" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={() => bulkUpdateTeamMutation.mutate(bulkTeamId)}
              disabled={selectedPlayers.length === 0 || !bulkTeamId}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Users className="w-4 h-4 mr-2" />
              Assign Selected to Team
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg">
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedPlayers.length === filteredPlayers.length && filteredPlayers.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Parent Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Jersey #</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlayers.map(player => {
                  const team = teams.find(t => t.id === player.team_id);
                  return (
                    <TableRow key={player.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedPlayers.includes(player.id)}
                          onCheckedChange={(checked) => handleSelectPlayer(player.id, checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={player.full_name || ''}
                          onChange={(e) => handleFieldUpdate(player.id, 'full_name', e.target.value)}
                          className="min-w-[150px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={player.parent_name || ''}
                          onChange={(e) => handleFieldUpdate(player.id, 'parent_name', e.target.value)}
                          className="min-w-[150px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={player.email || ''}
                          onChange={(e) => handleFieldUpdate(player.id, 'email', e.target.value)}
                          className="min-w-[180px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={player.phone || ''}
                          onChange={(e) => handleFieldUpdate(player.id, 'phone', e.target.value)}
                          className="min-w-[120px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={player.position} 
                          onValueChange={(value) => handleFieldUpdate(player.id, 'position', value)}
                        >
                          <SelectTrigger className="min-w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Goalkeeper">Goalkeeper</SelectItem>
                            <SelectItem value="Defender">Defender</SelectItem>
                            <SelectItem value="Midfielder">Midfielder</SelectItem>
                            <SelectItem value="Forward">Forward</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={player.team_id || ''} 
                          onValueChange={(value) => handleFieldUpdate(player.id, 'team_id', value)}
                        >
                          <SelectTrigger className="min-w-[150px]">
                            <SelectValue placeholder="No team" />
                          </SelectTrigger>
                          <SelectContent>
                            {teams.map(team => (
                              <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={player.jersey_number || ''}
                          onChange={(e) => handleFieldUpdate(player.id, 'jersey_number', e.target.value)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={player.status} 
                          onValueChange={(value) => handleFieldUpdate(player.id, 'status', value)}
                        >
                          <SelectTrigger className="min-w-[110px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Injured">Injured</SelectItem>
                            <SelectItem value="Suspended">Suspended</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}