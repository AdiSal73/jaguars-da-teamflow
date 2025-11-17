import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Plus, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function Players() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    position: 'Midfielder',
    jersey_number: '',
    height: '',
    weight: '',
    status: 'Active'
  });

  const queryClient = useQueryClient();

  const { data: players = [], isLoading } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list('-created_date')
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const createPlayerMutation = useMutation({
    mutationFn: (data) => base44.entities.Player.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['players']);
      setShowDialog(false);
      setNewPlayer({
        full_name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        position: 'Midfielder',
        jersey_number: '',
        height: '',
        weight: '',
        status: 'Active'
      });
    }
  });

  const filteredPlayers = players.filter(player =>
    player.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors = {
    'Active': 'bg-emerald-100 text-emerald-800',
    'Injured': 'bg-red-100 text-red-800',
    'Suspended': 'bg-yellow-100 text-yellow-800',
    'Inactive': 'bg-slate-100 text-slate-800'
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Players</h1>
          <p className="text-slate-600 mt-1">Manage your club's player roster</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Player
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Player</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="col-span-2">
                <Label>Full Name *</Label>
                <Input
                  value={newPlayer.full_name}
                  onChange={(e) => setNewPlayer({...newPlayer, full_name: e.target.value})}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newPlayer.email}
                  onChange={(e) => setNewPlayer({...newPlayer, email: e.target.value})}
                  placeholder="player@email.com"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={newPlayer.phone}
                  onChange={(e) => setNewPlayer({...newPlayer, phone: e.target.value})}
                  placeholder="+1234567890"
                />
              </div>
              <div>
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={newPlayer.date_of_birth}
                  onChange={(e) => setNewPlayer({...newPlayer, date_of_birth: e.target.value})}
                />
              </div>
              <div>
                <Label>Position *</Label>
                <Select value={newPlayer.position} onValueChange={(value) => setNewPlayer({...newPlayer, position: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Goalkeeper">Goalkeeper</SelectItem>
                    <SelectItem value="Defender">Defender</SelectItem>
                    <SelectItem value="Midfielder">Midfielder</SelectItem>
                    <SelectItem value="Forward">Forward</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Jersey Number</Label>
                <Input
                  type="number"
                  value={newPlayer.jersey_number}
                  onChange={(e) => setNewPlayer({...newPlayer, jersey_number: e.target.value})}
                  placeholder="7"
                />
              </div>
              <div>
                <Label>Height (cm)</Label>
                <Input
                  type="number"
                  value={newPlayer.height}
                  onChange={(e) => setNewPlayer({...newPlayer, height: e.target.value})}
                  placeholder="180"
                />
              </div>
              <div>
                <Label>Weight (kg)</Label>
                <Input
                  type="number"
                  value={newPlayer.weight}
                  onChange={(e) => setNewPlayer({...newPlayer, weight: e.target.value})}
                  placeholder="75"
                />
              </div>
              <div>
                <Label>Team</Label>
                <Select value={newPlayer.team_id} onValueChange={(value) => setNewPlayer({...newPlayer, team_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button 
                onClick={() => createPlayerMutation.mutate(newPlayer)}
                disabled={!newPlayer.full_name || !newPlayer.position}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Add Player
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlayers.map(player => {
          const team = teams.find(t => t.id === player.team_id);
          return (
            <Link key={player.id} to={`${createPageUrl('PlayerProfile')}?id=${player.id}`}>
              <Card className="hover:shadow-lg transition-all duration-300 border-none">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {player.jersey_number || <User className="w-8 h-8" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-slate-900">{player.full_name}</h3>
                      <p className="text-sm text-slate-600 mb-2">{player.position}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={statusColors[player.status]}>{player.status}</Badge>
                        {team && <Badge variant="outline">{team.name}</Badge>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {filteredPlayers.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-slate-500">No players found</p>
        </div>
      )}
    </div>
  );
}