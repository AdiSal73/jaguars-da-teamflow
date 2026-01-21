import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext } from '@hello-pangea/dnd';
import { RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import PlayerSearchPanel from '@/components/tryout/PlayerSearchPanel';
import TeamColumn from '@/components/tryout/TeamColumn';

export default function Tryouts() {
  const queryClient = useQueryClient();
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all');
  const [selectedCoach, setSelectedCoach] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
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

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const updatePlayerTeamMutation = useMutation({
    mutationFn: async ({ playerId, teamId }) => {
      await base44.entities.Player.update(playerId, { team_id: teamId });
      await base44.functions.invoke('updatePlayerRankings', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['players']);
      queryClient.invalidateQueries(['tryouts']);
    }
  });

  const getPlayerTryoutData = useCallback((player) => {
    const tryout = tryouts.find((t) => t.player_id === player.id);
    return { ...player, tryout };
  }, [tryouts]);

  const sortTeamsByAge = (teamList) => {
    return [...teamList].sort((a, b) => {
      const extractAge = (ageGroup) => {
        const match = ageGroup?.match(/U-?(\d+)/i);
        return match ? parseInt(match[1]) : 0;
      };
      return extractAge(b.age_group) - extractAge(a.age_group);
    });
  };

  const teamColumns = useMemo(() => {
    let filtered = teams.filter(t => t.name && typeof t.name === 'string');

    if (selectedGender !== 'all') {
      filtered = filtered.filter(t => t.gender === selectedGender);
    }
    if (selectedAgeGroup !== 'all') {
      filtered = filtered.filter(t => t.age_group === selectedAgeGroup);
    }
    if (selectedCoach !== 'all') {
      filtered = filtered.filter(t => t.coach_ids?.includes(selectedCoach));
    }
    if (selectedSeason !== 'all') {
      filtered = filtered.filter(t => {
        const teamSeason = t.season || (t.name?.includes('26/27') ? '26/27' : t.name?.includes('25/26') ? '25/26' : null);
        return teamSeason === selectedSeason;
      });
    }

    const gaTeams = sortTeamsByAge(filtered.filter(t => t.league === 'Girls Academy'));
    const aspireTeams = sortTeamsByAge(filtered.filter(t => t.league === 'Aspire'));
    const otherTeams = sortTeamsByAge(filtered.filter(t => t.league !== 'Girls Academy' && t.league !== 'Aspire'));

    return {
      girlsAcademy: gaTeams,
      aspire: aspireTeams,
      other: otherTeams
    };
  }, [teams, selectedAgeGroup, selectedCoach, selectedGender, selectedSeason]);

  const getTeamPlayers = useCallback((team) => {
    const teamPlayers = players.filter(p => p.team_id === team.id);
    const playersWithTryout = teamPlayers.map(p => getPlayerTryoutData(p));
    
    return playersWithTryout.sort((a, b) => {
      const rankA = a.tryout?.age_group_ranking || 999;
      const rankB = b.tryout?.age_group_ranking || 999;
      if (rankA !== rankB) return rankA - rankB;
      
      const lastNameA = a.full_name?.split(' ').pop() || '';
      const lastNameB = b.full_name?.split(' ').pop() || '';
      return lastNameA.localeCompare(lastNameB);
    });
  }, [players, getPlayerTryoutData]);

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    const playerId = draggableId.replace('player-', '');
    const destTeamId = destination.droppableId.replace('team-', '');

    queryClient.setQueryData(['players'], (old) => {
      return old?.map(p => 
        p.id === playerId ? { ...p, team_id: destTeamId } : p
      ) || old;
    });

    try {
      await updatePlayerTeamMutation.mutateAsync({ playerId, teamId: destTeamId });
    } catch (error) {
      console.error('Failed to update player team:', error);
      queryClient.invalidateQueries(['players']);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="p-4 md:p-6 lg:p-8 max-w-[1900px] mx-auto">
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Tryouts Board
          </h1>
          <p className="text-sm md:text-base lg:text-lg text-slate-600">Drag-and-drop team management with automatic rankings</p>
        </div>

        <div className="mb-4">
          <PlayerSearchPanel 
            players={players}
            teams={teams}
            getPlayerTryoutData={getPlayerTryoutData}
          />
        </div>

        <Card className="border-none shadow-xl mb-4 md:mb-6 bg-gradient-to-br from-white via-slate-50 to-blue-50">
          <CardContent className="p-3 md:p-4 lg:p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3 lg:gap-4">
              <div>
                <label className="text-xs md:text-sm font-semibold text-slate-700 mb-1 md:mb-2 block">Gender</label>
                <Select value={selectedGender} onValueChange={setSelectedGender}>
                  <SelectTrigger className="border-2 h-9 md:h-10 lg:h-12 shadow-sm text-xs md:text-sm">
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
                <label className="text-xs md:text-sm font-semibold text-slate-700 mb-1 md:mb-2 block">Age Group</label>
                <Select value={selectedAgeGroup} onValueChange={setSelectedAgeGroup}>
                  <SelectTrigger className="border-2 h-9 md:h-10 lg:h-12 shadow-sm text-xs md:text-sm">
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
                <label className="text-xs md:text-sm font-semibold text-slate-700 mb-1 md:mb-2 block">Coach</label>
                <Select value={selectedCoach} onValueChange={setSelectedCoach}>
                  <SelectTrigger className="border-2 h-9 md:h-10 lg:h-12 shadow-sm text-xs md:text-sm">
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
                <label className="text-xs md:text-sm font-semibold text-slate-700 mb-1 md:mb-2 block">Season</label>
                <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                  <SelectTrigger className="border-2 h-9 md:h-10 lg:h-12 shadow-sm text-xs md:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Seasons</SelectItem>
                    {[...new Set(teams.map(t => t.season || (t.name?.includes('26/27') ? '26/27' : t.name?.includes('25/26') ? '25/26' : null)).filter(Boolean))].sort().reverse().map(season => (
                      <SelectItem key={season} value={season}>{season}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs md:text-sm font-semibold text-slate-700 mb-1 md:mb-2 block">&nbsp;</label>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedAgeGroup('all');
                    setSelectedCoach('all');
                    setSelectedGender('all');
                    setSelectedSeason('all');
                  }}
                  className="w-full h-9 md:h-10 lg:h-12 text-xs md:text-sm"
                >
                  <RotateCcw className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Girls Academy Column */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-emerald-500 p-4">
            <h2 className="text-xl font-bold text-emerald-700 mb-4 sticky top-0 bg-white pb-2 border-b-2 border-emerald-200">
              Girls Academy Teams
            </h2>
            <div className="space-y-3">
              {teamColumns.girlsAcademy.map(team => (
                <TeamColumn 
                  key={team.id} 
                  team={team} 
                  players={getTeamPlayers(team)}
                />
              ))}
            </div>
          </div>

          {/* Aspire Column */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-blue-500 p-4">
            <h2 className="text-xl font-bold text-blue-700 mb-4 sticky top-0 bg-white pb-2 border-b-2 border-blue-200">
              Girls Aspire Teams
            </h2>
            <div className="space-y-3">
              {teamColumns.aspire.map(team => (
                <TeamColumn 
                  key={team.id} 
                  team={team} 
                  players={getTeamPlayers(team)}
                />
              ))}
            </div>
          </div>

          {/* Other Teams Column */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-slate-500 p-4">
            <h2 className="text-xl font-bold text-slate-700 mb-4 sticky top-0 bg-white pb-2 border-b-2 border-slate-200">
              All Other Teams
            </h2>
            <div className="space-y-3">
              {teamColumns.other.map(team => (
                <TeamColumn 
                  key={team.id} 
                  team={team} 
                  players={getTeamPlayers(team)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </DragDropContext>
  );
}