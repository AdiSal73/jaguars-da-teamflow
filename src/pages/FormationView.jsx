import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { User, Edit2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const positionMapping = {
  'GK': 'GK',
  'Right Outside Back': 'Right Outside Back',
  'Left Outside Back': 'Left Outside Back',
  'Right Centerback': 'Right Centerback',
  'Left Centerback': 'Left Centerback',
  'Defensive Midfielder': 'Defensive Midfielder',
  'Right Winger': 'Right Winger',
  'Center Midfielder': 'Center Midfielder',
  'Forward': 'Forward',
  'Attacking Midfielder': 'Attacking Midfielder',
  'Left Winger': 'Left Winger'
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
      { id: 'Defensive Midfielder', x: 50, y: 50, label: 'CDM' },
      { id: 'Attacking Midfielder', x: 38, y: 50, label: 'CAM' },
      { id: 'Right Winger', x: 75, y: 20, label: 'RW' },
      { id: 'Forward', x: 50, y: 15, label: 'ST' },
      { id: 'Left Winger', x: 25, y: 20, label: 'LW' }
    ]
  },
  '4-2-3-1': {
    name: '4-2-3-1',
    positions: [
      { id: 'GK', x: 50, y: 95, label: 'GK' },
      { id: 'Right Outside Back', x: 80, y: 75, label: 'RB' },
      { id: 'Left Centerback', x: 62, y: 75, label: 'LCB' },
      { id: 'Right Centerback', x: 38, y: 75, label: 'RCB' },
      { id: 'Left Outside Back', x: 20, y: 75, label: 'LB' },
      { id: 'Defensive Midfielder', x: 60, y: 55, label: 'CDM' },
      { id: 'Center Midfielder', x: 40, y: 55, label: 'CM' },
      { id: 'Right Winger', x: 75, y: 35, label: 'RW' },
      { id: 'Attacking Midfielder', x: 50, y: 35, label: 'CAM' },
      { id: 'Left Winger', x: 25, y: 35, label: 'LW' },
      { id: 'Forward', x: 50, y: 15, label: 'ST' }
    ]
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
      { id: 'Defensive Midfielder', x: 40, y: 45, label: 'CDM' },
      { id: 'Left Winger', x: 20, y: 45, label: 'LW' },
      { id: 'Forward', x: 60, y: 15, label: 'ST' },
      { id: 'Attacking Midfielder', x: 40, y: 15, label: 'CAM' }
    ]
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
      { id: 'Defensive Midfielder', x: 40, y: 50, label: 'CDM' },
      { id: 'Left Winger', x: 20, y: 50, label: 'LW' },
      { id: 'Attacking Midfielder', x: 60, y: 28, label: 'CAM' },
      { id: 'Right Winger', x: 40, y: 28, label: 'RW' },
      { id: 'Forward', x: 50, y: 15, label: 'ST' }
    ]
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
      { id: 'Defensive Midfielder', x: 50, y: 50, label: 'CDM' },
      { id: 'Attacking Midfielder', x: 38, y: 50, label: 'CAM' },
      { id: 'Left Winger', x: 20, y: 50, label: 'LWB' },
      { id: 'Forward', x: 60, y: 15, label: 'ST' },
      { id: 'Right Winger', x: 40, y: 15, label: 'RW' }
    ]
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
      { id: 'Defensive Midfielder', x: 40, y: 50, label: 'CDM' },
      { id: 'Left Winger', x: 20, y: 50, label: 'LW' },
      { id: 'Attacking Midfielder', x: 50, y: 32, label: 'CAM' },
      { id: 'Forward', x: 60, y: 15, label: 'ST' },
      { id: 'Right Winger', x: 40, y: 15, label: 'RW' }
    ]
  }
};

