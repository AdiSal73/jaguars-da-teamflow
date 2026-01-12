import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User, AlertCircle, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import PlayerInfoTooltip, { PlayerHoverTooltip } from '../components/player/PlayerInfoTooltip';
import { getPositionBorderColor } from '../components/player/positionColors';
import { isTrappedPlayer } from '../components/utils/trappedPlayer';
import { TeamRoleBadge } from '@/components/utils/teamRoleBadge';

export default function Tryouts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all');
  const [selectedLeague, setSelectedLeague] = useState('all');
  const [selectedCoach, setSelectedCoach] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [birthdayFrom, setBirthdayFrom] = useState('');
  const [birthdayTo, setBirthdayTo] = useState('');
  const [sortBy, setSortBy] = useState('team');
  const [showAllPlayers, setShowAllPlayers] = useState(false);
  const [showTrappedOnly, setShowTrappedOnly] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState('all');

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

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => base44.entities.PhysicalAssessment.list()
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations'],
    queryFn: () => base44.entities.Evaluation.list()
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

  const getPlayerTryoutData = (player) => {
    const tryout = tryouts.find((t) => t.player_id === player.id);
    return { ...player, tryout };
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
    return teamList.filter((t) => t.league === selectedLeague);
  };

  const filterByCoach = (teamList) => {
    if (selectedCoach === 'all') return teamList;
    return teamList.filter((t) => t.coach_ids?.includes(selectedCoach));
  };

  const filterByAgeGroup = (teamList) => {
    if (selectedAgeGroup === 'all') return teamList;
    return teamList.filter((t) => t.age_group === selectedAgeGroup);
  };

  const filterByGender = (teamList) => {
    if (selectedGender === 'all') return teamList;
    return teamList.filter((t) => t.gender === selectedGender);
  };

  const filterBySeason = (teamList) => {
    if (selectedSeason === 'all') return teamList;
    return teamList.filter((t) => {
      const teamSeason = t.season || (t.name?.includes('26/27') ? '26/27' : t.name?.includes('25/26') ? '25/26' : null);
      return teamSeason === selectedSeason;
    });
  };

  const gaTeams = sortTeamsByAge(filterBySeason(filterByGender(filterByAgeGroup(filterByCoach(filterByLeague((teams || []).filter((t) => t.league === 'Girls Academy' && t.name && typeof t.name === 'string')))))));
  const aspireTeams = sortTeamsByAge(filterBySeason(filterByGender(filterByAgeGroup(filterByCoach(filterByLeague((teams || []).filter((t) => t.league === 'Aspire' && t.name && typeof t.name === 'string')))))));
  const otherTeams = sortTeamsByAge(filterBySeason(filterByGender(filterByAgeGroup(filterByCoach(filterByLeague((teams || []).filter((t) => t.league !== 'Girls Academy' && t.league !== 'Aspire' && t.name && typeof t.name === 'string')))))));

  const getTeamPlayers = (team) => {
    let teamPlayers = players.filter((p) => p.team_id === team.id);

    if (birthdayFrom) {
      teamPlayers = teamPlayers.filter((p) => !p.date_of_birth || new Date(p.date_of_birth) >= new Date(birthdayFrom));
    }
    if (birthdayTo) {
      teamPlayers = teamPlayers.filter((p) => !p.date_of_birth || new Date(p.date_of_birth) <= new Date(birthdayTo));
    }
    
    if (showTrappedOnly) {
      teamPlayers = teamPlayers.filter((p) => isTrappedPlayer(p.date_of_birth));
    }

    const playersWithTryout = teamPlayers?.map((p) => getPlayerTryoutData(p)) || [];

    return playersWithTryout.sort((a, b) => {
      const lastNameA = a.full_name?.split(' ').pop() || '';
      const lastNameB = b.full_name?.split(' ').pop() || '';
      return lastNameA.localeCompare(lastNameB);
    });
  };

  const calculateTeamPriority = (team) => {
    if (team.league === 'Girls Academy') return 1;
    if (team.league === 'Aspire') return 2;
    const name = typeof team.name === 'string' ? team.name.toLowerCase() : '';
    if (name.includes('green')) return 3;
    if (name.includes('white')) return 4;
    if (name.includes('black')) return 5;
    return 6;
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const playerId = draggableId.replace('player-', '');
    const destTeamId = destination.droppableId.replace('team-', '');

    await updatePlayerTeamMutation.mutateAsync({ playerId, teamId: destTeamId });
  };

  const TeamColumn = ({ title, teams, bgColor, logoUrl }) => (
    <div className="flex-1">
      <Card className="border-none shadow-2xl h-full overflow-hidden backdrop-blur-sm">
        <CardHeader className={`${bgColor} p-4 md:p-6 flex flex-col space-y-1.5 border-b shadow-lg`}>
          <div className="flex justify-center mb-3 md:mb-4 h-24 md:h-32">
            {logoUrl ? (
              <img src={logoUrl} alt={title} className="w-20 h-20 md:w-32 md:h-32 object-contain" />
            ) : (
              <div className="w-20 h-20 md:w-32 md:h-32 flex items-center justify-center">
                <svg viewBox="0 0 120 120" className="w-full h-full">
                  <circle cx="60" cy="60" r="50" fill="#10b981" opacity="0.2"/>
                  <circle cx="60" cy="60" r="38" fill="none" stroke="#10b981" strokeWidth="4"/>
                  <path d="M60 22 L60 98 M22 60 L98 60" stroke="#10b981" strokeWidth="3"/>
                  <circle cx="60" cy="60" r="8" fill="#10b981"/>
                </svg>
              </div>
            )}
          </div>
          <CardTitle className="text-white text-center text-lg md:text-2xl font-bold tracking-wide">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-5 overflow-y-auto max-h-[calc(100vh-280px)] bg-gradient-to-b from-slate-50 to-white">
          <div className="space-y-3 md:space-y-4">
            {teams?.map((team) => {
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
                      <CardHeader className="pb-3 bg-gradient-to-r from-slate-50 to-white border-b-2 border-slate-200 p-3 md:p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-sm md:text-lg shadow-md">
                              {team.age_group || (team.name && typeof team.name === 'string' ? team.name.charAt(0) : '?')}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-sm md:text-lg">{team.name && typeof team.name === 'string' ? team.name : 'Unknown'}</div>
                              <div className="text-[10px] md:text-xs text-slate-600 font-medium flex items-center gap-1 md:gap-2">
                                <span>{team.age_group}</span>
                                <span>•</span>
                                <span>{teamPlayers.length} players</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-2 md:p-3 space-y-2 min-h-[80px] md:min-h-[100px]">
                        {teamPlayers.length === 0 ? (
                          <p className="text-center text-slate-400 text-xs md:text-sm py-6 md:py-8 italic">Drop players here</p>
                        ) : (
                          teamPlayers?.map((player, index) => (
                            <Draggable key={player.id} draggableId={`player-${player.id}`} index={index}>
                              {(provided, snapshot) => (
                                <PlayerHoverTooltip 
                                  player={player}
                                  tryout={player.tryout}
                                  evaluation={evaluations.filter(e => e.player_id === player.id).sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0]}
                                  assessment={assessments.filter(a => a.player_id === player.id).sort((a, b) => new Date(b.assessment_date) - new Date(a.assessment_date))[0]}
                                >
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={{
                                      ...provided.draggableProps.style,
                                    }}
                                    className={`${
                                      isTrappedPlayer(player.date_of_birth)
                                        ? 'border-red-400 bg-gradient-to-r from-red-50 to-red-100' 
                                        : `${getPositionBorderColor(player.primary_position)} bg-white hover:border-emerald-400`
                                    } w-full p-3 md:p-4 rounded-xl transition-all border-2 cursor-grab active:cursor-grabbing ${
                                      snapshot.isDragging ? 'shadow-2xl scale-105 ring-4 ring-emerald-400 bg-white' : 'hover:shadow-md'
                                    }`}
                                    onClick={(e) => {
                                     if (!snapshot.isDragging) {
                                       e.stopPropagation();
                                       navigate(`${createPageUrl('PlayerDashboard')}?id=${player.id}`);
                                     }
                                    }}
                                    >
                                    <div className="flex items-center justify-between gap-2">
                                     <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                                       <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center text-white font-bold shadow-md text-xs md:text-base flex-shrink-0">
                                         {player.jersey_number || <User className="w-4 h-4" />}
                                       </div>
                                       <div className="flex-1 min-w-0">
                                         <div className="font-bold text-slate-900 text-sm md:text-base truncate">{player.full_name}</div>
                                         <div className="text-xs md:text-sm text-slate-600 mt-0.5 flex gap-1 items-center truncate">
                                           <span>{player.primary_position}</span>
                                           {player.age_group && (
                                             <Badge className="bg-purple-100 text-purple-800 text-xs md:text-sm px-2 py-1 font-bold">{player.age_group}</Badge>
                                           )}
                                         </div>
                                       </div>
                                     </div>
                                     <div className="flex flex-col gap-1 items-end flex-shrink-0">
                                       {isTrappedPlayer(player.date_of_birth) && (
                                         <Badge className="bg-red-500 text-white text-xs md:text-sm px-2 py-1 font-bold">
                                           TRAPPED
                                         </Badge>
                                       )}
                                       {player.tryout?.team_role && (
                                         <TeamRoleBadge role={player.tryout.team_role} size="default" />
                                       )}
                                     </div>
                                    </div>
                                    </div>
                                </PlayerHoverTooltip>
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
      <div className="p-4 md:p-8 max-w-[1900px] mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-slate-900 mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Tryouts Board
          </h1>
          <p className="text-sm md:text-lg text-slate-600">Current team rosters with drag-and-drop management</p>
        </div>

        <Card className="border-none shadow-xl mb-6 bg-gradient-to-br from-white via-slate-50 to-blue-50">
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 md:gap-4">
              <div>
                <label className="text-xs md:text-sm font-semibold text-slate-700 mb-2 block">Gender</label>
                <Select value={selectedGender} onValueChange={setSelectedGender}>
                  <SelectTrigger className="border-2 h-10 md:h-12 shadow-sm text-xs md:text-sm">
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
                <label className="text-xs md:text-sm font-semibold text-slate-700 mb-2 block">Age Group</label>
                <Select value={selectedAgeGroup} onValueChange={setSelectedAgeGroup}>
                  <SelectTrigger className="border-2 h-10 md:h-12 shadow-sm text-xs md:text-sm">
                    <SelectValue placeholder="All Age Groups" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Age Groups</SelectItem>
                    {[...new Set(teams?.map((t) => t.age_group).filter(Boolean) || [])].sort((a, b) => {
                      const extractAge = (ag) => {
                        const match = ag?.match(/U-?(\d+)/i);
                        return match ? parseInt(match[1]) : 0;
                      };
                      return extractAge(b) - extractAge(a);
                    })?.map((ageGroup) =>
                    <SelectItem key={ageGroup} value={ageGroup}>{ageGroup}</SelectItem>
                    ) || []}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs md:text-sm font-semibold text-slate-700 mb-2 block">League</label>
                <Select value={selectedLeague} onValueChange={setSelectedLeague}>
                  <SelectTrigger className="border-2 h-10 md:h-12 shadow-sm text-xs md:text-sm">
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
                <label className="text-xs md:text-sm font-semibold text-slate-700 mb-2 block">Coach</label>
                <Select value={selectedCoach} onValueChange={setSelectedCoach}>
                  <SelectTrigger className="border-2 h-10 md:h-12 shadow-sm text-xs md:text-sm">
                    <SelectValue placeholder="All Coaches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Coaches</SelectItem>
                    {coaches?.map((coach) =>
                    <SelectItem key={coach.id} value={coach.id}>{coach.full_name}</SelectItem>
                    ) || []}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs md:text-sm font-semibold text-slate-700 mb-2 block">Season</label>
                <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                  <SelectTrigger className="border-2 h-10 md:h-12 shadow-sm text-xs md:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Seasons</SelectItem>
                    {[...new Set(teams?.map(t => t.season || (t.name?.includes('26/27') ? '26/27' : t.name?.includes('25/26') ? '25/26' : null)).filter(Boolean) || [])].sort().reverse()?.map(season => (
                      <SelectItem key={season} value={season}>{season}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs md:text-sm font-semibold text-slate-700 mb-2 block">&nbsp;</label>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedAgeGroup('all');
                    setSelectedLeague('all');
                    setSelectedCoach('all');
                    setSelectedGender('all');
                    setSelectedSeason('all');
                  }}
                  className="w-full h-10 md:h-12"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 pb-4">
          <TeamColumn
            title="Girls Academy"
            teams={gaTeams}
            bgColor="bg-gradient-to-r from-green-600 via-green-700 to-emerald-600"
            logoUrl="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691b4f505049805bdf639ffd/688b1cb43_girls-academy-logo-1024x1024-2898394893.png" />

          <TeamColumn
            title="Aspire"
            teams={aspireTeams}
            bgColor="bg-gradient-to-r from-green-600 via-green-700 to-emerald-600"
            logoUrl="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691b4f505049805bdf639ffd/3a4b138c7_girls-academy-aspire-logo-1024x1024-2549474488.png" />

          <TeamColumn
            title="Other Leagues"
            teams={otherTeams}
            bgColor="bg-gradient-to-r from-green-600 via-green-700 to-emerald-600"
            logoUrl="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691b4f505049805bdf639ffd/3a4b138c7_girls-academy-aspire-logo-1024x1024-2549474488.png" />
        </div>
      </div>
    </DragDropContext>
  );
}