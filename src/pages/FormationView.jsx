import React, { useState, useRef, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { User, Save, Plus, Search, Trash2, ChevronDown, ChevronUp, Star, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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
      { id: 'GK', x: 50, y: 90, label: 'GK', width: 160, height: 180 },
      { id: 'Right Outside Back', x: 75, y: 70, label: 'RB', width: 160, height: 180 },
      { id: 'Left Centerback', x: 58, y: 70, label: 'LCB', width: 160, height: 180 },
      { id: 'Right Centerback', x: 42, y: 70, label: 'RCB', width: 160, height: 180 },
      { id: 'Left Outside Back', x: 25, y: 70, label: 'LB', width: 160, height: 180 },
      { id: 'Center Midfielder', x: 58, y: 50, label: 'CM', width: 160, height: 180 },
      { id: 'Defensive Midfielder', x: 50, y: 58, label: 'DM', width: 160, height: 180 },
      { id: 'Attacking Midfielder', x: 42, y: 50, label: 'CAM', width: 160, height: 180 },
      { id: 'Right Winger', x: 70, y: 25, label: 'RW', width: 160, height: 180 },
      { id: 'Forward', x: 50, y: 18, label: 'ST', width: 160, height: 180 },
      { id: 'Left Winger', x: 30, y: 25, label: 'LW', width: 160, height: 180 }
    ]
  },
  '4-2-3-1': {
    name: '4-2-3-1',
    positions: [
      { id: 'GK', x: 50, y: 90, label: 'GK', width: 160, height: 180 },
      { id: 'Right Outside Back', x: 75, y: 70, label: 'RB', width: 160, height: 180 },
      { id: 'Left Centerback', x: 58, y: 70, label: 'LCB', width: 160, height: 180 },
      { id: 'Right Centerback', x: 42, y: 70, label: 'RCB', width: 160, height: 180 },
      { id: 'Left Outside Back', x: 25, y: 70, label: 'LB', width: 160, height: 180 },
      { id: 'Defensive Midfielder', x: 56, y: 55, label: 'DM', width: 160, height: 180 },
      { id: 'Center Midfielder', x: 44, y: 55, label: 'CM', width: 160, height: 180 },
      { id: 'Right Winger', x: 70, y: 35, label: 'RW', width: 160, height: 180 },
      { id: 'Attacking Midfielder', x: 50, y: 35, label: 'CAM', width: 160, height: 180 },
      { id: 'Left Winger', x: 30, y: 35, label: 'LW', width: 160, height: 180 },
      { id: 'Forward', x: 50, y: 18, label: 'ST', width: 160, height: 180 }
    ]
  },
  '4-4-2': {
    name: '4-4-2',
    positions: [
      { id: 'GK', x: 50, y: 90, label: 'GK', width: 160, height: 180 },
      { id: 'Right Outside Back', x: 75, y: 70, label: 'RB', width: 160, height: 180 },
      { id: 'Left Centerback', x: 58, y: 70, label: 'LCB', width: 160, height: 180 },
      { id: 'Right Centerback', x: 42, y: 70, label: 'RCB', width: 160, height: 180 },
      { id: 'Left Outside Back', x: 25, y: 70, label: 'LB', width: 160, height: 180 },
      { id: 'Right Winger', x: 75, y: 45, label: 'RM', width: 160, height: 180 },
      { id: 'Center Midfielder', x: 58, y: 50, label: 'CM', width: 160, height: 180 },
      { id: 'Defensive Midfielder', x: 42, y: 50, label: 'DM', width: 160, height: 180 },
      { id: 'Left Winger', x: 25, y: 45, label: 'LM', width: 160, height: 180 },
      { id: 'Forward', x: 56, y: 20, label: 'ST', width: 160, height: 180 },
      { id: 'Attacking Midfielder', x: 44, y: 20, label: 'ST', width: 160, height: 180 }
    ]
  },
  '3-5-2': {
    name: '3-5-2',
    positions: [
      { id: 'GK', x: 50, y: 90, label: 'GK', width: 160, height: 180 },
      { id: 'Right Centerback', x: 60, y: 70, label: 'RCB', width: 160, height: 180 },
      { id: 'Left Centerback', x: 50, y: 72, label: 'CB', width: 160, height: 180 },
      { id: 'Left Outside Back', x: 40, y: 70, label: 'LCB', width: 160, height: 180 },
      { id: 'Right Outside Back', x: 75, y: 50, label: 'RWB', width: 160, height: 180 },
      { id: 'Center Midfielder', x: 58, y: 50, label: 'CM', width: 160, height: 180 },
      { id: 'Defensive Midfielder', x: 50, y: 55, label: 'DM', width: 160, height: 180 },
      { id: 'Attacking Midfielder', x: 42, y: 50, label: 'CAM', width: 160, height: 180 },
      { id: 'Left Winger', x: 25, y: 50, label: 'LWB', width: 160, height: 180 },
      { id: 'Forward', x: 56, y: 22, label: 'ST', width: 160, height: 180 },
      { id: 'Right Winger', x: 44, y: 22, label: 'ST', width: 160, height: 180 }
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
  const [playerFilterBranch, setPlayerFilterBranch] = useState('all');
  const [playerFilterAgeGroup, setPlayerFilterAgeGroup] = useState('all');
  const [playerFilterTeamRole, setPlayerFilterTeamRole] = useState('all');
  const [playerFilterBirthYear, setPlayerFilterBirthYear] = useState('all');
  const [playerFilterCurrentTeam, setPlayerFilterCurrentTeam] = useState('all');
  const [birthdayFrom, setBirthdayFrom] = useState('');
  const [birthdayTo, setBirthdayTo] = useState('');
  const [showSaveFormationDialog, setShowSaveFormationDialog] = useState(false);
  const [newFormationName, setNewFormationName] = useState('');
  const [selectedSavedFormation, setSelectedSavedFormation] = useState(null);
  const [draggingPosition, setDraggingPosition] = useState(null);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [resizingPosition, setResizingPosition] = useState(null);
  const resizeStartRef = useRef(null);

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
    mutationFn: async ({ playerId, newRanking, position, ageGroupRanking }) => {
      const player = allPlayers.find(p => p.id === playerId);
      const existingTryout = tryouts.find(t => t.player_id === playerId);
      const teamData = teams.find(t => t.id === player?.team_id);

      if (existingTryout) {
        return base44.entities.PlayerTryout.update(existingTryout.id, { 
          team_ranking: newRanking, 
          primary_position: position,
          age_group_ranking: ageGroupRanking || newRanking
        });
      } else {
        return base44.entities.PlayerTryout.create({
          player_id: playerId,
          player_name: player?.full_name,
          current_team: teamData?.name,
          primary_position: position,
          team_ranking: newRanking,
          age_group_ranking: ageGroupRanking || newRanking
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
    const posPlayers = players?.filter((player) => player.primary_position === positionId) || [];
    const withTryout = posPlayers?.map((p) => {
      const tryout = tryouts.find((t) => t.player_id === p.id);
      return { ...p, tryout };
    });
    return withTryout.sort((a, b) => {
      const rankA = a.tryout?.team_ranking || 9999;
      const rankB = b.tryout?.team_ranking || 9999;
      return rankA - rankB;
    });
  }, [players, tryouts]);

  const uniqueAgeGroups = [...new Set(teams?.map(t => t.age_group).filter(Boolean) || [])].sort();
  const uniqueBirthYears = [...new Set(allPlayers?.map(p => p.date_of_birth ? new Date(p.date_of_birth).getFullYear().toString() : null).filter(Boolean) || [])].sort((a, b) => b - a);
  const uniqueCurrentTeams = [...new Set(allPlayers?.map(p => teams?.find(t => t.id === p.team_id)?.name).filter(Boolean) || [])].sort();

  const getPlayerWithTryoutData = (playerId) => {
    const player = allPlayers.find(p => p.id === playerId);
    if (!player) return null;
    const tryout = tryouts.find(t => t.player_id === playerId);
    return { ...player, tryout: tryout || {} };
  };

  const unassignedPlayers = useMemo(() => {
    let filtered = allPlayers.filter(player => !player.primary_position || !Object.keys(positionMapping).includes(player.primary_position))
      .map(p => getPlayerWithTryoutData(p.id))
      .filter(p => p);
    
    if (unassignedSearch) {
      const search = unassignedSearch.toLowerCase();
      filtered = filtered.filter(p => p.full_name?.toLowerCase().includes(search));
    }

    const matchesBranch = (p) => playerFilterBranch === 'all' || p.branch === playerFilterBranch;
    const matchesAgeGroup = (p) => {
      if (playerFilterAgeGroup === 'all') return true;
      const playerTeam = teams.find(t => t.id === p.team_id);
      return playerTeam?.age_group === playerFilterAgeGroup;
    };
    const matchesCurrentTeam = (p) => {
      if (playerFilterCurrentTeam === 'all') return true;
      const playerTeam = teams.find(t => t.id === p.team_id);
      return playerTeam?.name === playerFilterCurrentTeam;
    };
    const matchesBirthYear = (p) => {
      if (playerFilterBirthYear === 'all') return true;
      const birthYear = p.date_of_birth ? new Date(p.date_of_birth).getFullYear().toString() : null;
      return birthYear === playerFilterBirthYear;
    };
    const matchesTeamRole = (p) => {
      if (playerFilterTeamRole === 'all') return true;
      if (playerFilterTeamRole === 'none') return !p.tryout?.team_role;
      return p.tryout?.team_role === playerFilterTeamRole;
    };
    const matchesBirthdayRange = (p) => {
      if (!p.date_of_birth) return true;
      let matches = true;
      if (birthdayFrom) matches = matches && new Date(p.date_of_birth) >= new Date(birthdayFrom);
      if (birthdayTo) matches = matches && new Date(p.date_of_birth) <= new Date(birthdayTo);
      return matches;
    };

    filtered = filtered.filter(p => matchesBranch(p) && matchesAgeGroup(p) && matchesCurrentTeam(p) && matchesBirthYear(p) && matchesTeamRole(p) && matchesBirthdayRange(p));
    
    return filtered.sort((a, b) => {
      if (!a.date_of_birth) return 1;
      if (!b.date_of_birth) return -1;
      return new Date(a.date_of_birth) - new Date(b.date_of_birth);
    });
  }, [allPlayers, unassignedSearch, playerFilterBranch, playerFilterAgeGroup, playerFilterTeamRole, playerFilterBirthYear, playerFilterCurrentTeam, birthdayFrom, birthdayTo, teams, tryouts]);

  const handleDragEnd = useCallback(async (result) => {
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
    const draggedPlayer = allPlayers.find(p => p.id === draggedPlayerId);
    const ageGroup = teams.find(t => t.id === draggedPlayer?.team_id)?.age_group || selectedAgeGroup;
    
    const sameAgeGroupPlayers = allPlayers.filter(p => {
      const playerTeam = teams.find(t => t.id === p.team_id);
      return playerTeam?.age_group === ageGroup && p.primary_position === destPositionId && p.id !== draggedPlayerId;
    });
    
    const updates = [];
    for (const player of sameAgeGroupPlayers) {
      const playerTryout = tryouts.find(t => t.player_id === player.id);
      const currentRank = playerTryout?.age_group_ranking || 9999;
      
      if (currentRank >= newRanking) {
        updates.push(
          updateTryoutMutation.mutateAsync({
            playerId: player.id,
            newRanking: currentRank + 1,
            position: destPositionId,
            ageGroupRanking: currentRank + 1
          })
        );
      }
    }
    
    await Promise.all(updates);
    
    updateTryoutMutation.mutate({
      playerId: draggedPlayerId,
      newRanking,
      position: destPositionId,
      ageGroupRanking: newRanking
    });
  }, [updatePlayerMutation, updateTryoutMutation, allPlayers, teams, tryouts, selectedAgeGroup]);

  const handleSaveNewFormation = () => {
    if (!newFormationName?.trim()) return;
    
    saveFormationMutation.mutate({
      name: newFormationName,
      team_id: selectedTeam !== 'all' ? selectedTeam : null,
      age_group: selectedAgeGroup !== 'all' ? selectedAgeGroup : null,
      base_formation: selectedFormation,
      positions: formationPositions,
      player_assignments: formationPositions?.map(pos => ({
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

  React.useEffect(() => {
    const defaultFormation = savedFormations.find(f => f.is_default);
    if (defaultFormation) {
      handleLoadSavedFormation(defaultFormation);
    }
  }, [savedFormations.length]);

  const handlePositionDrag = (e, position) => {
    if (!fieldRef.current) return;
    const rect = fieldRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setFormationPositions(prev => prev.map(pos => 
      pos.id === position.id ? { ...pos, x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) } : pos
    ));
  };

  const handleResizeStart = (e, position) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingPosition(position.id);
    
    if (!fieldRef.current) return;
    const fieldRect = fieldRef.current.getBoundingClientRect();
    
    resizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: position.width || 140,
      startHeight: position.height || 100,
      fieldRect
    };

    const handleMouseMove = (moveEvent) => {
      if (!resizeStartRef.current) return;
      const deltaX = moveEvent.clientX - resizeStartRef.current.startX;
      const deltaY = moveEvent.clientY - resizeStartRef.current.startY;
      
      const newWidth = Math.max(100, Math.min(300, resizeStartRef.current.startWidth + deltaX));
      const newHeight = Math.max(120, Math.min(400, resizeStartRef.current.startHeight + deltaY));

      setFormationPositions(prev => prev.map(pos => 
        pos.id === position.id ? { ...pos, width: newWidth, height: newHeight } : pos
      ));
    };

    const handleMouseUp = () => {
      setResizingPosition(null);
      resizeStartRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleExportFieldPDF = async () => {
    setExportingPDF(true);
    toast.info('Generating PDF...');
    
    try {
      const fieldElement = fieldRef.current;
      const canvas = await html2canvas(fieldElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
      pdf.save(`${team?.name || 'Formation'}_${selectedFormation}.pdf`);
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    } finally {
      setExportingPDF(false);
    }
  };

  const formation = { name: formations[selectedFormation].name, positions: formationPositions };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="p-2 md:p-4 lg:p-8 mx-auto flex flex-col lg:flex-row gap-4">
        <div className="flex-1 max-w-5xl">
          <div className="mb-4 md:mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-900">{team?.name || 'Formation View'}</h1>
            <p className="text-xs md:text-sm text-slate-600">Drag players to rank. Drag positions to move. Resize from corner.</p>
          </div>
          <Button onClick={handleExportFieldPDF} disabled={exportingPDF} className="bg-emerald-600 hover:bg-emerald-700 w-full md:w-auto">
            <Download className="w-4 h-4 mr-2" />
            {exportingPDF ? 'Exporting...' : 'Export PDF'}
          </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3 mb-4">
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
                  {Object.keys(formations)?.map((key) => (
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
                  {teams?.map((team) => (
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
                  {[...new Set(teams?.map((t) => t.age_group).filter(Boolean) || [])].map((ageGroup) => (
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
                    {savedFormations?.map(sf => (
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
                className="relative w-full bg-white"
                style={{ paddingBottom: '140%', maxHeight: '900px' }}
              >
                <div className="absolute inset-0 border-4 border-emerald-600">
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 140" preserveAspectRatio="none">
                    <rect x="0" y="0" width="100" height="140" fill="white" stroke="#10b981" strokeWidth="0.8" />
                    <line x1="0" y1="70" x2="100" y2="70" stroke="#10b981" strokeWidth="0.4" />
                    <circle cx="50" cy="70" r="8" fill="none" stroke="#10b981" strokeWidth="0.4" />
                    <circle cx="50" cy="70" r="0.5" fill="#10b981" />
                    <rect x="10" y="0" width="80" height="15" fill="none" stroke="#10b981" strokeWidth="0.4" />
                    <rect x="10" y="125" width="80" height="15" fill="none" stroke="#10b981" strokeWidth="0.4" />
                    <rect x="30" y="0" width="40" height="6" fill="none" stroke="#10b981" strokeWidth="0.4" />
                    <rect x="30" y="134" width="40" height="6" fill="none" stroke="#10b981" strokeWidth="0.4" />
                  </svg>

                  {formation.positions?.map((position) => {
                    const positionPlayers = getPlayersForPosition(position.id);
                    return (
                      <div
                        key={position.id}
                        draggable
                        onDragStart={() => setDraggingPosition(position.id)}
                        onDrag={(e) => {
                          if (draggingPosition === position.id && e.clientX > 0 && e.clientY > 0) {
                            handlePositionDrag(e, position);
                          }
                        }}
                        onDragEnd={() => setDraggingPosition(null)}
                        className={`absolute ${draggingPosition === position.id ? 'opacity-70' : ''}`}
                        style={{
                          left: `${position.x}%`,
                          top: `${position.y}%`,
                          transform: 'translate(-50%, -50%)',
                          width: `${position.width || 140}px`,
                          maxWidth: '25vw',
                          zIndex: 10
                        }}
                      >
                        <Droppable droppableId={`position-${position.id}`}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`bg-white/95 backdrop-blur-sm p-1.5 rounded-lg shadow-lg border-2 transition-all relative group ${
                                snapshot.isDraggingOver ? 'border-emerald-500 scale-105' : 'border-emerald-600'
                              }`}
                              style={{ 
                                minHeight: `${position.height || 180}px`,
                                maxHeight: `${position.height || 180}px`
                              }}
                            >
                              <div className="text-center text-[9px] font-bold text-emerald-700 mb-1 pb-1 border-b border-emerald-200 cursor-move">
                                {position.label}
                              </div>
                              <div className="space-y-1 overflow-y-auto" style={{ maxHeight: `${(position.height || 180) - 30}px` }}>
                                {positionPlayers?.map((player, index) => (
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
                                        className={`p-1.5 border-2 rounded-lg bg-white cursor-pointer transition-all ${
                                          dragSnapshot.isDragging ? 'shadow-2xl border-emerald-500 rotate-1 scale-105' : 'border-slate-200 hover:border-emerald-300 hover:shadow-md'
                                        }`}
                                      >
                                        <div className="flex items-start gap-1">
                                          <div className="w-5 h-5 bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-[8px] flex-shrink-0 shadow-sm">
                                            {player.jersey_number || '#'}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="font-bold text-[9px] text-slate-900 whitespace-normal break-words leading-tight">{player.full_name}</div>
                                            {player.date_of_birth && (
                                              <div className="text-[7px] text-slate-500">{new Date(player.date_of_birth).getFullYear()}</div>
                                            )}
                                            {player.tryout?.age_group_ranking && (
                                              <div className="text-[7px] text-emerald-700 font-bold">AG Rank: {player.tryout.age_group_ranking}</div>
                                            )}
                                            {player.tryout?.team_role && (
                                              <Badge className="text-[7px] px-1 py-0 mt-0.5 bg-purple-100 text-purple-800">
                                                {player.tryout.team_role}
                                              </Badge>
                                            )}
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
                              <div 
                                className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-600 rounded-tl cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                onMouseDown={(e) => handleResizeStart(e, position)}
                              >
                                <div className="w-1.5 h-1.5 bg-white rounded-full" />
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

        <Droppable droppableId="position-unassigned">
          {(provided, snapshot) => (
            <Card
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`lg:sticky lg:top-4 h-fit w-full lg:w-80 border-none shadow-xl transition-all ${
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
                    <div className="space-y-2 mb-3">
                      <Label className="text-xs font-bold text-slate-700">Filter Players</Label>
                      <div className="relative">
                        <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                          placeholder="Search players..."
                          value={unassignedSearch}
                          onChange={e => setUnassignedSearch(e.target.value)}
                          className="h-8 pl-7 text-xs"
                        />
                      </div>
                      <Select value={playerFilterAgeGroup} onValueChange={setPlayerFilterAgeGroup}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Age Group" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Age Groups</SelectItem>
                          {uniqueAgeGroups?.map(ag => (
                            <SelectItem key={ag} value={ag}>{ag}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={playerFilterBirthYear} onValueChange={setPlayerFilterBirthYear}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Birth Year" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Birth Years</SelectItem>
                          {uniqueBirthYears?.map(year => (
                            <SelectItem key={year} value={year}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={playerFilterBranch} onValueChange={setPlayerFilterBranch}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Branch" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Branches</SelectItem>
                          {['CW3', 'Dearborn', 'Downriver', 'Genesee', 'Huron Valley', 'Jackson', 'Lansing', 'Marshall', 'Northville', 'Novi', 'Rochester Romeo', 'West Bloomfield']?.map(branch => (
                            <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={playerFilterTeamRole} onValueChange={setPlayerFilterTeamRole}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Team Role" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Roles</SelectItem>
                          {['Indispensable Player', 'GA Starter', 'GA Rotation', 'Aspire Starter', 'Aspire Rotation', 'United Starter', 'United Rotation']?.map(role => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
                          ))}
                          <SelectItem value="none">No Data</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={playerFilterCurrentTeam} onValueChange={setPlayerFilterCurrentTeam}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Current Team" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Teams</SelectItem>
                          {uniqueCurrentTeams?.map(teamName => (
                            <SelectItem key={teamName} value={teamName}>{teamName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div>
                        <Label className="text-[9px] text-slate-600">Birthday From</Label>
                        <Input
                          type="date"
                          value={birthdayFrom}
                          onChange={(e) => setBirthdayFrom(e.target.value)}
                          className="h-8 text-xs mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-[9px] text-slate-600">Birthday To</Label>
                        <Input
                          type="date"
                          value={birthdayTo}
                          onChange={(e) => setBirthdayTo(e.target.value)}
                          className="h-8 text-xs mt-1"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setUnassignedSearch('');
                          setPlayerFilterBranch('all');
                          setPlayerFilterAgeGroup('all');
                          setPlayerFilterBirthYear('all');
                          setPlayerFilterTeamRole('all');
                          setPlayerFilterCurrentTeam('all');
                          setBirthdayFrom('');
                          setBirthdayTo('');
                        }}
                        className="h-8 text-xs mt-2"
                      >
                        Reset Filters
                      </Button>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
                <div className="space-y-1.5 p-2.5 rounded-xl overflow-y-auto" style={{ maxHeight: 'calc(100vh - 450px)' }}>
                  {unassignedPlayers?.map((player, index) => {
                    const team = teams.find(t => t.id === player.team_id);
                    const age = player.date_of_birth ? new Date().getFullYear() - new Date(player.date_of_birth).getFullYear() : null;
                    const isTrapped = player.date_of_birth ? (() => {
                      const dob = new Date(player.date_of_birth);
                      const month = dob.getMonth();
                      const day = dob.getDate();
                      return (month === 7 && day >= 1) || (month >= 8 && month <= 11);
                    })() : false;
                    
                    return (
                      <Draggable key={player.id} draggableId={`player-${player.id}`} index={index}>
                        {(dragProvided, dragSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            onClick={() => navigate(`${createPageUrl('PlayerDashboard')}?id=${player.id}`)}
                            className={`p-2.5 border-2 rounded-xl transition-all cursor-pointer ${isTrapped ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-400' : 'bg-white'} ${dragSnapshot.isDragging ? 'shadow-2xl border-emerald-500 rotate-2 scale-105' : 'border-slate-200 hover:border-emerald-300 hover:shadow-lg'}`}
                          >
                            <div className="flex items-start gap-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-md">
                                {player.jersey_number || <User className="w-4 h-4" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-xs text-slate-900 truncate">{player.full_name}</div>
                                <div className="text-[10px] text-slate-600 font-medium">{player.primary_position || 'No Position'}</div>
                                {team?.name && <div className="text-[9px] text-slate-500 truncate">Current: {team.name}</div>}
                                <div className="flex flex-wrap gap-0.5 mt-1.5">
                                  {player.grad_year && (
                                    <Badge className="bg-slate-600 text-white text-[8px] px-1.5 py-0 font-bold">'{player.grad_year.toString().slice(-2)}</Badge>
                                  )}
                                  {isTrapped && <Badge className="bg-red-500 text-white text-[8px] px-1.5 py-0 font-bold">TRAPPED</Badge>}
                                  {team?.age_group && <Badge className="text-[8px] px-1.5 py-0.5 bg-slate-100 text-slate-700 font-semibold">{team.age_group}</Badge>}
                                  {age && <Badge className="text-[8px] px-1.5 py-0.5 bg-blue-100 text-blue-800 font-semibold">{age}y</Badge>}
                                  {player.tryout?.team_role && (
                                    <Badge className="text-[8px] px-1.5 py-0 bg-purple-100 text-purple-800">
                                      {player.tryout.team_role}
                                    </Badge>
                                  )}
                                  {player.tryout?.recommendation && (
                                    <Badge className={`text-[8px] px-1.5 py-0.5 font-bold ${
                                      player.tryout.recommendation === 'Move up' ? 'bg-emerald-500 text-white' :
                                      player.tryout.recommendation === 'Move down' ? 'bg-orange-500 text-white' :
                                      'bg-blue-500 text-white'
                                    }`}>
                                      {player.tryout.recommendation === 'Move up' ? '⬆️' : player.tryout.recommendation === 'Move down' ? '⬇️' : '➡️'}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
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