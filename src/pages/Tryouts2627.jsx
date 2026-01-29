import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext } from '@hello-pangea/dnd';
import { RotateCcw, Upload, AlertCircle, CheckCircle2, X, Trash2, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import PlayerSearchPanel from '@/components/tryout/PlayerSearchPanel';
import TeamColumn from '@/components/tryout/TeamColumn';
import ResetTeamsDialog from '@/components/admin/ResetTeamsDialog';
import { toast } from 'sonner';

export default function Tryouts2627() {
  const queryClient = useQueryClient();
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all');
  const [selectedCoach, setSelectedCoach] = useState('all');
  const [selectedBirthYear, setSelectedBirthYear] = useState('all');
  const [selectedGradYear, setSelectedGradYear] = useState('all');
  const [selectedTryoutStatus, setSelectedTryoutStatus] = useState('all');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importProgress, setImportProgress] = useState(null);
  const [showResetDialog, setShowResetDialog] = useState(false);

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
    let filtered = teams.filter(t => {
      if (!t.name || typeof t.name !== 'string') return false;
      const teamSeason = t.season || (t.name?.includes('26/27') ? '26/27' : null);
      return teamSeason === '26/27';
    });

    if (selectedAgeGroup !== 'all') {
      filtered = filtered.filter(t => t.age_group === selectedAgeGroup);
    }
    if (selectedCoach !== 'all') {
      filtered = filtered.filter(t => t.coach_ids?.includes(selectedCoach));
    }

    const gaTeams = sortTeamsByAge(filtered.filter(t => {
      const name = t.name?.toLowerCase() || '';
      const isAspire = name.includes('aspire') || name.includes('pre-ga 2');
      return (t.league === 'Girls Academy' || name.includes('pre-ga 1')) && !isAspire;
    }));
    
    const aspireTeams = sortTeamsByAge(filtered.filter(t => {
      const name = t.name?.toLowerCase() || '';
      return t.league === 'Aspire' || name.includes('aspire') || name.includes('pre-ga 2');
    }));
    
    const otherTeams = filtered.filter(t => 
      t.league !== 'Girls Academy' && 
      t.league !== 'Aspire' && 
      !t.name?.toLowerCase().includes('pre-ga 1') &&
      !t.name?.toLowerCase().includes('pre-ga 2') &&
      !t.name?.toLowerCase().includes('aspire')
    );

    const sortedOtherTeams = otherTeams.sort((a, b) => {
      const leagueOrder = { 'DPL': 1, 'Green': 2, 'White': 3, 'Black': 4 };
      const getOrder = (team) => {
        const league = team.league || '';
        return leagueOrder[league] || 999;
      };
      
      const orderDiff = getOrder(a) - getOrder(b);
      if (orderDiff !== 0) return orderDiff;
      
      const extractAge = (ageGroup) => {
        const match = ageGroup?.match(/U-?(\d+)/i);
        return match ? parseInt(match[1]) : 0;
      };
      return extractAge(b.age_group) - extractAge(a.age_group);
    });

    return {
      girlsAcademy: gaTeams,
      aspire: aspireTeams,
      other: sortedOtherTeams
    };
    }, [teams, selectedAgeGroup, selectedCoach]);

  const getTeamPlayers = useCallback((team) => {
    const teamPlayers = players.filter(p => p.team_id === team.id);
    const playersWithTryout = teamPlayers.map(p => getPlayerTryoutData(p));
    
    let filteredPlayers = playersWithTryout;

    if (selectedBirthYear !== 'all') {
      filteredPlayers = filteredPlayers.filter(p => {
        const birthYear = p.date_of_birth ? new Date(p.date_of_birth).getFullYear() : null;
        return birthYear === parseInt(selectedBirthYear);
      });
    }

    if (selectedGradYear !== 'all') {
      filteredPlayers = filteredPlayers.filter(p => p.grad_year === parseInt(selectedGradYear));
    }

    if (selectedTryoutStatus !== 'all') {
      filteredPlayers = filteredPlayers.filter(p => p.tryout?.next_season_status === selectedTryoutStatus);
    }

    return filteredPlayers.sort((a, b) => {
      const rankA = a.tryout?.age_group_ranking || 999;
      const rankB = b.tryout?.age_group_ranking || 999;
      if (rankA !== rankB) return rankA - rankB;

      const lastNameA = a.full_name?.split(' ').pop() || '';
      const lastNameB = b.full_name?.split(' ').pop() || '';
      return lastNameA.localeCompare(lastNameB);
    });
    }, [players, getPlayerTryoutData, selectedBirthYear, selectedGradYear, selectedTryoutStatus]);

  const recalculateAllRankings = async () => {
    const ageGroupsInOrder = ['U19', 'U18', 'U17', 'U16', 'U15', 'U14', 'U13', 'U12', 'U11'];
    const leagueOrder = { 
      'Girls Academy': 1, 
      'Pre-GA 1': 2, 
      'Aspire': 3, 
      'Pre-GA 2': 4, 
      'DPL': 5, 
      'Green': 6, 
      'White': 7, 
      'Black': 8 
    };

    for (const ageGroup of ageGroupsInOrder) {
      const allPlayersInAge = players.filter(p => p.age_group === ageGroup && p.current_26_27_team);
      
      const playersWithTeamData = allPlayersInAge.map(p => {
        const team = teams.find(t => t.id === p.current_26_27_team);
        if (!team) return null;
        
        const teamSeason = team.season || (team.name?.includes('26/27') ? '26/27' : null);
        if (teamSeason !== '26/27') return null;

        let determinedLeague = team.league;
        const teamNameLower = team.name?.toLowerCase() || '';
        
        if (teamNameLower.includes('pre-ga 1')) {
          determinedLeague = 'Pre-GA 1';
        } else if (teamNameLower.includes('pre-ga 2')) {
          determinedLeague = 'Pre-GA 2';
        } else if (teamNameLower.includes('girls academy')) {
          determinedLeague = 'Girls Academy';
        } else if (teamNameLower.includes('aspire')) {
          determinedLeague = 'Aspire';
        }

        const tryout = tryouts.find(t => t.player_id === p.id);
        
        return {
          player: p,
          team,
          league: determinedLeague,
          teamRanking: tryout?.team_ranking || 999,
          lastName: p.full_name?.split(' ').pop() || ''
        };
      }).filter(Boolean);

      playersWithTeamData.sort((a, b) => {
        const leagueA = leagueOrder[a.league] || 999;
        const leagueB = leagueOrder[b.league] || 999;
        if (leagueA !== leagueB) return leagueA - leagueB;
        
        if (a.teamRanking !== b.teamRanking) return a.teamRanking - b.teamRanking;
        
        return a.lastName.localeCompare(b.lastName);
      });

      for (let i = 0; i < playersWithTeamData.length; i++) {
        const { player } = playersWithTeamData[i];
        const existingTryout = tryouts.find(t => t.player_id === player.id);
        const ranking = i < 300 ? i + 1 : null;
        
        try {
          if (existingTryout) {
            await base44.entities.PlayerTryout.update(existingTryout.id, {
              age_group_ranking: ranking
            });
          } else if (ranking !== null) {
            await base44.entities.PlayerTryout.create({
              player_id: player.id,
              age_group_ranking: ranking
            });
          }
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (error) {
          console.error(`Failed to update ranking for player ${player.id}:`, error);
        }
      }
    }

    queryClient.invalidateQueries(['tryouts']);
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const playerId = draggableId.replace('player-', '');
    const sourceTeamId = source.droppableId.replace('team-', '');
    const destTeamId = destination.droppableId.replace('team-', '');

    // Moving to a different team
    if (sourceTeamId !== destTeamId) {
      queryClient.setQueryData(['players'], (old) => {
        return old?.map(p => 
          p.id === playerId ? { ...p, team_id: destTeamId } : p
        ) || old;
      });

      try {
        await updatePlayerTeamMutation.mutateAsync({ playerId, teamId: destTeamId });
        
        await recalculateAllRankings();
        
        toast.success('Player moved successfully');
      } catch (error) {
        console.error('Failed to update player team:', error);
        toast.error('Failed to move player');
        queryClient.invalidateQueries(['players']);
      }
    } else {
      // Reordering within the same team
      const team = teams.find(t => t.id === sourceTeamId);
      const teamPlayers = getTeamPlayers(team);
      
      const reorderedPlayers = Array.from(teamPlayers);
      const [movedPlayer] = reorderedPlayers.splice(source.index, 1);
      reorderedPlayers.splice(destination.index, 0, movedPlayer);

      // Optimistically update UI
      queryClient.setQueryData(['tryouts'], (old) => {
        return old?.map(tryout => {
          const playerIndex = reorderedPlayers.findIndex(p => p.id === tryout.player_id);
          if (playerIndex !== -1) {
            return { ...tryout, age_group_ranking: playerIndex + 1 };
          }
          return tryout;
        }) || old;
      });

      try {
        await recalculateAllRankings();
        toast.success('Rankings updated');
      } catch (error) {
        console.error('Failed to update rankings:', error);
        toast.error('Failed to update ranking');
        queryClient.invalidateQueries(['tryouts']);
      }
    }
  };

  const retryFailedImports = async () => {
    if (!importProgress?.errors || importProgress.errors.length === 0) {
      toast.error('No failed imports to retry');
      return;
    }

    const failedRows = importProgress.failedRows || [];
    if (failedRows.length === 0) {
      toast.error('No row data available for retry');
      return;
    }

    setImportProgress(prev => ({
      ...prev,
      total: failedRows.length,
      processed: 0,
      errors: [],
      logs: [...prev.logs, { type: 'info', message: `🔄 Retrying ${failedRows.length} failed imports...` }]
    }));

    const createdTeams = {};
    for (const teamName of [...new Set(failedRows.map(r => r.newTeam).filter(Boolean))]) {
      const existingTeam = teams.find(t => t.name === teamName);
      if (existingTeam) {
        createdTeams[teamName] = existingTeam.id;
      }
    }

    for (let i = 0; i < failedRows.length; i++) {
      const row = failedRows[i];
      try {
        const fullName = `${row.firstName} ${row.lastName}`.trim();
        if (!fullName || fullName.length < 2) continue;
        
        const teamId = createdTeams[row.newTeam];
        if (!teamId) throw new Error(`Team "${row.newTeam}" not found`);

        const team2526Id = row.team2526 ? createdTeams[row.team2526] : null;

        const existingPlayer = players.find(p => {
          const nameMatch = p.full_name?.toLowerCase() === fullName.toLowerCase();
          const birthdateMatch = row.birthdate && p.date_of_birth === row.birthdate;
          return nameMatch || birthdateMatch;
        });

        if (existingPlayer) {
          const updateData = { 
            current_26_27_team: teamId,
            team_id: teamId
          };
          if (team2526Id) updateData.current_25_26_team = team2526Id;
          if (row.gradYear && !existingPlayer.grad_year) updateData.grad_year = parseInt(row.gradYear);
          if (row.birthdate && !existingPlayer.date_of_birth) updateData.date_of_birth = row.birthdate;
          if (row.position && !existingPlayer.primary_position) updateData.primary_position = row.position;
          
          if (row.comments) {
            const commentLog = existingPlayer.comment_log || [];
            commentLog.push({
              comment: row.comments,
              created_date: new Date().toISOString(),
              created_by: 'CSV Retry'
            });
            updateData.comment_log = commentLog;
            updateData.comment = row.comments;
          }
          
          await base44.entities.Player.update(existingPlayer.id, updateData);
          
          setImportProgress(prev => ({
            ...prev,
            matched: prev.matched + 1,
            processed: prev.processed + 1,
            logs: [...prev.logs, { type: 'success', message: `✅ Matched "${fullName}" to ${row.newTeam}` }]
          }));
        } else {
          const gradYearNum = row.gradYear ? parseInt(row.gradYear) : undefined;
          const newPlayerData = {
            full_name: fullName,
            date_of_birth: row.birthdate || undefined,
            grad_year: gradYearNum,
            primary_position: row.position || undefined,
            current_25_26_team: team2526Id || undefined,
            current_26_27_team: teamId,
            team_id: teamId,
            gender: 'Female',
            is_tryout_player: true
          };
          
          if (row.comments) {
            newPlayerData.comment = row.comments;
            newPlayerData.comment_log = [{
              comment: row.comments,
              created_date: new Date().toISOString(),
              created_by: 'CSV Retry'
            }];
          }
          
          await base44.entities.Player.create(newPlayerData);

          setImportProgress(prev => ({
            ...prev,
            processed: prev.processed + 1,
            logs: [...prev.logs, { type: 'info', message: `✅ Created "${fullName}" in ${row.newTeam}` }]
          }));
        }
        
        await new Promise(resolve => setTimeout(resolve, 250));
      } catch (error) {
        setImportProgress(prev => ({
          ...prev,
          processed: prev.processed + 1,
          errors: [...prev.errors, `${row.firstName} ${row.lastName}: ${error.message}`],
          logs: [...prev.logs, { type: 'error', message: `❌ ${row.firstName} ${row.lastName}: ${error.message}` }]
        }));
      }
    }

    queryClient.invalidateQueries(['teams']);
    queryClient.invalidateQueries(['players']);
    
    setImportProgress(prev => ({
      ...prev,
      logs: [...prev.logs, { type: 'success', message: `✅ Retry complete! ${prev.errors.length} remaining errors` }]
    }));

    toast.success('Retry completed');
  };

  const parsePositionFromNumber = (positionValue) => {
    const positionMap = {
      '1': 'GK',
      '2': 'Right Outside Back',
      '3': 'Left Outside Back',
      '4': 'Right Centerback',
      '5': 'Left Centerback',
      '6': 'Defensive Midfielder',
      '7': 'Right Winger',
      '8': 'Center Midfielder',
      '9': 'Forward',
      '10': 'Attacking Midfielder',
      '11': 'Left Winger'
    };
    
    const trimmed = positionValue?.trim();
    return positionMap[trimmed] || positionValue;
  };

  const handleCSVImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csv = event.target.result;
        const lines = csv.split('\n');
        const headers = lines[0].split(/[,\t]/).map(h => h.trim());

        const rows = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const values = lines[i].split(/[,\t]/).map(v => v.trim());
          if (values.length < 8) continue;

          const firstName = values[0];
          const lastName = values[1];
          const fullName = `${firstName} ${lastName}`.trim();
          
          if (!fullName || fullName.length < 2) continue;

          rows.push({
            firstName,
            lastName,
            team2526: values[2] || '',
            position: parsePositionFromNumber(values[3]) || '',
            gradYear: values[4] || '',
            birthdate: values[5] || '',
            comments: values[6] || '',
            newTeam: values[7] || ''
          });
        }

        setImportProgress({
          total: rows.length,
          processed: 0,
          created: 0,
          matched: 0,
          errors: [],
          logs: [],
          failedRows: []
        });
        setShowImportDialog(true);

        const blankPlayers = players.filter(p => !p.full_name || p.full_name.trim().length < 2);
        if (blankPlayers.length > 0) {
          setImportProgress(prev => ({
            ...prev,
            logs: [...prev.logs, { type: 'info', message: `🗑️ Deleting ${blankPlayers.length} players with blank names...` }]
          }));
          
          for (const player of blankPlayers) {
            try {
              await base44.entities.Player.delete(player.id);
              await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
              console.error('Failed to delete blank player:', error);
            }
          }
          
          setImportProgress(prev => ({
            ...prev,
            logs: [...prev.logs, { type: 'success', message: `✅ Deleted ${blankPlayers.length} blank players` }]
          }));
        }

        const allUniqueTeams = [...new Set([
          ...rows.map(r => r.newTeam).filter(Boolean),
          ...rows.map(r => r.team2526).filter(Boolean)
        ])];
        const createdTeams = {};
        
        for (const teamName of allUniqueTeams) {
          try {
            const existingTeam = teams.find(t => t.name === teamName);
            if (existingTeam) {
              createdTeams[teamName] = existingTeam.id;
              setImportProgress(prev => ({
                ...prev,
                logs: [...prev.logs, { type: 'info', message: `ℹ️ Team "${teamName}" already exists` }]
              }));
            } else {
              const ageMatch = teamName.match(/U-?(\d+)/i);
              const ageGroup = ageMatch ? `U${ageMatch[1]}` : 'U15';
              
              const gender = 'Female';
              let determinedLeague = 'Green';
              if (teamName.toUpperCase().includes('PRE-GA 1')) determinedLeague = 'Pre-GA 1';
              else if (teamName.toUpperCase().includes('PRE-GA 2')) determinedLeague = 'Pre-GA 2';
              else if (teamName.toUpperCase().includes('GIRLS ACADEMY')) determinedLeague = 'Girls Academy';
              else if (teamName.toUpperCase().includes('ASPIRE')) determinedLeague = 'Aspire';
              else if (teamName.toUpperCase().includes('WHITE')) determinedLeague = 'White';
              else if (teamName.toUpperCase().includes('BLACK')) determinedLeague = 'Black';

              const is2526TeamOnly = rows.every(r => r.newTeam !== teamName) && rows.some(r => r.team2526 === teamName);
              const teamSeason = is2526TeamOnly ? '25/26' : '26/27';

              const newTeam = await base44.entities.Team.create({
                name: teamName,
                age_group: ageGroup,
                gender: gender,
                league: determinedLeague,
                season: teamSeason
              });

              createdTeams[teamName] = newTeam.id;
              setImportProgress(prev => ({
                ...prev,
                created: prev.created + 1,
                logs: [...prev.logs, { type: 'success', message: `✅ Created team "${teamName}"` }]
              }));
              
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          } catch (error) {
            setImportProgress(prev => ({
              ...prev,
              errors: [...prev.errors, `Failed to create team "${teamName}": ${error.message}`],
              logs: [...prev.logs, { type: 'error', message: `❌ Failed to create team "${teamName}": ${error.message}` }]
            }));
          }
        }

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
            try {
              const fullName = `${row.firstName} ${row.lastName}`.trim();
              
              if (!fullName || fullName.length < 2) {
                setImportProgress(prev => ({
                  ...prev,
                  processed: prev.processed + 1,
                  logs: [...prev.logs, { type: 'error', message: `⚠️ Skipped row with blank name` }]
                }));
                continue;
              }
              
              const teamId = createdTeams[row.newTeam];

              if (!teamId) {
                throw new Error(`Team "${row.newTeam}" not found`);
              }

              const team2526Id = row.team2526 ? createdTeams[row.team2526] : null;

              const existingPlayer = players.find(p => {
                const nameMatch = p.full_name?.toLowerCase() === fullName.toLowerCase();
                const birthdateMatch = row.birthdate && p.date_of_birth === row.birthdate;
                return nameMatch || birthdateMatch;
              });

              if (existingPlayer) {
                const updateData = { 
                  current_26_27_team: teamId,
                  team_id: teamId
                };
                
                if (team2526Id) {
                  updateData.current_25_26_team = team2526Id;
                  setImportProgress(prev => ({
                    ...prev,
                    logs: [...prev.logs, { type: 'info', message: `🔗 Assigned "${fullName}" to 25/26 team: ${row.team2526}` }]
                  }));
                } else if (row.team2526) {
                  setImportProgress(prev => ({
                    ...prev,
                    logs: [...prev.logs, { type: 'warn', message: `⚠️ Could not assign "${fullName}" to 25/26 team: Team "${row.team2526}" not found` }]
                  }));
                }
                if (row.gradYear && !existingPlayer.grad_year) {
                  updateData.grad_year = parseInt(row.gradYear);
                }
                if (row.birthdate && !existingPlayer.date_of_birth) {
                  updateData.date_of_birth = row.birthdate;
                }
                if (row.position && !existingPlayer.primary_position) {
                  updateData.primary_position = row.position;
                }
                
                if (row.comments) {
                  const commentLog = existingPlayer.comment_log || [];
                  commentLog.push({
                    comment: row.comments,
                    created_date: new Date().toISOString(),
                    created_by: 'CSV Import'
                  });
                  updateData.comment_log = commentLog;
                  updateData.comment = row.comments;
                }
                
                await base44.entities.Player.update(existingPlayer.id, updateData);
                
                setImportProgress(prev => ({
                  ...prev,
                  matched: prev.matched + 1,
                  processed: prev.processed + 1,
                  logs: [...prev.logs, { type: 'success', message: `✅ Matched "${fullName}" to ${row.newTeam}` }]
                }));
                
                await new Promise(resolve => setTimeout(resolve, 200));
              } else {
                const gradYearNum = row.gradYear ? parseInt(row.gradYear) : undefined;
                const newPlayerData = {
                  full_name: fullName,
                  date_of_birth: row.birthdate || undefined,
                  grad_year: gradYearNum,
                  primary_position: row.position || undefined,
                  current_25_26_team: team2526Id || undefined,
                  current_26_27_team: teamId,
                  team_id: teamId,
                  gender: 'Female',
                  is_tryout_player: true
                };
                
                if (team2526Id) {
                  setImportProgress(prev => ({
                    ...prev,
                    logs: [...prev.logs, { type: 'info', message: `🔗 Assigned "${fullName}" to 25/26 team: ${row.team2526}` }]
                  }));
                } else if (row.team2526) {
                  setImportProgress(prev => ({
                    ...prev,
                    logs: [...prev.logs, { type: 'warn', message: `⚠️ Could not assign "${fullName}" to 25/26 team: Team "${row.team2526}" not found` }]
                  }));
                }
                
                if (row.comments) {
                  newPlayerData.comment = row.comments;
                  newPlayerData.comment_log = [{
                    comment: row.comments,
                    created_date: new Date().toISOString(),
                    created_by: 'CSV Import'
                  }];
                }
                
                await base44.entities.Player.create(newPlayerData);

                setImportProgress(prev => ({
                  ...prev,
                  processed: prev.processed + 1,
                  logs: [...prev.logs, { type: 'info', message: `✅ Created new player "${fullName}" in ${row.newTeam}` }]
                }));
                
                await new Promise(resolve => setTimeout(resolve, 200));
              }
            } catch (error) {
              setImportProgress(prev => ({
                ...prev,
                processed: prev.processed + 1,
                errors: [...prev.errors, `${row.firstName} ${row.lastName}: ${error.message}`],
                failedRows: [...prev.failedRows, row],
                logs: [...prev.logs, { type: 'error', message: `❌ ${row.firstName} ${row.lastName}: ${error.message}` }]
              }));
            }
            
          await new Promise(resolve => setTimeout(resolve, 250));
        }

        queryClient.invalidateQueries(['teams']);
        queryClient.invalidateQueries(['players']);
        
        setImportProgress(prev => ({
          ...prev,
          logs: [...prev.logs, { type: 'success', message: `✅ Import complete! Created ${prev.created} teams, matched ${prev.matched} players` }]
        }));

        toast.success('CSV import completed');
      } catch (error) {
        toast.error(`Import failed: ${error.message}`);
        setImportProgress(null);
        setShowImportDialog(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="p-4 md:p-6 lg:p-8 max-w-[1900px] mx-auto">
        <div className="mb-4 md:mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-2 bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              2026-27 Tryouts Board
            </h1>
            <p className="text-sm md:text-base lg:text-lg text-slate-600">Manage 26/27 season teams and player assignments</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={async () => {
                toast.info('Recalculating rankings...');
                await recalculateAllRankings();
                toast.success('Rankings recalculated!');
              }}
              variant="outline"
              className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Recalculate Rankings
            </Button>
            <Button
              onClick={() => setShowResetDialog(true)}
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Reset for 26/27
            </Button>
            <Button
              onClick={() => document.getElementById('csv-import').click()}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
          </div>
          <input
            id="csv-import"
            type="file"
            accept=".csv"
            onChange={handleCSVImport}
            className="hidden"
          />
        </div>

        <div className="mb-4">
          <PlayerSearchPanel 
            players={players}
            teams={teams.filter(t => {
              const teamSeason = t.season || (t.name?.includes('26/27') ? '26/27' : null);
              return teamSeason === '26/27';
            })}
            getPlayerTryoutData={getPlayerTryoutData}
          />
        </div>

        <Card className="border-none shadow-xl mb-4 md:mb-6 bg-gradient-to-br from-white via-slate-50 to-emerald-50">
          <CardContent className="p-3 md:p-4 lg:p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3 lg:gap-4">
              <div>
                <label className="text-xs md:text-sm font-semibold text-slate-700 mb-1 md:mb-2 block">Age Group</label>
                <Select value={selectedAgeGroup} onValueChange={setSelectedAgeGroup}>
                  <SelectTrigger className="border-2 h-9 md:h-10 lg:h-12 shadow-sm text-xs md:text-sm">
                    <SelectValue placeholder="All Age Groups" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Age Groups</SelectItem>
                    {[...new Set(teams.filter(t => {
                      const teamSeason = t.season || (t.name?.includes('26/27') ? '26/27' : null);
                      return teamSeason === '26/27';
                    }).map(t => t.age_group).filter(Boolean))].sort((a, b) => {
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
                <label className="text-xs md:text-sm font-semibold text-slate-700 mb-1 md:mb-2 block">Birth Year</label>
                <Select value={selectedBirthYear} onValueChange={setSelectedBirthYear}>
                  <SelectTrigger className="border-2 h-9 md:h-10 lg:h-12 shadow-sm text-xs md:text-sm">
                    <SelectValue placeholder="All Years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {[...new Set(players.filter(p => p.date_of_birth).map(p => new Date(p.date_of_birth).getFullYear()))].sort((a, b) => b - a).map(year => (
                      <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs md:text-sm font-semibold text-slate-700 mb-1 md:mb-2 block">Grad Year</label>
                <Select value={selectedGradYear} onValueChange={setSelectedGradYear}>
                  <SelectTrigger className="border-2 h-9 md:h-10 lg:h-12 shadow-sm text-xs md:text-sm">
                    <SelectValue placeholder="All Years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {[...new Set(players.filter(p => p.grad_year).map(p => p.grad_year))].sort((a, b) => a - b).map(year => (
                      <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs md:text-sm font-semibold text-slate-700 mb-1 md:mb-2 block">Tryout Status</label>
                <Select value={selectedTryoutStatus} onValueChange={setSelectedTryoutStatus}>
                  <SelectTrigger className="border-2 h-9 md:h-10 lg:h-12 shadow-sm text-xs md:text-sm">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="N/A">N/A</SelectItem>
                    <SelectItem value="Offer Sent">Offer Sent</SelectItem>
                    <SelectItem value="Accepted Offer">Accepted</SelectItem>
                    <SelectItem value="Rejected Offer">Rejected</SelectItem>
                    <SelectItem value="Considering Offer">Considering</SelectItem>
                    <SelectItem value="Roster Finalized">Finalized</SelectItem>
                    <SelectItem value="Not Offered">Not Offered</SelectItem>
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
                    setSelectedBirthYear('all');
                    setSelectedGradYear('all');
                    setSelectedTryoutStatus('all');
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

        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-purple-600" />
                CSV Import Progress
              </DialogTitle>
            </DialogHeader>

            {importProgress && (
              <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-700">
                      Processing: {importProgress.processed} / {importProgress.total}
                    </span>
                    <span className="text-slate-600">
                      {Math.round((importProgress.processed / importProgress.total) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={(importProgress.processed / importProgress.total) * 100} 
                    className="h-2"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-xs text-green-600 font-semibold">Teams Created</div>
                    <div className="text-2xl font-bold text-green-700">{importProgress.created}</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-xs text-blue-600 font-semibold">Players Matched</div>
                    <div className="text-2xl font-bold text-blue-700">{importProgress.matched}</div>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-xs text-red-600 font-semibold">Errors</div>
                    <div className="text-2xl font-bold text-red-700">{importProgress.errors.length}</div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-900 rounded-lg p-4 font-mono text-xs space-y-1">
                  {importProgress.logs.map((log, idx) => (
                    <div 
                      key={idx}
                      className={`flex items-start gap-2 ${
                        log.type === 'success' ? 'text-green-400' :
                        log.type === 'error' ? 'text-red-400' :
                        log.type === 'info' ? 'text-blue-400' :
                        'text-slate-300'
                      }`}
                    >
                      {log.type === 'success' && <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />}
                      {log.type === 'error' && <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />}
                      <span>{log.message}</span>
                    </div>
                  ))}
                </div>

                {importProgress.processed === importProgress.total && (
                  <div className="flex gap-2">
                    {importProgress.errors.length > 0 && (
                      <Button 
                        onClick={retryFailedImports}
                        className="flex-1 bg-gradient-to-r from-orange-600 to-red-600"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry Failed ({importProgress.errors.length})
                      </Button>
                    )}
                    <Button 
                      onClick={() => setShowImportDialog(false)}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Close
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <ResetTeamsDialog
          open={showResetDialog}
          onClose={() => setShowResetDialog(false)}
          onComplete={() => {
            queryClient.invalidateQueries(['teams']);
            queryClient.invalidateQueries(['players']);
            setShowResetDialog(false);
          }}
        />
      </div>
    </DragDropContext>
  );
}