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
      const player = players.find(p => p.id === playerId);
      const teamAssignments = player?.team_assignments || [];
      
      const updatedAssignments = teamAssignments.filter(a => a.season !== '26/27');
      updatedAssignments.push({ team_id: teamId, season: '26/27' });
      
      await base44.entities.Player.update(playerId, { 
        current_26_27_team: teamId,
        team_assignments: updatedAssignments
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['players']);
      queryClient.refetchQueries(['players']);
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
    
    const dplTeams = sortTeamsByAge(filtered.filter(t => 
      t.league === 'DPL' || t.name?.toUpperCase().includes('DPL')
    ));

    const otherTeams = filtered.filter(t => 
      t.league !== 'Girls Academy' && 
      t.league !== 'Aspire' &&
      t.league !== 'DPL' &&
      !t.name?.toLowerCase().includes('pre-ga 1') &&
      !t.name?.toLowerCase().includes('pre-ga 2') &&
      !t.name?.toLowerCase().includes('aspire') &&
      !t.name?.toUpperCase().includes('DPL')
    );

    const sortedOtherTeams = otherTeams.sort((a, b) => {
      const leagueOrder = { 'Green': 1, 'White': 2, 'Black': 3 };
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
      dpl: dplTeams,
      other: sortedOtherTeams
    };
    }, [teams, selectedAgeGroup, selectedCoach]);

  const getTeamPlayers = useCallback((team) => {
    const effectiveSeason = team.season || (team.name?.includes('26/27') ? '26/27' : team.name?.includes('25/26') ? '25/26' : null);
    const teamPlayers = players.filter(p => {
      if (p.team_assignments && Array.isArray(p.team_assignments) && p.team_assignments.length > 0) {
        if (effectiveSeason) {
          return p.team_assignments.some(a => a.team_id === team.id && a.season === effectiveSeason);
        }
        return p.team_assignments.some(a => a.team_id === team.id);
      }
      // Fallback for legacy players without team_assignments
      if (effectiveSeason === '26/27') return p.current_26_27_team === team.id;
      if (effectiveSeason === '25/26') return p.current_25_26_team === team.id;
      return false;
    });
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
      'Pre-GA 1': 1, 
      'Aspire': 2, 
      'Pre-GA 2': 2, 
      'DPL': 3, 
      'Green': 4, 
      'White': 5, 
      'Black': 6 
    };

    toast.info('Recalculating rankings across all age groups...');

    for (const ageGroup of ageGroupsInOrder) {
      const allPlayersInAge = players.filter(p => p.age_group === ageGroup && p.current_26_27_team);
      
      const playersWithTeamData = allPlayersInAge.map(p => {
        const team = teams.find(t => t.id === p.current_26_27_team);
        if (!team) return null;
        
        const teamSeason = team.season || (team.name?.includes('26/27') ? '26/27' : (team.name?.includes('25/26') ? '25/26' : null));
        if (teamSeason !== '26/27') return null;

        let determinedLeague = team.league;
        const teamNameLower = team.name?.toLowerCase() || '';
        
        if (teamNameLower.includes('pre-ga 1') || (teamNameLower.includes('girls academy') && !teamNameLower.includes('aspire'))) {
          determinedLeague = 'Girls Academy';
        } else if (teamNameLower.includes('pre-ga 2') || teamNameLower.includes('aspire')) {
          determinedLeague = 'Aspire';
        } else if (teamNameLower.includes('dpl')) {
          determinedLeague = 'DPL';
        } else if (teamNameLower.includes('green')) {
          determinedLeague = 'Green';
        } else if (teamNameLower.includes('white')) {
          determinedLeague = 'White';
        } else if (teamNameLower.includes('black')) {
          determinedLeague = 'Black';
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

        const teamNameA = a.team.name || '';
        const teamNameB = b.team.name || '';
        const teamNameComparison = teamNameA.localeCompare(teamNameB);
        if (teamNameComparison !== 0) return teamNameComparison;
        
        if (a.teamRanking !== b.teamRanking) return a.teamRanking - b.teamRanking;
        
        return a.lastName.localeCompare(b.lastName);
      });

      for (let i = 0; i < playersWithTeamData.length; i++) {
        const { player } = playersWithTeamData[i];
        const existingTryout = tryouts.find(t => t.player_id === player.id);
        const ranking = i + 1;
        
        try {
          if (existingTryout) {
            await base44.entities.PlayerTryout.update(existingTryout.id, {
              age_group_ranking: ranking
            });
          } else {
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

    await queryClient.refetchQueries(['tryouts']);
    toast.success('Rankings recalculated successfully!');
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const playerId = draggableId.replace('player-', '');
    const sourceTeamId = source.droppableId.replace('team-', '');
    const destTeamId = destination.droppableId.replace('team-', '');

    if (sourceTeamId !== destTeamId) {
      const movingPlayer = players.find(p => p.id === playerId);
      const movedAssignments = (movingPlayer?.team_assignments || []).filter(a => a.season !== '26/27');
      movedAssignments.push({ team_id: destTeamId, season: '26/27' });

      queryClient.setQueryData(['players'], (old) => {
        return old?.map(p => 
          p.id === playerId ? { ...p, current_26_27_team: destTeamId, team_assignments: movedAssignments } : p
        ) || old;
      });

      try {
        await base44.entities.Player.update(playerId, { 
          current_26_27_team: destTeamId,
          team_assignments: movedAssignments
        });
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        await queryClient.invalidateQueries(['players']);
        await queryClient.invalidateQueries(['tryouts']);
        await queryClient.refetchQueries(['players']);
        await queryClient.refetchQueries(['tryouts']);
        await recalculateAllRankings();
        
        toast.success('Player moved successfully');
      } catch (error) {
        console.error('Failed to update player team:', error);
        toast.error('Failed to move player');
        queryClient.invalidateQueries(['players']);
      }
    } else {
      try {
        await recalculateAllRankings();
        await queryClient.refetchQueries(['players']);
        await queryClient.refetchQueries(['tryouts']);
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
    
    for (const baseName of [...new Set(failedRows.map(r => r.newTeam).filter(Boolean))]) {
      const teamNameWithSeason = `${baseName} 26/27`;
      const existingTeam = teams.find(t => t.name === teamNameWithSeason && t.season === '26/27');
      if (existingTeam) {
        createdTeams[baseName] = existingTeam.id;
      }
    }

    for (const baseName of [...new Set(failedRows.map(r => r.team2526).filter(Boolean))]) {
      const teamNameWithSeason = `${baseName} 25/26`;
      const existingTeam = teams.find(t => t.name === teamNameWithSeason && t.season === '25/26');
      if (existingTeam) {
        createdTeams[`${baseName}_2526`] = existingTeam.id;
      }
    }

    for (let i = 0; i < failedRows.length; i++) {
      const row = failedRows[i];
      try {
        const fullName = `${row.firstName} ${row.lastName}`.trim();
        if (!fullName || fullName.length < 2) continue;
        
        const team2627Id = createdTeams[row.newTeam];
        if (!team2627Id) throw new Error(`26/27 Team "${row.newTeam}" not found`);

        const team2526Id = row.team2526 ? createdTeams[`${row.team2526}_2526`] : null;

        const existingPlayer = players.find(p => {
          const nameMatch = p.full_name?.toLowerCase() === fullName.toLowerCase();
          const birthdateMatch = row.birthdate && p.date_of_birth === row.birthdate;
          return nameMatch || birthdateMatch;
        });

        if (existingPlayer) {
          const updateData = { 
            current_26_27_team: team2627Id,
            team_id: team2627Id
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
            current_26_27_team: team2627Id,
            team_id: team2627Id,
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

    await queryClient.invalidateQueries(['teams']);
    await queryClient.invalidateQueries(['players']);
    await queryClient.invalidateQueries(['tryouts']);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await queryClient.refetchQueries(['teams']);
    await queryClient.refetchQueries(['players']);
    await queryClient.refetchQueries(['tryouts']);
    
    setImportProgress(prev => ({
      ...prev,
      logs: [...prev.logs, { type: 'success', message: `✅ Retry complete! ${prev.errors.length} remaining errors` }]
    }));

    toast.success('Retry completed - rosters updated!');
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
      const rows = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        // Handle both comma and tab delimiters, strip surrounding quotes
        const values = lines[i].split(/[,\t]/).map(v => v.trim().replace(/^"|"$/g, ''));
        if (values.length < 2) continue;

        const firstName = values[0]?.trim();
        const lastName = values[1]?.trim();
        const fullName = `${firstName} ${lastName}`.trim();
        if (!fullName || fullName.length < 2) continue;

        rows.push({
          firstName,
          lastName,
          fullName,
          team2526: values[2]?.trim() || '',       // 25/26 team column
          position: parsePositionFromNumber(values[3]?.trim()),
          gradYear: values[4]?.trim() || '',
          birthdate: values[5]?.trim() || '',
          comments: values[6]?.trim() || '',
          team2627: values[7]?.trim() || ''         // 26/27 team column
        });
      }

        setImportProgress({
          total: rows.length,
          processed: 0,
          created: 0,
          matched: 0,
          errors: [],
          logs: [{ type: 'info', message: `🚀 Starting import of ${rows.length} players...` }],
          failedRows: []
        });
        setShowImportDialog(true);

        await new Promise(resolve => setTimeout(resolve, 500));

        // Helper: derive age group and league from team base name
        const deriveTeamMeta = (baseName, baseYear) => {
          const ageMatch = baseName.match(/U-?(\d+)|(\d{4})/i);
          let ageGroup = 'U15';
          if (ageMatch) {
            if (ageMatch[1]) ageGroup = `U${ageMatch[1]}`;
            else if (ageMatch[2]) ageGroup = `U${baseYear - parseInt(ageMatch[2])}`;
          }
          const nameUpper = baseName.toUpperCase();
          let league = 'Green';
          if (nameUpper.includes('PRE-GA 1') || (nameUpper.includes('GIRLS ACADEMY') && !nameUpper.includes('ASPIRE'))) league = 'Girls Academy';
          else if (nameUpper.includes('PRE-GA 2') || nameUpper.includes('ASPIRE')) league = 'Aspire';
          else if (nameUpper.includes('DPL')) league = 'DPL';
          else if (nameUpper.includes('WHITE')) league = 'White';
          else if (nameUpper.includes('BLACK')) league = 'Black';
          return { ageGroup, league };
        };

        // Fetch fresh teams from DB so we never use stale cache
        const freshTeamsRaw = await base44.entities.Team.list();
        
        const teamMap = {}; // key: "baseName_season" → team id

        const findOrCreateTeam = async (baseName, season, baseYear) => {
          if (!baseName) return null;
          const key = `${baseName}_${season}`;
          if (teamMap[key]) return teamMap[key];

          // Try to find by exact name+season OR by name containing baseName and matching season
          const teamNameFull = `${baseName} ${season}`;
          let existing = freshTeamsRaw.find(t =>
            t.season === season && (
              t.name === teamNameFull ||
              t.name === baseName ||
              t.name?.toLowerCase() === baseName.toLowerCase()
            )
          );
          // Also try fuzzy: team name includes the base name (for existing teams named differently)
          if (!existing) {
            existing = freshTeamsRaw.find(t =>
              t.season === season &&
              t.name?.toLowerCase().includes(baseName.toLowerCase())
            );
          }

          if (existing) {
            teamMap[key] = existing.id;
            setImportProgress(prev => ({
              ...prev,
              logs: [...prev.logs, { type: 'info', message: `✓ Found ${season} team: ${existing.name}` }]
            }));
            return existing.id;
          }

          const { ageGroup, league } = deriveTeamMeta(baseName, baseYear);
          const newTeam = await base44.entities.Team.create({
            name: teamNameFull,
            age_group: ageGroup,
            gender: 'Female',
            league,
            season
          });
          freshTeamsRaw.push(newTeam); // keep local list updated
          teamMap[key] = newTeam.id;
          setImportProgress(prev => ({
            ...prev,
            created: prev.created + 1,
            logs: [...prev.logs, { type: 'success', message: `✅ Created ${season} team: ${teamNameFull}` }]
          }));
          await new Promise(resolve => setTimeout(resolve, 200));
          return newTeam.id;
        };

        // Pre-create all unique teams
        const unique2627 = [...new Set(rows.map(r => r.team2627).filter(Boolean))];
        const unique2526 = [...new Set(rows.map(r => r.team2526).filter(Boolean))];
        for (const n of unique2627) await findOrCreateTeam(n, '26/27', 2026);
        for (const n of unique2526) await findOrCreateTeam(n, '25/26', 2025);

        await queryClient.invalidateQueries(['teams']);
        await queryClient.refetchQueries(['teams']);

        // Fetch fresh players too so name matching is accurate
        const freshPlayers = await base44.entities.Player.list();

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          try {
            const fullName = row.fullName;
            const team2627Id = row.team2627 ? teamMap[`${row.team2627}_26/27`] : null;
            const team2526Id = row.team2526 ? teamMap[`${row.team2526}_25/26`] : null;

            if (!team2627Id && !team2526Id) {
              throw new Error(`No valid team found for this player`);
            }

            const existingPlayer = freshPlayers.find(p =>
              p.full_name?.toLowerCase().trim() === fullName.toLowerCase().trim() ||
              (row.birthdate && row.birthdate.length > 0 && p.date_of_birth === row.birthdate)
            );

            // Build team_assignments — preserve any seasons we're NOT importing
            const baseAssignments = (existingPlayer?.team_assignments || []).filter(
              a => a.season !== '25/26' && a.season !== '26/27'
            );
            if (team2526Id) baseAssignments.push({ team_id: team2526Id, season: '25/26' });
            if (team2627Id) baseAssignments.push({ team_id: team2627Id, season: '26/27' });

            const playerData = {
              team_assignments: baseAssignments,
              current_25_26_team: team2526Id || existingPlayer?.current_25_26_team || undefined,
              current_26_27_team: team2627Id || existingPlayer?.current_26_27_team || undefined
            };

            if (row.gradYear) playerData.grad_year = parseInt(row.gradYear);
            if (row.birthdate) playerData.date_of_birth = row.birthdate;
            if (row.position) playerData.primary_position = row.position;
            if (row.comments) {
              const commentLog = existingPlayer?.comment_log || [];
              commentLog.push({ comment: row.comments, created_date: new Date().toISOString(), created_by: 'CSV Import' });
              playerData.comment_log = commentLog;
              playerData.comment = row.comments;
            }

            const seasonLabel = [
              team2526Id ? `25/26: ${row.team2526}` : null,
              team2627Id ? `26/27: ${row.team2627}` : null
            ].filter(Boolean).join(' | ');

            if (existingPlayer) {
              await base44.entities.Player.update(existingPlayer.id, playerData);
              freshPlayers[freshPlayers.findIndex(p => p.id === existingPlayer.id)] = { ...existingPlayer, ...playerData };
              setImportProgress(prev => ({
                ...prev,
                matched: prev.matched + 1,
                processed: prev.processed + 1,
                logs: [...prev.logs, { type: 'success', message: `✅ Updated ${fullName} → ${seasonLabel}` }]
              }));
            } else {
              const created = await base44.entities.Player.create({
                ...playerData,
                full_name: fullName,
                gender: 'Female',
                is_tryout_player: true
              });
              freshPlayers.push(created);
              setImportProgress(prev => ({
                ...prev,
                processed: prev.processed + 1,
                logs: [...prev.logs, { type: 'success', message: `✅ Created ${fullName} → ${seasonLabel}` }]
              }));
            }

            await new Promise(resolve => setTimeout(resolve, 80));
          } catch (error) {
            setImportProgress(prev => ({
              ...prev,
              processed: prev.processed + 1,
              errors: [...prev.errors, `${row.fullName}: ${error.message}`],
              failedRows: [...prev.failedRows, row],
              logs: [...prev.logs, { type: 'error', message: `❌ ${row.fullName}: ${error.message}` }]
            }));
          }
        }

        await queryClient.invalidateQueries(['players']);
        await queryClient.invalidateQueries(['tryouts']);
        await queryClient.refetchQueries(['players']);
        await queryClient.refetchQueries(['tryouts']);

        setImportProgress(prev => ({
          ...prev,
          logs: [...prev.logs, { type: 'success', message: `🎉 Import complete! Teams: ${prev.created} | Players: ${prev.matched + (prev.processed - prev.matched - prev.errors.length)}` }]
        }));

        toast.success('Import complete! Players added to rosters.');
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
                queryClient.refetchQueries(['players']);
                queryClient.refetchQueries(['teams']);
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
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

          <div className="bg-white rounded-xl shadow-lg border-2 border-purple-500 p-4">
            <h2 className="text-xl font-bold text-purple-700 mb-4 sticky top-0 bg-white pb-2 border-b-2 border-purple-200">
              DPL Teams
            </h2>
            <div className="space-y-3">
              {teamColumns.dpl.map(team => (
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
            queryClient.refetchQueries(['teams']);
            queryClient.invalidateQueries(['players']);
            queryClient.refetchQueries(['players']);
            setShowResetDialog(false);
          }}
        />
      </div>
    </DragDropContext>
  );
}