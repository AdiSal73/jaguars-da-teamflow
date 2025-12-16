import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Users, User, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { BRANCH_OPTIONS } from '../components/constants/leagueOptions';

export default function TeamTryout() {
  const queryClient = useQueryClient();
  const [teamSearchTerm, setTeamSearchTerm] = useState('');
  const [teamFilterGender, setTeamFilterGender] = useState('all');
  const [teamFilterBranch, setTeamFilterBranch] = useState('all');
  const [teamFilterAgeGroup, setTeamFilterAgeGroup] = useState('all');
  const [teamFilterLeague, setTeamFilterLeague] = useState('all');
  
  const [playerSearchTerm, setPlayerSearchTerm] = useState('');
  const [playerFilterBranch, setPlayerFilterBranch] = useState('all');
  const [playerFilterAgeGroup, setPlayerFilterAgeGroup] = useState('all');
  const [playerFilterTeamRole, setPlayerFilterTeamRole] = useState('all');
  const [playerFilterBirthYear, setPlayerFilterBirthYear] = useState('all');
  
  const [showCreateTeamDialog, setShowCreateTeamDialog] = useState(false);
  const [teamForm, setTeamForm] = useState({
    name: '',
    age_group: '',
    gender: 'Female',
    branch: '',
    league: ''
  });

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

  const extractAge = (ag) => {
    const match = ag?.match(/U-?(\d+)/i);
    return match ? parseInt(match[1]) : 0;
  };

  const uniqueAgeGroups = [...new Set(teams.map(t => t.age_group).filter(ag => ag && typeof ag === 'string'))].sort((a, b) => extractAge(b) - extractAge(a));
  const uniqueLeagues = [...new Set(teams.map(t => t.league).filter(l => l && typeof l === 'string'))];
  const uniqueBirthYears = [...new Set(players.map(p => p.date_of_birth ? new Date(p.date_of_birth).getFullYear().toString() : null).filter(Boolean))].sort((a, b) => b - a);

  // Filter teams for 26/27 season - Remove duplicates by team name
  const nextYearTeams = useMemo(() => {
    const seen = new Set();
    return teams.filter(t => {
      if (!t.name || typeof t.name !== 'string') return false;
      const is2627 = t.name.includes('26/27') || (t.season && typeof t.season === 'string' && t.season.includes('26/27'));
      if (!is2627) return false;
      
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
  }, [teams, teamSearchTerm, teamFilterGender, teamFilterBranch, teamFilterAgeGroup, teamFilterLeague]);

  // Get unassigned players with comprehensive filtering
  const unassignedPlayers = useMemo(() => {
    return players.filter(p => {
      if (!p.next_year_team) return true;
      const hasValidNextTeam = nextYearTeams.some(t => t.name && typeof t.name === 'string' && t.name === p.next_year_team);
      return !hasValidNextTeam;
    }).filter(p => {
      const matchesSearch = p.full_name?.toLowerCase().includes(playerSearchTerm.toLowerCase());
      const matchesBranch = playerFilterBranch === 'all' || p.branch === playerFilterBranch;
      
      const playerTeam = teams.find(t => t.id === p.team_id);
      const matchesAgeGroup = playerFilterAgeGroup === 'all' || playerTeam?.age_group === playerFilterAgeGroup;
      
      const birthYear = p.date_of_birth ? new Date(p.date_of_birth).getFullYear().toString() : null;
      const matchesBirthYear = playerFilterBirthYear === 'all' || birthYear === playerFilterBirthYear;
      
      const playerTryout = tryouts.find(t => t.player_id === p.id);
      const matchesTeamRole = playerFilterTeamRole === 'all' || 
        (playerFilterTeamRole === 'none' ? !playerTryout?.team_role : playerTryout?.team_role === playerFilterTeamRole);
      
      return matchesSearch && matchesBranch && matchesAgeGroup && matchesBirthYear && matchesTeamRole;
    }).sort((a, b) => {
      if (!a.date_of_birth) return 1;
      if (!b.date_of_birth) return -1;
      return new Date(a.date_of_birth) - new Date(b.date_of_birth);
    });
  }, [players, nextYearTeams, tryouts, teams, playerSearchTerm, playerFilterBranch, playerFilterAgeGroup, playerFilterTeamRole, playerFilterBirthYear]);

  const getTeamPlayers = (teamName) => {
    if (!teamName || typeof teamName !== 'string') return [];
    return players.filter(p => p.next_year_team && typeof p.next_year_team === 'string' && p.next_year_team === teamName).sort((a, b) => {
      if (!a.date_of_birth) return 1;
      if (!b.date_of_birth) return -1;
      return new Date(a.date_of_birth) - new Date(b.date_of_birth);
    });
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination || source.droppableId === destination.droppableId) return;

    const playerId = draggableId;
    const destTeam = destination.droppableId === 'unassigned' ? null : destination.droppableId;

    try {
      await updateTryoutMutation.mutateAsync({
        playerId,
        data: { next_year_team: destTeam }
      });
      toast.success('Player assignment updated');
    } catch (error) {
      toast.error('Failed to update player');
    }
  };

  const PlayerCard = ({ player, isDragging }) => {
    const tryout = tryouts.find(t => t.player_id === player.id);
    const team = teams.find(t => t.id === player.team_id);
    const age = player.date_of_birth ? new Date().getFullYear() - new Date(player.date_of_birth).getFullYear() : null;
    
    return (
      <div className={`p-2.5 bg-white border-2 rounded-xl transition-all ${isDragging ? 'shadow-2xl border-emerald-500 rotate-2 scale-105' : 'border-slate-200 hover:border-emerald-300 hover:shadow-lg'}`}>
        <div className="flex items-start gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-md">
            {player.jersey_number || <User className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-xs text-slate-900 truncate">{player.full_name}</div>
            <div className="text-[10px] text-slate-600 font-medium">{player.primary_position}</div>
            <div className="flex flex-wrap gap-0.5 mt-1.5">
              {team?.age_group && <Badge className="text-[8px] px-1.5 py-0.5 bg-slate-100 text-slate-700 font-semibold">{team.age_group}</Badge>}
              {age && <Badge className="text-[8px] px-1.5 py-0.5 bg-blue-100 text-blue-800 font-semibold">{age}y</Badge>}
              {tryout?.team_role && <Badge className="text-[8px] px-1.5 py-0.5 bg-purple-100 text-purple-800 font-semibold">{tryout.team_role.replace('Indispensable Player', 'IND').replace(' Starter', '').replace(' Rotation', ' R')}</Badge>}
              {tryout?.recommendation && (
                <Badge className={`text-[8px] px-1.5 py-0.5 font-bold ${
                  tryout.recommendation === 'Move up' ? 'bg-emerald-500 text-white' :
                  tryout.recommendation === 'Move down' ? 'bg-orange-500 text-white' :
                  'bg-blue-500 text-white'
                }`}>
                  {tryout.recommendation === 'Move up' ? '⬆️' : tryout.recommendation === 'Move down' ? '⬇️' : '➡️'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    );
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

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
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
                    {uniqueAgeGroups.map(ag => (
                      <SelectItem key={ag} value={ag}>{ag}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={teamFilterLeague} onValueChange={setTeamFilterLeague}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="League" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Leagues</SelectItem>
                    {uniqueLeagues.map(league => (
                      <SelectItem key={league} value={league}>{league}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={teamFilterBranch} onValueChange={setTeamFilterBranch}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Branch" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {BRANCH_OPTIONS.map(branch => (
                      <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4" style={{ maxHeight: 'calc(100vh - 340px)', overflowY: 'auto' }}>
              {nextYearTeams.map(team => {
                const teamPlayers = getTeamPlayers(team.name);
                return (
                  <Card key={team.id} className={`border-2 shadow-lg hover:shadow-xl transition-all ${team.gender === 'Male' ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100' : 'border-pink-400 bg-gradient-to-br from-pink-50 to-pink-100'}`}>
                    <CardHeader className={`pb-2 ${team.gender === 'Male' ? 'bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700' : 'bg-gradient-to-r from-pink-600 via-pink-700 to-rose-700'} text-white shadow-md`}>
                      <CardTitle className="text-sm flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-bold truncate">{team.name}</div>
                          <div className="flex items-center gap-1 mt-1">
                            <Badge className="bg-white/30 text-white text-[9px] px-1.5">{team.age_group}</Badge>
                            {team.league && <Badge className="bg-white/30 text-white text-[9px] px-1.5">{team.league}</Badge>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge className="bg-white text-slate-900 text-xs font-bold">{teamPlayers.length}</Badge>
                          <button onClick={() => deleteTeamMutation.mutate(team.id)} className="ml-1 p-1 hover:bg-white/20 rounded transition-colors">
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
                            className={`min-h-[280px] space-y-1.5 p-2.5 rounded-xl transition-all ${snapshot.isDraggingOver ? `${team.gender === 'Male' ? 'bg-blue-200' : 'bg-pink-200'} border-2 border-dashed ${team.gender === 'Male' ? 'border-blue-500' : 'border-pink-500'} scale-105` : 'bg-white/60'}`}
                          >
                            {teamPlayers.map((player, index) => (
                              <Draggable key={player.id} draggableId={player.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                  >
                                    <PlayerCard player={player} isDragging={snapshot.isDragging} />
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
          </DragDropContext>
        </div>

        {/* Unassigned Players Sidebar */}
        <Card className="border-2 border-emerald-400 shadow-2xl sticky top-4 self-start bg-gradient-to-br from-emerald-50 to-green-50" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          <CardHeader className="pb-2 bg-gradient-to-r from-emerald-600 via-emerald-700 to-green-700 text-white shadow-md">
            <CardTitle className="text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span className="font-bold">Unassigned Players</span>
              </div>
              <Badge className="bg-white text-emerald-700 text-sm font-bold px-2">{unassignedPlayers.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
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
                  {uniqueBirthYears.map(year => (
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
                  {['Indispensable Player', 'GA Starter', 'GA Rotation', 'Aspire Starter', 'Aspire Rotation', 'United Starter', 'United Rotation'].map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                  <SelectItem value="none">No Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="unassigned">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-1.5 p-2.5 rounded-xl overflow-y-auto transition-all ${snapshot.isDraggingOver ? 'bg-emerald-200 border-2 border-dashed border-emerald-500 scale-105' : 'bg-white/60'}`}
                    style={{ maxHeight: 'calc(100vh - 580px)' }}
                  >
                    {unassignedPlayers.map((player, index) => (
                      <Draggable key={player.id} draggableId={player.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <PlayerCard player={player} isDragging={snapshot.isDragging} />
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
            </DragDropContext>
          </CardContent>
        </Card>
      </div>

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
                  {['U-19', 'U-17', 'U-16', 'U-15', 'U-14', 'U-13', 'U-12', 'U-11', 'U-10', 'U-9'].map(ag => (
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
    </div>
  );
}