import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Search, Users } from 'lucide-react';
import { getPositionBorderColor } from '../components/player/positionColors';

const isTrappedPlayer = (dateOfBirth) => {
  if (!dateOfBirth) return false;
  const dob = new Date(dateOfBirth);
  const month = dob.getMonth();
  return month >= 7; // August (7) to December (11)
};

export default function TeamTryout() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAgeGroup, setFilterAgeGroup] = useState('all');
  const [filterCoach, setFilterCoach] = useState('all');
  const [filterLeague, setFilterLeague] = useState('all');
  const [filterBirthYear, setFilterBirthYear] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [showAllPlayers, setShowAllPlayers] = useState(false);
  const [showTrappedOnly, setShowTrappedOnly] = useState(false);

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const { data: allPlayers = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
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

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const playerId = result.draggableId.replace('player-', '');
    const destTeamId = result.destination.droppableId.replace('team-', '');
    const finalTeamId = destTeamId === 'unassigned' ? null : destTeamId;

    updatePlayerTeamMutation.mutate({ playerId, teamId: finalTeamId });
  };

  // Filter teams
  const filteredTeams = useMemo(() => {
    return teams.filter(team => {
      const ageGroupMatch = filterAgeGroup === 'all' || team.age_group === filterAgeGroup;
      const coachMatch = filterCoach === 'all' || (team.coach_ids || []).includes(filterCoach);
      const leagueMatch = filterLeague === 'all' || team.league === filterLeague;
      const genderMatch = filterGender === 'all' || team.gender === filterGender;
      return ageGroupMatch && coachMatch && leagueMatch && genderMatch;
    });
  }, [teams, filterAgeGroup, filterCoach, filterLeague, filterGender]);

  // Filter players
  const filteredPlayers = useMemo(() => {
    return allPlayers.filter(player => {
      const matchesSearch = player.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!showAllPlayers) {
        const team = teams.find(t => t.id === player.team_id);
        const ageGroupMatch = filterAgeGroup === 'all' || team?.age_group === filterAgeGroup;
        const coachMatch = filterCoach === 'all' || (team?.coach_ids || []).includes(filterCoach);
        const leagueMatch = filterLeague === 'all' || team?.league === filterLeague;
        const genderMatch = filterGender === 'all' || player.gender === filterGender;
        
        if (!(ageGroupMatch && coachMatch && leagueMatch && genderMatch)) return false;
      } else {
        const genderMatch = filterGender === 'all' || player.gender === filterGender;
        if (!genderMatch) return false;
      }

      const birthYear = player.date_of_birth ? new Date(player.date_of_birth).getFullYear().toString() : '';
      const birthYearMatch = filterBirthYear === 'all' || birthYear === filterBirthYear;
      
      const trappedMatch = !showTrappedOnly || isTrappedPlayer(player.date_of_birth);

      return matchesSearch && birthYearMatch && trappedMatch;
    });
  }, [allPlayers, teams, searchTerm, filterAgeGroup, filterCoach, filterLeague, filterBirthYear, filterGender, showAllPlayers, showTrappedOnly]);

  const getPlayersForTeam = (teamId) => {
    return filteredPlayers.filter(p => p.team_id === teamId);
  };

  const unassignedPlayers = filteredPlayers.filter(p => !p.team_id);

  const uniqueAgeGroups = [...new Set(teams.map(t => t.age_group).filter(Boolean))].sort((a, b) => {
    const extractAge = (ag) => {
      const match = ag?.match(/U-?(\d+)/i);
      return match ? parseInt(match[1]) : 0;
    };
    return extractAge(b) - extractAge(a);
  });

  const uniqueLeagues = [...new Set(teams.map(t => t.league).filter(Boolean))];
  
  const uniqueBirthYears = [...new Set(allPlayers.map(p => {
    return p.date_of_birth ? new Date(p.date_of_birth).getFullYear().toString() : null;
  }).filter(Boolean))].sort((a, b) => b.localeCompare(a));

  const PlayerCard = ({ player }) => {
    const team = teams.find(t => t.id === player.team_id);
    const isTrapped = isTrappedPlayer(player.date_of_birth);

    return (
      <div className={`bg-white rounded-lg p-3 shadow-sm border-2 hover:shadow-md transition-all ${getPositionBorderColor(player.primary_position)}`}>
        <div className="flex items-start gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {player.jersey_number || player.full_name?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-slate-900 truncate">{player.full_name}</div>
            <div className="text-xs text-slate-600 truncate">{player.primary_position || 'No position'}</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {player.date_of_birth && (
                <Badge className="bg-slate-100 text-slate-700 text-[9px]">
                  {new Date(player.date_of_birth).getFullYear()}
                </Badge>
              )}
              {team && (
                <Badge className="bg-blue-100 text-blue-700 text-[9px]">
                  {team.name}
                </Badge>
              )}
              {isTrapped && (
                <Badge className="bg-red-500 text-white text-[9px] font-bold">
                  TRAPPED
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="p-4 md:p-8 max-w-[1800px] mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Team Tryout Assignment</h1>
          <p className="text-slate-600 mt-1">Drag and drop players to assign them to teams</p>
        </div>

        <Card className="mb-6 border-none shadow-lg">
          <CardContent className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Gender</Label>
                <Select value={filterGender} onValueChange={setFilterGender}>
                  <SelectTrigger className="h-9 text-xs">
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
                <Label className="text-xs mb-1 block">Age Group</Label>
                <Select value={filterAgeGroup} onValueChange={setFilterAgeGroup}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ages</SelectItem>
                    {uniqueAgeGroups.map(ag => (
                      <SelectItem key={ag} value={ag}>{ag}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs mb-1 block">League</Label>
                <Select value={filterLeague} onValueChange={setFilterLeague}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Leagues</SelectItem>
                    {uniqueLeagues.map(league => (
                      <SelectItem key={league} value={league}>{league}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs mb-1 block">Coach</Label>
                <Select value={filterCoach} onValueChange={setFilterCoach}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
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
                <Label className="text-xs mb-1 block">Birth Year</Label>
                <Select value={filterBirthYear} onValueChange={setFilterBirthYear}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {uniqueBirthYears.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs mb-1 block">Player Scope</Label>
                <Select value={showAllPlayers ? 'all' : 'filtered'} onValueChange={(val) => setShowAllPlayers(val === 'all')}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="filtered">Filtered Only</SelectItem>
                    <SelectItem value="all">All Players</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs mb-1 block">Trapped Filter</Label>
                <Select value={showTrappedOnly ? 'trapped' : 'all'} onValueChange={(val) => setShowTrappedOnly(val === 'trapped')}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Players</SelectItem>
                    <SelectItem value="trapped">Trapped Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-[1fr_300px] gap-4">
          <div className="space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 320px)' }}>
            {filteredTeams.map(team => {
              const teamPlayers = getPlayersForTeam(team.id);
              return (
                <Card key={team.id} className="border-2 border-slate-200">
                  <CardHeader className="pb-3 bg-gradient-to-r from-emerald-50 to-blue-50">
                    <CardTitle className="text-base flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{team.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <Badge className="bg-slate-100 text-slate-700">{team.age_group}</Badge>
                        <Badge className="bg-blue-100 text-blue-700">{teamPlayers.length} players</Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <Droppable droppableId={`team-${team.id}`}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`min-h-[100px] p-2 rounded-lg transition-all ${
                            snapshot.isDraggingOver ? 'bg-emerald-50 border-2 border-emerald-300' : 'bg-slate-50 border-2 border-dashed border-slate-200'
                          }`}
                        >
                          <div className="grid gap-2">
                            {teamPlayers.map((player, index) => (
                              <Draggable key={player.id} draggableId={`player-${player.id}`} index={index}>
                                {(dragProvided, dragSnapshot) => (
                                  <div
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    {...dragProvided.dragHandleProps}
                                    className={`cursor-grab active:cursor-grabbing ${
                                      dragSnapshot.isDragging ? 'opacity-50 rotate-2' : ''
                                    }`}
                                  >
                                    <PlayerCard player={player} />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          </div>
                          {provided.placeholder}
                          {teamPlayers.length === 0 && (
                            <div className="text-center py-8 text-slate-400 text-sm">
                              Drop players here
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

          <Card className="border-2 border-orange-200 sticky top-4 self-start" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            <CardHeader className="pb-3 bg-gradient-to-r from-orange-50 to-red-50">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Unassigned Players</span>
                <Badge className="bg-orange-100 text-orange-700">{unassignedPlayers.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
              <Droppable droppableId="team-unassigned">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[200px] rounded-lg transition-all ${
                      snapshot.isDraggingOver ? 'bg-orange-50 border-2 border-orange-300' : ''
                    }`}
                  >
                    <div className="grid gap-2">
                      {unassignedPlayers.map((player, index) => (
                        <Draggable key={player.id} draggableId={`player-${player.id}`} index={index}>
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              className={`cursor-grab active:cursor-grabbing ${
                                dragSnapshot.isDragging ? 'opacity-50 rotate-2' : ''
                              }`}
                            >
                              <PlayerCard player={player} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                    </div>
                    {provided.placeholder}
                    {unassignedPlayers.length === 0 && (
                      <div className="text-center py-8 text-slate-400 text-sm">
                        No unassigned players
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </CardContent>
          </Card>
        </div>
      </div>
    </DragDropContext>
  );
}