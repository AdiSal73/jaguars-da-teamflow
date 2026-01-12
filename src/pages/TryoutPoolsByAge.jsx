import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Plus, Upload, Trash2, Search, X, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { sortPlayersByTeamAndName } from '../components/utils/playerSorting';

// Calculate next year's age group based on date of birth
const calculateNextYearAgeGroup = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  
  const dob = new Date(dateOfBirth);
  const cutoffDate = new Date('2027-08-01');
  
  let age = cutoffDate.getFullYear() - dob.getFullYear();
  const monthDiff = cutoffDate.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && cutoffDate.getDate() < dob.getDate())) {
    age--;
  }
  
  return `U-${age}`;
};

export default function TryoutPoolsByAge() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedAge, setSelectedAge] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('all');
  const [filterPosition, setFilterPosition] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showBulkFromTeamsDialog, setShowBulkFromTeamsDialog] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [newPlayer, setNewPlayer] = useState({
    player_name: '',
    date_of_birth: '',
    gender: 'Female',
    primary_position: '',
    current_club: '',
    current_team: '',
    notes: ''
  });

  const { data: poolPlayers = [] } = useQuery({
    queryKey: ['tryoutPool'],
    queryFn: () => base44.entities.TryoutPool.list()
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  // Calculate next year age groups
  const poolPlayersWithAge = useMemo(() => {
    return poolPlayers.map(p => {
      const playerData = p.player_id ? players.find(pl => pl.id === p.player_id) : null;
      return {
        ...p,
        next_year_age_group: calculateNextYearAgeGroup(p.date_of_birth),
        grad_year: playerData?.grad_year || p.grad_year
      };
    });
  }, [poolPlayers, players]);

  // Group by age groups
  const ageGroups = useMemo(() => {
    const groups = {};
    poolPlayersWithAge.forEach(p => {
      const age = p.next_year_age_group || 'Unknown';
      if (!groups[age]) {
        groups[age] = [];
      }
      groups[age].push(p);
    });
    return groups;
  }, [poolPlayersWithAge]);

  // Sort age groups
  const sortedAgeGroups = useMemo(() => {
    return Object.keys(ageGroups).sort((a, b) => {
      if (a === 'Unknown') return 1;
      if (b === 'Unknown') return -1;
      const extractAge = (ag) => parseInt(ag?.match(/\d+/)?.[0] || 0);
      return extractAge(b) - extractAge(a);
    });
  }, [ageGroups]);

  // Set initial selected age
  React.useEffect(() => {
    if (!selectedAge && sortedAgeGroups.length > 0) {
      setSelectedAge(sortedAgeGroups[0]);
    }
  }, [sortedAgeGroups, selectedAge]);

  // Add to pool mutation
  const addToPoolMutation = useMutation({
    mutationFn: async (data) => {
      // Check for duplicates
      const duplicate = poolPlayers.find(pp => 
        (data.player_id && pp.player_id === data.player_id) ||
        (data.player_name && pp.player_name === data.player_name && 
         data.date_of_birth && pp.date_of_birth === data.date_of_birth)
      );
      
      if (duplicate) {
        throw new Error('This player is already in the tryout pool');
      }
      
      return base44.entities.TryoutPool.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tryoutPool']);
      setShowAddDialog(false);
      setNewPlayer({
        player_name: '',
        date_of_birth: '',
        gender: 'Female',
        primary_position: '',
        current_club: '',
        current_team: '',
        notes: ''
      });
      toast.success('Added to tryout pool');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add player');
    }
  });

  const removeFromPoolMutation = useMutation({
    mutationFn: (id) => base44.entities.TryoutPool.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['tryoutPool']);
      toast.success('Removed from pool');
    }
  });

  // CSV import handler
  const handleCSVImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csv = event.target.result;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        const imports = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          if (values.length < 2) continue;
          
          const playerData = {};
          headers.forEach((header, index) => {
            playerData[header] = values[index];
          });

          const nextYearAge = calculateNextYearAgeGroup(playerData['date_of_birth']);
          
          imports.push(base44.entities.TryoutPool.create({
            player_name: playerData['player_name'] || playerData['name'],
            player_email: playerData['player_email'] || '',
            parent_emails: playerData['parent_emails'] ? playerData['parent_emails'].split(';') : [],
            date_of_birth: playerData['date_of_birth'] || '',
            age_group: nextYearAge || '',
            gender: playerData['gender'] || 'Female',
            primary_position: playerData['primary_position'] || '',
            current_club: playerData['current_club'] || '',
            current_team: playerData['current_team'] || '',
            notes: playerData['notes'] || '',
            status: 'Pending'
          }));
        }

        await Promise.all(imports);
        queryClient.invalidateQueries(['tryoutPool']);
        setShowImportDialog(false);
        toast.success(`Imported ${imports.length} players`);
      } catch (error) {
        toast.error('Failed to import CSV');
      }
    };
    reader.readAsText(file);
  };

  // Bulk add from database
  const bulkAddFromDatabaseMutation = useMutation({
    mutationFn: async (playerIds) => {
      const playersToAdd = players.filter(p => playerIds.includes(p.id));
      const addedCount = { count: 0, skipped: 0 };
      
      await Promise.all(playersToAdd.map(async (p) => {
        // Check for duplicate
        const duplicate = poolPlayers.find(pp => pp.player_id === p.id);
        if (duplicate) {
          addedCount.skipped++;
          return;
        }
        
        const team = teams.find(t => t.id === p.team_id);
        const nextYearAge = calculateNextYearAgeGroup(p.date_of_birth);
        await base44.entities.TryoutPool.create({
          player_id: p.id,
          player_name: p.full_name,
          player_email: p.player_email || p.email,
          parent_emails: p.parent_emails || [],
          date_of_birth: p.date_of_birth,
          age_group: nextYearAge || '',
          gender: p.gender,
          primary_position: p.primary_position,
          current_team: team?.name || '',
          current_club: p.current_club || '',
          branch: p.branch,
          status: 'Pending'
        });
        addedCount.count++;
      }));
      
      return addedCount;
    },
    onSuccess: (addedCount) => {
      queryClient.invalidateQueries(['tryoutPool']);
      setShowBulkFromTeamsDialog(false);
      setSelectedPlayers([]);
      
      if (addedCount.skipped > 0) {
        toast.success(`Added ${addedCount.count} players (${addedCount.skipped} already in pool)`);
      } else {
        toast.success(`Added ${addedCount.count} players to pool`);
      }
    }
  });

  // Filter players for current age group
  const getFilteredPlayers = (ageGroup) => {
    const playersInAge = ageGroups[ageGroup] || [];
    const filtered = playersInAge.filter(p => {
      const matchesSearch = !searchTerm || p.player_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGender = filterGender === 'all' || p.gender === filterGender;
      const matchesPosition = filterPosition === 'all' || p.primary_position === filterPosition;
      return matchesSearch && matchesGender && matchesPosition;
    });
    
    // Convert to format expected by sorting utility
    const withPlayerData = filtered.map(p => {
      const playerData = p.player_id ? players.find(pl => pl.id === p.player_id) : null;
      return {
        ...p,
        full_name: p.player_name,
        team_id: playerData?.team_id,
        current_team: p.current_team || playerData?.current_team
      };
    });
    
    return sortPlayersByTeamAndName(withPlayerData, teams);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterGender('all');
    setFilterPosition('all');
  };

  const availablePlayersForAge = useMemo(() => {
    if (!selectedAge) return [];
    return players.filter(p => {
      const nextYearAge = calculateNextYearAgeGroup(p.date_of_birth);
      return nextYearAge === selectedAge && !poolPlayers.some(pp => pp.player_id === p.id);
    });
  }, [players, poolPlayers, selectedAge]);

  const uniquePositions = useMemo(() => {
    return [...new Set(poolPlayersWithAge.map(p => p.primary_position).filter(Boolean))].sort();
  }, [poolPlayersWithAge]);

  const hasActiveFilters = searchTerm || filterGender !== 'all' || filterPosition !== 'all';

  return (
    <div className="p-4 md:p-6 max-w-[1800px] mx-auto">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
            Tryout Pools by Age Group
          </h1>
          <p className="text-slate-600 mt-2">Manage tryout pools organized by 2026/2027 age groups</p>
        </div>
        <Button
          onClick={() => navigate(createPageUrl('TeamTryout'))}
          className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
        >
          <Users className="w-4 h-4 mr-2" />
          Team Assignments
        </Button>
      </div>

      <Tabs value={selectedAge} onValueChange={setSelectedAge} className="w-full">
        <TabsList className="grid w-full mb-6" style={{ gridTemplateColumns: `repeat(${sortedAgeGroups.length}, minmax(0, 1fr))` }}>
          {sortedAgeGroups.map(age => (
            <TabsTrigger key={age} value={age} className="relative">
              <div className="flex items-center gap-2">
                <span>{age}</span>
                <Badge className="bg-blue-500 text-white text-xs">{ageGroups[age].length}</Badge>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        {sortedAgeGroups.map(age => {
          const filteredPlayers = getFilteredPlayers(age);
          
          return (
            <TabsContent key={age} value={age}>
              <Card className="border-2 border-blue-400 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-6 h-6" />
                      <span>{age} Tryout Pool</span>
                      <Badge className="bg-white text-blue-700 text-lg px-3">{filteredPlayers.length}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setSelectedAge(age);
                          setShowBulkFromTeamsDialog(true);
                        }}
                        size="sm"
                        className="bg-white/20 hover:bg-white/30 text-white"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        From Database
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedAge(age);
                          setShowImportDialog(true);
                        }}
                        size="sm"
                        className="bg-white/20 hover:bg-white/30 text-white"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Import CSV
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedAge(age);
                          setShowAddDialog(true);
                        }}
                        size="sm"
                        className="bg-white/20 hover:bg-white/30 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Player
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Filters */}
                  <div className="mb-6 p-4 bg-white rounded-lg border-2 border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-semibold text-slate-700">Filter Players</Label>
                      {hasActiveFilters && (
                        <Button
                          onClick={clearFilters}
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Clear Filters
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          placeholder="Search players..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 h-9"
                        />
                      </div>
                      <Select value={filterGender} onValueChange={setFilterGender}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Genders</SelectItem>
                          <SelectItem value="Female">Girls</SelectItem>
                          <SelectItem value="Male">Boys</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={filterPosition} onValueChange={setFilterPosition}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Position" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Positions</SelectItem>
                          {uniquePositions.map(pos => (
                            <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Players Grid */}
                  {filteredPlayers.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <Users className="w-16 h-16 mx-auto mb-4 opacity-40" />
                      <p className="text-lg mb-2">No players in {age} pool</p>
                      <p className="text-sm">Use the buttons above to add players</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredPlayers.map(player => {
                        const playerData = player.player_id ? players.find(p => p.id === player.player_id) : null;
                        
                        return (
                          <Card
                            key={player.id}
                            className="border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer"
                            onClick={() => {
                              if (playerData?.id) {
                                navigate(`${createPageUrl('PlayerDashboard')}?id=${playerData.id}`);
                              }
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h3 className="font-bold text-slate-900">{player.player_name}</h3>
                                  <div className="flex gap-1 mt-2 flex-wrap">
                                    {player.gender && (
                                      <Badge className="bg-slate-100 text-slate-700 text-xs">
                                        {player.gender}
                                      </Badge>
                                    )}
                                    {player.next_year_age_group && (
                                      <Badge className="bg-purple-100 text-purple-800 text-xs">
                                        {player.next_year_age_group}
                                      </Badge>
                                    )}
                                    {player.grad_year && (
                                      <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold">
                                        {player.grad_year}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeFromPoolMutation.mutate(player.id);
                                  }}
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              
                              {player.primary_position && (
                                <div className="mb-2">
                                  <Badge className="bg-blue-500 text-white">
                                    {player.primary_position}
                                  </Badge>
                                </div>
                              )}
                              
                              {player.current_team && (
                                <p className="text-xs text-slate-600 mb-1">
                                  Current: {player.current_team}
                                </p>
                              )}
                              
                              {player.current_club && (
                                <p className="text-xs text-slate-600 mb-1">
                                  Club: {player.current_club}
                                </p>
                              )}
                              
                              {player.next_year_team && (
                                <div className="mt-2 pt-2 border-t border-blue-200">
                                  <p className="text-xs font-semibold text-green-700">
                                    Assigned: {player.next_year_team}
                                  </p>
                                </div>
                              )}
                              
                              <div className="mt-2">
                                <Badge className={`text-xs ${
                                  player.status === 'Confirmed' ? 'bg-green-500 text-white' :
                                  player.status === 'Invited' ? 'bg-blue-500 text-white' :
                                  'bg-slate-400 text-white'
                                }`}>
                                  {player.status}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Add Player Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Player to {selectedAge} Tryout Pool</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Player Name *</Label>
              <Input
                value={newPlayer.player_name}
                onChange={(e) => setNewPlayer({...newPlayer, player_name: e.target.value})}
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs">Date of Birth</Label>
              <Input
                type="date"
                value={newPlayer.date_of_birth}
                onChange={(e) => setNewPlayer({...newPlayer, date_of_birth: e.target.value})}
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs">Gender</Label>
              <Select value={newPlayer.gender} onValueChange={(v) => setNewPlayer({...newPlayer, gender: v})}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Primary Position</Label>
              <Select value={newPlayer.primary_position} onValueChange={(v) => setNewPlayer({...newPlayer, primary_position: v})}>
                <SelectTrigger className="h-9">
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
              <Label className="text-xs">Current Club</Label>
              <Input
                value={newPlayer.current_club}
                onChange={(e) => setNewPlayer({...newPlayer, current_club: e.target.value})}
                placeholder="e.g., Ohio Premier"
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs">Current Team</Label>
              <Input
                value={newPlayer.current_team}
                onChange={(e) => setNewPlayer({...newPlayer, current_team: e.target.value})}
                placeholder="e.g., U17 Red"
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea
                value={newPlayer.notes}
                onChange={(e) => setNewPlayer({...newPlayer, notes: e.target.value})}
                rows={3}
                className="text-xs"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const nextYearAge = calculateNextYearAgeGroup(newPlayer.date_of_birth);
                  addToPoolMutation.mutate({
                    ...newPlayer,
                    age_group: nextYearAge || selectedAge
                  });
                }}
                disabled={!newPlayer.player_name}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Add to Pool
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* CSV Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Players from CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-slate-700 mb-2 font-semibold">CSV Format:</p>
              <p className="text-xs text-slate-600">player_name, date_of_birth, gender, primary_position, current_club, current_team, notes</p>
              <p className="text-xs text-slate-500 mt-2">Age groups will be calculated automatically from date of birth</p>
            </div>
            <Input
              type="file"
              accept=".csv"
              onChange={handleCSVImport}
              className="h-10"
            />
            <Button variant="outline" onClick={() => setShowImportDialog(false)} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Add from Database Dialog */}
      <Dialog open={showBulkFromTeamsDialog} onOpenChange={setShowBulkFromTeamsDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Players to {selectedAge} Pool from Database</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-slate-700">
                Select existing players from the database to add to the {selectedAge} tryout pool
              </p>
            </div>

            {availablePlayersForAge.length === 0 ? (
              <p className="text-center py-8 text-slate-400 text-sm">
                No players available for {selectedAge} or all already in pool
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-sm font-semibold text-blue-900">
                    {availablePlayersForAge.length} players available
                  </span>
                  <Button
                    onClick={() => {
                      if (selectedPlayers.length === availablePlayersForAge.length) {
                        setSelectedPlayers([]);
                      } else {
                        setSelectedPlayers(availablePlayersForAge.map(p => p.id));
                      }
                    }}
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                  >
                    {selectedPlayers.length === availablePlayersForAge.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {sortPlayersByTeamAndName(availablePlayersForAge, teams).map(player => {
                    const team = teams.find(t => t.id === player.team_id);
                    const isSelected = selectedPlayers.includes(player.id);
                    
                    return (
                      <div
                        key={player.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-blue-300'
                        }`}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedPlayers(selectedPlayers.filter(id => id !== player.id));
                          } else {
                            setSelectedPlayers([...selectedPlayers, player.id]);
                          }
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-5 h-5 flex-shrink-0"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-sm">
                              {player.full_name}
                              {player.grad_year && <span className="text-xs text-slate-500 ml-1">• {player.grad_year}</span>}
                            </div>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {player.age_group && <Badge className="bg-slate-100 text-slate-700 text-xs">{player.age_group} (current)</Badge>}
                              {player.primary_position && <Badge className="bg-blue-100 text-blue-800 text-xs">{player.primary_position}</Badge>}
                              {team && <Badge className="bg-slate-200 text-slate-700 text-xs">{team.name}</Badge>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-2 pt-2 sticky bottom-0 bg-white">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowBulkFromTeamsDialog(false);
                      setSelectedPlayers([]);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => bulkAddFromDatabaseMutation.mutate(selectedPlayers)}
                    disabled={selectedPlayers.length === 0}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Add {selectedPlayers.length} Player{selectedPlayers.length !== 1 ? 's' : ''}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}