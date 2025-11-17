import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Plus, Search, User, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [playerForm, setPlayerForm] = useState({
    full_name: '',
    parent_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    grade: '',
    position: 'Midfielder',
    secondary_position: '',
    preferred_foot: '',
    jersey_number: '',
    height: '',
    weight: '',
    team_id: '',
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
      resetForm();
    }
  });

  const updatePlayerMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Player.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['players']);
      setShowDialog(false);
      setEditingPlayer(null);
      resetForm();
    }
  });

  const resetForm = () => {
    setPlayerForm({
      full_name: '',
      parent_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      gender: '',
      grade: '',
      position: 'Midfielder',
      secondary_position: '',
      preferred_foot: '',
      jersey_number: '',
      height: '',
      weight: '',
      team_id: '',
      status: 'Active'
    });
  };

  const handleSave = () => {
    if (editingPlayer) {
      updatePlayerMutation.mutate({ id: editingPlayer.id, data: playerForm });
    } else {
      createPlayerMutation.mutate(playerForm);
    }
  };

  const handleEditClick = (e, player) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingPlayer(player);
    setPlayerForm({
      full_name: player.full_name || '',
      parent_name: player.parent_name || '',
      email: player.email || '',
      phone: player.phone || '',
      date_of_birth: player.date_of_birth || '',
      gender: player.gender || '',
      grade: player.grade || '',
      position: player.position || 'Midfielder',
      secondary_position: player.secondary_position || '',
      preferred_foot: player.preferred_foot || '',
      jersey_number: player.jersey_number || '',
      height: player.height || '',
      weight: player.weight || '',
      team_id: player.team_id || '',
      status: player.status || 'Active'
    });
    setShowDialog(true);
  };

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
        <Button onClick={() => { setEditingPlayer(null); resetForm(); setShowDialog(true); }} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Player
        </Button>
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
            <div key={player.id} className="relative group">
              <Link to={`${createPageUrl('PlayerProfile')}?id=${player.id}`}>
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
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-md hover:bg-slate-100"
                onClick={(e) => handleEditClick(e, player)}
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          );
        })}
      </div>

      {filteredPlayers.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-slate-500">No players found</p>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlayer ? 'Edit Player' : 'Add New Player'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="col-span-2">
              <Label>Full Name *</Label>
              <Input
                value={playerForm.full_name}
                onChange={(e) => setPlayerForm({...playerForm, full_name: e.target.value})}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label>Parent Name</Label>
              <Input
                value={playerForm.parent_name}
                onChange={(e) => setPlayerForm({...playerForm, parent_name: e.target.value})}
                placeholder="Parent's name"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={playerForm.email}
                onChange={(e) => setPlayerForm({...playerForm, email: e.target.value})}
                placeholder="player@email.com"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={playerForm.phone}
                onChange={(e) => setPlayerForm({...playerForm, phone: e.target.value})}
                placeholder="+1234567890"
              />
            </div>
            <div>
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={playerForm.date_of_birth}
                onChange={(e) => setPlayerForm({...playerForm, date_of_birth: e.target.value})}
              />
            </div>
            <div>
              <Label>Gender</Label>
              <Select value={playerForm.gender} onValueChange={(value) => setPlayerForm({...playerForm, gender: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Grade</Label>
              <Input
                value={playerForm.grade}
                onChange={(e) => setPlayerForm({...playerForm, grade: e.target.value})}
                placeholder="e.g., 10"
              />
            </div>
            <div>
              <Label>Primary Position *</Label>
              <Select value={playerForm.position} onValueChange={(value) => setPlayerForm({...playerForm, position: value})}>
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
              <Label>Secondary Position</Label>
              <Input
                value={playerForm.secondary_position}
                onChange={(e) => setPlayerForm({...playerForm, secondary_position: e.target.value})}
                placeholder="e.g., Forward"
              />
            </div>
            <div>
              <Label>Preferred Foot</Label>
              <Select value={playerForm.preferred_foot} onValueChange={(value) => setPlayerForm({...playerForm, preferred_foot: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select foot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Left">Left</SelectItem>
                  <SelectItem value="Right">Right</SelectItem>
                  <SelectItem value="Both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Jersey Number</Label>
              <Input
                type="number"
                value={playerForm.jersey_number}
                onChange={(e) => setPlayerForm({...playerForm, jersey_number: e.target.value})}
                placeholder="7"
              />
            </div>
            <div>
              <Label>Height (cm)</Label>
              <Input
                type="number"
                value={playerForm.height}
                onChange={(e) => setPlayerForm({...playerForm, height: e.target.value})}
                placeholder="180"
              />
            </div>
            <div>
              <Label>Weight (kg)</Label>
              <Input
                type="number"
                value={playerForm.weight}
                onChange={(e) => setPlayerForm({...playerForm, weight: e.target.value})}
                placeholder="75"
              />
            </div>
            <div>
              <Label>Team</Label>
              <Select value={playerForm.team_id} onValueChange={(value) => setPlayerForm({...playerForm, team_id: value})}>
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
            <div>
              <Label>Status</Label>
              <Select value={playerForm.status} onValueChange={(value) => setPlayerForm({...playerForm, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Injured">Injured</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleSave}
              disabled={!playerForm.full_name || !playerForm.position}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {editingPlayer ? 'Update Player' : 'Add Player'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}