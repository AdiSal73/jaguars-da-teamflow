import React, { useState, useRef, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { User, Save, Plus, Search, Trash2, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const positionMapping = {
  'GK': 'GK',
  'Right Outside Back': 'RB',
  'Left Outside Back': 'LB',
  'Right Centerback': 'RCB',
  'Left Centerback': 'LCB',
  'Defensive Midfielder': 'DM',
  'Right Winger': 'RW',
  'Center Midfielder': 'CM',
  'Forward': 'ST',
  'Attacking Midfielder': 'CAM',
  'Left Winger': 'LW'
};

const formations = {
  '4-3-3': {
    name: '4-3-3',
    positions: [
      { id: 'GK', x: 50, y: 90, label: 'GK' },
      { id: 'Right Outside Back', x: 75, y: 70, label: 'RB' },
      { id: 'Left Centerback', x: 58, y: 70, label: 'LCB' },
      { id: 'Right Centerback', x: 42, y: 70, label: 'RCB' },
      { id: 'Left Outside Back', x: 25, y: 70, label: 'LB' },
      { id: 'Center Midfielder', x: 58, y: 50, label: 'CM' },
      { id: 'Defensive Midfielder', x: 50, y: 58, label: 'DM' },
      { id: 'Attacking Midfielder', x: 42, y: 50, label: 'CAM' },
      { id: 'Right Winger', x: 70, y: 25, label: 'RW' },
      { id: 'Forward', x: 50, y: 18, label: 'ST' },
      { id: 'Left Winger', x: 30, y: 25, label: 'LW' }
    ]
  },
  '4-2-3-1': {
    name: '4-2-3-1',
    positions: [
      { id: 'GK', x: 50, y: 90, label: 'GK' },
      { id: 'Right Outside Back', x: 75, y: 70, label: 'RB' },
      { id: 'Left Centerback', x: 58, y: 70, label: 'LCB' },
      { id: 'Right Centerback', x: 42, y: 70, label: 'RCB' },
      { id: 'Left Outside Back', x: 25, y: 70, label: 'LB' },
      { id: 'Defensive Midfielder', x: 56, y: 55, label: 'DM' },
      { id: 'Center Midfielder', x: 44, y: 55, label: 'CM' },
      { id: 'Right Winger', x: 70, y: 35, label: 'RW' },
      { id: 'Attacking Midfielder', x: 50, y: 35, label: 'CAM' },
      { id: 'Left Winger', x: 30, y: 35, label: 'LW' },
      { id: 'Forward', x: 50, y: 18, label: 'ST' }
    ]
  },
  '4-4-2': {
    name: '4-4-2',
    positions: [
      { id: 'GK', x: 50, y: 90, label: 'GK' },
      { id: 'Right Outside Back', x: 75, y: 70, label: 'RB' },
      { id: 'Left Centerback', x: 58, y: 70, label: 'LCB' },
      { id: 'Right Centerback', x: 42, y: 70, label: 'RCB' },
      { id: 'Left Outside Back', x: 25, y: 70, label: 'LB' },
      { id: 'Right Winger', x: 75, y: 45, label: 'RM' },
      { id: 'Center Midfielder', x: 58, y: 50, label: 'CM' },
      { id: 'Defensive Midfielder', x: 42, y: 50, label: 'DM' },
      { id: 'Left Winger', x: 25, y: 45, label: 'LM' },
      { id: 'Forward', x: 56, y: 20, label: 'ST' },
      { id: 'Attacking Midfielder', x: 44, y: 20, label: 'ST' }
    ]
  },
  '3-5-2': {
    name: '3-5-2',
    positions: [
      { id: 'GK', x: 50, y: 90, label: 'GK' },
      { id: 'Left Centerback', x: 60, y: 70, label: 'LCB' },
      { id: 'Right Centerback', x: 50, y: 72, label: 'CB' },
      { id: 'Left Outside Back', x: 40, y: 70, label: 'RCB' },
      { id: 'Right Outside Back', x: 75, y: 50, label: 'RWB' },
      { id: 'Center Midfielder', x: 58, y: 50, label: 'CM' },
      { id: 'Defensive Midfielder', x: 50, y: 55, label: 'DM' },
      { id: 'Attacking Midfielder', x: 42, y: 50, label: 'CAM' },
      { id: 'Left Winger', x: 25, y: 50, label: 'LWB' },
      { id: 'Forward', x: 56, y: 22, label: 'ST' },
      { id: 'Right Winger', x: 44, y: 22, label: 'ST' }
    ]
  }
};

export default function FormationView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const teamIdParam = urlParams.get('teamId');
  const fieldRef = useRef(null);

  const [selectedFormation, setSelectedFormation] = useState('4-3-3');
  const [selectedTeam, setSelectedTeam] = useState(teamIdParam || 'all');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [formationPositions, setFormationPositions] = useState(formations['4-3-3'].positions);
  const [unassignedSearch, setUnassignedSearch] = useState('');
  const [unassignedFiltersOpen, setUnassignedFiltersOpen] = useState(false);
  const [showSaveFormationDialog, setShowSaveFormationDialog] = useState(false);
  const [newFormationName, setNewFormationName] = useState('');
  const [selectedSavedFormation, setSelectedSavedFormation] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const currentCoach = coaches.find(c => c.email === user?.email);

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const allTeams = await base44.entities.Team.list();
      if (currentCoach && user?.role !== 'admin') {
        const coachTeamIds = currentCoach.team_ids || [];
        return allTeams.filter(t => coachTeamIds.includes(t.id));
      }
      return allTeams;
    },
    enabled: !!user
  });

  const { data: allPlayers = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: tryouts = [] } = useQuery({
    queryKey: ['tryouts'],
    queryFn: () => base44.entities.PlayerTryout.list()
  });

  const { data: savedFormations = [] } = useQuery({
    queryKey: ['savedFormations'],
    queryFn: () => base44.entities.SavedFormation.list()
  });

  const saveFormationMutation = useMutation({
    mutationFn: (data) => base44.entities.SavedFormation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['savedFormations']);
      setShowSaveFormationDialog(false);
      setNewFormationName('');
      toast.success('Formation saved');
    }
  });

  const updateFormationMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SavedFormation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['savedFormations']);
      toast.success('Formation updated');
    }
  });

  const deleteFormationMutation = useMutation({
    mutationFn: (id) => base44.entities.SavedFormation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['savedFormations']);
      setSelectedSavedFormation(null);
      toast.success('Formation deleted');
    }
  });

  const updatePlayerMutation = useMutation({
    mutationFn: ({ playerId, data }) => base44.entities.Player.update(playerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['players']);
    }
  });

  const updateTryoutMutation = useMutation({
    mutationFn: async ({ playerId, newRanking, position }) => {
      const player = allPlayers.find(p => p.id === playerId);
      const existingTryout = tryouts.find(t => t.player_id === playerId);
      const teamData = teams.find(t => t.id === player?.team_id);

      if (existingTryout) {
        return base44.entities.PlayerTryout.update(existingTryout.id, { team_ranking: newRanking, primary_position: position });
      } else {
        return base44.entities.PlayerTryout.create({
          player_id: playerId,
          player_name: player?.full_name,
          current_team: teamData?.name,
          primary_position: position,
          team_ranking: newRanking
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tryouts']);
    }
  });

  const players = useMemo(() => {
    return allPlayers.filter((player) => {
      if (selectedTeam !== 'all') {
        return player.team_id === selectedTeam;
      }
      if (selectedAgeGroup !== 'all') {
        const team = teams.find((t) => t.id === player.team_id);
        return team?.age_group === selectedAgeGroup;
      }
      if (selectedGender !== 'all') {
        return player.gender === selectedGender;
      }
      return true;
    });
  }, [allPlayers, selectedTeam, selectedAgeGroup, selectedGender, teams]);

  const team = teams.find((t) => t.id === selectedTeam) || (selectedAgeGroup !== 'all' ? { name: `${selectedAgeGroup} Players` } : { name: 'All Players' });

  const getPlayersForPosition = useCallback((positionId) => {
    const posPlayers = players.filter((player) => player.primary_position === positionId);
    const withTryout = posPlayers.map((p) => {
      const tryout = tryouts.find((t) => t.player_id === p.id);
      return { ...p, tryout };
    });
    return withTryout.sort((a, b) => {
      const rankA = a.tryout?.team_ranking || 9999;
      const rankB = b.tryout?.team_ranking || 9999;
      return rankA - rankB;
    });
  }, [players, tryouts]);

  const unassignedPlayers = useMemo(() => {
    let filtered = allPlayers.filter(player => !player.primary_position || !Object.keys(positionMapping).includes(player.primary_position));
    
    if (unassignedSearch) {
      const search = unassignedSearch.toLowerCase();
      filtered = filtered.filter(p => p.full_name?.toLowerCase().includes(search));
    }
    
    return filtered.sort((a, b) => {
      const lastNameA = a.full_name?.split(' ').pop() || '';
      const lastNameB = b.full_name?.split(' ').pop() || '';
      return lastNameA.localeCompare(lastNameB);
    });
  }, [allPlayers, unassignedSearch]);

  const handleDragEnd = useCallback((result) => {
    if (!result.destination) return;

    const sourcePositionId = result.source.droppableId.replace('position-', '');
    const destPositionId = result.destination.droppableId.replace('position-', '');
    const draggedPlayerId = result.draggableId.replace('player-', '');

    if (sourcePositionId !== destPositionId) {
      updatePlayerMutation.mutate({
        playerId: draggedPlayerId,
        data: { primary_position: destPositionId }
      });
    }

    const newRanking = result.destination.index + 1;
    updateTryoutMutation.mutate({
      playerId: draggedPlayerId,
      newRanking,
      position: destPositionId
    });
  }, [updatePlayerMutation, updateTryoutMutation]);

  const handleSaveNewFormation = () => {
    if (!newFormationName?.trim()) return;
    
    saveFormationMutation.mutate({
      name: newFormationName,
      team_id: selectedTeam !== 'all' ? selectedTeam : null,
      age_group: selectedAgeGroup !== 'all' ? selectedAgeGroup : null,
      base_formation: selectedFormation,
      positions: formationPositions,
      player_assignments: formationPositions.map(pos => ({
        position_id: pos.id,
        player_ids: getPlayersForPosition(pos.id).map(p => p.id)
      })),
      is_default: false
    });
  };

  const handleLoadSavedFormation = (formation) => {
    setSelectedSavedFormation(formation);
    if (formation.base_formation && formations[formation.base_formation]) {
      setSelectedFormation(formation.base_formation);
    }
    if (formation.positions) {
      setFormationPositions(formation.positions);
    }
  };

  const handleSetDefault = (formation) => {
    updateFormationMutation.mutate({
      id: formation.id,
      data: { is_default: !formation.is_default }
    });
  };

  React.useEffect(() => {
    setFormationPositions(formations[selectedFormation].positions);
  }, [selectedFormation]);

  const formation = { name: formations[selectedFormation].name, positions: formationPositions };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="p-4 md:p-8 mx-auto flex gap-4">
        <div className="flex-1 max-w-5xl">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{team?.name || 'Formation View'}</h1>
            <p className="text-sm text-slate-600">Drag players to rank them within each position</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <div>
              <Label className="mb-1 block text-xs font-semibold">Gender</Label>
              <Select value={selectedGender} onValueChange={(value) => {setSelectedGender(value);setSelectedTeam('all');setSelectedAgeGroup('all');}}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Male">Boys</SelectItem>
                  <SelectItem value="Female">Girls</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block text-xs font-semibold">Formation</Label>
              <Select value={selectedFormation} onValueChange={setSelectedFormation}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(formations).map((key) => (
                    <SelectItem key={key} value={key}>{formations[key].name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block text-xs font-semibold">Team</Label>
              <Select value={selectedTeam} onValueChange={(value) => {setSelectedTeam(value);setSelectedAgeGroup('all');}}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block text-xs font-semibold">Age Group</Label>
              <Select value={selectedAgeGroup} onValueChange={(value) => {setSelectedAgeGroup(value);setSelectedTeam('all');}}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ages</SelectItem>
                  {[...new Set(teams.map((t) => t.age_group).filter(Boolean))].map((ageGroup) => (
                    <SelectItem key={ageGroup} value={ageGroup}>{ageGroup}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block text-xs font-semibold">Saved</Label>
              <div className="flex gap-1">
                <Select value={selectedSavedFormation?.id || ''} onValueChange={(id) => {
                  const f = savedFormations.find(sf => sf.id === id);
                  if (f) handleLoadSavedFormation(f);
                }}>
                  <SelectTrigger className="h-9 text-xs flex-1"><SelectValue placeholder="Load..." /></SelectTrigger>
                  <SelectContent>
                    {savedFormations.map(sf => (
                      <SelectItem key={sf.id} value={sf.id}>
                        {sf.is_default && <Star className="w-3 h-3 inline mr-1 text-yellow-500" />}
                        {sf.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="icon" variant="outline" className="h-9 w-9" onClick={() => setShowSaveFormationDialog(true)}>
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>

          <Card className="border-none shadow-xl overflow-hidden">
            <CardContent className="p-0">
              <div
                ref={fieldRef}
                className="relative w-full bg-gradient-to-b from-green-700 via-green-600 to-green-700"
                style={{ paddingBottom: '140%', maxHeight: '900px' }}
              >
                <div className="absolute inset-0">
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 140" preserveAspectRatio="none">
                    <rect x="2" y="2" width="96" height="136" fill="none" stroke="white" strokeWidth="0.3" opacity="0.6" />
                    <line x1="2" y1="70" x2="98" y2="70" stroke="white" strokeWidth="0.3" opacity="0.6" />
                    <circle cx="50" cy="70" r="8" fill="none" stroke="white" strokeWidth="0.3" opacity="0.6" />
                    <circle cx="50" cy="70" r="0.5" fill="white" opacity="0.6" />
                    <rect x="20" y="2" width="60" height="15" fill="none" stroke="white" strokeWidth="0.3" opacity="0.6" />
                    <rect x="20" y="123" width="60" height="15" fill="none" stroke="white" strokeWidth="0.3" opacity="0.6" />
                    <rect x="35" y="2" width="30" height="6" fill="none" stroke="white" strokeWidth="0.3" opacity="0.6" />
                    <rect x="35" y="132" width="30" height="6" fill="none" stroke="white" strokeWidth="0.3" opacity="0.6" />
                  </svg>

                  {formation.positions.map((position) => {
                    const positionPlayers = getPlayersForPosition(position.id);
                    return (
                      <div
                        key={position.id}
                        className="absolute"
                        style={{
                          left: `${position.x}%`,
                          top: `${position.y}%`,
                          transform: 'translate(-50%, -50%)',
                          width: '140px',
                          maxWidth: '25vw',
                          zIndex: 10
                        }}
                      >
                        <Droppable droppableId={`position-${position.id}`}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`bg-white/95 backdrop-blur-sm p-1.5 rounded-lg shadow-lg border-2 transition-all ${
                                snapshot.isDraggingOver ? 'border-emerald-500 scale-105' : 'border-slate-300'
                              }`}
                            >
                              <div className="text-center text-[9px] font-bold text-slate-700 mb-1 pb-1 border-b">
                                {position.label}
                              </div>
                              <div className="space-y-1 max-h-32 overflow-y-auto">
                                {positionPlayers.map((player, index) => (
                                  <Draggable key={player.id} draggableId={`player-${player.id}`} index={index}>
                                    {(dragProvided, dragSnapshot) => (
                                      <div
                                        ref={dragProvided.innerRef}
                                        {...dragProvided.draggableProps}
                                        {...dragProvided.dragHandleProps}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(`${createPageUrl('PlayerDashboard')}?id=${player.id}`);
                                        }}
                                        className={`bg-white rounded p-1 border cursor-pointer hover:border-emerald-400 transition-all ${
                                          dragSnapshot.isDragging ? 'shadow-xl border-emerald-500 scale-105' : 'border-slate-200'
                                        }`}
                                      >
                                        <div className="flex items-center gap-1">
                                          <div className="w-4 h-4 bg-slate-800 rounded flex items-center justify-center text-white font-bold text-[7px] flex-shrink-0">
                                            #{player.tryout?.team_ranking || index + 1}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="text-[8px] font-bold text-slate-900 truncate leading-tight">
                                              {player.full_name}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                                {positionPlayers.length === 0 && (
                                  <div className="text-center py-1 text-[8px] text-slate-400">Empty</div>
                                )}
                              </div>
                            </div>
                          )}
                        </Droppable>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Unassigned Players Sidebar */}
        <Droppable droppableId="position-unassigned">
          {(provided, snapshot) => (
            <Card
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`sticky top-4 h-fit w-80 border-none shadow-xl transition-all ${
                snapshot.isDraggingOver ? 'ring-4 ring-emerald-400' : ''
              }`}
            >
              <CardHeader className="pb-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    Unassigned ({unassignedPlayers.length})
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUnassignedFiltersOpen(!unassignedFiltersOpen)}
                      className="text-white hover:bg-white/20 h-6 px-1"
                    >
                      {unassignedFiltersOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </Button>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <Collapsible open={unassignedFiltersOpen}>
                  <CollapsibleContent>
                    <div className="mb-3">
                      <div className="relative">
                        <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                          placeholder="Search..."
                          value={unassignedSearch}
                          onChange={e => setUnassignedSearch(e.target.value)}
                          className="h-7 pl-7 text-xs"
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
                <div className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {unassignedPlayers.map((player, index) => (
                    <Draggable key={player.id} draggableId={`player-${player.id}`} index={index}>
                      {(dragProvided, dragSnapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                          onClick={() => navigate(`${createPageUrl('PlayerDashboard')}?id=${player.id}`)}
                          className={`p-2 bg-white border rounded-lg cursor-pointer hover:border-emerald-400 transition-all ${
                            dragSnapshot.isDragging ? 'shadow-xl border-emerald-500 scale-105' : 'border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                              {player.jersey_number || <User className="w-3 h-3" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-xs text-slate-900 truncate">{player.full_name}</div>
                              {player.team_id && (
                                <div className="text-[9px] text-slate-500 truncate">
                                  {teams.find(t => t.id === player.team_id)?.name}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {unassignedPlayers.length === 0 && (
                    <p className="text-center text-slate-400 py-4 text-xs">All players assigned</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </Droppable>
      </div>

      {/* Save Formation Dialog */}
      <Dialog open={showSaveFormationDialog} onOpenChange={setShowSaveFormationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save Formation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Formation Name</Label>
              <Input
                value={newFormationName}
                onChange={e => setNewFormationName(e.target.value)}
                placeholder="e.g., U-15 GA Match Day"
                className="mt-1"
              />
            </div>
            <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded">
              <p className="font-semibold mb-2">This will save:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Position rankings</li>
                <li>Base formation: {selectedFormation}</li>
                <li>Team: {team?.name || 'All Players'}</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowSaveFormationDialog(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSaveNewFormation} disabled={!newFormationName?.trim()} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Saved Formations Dialog */}
      {selectedSavedFormation && (
        <Dialog open={!!selectedSavedFormation} onOpenChange={() => setSelectedSavedFormation(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedSavedFormation.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
                <span className="text-sm font-medium">Set as Default</span>
                <Button
                  size="sm"
                  variant={selectedSavedFormation.is_default ? "default" : "outline"}
                  onClick={() => handleSetDefault(selectedSavedFormation)}
                >
                  {selectedSavedFormation.is_default ? (
                    <><Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />Default</>
                  ) : (
                    <><Star className="w-3 h-3 mr-1" />Set Default</>
                  )}
                </Button>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setSelectedSavedFormation(null)} className="flex-1">Close</Button>
                <Button onClick={() => {
                  if (confirm('Delete this formation?')) {
                    deleteFormationMutation.mutate(selectedSavedFormation.id);
                  }
                }} className="flex-1 bg-red-600 hover:bg-red-700">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </DragDropContext>
  );
}