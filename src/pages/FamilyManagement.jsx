import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Users, Plus, Edit, Trophy, Calendar, Activity, 
  Mail, Phone, MapPin, ChevronRight, Star, User
} from 'lucide-react';
import { toast } from 'sonner';

export default function FamilyManagement() {
  const queryClient = useQueryClient();
  const [showAddPlayerDialog, setShowAddPlayerDialog] = useState(false);
  const [showEditPlayerDialog, setShowEditPlayerDialog] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list(),
    enabled: !!user
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list(),
    enabled: !!user
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => base44.entities.Booking.list('-booking_date'),
    enabled: !!user
  });

  // Get parent's players
  const myPlayers = players.filter(p => 
    user?.player_ids?.includes(p.id) || 
    p.parent_emails?.some(e => e?.toLowerCase() === user?.email?.toLowerCase()) ||
    p.email?.toLowerCase() === user?.email?.toLowerCase()
  );

  const [playerForm, setPlayerForm] = useState({
    full_name: '',
    date_of_birth: '',
    gender: '',
    primary_position: '',
    email: '',
    phone: '',
    parent_emails: [user?.email || '']
  });

  const createPlayerMutation = useMutation({
    mutationFn: (data) => base44.entities.Player.create(data),
    onSuccess: async (newPlayer) => {
      // Update parent's player_ids
      const currentPlayerIds = user.player_ids || [];
      await base44.auth.updateMe({
        player_ids: [...currentPlayerIds, newPlayer.id]
      });
      
      queryClient.invalidateQueries(['players']);
      queryClient.invalidateQueries(['currentUser']);
      setShowAddPlayerDialog(false);
      resetForm();
      toast.success('Player added successfully');
    },
    onError: (error) => {
      toast.error(`Failed to add player: ${error.message}`);
    }
  });

  const updatePlayerMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Player.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['players']);
      setShowEditPlayerDialog(false);
      setSelectedPlayer(null);
      toast.success('Player updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update player: ${error.message}`);
    }
  });

  const resetForm = () => {
    setPlayerForm({
      full_name: '',
      date_of_birth: '',
      gender: '',
      primary_position: '',
      email: '',
      phone: '',
      parent_emails: [user?.email || '']
    });
  };

  const handleAddPlayer = () => {
    if (!playerForm.full_name || !playerForm.gender) {
      toast.error('Please fill in required fields');
      return;
    }
    createPlayerMutation.mutate(playerForm);
  };

  const handleEditClick = (player) => {
    setSelectedPlayer(player);
    setPlayerForm({
      full_name: player.full_name || '',
      date_of_birth: player.date_of_birth || '',
      gender: player.gender || '',
      primary_position: player.primary_position || '',
      email: player.email || '',
      phone: player.phone || '',
      parent_emails: player.parent_emails || [user?.email]
    });
    setShowEditPlayerDialog(true);
  };

  const handleUpdatePlayer = () => {
    if (!playerForm.full_name || !playerForm.gender) {
      toast.error('Please fill in required fields');
      return;
    }
    updatePlayerMutation.mutate({
      id: selectedPlayer.id,
      data: playerForm
    });
  };

  const getUpcomingBookingsCount = (playerId) => {
    const today = new Date().toISOString().split('T')[0];
    return bookings.filter(b => 
      b.player_id === playerId && 
      b.booking_date >= today && 
      b.status !== 'cancelled'
    ).length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-2">
                Family Management
              </h1>
              <p className="text-slate-600">Manage all your children's profiles and track their development</p>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setShowAddPlayerDialog(true);
              }}
              className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Player
            </Button>
          </div>
        </div>

        {/* Players Grid */}
        {myPlayers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myPlayers.map(player => {
              const team = teams.find(t => t.id === player.team_id);
              const upcomingCount = getUpcomingBookingsCount(player.id);
              
              return (
                <Card key={player.id} className="border-none shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-white to-slate-50 overflow-hidden group">
                  <div className="h-2 bg-gradient-to-r from-emerald-500 to-blue-500"></div>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                          {player.full_name?.charAt(0)}
                        </div>
                        <div>
                          <CardTitle className="text-xl">{player.full_name}</CardTitle>
                          {team && (
                            <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                              <Trophy className="w-3 h-3" />
                              {team.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(player)}
                        className="text-slate-400 hover:text-emerald-600"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Player Info */}
                    <div className="space-y-2">
                      {player.age_group && (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                            {player.age_group}
                          </Badge>
                          {player.primary_position && (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                              {player.primary_position}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {player.email && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail className="w-3 h-3" />
                          {player.email}
                        </div>
                      )}
                      
                      {player.phone && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone className="w-3 h-3" />
                          {player.phone}
                        </div>
                      )}
                    </div>

                    {/* Quick Stats */}
                    <div className="flex items-center gap-4 pt-3 border-t border-slate-200">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                        <span className="font-semibold">{upcomingCount}</span>
                        <span className="text-slate-600">sessions</span>
                      </div>
                      {player.status && (
                        <Badge variant="outline" className={
                          player.status === 'Active' ? 'border-green-300 text-green-700 bg-green-50' :
                          player.status === 'Injured' ? 'border-red-300 text-red-700 bg-red-50' :
                          'border-slate-300 text-slate-700 bg-slate-50'
                        }>
                          {player.status}
                        </Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 pt-3">
                      <Link to={`${createPageUrl('PlayerDashboard')}?id=${player.id}`}>
                        <Button variant="outline" className="w-full">
                          <Activity className="w-4 h-4 mr-2" />
                          Dashboard
                        </Button>
                      </Link>
                      <Link to={createPageUrl('Bookingpage')}>
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                          <Calendar className="w-4 h-4 mr-2" />
                          Book
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-none shadow-lg">
            <CardContent className="p-12 text-center">
              <Users className="w-20 h-20 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Players Added Yet</h3>
              <p className="text-slate-600 mb-6">Add your first player to start tracking their development</p>
              <Button
                onClick={() => {
                  resetForm();
                  setShowAddPlayerDialog(true);
                }}
                className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Player
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add Player Dialog */}
        <Dialog open={showAddPlayerDialog} onOpenChange={setShowAddPlayerDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                Add New Player
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={playerForm.full_name}
                  onChange={e => setPlayerForm({...playerForm, full_name: e.target.value})}
                  placeholder="Enter player's full name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={playerForm.date_of_birth}
                    onChange={e => setPlayerForm({...playerForm, date_of_birth: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Gender *</Label>
                  <Select value={playerForm.gender} onValueChange={v => setPlayerForm({...playerForm, gender: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Primary Position</Label>
                <Select value={playerForm.primary_position} onValueChange={v => setPlayerForm({...playerForm, primary_position: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GK">GK</SelectItem>
                    <SelectItem value="Right Outside Back">Right Outside Back</SelectItem>
                    <SelectItem value="Left Outside Back">Left Outside Back</SelectItem>
                    <SelectItem value="Right Centerback">Right Centerback</SelectItem>
                    <SelectItem value="Left Centerback">Left Centerback</SelectItem>
                    <SelectItem value="Defensive Midfielder">Defensive Midfielder</SelectItem>
                    <SelectItem value="Right Winger">Right Winger</SelectItem>
                    <SelectItem value="Center Midfielder">Center Midfielder</SelectItem>
                    <SelectItem value="Forward">Forward</SelectItem>
                    <SelectItem value="Attacking Midfielder">Attacking Midfielder</SelectItem>
                    <SelectItem value="Left Winger">Left Winger</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email (Optional)</Label>
                  <Input
                    type="email"
                    value={playerForm.email}
                    onChange={e => setPlayerForm({...playerForm, email: e.target.value})}
                    placeholder="player@email.com"
                  />
                </div>
                <div>
                  <Label>Phone (Optional)</Label>
                  <Input
                    type="tel"
                    value={playerForm.phone}
                    onChange={e => setPlayerForm({...playerForm, phone: e.target.value})}
                    placeholder="(123) 456-7890"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddPlayerDialog(false);
                    resetForm();
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddPlayer}
                  disabled={!playerForm.full_name || !playerForm.gender}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                >
                  Add Player
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Player Dialog */}
        <Dialog open={showEditPlayerDialog} onOpenChange={setShowEditPlayerDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                Edit Player
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={playerForm.full_name}
                  onChange={e => setPlayerForm({...playerForm, full_name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={playerForm.date_of_birth}
                    onChange={e => setPlayerForm({...playerForm, date_of_birth: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Gender *</Label>
                  <Select value={playerForm.gender} onValueChange={v => setPlayerForm({...playerForm, gender: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Primary Position</Label>
                <Select value={playerForm.primary_position} onValueChange={v => setPlayerForm({...playerForm, primary_position: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GK">GK</SelectItem>
                    <SelectItem value="Right Outside Back">Right Outside Back</SelectItem>
                    <SelectItem value="Left Outside Back">Left Outside Back</SelectItem>
                    <SelectItem value="Right Centerback">Right Centerback</SelectItem>
                    <SelectItem value="Left Centerback">Left Centerback</SelectItem>
                    <SelectItem value="Defensive Midfielder">Defensive Midfielder</SelectItem>
                    <SelectItem value="Right Winger">Right Winger</SelectItem>
                    <SelectItem value="Center Midfielder">Center Midfielder</SelectItem>
                    <SelectItem value="Forward">Forward</SelectItem>
                    <SelectItem value="Attacking Midfielder">Attacking Midfielder</SelectItem>
                    <SelectItem value="Left Winger">Left Winger</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={playerForm.email}
                    onChange={e => setPlayerForm({...playerForm, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={playerForm.phone}
                    onChange={e => setPlayerForm({...playerForm, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditPlayerDialog(false);
                    setSelectedPlayer(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdatePlayer}
                  disabled={!playerForm.full_name || !playerForm.gender}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}