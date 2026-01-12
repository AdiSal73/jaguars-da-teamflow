import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Plus, Users, Search, Filter, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Draggable, Droppable } from '@hello-pangea/dnd';

export default function TryoutPoolManager({ onAddToTeam }) {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showBulkFromTeamsDialog, setShowBulkFromTeamsDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('all');
  const [filterAgeGroup, setFilterAgeGroup] = useState('all');
  const [selectedPoolPlayers, setSelectedPoolPlayers] = useState([]);
  const [bulkTeamFilter, setBulkTeamFilter] = useState('all');
  const [bulkAgeFilter, setBulkAgeFilter] = useState('all');
  
  const [newPlayer, setNewPlayer] = useState({
    player_name: '',
    player_email: '',
    parent_emails: [],
    date_of_birth: '',
    gender: 'Female',
    primary_position: '',
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

  const addToPoolMutation = useMutation({
    mutationFn: (data) => base44.entities.TryoutPool.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tryoutPool']);
      setShowAddDialog(false);
      setNewPlayer({
        player_name: '',
        player_email: '',
        parent_emails: [],
        date_of_birth: '',
        gender: 'Female',
        primary_position: '',
        notes: ''
      });
      toast.success('Added to tryout pool');
    }
  });

  const removeFromPoolMutation = useMutation({
    mutationFn: (id) => base44.entities.TryoutPool.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['tryoutPool']);
      toast.success('Removed from pool');
    }
  });

  const bulkAddFromDatabaseMutation = useMutation({
    mutationFn: async (playerIds) => {
      const playersToAdd = players.filter(p => playerIds.includes(p.id));
      await Promise.all(playersToAdd.map(p => {
        const team = teams.find(t => t.id === p.team_id);
        return base44.entities.TryoutPool.create({
          player_id: p.id,
          player_name: p.full_name,
          player_email: p.player_email || p.email,
          parent_emails: p.parent_emails || [],
          date_of_birth: p.date_of_birth,
          age_group: p.age_group,
          gender: p.gender,
          primary_position: p.primary_position,
          current_team: team?.name || '',
          branch: p.branch,
          status: 'Pending'
        });
      }));
    },
    onSuccess: (_, playerIds) => {
      queryClient.invalidateQueries(['tryoutPool']);
      setShowFilterDialog(false);
      setShowBulkFromTeamsDialog(false);
      setSelectedPoolPlayers([]);
      setBulkTeamFilter('all');
      setBulkAgeFilter('all');
      toast.success(`Added ${playerIds.length} players to tryout pool`);
    }
  });

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

          imports.push(base44.entities.TryoutPool.create({
            player_name: playerData['player_name'] || playerData['name'],
            player_email: playerData['player_email'] || '',
            parent_emails: playerData['parent_emails'] ? playerData['parent_emails'].split(';') : [],
            date_of_birth: playerData['date_of_birth'] || '',
            age_group: playerData['age_group'] || '',
            gender: playerData['gender'] || 'Female',
            primary_position: playerData['primary_position'] || '',
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

  const filteredPoolPlayers = poolPlayers.filter(p => {
    const matchesSearch = p.player_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = filterGender === 'all' || p.gender === filterGender;
    const matchesAgeGroup = filterAgeGroup === 'all' || p.age_group === filterAgeGroup;
    return matchesSearch && matchesGender && matchesAgeGroup;
  });

  const availablePlayers = players.filter(p => 
    !poolPlayers.some(pp => pp.player_id === p.id)
  );

  const bulkFilteredPlayers = players.filter(p => {
    if (poolPlayers.some(pp => pp.player_id === p.id)) return false;
    
    const team = teams.find(t => t.id === p.team_id);
    const matchesTeam = bulkTeamFilter === 'all' || team?.id === bulkTeamFilter;
    const matchesAge = bulkAgeFilter === 'all' || team?.age_group === bulkAgeFilter;
    
    return matchesTeam && matchesAge;
  });

  return (
    <Card className="border-2 border-blue-400 shadow-2xl bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader className="pb-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <span className="font-bold">Tryout Pool</span>
            <Badge className="bg-white text-blue-700 text-sm font-bold px-2">{poolPlayers.length}</Badge>
          </div>
          <div className="flex gap-1">
            <Button
              onClick={() => setShowBulkFromTeamsDialog(true)}
              size="sm"
              className="h-7 px-2 bg-white/20 hover:bg-white/30 text-white"
            >
              <Users className="w-3 h-3 mr-1" />
              From Teams
            </Button>
            <Button
              onClick={() => setShowImportDialog(true)}
              size="sm"
              className="h-7 px-2 bg-white/20 hover:bg-white/30 text-white"
            >
              <Upload className="w-3 h-3 mr-1" />
              CSV
            </Button>
            <Button
              onClick={() => setShowAddDialog(true)}
              size="sm"
              className="h-7 px-2 bg-white/20 hover:bg-white/30 text-white"
            >
              <Plus className="w-3 h-3 mr-1" />
              Manual
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
            <Input
              placeholder="Search pool..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 text-xs pl-7"
            />
          </div>
          <Select value={filterGender} onValueChange={setFilterGender}>
            <SelectTrigger className="h-8 text-xs w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Female">Girls</SelectItem>
              <SelectItem value="Male">Boys</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Droppable droppableId="tryout-pool">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`space-y-1.5 overflow-y-auto transition-all ${snapshot.isDraggingOver ? 'bg-blue-200 rounded-xl' : ''}`}
              style={{ maxHeight: 'calc(100vh - 280px)' }}
            >
              {filteredPoolPlayers.map((poolPlayer, index) => (
                <Draggable key={poolPlayer.id} draggableId={poolPlayer.player_id || poolPlayer.id} index={index}>
                  {(provided, snapshot) => (
                    <Card 
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`p-2 border border-blue-200 transition-all cursor-grab active:cursor-grabbing ${
                        snapshot.isDragging ? 'bg-white shadow-2xl scale-105 ring-4 ring-blue-400' : 'bg-white hover:border-blue-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-slate-900">{poolPlayer.player_name}</div>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {poolPlayer.age_group && <Badge className="bg-purple-100 text-purple-800 text-[10px]">{poolPlayer.age_group}</Badge>}
                            {poolPlayer.primary_position && <Badge className="bg-blue-100 text-blue-800 text-[10px]">{poolPlayer.primary_position}</Badge>}
                            {poolPlayer.current_team && <Badge className="bg-slate-200 text-slate-700 text-[10px]">{poolPlayer.current_team}</Badge>}
                            <Badge className={`text-[10px] ${
                              poolPlayer.status === 'Confirmed' ? 'bg-green-500 text-white' :
                              poolPlayer.status === 'Invited' ? 'bg-blue-500 text-white' :
                              'bg-slate-400 text-white'
                            }`}>{poolPlayer.status}</Badge>
                          </div>
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromPoolMutation.mutate(poolPlayer.id);
                          }}
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-red-600 hover:text-red-700 flex-shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              {filteredPoolPlayers.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>No players in pool</p>
                  <p className="mt-1">Use buttons above to add players</p>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </CardContent>

      {/* Add Player Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Player to Tryout Pool</DialogTitle>
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
              <Input
                value={newPlayer.primary_position}
                onChange={(e) => setNewPlayer({...newPlayer, primary_position: e.target.value})}
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
                onClick={() => addToPoolMutation.mutate(newPlayer)}
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
              <p className="text-xs text-slate-600">player_name, player_email, date_of_birth, gender, primary_position, notes</p>
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

      {/* Bulk Add from Last Year's Teams Dialog */}
      <Dialog open={showBulkFromTeamsDialog} onOpenChange={setShowBulkFromTeamsDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Players from Last Year's Teams</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-slate-600">Filter by team or age group, then select players to add to tryout pool</p>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Filter by Team</Label>
                <Select value={bulkTeamFilter} onValueChange={setBulkTeamFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Teams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    {teams.filter(t => t.season === '25/26' || t.name?.includes('25/26')).map(team => (
                      <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Filter by Age Group</Label>
                <Select value={bulkAgeFilter} onValueChange={setBulkAgeFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Ages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Age Groups</SelectItem>
                    {[...new Set(teams.map(t => t.age_group).filter(Boolean))].sort((a, b) => {
                      const extractAge = (ag) => parseInt(ag?.match(/\d+/)?.[0] || 0);
                      return extractAge(b) - extractAge(a);
                    }).map(ag => (
                      <SelectItem key={ag} value={ag}>{ag}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {bulkFilteredPlayers.length === 0 ? (
              <p className="text-center py-8 text-slate-400 text-sm">No players match filters or all already in pool</p>
            ) : (
              <>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-sm font-semibold text-blue-900">{bulkFilteredPlayers.length} players available</span>
                  <Button
                    onClick={() => {
                      if (selectedPoolPlayers.length === bulkFilteredPlayers.length) {
                        setSelectedPoolPlayers([]);
                      } else {
                        setSelectedPoolPlayers(bulkFilteredPlayers.map(p => p.id));
                      }
                    }}
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                  >
                    {selectedPoolPlayers.length === bulkFilteredPlayers.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {bulkFilteredPlayers.map(player => {
                    const team = teams.find(t => t.id === player.team_id);
                    return (
                      <div
                        key={player.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedPoolPlayers.includes(player.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-blue-300'
                        }`}
                        onClick={() => {
                          if (selectedPoolPlayers.includes(player.id)) {
                            setSelectedPoolPlayers(selectedPoolPlayers.filter(id => id !== player.id));
                          } else {
                            setSelectedPoolPlayers([...selectedPoolPlayers, player.id]);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-sm">{player.full_name}</div>
                            <div className="flex gap-1 mt-1">
                              {player.age_group && <Badge className="bg-purple-100 text-purple-800 text-xs">{player.age_group}</Badge>}
                              {player.primary_position && <Badge className="bg-blue-100 text-blue-800 text-xs">{player.primary_position}</Badge>}
                              {team && <Badge className="bg-slate-200 text-slate-700 text-xs">{team.name}</Badge>}
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={selectedPoolPlayers.includes(player.id)}
                            onChange={() => {}}
                            className="w-5 h-5"
                          />
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
                      setSelectedPoolPlayers([]);
                      setBulkTeamFilter('all');
                      setBulkAgeFilter('all');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => bulkAddFromDatabaseMutation.mutate(selectedPoolPlayers)}
                    disabled={selectedPoolPlayers.length === 0}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Add {selectedPoolPlayers.length} Player{selectedPoolPlayers.length !== 1 ? 's' : ''}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}