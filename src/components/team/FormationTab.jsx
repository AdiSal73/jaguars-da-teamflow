import React, { useState, useRef, useMemo, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
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
      { id: 'Right Centerback', x: 58, y: 70, label: 'RCB', width: 160, height: 180 },
      { id: 'Left Centerback', x: 42, y: 70, label: 'LCB', width: 160, height: 180 },
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
      { id: 'Right Centerback', x: 58, y: 70, label: 'RCB', width: 160, height: 180 },
      { id: 'Left Centerback', x: 42, y: 70, label: 'LCB', width: 160, height: 180 },
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
      { id: 'Right Centerback', x: 58, y: 70, label: 'RCB', width: 160, height: 180 },
      { id: 'Left Centerback', x: 42, y: 70, label: 'LCB', width: 160, height: 180 },
      { id: 'Left Outside Back', x: 25, y: 70, label: 'LB', width: 160, height: 180 },
      { id: 'Right Winger', x: 75, y: 45, label: 'RM', width: 160, height: 180 },
      { id: 'Center Midfielder', x: 58, y: 50, label: 'CM', width: 160, height: 180 },
      { id: 'Defensive Midfielder', x: 42, y: 50, label: 'DM', width: 160, height: 180 },
      { id: 'Left Winger', x: 25, y: 45, label: 'LM', width: 160, height: 180 },
      { id: 'Forward', x: 56, y: 20, label: 'ST', width: 160, height: 180 },
      { id: 'Attacking Midfielder', x: 44, y: 20, label: 'ST', width: 160, height: 180 }
    ]
  }
};

export default function FormationTab({ team, players, tryouts }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fieldRef = useRef(null);
  const [selectedFormation, setSelectedFormation] = useState('4-3-3');
  const [formationPositions, setFormationPositions] = useState(formations['4-3-3'].positions);
  const [draggingPosition, setDraggingPosition] = useState(null);

  const updatePlayerMutation = useMutation({
    mutationFn: ({ playerId, data }) => base44.entities.Player.update(playerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['players']);
    }
  });

  const updateTryoutMutation = useMutation({
    mutationFn: async ({ playerId, newRanking, position }) => {
      const player = players.find(p => p.id === playerId);
      const existingTryout = tryouts.find(t => t.player_id === playerId);

      if (existingTryout) {
        return base44.entities.PlayerTryout.update(existingTryout.id, { 
          team_ranking: newRanking, 
          primary_position: position
        });
      } else {
        return base44.entities.PlayerTryout.create({
          player_id: playerId,
          player_name: player?.full_name,
          current_team: team?.name,
          primary_position: position,
          team_ranking: newRanking
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tryouts']);
    }
  });

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
    
    updateTryoutMutation.mutate({
      playerId: draggedPlayerId,
      newRanking,
      position: destPositionId
    });
  }, [updatePlayerMutation, updateTryoutMutation]);

  const handlePositionDrag = (e, position) => {
    if (!fieldRef.current) return;
    const rect = fieldRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setFormationPositions(prev => prev.map(pos => 
      pos.id === position.id ? { ...pos, x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) } : pos
    ));
  };

  React.useEffect(() => {
    setFormationPositions(formations[selectedFormation].positions);
  }, [selectedFormation]);

  const formation = { name: formations[selectedFormation].name, positions: formationPositions };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Label className="text-sm font-semibold">Formation:</Label>
          <Select value={selectedFormation} onValueChange={setSelectedFormation}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(formations).map((key) => (
                <SelectItem key={key} value={key}>{formations[key].name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                            className={`bg-white/95 backdrop-blur-sm p-1.5 rounded-lg shadow-lg border-2 transition-all ${
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
                                          {player.tryout?.team_ranking && (
                                            <div className="text-[7px] text-emerald-700 font-bold">Rank: {player.tryout.team_ranking}</div>
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
    </DragDropContext>
  );
}