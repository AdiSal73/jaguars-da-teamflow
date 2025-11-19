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
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all');
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
      const extractAge = (ageGroup) => {
        const match = ageGroup?.match(/U-?(\d+)/i);
        return match ? parseInt(match[1]) : 0;
      };
      return extractAge(b.age_group) - extractAge(a.age_group);
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

  const filterByAgeGroup = (teamList) => {
    if (selectedAgeGroup === 'all') return teamList;
    return teamList.filter(t => t.age_group === selectedAgeGroup);
  };

  const gaTeams = sortTeamsByAge(filterByAgeGroup(filterByCoach(filterByLeague(teams.filter(t => t.league === 'Girls Academy')))));
  const aspireTeams = sortTeamsByAge(filterByAgeGroup(filterByCoach(filterByLeague(teams.filter(t => t.league === 'Aspire')))));
  const otherTeams = sortTeamsByAge(filterByAgeGroup(filterByCoach(filterByLeague(teams.filter(t => t.league !== 'Girls Academy' && t.league !== 'Aspire')))));

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
    <div className="flex-1 min-w-[420px]">
      <Card className="border-none shadow-2xl h-full overflow-hidden backdrop-blur-sm">
        <CardHeader className={`${bgColor} border-b shadow-lg py-6`}>
          <CardTitle className="text-white text-center text-2xl font-bold tracking-wide">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-5 overflow-y-auto max-h-[calc(100vh-280px)] bg-gradient-to-b from-slate-50 to-white">
          <div className="space-y-4">
            {teams.map(team => {
              const teamPlayers = getTeamPlayers(team);
              return (
                <Droppable droppableId={`team-${team.id}`} key={team.id}>
                  {(provided, snapshot) => (
                    <Card 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`border-2 border-slate-200 transition-all duration-200 shadow-lg hover:shadow-xl ${
                        snapshot.isDraggingOver ? 'ring-4 ring-emerald-400 shadow-2xl scale-[1.02] bg-emerald-50' : ''
                      }`}
                    >
                      <CardHeader className="pb-3 bg-gradient-to-r from-slate-50 to-white border-b-2 border-slate-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                              {team.age_group || team.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-lg">{team.name}</div>
                              <div className="text-xs text-slate-600 font-medium flex items-center gap-2">
                                <span>{team.age_group}</span>
                                <span>•</span>
                                <span>{teamPlayers.length} players</span>
                              </div>
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
                                 style={{
                                   ...provided.draggableProps.style,
                                 }}
                                 className={`${
                                   player.trapped === 'Yes' 
                                     ? 'border-red-400 bg-gradient-to-r from-red-50 to-red-100' 
                                     : 'border-slate-200 bg-white hover:border-emerald-400'
                                 } w-full p-4 rounded-xl transition-all border-2 cursor-grab active:cursor-grabbing ${
                                   snapshot.isDragging ? 'shadow-2xl scale-105 ring-4 ring-emerald-400 bg-white' : 'hover:shadow-md'
                                 }`}
                                 onClick={() => !snapshot.isDragging && navigate(`${createPageUrl('PlayerProfile')}?id=${player.id}`)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md text-lg">
                                        {player.jersey_number || <User className="w-6 h-6" />}
                                      </div>
                                      <div className="flex-1">
                                        <div className="font-bold text-slate-900 text-base">{player.full_name}</div>
                                        <div className="text-xs text-slate-600 mt-0.5">{player.position}</div>
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

        <Card className="border-none shadow-xl mb-6 bg-gradient-to-br from-white via-slate-50 to-blue-50">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Age Group</label>
                <Select value={selectedAgeGroup} onValueChange={setSelectedAgeGroup}>
                  <SelectTrigger className="border-2 h-12 shadow-sm">
                    <SelectValue placeholder="All Age Groups" />
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
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">League</label>
                <Select value={selectedLeague} onValueChange={setSelectedLeague}>
                  <SelectTrigger className="border-2 h-12 shadow-sm">
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
                  <SelectTrigger className="border-2 h-12 shadow-sm">
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
                  className="w-full h-12 px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Birthday To</label>
                <input
                  type="date"
                  value={birthdayTo}
                  onChange={(e) => setBirthdayTo(e.target.value)}
                  className="w-full h-12 px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-6 overflow-x-auto pb-4">
          <TeamColumn 
            title="Girls Academy" 
            teams={gaTeams} 
            bgColor="bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600" 
          />
          <TeamColumn 
            title="Aspire League" 
            teams={aspireTeams} 
            bgColor="bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600" 
          />
          <TeamColumn 
            title="Other Leagues" 
            teams={otherTeams} 
            bgColor="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-600" 
          />
        </div>
      </div>
    </DragDropContext>
  );
}