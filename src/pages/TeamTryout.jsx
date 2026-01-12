import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Users, User, Plus, Trash2, ChevronDown, ChevronUp, Send, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { BRANCH_OPTIONS } from '../components/constants/leagueOptions';
import { TeamRoleBadge } from '@/components/utils/teamRoleBadge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import PlayerEvaluationCard from '../components/tryout/PlayerEvaluationCard';
import SendOfferDialog from '../components/tryout/SendOfferDialog';
import FinalizeRosterDialog from '../components/tryout/FinalizeRosterDialog';

export default function TeamTryout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [teamSearchTerm, setTeamSearchTerm] = useState('');
  const [teamFilterGender, setTeamFilterGender] = useState('all');
  const [teamFilterBranch, setTeamFilterBranch] = useState('all');
  const [teamFilterAgeGroup, setTeamFilterAgeGroup] = useState('all');
  const [teamFilterLeague, setTeamFilterLeague] = useState('all');
  const [teamFilterSeason, setTeamFilterSeason] = useState('all');
  
  const [playerSearchTerm, setPlayerSearchTerm] = useState('');
  const [playerFilterBranch, setPlayerFilterBranch] = useState('all');
  const [playerFilterAgeGroup, setPlayerFilterAgeGroup] = useState('all');
  const [playerFilterTeamRole, setPlayerFilterTeamRole] = useState('all');
  const [playerFilterBirthYear, setPlayerFilterBirthYear] = useState('all');
  const [playerFilterCurrentTeam, setPlayerFilterCurrentTeam] = useState('all');
  const [birthdayFrom, setBirthdayFrom] = useState('');
  const [birthdayTo, setBirthdayTo] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [bulkAssignTeam, setBulkAssignTeam] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  const [showCreateTeamDialog, setShowCreateTeamDialog] = useState(false);
  const [teamForm, setTeamForm] = useState({
    name: '',
    age_group: '',
    gender: 'Female',
    branch: '',
    league: ''
  });
  const [showSendOfferDialog, setShowSendOfferDialog] = useState(false);
  const [selectedOfferPlayer, setSelectedOfferPlayer] = useState(null);
  const [selectedOfferTeam, setSelectedOfferTeam] = useState(null);
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false);
  const [selectedFinalizeTeam, setSelectedFinalizeTeam] = useState(null);

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: tryouts = [] } = useQuery({
    queryKey: ['tryouts'],
    queryFn: () => base44.entities.PlayerTryout.list()
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations'],
    queryFn: () => base44.entities.Evaluation.list()
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => base44.entities.PhysicalAssessment.list()
  });

  const updateTryoutMutation = useMutation({
    mutationFn: async ({ playerId, data }) => {
      const existingTryout = tryouts.find(t => t.player_id === playerId);
      if (existingTryout) {
        return await base44.entities.PlayerTryout.update(existingTryout.id, data);
      } else {
        const player = players.find(p => p.id === playerId);
        return await base44.entities.PlayerTryout.create({
          player_id: playerId,
          player_name: player?.full_name,
          ...data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tryouts']);
    }
  });

  const createTeamMutation = useMutation({
    mutationFn: (data) => base44.entities.Team.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['teams']);
      setShowCreateTeamDialog(false);
      setTeamForm({ name: '', age_group: '', gender: 'Female', branch: '', league: '' });
      toast.success('Team created');
    }
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (teamId) => base44.entities.Team.delete(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries(['teams']);
      toast.success('Team deleted');
    }
  });

  const sendOfferMutation = useMutation({
    mutationFn: async ({ playerId, teamName, message }) => {
      const player = players.find(p => p.id === playerId);
      const parentEmails = player.parent_emails || [player.email].filter(Boolean);
      
      // Update tryout status
      const existingTryout = tryouts.find(t => t.player_id === playerId);
      if (existingTryout) {
        await base44.entities.PlayerTryout.update(existingTryout.id, {
          next_season_status: 'Offer Sent'
        });
      } else {
        await base44.entities.PlayerTryout.create({
          player_id: playerId,
          player_name: player.full_name,
          next_year_team: teamName,
          next_season_status: 'Offer Sent'
        });
      }

      // Send email to all parent contacts
      for (const email of parentEmails) {
        await base44.entities.Message.create({
          sender_email: 'tryouts@michiganjaguars.com',
          sender_name: 'Michigan Jaguars Tryouts',
          recipient_email: email,
          recipient_name: player.full_name,
          subject: `Team Offer for ${player.full_name} - ${teamName}`,
          content: message
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tryouts']);
      setShowSendOfferDialog(false);
      setSelectedOfferPlayer(null);
      setSelectedOfferTeam(null);
      toast.success('Offer sent successfully');
    }
  });

  const finalizeRosterMutation = useMutation({
    mutationFn: async ({ teamId, teamName, playerIds }) => {
      // Update all accepted players to the new team
      await Promise.all(playerIds.map(async (playerId) => {
        await base44.entities.Player.update(playerId, { team_id: teamId });
        
        const existingTryout = tryouts.find(t => t.player_id === playerId);
        if (existingTryout) {
          await base44.entities.PlayerTryout.update(existingTryout.id, {
            next_season_status: 'Roster Finalized',
            registration_status: 'Not Signed'
          });
        }
      }));

      // Send confirmation messages
      for (const playerId of playerIds) {
        const player = players.find(p => p.id === playerId);
        const parentEmails = player.parent_emails || [player.email].filter(Boolean);
        
        for (const email of parentEmails) {
          await base44.entities.Message.create({
            sender_email: 'registration@michiganjaguars.com',
            sender_name: 'Michigan Jaguars Registration',
            recipient_email: email,
            recipient_name: player.full_name,
            subject: `Roster Confirmed - ${teamName} Registration`,
            content: `Congratulations! ${player.full_name} has been confirmed on the ${teamName} roster for the 2026/2027 season.\n\nNext steps:\n1. Complete registration (link will be sent shortly)\n2. Pay team fees\n3. Order uniform\n\nWelcome to the team!`
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['players']);
      queryClient.invalidateQueries(['tryouts']);
      setShowFinalizeDialog(false);
      setSelectedFinalizeTeam(null);
      toast.success('Roster finalized successfully');
    }
  });

  const extractAge = (ag) => {
    const match = ag?.match(/U-?(\d+)/i);
    return match ? parseInt(match[1]) : 0;
  };

  const uniqueAgeGroups = [...new Set(teams?.map(t => t.age_group).filter(ag => ag && typeof ag === 'string') || [])].sort((a, b) => extractAge(b) - extractAge(a));
  const uniqueLeagues = [...new Set(teams?.map(t => t.league).filter(l => l && typeof l === 'string') || [])];
  const uniqueBirthYears = [...new Set(players?.map(p => p.date_of_birth ? new Date(p.date_of_birth).getFullYear().toString() : null).filter(Boolean) || [])].sort((a, b) => b - a);
  const uniqueCurrentTeams = [...new Set(players?.map(p => teams?.find(t => t.id === p.team_id)?.name).filter(Boolean) || [])].sort();
  const uniqueSeasons = [...new Set(teams?.map(t => t.season || (t.name?.includes('26/27') ? '26/27' : t.name?.includes('25/26') ? '25/26' : null)).filter(Boolean) || [])].sort().reverse();

  const getPlayerWithTryoutData = (playerId) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return null;
    const tryout = tryouts.find(t => t.player_id === playerId);
    const evaluation = evaluations.filter(e => e.player_id === playerId).sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
    const assessment = assessments.filter(a => a.player_id === playerId).sort((a, b) => new Date(b.assessment_date) - new Date(a.assessment_date))[0];
    return { ...player, tryout: tryout || {}, evaluation, assessment };
  };

  const handleSendOffer = (player) => {
    const tryout = tryouts.find(t => t.player_id === player.id);
    setSelectedOfferPlayer(player);
    setSelectedOfferTeam(tryout?.next_year_team);
    setShowSendOfferDialog(true);
  };

  const handleFinalizeRoster = (team) => {
    setSelectedFinalizeTeam(team);
    setShowFinalizeDialog(true);
  };

  const handleBulkAssign = async () => {
    if (!bulkAssignTeam || selectedPlayers.length === 0) {
      toast.error('Select team and players');
      return;
    }
    
    try {
      await Promise.all(selectedPlayers.map(playerId => 
        updateTryoutMutation.mutateAsync({
          playerId,
          data: { next_year_team: bulkAssignTeam }
        })
      ));
      setSelectedPlayers([]);
      setBulkAssignTeam('');
      toast.success(`Assigned ${selectedPlayers.length} players to ${bulkAssignTeam}`);
    } catch (error) {
      toast.error('Failed to assign players');
    }
  };

  // Filter teams - Remove duplicates by team name
  const nextYearTeams = useMemo(() => {
    const seen = new Set();
    return (teams || []).filter(t => {
      if (!t.name || typeof t.name !== 'string') return false;
      
      // Filter by season
      const teamSeason = t.season || (t.name?.includes('26/27') ? '26/27' : t.name?.includes('25/26') ? '25/26' : null);
      const matchesSeason = teamFilterSeason === 'all' || teamSeason === teamFilterSeason;
      if (!matchesSeason) return false;
      
      // Remove duplicates
      if (seen.has(t.name)) return false;
      seen.add(t.name);
      
      const matchesSearch = typeof teamSearchTerm === 'string' && t.name.toLowerCase().includes(teamSearchTerm.toLowerCase());
      const matchesGender = teamFilterGender === 'all' || t.gender === teamFilterGender;
      const matchesBranch = teamFilterBranch === 'all' || (typeof t.branch === 'string' && t.branch === teamFilterBranch);
      const matchesAgeGroup = teamFilterAgeGroup === 'all' || (typeof t.age_group === 'string' && t.age_group === teamFilterAgeGroup);
      const matchesLeague = teamFilterLeague === 'all' || (typeof t.league === 'string' && t.league === teamFilterLeague);
      
      return matchesSearch && matchesGender && matchesBranch && matchesAgeGroup && matchesLeague;
    }).sort((a, b) => {
      const ageA = extractAge(a.age_group);
      const ageB = extractAge(b.age_group);
      if (ageA !== ageB) return ageB - ageA;
      const priority = { 'Girls Academy': 1, 'Aspire': 2, 'Green': 3, 'White': 4, 'Pre GA 1': 5, 'Pre GA 2': 6, 'Green White': 7 };
      const getName = (name) => {
        if (!name || typeof name !== 'string') return name;
        for (const key of Object.keys(priority)) {
          if (name.includes(key)) return key;
        }
        return name;
      };
      return (priority[getName(a.name)] || 99) - (priority[getName(b.name)] || 99);
    });
  }, [teams, teamSearchTerm, teamFilterGender, teamFilterBranch, teamFilterAgeGroup, teamFilterLeague, teamFilterSeason]);

  // Get unassigned players with comprehensive filtering
  const unassignedPlayers = useMemo(() => {
    return (players || []).map(p => getPlayerWithTryoutData(p.id))
      .filter(p => p && (!p.tryout?.next_year_team || !nextYearTeams.some(t => t.name && typeof t.name === 'string' && t.name === p.tryout?.next_year_team)))
      .filter(p => {
      const matchesSearch = p.full_name?.toLowerCase().includes(playerSearchTerm.toLowerCase());
      const matchesBranch = playerFilterBranch === 'all' || p.branch === playerFilterBranch;
      
      const playerTeam = (teams || []).find(t => t.id === p.team_id);
      const matchesAgeGroup = playerFilterAgeGroup === 'all' || playerTeam?.age_group === playerFilterAgeGroup;
      const matchesCurrentTeam = playerFilterCurrentTeam === 'all' || playerTeam?.name === playerFilterCurrentTeam;
      
      const birthYear = p.date_of_birth ? new Date(p.date_of_birth).getFullYear().toString() : null;
      const matchesBirthYear = playerFilterBirthYear === 'all' || birthYear === playerFilterBirthYear;
      
      const matchesTeamRole = playerFilterTeamRole === 'all' || 
        (playerFilterTeamRole === 'none' ? !p.tryout?.team_role : p.tryout?.team_role === playerFilterTeamRole);
      
      let matchesBirthdayRange = true;
      if (birthdayFrom && p.date_of_birth) {
        matchesBirthdayRange = matchesBirthdayRange && new Date(p.date_of_birth) >= new Date(birthdayFrom);
      }
      if (birthdayTo && p.date_of_birth) {
        matchesBirthdayRange = matchesBirthdayRange && new Date(p.date_of_birth) <= new Date(birthdayTo);
      }
      
      return matchesSearch && matchesBranch && matchesAgeGroup && matchesBirthYear && matchesTeamRole && matchesCurrentTeam && matchesBirthdayRange;
    }).sort((a, b) => {
      if (!a.date_of_birth) return 1;
      if (!b.date_of_birth) return -1;
      return new Date(a.date_of_birth) - new Date(b.date_of_birth);
    });
  }, [players, nextYearTeams, tryouts, teams, playerSearchTerm, playerFilterBranch, playerFilterAgeGroup, playerFilterTeamRole, playerFilterBirthYear, playerFilterCurrentTeam]);

  const getTeamPlayers = (teamName) => {
    if (!teamName || typeof teamName !== 'string') return [];
    return (players || []).map(p => getPlayerWithTryoutData(p.id))
      .filter(p => p && p.tryout?.next_year_team === teamName)
      .sort((a, b) => {
        if (!a.date_of_birth) return 1;
        if (!b.date_of_birth) return -1;
        return new Date(a.date_of_birth) - new Date(b.date_of_birth);
      });
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const playerId = draggableId;
    const destTeamName = destination.droppableId === 'unassigned' ? null : destination.droppableId;

    try {
      await updateTryoutMutation.mutateAsync({
        playerId,
        data: { next_year_team: destTeamName }
      });
      queryClient.invalidateQueries(['players']);
      queryClient.invalidateQueries(['tryouts']);
      toast.success(destTeamName ? `Assigned to ${destTeamName}` : 'Unassigned player');
    } catch (error) {
      toast.error('Failed to update player');
    }
  };



  return (
    <div className="p-4 md:p-6 max-w-[1900px] mx-auto">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
            Team Assignments 2026/2027
          </h1>
          <p className="text-slate-600 mt-2">Drag and drop players to assign them to next year's teams</p>
        </div>
        <Button onClick={() => setShowCreateTeamDialog(true)} className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 shadow-lg">
          <Plus className="w-4 h-4 mr-2" />
          Create Team
        </Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid lg:grid-cols-[1fr_480px] gap-6">
          {/* Teams Section */}
          <div>
            <Card className="mb-4 border-none shadow-xl bg-gradient-to-br from-white to-slate-50">
              <CardContent className="p-4">
                <Label className="text-sm font-bold text-slate-700 mb-3 block">Filter Teams</Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search..."
                    value={teamSearchTerm}
                    onChange={(e) => setTeamSearchTerm(e.target.value)}
                    className="pl-10 h-9 text-xs"
                  />
                </div>
                <Select value={teamFilterGender} onValueChange={setTeamFilterGender}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genders</SelectItem>
                    <SelectItem value="Female">Girls</SelectItem>
                    <SelectItem value="Male">Boys</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={teamFilterAgeGroup} onValueChange={setTeamFilterAgeGroup}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Age Group" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ages</SelectItem>
                    {uniqueAgeGroups?.map(ag => (
                      <SelectItem key={ag} value={ag}>{ag}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={teamFilterLeague} onValueChange={setTeamFilterLeague}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="League" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Leagues</SelectItem>
                    {uniqueLeagues?.map(league => (
                      <SelectItem key={league} value={league}>{league}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={teamFilterBranch} onValueChange={setTeamFilterBranch}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Branch" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {BRANCH_OPTIONS?.map(branch => (
                      <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={teamFilterSeason} onValueChange={setTeamFilterSeason}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Season" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Seasons</SelectItem>
                    {uniqueSeasons?.map(season => (
                      <SelectItem key={season} value={season}>{season}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              </CardContent>
            </Card>

            <div className="space-y-4" style={{ maxHeight: 'calc(100vh - 340px)', overflowY: 'auto' }}>
            {nextYearTeams?.map(team => {
              const teamPlayers = getTeamPlayers(team.name);
              const acceptedCount = teamPlayers.filter(p => p.tryout?.next_season_status === 'Accepted Offer').length;
              const pendingCount = teamPlayers.filter(p => 
                !p.tryout?.next_season_status || 
                p.tryout?.next_season_status === 'Considering Offer' || 
                p.tryout?.next_season_status === 'Offer Sent'
              ).length;
              
              return (
                <Card key={team.id} className="border-2 border-emerald-400 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-emerald-50 to-green-50">
                  <CardHeader className="pb-2 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 text-white shadow-md">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold truncate">{team.name}</div>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge className="bg-white/30 text-white text-[9px] px-1.5">{team.age_group}</Badge>
                          {team.league && <Badge className="bg-white/30 text-white text-[9px] px-1.5">{team.league}</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Badge className="bg-white text-slate-900 text-xs font-bold">{teamPlayers.length}</Badge>
                          {acceptedCount > 0 && <Badge className="bg-green-500 text-white text-xs">{acceptedCount}✓</Badge>}
                          {pendingCount > 0 && <Badge className="bg-yellow-500 text-white text-xs">{pendingCount}⏱</Badge>}
                        </div>
                        {teamPlayers.length > 0 && acceptedCount > 0 && (
                          <Button
                            onClick={() => handleFinalizeRoster(team)}
                            size="sm"
                            className="h-7 px-2 bg-white/20 hover:bg-white/30 text-white"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Finalize
                          </Button>
                        )}
                        <button onClick={() => deleteTeamMutation.mutate(team.id)} className="p-1 hover:bg-white/20 rounded transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                    <Droppable droppableId={team.name}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`min-h-[280px] space-y-1.5 p-2.5 rounded-xl transition-all ${snapshot.isDraggingOver ? 'bg-emerald-200 border-2 border-dashed border-emerald-500 scale-105' : 'bg-white/60'}`}
                        >
                          {teamPlayers?.map((player, index) => (
                            <Draggable key={player.id} draggableId={player.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  <PlayerEvaluationCard 
                                    player={player}
                                    team={(teams || []).find(t => t.id === player.team_id)}
                                    tryout={player.tryout}
                                    evaluation={player.evaluation}
                                    assessment={player.assessment}
                                    onSendOffer={handleSendOffer}
                                    isDragging={snapshot.isDragging}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          {teamPlayers.length === 0 && (
                            <div className="text-center py-12 text-slate-400 text-xs">
                              <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                              <p>Drop players here</p>
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
          </div>

          {/* Unassigned Players Sidebar */}
          <Card className="border-2 border-emerald-400 shadow-2xl sticky top-4 self-start bg-gradient-to-br from-emerald-50 to-green-50" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          <CardHeader className="pb-2 bg-gradient-to-r from-emerald-600 via-emerald-700 to-green-700 text-white shadow-md">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span className="font-bold">Unassigned Players</span>
                <Badge className="bg-white text-emerald-700 text-sm font-bold px-2">{unassignedPlayers.length}</Badge>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="text-white hover:bg-white/20 h-7 px-2"
              >
                {filtersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            <Collapsible open={filtersOpen}>
              <CollapsibleContent>
            <div className="space-y-2 mb-3">
              <Label className="text-xs font-bold text-slate-700">Filter Players</Label>
              <Input
                placeholder="Search players..."
                value={playerSearchTerm}
                onChange={(e) => setPlayerSearchTerm(e.target.value)}
                className="h-8 text-xs"
              />
              <Select value={playerFilterAgeGroup} onValueChange={setPlayerFilterAgeGroup}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Age Group" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Age Groups</SelectItem>
                  {uniqueAgeGroups.map(ag => (
                    <SelectItem key={ag} value={ag}>{ag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={playerFilterBirthYear} onValueChange={setPlayerFilterBirthYear}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Birth Year" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Birth Years</SelectItem>
                  {uniqueBirthYears?.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={playerFilterBranch} onValueChange={setPlayerFilterBranch}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Branch" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {BRANCH_OPTIONS.map(branch => (
                    <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={playerFilterTeamRole} onValueChange={setPlayerFilterTeamRole}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Team Role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {['Indispensable Player', 'GA Starter', 'GA Rotation', 'Aspire Starter', 'Aspire Rotation', 'United Starter', 'United Rotation']?.map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                  <SelectItem value="none">No Data</SelectItem>
                </SelectContent>
              </Select>
              <Select value={playerFilterCurrentTeam} onValueChange={setPlayerFilterCurrentTeam}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Current Team" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {uniqueCurrentTeams?.map(teamName => (
                    <SelectItem key={teamName} value={teamName}>{teamName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div>
                <Label className="text-[9px] text-slate-600">Birthday From</Label>
                <Input
                  type="date"
                  value={birthdayFrom}
                  onChange={(e) => setBirthdayFrom(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-[9px] text-slate-600">Birthday To</Label>
                <Input
                  type="date"
                  value={birthdayTo}
                  onChange={(e) => setBirthdayTo(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPlayerSearchTerm('');
                  setPlayerFilterBranch('all');
                  setPlayerFilterAgeGroup('all');
                  setPlayerFilterBirthYear('all');
                  setPlayerFilterTeamRole('all');
                  setPlayerFilterCurrentTeam('all');
                  setBirthdayFrom('');
                  setBirthdayTo('');
                }}
                className="h-8 text-xs mt-4"
              >
                Reset Filters
              </Button>
            </div>
              </CollapsibleContent>
            </Collapsible>
            
            {selectedPlayers.length > 0 && (
              <div className="mt-3 p-3 bg-emerald-100 rounded-lg border-2 border-emerald-400">
                <Label className="text-xs font-bold text-emerald-800 mb-2 block">
                  Bulk Assign {selectedPlayers.length} Selected Player{selectedPlayers.length > 1 ? 's' : ''}
                </Label>
                <div className="flex gap-2">
                  <Select value={bulkAssignTeam} onValueChange={setBulkAssignTeam}>
                    <SelectTrigger className="h-8 text-xs flex-1">
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {nextYearTeams?.map(team => (
                        <SelectItem key={team.id} value={team.name}>{team.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleBulkAssign} disabled={!bulkAssignTeam} className="h-8 bg-emerald-600 hover:bg-emerald-700 text-xs">
                    Assign
                  </Button>
                  <Button onClick={() => setSelectedPlayers([])} variant="outline" className="h-8 text-xs">
                    Clear
                  </Button>
                </div>
              </div>
            )}
            
            <Droppable droppableId="unassigned">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`space-y-1.5 p-2.5 rounded-xl overflow-y-auto transition-all ${snapshot.isDraggingOver ? 'bg-emerald-200 border-2 border-dashed border-emerald-500 scale-105' : 'bg-white/60'}`}
                  style={{ maxHeight: 'calc(100vh - 580px)' }}
                >
                  {unassignedPlayers?.map((player, index) => (
                    <Draggable key={player.id} draggableId={player.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="relative"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPlayers.includes(player.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              if (e.target.checked) {
                                setSelectedPlayers([...selectedPlayers, player.id]);
                              } else {
                                setSelectedPlayers(selectedPlayers.filter(id => id !== player.id));
                              }
                            }}
                            className="absolute top-2 right-2 w-4 h-4 rounded border-2 border-emerald-600 text-emerald-600 focus:ring-emerald-500 z-10"
                          />
                          <PlayerEvaluationCard 
                            player={player}
                            team={(teams || []).find(t => t.id === player.team_id)}
                            tryout={player.tryout}
                            evaluation={player.evaluation}
                            assessment={player.assessment}
                            onSendOffer={handleSendOffer}
                            isDragging={snapshot.isDragging}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {unassignedPlayers.length === 0 && (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-40" />
                      <p>No unassigned players</p>
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </CardContent>
        </Card>
      </div>
      </DragDropContext>

      <Dialog open={showCreateTeamDialog} onOpenChange={setShowCreateTeamDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Create 2026/2027 Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="font-semibold">Age Group *</Label>
              <Select value={teamForm.age_group} onValueChange={(v) => setTeamForm({...teamForm, age_group: v, name: ''})}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select age group" />
                </SelectTrigger>
                <SelectContent>
                  {['U-19', 'U-17', 'U-16', 'U-15', 'U-14', 'U-13', 'U-12', 'U-11', 'U-10', 'U-9']?.map(ag => (
                    <SelectItem key={ag} value={ag}>{ag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-semibold">Team Level *</Label>
              <Select 
                value={teamForm.name ? teamForm.name.split(' ').slice(1, -1).join(' ') : ''}
                onValueChange={(v) => {
                  const fullName = `${teamForm.age_group} ${v} 26/27`;
                  setTeamForm({...teamForm, name: fullName});
                }}
                disabled={!teamForm.age_group}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select team level" />
                </SelectTrigger>
                <SelectContent>
                  {teamForm.age_group && (parseInt(teamForm.age_group.match(/\d+/)?.[0]) >= 13) ? (
                    <>
                      <SelectItem value="Girls Academy">Girls Academy</SelectItem>
                      <SelectItem value="Aspire">Aspire</SelectItem>
                      <SelectItem value="Green">Green</SelectItem>
                      <SelectItem value="White">White</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="Pre GA 1">Pre GA 1</SelectItem>
                      <SelectItem value="Pre GA 2">Pre GA 2</SelectItem>
                      <SelectItem value="Green White">Green White</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-semibold">Gender *</Label>
              <Select value={teamForm.gender} onValueChange={(v) => setTeamForm({...teamForm, gender: v})}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-semibold">Branch</Label>
              <Select value={teamForm.branch} onValueChange={(v) => setTeamForm({...teamForm, branch: v})}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {BRANCH_OPTIONS.map(branch => (
                    <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-semibold">League</Label>
              <Select value={teamForm.league} onValueChange={(v) => setTeamForm({...teamForm, league: v})}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select league" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueLeagues.map(league => (
                    <SelectItem key={league} value={league}>{league}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-4 rounded-xl border-2 border-emerald-200">
              <Label className="text-xs text-slate-600 font-semibold">Preview Team Name:</Label>
              <p className="font-bold text-lg text-slate-900 mt-1">{teamForm.name || 'Select options above'}</p>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowCreateTeamDialog(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => createTeamMutation.mutate({
                ...teamForm,
                season: '26/27'
              })}
              disabled={!teamForm.name || !teamForm.age_group}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
            >
              Create Team
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SendOfferDialog
        open={showSendOfferDialog}
        onClose={() => {
          setShowSendOfferDialog(false);
          setSelectedOfferPlayer(null);
          setSelectedOfferTeam(null);
        }}
        player={selectedOfferPlayer}
        team={selectedOfferTeam}
        onSendOffer={(message) => {
          sendOfferMutation.mutate({
            playerId: selectedOfferPlayer.id,
            teamName: selectedOfferTeam,
            message
          });
        }}
        isPending={sendOfferMutation.isPending}
      />

      <FinalizeRosterDialog
        open={showFinalizeDialog}
        onClose={() => {
          setShowFinalizeDialog(false);
          setSelectedFinalizeTeam(null);
        }}
        team={selectedFinalizeTeam}
        players={selectedFinalizeTeam?.name ? getTeamPlayers(selectedFinalizeTeam.name) : []}
        onFinalize={() => {
          const teamPlayers = getTeamPlayers(selectedFinalizeTeam.name);
          const acceptedPlayerIds = teamPlayers
            .filter(p => p.tryout?.next_season_status === 'Accepted Offer')
            .map(p => p.id);
          
          finalizeRosterMutation.mutate({
            teamId: selectedFinalizeTeam.id,
            teamName: selectedFinalizeTeam.name,
            playerIds: acceptedPlayerIds
          });
        }}
        isPending={finalizeRosterMutation.isPending}
      />
    </div>
  );
}