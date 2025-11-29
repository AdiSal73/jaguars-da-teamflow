import React, { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { User, Edit2, Save, Plus, Search, ArrowUpDown, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

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

// Renamed from League to Club for consistency

const teamRoleColors = {
  'Indispensable Player': 'bg-purple-600 hover:bg-purple-700',
  'GA Starter': 'bg-emerald-600 hover:bg-emerald-700',
  'GA Rotation': 'bg-teal-600 hover:bg-teal-700',
  'Aspire Starter': 'bg-blue-600 hover:bg-blue-700',
  'Aspire Rotation': 'bg-cyan-600 hover:bg-cyan-700',
  'United Starter': 'bg-orange-600 hover:bg-orange-700',
  'United Rotation': 'bg-amber-600 hover:bg-amber-700'
};

const formations = {
  '4-3-3': {
    name: '4-3-3',
    positions: [
    { id: 'GK', x: 50, y: 95, label: 'GK' },
    { id: 'Right Outside Back', x: 80, y: 75, label: 'RB' },
    { id: 'Left Centerback', x: 62, y: 75, label: 'LCB' },
    { id: 'Right Centerback', x: 38, y: 75, label: 'RCB' },
    { id: 'Left Outside Back', x: 20, y: 75, label: 'LB' },
    { id: 'Center Midfielder', x: 62, y: 50, label: 'CM' },
    { id: 'Defensive Midfielder', x: 50, y: 50, label: 'DM' },
    { id: 'Attacking Midfielder', x: 38, y: 50, label: 'CAM' },
    { id: 'Right Winger', x: 75, y: 20, label: 'RW' },
    { id: 'Forward', x: 50, y: 15, label: 'ST' },
    { id: 'Left Winger', x: 25, y: 20, label: 'LW' }]
  },
  '4-2-3-1': {
    name: '4-2-3-1',
    positions: [
    { id: 'GK', x: 50, y: 95, label: 'GK' },
    { id: 'Right Outside Back', x: 80, y: 75, label: 'RB' },
    { id: 'Left Centerback', x: 62, y: 75, label: 'LCB' },
    { id: 'Right Centerback', x: 38, y: 75, label: 'RCB' },
    { id: 'Left Outside Back', x: 20, y: 75, label: 'LB' },
    { id: 'Defensive Midfielder', x: 60, y: 55, label: 'DM' },
    { id: 'Center Midfielder', x: 40, y: 55, label: 'CM' },
    { id: 'Right Winger', x: 75, y: 35, label: 'RW' },
    { id: 'Attacking Midfielder', x: 50, y: 35, label: 'CAM' },
    { id: 'Left Winger', x: 25, y: 35, label: 'LW' },
    { id: 'Forward', x: 50, y: 15, label: 'ST' }]
  },
  '4-4-2': {
    name: '4-4-2',
    positions: [
    { id: 'GK', x: 50, y: 95, label: 'GK' },
    { id: 'Right Outside Back', x: 80, y: 75, label: 'RB' },
    { id: 'Left Centerback', x: 62, y: 75, label: 'LCB' },
    { id: 'Right Centerback', x: 38, y: 75, label: 'RCB' },
    { id: 'Left Outside Back', x: 20, y: 75, label: 'LB' },
    { id: 'Right Winger', x: 80, y: 45, label: 'RW' },
    { id: 'Center Midfielder', x: 60, y: 45, label: 'CM' },
    { id: 'Defensive Midfielder', x: 40, y: 45, label: 'DM' },
    { id: 'Left Winger', x: 20, y: 45, label: 'LW' },
    { id: 'Forward', x: 60, y: 15, label: 'ST' },
    { id: 'Attacking Midfielder', x: 40, y: 15, label: 'CAM' }]
  },
  '3-4-2-1': {
    name: '3-4-2-1',
    positions: [
    { id: 'GK', x: 50, y: 95, label: 'GK' },
    { id: 'Left Centerback', x: 65, y: 75, label: 'LCB' },
    { id: 'Right Centerback', x: 50, y: 75, label: 'CB' },
    { id: 'Left Outside Back', x: 35, y: 75, label: 'LB' },
    { id: 'Right Outside Back', x: 80, y: 50, label: 'RB' },
    { id: 'Center Midfielder', x: 60, y: 50, label: 'CM' },
    { id: 'Defensive Midfielder', x: 40, y: 50, label: 'DM' },
    { id: 'Left Winger', x: 20, y: 50, label: 'LW' },
    { id: 'Attacking Midfielder', x: 60, y: 28, label: 'CAM' },
    { id: 'Right Winger', x: 40, y: 28, label: 'RW' },
    { id: 'Forward', x: 50, y: 15, label: 'ST' }]
  },
  '3-5-2': {
    name: '3-5-2',
    positions: [
    { id: 'GK', x: 50, y: 95, label: 'GK' },
    { id: 'Left Centerback', x: 65, y: 75, label: 'LCB' },
    { id: 'Right Centerback', x: 50, y: 75, label: 'CB' },
    { id: 'Left Outside Back', x: 35, y: 75, label: 'LB' },
    { id: 'Right Outside Back', x: 80, y: 50, label: 'RWB' },
    { id: 'Center Midfielder', x: 62, y: 50, label: 'CM' },
    { id: 'Defensive Midfielder', x: 50, y: 50, label: 'DM' },
    { id: 'Attacking Midfielder', x: 38, y: 50, label: 'CAM' },
    { id: 'Left Winger', x: 20, y: 50, label: 'LWB' },
    { id: 'Forward', x: 60, y: 15, label: 'ST' },
    { id: 'Right Winger', x: 40, y: 15, label: 'RW' }]
  },
  '3-4-1-2': {
    name: '3-4-1-2',
    positions: [
    { id: 'GK', x: 50, y: 95, label: 'GK' },
    { id: 'Left Centerback', x: 65, y: 75, label: 'LCB' },
    { id: 'Right Centerback', x: 50, y: 75, label: 'CB' },
    { id: 'Left Outside Back', x: 35, y: 75, label: 'LB' },
    { id: 'Right Outside Back', x: 80, y: 50, label: 'RB' },
    { id: 'Center Midfielder', x: 60, y: 50, label: 'CM' },
    { id: 'Defensive Midfielder', x: 40, y: 50, label: 'DM' },
    { id: 'Left Winger', x: 20, y: 50, label: 'LW' },
    { id: 'Attacking Midfielder', x: 50, y: 32, label: 'CAM' },
    { id: 'Forward', x: 60, y: 15, label: 'ST' },
    { id: 'Right Winger', x: 40, y: 15, label: 'RW' }]
  }
};

export default function FormationView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const teamIdParam = urlParams.get('teamId');
  const fieldRef = useRef(null);

  const [selectedFormation, setSelectedFormation] = useState('4-3-3');
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(teamIdParam || 'all');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all');
  const [formationPositions, setFormationPositions] = useState(formations['4-3-3'].positions);
  const [draggingPosition, setDraggingPosition] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showSaveFormationDialog, setShowSaveFormationDialog] = useState(false);
  const [newFormationName, setNewFormationName] = useState('');
  const [selectedSavedFormation, setSelectedSavedFormation] = useState(null);
  const [unassignedSearch, setUnassignedSearch] = useState('');
  const [unassignedSortBy, setUnassignedSortBy] = useState('name');
  const [unassignedFilterLeague, setUnassignedFilterLeague] = useState('all');

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
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
    }
  });

  const deleteFormationMutation = useMutation({
    mutationFn: (id) => base44.entities.SavedFormation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['savedFormations']);
      setSelectedSavedFormation(null);
    }
  });

  const handleSaveNewFormation = () => {
    if (!newFormationName.trim()) return;
    saveFormationMutation.mutate({
      name: newFormationName,
      team_id: selectedTeam !== 'all' ? selectedTeam : null,
      age_group: selectedAgeGroup !== 'all' ? selectedAgeGroup : null,
      base_formation: selectedFormation,
      positions: formationPositions,
      player_assignments: formationPositions.map(pos => ({
        position_id: pos.id,
        player_ids: getPlayersForPosition(pos.id).map(p => p.id)
      }))
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

  const players = allPlayers.filter((player) => {
    if (selectedTeam !== 'all') {
      return player.team_id === selectedTeam;
    }

    if (selectedAgeGroup !== 'all') {
      const team = teams.find((t) => t.id === player.team_id);
      return team?.age_group === selectedAgeGroup;
    }

    return true;
  });

  const team = teams.find((t) => t.id === selectedTeam) || (selectedAgeGroup !== 'all' ? { name: `${selectedAgeGroup} Players` } : { name: 'All Players' });

  React.useEffect(() => {
    if (team?.formation_settings?.positions) {
      setFormationPositions(team.formation_settings.positions);
      if (team.formation_settings.formation_name) {
        setSelectedFormation(team.formation_settings.formation_name);
      }
    } else {
      setFormationPositions(formations[selectedFormation].positions);
    }
  }, [team?.id, selectedFormation]);

  const saveFormationSettingsMutation = useMutation({
    mutationFn: async (positions) => {
      if (selectedTeam && selectedTeam !== 'all') {
        return base44.entities.Team.update(selectedTeam, {
          formation_settings: {
            formation_name: selectedFormation,
            positions: positions
          }
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['teams']);
    }
  });

  const handlePositionMouseUp = () => {
    if (draggingPosition) {
       setDraggingPosition(null);
       saveFormationSettingsMutation.mutate(formationPositions);
    }
  };

  const updatePlayerMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.Player.update(editingPlayer.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['players']);
      setShowEditDialog(false);
      setEditingPlayer(null);
    }
  });

  const updateTryoutMutation = useMutation({
    mutationFn: async (data) => {
      const existingTryout = tryouts.find((t) => t.player_id === editingPlayer.id);
      if (existingTryout) {
        return base44.entities.PlayerTryout.update(existingTryout.id, data);
      } else {
        return base44.entities.PlayerTryout.create({
          player_id: editingPlayer.id,
          player_name: editingPlayer.full_name,
          current_team: team?.name,
          ...data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tryouts']);
    }
  });

  const updateRankingMutation = useMutation({
    mutationFn: async ({ playerId, newRanking, position }) => {
      const player = allPlayers.find((p) => p.id === playerId);
      const existingTryout = tryouts.find((t) => t.player_id === playerId);
      const teamData = teams.find((t) => t.id === player?.team_id);

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

  const getPlayersForPosition = (positionId) => {
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
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const sourcePositionId = result.source.droppableId.replace('position-', '');
    const destPositionId = result.destination.droppableId.replace('position-', '');
    const draggedPlayerId = result.draggableId.replace('player-', '');

    if (sourcePositionId !== destPositionId) {
      base44.entities.Player.update(draggedPlayerId, { primary_position: destPositionId }).then(() => {
        queryClient.invalidateQueries(['players']);
      });
    }

    const newRanking = result.destination.index + 1;
    updateRankingMutation.mutate({
      playerId: draggedPlayerId,
      newRanking,
      position: destPositionId
    });
  };

  const handlePositionMouseDown = (position, e) => {
    e.preventDefault();
    setDraggingPosition(position);
  };

  const handlePositionMouseMove = (e) => {
    if (!draggingPosition || !fieldRef.current) return;

    const rect = fieldRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * 100;
    const y = (e.clientY - rect.top) / rect.height * 100;

    setFormationPositions((prev) =>
    prev.map((p) => p.id === draggingPosition.id ? { ...p, x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) } : p)
    );
  };

  React.useEffect(() => {
    if (draggingPosition) {
      window.addEventListener('mousemove', handlePositionMouseMove);
      window.addEventListener('mouseup', handlePositionMouseUp);
      return () => {
        window.removeEventListener('mousemove', handlePositionMouseMove);
        window.removeEventListener('mouseup', handlePositionMouseUp);
      };
    }
  }, [draggingPosition]);

  React.useEffect(() => {
    setFormationPositions(formations[selectedFormation].positions);
  }, [selectedFormation]);

  const formation = { name: formations[selectedFormation].name, positions: formationPositions };

  // Filtered and sorted unassigned players
  const unassignedPlayers = useMemo(() => {
    let filtered = players.filter(player => !player.primary_position || !Object.keys(positionMapping).includes(player.primary_position));
    
    // Search filter
    if (unassignedSearch) {
      const search = unassignedSearch.toLowerCase();
      filtered = filtered.filter(p => p.full_name?.toLowerCase().includes(search));
    }
    
    // League filter
    if (unassignedFilterLeague !== 'all') {
      filtered = filtered.filter(p => {
        const playerTeam = teams.find(t => t.id === p.team_id);
        return playerTeam?.league === unassignedFilterLeague;
      });
    }
    
    // Sorting
    return filtered.sort((a, b) => {
      if (unassignedSortBy === 'name') {
        const lastNameA = a.full_name?.split(' ').pop() || '';
        const lastNameB = b.full_name?.split(' ').pop() || '';
        return lastNameA.localeCompare(lastNameB);
      } else if (unassignedSortBy === 'birthYear') {
        const yearA = a.date_of_birth ? new Date(a.date_of_birth).getFullYear() : 9999;
        const yearB = b.date_of_birth ? new Date(b.date_of_birth).getFullYear() : 9999;
        return yearA - yearB;
      } else if (unassignedSortBy === 'team') {
        const teamA = teams.find(t => t.id === a.team_id)?.name || '';
        const teamB = teams.find(t => t.id === b.team_id)?.name || '';
        return teamA.localeCompare(teamB);
      }
      return 0;
    });
  }, [players, teams, unassignedSearch, unassignedSortBy, unassignedFilterLeague]);

  const uniqueLeagues = [...new Set(teams.map(t => t.league).filter(Boolean))];

  const handleEditClick = (player, e) => {
    e.stopPropagation();
    const playerTryout = tryouts.find(t => t.player_id === player.id);
    setEditingPlayer(player);
    setEditForm({
      full_name: player.full_name || '',
      jersey_number: player.jersey_number || '',
      email: player.email || '',
      phone: player.phone || '',
      date_of_birth: player.date_of_birth || '',
      primary_position: player.primary_position || '',
      team_role: playerTryout?.team_role || '',
      recommendation: playerTryout?.recommendation || '',
      tryout_notes: playerTryout?.notes || ''
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    const playerData = {
      full_name: editForm.full_name,
      jersey_number: editForm.jersey_number,
      email: editForm.email,
      phone: editForm.phone,
      date_of_birth: editForm.date_of_birth,
      primary_position: editForm.primary_position
    };

    const tryoutData = {
      team_role: editForm.team_role,
      recommendation: editForm.recommendation,
      notes: editForm.tryout_notes
    };

    updatePlayerMutation.mutate(playerData);
    updateTryoutMutation.mutate(tryoutData);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="mb-4 md:mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl md:text-3xl font-bold text-slate-900">{team?.name || 'Formation View'}</h1>
            <Button variant="outline" size="sm" onClick={() => navigate(createPageUrl('TeamTacticalView') + `?teamId=${selectedTeam}`)}>
              View Tactical Analysis
            </Button>
          </div>
          <p className="text-xs md:text-base text-slate-600">Drag players to rank them within each position</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
          <div>
            <Label className="mb-2 block text-sm font-semibold">Formation</Label>
            <Select value={selectedFormation} onValueChange={setSelectedFormation}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(formations).map((key) =>
                <SelectItem key={key} value={key}>{formations[key].name}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 block text-sm font-semibold">Team</Label>
            <Select value={selectedTeam} onValueChange={(value) => {setSelectedTeam(value);setSelectedAgeGroup('all');}}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map((team) =>
                <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 block text-sm font-semibold">Age Group</Label>
            <Select value={selectedAgeGroup} onValueChange={(value) => {setSelectedAgeGroup(value);setSelectedTeam('all');}}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Age Groups</SelectItem>
                {[...new Set(teams.map((t) => t.age_group).filter(Boolean))].sort((a, b) => {
                  const extractAge = (ag) => {
                    const match = ag?.match(/U-?(\d+)/i);
                    return match ? parseInt(match[1]) : 0;
                  };
                  return extractAge(b) - extractAge(a);
                }).map((ageGroup) =>
                <SelectItem key={ageGroup} value={ageGroup}>{ageGroup}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 block text-sm font-semibold">Saved Formations</Label>
            <div className="flex gap-2">
              <Select value={selectedSavedFormation?.id || ''} onValueChange={(id) => {
                const f = savedFormations.find(sf => sf.id === id);
                if (f) handleLoadSavedFormation(f);
              }}>
                <SelectTrigger className="h-10 flex-1">
                  <SelectValue placeholder="Load saved..." />
                </SelectTrigger>
                <SelectContent>
                  {savedFormations.map(sf => (
                    <SelectItem key={sf.id} value={sf.id}>{sf.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="icon" variant="outline" className="h-10 w-10" onClick={() => setShowSaveFormationDialog(true)}>
                <Plus className="w-4 h-4" />
              </Button>
              {selectedSavedFormation && (
                <Button size="icon" variant="outline" className="h-10 w-10 text-red-600 hover:bg-red-50" onClick={() => deleteFormationMutation.mutate(selectedSavedFormation.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <Card className="border-none shadow-2xl overflow-hidden">
          <CardContent className="p-0">
            <div
              ref={fieldRef}
              className="relative w-full"
              style={{
                paddingBottom: 'min(140%, 700px)',
                background: 'linear-gradient(180deg, #166534 0%, #15803d 50%, #166534 100%)',
                cursor: draggingPosition ? 'grabbing' : 'default'
              }}>
              
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
                  <rect x="42" y="0" width="16" height="2" fill="none" stroke="white" strokeWidth="0.3" opacity="0.6" />
                  <rect x="42" y="138" width="16" height="2" fill="none" stroke="white" strokeWidth="0.3" opacity="0.6" />
                </svg>

                {formation.positions.map((position) => {
                  const positionPlayers = getPlayersForPosition(position.id);

                  return (
                    <div
                      key={position.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: `${position.x}%`,
                        top: `${position.y}%`,
                        width: 'min(140px, 25vw)',
                        maxHeight: 'min(250px, 45vh)',
                        zIndex: draggingPosition?.id === position.id ? 1000 : 1
                      }}>
                      
                      <Droppable droppableId={`position-${position.id}`}>
                        {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}>
                          
                            <div className="bg-slate-200 p-1 md:p-1.5 rounded-lg md:rounded-xl backdrop-blur-sm shadow-2xl border-2 overflow-y-auto max-h-[35vh] md:max-h-[40vh] transition-all border-slate-300">
                              <div
                              onMouseDown={(e) => handlePositionMouseDown(position, e)}
                              className="text-center text-[10px] md:text-xs font-bold text-slate-700 mb-0.5 md:mb-1 sticky top-0 bg-white/95 pb-0.5 md:pb-1 border-b border-slate-300 cursor-move hover:bg-slate-100 rounded px-1 py-1">
                                {position.label}
                              </div>
                              <div className="space-y-0.5 md:space-y-1">
                                {positionPlayers.length > 0 ?
                              positionPlayers.map((player, index) =>
                              <Draggable key={player.id} draggableId={`player-${player.id}`} index={index}>
                                      {(playerProvided, playerSnapshot) => (
                                <div
                                  ref={playerProvided.innerRef}
                                  {...playerProvided.draggableProps}
                                  {...playerProvided.dragHandleProps}
                                  className={`transition-all ${playerSnapshot.isDragging ? 'rotate-2 scale-105 shadow-2xl' : ''}`}>
                                  
                                          <div className="bg-white rounded-md px-1 md:px-1.5 py-1 md:py-1.5 border border-slate-300 cursor-grab active:cursor-grabbing hover:border-emerald-400 hover:shadow-md group relative">
                                            <div className="flex items-center gap-0.5 md:gap-1 mb-0.5">
                                              <div className="w-4 h-4 md:w-5 md:h-5 bg-slate-800 rounded flex items-center justify-center text-white font-bold text-[8px] md:text-[10px] flex-shrink-0">
                                                #{player.tryout?.team_ranking || index + 1}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <div className="text-[8px] md:text-[10px] font-bold text-slate-900 truncate leading-tight">
                                                  {player.full_name}
                                                </div>
                                              </div>
                                              <button
                                        onClick={(e) => handleEditClick(player, e)}
                                        className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 md:w-4 md:h-4 bg-slate-800 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                                                <Edit2 className="w-1.5 h-1.5 md:w-2 md:h-2 text-white" />
                                              </button>
                                            </div>
                                            {player.tryout && (
                                    <div className="flex flex-wrap gap-0.5 justify-center">
                                                {player.tryout.team_role && (
                                      <Button 
                                        size="sm" 
                                        className={`h-3 md:h-4 px-1 text-[7px] md:text-[8px] rounded-full pointer-events-none ${teamRoleColors[player.tryout.team_role] || 'bg-blue-500 hover:bg-blue-600'}`}
                                      >
                                        {player.tryout.team_role}
                                      </Button>
                                      )}
                                                {player.tryout.recommendation && (
                                      <Button
                                        size="sm"
                                        className={`h-3 md:h-4 px-1 text-[7px] md:text-[8px] rounded-full pointer-events-none ${
                                        player.tryout.recommendation === 'Move up' ? 'bg-emerald-500 hover:bg-emerald-600' :
                                        player.tryout.recommendation === 'Move down' ? 'bg-orange-500 hover:bg-orange-600' :
                                        'bg-blue-500 hover:bg-blue-600'}`
                                        }>
                                                    {player.tryout.recommendation}
                                                  </Button>
                                      )}
                                              </div>
                                    )}
                                          </div>
                                        </div>
                                )}
                                    </Draggable>
                              ) :
                              <div className="text-center py-2">
                                    <div className="text-[8px] text-slate-400">No players</div>
                                  </div>
                              }
                                {provided.placeholder}
                              </div>
                            </div>
                          </div>
                        )}
                      </Droppable>
                    </div>);
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Droppable droppableId="position-unassigned">
          {(provided, snapshot) => (
          <Card
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`mt-4 md:mt-6 border-none shadow-lg transition-all ${
            snapshot.isDraggingOver ? 'ring-4 ring-emerald-400' : ''}`
            }>
              <CardHeader className="pb-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <CardTitle className="text-sm md:text-lg">Unassigned Players ({unassignedPlayers.length})</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        placeholder="Search..."
                        value={unassignedSearch}
                        onChange={e => setUnassignedSearch(e.target.value)}
                        className="h-8 pl-8 w-32 md:w-40 text-xs"
                      />
                    </div>
                    <Select value={unassignedSortBy} onValueChange={setUnassignedSortBy}>
                      <SelectTrigger className="h-8 w-28 text-xs">
                        <ArrowUpDown className="w-3 h-3 mr-1" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="birthYear">Birth Year</SelectItem>
                        <SelectItem value="team">Team</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={unassignedFilterLeague} onValueChange={setUnassignedFilterLeague}>
                      <SelectTrigger className="h-8 w-28 text-xs">
                        <SelectValue placeholder="Club" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Clubs</SelectItem>
                        {uniqueLeagues.map(league => (
                          <SelectItem key={league} value={league}>{league}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4">
                  {unassignedPlayers.map((player, index) => {
                    const playerTryout = tryouts.find(t => t.player_id === player.id);
                    const playerTeam = teams.find(t => t.id === player.team_id);
                    const birthYear = player.date_of_birth ? new Date(player.date_of_birth).getFullYear() : null;
                    return (
                      <Draggable key={player.id} draggableId={`player-${player.id}`} index={index}>
                        {(dragProvided, dragSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className={`transition-all ${dragSnapshot.isDragging ? 'scale-110' : ''}`}>
                            <div className="bg-slate-50 rounded-lg p-2 md:p-3 border-2 border-slate-200 cursor-grab active:cursor-grabbing hover:border-emerald-400 hover:shadow-lg">
                              <div className="flex flex-col items-center">
                                <div className="w-8 h-8 md:w-12 md:h-12 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-lg shadow-md mb-1 md:mb-2">
                                  {player.jersey_number || <User className="w-4 h-4 md:w-6 md:h-6" />}
                                </div>
                                <div className="text-[9px] md:text-xs font-bold text-slate-900 text-center mb-0.5 md:mb-1">
                                  {player.full_name}
                                </div>
                                <div className="flex flex-wrap gap-1 justify-center mb-1">
                                  {birthYear && <Badge variant="outline" className="text-[7px] px-1 py-0">{birthYear}</Badge>}
                                  {playerTeam && <Badge variant="outline" className="text-[7px] px-1 py-0 truncate max-w-[60px]">{playerTeam.name}</Badge>}
                                </div>
                                {playerTryout && (
                                  <div className="flex flex-col items-center gap-0.5 md:gap-1 w-full">
                                    {playerTryout.team_role && (
                                      <Button size="sm" className={`h-3 md:h-5 px-1 md:px-1.5 text-[7px] md:text-[9px] rounded-full pointer-events-none w-full ${teamRoleColors[playerTryout.team_role] || 'bg-blue-500'}`}>
                                        {playerTryout.team_role}
                                      </Button>
                                    )}
                                    {playerTryout.recommendation && (
                                       <Button size="sm" className={`h-3 md:h-5 px-1 md:px-1.5 text-[7px] md:text-[9px] rounded-full pointer-events-none w-full ${
                                          playerTryout.recommendation === 'Move up' ? 'bg-emerald-500' :
                                          playerTryout.recommendation === 'Move down' ? 'bg-orange-500' :
                                          'bg-blue-500'
                                       }`}>
                                          {playerTryout.recommendation}
                                       </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
                {unassignedPlayers.length === 0 &&
                  <p className="text-center text-slate-500 py-3 md:py-4 text-xs md:text-sm">
                    {unassignedSearch || unassignedFilterLeague !== 'all' ? 'No matching players found' : 'All players assigned to positions'}
                  </p>
                }
              </CardContent>
            </Card>
          )}
        </Droppable>

        {/* Save Formation Dialog */}
        <Dialog open={showSaveFormationDialog} onOpenChange={setShowSaveFormationDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Save Formation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="mb-2 block">Formation Name</Label>
                <Input
                  value={newFormationName}
                  onChange={e => setNewFormationName(e.target.value)}
                  placeholder="e.g., U-15 GA Match Day"
                />
              </div>
              <div className="text-sm text-slate-600">
                <p>This will save:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Position locations on field</li>
                  <li>Player rankings in each position</li>
                  <li>Base formation: {selectedFormation}</li>
                </ul>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowSaveFormationDialog(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleSaveNewFormation} disabled={!newFormationName.trim()} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save Formation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Player - {editForm.full_name}</DialogTitle>
            </DialogHeader>
            {editingPlayer &&
            <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="col-span-2">
                  <Label className="mb-2 block">Full Name</Label>
                  <Input
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
                </div>
                <div>
                  <Label className="mb-2 block">Jersey Number</Label>
                  <Input
                    type="number"
                    value={editForm.jersey_number}
                    onChange={(e) => setEditForm({ ...editForm, jersey_number: e.target.value })} />
                </div>
                <div>
                  <Label className="mb-2 block">Email</Label>
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                </div>
                <div>
                  <Label className="mb-2 block">Phone</Label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                </div>
                <div>
                  <Label className="mb-2 block">Date of Birth</Label>
                  <Input
                    type="date"
                    value={editForm.date_of_birth}
                    onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <Label className="mb-2 block">Primary Position</Label>
                  <Select
                    value={editForm.primary_position}
                    onValueChange={(value) => setEditForm({ ...editForm, primary_position: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(positionMapping).map((key) =>
                    <SelectItem key={key} value={key}>{key}</SelectItem>
                    )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block">Team Role</Label>
                  <Select
                    value={editForm.team_role}
                    onValueChange={(value) => setEditForm({ ...editForm, team_role: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Indispensable Player">Indispensable Player</SelectItem>
                      <SelectItem value="GA Starter">GA Starter</SelectItem>
                      <SelectItem value="GA Rotation">GA Rotation</SelectItem>
                      <SelectItem value="Aspire Starter">Aspire Starter</SelectItem>
                      <SelectItem value="Aspire Rotation">Aspire Rotation</SelectItem>
                      <SelectItem value="United Starter">United Starter</SelectItem>
                      <SelectItem value="United Rotation">United Rotation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block">Recommendation</Label>
                  <Select
                    value={editForm.recommendation}
                    onValueChange={(value) => setEditForm({ ...editForm, recommendation: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Move up">🔼 Move up</SelectItem>
                      <SelectItem value="Keep">✅ Keep</SelectItem>
                      <SelectItem value="Move down">🔽 Move down</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label className="mb-2 block">Notes</Label>
                  <Textarea
                    rows={3}
                    value={editForm.tryout_notes}
                    onChange={(e) => setEditForm({ ...editForm, tryout_notes: e.target.value })} />
                </div>
                <div className="col-span-2 flex justify-between gap-3">
                  <Button variant="outline" onClick={() => navigate(`${createPageUrl('PlayerProfile')}?id=${editingPlayer.id}`)}>
                    View Full Profile
                  </Button>
                  <Button onClick={handleSaveEdit} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>
            }
          </DialogContent>
        </Dialog>
      </div>
    </DragDropContext>);
}