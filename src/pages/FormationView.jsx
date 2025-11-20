import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { User, Edit2, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

  // Load custom formation from team
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

  const updatePlayerPositionMutation = useMutation({
    mutationFn: async ({ playerId, newPosition }) => {
      return base44.entities.Player.update(playerId, {
        primary_position: newPosition
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['players']);
      setShowEditDialog(false);
      setEditingPlayer(null);
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
      updatePlayerPositionMutation.mutate({
        playerId: draggedPlayerId,
        newPosition: destPositionId
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

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">{team?.name || 'Formation View'}</h1>
          <p className="text-sm md:text-base text-slate-600">Drag players to rank them within each position</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
          <div>
            <Label className="mb-2 block text-base md:text-lg font-semibold">Select Formation</Label>
            <Select value={selectedFormation} onValueChange={setSelectedFormation}>
              <SelectTrigger className="h-10 md:h-12">
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
            <Label className="mb-2 block text-base md:text-lg font-semibold">Filter by Team</Label>
            <Select value={selectedTeam} onValueChange={(value) => {setSelectedTeam(value);setSelectedAgeGroup('all');}}>
              <SelectTrigger className="h-10 md:h-12">
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
            <Label className="mb-2 block text-base md:text-lg font-semibold">Filter by Age Group</Label>
            <Select value={selectedAgeGroup} onValueChange={(value) => {setSelectedAgeGroup(value);setSelectedTeam('all');}}>
              <SelectTrigger className="h-10 md:h-12">
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
        </div>

        <Card className="border-none shadow-2xl overflow-hidden">
          <CardContent className="p-0">
            <div
              ref={fieldRef}
              className="relative w-full"
              style={{
                paddingBottom: 'min(140%, 800px)',
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
                        width: 'clamp(140px, 25vw, 280px)',
                        maxHeight: 'min(450px, 50vh)',
                        zIndex: draggingPosition?.id === position.id ? 1000 : 1
                      }}>
                      
                      <Droppable droppableId={`position-${position.id}`}>
                        {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}>
                          
                            <div className="bg-slate-200 p-1.5 md:p-2 rounded-xl md:rounded-2xl backdrop-blur-sm shadow-2xl border-2 overflow-y-auto max-h-[40vh] md:max-h-[450px] transition-all border-slate-300">
                              <div
                              onMouseDown={(e) => handlePositionMouseDown(position, e)}
                              className="text-center text-xs md:text-sm font-bold text-slate-700 mb-1 sticky top-0 bg-white/95 pb-1 border-b-2 border-slate-300 cursor-move hover:bg-slate-100 rounded-lg px-2 py-1.5">
                                {position.label}
                              </div>
                              <div className="space-y-1">
                                {positionPlayers.length > 0 ?
                              positionPlayers.map((player, index) =>
                              <Draggable key={player.id} draggableId={`player-${player.id}`} index={index}>
                                      {(playerProvided, playerSnapshot) => (
                                <div
                                  ref={playerProvided.innerRef}
                                  {...playerProvided.draggableProps}
                                  {...playerProvided.dragHandleProps}
                                  className={`transition-all ${playerSnapshot.isDragging ? 'rotate-2 scale-105 shadow-2xl' : ''}`}>
                                  
                                          <div className="bg-white rounded-lg px-1.5 md:px-2 py-2 border-2 border-slate-300 cursor-grab active:cursor-grabbing hover:border-emerald-400 hover:shadow-md group relative">
                                            <div className="flex items-center gap-1 md:gap-1.5 mb-1">
                                              <div className="w-5 h-5 md:w-6 md:h-6 bg-slate-800 rounded flex items-center justify-center text-white font-bold text-[10px] md:text-xs flex-shrink-0">
                                                #{player.tryout?.team_ranking || index + 1}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <div className="text-[10px] md:text-xs font-bold text-slate-900 truncate leading-tight">
                                                  {player.full_name}
                                                </div>
                                              </div>
                                              <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingPlayer(player);
                                          setShowEditDialog(true);
                                        }}
                                        className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-slate-800 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                                                <Edit2 className="w-2 h-2 md:w-2.5 md:h-2.5 text-white" />
                                              </button>
                                            </div>
                                            {player.tryout && (
                                    <div className="space-y-0.5 flex flex-wrap gap-1">
                                                {player.tryout.team_role && (
                                      <Button 
                                        size="sm" 
                                        className="h-4 md:h-5 px-1.5 text-[8px] md:text-[9px] rounded-full bg-blue-500 hover:bg-blue-600 pointer-events-none"
                                      >
                                        {player.tryout.team_role}
                                      </Button>
                                      )}
                                                {player.tryout.recommendation && (
                                      <Button
                                        size="sm"
                                        className={`h-4 md:h-5 px-1.5 text-[8px] md:text-[9px] rounded-full pointer-events-none ${
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
                              <div className="text-center py-3">
                                    <div className="text-[10px] text-slate-400">No players</div>
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
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Unassigned Players</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                  {players
                .filter((player) => !player.primary_position || !Object.keys(positionMapping).includes(player.primary_position))
                .map((player, index) => (
                <Draggable key={player.id} draggableId={`player-${player.id}`} index={index}>
                        {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`transition-all ${snapshot.isDragging ? 'scale-110' : ''}`}>
                            <div className="bg-slate-50 rounded-xl p-2 md:p-3 border-2 border-slate-200 cursor-grab active:cursor-grabbing hover:border-emerald-400 hover:shadow-lg">
                              <div className="flex flex-col items-center">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center text-white font-bold text-base md:text-lg shadow-md mb-2">
                                  {player.jersey_number || <User className="w-5 h-5 md:w-6 md:h-6" />}
                                </div>
                                <div className="text-[10px] md:text-xs font-bold text-slate-900 text-center mb-1">
                                  {player.full_name}
                                </div>
                                {player.tryout && (
                                  <div className="flex flex-col items-center gap-1 w-full">
                                    {player.tryout.team_role && (
                                      <Button size="sm" className="h-4 md:h-5 px-1.5 text-[8px] md:text-[9px] rounded-full bg-blue-500 hover:bg-blue-600 pointer-events-none w-full">
                                        {player.tryout.team_role}
                                      </Button>
                                    )}
                                    {player.tryout.recommendation && (
                                       <Button size="sm" className={`h-4 md:h-5 px-1.5 text-[8px] md:text-[9px] rounded-full pointer-events-none w-full ${
                                          player.tryout.recommendation === 'Move up' ? 'bg-emerald-500 hover:bg-emerald-600' :
                                          player.tryout.recommendation === 'Move down' ? 'bg-orange-500 hover:bg-orange-600' :
                                          'bg-blue-500 hover:bg-blue-600'
                                       }`}>
                                          {player.tryout.recommendation}
                                       </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                  )}
                      </Draggable>
                ))}
                  {provided.placeholder}
                </div>
                {players.filter((player) => !player.primary_position || !Object.keys(positionMapping).includes(player.primary_position)).length === 0 &&
              <p className="text-center text-slate-500 py-4 text-sm">All players assigned to positions</p>
              }
              </CardContent>
            </Card>
          )}
        </Droppable>

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="w-[95vw] max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Player</DialogTitle>
            </DialogHeader>
            {editingPlayer &&
            <div className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-2">
                    {editingPlayer.jersey_number || <User className="w-8 h-8" />}
                  </div>
                  <div className="font-semibold text-lg">{editingPlayer.full_name}</div>
                  <div className="text-sm text-slate-600">{editingPlayer.primary_position}</div>
                </div>
                <div>
                  <Label className="mb-2 block">Full Name</Label>
                  <Input
                  value={editingPlayer.full_name || ''}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, full_name: e.target.value })} />
                </div>
                <div>
                  <Label className="mb-2 block">Jersey Number</Label>
                  <Input
                  type="number"
                  value={editingPlayer.jersey_number || ''}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, jersey_number: e.target.value })} />
                </div>
                <div>
                  <Label className="mb-2 block">Primary Position</Label>
                  <Select
                  value={editingPlayer.primary_position || ''}
                  onValueChange={(value) => setEditingPlayer({ ...editingPlayer, primary_position: value })}>
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
                <Button
                onClick={() => {
                  base44.entities.Player.update(editingPlayer.id, {
                    full_name: editingPlayer.full_name,
                    jersey_number: editingPlayer.jersey_number,
                    primary_position: editingPlayer.primary_position
                  }).then(() => {
                    queryClient.invalidateQueries(['players']);
                    setShowEditDialog(false);
                    setEditingPlayer(null);
                  });
                }}
                className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            }
          </DialogContent>
        </Dialog>
      </div>
    </DragDropContext>);
}