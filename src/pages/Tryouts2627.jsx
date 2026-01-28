import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext } from '@hello-pangea/dnd';
import { RotateCcw, Upload, AlertCircle, CheckCircle2, X, Trash2 } from 'lucide-react';
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
  const [selectedGender, setSelectedGender] = useState('all');
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

  // Filter only 26/27 season teams
  const teamColumns = useMemo(() => {
    let filtered = teams.filter(t => {
      if (!t.name || typeof t.name !== 'string') return false;
      const teamSeason = t.season || (t.name?.includes('26/27') ? '26/27' : null);
      return teamSeason === '26/27';
    });

    if (selectedGender !== 'all') {
      filtered = filtered.filter(t => t.gender === selectedGender);
    }
    if (selectedAgeGroup !== 'all') {
      filtered = filtered.filter(t => t.age_group === selectedAgeGroup);
    }
    if (selectedCoach !== 'all') {
      filtered = filtered.filter(t => t.coach_ids?.includes(selectedCoach));
    }

    const gaTeams = sortTeamsByAge(filtered.filter(t => t.league === 'Girls Academy'));
    const aspireTeams = sortTeamsByAge(filtered.filter(t => t.league === 'Aspire'));
    const otherTeams = sortTeamsByAge(filtered.filter(t => t.league !== 'Girls Academy' && t.league !== 'Aspire'));

    return {
      girlsAcademy: gaTeams,
      aspire: aspireTeams,
      other: otherTeams
    };
  }, [teams, selectedAgeGroup, selectedCoach, selectedGender]);

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

  const handleCSVImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csv = event.target.result;
        const lines = csv.split('\n');
        const headers = lines[0].split(/[,\t]/).map(h => h.trim());

        // Expected headers: First Name, Last Name, Current Team, Position, Grad Year, Birthdate, Comments, 26/27 team
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const values = lines[i].split(/[,\t]/).map(v => v.trim());
          if (values.length < 8) continue;

          rows.push({
            firstName: values[0],
            lastName: values[1],
            currentTeam: values[2],
            position: values[3],
            gradYear: values[4],
            birthdate: values[5],
            comments: values[6],
            newTeam: values[7]
          });
        }

        setImportProgress({
          total: rows.length,
          processed: 0,
          created: 0,
          matched: 0,
          errors: [],
          logs: []
        });
        setShowImportDialog(true);

        // Step 1: Create unique teams
        const uniqueTeams = [...new Set(rows.map(r => r.newTeam).filter(Boolean))];
        const createdTeams = {};
        
        for (const teamName of uniqueTeams) {
          try {
            // Check if team already exists
            const existingTeam = teams.find(t => t.name === teamName);
            if (existingTeam) {
              createdTeams[teamName] = existingTeam.id;
              setImportProgress(prev => ({
                ...prev,
                logs: [...prev.logs, { type: 'info', message: `Team "${teamName}" already exists` }]
              }));
            } else {
              // Parse team name to extract age group (e.g., "U15 Green 26/27")
              const ageMatch = teamName.match(/U-?(\d+)/i);
              const ageGroup = ageMatch ? `U${ageMatch[1]}` : 'U15';
              
              // Determine gender and league from team name
              const gender = 'Female'; // Default, can be enhanced
              let league = 'Green';
              if (teamName.toUpperCase().includes('GIRLS ACADEMY')) league = 'Girls Academy';
              else if (teamName.toUpperCase().includes('ASPIRE')) league = 'Aspire';
              else if (teamName.toUpperCase().includes('WHITE')) league = 'White';
              else if (teamName.toUpperCase().includes('BLACK')) league = 'Black';

              const newTeam = await base44.entities.Team.create({
                name: teamName,
                age_group: ageGroup,
                gender: gender,
                league: league,
                season: '26/27'
              });

              createdTeams[teamName] = newTeam.id;
              setImportProgress(prev => ({
                ...prev,
                created: prev.created + 1,
                logs: [...prev.logs, { type: 'success', message: `Created team "${teamName}"` }]
              }));
            }
          } catch (error) {
            setImportProgress(prev => ({
              ...prev,
              errors: [...prev.errors, `Failed to create team "${teamName}": ${error.message}`],
              logs: [...prev.logs, { type: 'error', message: `Failed to create team "${teamName}": ${error.message}` }]
            }));
          }
        }

        // Step 2: Process players in batches
        const BATCH_SIZE = 10;
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
          const batch = rows.slice(i, i + BATCH_SIZE);
          
          await Promise.all(batch.map(async (row) => {
            try {
              const fullName = `${row.firstName} ${row.lastName}`.trim();
              const teamId = createdTeams[row.newTeam];

              if (!teamId) {
                throw new Error(`Team "${row.newTeam}" not found`);
              }

              // Try to match existing player
              const existingPlayer = players.find(p => {
                const nameMatch = p.full_name?.toLowerCase() === fullName.toLowerCase();
                const birthdateMatch = row.birthdate && p.date_of_birth === row.birthdate;
                return nameMatch || birthdateMatch;
              });

              if (existingPlayer) {
                // Update existing player's team
                await base44.entities.Player.update(existingPlayer.id, { team_id: teamId });
                
                setImportProgress(prev => ({
                  ...prev,
                  matched: prev.matched + 1,
                  processed: prev.processed + 1,
                  logs: [...prev.logs, { type: 'success', message: `Matched "${fullName}" to ${row.newTeam}` }]
                }));
              } else {
                // Create new player
                const gradYearNum = parseInt(row.gradYear);
                await base44.entities.Player.create({
                  full_name: fullName,
                  date_of_birth: row.birthdate,
                  grad_year: gradYearNum,
                  primary_position: row.position,
                  team_id: teamId,
                  gender: 'Female', // Default, enhance if needed
                  is_tryout_player: true,
                  tryout_notes: row.comments
                });

                setImportProgress(prev => ({
                  ...prev,
                  processed: prev.processed + 1,
                  logs: [...prev.logs, { type: 'info', message: `Created new player "${fullName}" in ${row.newTeam}` }]
                }));
              }
            } catch (error) {
              setImportProgress(prev => ({
                ...prev,
                processed: prev.processed + 1,
                errors: [...prev.errors, `${row.firstName} ${row.lastName}: ${error.message}`],
                logs: [...prev.logs, { type: 'error', message: `${row.firstName} ${row.lastName}: ${error.message}` }]
              }));
            }
          }));
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 lg:gap-4">
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
                <label className="text-xs md:text-sm font-semibold text-slate-700 mb-1 md:mb-2 block">&nbsp;</label>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedAgeGroup('all');
                    setSelectedCoach('all');
                    setSelectedGender('all');
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

        {/* Import Progress Dialog */}
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
                  <Button 
                    onClick={() => setShowImportDialog(false)}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Close
                  </Button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Reset Teams Dialog */}
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