import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { isTrappedPlayer } from '../components/utils/trappedPlayer';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Users, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import EditablePlayerCard from '../components/player/EditablePlayerCard';

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
  const [filterAgeGroup, setFilterAgeGroup] = useState('all');
  const [filterLeague, setFilterLeague] = useState('all');
  const [filterGender, setFilterGender] = useState('Female');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [roleFilterTeam, setRoleFilterTeam] = useState('all');
  const [roleFilterAgeGroup, setRoleFilterAgeGroup] = useState('all');
  const [roleFilterLeague, setRoleFilterLeague] = useState('all');

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
  const uniqueAgeGroups = useMemo(() => {
    return [...new Set(teams?.map(t => t.age_group).filter(Boolean) || [])].sort();
  }, [teams]);
  
  const uniqueLeagues = useMemo(() => {
    return [...new Set(teams?.map(t => t.league).filter(Boolean) || [])];
  }, [teams]);

  const filteredPlayers = useMemo(() => {
    return players.filter(player => {
      const matchesSearch = player.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGender = player.gender === filterGender;
      return matchesSearch && matchesGender;
    });
  }, [players, searchTerm, filterGender]);

  const unassignedFilteredPlayers = useMemo(() => {
    return filteredPlayers.filter(player => {
      const tryout = tryouts.find(t => t.player_id === player.id);
      const role = tryout?.team_role;
      const hasRole = role && roles.includes(role);
      if (hasRole) return false;
      
      const team = teams.find(t => t.id === player.team_id);
      const matchesTeam = filterTeam === 'all' || player.team_id === filterTeam;
      const matchesAgeGroup = filterAgeGroup === 'all' || team?.age_group === filterAgeGroup;
      const matchesLeague = filterLeague === 'all' || team?.league === filterLeague;
      
      return matchesTeam && matchesAgeGroup && matchesLeague;
    });
  }, [filteredPlayers, tryouts, roles, filterTeam, filterAgeGroup, filterLeague, teams]);

  const playersByRole = useMemo(() => {
    const result = {};
    roles.forEach(role => { result[role] = []; });

    filteredPlayers.forEach(player => {
      const tryout = tryouts.find(t => t.player_id === player.id);
      const role = tryout?.team_role;
      if (role && result[role]) {
        const team = teams.find(t => t.id === player.team_id);
        const matchesTeam = roleFilterTeam === 'all' || player.team_id === roleFilterTeam;
        const matchesAgeGroup = roleFilterAgeGroup === 'all' || team?.age_group === roleFilterAgeGroup;
        const matchesLeague = roleFilterLeague === 'all' || team?.league === roleFilterLeague;
        
        if (matchesTeam && matchesAgeGroup && matchesLeague) {
          result[role].push({ ...player, tryout });
        }
      }
    });

    return result;
  }, [filteredPlayers, tryouts, roles, roleFilterTeam, roleFilterAgeGroup, roleFilterLeague, teams]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const playerId = result.draggableId;
    const destinationRole = result.destination.droppableId === 'unassigned' ? null : result.destination.droppableId;

    updateTryoutMutation.mutate({ playerId, teamRole: destinationRole });
  };

  const roleColors = {
    'Indispensable Player': 'bg-purple-50 border-purple-300',
    'GA Starter': 'bg-emerald-50 border-emerald-300',
    'GA Rotation': 'bg-emerald-50/50 border-emerald-200',
    'Aspire Starter': 'bg-blue-50 border-blue-300',
    'Aspire Rotation': 'bg-blue-50/50 border-blue-200',
    'United Starter': 'bg-orange-50 border-orange-300',
    'United Rotation': 'bg-orange-50/50 border-orange-200',
    'Elite Starter': 'bg-purple-50 border-purple-300',
    'Elite Rotation': 'bg-purple-50/50 border-purple-200',
    'Premier Starter': 'bg-emerald-50 border-emerald-300',
    'Premier Rotation': 'bg-emerald-50/50 border-emerald-200',
    'Academy Starter': 'bg-blue-50 border-blue-300',
    'Academy Rotation': 'bg-blue-50/50 border-blue-200',
    'Development': 'bg-slate-50 border-slate-300'
  };

  return (
    <div className="h-[calc(100vh-64px)] flex">
      <DragDropContext onDragEnd={handleDragEnd}>
        {/* Main Content - Role Containers */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900">Player Role Assignment</h1>
                <p className="text-sm text-slate-600">Drag players from the sidebar to assign roles</p>
              </div>
              <Select value={filterGender} onValueChange={setFilterGender}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Female">Girls</SelectItem>
                  <SelectItem value="Male">Boys</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={roleFilterTeam} onValueChange={setRoleFilterTeam}>
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {teams?.filter(t => (t.gender === filterGender || !t.gender) && t.name && typeof t.name === 'string')?.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={roleFilterAgeGroup} onValueChange={setRoleFilterAgeGroup}>
                <SelectTrigger className="h-8 w-28 text-xs">
                  <SelectValue placeholder="All Ages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ages</SelectItem>
                  {uniqueAgeGroups?.map(ag => (
                    <SelectItem key={ag} value={ag}>{ag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={roleFilterLeague} onValueChange={setRoleFilterLeague}>
                <SelectTrigger className="h-8 w-28 text-xs">
                  <SelectValue placeholder="All Leagues" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Leagues</SelectItem>
                  {uniqueLeagues.map(l => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {roles?.map(role => (
              <Droppable key={role} droppableId={role}>
                {(provided, snapshot) => (
                  <Card className={`border-2 ${roleColors[role] || 'border-slate-200'} ${snapshot.isDraggingOver ? 'ring-2 ring-emerald-400' : ''}`}>
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-xs md:text-sm flex items-center justify-between">
                        <span className="truncate">{role}</span>
                        <Badge variant="outline" className="text-[10px]">{playersByRole[role]?.length || 0}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="p-2 min-h-[120px] space-y-1"
                    >
                      {(playersByRole[role] || [])?.map((player, index) => (
                        <Draggable key={player.id} draggableId={player.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={snapshot.isDragging ? 'opacity-90' : ''}
                            >
                              <EditablePlayerCard
                                player={player}
                                tryout={player.tryout}
                                team={teams.find(t => t.id === player.team_id)}
                                teams={teams}
                                clubSettings={clubSettings}
                                compact
                                className="cursor-grab active:cursor-grabbing"
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {(playersByRole[role]?.length || 0) === 0 && (
                        <div className="text-center text-slate-400 text-xs py-6">
                          Drop players here
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </Droppable>
            ))}
          </div>
        </div>

        {/* Sidebar - Unassigned Players */}
        <div className={`border-l bg-slate-50 flex flex-col transition-all ${sidebarCollapsed ? 'w-12' : 'w-72 md:w-80'}`}>
          <div className="p-3 border-b bg-white flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-600" />
                <span className="font-semibold text-sm">Unassigned</span>
                <Badge variant="outline" className="text-xs">{unassignedFilteredPlayers.length}</Badge>
              </div>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>

          {!sidebarCollapsed && (
            <>
              <div className="p-2 border-b bg-white space-y-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-7 h-8 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <Select value={filterTeam} onValueChange={setFilterTeam}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teams</SelectItem>
                      {teams?.filter(t => (t.gender === filterGender || !t.gender) && t.name && typeof t.name === 'string')?.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterAgeGroup} onValueChange={setFilterAgeGroup}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Age" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ages</SelectItem>
                      {uniqueAgeGroups?.map(ag => (
                        <SelectItem key={ag} value={ag}>{ag}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Select value={filterLeague} onValueChange={setFilterLeague}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="League" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Leagues</SelectItem>
                    {uniqueLeagues.map(l => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Droppable droppableId="unassigned">
                {(provided, snapshot) => (
                  <ScrollArea 
                    className={`flex-1 ${snapshot.isDraggingOver ? 'bg-slate-100' : ''}`}
                  >
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="p-2 space-y-1 min-h-full"
                    >
                      {unassignedFilteredPlayers?.map((player, index) => {
                        const tryout = tryouts.find(t => t.player_id === player.id);
                        return (
                          <Draggable key={player.id} draggableId={player.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={snapshot.isDragging ? 'opacity-90' : ''}
                              >
                                <EditablePlayerCard
                                  player={player}
                                  tryout={tryout}
                                  team={teams.find(t => t.id === player.team_id)}
                                  teams={teams}
                                  clubSettings={clubSettings}
                                  compact
                                  className="cursor-grab active:cursor-grabbing"
                                />
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                      {unassignedFilteredPlayers.length === 0 && (
                        <div className="text-center text-slate-400 text-xs py-8">
                          No unassigned players
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </Droppable>
            </>
          )}
        </div>
      </DragDropContext>
    </div>
  );
}