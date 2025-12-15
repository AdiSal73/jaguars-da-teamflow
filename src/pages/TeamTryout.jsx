import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users, User } from 'lucide-react';
import { toast } from 'sonner';

export default function TeamTryout() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: tryouts = [] } = useQuery({
    queryKey: ['tryouts'],
    queryFn: () => base44.entities.PlayerTryout.list()
  });

  const updatePlayerMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Player.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['players']);
      queryClient.invalidateQueries(['tryouts']);
    }
  });

  // Filter teams for 26/27 season
  const nextYearTeams = useMemo(() => {
    return teams.filter(t => 
      t.name?.includes('26/27') || t.season?.includes('26/27')
    ).sort((a, b) => {
      // Sort by gender then name
      if (a.gender !== b.gender) return a.gender === 'Female' ? -1 : 1;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [teams]);

  // Get unassigned players
  const unassignedPlayers = useMemo(() => {
    return players.filter(p => {
      if (!p.next_year_team) return true;
      // Also include players whose next_year_team doesn't match any 26/27 team
      const hasValidNextTeam = nextYearTeams.some(t => t.name === p.next_year_team);
      return !hasValidNextTeam;
    }).filter(p => {
      const matchesSearch = p.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGender = filterGender === 'all' || p.gender === filterGender;
      const matchesBranch = filterBranch === 'all' || p.branch === filterBranch;
      return matchesSearch && matchesGender && matchesBranch;
    });
  }, [players, nextYearTeams, searchTerm, filterGender, filterBranch]);

  // Get players by team
  const getTeamPlayers = (teamName) => {
    return players.filter(p => p.next_year_team === teamName);
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    const playerId = draggableId;
    const sourceTeam = source.droppableId === 'unassigned' ? null : source.droppableId;
    const destTeam = destination.droppableId === 'unassigned' ? null : destination.droppableId;

    if (sourceTeam === destTeam) return;

    try {
      await updatePlayerMutation.mutateAsync({
        id: playerId,
        data: { next_year_team: destTeam }
      });
      toast.success('Player assignment updated');
    } catch (error) {
      toast.error('Failed to update player');
    }
  };

  const PlayerCard = ({ player, isDragging }) => {
    const tryout = tryouts.find(t => t.player_id === player.id);
    return (
      <div className={`p-3 bg-white border-2 rounded-lg transition-all ${isDragging ? 'shadow-2xl border-emerald-500 rotate-2' : 'border-slate-200 hover:border-emerald-300 hover:shadow-md'}`}>
        <div className="flex items-start gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            {player.jersey_number || <User className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-slate-900 truncate">{player.full_name}</div>
            <div className="text-xs text-slate-500">{player.primary_position}</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {player.branch && <Badge className="text-[9px] bg-blue-100 text-blue-700">{player.branch}</Badge>}
              {tryout?.team_role && <Badge className="text-[9px] bg-purple-100 text-purple-700">{tryout.team_role}</Badge>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-[1800px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Team Assignments - 2026/2027 Season</h1>
        <p className="text-slate-600 mt-1">Drag and drop players to assign them to next year's teams</p>
      </div>

      <Card className="mb-6 border-none shadow-lg">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterGender} onValueChange={setFilterGender}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="Female">Girls</SelectItem>
                <SelectItem value="Male">Boys</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterBranch} onValueChange={setFilterBranch}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {[...new Set(players.map(p => p.branch).filter(Boolean))].map(branch => (
                  <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Unassigned Players */}
          <Card className="border-2 border-orange-200 bg-orange-50/50">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Unassigned Players
                </div>
                <Badge className="bg-white text-orange-700">{unassignedPlayers.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <Droppable droppableId="unassigned">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[400px] space-y-2 ${snapshot.isDraggingOver ? 'bg-orange-100 rounded-lg p-2' : ''}`}
                  >
                    {unassignedPlayers.map((player, index) => (
                      <Draggable key={player.id} draggableId={player.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <PlayerCard player={player} isDragging={snapshot.isDragging} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {unassignedPlayers.length === 0 && (
                      <div className="text-center py-12 text-slate-400">
                        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No unassigned players</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </CardContent>
          </Card>

          {/* Next Year Teams */}
          {nextYearTeams.map(team => {
            const teamPlayers = getTeamPlayers(team.name);
            return (
              <Card key={team.id} className={`border-2 ${team.gender === 'Male' ? 'border-blue-200 bg-blue-50/50' : 'border-pink-200 bg-pink-50/50'}`}>
                <CardHeader className={`${team.gender === 'Male' ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gradient-to-r from-pink-600 to-pink-700'} text-white`}>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      <div>
                        <div className="text-sm font-bold">{team.name}</div>
                        {team.age_group && <div className="text-xs opacity-90">{team.age_group}</div>}
                      </div>
                    </div>
                    <Badge className="bg-white text-slate-900">{teamPlayers.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <Droppable droppableId={team.name}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[400px] space-y-2 ${snapshot.isDraggingOver ? `${team.gender === 'Male' ? 'bg-blue-100' : 'bg-pink-100'} rounded-lg p-2` : ''}`}
                      >
                        {teamPlayers.map((player, index) => (
                          <Draggable key={player.id} draggableId={player.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <PlayerCard player={player} isDragging={snapshot.isDragging} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {teamPlayers.length === 0 && (
                          <div className="text-center py-12 text-slate-400">
                            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No players assigned</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}