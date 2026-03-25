import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext } from '@hello-pangea/dnd';
import { RotateCcw, Upload, AlertCircle, CheckCircle2, X, Trash2, RefreshCw, Printer, Users, UserPlus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import PlayerSearchPanel from '@/components/tryout/PlayerSearchPanel';
import TeamColumn from '@/components/tryout/TeamColumn';
import ResetTeamsDialog from '@/components/admin/ResetTeamsDialog';
import PrintRankingsDialog from '@/components/tryout/PrintRankingsDialog';
import ParentPlayerCSVImportDialog from '@/components/contacts/ParentPlayerCSVImportDialog';
import AddPlayerDialog from '@/components/tryout/AddPlayerDialog';
import { toast } from 'sonner';

export default function Tryouts2627() {
  const queryClient = useQueryClient();

  // Persist filters in URL so back-navigation restores them
  const urlParams = new URLSearchParams(window.location.search);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState(urlParams.get('ageGroup') || 'all');
  const [selectedCoach, setSelectedCoach] = useState(urlParams.get('coach') || 'all');
  const [selectedBirthYear, setSelectedBirthYear] = useState(urlParams.get('birthYear') || 'all');
  const [selectedGradYear, setSelectedGradYear] = useState(urlParams.get('gradYear') || 'all');
  const [selectedTryoutStatus, setSelectedTryoutStatus] = useState(urlParams.get('status') || 'all');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importProgress, setImportProgress] = useState(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showParentCSVDialog, setShowParentCSVDialog] = useState(false);
  const [showAddPlayerDialog, setShowAddPlayerDialog] = useState(false);
  const [mobileTab, setMobileTab] = useState('ga');

  // Keep URL in sync with filter state
  const updateFilterURL = (key, value) => {
    const params = new URLSearchParams(window.location.search);
    if (value === 'all') params.delete(key); else params.set(key, value);
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState(null, '', newUrl);
  };

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

  // League priority for ranking (lower = higher rank)
  const LEAGUE_PRIORITY = { 'Girls Academy': 1, 'Pre-GA 1': 1, 'Aspire': 2, 'Pre-GA 2': 2, 'DPL': 3, 'Green': 4, 'White': 5, 'Black': 6 };

  const getTeamLeague = (team) => {
    if (!team) return 'Unknown';
    const n = team.name?.toLowerCase() || '';
    if (n.includes('pre-ga 1') || (team.league === 'Girls Academy')) return 'Girls Academy';
    if (n.includes('pre-ga 2') || n.includes('aspire') || team.league === 'Aspire') return 'Aspire';
    if (n.includes('dpl') || team.league === 'DPL') return 'DPL';
    if (n.includes('green') || team.league === 'Green') return 'Green';
    if (n.includes('white') || team.league === 'White') return 'White';
    if (n.includes('black') || team.league === 'Black') return 'Black';
    return team.league || 'Unknown';
  };

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
    
    // DPL + Other combined into one column
    const dplAndOther = filtered.filter(t => 
      t.league !== 'Girls Academy' && 
      t.league !== 'Aspire' &&
      !t.name?.toLowerCase().includes('pre-ga 1') &&
      !t.name?.toLowerCase().includes('pre-ga 2') &&
      !t.name?.toLowerCase().includes('aspire')
    ).sort((a, b) => {
      const leagueOrder = { 'DPL': 1, 'Green': 2, 'White': 3, 'Black': 4 };
      const orderDiff = (leagueOrder[a.league] || 5) - (leagueOrder[b.league] || 5);
      if (orderDiff !== 0) return orderDiff;
      const extractAge = (ag) => { const m = ag?.match(/U-?(\d+)/i); return m ? parseInt(m[1]) : 0; };
      return extractAge(b.age_group) - extractAge(a.age_group);
    });

    return { girlsAcademy: gaTeams, aspire: aspireTeams, dplAndOther };
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
      // Prefer age_group_ranking as it reflects manual rank changes immediately
      const rankA = a.age_group_ranking ?? 999999;
      const rankB = b.age_group_ranking ?? 999999;
      if (rankA !== rankB) return rankA - rankB;
      // Fallback to team_position_order, then last name
      const orderA = a.team_position_order ?? 999999;
      const orderB = b.team_position_order ?? 999999;
      if (orderA !== orderB) return orderA - orderB;
      const lastNameA = a.full_name?.split(' ').pop() || '';
      const lastNameB = b.full_name?.split(' ').pop() || '';
      return lastNameA.localeCompare(lastNameB);
    });
    }, [players, getPlayerTryoutData, selectedBirthYear, selectedGradYear, selectedTryoutStatus]);

  // Recalculate age_group_ranking for all players across all age groups.
  // Each age group gets its own sequential ranking starting at 1.
  // Tier order: GA(1) → Aspire(2) → DPL(3) → Green(4) → White(5) → Black(6)
  // Within a team: sorted by team_position_order ASC, then last name as tiebreaker.
  // Players without team_position_order get ordered by last name within their team.
  const recalculateAllRankings = async (currentPlayers, currentTeams) => {
    const pList = currentPlayers || players;
    const tList = currentTeams || teams;

    const teamById = Object.fromEntries(tList.map(t => [t.id, t]));

    // Collect all 26/27 teams grouped by age_group, sorted by league tier
    const teamsByAgeGroup = {};
    for (const team of tList) {
      const teamSeason = team.season || (team.name?.includes('26/27') ? '26/27' : null);
      if (teamSeason !== '26/27') continue;
      const ag = team.age_group || 'Unknown';
      if (!teamsByAgeGroup[ag]) teamsByAgeGroup[ag] = [];
      teamsByAgeGroup[ag].push(team);
    }

    // Sort each age group's teams by league tier
    for (const ag of Object.keys(teamsByAgeGroup)) {
      teamsByAgeGroup[ag].sort((a, b) => {
        const pa = LEAGUE_PRIORITY[getTeamLeague(a)] || 99;
        const pb = LEAGUE_PRIORITY[getTeamLeague(b)] || 99;
        return pa - pb;
      });
    }

    const updates = [];

    for (const [ageGroup, sortedTeams] of Object.entries(teamsByAgeGroup)) {
      let rank = 1;

      for (const team of sortedTeams) {
        // Get all players on this team, using the same sort as the visual board
        const teamSeason = team.season || (team.name?.includes('26/27') ? '26/27' : null);
        const teamPlayers = pList.filter(p => {
          if (p.team_assignments?.length > 0) {
            return p.team_assignments.some(a => a.team_id === team.id && a.season === teamSeason);
          }
          return p.current_26_27_team === team.id;
        });

        // Sort within team: position order first, then last name
        teamPlayers.sort((a, b) => {
          const orderA = typeof a.team_position_order === 'number' ? a.team_position_order : 999999;
          const orderB = typeof b.team_position_order === 'number' ? b.team_position_order : 999999;
          if (orderA !== orderB) return orderA - orderB;
          const lastA = a.full_name?.split(' ').pop()?.toLowerCase() || '';
          const lastB = b.full_name?.split(' ').pop()?.toLowerCase() || '';
          return lastA.localeCompare(lastB);
        });

        for (const p of teamPlayers) {
          updates.push({ playerId: p.id, ranking: rank++ });
        }
      }
    }

    // Optimistic cache update
    queryClient.setQueryData(['players'], (old) => {
      if (!old) return old;
      const rankMap = Object.fromEntries(updates.map(u => [u.playerId, u.ranking]));
      return old.map(p => rankMap[p.id] !== undefined ? { ...p, age_group_ranking: rankMap[p.id] } : p);
    });

    // Persist via backend function in chunks of 15 to avoid timeouts
    const chunkSize = 15;
    let totalFailed = 0;
    for (let i = 0; i < updates.length; i += chunkSize) {
      const chunk = updates.slice(i, i + chunkSize);
      const res = await base44.functions.invoke('saveRankings', { updates: chunk });
      totalFailed += res.data?.failed || 0;
      if (i + chunkSize < updates.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    if (totalFailed > 0) toast.warning(`${totalFailed} rankings failed to save`);
  };

  // Manual rank: set player to a specific rank, shift others in same age group
  const handleManualRank = async (player, newRank) => {
    const pList = [...players];
    const tList = teams;

    // Find player's age group via their 26/27 team
    const playerTeam = tList.find(t => {
      const season = t.season || (t.name?.includes('26/27') ? '26/27' : null);
      if (season !== '26/27') return false;
      return player.team_assignments?.some(a => a.team_id === t.id && a.season === '26/27') ||
             player.current_26_27_team === t.id;
    });
    if (!playerTeam) { toast.error('Player has no 26/27 team'); return; }

    const ageGroup = playerTeam.age_group;

    // Get all players in this age group with a ranking, sorted by current ranking
    const ageGroupPlayers = pList.filter(p => {
      const pt = tList.find(t => {
        const season = t.season || (t.name?.includes('26/27') ? '26/27' : null);
        if (season !== '26/27' || t.age_group !== ageGroup) return false;
        return p.team_assignments?.some(a => a.team_id === t.id && a.season === '26/27') ||
               p.current_26_27_team === t.id;
      });
      return !!pt;
    }).filter(p => p.id !== player.id && p.age_group_ranking != null)
      .sort((a, b) => (a.age_group_ranking || 999) - (b.age_group_ranking || 999));

    // Insert player at newRank, shift others down
    const updates = [];
    let rank = 1;
    let inserted = false;
    for (const p of ageGroupPlayers) {
      if (rank === newRank && !inserted) {
        updates.push({ playerId: player.id, ranking: newRank });
        inserted = true;
        rank++;
      }
      updates.push({ playerId: p.id, ranking: rank++ });
    }
    if (!inserted) {
      updates.push({ playerId: player.id, ranking: newRank });
    }

    // Optimistic update — also sync team_position_order so card order is instant
    queryClient.setQueryData(['players'], (old) => {
      if (!old) return old;
      const rankMap = Object.fromEntries(updates.map(u => [u.playerId, u.ranking]));
      return old.map(p =>
        rankMap[p.id] !== undefined
          ? { ...p, age_group_ranking: rankMap[p.id], team_position_order: rankMap[p.id] * 1000 }
          : p
      );
    });

    toast.info(`Setting rank #${newRank}...`);

    // Persist via backend function in chunks
    const chunkSize = 15;
    for (let i = 0; i < updates.length; i += chunkSize) {
      const chunk = updates.slice(i, i + chunkSize);
      await base44.functions.invoke('saveRankings', { updates: chunk });
      if (i + chunkSize < updates.length) await new Promise(resolve => setTimeout(resolve, 300));
    }

    toast.success(`Ranking updated to #${newRank}`);
  };

  // Pure in-memory ranking recalculation — no DB calls, used for instant UI updates
  const recalculateRankingsInMemory = (pList, tList) => {
    const teamsByAgeGroup = {};
    for (const team of tList) {
      const teamSeason = team.season || (team.name?.includes('26/27') ? '26/27' : null);
      if (teamSeason !== '26/27') continue;
      const ag = team.age_group || 'Unknown';
      if (!teamsByAgeGroup[ag]) teamsByAgeGroup[ag] = [];
      teamsByAgeGroup[ag].push(team);
    }
    for (const ag of Object.keys(teamsByAgeGroup)) {
      teamsByAgeGroup[ag].sort((a, b) => {
        const pa = LEAGUE_PRIORITY[getTeamLeague(a)] || 99;
        const pb = LEAGUE_PRIORITY[getTeamLeague(b)] || 99;
        return pa - pb;
      });
    }
    const rankMap = {};
    for (const [, sortedTeams] of Object.entries(teamsByAgeGroup)) {
      let rank = 1;
      for (const team of sortedTeams) {
        const teamSeason = team.season || (team.name?.includes('26/27') ? '26/27' : null);
        const teamPlayers = pList.filter(p =>
          p.team_assignments?.length > 0
            ? p.team_assignments.some(a => a.team_id === team.id && a.season === teamSeason)
            : p.current_26_27_team === team.id
        ).sort((a, b) => {
          const orderA = typeof a.team_position_order === 'number' ? a.team_position_order : 999999;
          const orderB = typeof b.team_position_order === 'number' ? b.team_position_order : 999999;
          if (orderA !== orderB) return orderA - orderB;
          return (a.full_name?.split(' ').pop() || '').localeCompare(b.full_name?.split(' ').pop() || '');
        });
        for (const p of teamPlayers) rankMap[p.id] = rank++;
      }
    }
    return pList.map(p => rankMap[p.id] !== undefined ? { ...p, age_group_ranking: rankMap[p.id] } : p);
  };

  // Helper: check if a player is on a given 26/27 team (handles both storage formats)
  const isPlayerOnTeam2627 = (player, teamId) => {
    if (player.team_assignments?.length > 0) {
      return player.team_assignments.some(a => a.team_id === teamId && a.season === '26/27');
    }
    return player.current_26_27_team === teamId;
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const draggedPlayerId = draggableId.replace('player-', '');
    const sourceTeamId = source.droppableId.replace('team-', '');
    const destTeamId = destination.droppableId.replace('team-', '');
    const destIndex = destination.index;

    let updatedPlayers = [...players];

    // Sort matching getTeamPlayers visual order: age_group_ranking → team_position_order → last name
    const visualSort = (a, b) => {
      const rankA = a.age_group_ranking ?? 999999;
      const rankB = b.age_group_ranking ?? 999999;
      if (rankA !== rankB) return rankA - rankB;
      const orderA = typeof a.team_position_order === 'number' ? a.team_position_order : 999999;
      const orderB = typeof b.team_position_order === 'number' ? b.team_position_order : 999999;
      if (orderA !== orderB) return orderA - orderB;
      const lastA = a.full_name?.split(' ').pop()?.toLowerCase() || '';
      const lastB = b.full_name?.split(' ').pop()?.toLowerCase() || '';
      return lastA.localeCompare(lastB);
    };

    if (sourceTeamId === destTeamId) {
      // --- Reorder within same team ---
      const teamPlayers = updatedPlayers
        .filter(p => isPlayerOnTeam2627(p, destTeamId))
        .sort(visualSort);

      const fromIdx = teamPlayers.findIndex(p => p.id === draggedPlayerId);
      if (fromIdx === -1) return;

      // Move in array
      const [moved] = teamPlayers.splice(fromIdx, 1);
      teamPlayers.splice(destIndex, 0, moved);

      // Assign clean sequential position orders in memory
      const posMap = Object.fromEntries(teamPlayers.map((p, i) => [p.id, (i + 1) * 1000]));
      updatedPlayers = updatedPlayers.map(p =>
        posMap[p.id] !== undefined ? { ...p, team_position_order: posMap[p.id] } : p
      );

      // Recalculate rankings in memory (no DB) so display updates immediately
      updatedPlayers = recalculateRankingsInMemory(updatedPlayers, teams);
      queryClient.setQueryData(['players'], updatedPlayers);

      // Only persist the one player that moved (avoid rate limits)
      await base44.entities.Player.update(draggedPlayerId, {
        team_position_order: posMap[draggedPlayerId]
      });

    } else {
      // --- Move to different team ---
      const movingPlayer = updatedPlayers.find(p => p.id === draggedPlayerId);
      if (!movingPlayer) return;

      const movedAssignments = (movingPlayer.team_assignments || []).filter(a => a.season !== '26/27');
      movedAssignments.push({ team_id: destTeamId, season: '26/27' });

      const newPositionOrder = (destIndex + 1) * 1000;

      updatedPlayers = updatedPlayers.map(p =>
        p.id === draggedPlayerId
          ? { ...p, current_26_27_team: destTeamId, team_assignments: movedAssignments, team_position_order: newPositionOrder }
          : p
      );

      // Recalculate rankings in memory so display updates immediately
      updatedPlayers = recalculateRankingsInMemory(updatedPlayers, teams);
      queryClient.setQueryData(['players'], updatedPlayers);

      try {
        await base44.entities.Player.update(draggedPlayerId, {
          current_26_27_team: destTeamId,
          team_assignments: movedAssignments,
          team_position_order: newPositionOrder
        });
        toast.success('Player moved — click "Recalculate Rankings" to save rankings');
      } catch (error) {
        toast.error('Failed to move player');
        queryClient.invalidateQueries(['players']);
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

    // Fetch fresh teams for retry lookup
    const freshTeamsForRetry = await base44.entities.Team.list();
    const createdTeams = {};

    // Build lookup for 26/27 teams (by baseName from row.team2627)
    for (const baseName of [...new Set(failedRows.map(r => r.team2627).filter(Boolean))]) {
      const existing = freshTeamsForRetry.find(t =>
        t.season === '26/27' && (
          t.name === `${baseName} 26/27` ||
          t.name === baseName ||
          t.name?.toLowerCase().includes(baseName.toLowerCase())
        )
      );
      if (existing) createdTeams[baseName] = existing.id;
    }

    // Build lookup for 25/26 teams
    for (const baseName of [...new Set(failedRows.map(r => r.team2526).filter(Boolean))]) {
      const existing = freshTeamsForRetry.find(t =>
        t.season === '25/26' && (
          t.name === `${baseName} 25/26` ||
          t.name === baseName ||
          t.name?.toLowerCase().includes(baseName.toLowerCase())
        )
      );
      if (existing) createdTeams[`${baseName}_2526`] = existing.id;
    }

    for (let i = 0; i < failedRows.length; i++) {
      const row = failedRows[i];
      try {
        const fullName = `${row.firstName} ${row.lastName}`.trim();
        if (!fullName || fullName.length < 2) continue;
        
        const team2627Id = createdTeams[row.team2627] || createdTeams[row.newTeam];
        const team2526Id = row.team2526 ? createdTeams[`${row.team2526}_2526`] : null;
        if (!team2627Id && !team2526Id) throw new Error(`No valid team found for this player`);

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
    };

    reader.readAsText(file);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="p-4 md:p-6 lg:p-8 max-w-[1900px] mx-auto">
        <div className="mb-4 md:mb-6">
          <div className="flex justify-between items-start gap-2 flex-wrap">
            <div>
              <h1 className="text-xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-1 bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                2026-27 Tryouts Board
              </h1>
              <p className="text-xs md:text-base lg:text-lg text-slate-600 hidden sm:block">Manage 26/27 season teams and player assignments</p>
            </div>
            
            <div className="flex gap-1 md:gap-2 flex-wrap justify-end">
              <Button
                onClick={async () => {
                  const t = toast.loading('Recalculating rankings... (this may take ~30s)');
                  await recalculateAllRankings(players, teams);
                  toast.dismiss(t);
                  toast.success('Rankings recalculated!');
                }}
                variant="outline"
                size="sm"
                className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 text-xs md:text-sm"
              >
                <RefreshCw className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                <span className="hidden md:inline">Recalculate Rankings</span>
              </Button>
              <Button
                onClick={() => setShowPrintDialog(true)}
                variant="outline"
                size="sm"
                className="border-slate-500 text-slate-600 hover:bg-slate-50 text-xs md:text-sm"
              >
                <Printer className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                <span className="hidden md:inline">Print Rankings</span>
              </Button>
              <Button
                onClick={() => setShowResetDialog(true)}
                variant="outline"
                size="sm"
                className="border-red-600 text-red-600 hover:bg-red-50 text-xs md:text-sm"
              >
                <Trash2 className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                <span className="hidden md:inline">Reset for 26/27</span>
              </Button>
              <Button
                onClick={() => setShowAddPlayerDialog(true)}
                size="sm"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-xs md:text-sm"
              >
                <UserPlus className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                <span className="hidden md:inline">Add Player</span>
              </Button>
              <Button
                onClick={() => setShowParentCSVDialog(true)}
                size="sm"
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50 text-xs md:text-sm"
              >
                <Users className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                <span className="hidden md:inline">Import Parents CSV</span>
              </Button>
              <Button
                onClick={() => document.getElementById('csv-import').click()}
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-xs md:text-sm"
              >
                <Upload className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                <span className="hidden md:inline">Import CSV</span>
              </Button>
            </div>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3 lg:gap-4">
              <div>
                <label className="text-xs md:text-sm font-semibold text-slate-700 mb-1 md:mb-2 block">Age Group</label>
                <Select value={selectedAgeGroup} onValueChange={v => { setSelectedAgeGroup(v); updateFilterURL('ageGroup', v); }}>
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
                <Select value={selectedBirthYear} onValueChange={v => { setSelectedBirthYear(v); updateFilterURL('birthYear', v); }}>
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
                <Select value={selectedGradYear} onValueChange={v => { setSelectedGradYear(v); updateFilterURL('gradYear', v); }}>
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
                <Select value={selectedTryoutStatus} onValueChange={v => { setSelectedTryoutStatus(v); updateFilterURL('status', v); }}>
                  <SelectTrigger className="border-2 h-9 md:h-10 lg:h-12 shadow-sm text-xs md:text-sm">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Not Offered Yet">Not Offered Yet</SelectItem>
                    <SelectItem value="Considering Offer">Considering Offer</SelectItem>
                    <SelectItem value="Accepted Offer">Accepted Offer</SelectItem>
                    <SelectItem value="Signed">Signed</SelectItem>
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
                    window.history.replaceState(null, '', window.location.pathname);
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

        {/* Mobile: tab switcher to pick which column to show */}
        <div className="flex lg:hidden gap-1 mb-3 bg-slate-100 p-1 rounded-xl">
          {[
            { key: 'ga', label: 'GA', color: 'emerald' },
            { key: 'aspire', label: 'Aspire', color: 'blue' },
            { key: 'other', label: 'DPL+', color: 'purple' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setMobileTab(tab.key)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                mobileTab === tab.key 
                  ? `bg-white shadow text-${tab.color}-700` 
                  : 'text-slate-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className={`bg-white rounded-xl shadow-lg border-2 border-emerald-500 p-3 md:p-4 ${mobileTab !== 'ga' ? 'hidden lg:block' : ''}`}>
            <h2 className="text-lg md:text-xl font-bold text-emerald-700 mb-3 md:mb-4 pb-2 border-b-2 border-emerald-200">
              Girls Academy Teams
            </h2>
            <div className="space-y-3">
              {teamColumns.girlsAcademy.map(team => (
                <TeamColumn key={team.id} team={team} players={getTeamPlayers(team)} onManualRank={handleManualRank} />
              ))}
              {teamColumns.girlsAcademy.length === 0 && (
                <p className="text-center text-slate-400 text-sm py-10 italic">No Girls Academy teams</p>
              )}
            </div>
          </div>

          <div className={`bg-white rounded-xl shadow-lg border-2 border-blue-500 p-3 md:p-4 ${mobileTab !== 'aspire' ? 'hidden lg:block' : ''}`}>
            <h2 className="text-lg md:text-xl font-bold text-blue-700 mb-3 md:mb-4 pb-2 border-b-2 border-blue-200">
              Girls Aspire Teams
            </h2>
            <div className="space-y-3">
              {teamColumns.aspire.map(team => (
                <TeamColumn key={team.id} team={team} players={getTeamPlayers(team)} onManualRank={handleManualRank} />
              ))}
              {teamColumns.aspire.length === 0 && (
                <p className="text-center text-slate-400 text-sm py-10 italic">No Aspire teams</p>
              )}
            </div>
          </div>

          <div className={`bg-white rounded-xl shadow-lg border-2 border-purple-500 p-3 md:p-4 ${mobileTab !== 'other' ? 'hidden lg:block' : ''}`}>
            <h2 className="text-lg md:text-xl font-bold text-purple-700 mb-3 md:mb-4 pb-2 border-b-2 border-purple-200">
              DPL &amp; Other Teams
            </h2>
            <div className="space-y-3">
              {teamColumns.dplAndOther.map(team => (
                <TeamColumn key={team.id} team={team} players={getTeamPlayers(team)} onManualRank={handleManualRank} />
              ))}
              {teamColumns.dplAndOther.length === 0 && (
                <p className="text-center text-slate-400 text-sm py-10 italic">No DPL/other teams</p>
              )}
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

        <PrintRankingsDialog
          open={showPrintDialog}
          onClose={() => setShowPrintDialog(false)}
          players={players}
          teams={teams}
          tryouts={tryouts}
        />

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

        <ParentPlayerCSVImportDialog
          open={showParentCSVDialog}
          onClose={() => setShowParentCSVDialog(false)}
          players={players}
          onComplete={() => queryClient.invalidateQueries(['players'])}
        />

        <AddPlayerDialog
          open={showAddPlayerDialog}
          onClose={() => setShowAddPlayerDialog(false)}
          teams={teams}
          onCreated={() => {
            queryClient.invalidateQueries(['players']);
            queryClient.refetchQueries(['players']);
          }}
        />
      </div>
    </DragDropContext>
  );
}