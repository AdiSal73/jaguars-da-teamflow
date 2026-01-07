import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import PlayerInfoTooltip, { PlayerHoverTooltip } from '../components/player/PlayerInfoTooltip';
import { getPositionBorderColor } from '../components/player/positionColors';
import { isTrappedPlayer } from '../components/utils/trappedPlayer';
import { TeamRoleBadge } from '@/components/utils/teamRoleBadge';
import { RotateCcw } from 'lucide-react';

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
  const [viewMode, setViewMode] = useState('columns');
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
      if (sortBy === 'team') {
        const teamA = teams.find((t) => t.id === a.team_id);
        const teamB = teams.find((t) => t.id === b.team_id);
        const teamCompare = (teamA?.name || '').localeCompare(teamB?.name || '');
        if (teamCompare !== 0) return teamCompare;
      } else if (sortBy === 'age_group') {
        const teamA = teams.find((t) => t.id === a.team_id);
        const teamB = teams.find((t) => t.id === b.team_id);
        const extractAge = (ag) => {
          const match = ag?.match(/U-?(\d+)/i);
          return match ? parseInt(match[1]) : 0;
        };
        const ageCompare = extractAge(teamB?.age_group) - extractAge(teamA?.age_group);
        if (ageCompare !== 0) return ageCompare;
      } else if (sortBy === 'league') {
        const teamA = teams.find((t) => t.id === a.team_id);
        const teamB = teams.find((t) => t.id === b.team_id);
        const leagueCompare = (teamA?.league || '').localeCompare(teamB?.league || '');
        if (leagueCompare !== 0) return leagueCompare;
      } else if (sortBy === 'team_role') {
        const roleCompare = (a.tryout?.team_role || '').localeCompare(b.tryout?.team_role || '');
        if (roleCompare !== 0) return roleCompare;
      } else if (sortBy === 'recommendation') {
        const recCompare = (a.tryout?.recommendation || '').localeCompare(b.tryout?.recommendation || '');
        if (recCompare !== 0) return recCompare;
      } else if (sortBy === 'next_season_status') {
        const statusCompare = (a.tryout?.next_season_status || '').localeCompare(b.tryout?.next_season_status || '');
        if (statusCompare !== 0) return statusCompare;
      } else if (sortBy === 'registration_status') {
        const regCompare = (a.tryout?.registration_status || '').localeCompare(b.tryout?.registration_status || '');
        if (regCompare !== 0) return regCompare;
      }

      const lastNameA = a.full_name?.split(' ').pop() || '';
      const lastNameB = b.full_name?.split(' ').pop() || '';
      return lastNameA.localeCompare(lastNameB);
    });
  };

  const updateTryoutField = useMutation({
    mutationFn: async ({ playerId, field, value }) => {
      const existingTryout = tryouts.find((t) => t.player_id === playerId);
      const player = players.find((p) => p.id === playerId);
      const team = teams.find((t) => t.id === player?.team_id);

      if (existingTryout) {
        return base44.entities.PlayerTryout.update(existingTryout.id, { [field]: value });
      } else {
        return base44.entities.PlayerTryout.create({
          player_id: playerId,
          player_name: player?.full_name,
          current_team: team?.name,
          [field]: value
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tryouts']);
    }
  });

  const updateRankingMutation = useMutation({
    mutationFn: async (updates) => {
      await Promise.all(updates.map(u => {
         if (u.tryoutId) {
             return base44.entities.PlayerTryout.update(u.tryoutId, { team_ranking: u.ranking });
         } else {
             return base44.entities.PlayerTryout.create({
                 player_id: u.playerId,
                 team_ranking: u.ranking
             });
         }
      }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tryouts']);
      queryClient.invalidateQueries(['players']);
    }
  });

  const getAllPlayersWithTryout = () => {
    const allPlayersData = players?.map((p) => getPlayerTryoutData(p)) || [];
    let filtered = allPlayersData;

    if (!showAllPlayers) {
      if (selectedAgeGroup !== 'all') {
        filtered = filtered.filter((p) => {
          const team = teams.find((t) => t.id === p.team_id);
          return team?.age_group === selectedAgeGroup;
        });
      }

      if (selectedLeague !== 'all') {
        filtered = filtered.filter((p) => {
          const team = teams.find((t) => t.id === p.team_id);
          return team?.league === selectedLeague;
        });
      }

      if (selectedCoach !== 'all') {
        filtered = filtered.filter((p) => {
          const team = teams.find((t) => t.id === p.team_id);
          return team?.coach_ids?.includes(selectedCoach);
        });
      }
    }

    if (selectedGender !== 'all') {
      filtered = filtered.filter((p) => p.gender === selectedGender);
    }

    if (birthdayFrom) {
      filtered = filtered.filter((p) => !p.date_of_birth || new Date(p.date_of_birth) >= new Date(birthdayFrom));
    }

    if (birthdayTo) {
      filtered = filtered.filter((p) => !p.date_of_birth || new Date(p.date_of_birth) <= new Date(birthdayTo));
    }
    
    if (showTrappedOnly) {
      filtered = filtered.filter((p) => isTrappedPlayer(p.date_of_birth));
    }

    return filtered.sort((a, b) => {
      if (sortBy === 'team') {
        const teamA = teams.find((t) => t.id === a.team_id);
        const teamB = teams.find((t) => t.id === b.team_id);
        const teamCompare = (teamA?.name || '').localeCompare(teamB?.name || '');
        if (teamCompare !== 0) return teamCompare;
      } else if (sortBy === 'age_group') {
        const teamA = teams.find((t) => t.id === a.team_id);
        const teamB = teams.find((t) => t.id === b.team_id);
        const extractAge = (ag) => {
          const match = ag?.match(/U-?(\d+)/i);
          return match ? parseInt(match[1]) : 0;
        };
        const ageCompare = extractAge(teamB?.age_group) - extractAge(teamA?.age_group);
        if (ageCompare !== 0) return ageCompare;
      } else if (sortBy === 'league') {
        const teamA = teams.find((t) => t.id === a.team_id);
        const teamB = teams.find((t) => t.id === b.team_id);
        const leagueCompare = (teamA?.league || '').localeCompare(teamB?.league || '');
        if (leagueCompare !== 0) return leagueCompare;
      } else if (sortBy === 'team_role') {
        const roleCompare = (a.tryout?.team_role || '').localeCompare(b.tryout?.team_role || '');
        if (roleCompare !== 0) return roleCompare;
      } else if (sortBy === 'recommendation') {
        const recCompare = (a.tryout?.recommendation || '').localeCompare(b.tryout?.recommendation || '');
        if (recCompare !== 0) return recCompare;
      } else if (sortBy === 'next_season_status') {
        const statusCompare = (a.tryout?.next_season_status || '').localeCompare(b.tryout?.next_season_status || '');
        if (statusCompare !== 0) return statusCompare;
      } else if (sortBy === 'registration_status') {
        const regCompare = (a.tryout?.registration_status || '').localeCompare(b.tryout?.registration_status || '');
        if (regCompare !== 0) return regCompare;
      }

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
    const sourceTeamId = source.droppableId.replace('team-', '');
    const destTeamId = destination.droppableId.replace('team-', '');

    // Update player's team if moved to different team
    if (sourceTeamId !== destTeamId) {
       await updatePlayerTeamMutation.mutateAsync({ playerId, teamId: destTeamId });
    }

    const destTeam = teams.find((t) => t.id === destTeamId);
    const ageGroup = destTeam?.age_group;

    if (!ageGroup) return;

    const ageGroupTeams = teams.filter((t) => t.age_group === ageGroup);
    
    ageGroupTeams.sort((a, b) => {
        const pA = calculateTeamPriority(a);
        const pB = calculateTeamPriority(b);
        if (pA !== pB) return pA - pB;
        return (typeof a.name === 'string' ? a.name : '').localeCompare(typeof b.name === 'string' ? b.name : '');
    });

    let allPlayers = players.filter((p) => ageGroupTeams.some((t) => t.id === p.team_id));
    allPlayers = allPlayers.map((p) => p.id === playerId ? { ...p, team_id: destTeamId } : p);

    const updates = [];
    let currentRank = 1;

    for (const team of ageGroupTeams) {
        let teamPlayers = allPlayers.filter((p) => p.team_id === team.id);
        
        if (team.id === destTeamId) {
            teamPlayers = teamPlayers.filter((p) => p.id !== playerId);
            teamPlayers.sort((a, b) => {
                const rankA = tryouts.find((t) => t.player_id === a.id)?.team_ranking || 9999;
                const rankB = tryouts.find((t) => t.player_id === b.id)?.team_ranking || 9999;
                return rankA - rankB;
            });
            const draggedPlayerObj = players.find((p) => p.id === playerId);
            if (draggedPlayerObj) {
                teamPlayers.splice(destination.index, 0, { ...draggedPlayerObj, team_id: destTeamId });
            }
        } else {
             teamPlayers.sort((a, b) => {
                const rankA = tryouts.find((t) => t.player_id === a.id)?.team_ranking || 9999;
                const rankB = tryouts.find((t) => t.player_id === b.id)?.team_ranking || 9999;
                return rankA - rankB;
            });
        }

        for (const p of teamPlayers) {
            const tryout = tryouts.find((t) => t.player_id === p.id);
            if (tryout?.team_ranking !== currentRank || !tryout) {
                updates.push({
                    tryoutId: tryout?.id,
                    playerId: p.id,
                    ranking: currentRank
                });
            }
            currentRank++;
        }
    }

    if (updates.length > 0) {
        await updateRankingMutation.mutateAsync(updates);
    }
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
            {teams
              ?.sort((a, b) => {
                  const pA = calculateTeamPriority(a);
                  const pB = calculateTeamPriority(b);
                  if (pA !== pB) return pA - pB;
                  return (typeof a.name === 'string' ? a.name : '').localeCompare(typeof b.name === 'string' ? b.name : '');
              })
              ?.map((team) => {
              const teamPlayers = getTeamPlayers(team);
              teamPlayers.sort((a, b) => (a.tryout?.team_ranking || 9999) - (b.tryout?.team_ranking || 9999));

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
                                         #{player.tryout?.team_ranking || '?'}
                                       </div>
                                       <div className="flex-1 min-w-0">
                                         <div className="font-bold text-slate-900 text-sm md:text-base truncate">{player.full_name}</div>
                                         <div className="text-xs md:text-sm text-slate-600 mt-0.5 flex gap-1 items-center truncate">
                                           <span>{player.primary_position}</span>
                                           {player.age_group && (
                                             <Badge className="bg-purple-100 text-purple-800 text-xs md:text-sm px-2 py-1 font-bold">{player.age_group}</Badge>
                                           )}
                                           {player.grad_year && (
                                             <Badge className="bg-slate-600 text-white text-[10px] px-1.5 py-0.5 font-bold">'{player.grad_year.toString().slice(-2)}</Badge>
                                           )}
                                           {player.date_of_birth && (
                                             <Badge className="bg-slate-400 text-white text-[10px] px-1.5 py-0.5 font-bold">{new Date(player.date_of_birth).getFullYear()}</Badge>
                                           )}
                                         </div>
                                         {(() => {
                                           const evaluation = evaluations.filter(e => e.player_id === player.id).sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
                                           const assessment = assessments.filter(a => a.player_id === player.id).sort((a, b) => new Date(b.assessment_date) - new Date(a.assessment_date))[0];
                                           if (evaluation || assessment) {
                                             return (
                                               <div className="flex gap-1 mt-1">
                                                 {evaluation && (
                                                   <div className="bg-blue-50 px-1.5 py-0.5 rounded text-[8px] text-blue-700 font-semibold">
                                                     Eval: {Math.round(((evaluation.growth_mindset || 0) + (evaluation.athleticism || 0) + (evaluation.attacking_organized || 0) + (evaluation.defending_organized || 0)) / 4)}
                                                   </div>
                                                 )}
                                                 {assessment && (
                                                   <div className="bg-emerald-50 px-1.5 py-0.5 rounded text-[8px] text-emerald-700 font-semibold">
                                                     Spd: {assessment.speed_score || 0} | Pwr: {assessment.power_score || 0}
                                                   </div>
                                                 )}
                                               </div>
                                             );
                                           }
                                           return null;
                                         })()}
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
                                       {player.tryout?.recommendation && (
                                         <Badge 
                                           className={`text-xs px-2 py-1 rounded-full font-bold ${
                                             player.tryout.recommendation === 'Move up' ? 'bg-emerald-500 text-white' :
                                             player.tryout.recommendation === 'Move down' ? 'bg-orange-500 text-white' :
                                             'bg-blue-500 text-white'
                                           }`}
                                         >
                                           {player.tryout.recommendation}
                                         </Badge>
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
            Tryouts Dashboard
          </h1>
          <p className="text-sm md:text-lg text-slate-600">Drag and drop players between teams • Filter and sort players</p>
        </div>

        <Card className="border-none shadow-xl mb-6 bg-gradient-to-br from-white via-slate-50 to-blue-50">
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 md:gap-4">
              <div>
                <label className="text-xs md:text-sm font-semibold text-slate-700 mb-2 block">Scope</label>
                <Select value={showAllPlayers ? 'all' : 'filtered'} onValueChange={(val) => setShowAllPlayers(val === 'all')}>
                  <SelectTrigger className="border-2 h-10 md:h-12 shadow-sm text-xs md:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="filtered">Filtered</SelectItem>
                    <SelectItem value="all">All Players</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                    <SelectItem value="NLC">NLC</SelectItem>
                    <SelectItem value="DPL">DPL</SelectItem>
                    <SelectItem value="MSPSP">MSPSP</SelectItem>
                    <SelectItem value="Directors Academy">Directors Academy</SelectItem>
                    <SelectItem value="MSDSL">MSDSL</SelectItem>
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
                <label className="text-xs md:text-sm font-semibold text-slate-700 mb-2 block">Birthday From</label>
                <input
                  type="date"
                  value={birthdayFrom}
                  onChange={(e) => setBirthdayFrom(e.target.value)}
                  className="w-full h-10 md:h-12 px-3 md:px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm text-xs md:text-sm" />
              </div>
              <div>
                <label className="text-xs md:text-sm font-semibold text-slate-700 mb-2 block">Birthday To</label>
                <input
                  type="date"
                  value={birthdayTo}
                  onChange={(e) => setBirthdayTo(e.target.value)}
                  className="w-full h-10 md:h-12 px-3 md:px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm text-xs md:text-sm" />
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
                <label className="text-xs md:text-sm font-semibold text-slate-700 mb-2 block">Trapped</label>
                <Select value={showTrappedOnly ? 'trapped' : 'all'} onValueChange={(val) => setShowTrappedOnly(val === 'trapped')}>
                  <SelectTrigger className="border-2 h-10 md:h-12 shadow-sm text-xs md:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="trapped">Trapped Only</SelectItem>
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
                    setBirthdayFrom('');
                    setBirthdayTo('');
                    setSelectedSeason('all');
                    setShowTrappedOnly(false);
                    setShowAllPlayers(false);
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

        <Tabs value="columns" className="text-slate-800 w-full">
          <TabsList className="mb-4 md:mb-6 grid grid-cols-1 w-full md:w-auto">
            <TabsTrigger value="columns" className="text-xs md:text-sm">Team View</TabsTrigger>
          </TabsList>

          <TabsContent value="columns">
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
          </TabsContent>

          <TabsContent value="cards">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {getAllPlayersWithTryout()?.map((player) => {
                const team = teams.find((t) => t.id === player.team_id);
                return (
                  <Card 
                    key={player.id} 
                    className="border-2 border-slate-200 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                    onClick={() => navigate(`${createPageUrl('PlayerDashboard')}?id=${player.id}`)}
                  >
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b-2 border-slate-200 pb-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-md">
                          {player.jersey_number || <User className="w-6 h-6 md:w-7 md:h-7" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base md:text-lg truncate">{player.full_name}</CardTitle>
                          <div className="text-sm text-slate-600 mt-1 flex gap-1 items-center flex-wrap">
                            <span>{team?.name} • {team?.age_group}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {player.age_group && (
                              <Badge className="bg-purple-100 text-purple-800 text-xs px-2 py-1 font-bold">{player.age_group}</Badge>
                            )}
                            {player.grad_year && (
                              <Badge className="bg-slate-600 text-white text-[10px] px-1.5 py-0.5 font-bold">'{player.grad_year.toString().slice(-2)}</Badge>
                            )}
                            {player.date_of_birth && (
                              <Badge className="bg-slate-400 text-white text-[10px] px-1.5 py-0.5 font-bold">{new Date(player.date_of_birth).getFullYear()}</Badge>
                            )}
                          </div>
                        </div>
                        {isTrappedPlayer(player.date_of_birth) &&
                        <Badge className="bg-red-500 text-white text-sm px-3 py-1 font-bold">
                            TRAPPED
                          </Badge>
                        }
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                       <div className="bg-blue-50 p-2 rounded">
                         <div className="text-slate-600">Position</div>
                         <div className="font-semibold text-slate-900 truncate">{player.primary_position || 'N/A'}</div>
                       </div>
                       <div className="bg-purple-50 p-2 rounded">
                         <div className="text-slate-600">Dominant Foot</div>
                         <Select 
                           value={player.tryout?.dominant_foot || ''} 
                           onValueChange={(value) => updateTryoutField.mutate({ playerId: player.id, field: 'dominant_foot', value })}
                         >
                           <SelectTrigger className="h-6 text-xs p-0 border-none bg-transparent font-semibold text-slate-900 focus:ring-0">
                             <SelectValue placeholder="N/A" />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="Left">Left</SelectItem>
                             <SelectItem value="Right">Right</SelectItem>
                             <SelectItem value="Both">Both</SelectItem>
                             <SelectItem value="Neither">Neither</SelectItem>
                           </SelectContent>
                         </Select>
                       </div>
                       <div className="bg-emerald-50 p-2 rounded">
                         <div className="text-slate-600">Team Role</div>
                         <div className="font-semibold text-slate-900 text-[10px] truncate">{player.tryout?.team_role || 'N/A'}</div>
                       </div>
                       <div className="bg-orange-50 p-2 rounded">
                         <div className="text-slate-600">Recommendation</div>
                         <div className="font-semibold text-slate-900 text-[10px] truncate">{player.tryout?.recommendation || 'N/A'}</div>
                       </div>
                      </div>
                      {(() => {
                       const evaluation = evaluations.filter(e => e.player_id === player.id).sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
                       const assessment = assessments.filter(a => a.player_id === player.id).sort((a, b) => new Date(b.assessment_date) - new Date(a.assessment_date))[0];
                       if (evaluation || assessment) {
                         return (
                           <div className="grid grid-cols-2 gap-2 mt-2">
                             {evaluation && (
                               <div className="bg-blue-50 p-2 rounded">
                                 <div className="text-slate-600 text-[10px]">Avg Evaluation</div>
                                 <div className="font-bold text-blue-700 text-sm">
                                   {Math.round(((evaluation.growth_mindset || 0) + (evaluation.athleticism || 0) + (evaluation.attacking_organized || 0) + (evaluation.defending_organized || 0)) / 4)}/10
                                 </div>
                               </div>
                             )}
                             {assessment && (
                               <div className="bg-emerald-50 p-2 rounded">
                                 <div className="text-slate-600 text-[10px]">Physical</div>
                                 <div className="font-bold text-emerald-700 text-[10px]">
                                   Spd:{assessment.speed_score || 0} Pwr:{assessment.power_score || 0}
                                 </div>
                               </div>
                             )}
                           </div>
                         );
                       }
                       return null;
                      })()}
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                      <div>
                        <Label className="text-xs text-slate-600">Primary Position</Label>
                        <Select
                          value={player.tryout?.primary_position || ''}
                          onValueChange={(value) => updateTryoutField.mutate({ playerId: player.id, field: 'primary_position', value })}>
                          <SelectTrigger className="h-9 mt-1 text-xs md:text-sm">
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GK">GK</SelectItem>
                            <SelectItem value="Right Outside Back">Right Outside Back</SelectItem>
                            <SelectItem value="Left Outside Back">Left Outside Back</SelectItem>
                            <SelectItem value="Right Centerback">Right Centerback</SelectItem>
                            <SelectItem value="Left Centerback">Left Centerback</SelectItem>
                            <SelectItem value="Defensive Midfielder">Defensive Midfielder</SelectItem>
                            <SelectItem value="Right Winger">Right Winger</SelectItem>
                            <SelectItem value="Center Midfielder">Center Midfielder</SelectItem>
                            <SelectItem value="Forward">Forward</SelectItem>
                            <SelectItem value="Attacking Midfielder">Attacking Midfielder</SelectItem>
                            <SelectItem value="Left Winger">Left Winger</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-slate-600">Team Role</Label>
                        <Select
                          value={player.tryout?.team_role || ''}
                          onValueChange={(value) => updateTryoutField.mutate({ playerId: player.id, field: 'team_role', value })}>
                          <SelectTrigger className="h-9 mt-1 text-xs md:text-sm">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Indispensable Player">Indispensable Player</SelectItem>
                            <SelectItem value="GA Starter">GA Starter</SelectItem>
                            <SelectItem value="GA Rotation">GA Rotation</SelectItem>
                            <SelectItem value="Aspire Starter">Aspire Starter</SelectItem>
                            <SelectItem value="Aspire Rotation">Aspire Rotation</SelectItem>
                            <SelectItem value="United Starter">United Starter</SelectItem>
                            <SelectItem value="United Rotation">United Rotation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-slate-600">Recommendation</Label>
                        <Select
                          value={player.tryout?.recommendation || ''}
                          onValueChange={(value) => updateTryoutField.mutate({ playerId: player.id, field: 'recommendation', value })}>
                          <SelectTrigger className="h-9 mt-1 text-xs md:text-sm">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Move up">🔼 Move up</SelectItem>
                            <SelectItem value="Keep">✅ Keep</SelectItem>
                            <SelectItem value="Move down">🔽 Move down</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-slate-600">Next Year's Team</Label>
                        <Input
                          value={player.tryout?.next_year_team || ''}
                          onChange={(e) => updateTryoutField.mutate({ playerId: player.id, field: 'next_year_team', value: e.target.value })}
                          className="h-9 mt-1 text-xs md:text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-600">Next Season Status</Label>
                        <Select
                          value={player.tryout?.next_season_status || 'N/A'}
                          onValueChange={(value) => updateTryoutField.mutate({ playerId: player.id, field: 'next_season_status', value })}>
                          <SelectTrigger className="h-9 mt-1 text-xs md:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="N/A">N/A</SelectItem>
                            <SelectItem value="Accepted Offer">✅ Accepted Offer</SelectItem>
                            <SelectItem value="Rejected Offer">❌ Rejected Offer</SelectItem>
                            <SelectItem value="Considering Offer">🤔 Considering Offer</SelectItem>
                            <SelectItem value="Not Offered">⏳ Not Offered</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-slate-600">Registration Status</Label>
                        <Select
                          value={player.tryout?.registration_status || 'Not Signed'}
                          onValueChange={(value) => updateTryoutField.mutate({ playerId: player.id, field: 'registration_status', value })}>
                          <SelectTrigger className="h-9 mt-1 text-xs md:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Not Signed">⏳ Not Signed</SelectItem>
                            <SelectItem value="Signed and Paid">✅ Signed and Paid</SelectItem>
                            <SelectItem value="Signed">📝 Signed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="formation">
            <Card className="border-none shadow-lg mb-6">
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Select Team to View Formation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {teams?.filter(team => team.name && typeof team.name === 'string')?.map((team) =>
                  <button
                    key={team.id}
                    onClick={() => navigate(`${createPageUrl('FormationView')}?teamId=${team.id}`)}
                    className="p-3 md:p-4 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl border-2 border-slate-200 hover:border-emerald-500 transition-all hover:shadow-lg">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold shadow-md text-sm md:text-base">
                          {team.age_group || (team.name && typeof team.name === 'string' ? team.name.charAt(0) : '?')}
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <div className="font-bold text-slate-900 text-sm md:text-base truncate">{team.name}</div>
                          <div className="text-xs md:text-sm text-slate-600 truncate">{team.age_group}</div>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

    </DragDropContext>
  );
}