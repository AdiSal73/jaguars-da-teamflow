import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, Users, Filter } from 'lucide-react';
import { getPositionBorderColor } from '../components/player/positionColors';

const DEFAULT_FEMALE_ROLES = [
  'Indispensable Player',
  'GA Starter',
  'GA Rotation',
  'Aspire Starter',
  'Aspire Rotation',
  'United Starter',
  'United Rotation'
];

const DEFAULT_MALE_ROLES = [
  'Elite Starter',
  'Elite Rotation',
  'Premier Starter',
  'Premier Rotation',
  'Academy Starter',
  'Academy Rotation',
  'Development'
];

export default function PlayerRoleAssignment() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterGender, setFilterGender] = useState('Female');

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const { data: tryouts = [] } = useQuery({
    queryKey: ['tryouts'],
    queryFn: () => base44.entities.PlayerTryout.list()
  });

  const { data: clubSettings = [] } = useQuery({
    queryKey: ['clubSettings'],
    queryFn: () => base44.entities.ClubSettings.list()
  });

  const updateTryoutMutation = useMutation({
    mutationFn: async ({ playerId, teamRole }) => {
      const existingTryout = tryouts.find(t => t.player_id === playerId);
      if (existingTryout) {
        return base44.entities.PlayerTryout.update(existingTryout.id, { team_role: teamRole });
      } else {
        const player = players.find(p => p.id === playerId);
        return base44.entities.PlayerTryout.create({
          player_id: playerId,
          player_name: player?.full_name,
          team_role: teamRole
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries(['tryouts'])
  });

  const getRolesForGender = (gender) => {
    const customSettings = clubSettings.find(s => s.setting_type === 'team_roles' && s.gender === gender);
    if (customSettings?.values?.length > 0) return customSettings.values;
    return gender === 'Male' ? DEFAULT_MALE_ROLES : DEFAULT_FEMALE_ROLES;
  };

  const roles = getRolesForGender(filterGender);

  const filteredPlayers = useMemo(() => {
    return players.filter(player => {
      const matchesSearch = player.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTeam = filterTeam === 'all' || player.team_id === filterTeam;
      const matchesGender = player.gender === filterGender;
      return matchesSearch && matchesTeam && matchesGender;
    });
  }, [players, searchTerm, filterTeam, filterGender]);

  const playersByRole = useMemo(() => {
    const result = { unassigned: [] };
    roles.forEach(role => { result[role] = []; });

    filteredPlayers.forEach(player => {
      const tryout = tryouts.find(t => t.player_id === player.id);
      const role = tryout?.team_role;
      if (role && result[role]) {
        result[role].push({ ...player, tryout });
      } else {
        result.unassigned.push({ ...player, tryout });
      }
    });

    return result;
  }, [filteredPlayers, tryouts, roles]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const playerId = result.draggableId;
    const destinationRole = result.destination.droppableId === 'unassigned' ? null : result.destination.droppableId;

    updateTryoutMutation.mutate({ playerId, teamRole: destinationRole });
  };

  const roleColors = {
    'Indispensable Player': 'bg-purple-100 border-purple-400',
    'GA Starter': 'bg-emerald-100 border-emerald-400',
    'GA Rotation': 'bg-emerald-50 border-emerald-300',
    'Aspire Starter': 'bg-blue-100 border-blue-400',
    'Aspire Rotation': 'bg-blue-50 border-blue-300',
    'United Starter': 'bg-orange-100 border-orange-400',
    'United Rotation': 'bg-orange-50 border-orange-300',
    'Elite Starter': 'bg-purple-100 border-purple-400',
    'Elite Rotation': 'bg-purple-50 border-purple-300',
    'Premier Starter': 'bg-emerald-100 border-emerald-400',
    'Premier Rotation': 'bg-emerald-50 border-emerald-300',
    'Academy Starter': 'bg-blue-100 border-blue-400',
    'Academy Rotation': 'bg-blue-50 border-blue-300',
    'Development': 'bg-slate-100 border-slate-400'
  };

  return (
    <div className="p-4 md:p-6 max-w-[1800px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Player Role Assignment</h1>
          <p className="text-slate-600 mt-1">Drag and drop players to assign team roles</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={filterGender} onValueChange={setFilterGender}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Female">Girls</SelectItem>
              <SelectItem value="Male">Boys</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterTeam} onValueChange={setFilterTeam}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams.filter(t => t.gender === filterGender || !t.gender).map(team => (
                <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-48"
            />
          </div>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Unassigned Column */}
          <Droppable droppableId="unassigned">
            {(provided, snapshot) => (
              <Card className={`border-2 ${snapshot.isDraggingOver ? 'border-slate-400 bg-slate-50' : 'border-slate-200'}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>Unassigned</span>
                    <Badge variant="outline">{playersByRole.unassigned.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="min-h-[300px] space-y-2"
                >
                  {playersByRole.unassigned.map((player, index) => (
                    <Draggable key={player.id} draggableId={player.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`p-2 rounded-lg border-2 bg-white cursor-grab active:cursor-grabbing ${
                            snapshot.isDragging ? 'shadow-lg ring-2 ring-emerald-400' : ''
                          } ${getPositionBorderColor(player.primary_position)}`}
                        >
                          <div className="font-medium text-sm">{player.full_name}</div>
                          <div className="text-xs text-slate-500">{player.primary_position}</div>
                          <div className="text-xs text-slate-400">{teams.find(t => t.id === player.team_id)?.name}</div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </CardContent>
              </Card>
            )}
          </Droppable>

          {/* Role Columns */}
          {roles.map(role => (
            <Droppable key={role} droppableId={role}>
              {(provided, snapshot) => (
                <Card className={`border-2 ${roleColors[role] || 'border-slate-200'} ${snapshot.isDraggingOver ? 'ring-2 ring-emerald-400' : ''}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>{role}</span>
                      <Badge variant="outline">{playersByRole[role]?.length || 0}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="min-h-[300px] space-y-2"
                  >
                    {(playersByRole[role] || []).map((player, index) => (
                      <Draggable key={player.id} draggableId={player.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-2 rounded-lg border-2 bg-white cursor-grab active:cursor-grabbing ${
                              snapshot.isDragging ? 'shadow-lg ring-2 ring-emerald-400' : ''
                            } ${getPositionBorderColor(player.primary_position)}`}
                          >
                            <div className="font-medium text-sm">{player.full_name}</div>
                            <div className="text-xs text-slate-500">{player.primary_position}</div>
                            <div className="flex items-center gap-1 mt-1">
                              {player.tryout?.recommendation && (
                                <Badge className={`text-[9px] ${
                                  player.tryout.recommendation === 'Move up' ? 'bg-emerald-100 text-emerald-800' :
                                  player.tryout.recommendation === 'Move down' ? 'bg-orange-100 text-orange-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {player.tryout.recommendation}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </CardContent>
                </Card>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}