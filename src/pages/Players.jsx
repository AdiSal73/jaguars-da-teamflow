import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Plus, Search, User, Edit, Users, Trash2, Upload } from 'lucide-react';
import BulkImportPlayers from '../components/players/BulkImportPlayers';
import { getPositionBorderColor } from '../components/player/positionColors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Players() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterAgeGroup, setFilterAgeGroup] = useState('all');
  const [filterGender, setFilterGender] = useState('all');

  // Check URL params for gender filter
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const genderParam = params.get('gender');
    if (genderParam) {
      setFilterGender(genderParam);
    }
  }, []);
  const [showDialog, setShowDialog] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [bulkTeamId, setBulkTeamId] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [playerForm, setPlayerForm] = useState({
    full_name: '',
    parent_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: 'Female',
    grade: '',
    primary_position: 'Center Midfielder',
    secondary_position: '',
    preferred_foot: '',
    jersey_number: '',
    team_id: '',
    status: 'Active',
    is_tryout_player: false,
    tryout_notes: ''
  });

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: players = [], isLoading } = useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const allPlayers = await base44.entities.Player.list('-created_date');
      if (user?.role === 'admin') return allPlayers;
      if (user?.role === 'coach') {
        const coaches = await base44.entities.Coach.list();
        const currentCoach = coaches.find(c => c.email === user.email);
        if (currentCoach?.team_ids) {
          return allPlayers.filter(p => currentCoach.team_ids.includes(p.team_id));
        }
      }
      return [];
    },
    enabled: !!user
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const allTeams = await base44.entities.Team.list();
      if (user?.role === 'admin') return allTeams;
      if (user?.role === 'coach') {
        const coaches = await base44.entities.Coach.list();
        const currentCoach = coaches.find(c => c.email === user.email);
        if (currentCoach?.team_ids) {
          return allTeams.filter(t => currentCoach.team_ids.includes(t.id));
        }
      }
      return [];
    },
    enabled: !!user
  });

  const { data: tryouts = [] } = useQuery({
    queryKey: ['tryouts'],
    queryFn: () => base44.entities.PlayerTryout.list(),
    enabled: !!user
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

  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      for (const playerId of selectedPlayers) {
        await base44.entities.Player.delete(playerId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['players']);
      setSelectedPlayers([]);
      setShowDeleteDialog(false);
    }
  });

  const bulkImportHandlers = {
    createPlayers: async (players) => {
      for (const player of players) {
        await base44.entities.Player.create(player);
      }
    },
    createTeam: async (teamData) => {
      return await base44.entities.Team.create(teamData);
    }
  };

  const resetForm = () => {
    setPlayerForm({
      full_name: '',
      parent_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      gender: 'Female',
      grade: '',
      primary_position: 'Center Midfielder',
      secondary_position: '',
      preferred_foot: '',
      jersey_number: '',
      team_id: '',
      status: 'Active',
      is_tryout_player: false,
      tryout_notes: ''
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
      primary_position: player.primary_position || 'Center Midfielder',
      secondary_position: player.secondary_position || '',
      preferred_foot: player.preferred_foot || '',
      jersey_number: player.jersey_number || '',
      team_id: player.team_id || '',
      status: player.status || 'Active',
      is_tryout_player: player.is_tryout_player || false,
      tryout_notes: player.tryout_notes || ''
      });
      setShowDialog(true);
  };

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

  const filteredPlayers = players
    .filter(player => {
      const matchesSearch = player.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTeam = filterTeam === 'all' || player.team_id === filterTeam;
      const team = teams.find(t => t.id === player.team_id);
      const matchesAgeGroup = filterAgeGroup === 'all' || team?.age_group === filterAgeGroup;
      const matchesGender = filterGender === 'all' || team?.gender === filterGender || player.gender === filterGender;
      return matchesSearch && matchesTeam && matchesAgeGroup && matchesGender;
    })
    .sort((a, b) => {
      // Sort by team first
      const teamA = teams.find(t => t.id === a.team_id);
      const teamB = teams.find(t => t.id === b.team_id);
      const teamCompare = (teamA?.name || '').localeCompare(teamB?.name || '');
      if (teamCompare !== 0) return teamCompare;
      
      // Then alphabetically by last name
      const lastNameA = a.full_name?.split(' ').pop() || '';
      const lastNameB = b.full_name?.split(' ').pop() || '';
      return lastNameA.localeCompare(lastNameB);
    });

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
        <div className="flex gap-2">
          <Button onClick={() => setShowBulkImport(true)} variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Import
          </Button>
          <Button onClick={() => { setEditingPlayer(null); resetForm(); setShowDialog(true); }} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Player
          </Button>
        </div>
      </div>

      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label className="mb-2 block">Filter by Team</Label>
            <Select value={filterTeam} onValueChange={setFilterTeam}>
              <SelectTrigger>
                <SelectValue placeholder="All Teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map(team => (
                  <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
              <Label className="mb-2 block">Filter by Age Group</Label>
              <Select value={filterAgeGroup} onValueChange={setFilterAgeGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="All Age Groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Age Groups</SelectItem>
                  {[...new Set(teams.map(t => t.age_group).filter(Boolean))].sort((a, b) => {
                    const extractAge = (ag) => {
                      const match = ag?.match(/U-?(\d+)/i);
                      return match ? parseInt(match[1]) : 0;
                    };
                    return extractAge(b) - extractAge(a);
                  }).map(ageGroup => (
                    <SelectItem key={ageGroup} value={ageGroup}>{ageGroup}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Filter by Gender</Label>
              <Select value={filterGender} onValueChange={setFilterGender}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Female">Girls</SelectItem>
                  <SelectItem value="Male">Boys</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          </div>

      <Tabs defaultValue="cards" className="w-full">
        <TabsList>
          <TabsTrigger value="cards">Card View</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
        </TabsList>

        <TabsContent value="cards">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlayers.map(player => {
              const team = teams.find(t => t.id === player.team_id);
              const tryout = tryouts.find(t => t.player_id === player.id);
              const birthYear = player.date_of_birth ? new Date(player.date_of_birth).getFullYear() : null;
              return (
                <div key={player.id} className="relative group">
                  <Link to={`${createPageUrl('PlayerDashboard')}?id=${player.id}`}>
                    <Card className={`hover:shadow-lg transition-all duration-300 border-2 ${getPositionBorderColor(player.primary_position)}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                            {player.jersey_number || <User className="w-8 h-8" />}
                          </div>
                          <div className="flex-1">
                           <h3 className="font-bold text-lg text-slate-900">{player.full_name}</h3>
                           <p className="text-sm text-slate-600 mb-1">{player.primary_position || 'No position'}</p>
                           <div className="text-xs text-slate-500 mb-2">
                             {birthYear && <span>{birthYear}</span>}
                             {birthYear && team && <span> • </span>}
                             {team && <span>{team.name}</span>}
                             {team?.league && <span> • {team.league}</span>}
                           </div>
                           <div className="flex flex-wrap gap-1">
                             <Badge className={statusColors[player.status]}>{player.status}</Badge>
                             {tryout?.team_role && (
                               <Badge className="bg-purple-100 text-purple-800 text-[10px]">{tryout.team_role}</Badge>
                             )}
                             {tryout?.recommendation && (
                               <Badge className={`text-[10px] ${
                                 tryout.recommendation === 'Move up' ? 'bg-emerald-100 text-emerald-800' :
                                 tryout.recommendation === 'Move down' ? 'bg-orange-100 text-orange-800' :
                                 'bg-blue-100 text-blue-800'
                               }`}>
                                 {tryout.recommendation}
                               </Badge>
                             )}
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
        </TabsContent>

        <TabsContent value="table">
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
                <Button 
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={selectedPlayers.length === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
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
                    {filteredPlayers.map(player => (
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
                            value={player.primary_position || ''} 
                            onValueChange={(value) => handleFieldUpdate(player.id, 'primary_position', value)}
                          >
                            <SelectTrigger className="min-w-[180px]">
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
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <div className="w-2 h-8 bg-gradient-to-b from-emerald-500 to-blue-500 rounded-full" />
              {editingPlayer ? 'Edit Player' : 'Add New Player'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6 mt-6">
            <div className="col-span-2">
              <Label className="font-semibold text-slate-700">Full Name *</Label>
              <Input
                value={playerForm.full_name}
                onChange={(e) => setPlayerForm({...playerForm, full_name: e.target.value})}
                placeholder="Enter full name"
                className="border-2 h-12 mt-2"
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
            {/* Added Parent Name and Email editing as requested */}
            {/* These were already present in the form, confirming they are editable */}
            <div>
              <Label>Primary Position *</Label>
              <Select value={playerForm.primary_position} onValueChange={(value) => setPlayerForm({...playerForm, primary_position: value})}>
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
            {playerForm.is_tryout_player && (
              <div className="col-span-2">
                <Label>Tryout Notes</Label>
                <Input
                  value={playerForm.tryout_notes}
                  onChange={(e) => setPlayerForm({...playerForm, tryout_notes: e.target.value})}
                  placeholder="Notes about this tryout player"
                />
              </div>
            )}
            </div>
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
            <Button variant="outline" onClick={() => setShowDialog(false)} className="h-12 px-8">Cancel</Button>
            <Button 
              onClick={handleSave}
              disabled={!playerForm.full_name}
              className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 h-12 px-8 text-base font-semibold shadow-lg"
            >
              {editingPlayer ? 'Update Player' : 'Add Player'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedPlayers.length} Players?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected players and all their associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => bulkDeleteMutation.mutate()} className="bg-red-600 hover:bg-red-700">
              Delete Players
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
        <DialogContent className="max-w-3xl">
          <BulkImportPlayers 
            teams={teams}
            onImportComplete={bulkImportHandlers}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}