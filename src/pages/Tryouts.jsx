import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User, AlertCircle, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Tryouts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedLeague, setSelectedLeague] = useState('all');
  const [selectedCoach, setSelectedCoach] = useState('all');
  const [birthdayFrom, setBirthdayFrom] = useState('');
  const [birthdayTo, setBirthdayTo] = useState('');

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

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const updatePlayerTeamMutation = useMutation({
    mutationFn: ({ playerId, teamId }) => base44.entities.Player.update(playerId, { team_id: teamId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['players']);
    }
  });

  const calculateTrapped = (dateOfBirth) => {
    if (!dateOfBirth) return 'Unknown';
    const date = new Date(dateOfBirth);
    const month = date.getMonth() + 1;
    return (month >= 9 && month <= 12) ? 'Yes' : 'No';
  };

  const getPlayerTryoutData = (player) => {
    const tryout = tryouts.find(t => t.player_id === player.id);
    const trapped = calculateTrapped(player.date_of_birth);
    return { ...player, tryout, trapped };
  };

  const sortTeamsByAge = (teamList) => {
    return [...teamList].sort((a, b) => {
      const extractAge = (name) => {
        const match = name.match(/U-?(\d+)/i);
        return match ? parseInt(match[1]) : 0;
      };
      return extractAge(b.name) - extractAge(a.name);
    });
  };

  const filterByLeague = (teamList) => {
    if (selectedLeague === 'all') return teamList;
    return teamList.filter(t => t.league === selectedLeague);
  };

  const filterByCoach = (teamList) => {
    if (selectedCoach === 'all') return teamList;
    return teamList.filter(t => t.coach_ids?.includes(selectedCoach));
  };

  const gaTeams = sortTeamsByAge(filterByCoach(filterByLeague(teams.filter(t => t.league === 'Girls Academy'))));
  const aspireTeams = sortTeamsByAge(filterByCoach(filterByLeague(teams.filter(t => t.league === 'Aspire'))));
  const otherTeams = sortTeamsByAge(filterByCoach(filterByLeague(teams.filter(t => t.league !== 'Girls Academy' && t.league !== 'Aspire'))));

  const filteredGATeams = selectedTeam === 'all' ? gaTeams : gaTeams.filter(t => t.id === selectedTeam);
  const filteredAspireTeams = selectedTeam === 'all' ? aspireTeams : aspireTeams.filter(t => t.id === selectedTeam);
  const filteredOtherTeams = selectedTeam === 'all' ? otherTeams : otherTeams.filter(t => t.id === selectedTeam);

  const getTeamPlayers = (team) => {
    let teamPlayers = players.filter(p => p.team_id === team.id);

    if (birthdayFrom) {
      teamPlayers = teamPlayers.filter(p => !p.date_of_birth || new Date(p.date_of_birth) >= new Date(birthdayFrom));
    }
    if (birthdayTo) {
      teamPlayers = teamPlayers.filter(p => !p.date_of_birth || new Date(p.date_of_birth) <= new Date(birthdayTo));
    }

    return teamPlayers
      .map(p => getPlayerTryoutData(p))
      .sort((a, b) => {
        const lastNameA = a.full_name?.split(' ').pop() || '';
        const lastNameB = b.full_name?.split(' ').pop() || '';
        return lastNameA.localeCompare(lastNameB);
      });
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    const playerId = draggableId.replace('player-', '');
    const newTeamId = destination.droppableId.replace('team-', '');

    updatePlayerTeamMutation.mutate({ playerId, teamId: newTeamId });
  };

  const TeamColumn = ({ title, teams, bgColor }) => (
    <div className="flex-1 min-w-[380px]">
      <Card className="border-none shadow-2xl h-full overflow-hidden">
        <CardHeader className={`${bgColor} border-b shadow-lg`}>
          <CardTitle className="text-white text-center text-xl font-bold tracking-wide">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 overflow-y-auto max-h-[calc(100vh-280px)]">
          <div className="space-y-4">
            {teams.map(team => {
              const teamPlayers = getTeamPlayers(team);
              return (
                <Droppable droppableId={`team-${team.id}`} key={team.id}>
                  {(provided, snapshot) => (
                    <Card 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`border-2 transition-all duration-200 ${
                        snapshot.isDraggingOver ? 'ring-4 ring-emerald-400 shadow-2xl scale-[1.02]' : 'shadow-md'
                      }`}
                      style={{ borderColor: team.team_color }}
                    >
                      <CardHeader className="pb-3" style={{ 
                        backgroundColor: `${team.team_color}20`,
                        borderBottom: `2px solid ${team.team_color}`
                      }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                              style={{ backgroundColor: team.team_color }}
                            >
                              {team.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-lg">{team.name}</div>
                              <div className="text-xs text-slate-600 font-medium">{teamPlayers.length} players</div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 space-y-2 min-h-[100px]">
                        {teamPlayers.length === 0 ? (
                          <p className="text-center text-slate-400 text-sm py-8 italic">Drop players here</p>
                        ) : (
                          teamPlayers.map((player, index) => (
                            <Draggable key={player.id} draggableId={`player-${player.id}`} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`${
                                    player.trapped === 'Yes' 
                                      ? 'border-red-500 bg-gradient-to-r from-red-50 to-red-100' 
                                      : 'border-slate-200 bg-white hover:border-emerald-300'
                                  } w-full p-3 rounded-xl transition-all border-2 cursor-grab active:cursor-grabbing ${
                                    snapshot.isDragging ? 'shadow-2xl rotate-2 scale-105 ring-4 ring-blue-400' : 'hover:shadow-lg hover:scale-[1.02]'
                                  }`}
                                  onClick={() => !snapshot.isDragging && navigate(`${createPageUrl('PlayerProfile')}?id=${player.id}`)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                                        {player.jersey_number || <User className="w-5 h-5" />}
                                      </div>
                                      <div>
                                        <div className="font-semibold text-slate-900">{player.full_name}</div>
                                        <div className="text-xs text-slate-600">{player.position}</div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      {player.trapped === 'Yes' && (
                                        <Badge className="bg-red-500 text-white mb-1 shadow-sm">
                                          <AlertCircle className="w-3 h-3 mr-1" />
                                          Trapped
                                        </Badge>
                                      )}
                                      {player.tryout && (
                                        <div className="space-y-1">
                                          {player.tryout.team_role && (
                                            <div className="text-xs text-slate-600 font-medium">{player.tryout.team_role}</div>
                                          )}
                                          {player.tryout.recommendation && (
                                            <Badge 
                                              className={`shadow-sm ${
                                                player.tryout.recommendation === 'Move up' ? 'bg-emerald-500' :
                                                player.tryout.recommendation === 'Move down' ? 'bg-orange-500' :
                                                'bg-blue-500'
                                              }`}
                                            >
                                              {player.tryout.recommendation}
                                            </Badge>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))
                        )}
                        {provided.placeholder}
                      </CardContent>
                    </Card>
                  )}
                </Droppable>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="p-8 max-w-[1900px] mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Tryouts Dashboard
          </h1>
          <p className="text-slate-600 text-lg">Drag and drop players between teams • Filter by birthday, league, and coach</p>
        </div>

        <Card className="border-none shadow-xl mb-6 bg-gradient-to-br from-white to-slate-50">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Team</label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger className="border-2">
                    <SelectValue placeholder="All Teams" />
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
                <label className="text-sm font-semibold text-slate-700 mb-2 block">League</label>
                <Select value={selectedLeague} onValueChange={setSelectedLeague}>
                  <SelectTrigger className="border-2">
                    <SelectValue placeholder="All Leagues" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Leagues</SelectItem>
                    <SelectItem value="Girls Academy">Girls Academy</SelectItem>
                    <SelectItem value="Aspire">Aspire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Coach</label>
                <Select value={selectedCoach} onValueChange={setSelectedCoach}>
                  <SelectTrigger className="border-2">
                    <SelectValue placeholder="All Coaches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Coaches</SelectItem>
                    {coaches.map(coach => (
                      <SelectItem key={coach.id} value={coach.id}>{coach.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Birthday From</label>
                <input
                  type="date"
                  value={birthdayFrom}
                  onChange={(e) => setBirthdayFrom(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Birthday To</label>
                <input
                  type="date"
                  value={birthdayTo}
                  onChange={(e) => setBirthdayTo(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-6 overflow-x-auto pb-4">
          <TeamColumn 
            title="Girls Academy" 
            teams={filteredGATeams} 
            bgColor="bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600" 
          />
          <TeamColumn 
            title="Aspire League" 
            teams={filteredAspireTeams} 
            bgColor="bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600" 
          />
          <TeamColumn 
            title="Other Leagues" 
            teams={filteredOtherTeams} 
            bgColor="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-600" 
          />
        </div>
      </div>
    </DragDropContext>
  );
}