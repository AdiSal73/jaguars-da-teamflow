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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Users, User, Plus, Trash2, ChevronDown, ChevronUp, Send, CheckCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { BRANCH_OPTIONS } from '../components/constants/leagueOptions';
import { TeamRoleBadge } from '@/components/utils/teamRoleBadge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import PlayerEvaluationCard from '../components/tryout/PlayerEvaluationCard';
import SendOfferDialog from '../components/tryout/SendOfferDialog';
import FinalizeRosterDialog from '../components/tryout/FinalizeRosterDialog';
import TryoutPoolManager from '../components/tryout/TryoutPoolManager';

// Calculate next year's age group based on date of birth
const calculateNextYearAgeGroup = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const cutoffDate = new Date('2027-08-01');
  let age = cutoffDate.getFullYear() - dob.getFullYear();
  const monthDiff = cutoffDate.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && cutoffDate.getDate() < dob.getDate())) {
    age--;
  }
  return `U-${age}`;
};

export default function TeamTryout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('');
  const [teamSearchTerm, setTeamSearchTerm] = useState('');
  const [teamFilterGender, setTeamFilterGender] = useState('all');
  const [teamFilterLeague, setTeamFilterLeague] = useState('all');
  
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
  const [showAIFormationDialog, setShowAIFormationDialog] = useState(false);
  const [aiFormParams, setAiFormParams] = useState({ gender: '', age_groups: [], league_preference: '' });
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

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

  const { data: poolPlayers = [] } = useQuery({
    queryKey: ['tryoutPool'],
    queryFn: () => base44.entities.TryoutPool.list()
  });

  const createPlayerMutation = useMutation({
    mutationFn: (playerData) => base44.entities.Player.create(playerData),
    onSuccess: () => {
      queryClient.invalidateQueries(['players']);
    }
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
      let tryoutRecordId;
      
      if (existingTryout) {
        await base44.entities.PlayerTryout.update(existingTryout.id, {
          next_season_status: 'Offer Sent'
        });
        tryoutRecordId = existingTryout.id;
      } else {
        const newTryout = await base44.entities.PlayerTryout.create({
          player_id: playerId,
          player_name: player.full_name,
          next_year_team: teamName,
          next_season_status: 'Offer Sent'
        });
        tryoutRecordId = newTryout.id;
      }

      // Create response link
      const responseUrl = `${window.location.origin}${createPageUrl('OfferResponse')}?tryout=${tryoutRecordId}`;
      const fullMessage = `${message}\n\n---\n\nTo respond to this offer, please click the link below:\n${responseUrl}`;

      // Send email to all parent contacts
      for (const email of parentEmails) {
        await base44.entities.Message.create({
          sender_email: 'tryouts@michiganjaguars.com',
          sender_name: 'Michigan Jaguars Tryouts',
          recipient_email: email,
          recipient_name: player.full_name,
          subject: `Team Offer for ${player.full_name} - ${teamName}`,
          content: fullMessage
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

  const removeFromTeamMutation = useMutation({
    mutationFn: async ({ playerId, playerData }) => {
      // Remove next_year_team assignment
      const existingTryout = tryouts.find(t => t.player_id === playerId);
      if (existingTryout) {
        await base44.entities.PlayerTryout.update(existingTryout.id, {
          next_year_team: null,
          next_season_status: 'N/A'
        });
      }
      
      // Check if already in pool, update instead of create
      const existingPoolEntry = poolPlayers.find(pp => pp.player_id === playerId);
      if (existingPoolEntry) {
        await base44.entities.TryoutPool.update(existingPoolEntry.id, {
          next_year_team: null,
          status: 'Pending'
        });
      } else {
        // Add back to pool
        await base44.entities.TryoutPool.create({
          player_id: playerId,
          player_name: playerData.full_name,
          player_email: playerData.email || playerData.player_email,
          parent_emails: playerData.parent_emails || [],
          date_of_birth: playerData.date_of_birth,
          age_group: playerData.age_group,
          gender: playerData.gender,
          primary_position: playerData.primary_position,
          current_team: playerData.tryout?.current_team,
          branch: playerData.branch,
          status: 'Pending'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tryouts']);
      queryClient.invalidateQueries(['tryoutPool']);
      toast.success('Player returned to pool');
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

  // Get unique age groups from 26/27 teams
  const uniqueAgeGroups = useMemo(() => {
    const nextSeasonTeams = teams.filter(t => t.season === '26/27' || t.name?.includes('26/27'));
    return [...new Set(nextSeasonTeams.map(t => t.age_group).filter(Boolean))].sort((a, b) => extractAge(b) - extractAge(a));
  }, [teams]);

  // Set initial selected age group
  React.useEffect(() => {
    if (!selectedAgeGroup && uniqueAgeGroups.length > 0) {
      setSelectedAgeGroup(uniqueAgeGroups[0]);
    }
  }, [uniqueAgeGroups, selectedAgeGroup]);

  const uniqueLeagues = [...new Set(teams?.map(t => t.league).filter(l => l && typeof l === 'string') || [])];

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

  const handleRemovePlayer = (player) => {
    removeFromTeamMutation.mutate({ playerId: player.id, playerData: player });
  };

  const handleGenerateAIFormation = async () => {
    setIsGeneratingAI(true);
    try {
      const response = await base44.functions.invoke('autoFormTeams', aiFormParams);
      setAiSuggestions(response.data);
      toast.success('AI suggestions generated');
    } catch (error) {
      toast.error('Failed to generate suggestions');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleApplyAISuggestions = async () => {
    if (!aiSuggestions?.assignments) return;
    
    try {
      await Promise.all(aiSuggestions.assignments.map(assignment =>
        updateTryoutMutation.mutateAsync({
          playerId: assignment.player_id,
          data: { next_year_team: assignment.team_name }
        })
      ));
      setShowAIFormationDialog(false);
      setAiSuggestions(null);
      toast.success('AI suggestions applied');
    } catch (error) {
      toast.error('Failed to apply suggestions');
    }
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

  // Filter teams for selected age group
  const filteredTeams = useMemo(() => {
    const seen = new Set();
    return (teams || []).filter(t => {
      if (!t.name || typeof t.name !== 'string') return false;
      
      // Filter by 26/27 season
      const teamSeason = t.season || (t.name?.includes('26/27') ? '26/27' : null);
      if (teamSeason !== '26/27') return false;
      
      // Filter by selected age group
      if (t.age_group !== selectedAgeGroup) return false;
      
      // Remove duplicates
      if (seen.has(t.name)) return false;
      seen.add(t.name);
      
      const matchesSearch = t.name.toLowerCase().includes(teamSearchTerm.toLowerCase());
      const matchesGender = teamFilterGender === 'all' || t.gender === teamFilterGender;
      const matchesLeague = teamFilterLeague === 'all' || t.league === teamFilterLeague;
      
      return matchesSearch && matchesGender && matchesLeague;
    }).sort((a, b) => {
      const priority = { 
        'Girls Academy': 1, 
        'Girls Academy Aspire': 2,
        'Aspire': 3, 
        'Green': 4, 
        'White': 5, 
        'Pre GA 1': 6, 
        'Pre GA 2': 7, 
        'Green White': 8 
      };
      const getName = (name) => {
        for (const key of Object.keys(priority)) {
          if (name?.includes(key)) return key;
        }
        return name;
      };
      return (priority[getName(a.name)] || 99) - (priority[getName(b.name)] || 99);
    });
  }, [teams, selectedAgeGroup, teamSearchTerm, teamFilterGender, teamFilterLeague]);

  // Filter pool players by selected age group
  const filteredPoolPlayers = useMemo(() => {
    return poolPlayers
      .filter(pp => {
        // Check not assigned to any team
        if (pp.player_id) {
          const tryout = tryouts.find(t => t.player_id === pp.player_id);
          if (tryout?.next_year_team) return false;
        }
        if (pp.next_year_team) return false;
        
        // Filter by age group
        const nextYearAge = calculateNextYearAgeGroup(pp.date_of_birth);
        return nextYearAge === selectedAgeGroup;
      })
      .map(pp => {
        if (pp.player_id) {
          const player = players.find(p => p.id === pp.player_id);
          if (player) {
            return getPlayerWithTryoutData(player.id);
          }
        }
        return {
          id: pp.id,
          full_name: pp.player_name,
          primary_position: pp.primary_position,
          age_group: pp.age_group,
          gender: pp.gender,
          date_of_birth: pp.date_of_birth,
          grad_year: pp.grad_year,
          isPoolOnly: true,
          poolStatus: pp.status,
          tryout: {}
        };
      })
      .filter(Boolean);
  }, [poolPlayers, players, tryouts, selectedAgeGroup]);

  const getTeamPlayers = (teamName) => {
    if (!teamName || typeof teamName !== 'string') return [];
    
    // Get players with tryout data where next_year_team matches
    const assignedPlayers = (players || []).map(p => getPlayerWithTryoutData(p.id))
      .filter(p => p && p.tryout?.next_year_team === teamName);
    
    // Get pool players assigned to this team (external players not yet in Player entity)
    const poolAssigned = poolPlayers
      .filter(pp => !pp.player_id && pp.next_year_team === teamName)
      .map(pp => ({
        id: pp.id,
        full_name: pp.player_name,
        primary_position: pp.primary_position,
        age_group: pp.age_group,
        date_of_birth: pp.date_of_birth,
        isPoolOnly: true,
        tryout: { next_season_status: 'Pending', next_year_team: teamName }
      }));
    
    return [...assignedPlayers, ...poolAssigned].sort((a, b) => {
      if (!a.date_of_birth) return 1;
      if (!b.date_of_birth) return -1;
      return new Date(a.date_of_birth) - new Date(b.date_of_birth);
    });
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const destTeamName = destination.droppableId;

    try {
      if (source.droppableId === 'tryout-pool') {
        // Dragging from pool - draggableId is either player_id or pool entry id
        const poolEntry = poolPlayers.find(pp => pp.player_id === draggableId || pp.id === draggableId);
        
        if (!poolEntry) {
          toast.error('Player not found in pool');
          return;
        }

        if (poolEntry.player_id) {
          // Existing player - update tryout and pool entry
          await updateTryoutMutation.mutateAsync({
            playerId: poolEntry.player_id,
            data: { next_year_team: destTeamName }
          });
          // Update pool entry instead of deleting
          await base44.entities.TryoutPool.update(poolEntry.id, {
            next_year_team: destTeamName,
            status: 'Invited'
          });
        } else {
          // New external player - create player entity first
          const newPlayer = await createPlayerMutation.mutateAsync({
            full_name: poolEntry.player_name,
            email: poolEntry.player_email,
            parent_emails: poolEntry.parent_emails || [],
            date_of_birth: poolEntry.date_of_birth,
            age_group: poolEntry.age_group,
            gender: poolEntry.gender,
            primary_position: poolEntry.primary_position,
            branch: poolEntry.branch,
            is_tryout_player: true,
            tryout_notes: poolEntry.notes
          });
          
          // Create tryout record with current team info
          await updateTryoutMutation.mutateAsync({
            playerId: newPlayer.id,
            data: { 
              next_year_team: destTeamName,
              current_team: poolEntry.current_team
            }
          });
          
          // Update pool entry
          await base44.entities.TryoutPool.update(poolEntry.id, {
            player_id: newPlayer.id,
            next_year_team: destTeamName,
            status: 'Invited'
          });
        }
      } else {
        // Moving between teams
        await updateTryoutMutation.mutateAsync({
          playerId: draggableId,
          data: { next_year_team: destTeamName }
        });
      }
      
      queryClient.invalidateQueries(['players']);
      queryClient.invalidateQueries(['tryouts']);
      queryClient.invalidateQueries(['tryoutPool']);
      toast.success(`Assigned to ${destTeamName}`);
    } catch (error) {
      console.error('Drag error:', error);
      toast.error('Failed to assign player');
    }
  };



  return (
    <div className="p-4 md:p-6 max-w-[1900px] mx-auto">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
            Team Assignments 2026/2027
          </h1>
          <p className="text-slate-600 mt-2">Select an age group to manage teams and tryout pool</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAIFormationDialog(true)} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg">
            <Sparkles className="w-4 h-4 mr-2" />
            Auto Team Formation
          </Button>
          <Button onClick={() => setShowCreateTeamDialog(true)} className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 shadow-lg">
            <Plus className="w-4 h-4 mr-2" />
            Create Team
          </Button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Tabs value={selectedAgeGroup} onValueChange={setSelectedAgeGroup} className="w-full">
          <TabsList className="grid w-full mb-4" style={{ gridTemplateColumns: `repeat(${uniqueAgeGroups.length}, minmax(0, 1fr))` }}>
            {uniqueAgeGroups.map(age => {
              const teamsInAge = teams.filter(t => t.age_group === age && (t.season === '26/27' || t.name?.includes('26/27'))).length;
              const playersInAge = poolPlayers.filter(pp => {
                const nextYearAge = calculateNextYearAgeGroup(pp.date_of_birth);
                return nextYearAge === age && !pp.next_year_team;
              }).length;
              return (
                <TabsTrigger key={age} value={age} className="relative">
                  <div className="flex items-center gap-2">
                    <span>{age}</span>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-[10px] px-1">{teamsInAge}T</Badge>
                      <Badge className="bg-blue-500 text-white text-[10px] px-1">{playersInAge}P</Badge>
                    </div>
                  </div>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {uniqueAgeGroups.map(age => (
            <TabsContent key={age} value={age}>
              <div className="grid lg:grid-cols-[1fr_420px] gap-6">
                {/* Teams Section */}
                <div>
                  <Card className="mb-4 border-none shadow-xl bg-gradient-to-br from-white to-slate-50">
                    <CardContent className="p-4">
                      <Label className="text-sm font-bold text-slate-700 mb-3 block">Filter Teams</Label>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            placeholder="Search teams..."
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
                        <Select value={teamFilterLeague} onValueChange={setTeamFilterLeague}>
                          <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="League" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Leagues</SelectItem>
                            {uniqueLeagues?.map(league => (
                              <SelectItem key={league} value={league}>{league}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
              </CardContent>
            </Card>

                  <div className="space-y-4" style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
                    {filteredTeams?.map(team => {
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
                          className={`min-h-[280px] p-2.5 rounded-xl transition-all ${snapshot.isDraggingOver ? 'bg-emerald-200 border-2 border-dashed border-emerald-500 scale-105' : 'bg-white/60'}`}
                        >
                          <div className="grid grid-cols-2 gap-2">
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
                                     onRemove={handleRemovePlayer}
                                     isDragging={snapshot.isDragging}
                                    />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          </div>
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

                {/* Tryout Pool Sidebar - Filtered by age group */}
                <div>
                  <Card className="border-2 border-blue-400 shadow-2xl bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardHeader className="pb-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          <span className="font-bold">{selectedAgeGroup} Tryout Pool</span>
                          <Badge className="bg-white text-blue-700 text-sm font-bold px-2">{filteredPoolPlayers.length}</Badge>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                      <Droppable droppableId="tryout-pool">
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`space-y-1.5 overflow-y-auto transition-all ${snapshot.isDraggingOver ? 'bg-blue-200 rounded-xl' : ''}`}
                            style={{ maxHeight: 'calc(100vh - 400px)' }}
                          >
                            {filteredPoolPlayers.map((player, index) => (
                              <Draggable key={player.id} draggableId={player.isPoolOnly ? player.id : player.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                  >
                                    <PlayerEvaluationCard 
                                      player={player}
                                      team={teams.find(t => t.id === player.team_id)}
                                      tryout={player.tryout}
                                      evaluation={player.evaluation}
                                      assessment={player.assessment}
                                      isDragging={snapshot.isDragging}
                                      onRemove={handleRemovePlayer}
                                    />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                            {filteredPoolPlayers.length === 0 && (
                              <div className="text-center py-8 text-slate-400 text-xs">
                                <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                <p>No players in {selectedAgeGroup} pool</p>
                              </div>
                            )}
                          </div>
                        )}
                      </Droppable>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
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

      <Dialog open={showAIFormationDialog} onOpenChange={setShowAIFormationDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              AI-Powered Team Formation
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-slate-700">
                Let AI analyze player performance data, coach recommendations, and team balance requirements to suggest optimal team assignments.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-semibold">Gender</Label>
                <Select value={aiFormParams.gender} onValueChange={(v) => setAiFormParams({...aiFormParams, gender: v})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-semibold">League Preference</Label>
                <Select value={aiFormParams.league_preference} onValueChange={(v) => setAiFormParams({...aiFormParams, league_preference: v})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Any league" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All</SelectItem>
                    {uniqueLeagues.map(league => (
                      <SelectItem key={league} value={league}>{league}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!aiSuggestions ? (
              <Button
                onClick={handleGenerateAIFormation}
                disabled={isGeneratingAI}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isGeneratingAI ? 'Generating AI Suggestions...' : 'Generate Team Suggestions'}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="font-bold text-green-900 mb-2">AI Formation Summary</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-slate-600">Total Assigned:</span>
                      <span className="font-bold ml-2">{aiSuggestions.summary?.total_assigned || 0}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Unassigned:</span>
                      <span className="font-bold ml-2">{aiSuggestions.summary?.unassigned || 0}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Teams:</span>
                      <span className="font-bold ml-2">{Object.keys(aiSuggestions.summary?.team_sizes || {}).length}</span>
                    </div>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2">
                  {aiSuggestions.assignments?.map((assignment, idx) => {
                    const player = players.find(p => p.id === assignment.player_id);
                    return (
                      <div key={idx} className="p-3 bg-white rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">{player?.full_name || 'Unknown'}</div>
                            <div className="text-xs text-slate-600">{assignment.team_name}</div>
                          </div>
                          <Badge className="bg-purple-100 text-purple-800 text-xs">
                            {player?.primary_position}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{assignment.reasoning}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setAiSuggestions(null)}
                    className="flex-1"
                  >
                    Regenerate
                  </Button>
                  <Button
                    onClick={handleApplyAISuggestions}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
                  >
                    Apply All Suggestions
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}