export default function FormationView() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const teamIdParam = urlParams.get('teamId');
  
  const [selectedFormation, setSelectedFormation] = useState('4-3-3');
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(teamIdParam || 'all');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all');

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const { data: allPlayers = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  // Filter players based on selected team or age group
  const players = allPlayers.filter(player => {
    if (selectedTeam !== 'all') {
      return player.team_id === selectedTeam;
    }
    
    if (selectedAgeGroup !== 'all') {
      const team = teams.find(t => t.id === player.team_id);
      return team?.age_group === selectedAgeGroup;
    }
    
    return true;
  });

  const team = teams.find(t => t.id === selectedTeam) || (selectedAgeGroup !== 'all' ? { name: `${selectedAgeGroup} Players` } : { name: 'All Players' });

  const updatePlayerPositionMutation = useMutation({
    mutationFn: async ({ playerId, newPosition }) => {
      return base44.entities.Player.update(playerId, { 
        primary_position: newPosition 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['players']);
      setShowEditDialog(false);
    }
  });

  const getPlayersForPosition = (positionId) => {
    return players.filter(player => player.primary_position === positionId);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const sourcePositionId = result.source.droppableId.replace('position-', '');
    const destPositionId = result.destination.droppableId.replace('position-', '');

    if (sourcePositionId === destPositionId) return;

    const draggedPlayerId = result.draggableId.replace('player-', '');
    
    updatePlayerPositionMutation.mutate({
      playerId: draggedPlayerId,
      newPosition: destPositionId
    });
  };

  const formation = formations[selectedFormation];

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{team?.name || 'Formation View'}</h1>
          <p className="text-slate-600">View all players organized by their positions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <Label className="mb-2 block text-lg font-semibold">Select Formation</Label>
            <Select value={selectedFormation} onValueChange={setSelectedFormation}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(formations).map(key => (
                  <SelectItem key={key} value={key}>{formations[key].name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 block text-lg font-semibold">Filter by Team</Label>
            <Select value={selectedTeam} onValueChange={(value) => { setSelectedTeam(value); setSelectedAgeGroup('all'); }}>
              <SelectTrigger className="h-12">
                <SelectValue />
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
            <Label className="mb-2 block text-lg font-semibold">Filter by Age Group</Label>
            <Select value={selectedAgeGroup} onValueChange={(value) => { setSelectedAgeGroup(value); setSelectedTeam('all'); }}>
              <SelectTrigger className="h-12">
                <SelectValue />
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
        </div>

        <Card className="border-none shadow-2xl overflow-hidden">
          <CardContent className="p-0">
            <div 
              className="relative w-full"
              style={{ 
                paddingBottom: '140%',
                background: 'linear-gradient(180deg, #166534 0%, #15803d 50%, #166534 100%)'
              }}
            >
              <div className="absolute inset-0">
                {/* Field markings overlay */}
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

                {/* Player positions */}
                {formation.positions.map(position => {
                  const positionPlayers = getPlayersForPosition(position.id);
                  
                  return (
                    <Droppable droppableId={`position-${position.id}`} key={position.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2"
                          style={{
                            left: `${position.x}%`,
                            top: `${position.y}%`,
                            width: '300px',
                            maxHeight: '500px'
                          }}
                        >
                          <div className={`bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border-2 p-3 overflow-y-auto max-h-[500px] transition-all ${
                            snapshot.isDraggingOver ? 'border-emerald-500 scale-105' : 'border-white'
                          }`}>
                            <div className="text-center text-xs font-bold text-emerald-700 mb-2 sticky top-0 bg-white/95 pb-1 border-b border-slate-200">
                              {position.label}
                            </div>
                            <div className="space-y-2">
                              {positionPlayers.length > 0 ? (
                                positionPlayers.map((player, index) => (
                                  <Draggable key={player.id} draggableId={`player-${player.id}`} index={index}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={`transition-all ${snapshot.isDragging ? 'rotate-3 scale-110' : ''}`}
                                      >
                                        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-2 border-2 border-emerald-200 cursor-grab active:cursor-grabbing hover:shadow-lg group">
                                          <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
                                              {player.jersey_number || '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="text-xs font-semibold text-slate-900 truncate">
                                                {player.full_name}
                                              </div>
                                            </div>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingPlayer(player);
                                                setShowEditDialog(true);
                                              }}
                                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white rounded"
                                            >
                                              <Edit2 className="w-3 h-3 text-slate-600" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                ))
                              ) : (
                                <div className="text-center py-3">
                                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-1">
                                    <span className="text-slate-400 font-bold text-sm">+</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400">Drag players here</div>
                                </div>
                              )}
                              {provided.placeholder}
                            </div>
                          </div>
                        </div>
                      )}
                    </Droppable>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Players without assigned positions */}
        <Droppable droppableId="position-unassigned">
          {(provided, snapshot) => (
            <Card 
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`mt-6 border-none shadow-lg transition-all ${
                snapshot.isDraggingOver ? 'ring-4 ring-emerald-400' : ''
              }`}
            >
              <CardHeader>
                <CardTitle>Unassigned Players</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {players
                    .filter(player => !player.primary_position || !Object.keys(positionMapping).includes(player.primary_position))
                    .map((player, index) => (
                      <Draggable key={player.id} draggableId={`player-${player.id}`} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`transition-all ${snapshot.isDragging ? 'scale-110' : ''}`}
                          >
                            <div className="bg-slate-50 rounded-xl p-3 border-2 border-slate-200 cursor-grab active:cursor-grabbing hover:border-emerald-400 hover:shadow-lg">
                              <div className="flex flex-col items-center">
                                <div className="w-12 h-12 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md mb-2">
                                  {player.jersey_number || <User className="w-6 h-6" />}
                                </div>
                                <div className="text-xs font-semibold text-slate-900 text-center">
                                  {player.full_name}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
                {players.filter(player => !player.primary_position || !Object.keys(positionMapping).includes(player.primary_position)).length === 0 && (
                  <p className="text-center text-slate-500 py-4">All players assigned to positions</p>
                )}
              </CardContent>
            </Card>
          )}
        </Droppable>

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Player Position</DialogTitle>
            </DialogHeader>
            {editingPlayer && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-2">
                    {editingPlayer.jersey_number || <User className="w-8 h-8" />}
                  </div>
                  <div className="font-semibold text-lg">{editingPlayer.full_name}</div>
                </div>
                <div>
                  <Label className="mb-2 block">Primary Position</Label>
                  <Select 
                    value={editingPlayer.primary_position || ''} 
                    onValueChange={(value) => {
                      updatePlayerPositionMutation.mutate({
                        playerId: editingPlayer.id,
                        newPosition: value
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(positionMapping).map(key => (
                        <SelectItem key={key} value={key}>{key}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DragDropContext>
  );
}