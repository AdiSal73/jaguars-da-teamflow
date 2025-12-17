import React, { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { User, Edit2, Save, Plus, Search, ArrowUpDown, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import PlayerInfoTooltip, { PlayerHoverTooltip } from '../components/player/PlayerInfoTooltip';
import { getPositionBorderColor } from '../components/player/positionColors';
import { isTrappedPlayer } from '../components/utils/trappedPlayer';
import EditablePlayerCard from '../components/player/EditablePlayerCard';

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
  const [selectedGender, setSelectedGender] = useState('all');
  const [formationPositions, setFormationPositions] = useState(formations['4-3-3'].positions);
  const [draggingPosition, setDraggingPosition] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showSaveFormationDialog, setShowSaveFormationDialog] = useState(false);
  const [newFormationName, setNewFormationName] = useState('');
  const [selectedSavedFormation, setSelectedSavedFormation] = useState(null);
  const [unassignedSearch, setUnassignedSearch] = useState('');
  const [unassignedSortBy, setUnassignedSortBy] = useState('name');
  const [unassignedFilterLeague, setUnassignedFilterLeague] = useState('all');
  const [unassignedFilterTeam, setUnassignedFilterTeam] = useState('all');
  const [unassignedFilterAgeGroup, setUnassignedFilterAgeGroup] = useState('all');
  const [unassignedFilterBirthYear, setUnassignedFilterBirthYear] = useState('all');
  const [showAllPlayers, setShowAllPlayers] = useState(false);
  const [showTrappedOnly, setShowTrappedOnly] = useState(false);
  const [unassignedFiltersOpen, setUnassignedFiltersOpen] = useState(false);
  

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

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => base44.entities.PhysicalAssessment.list()
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations'],
    queryFn: () => base44.entities.Evaluation.list()
  });

  const { data: clubSettings = [] } = useQuery({
    queryKey: ['clubSettings'],
    queryFn: () => base44.entities.ClubSettings.list()
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
    if (!newFormationName || typeof newFormationName !== 'string' || !newFormationName.trim()) return;
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

    if (selectedGender !== 'all') {
      return player.gender === selectedGender;
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
      const playerTeam = teams.find(t => t.id === p.team_id);
      const currentTeam = teams.find(t => t.id === selectedTeam);
      
      // Check if player is age ineligible
      let isAgeIneligible = false;
      if (p.date_of_birth && currentTeam?.age_group) {
        const playerBirthYear = new Date(p.date_of_birth).getFullYear();
        const teamAgeMatch = currentTeam.age_group.match(/U-?(\d+)/i);
        if (teamAgeMatch) {
          const teamAge = parseInt(teamAgeMatch[1]);
          const currentYear = new Date().getFullYear();
          const teamBirthYear = currentYear - teamAge;
          isAgeIneligible = playerBirthYear < teamBirthYear;
        }
      }
      
      return { ...p, tryout, isAgeIneligible };
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

  // Filtered and sorted unassigned players - independent of field filters
  const unassignedPlayers = useMemo(() => {
    let filtered = allPlayers.filter(player => !player.primary_position || !Object.keys(positionMapping).includes(player.primary_position));
    
    if (unassignedSearch) {
      const search = unassignedSearch.toLowerCase();
      filtered = filtered.filter(p => p.full_name?.toLowerCase().includes(search));
    }
    
    if (unassignedFilterLeague !== 'all') {
      filtered = filtered.filter(p => {
        const playerTeam = teams.find(t => t.id === p.team_id);
        return playerTeam?.league === unassignedFilterLeague;
      });
    }

    if (unassignedFilterTeam !== 'all') {
      filtered = filtered.filter(p => p.team_id === unassignedFilterTeam);
    }

    if (unassignedFilterAgeGroup !== 'all') {
      filtered = filtered.filter(p => {
        const playerTeam = teams.find(t => t.id === p.team_id);
        return playerTeam?.age_group === unassignedFilterAgeGroup;
      });
    }

    if (unassignedFilterBirthYear !== 'all') {
      filtered = filtered.filter(p => {
        const birthYear = p.date_of_birth ? new Date(p.date_of_birth).getFullYear() : null;
        return birthYear?.toString() === unassignedFilterBirthYear;
      });
    }
    
    if (showTrappedOnly) {
      filtered = filtered.filter(p => isTrappedPlayer(p.date_of_birth));
    }
    
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
        const teamAName = teams.find(t => t.id === a.team_id)?.name;
        const teamBName = teams.find(t => t.id === b.team_id)?.name;
        const teamA = typeof teamAName === 'string' ? teamAName : '';
        const teamB = typeof teamBName === 'string' ? teamBName : '';
        return teamA.localeCompare(teamB);
      }
      return 0;
    });
  }, [allPlayers, teams, unassignedSearch, unassignedSortBy, unassignedFilterLeague, unassignedFilterTeam, unassignedFilterAgeGroup, unassignedFilterBirthYear, showTrappedOnly]);

  const uniqueLeagues = [...new Set(teams.map(t => t.league).filter(Boolean))];
  const uniqueAgeGroups = [...new Set(teams.map(t => t.age_group).filter(Boolean))];
  const uniqueBirthYears = [...new Set(allPlayers.map(p => p.date_of_birth ? new Date(p.date_of_birth).getFullYear() : null).filter(Boolean))].sort((a, b) => b - a);

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
      <div className="p-4 md:p-8 mx-auto flex gap-4">
        <div className="flex-1 max-w-5xl">
        <div className="mb-4 md:mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl md:text-3xl font-bold text-slate-900">{team?.name || 'Formation View'}</h1>
          </div>
          <p className="text-xs md:text-base text-slate-600">Drag players to rank them within each position</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-4 mb-4 md:mb-6">
          <div>
            <Label className="mb-2 block text-sm font-semibold">Gender</Label>
            <Select value={selectedGender} onValueChange={(value) => {setSelectedGender(value);setSelectedTeam('all');setSelectedAgeGroup('all');}}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Male">Boys</SelectItem>
                <SelectItem value="Female">Girls</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
                {teams.filter(team => team.name && typeof team.name === 'string').map((team) =>
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
                paddingBottom: 'min(140%, 1000px)',
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
                        width: 'min(180px, 28vw)',
                        maxHeight: 'min(350px, 50vh)',
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
                                  
                                          <PlayerHoverTooltip
                                           player={player}
                                           tryout={player.tryout}
                                           evaluation={evaluations.filter(e => e.player_id === player.id).sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0]}
                                           assessment={assessments.filter(a => a.player_id === player.id).sort((a, b) => new Date(b.assessment_date) - new Date(a.assessment_date))[0]}
                                          >
                                          <div 
                                           onClick={() => navigate(`${createPageUrl('PlayerDashboard')}?id=${player.id}`)}
                                           className={`bg-white rounded-md px-1 md:px-1.5 py-1 md:py-1.5 border-2 cursor-grab active:cursor-grabbing hover:border-emerald-400 hover:shadow-md group relative ${getPositionBorderColor(player.primary_position)}`}>
                                           <div className="flex items-center gap-0.5 md:gap-1 mb-0.5">
                                                                                               <div className="w-4 h-4 md:w-5 md:h-5 bg-slate-800 rounded flex items-center justify-center text-white font-bold text-[8px] md:text-[10px] flex-shrink-0">
                                                                                                 #{player.tryout?.team_ranking || index + 1}
                                                                                               </div>
                                                                                               <div className="flex-1 min-w-0">
                                                                                                 <div className="text-[8px] md:text-[10px] font-bold text-slate-900 truncate leading-tight">
                                                                                                   {player.full_name}
                                                                                                 </div>
                                                                                                 {player.date_of_birth && (
                                                                                                   <div className="text-[7px] text-slate-500">{new Date(player.date_of_birth).getFullYear()}</div>
                                                                                                 )}
                                                                                               </div>
                                                                                                                                                <button
                                                                                                                                          onClick={(e) => handleEditClick(player, e)}
                                                                                                                                          className="w-3 h-3 hover:bg-slate-200 rounded flex items-center justify-center opacity-50 hover:opacity-100">
                                                                                                                                                  <Edit2 className="w-2 h-2" />
                                                                                                                                                </button>
                                                                                                                                              </div>
                                                                                            <div className="flex flex-wrap gap-0.5 justify-center">
                                                                                              {player.isAgeIneligible && (
                                                                                                <Badge className="bg-red-500 text-white text-[7px] md:text-[8px] px-1">
                                                                                                  Age Ineligible
                                                                                                </Badge>
                                                                                              )}
                                                                                              {player.tryout?.team_role && (
                                                                                                <Button 
                                                                                                  size="sm" 
                                                                                                  className={`h-3 md:h-4 px-1 text-[7px] md:text-[8px] rounded-full pointer-events-none ${teamRoleColors[player.tryout.team_role] || 'bg-blue-500 hover:bg-blue-600'}`}
                                                                                                >
                                                                                                  {player.tryout.team_role}
                                                                                                </Button>
                                                                                              )}
                                                                                              {player.tryout?.recommendation && (
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
                                                                                          </div>
                                                                                          </PlayerHoverTooltip>
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

        </div>

        {/* Unassigned Players Side Panel */}
        <Droppable droppableId="position-unassigned">
          {(provided, snapshot) => (
          <Card
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`sticky top-4 h-fit w-80 border-none shadow-2xl transition-all ${
            snapshot.isDraggingOver ? 'ring-4 ring-emerald-400' : ''}`
            }>
              <CardHeader className="pb-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold">Unassigned Players ({unassignedPlayers.length})</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUnassignedFiltersOpen(!unassignedFiltersOpen)}
                      className="text-white hover:bg-white/20 h-7 px-2"
                    >
                      {unassignedFiltersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Collapsible open={unassignedFiltersOpen}>
                    <CollapsibleContent>
                  <div className="flex flex-col gap-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-white/60" />
                      <Input
                        placeholder="Search..."
                        value={unassignedSearch}
                        onChange={e => setUnassignedSearch(e.target.value)}
                        className="h-8 pl-8 w-full text-xs bg-white/20 text-white placeholder:text-white/60 border-white/30"
                      />
                    </div>
                    <Select value={unassignedSortBy} onValueChange={setUnassignedSortBy}>
                      <SelectTrigger className="h-8 text-xs bg-white/20 text-white border-white/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Sort: Name</SelectItem>
                        <SelectItem value="birthYear">Sort: Birth Year</SelectItem>
                        <SelectItem value="team">Sort: Team</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={unassignedFilterTeam} onValueChange={setUnassignedFilterTeam}>
                      <SelectTrigger className="h-8 text-xs bg-white/20 text-white border-white/30">
                        <SelectValue placeholder="All Teams" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Teams</SelectItem>
                        {teams.filter(t => t.name).map(team => (
                          <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={showTrappedOnly ? 'trapped' : 'all'} onValueChange={(val) => setShowTrappedOnly(val === 'trapped')}>
                      <SelectTrigger className="h-8 text-xs bg-white/20 text-white border-white/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Players</SelectItem>
                        <SelectItem value="trapped">Trapped Only</SelectItem>
                      </SelectContent>
                    </Select>
                    </div>
                    </CollapsibleContent>
                  </Collapsible>
                    </div>
                    </CardHeader>
              <CardContent className="max-h-[calc(100vh-280px)] overflow-y-auto">
                <div className="grid grid-cols-1 gap-2">
                  {unassignedPlayers.map((player, index) => {
                  const playerTryout = tryouts.find(t => t.player_id === player.id);
                  const playerTeam = teams.find(t => t.id === player.team_id);
                  return (
                    <Draggable key={player.id} draggableId={`player-${player.id}`} index={index}>
                      {(dragProvided, dragSnapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                          className={`transition-all ${dragSnapshot.isDragging ? 'scale-105 rotate-1' : ''}`}>
                          <EditablePlayerCard
                            player={player}
                            tryout={playerTryout}
                            team={playerTeam}
                            teams={teams}
                            clubSettings={clubSettings}
                            className="cursor-grab active:cursor-grabbing"
                          />
                        </div>
                      )}
                    </Draggable>
                  );
                  })}
                  {provided.placeholder}
                </div>
                {unassignedPlayers.length === 0 &&
                  <p className="text-center text-white/70 py-3 md:py-4 text-xs md:text-sm">
                    {unassignedSearch || unassignedFilterLeague !== 'all' ? 'No matching players found' : 'All players assigned'}
                  </p>
                }
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
                <Button onClick={handleSaveNewFormation} disabled={!newFormationName || typeof newFormationName !== 'string' || !newFormationName.trim()} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
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
                  <Button variant="outline" onClick={() => navigate(`${createPageUrl('PlayerDashboard')}?id=${editingPlayer.id}`)}>
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
      </DragDropContext>
  );
}