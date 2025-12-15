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
import { Search, Users, User, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { BRANCH_OPTIONS } from '../components/constants/leagueOptions';

export default function TeamTryout() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');
  const [filterAgeGroup, setFilterAgeGroup] = useState('all');
  const [playerSearchTerm, setPlayerSearchTerm] = useState('');
  const [showCreateTeamDialog, setShowCreateTeamDialog] = useState(false);
  const [teamForm, setTeamForm] = useState({
    name: '',
    age_group: '',
    gender: 'Female',
    branch: ''
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

  const updatePlayerMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Player.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['players']);
      queryClient.invalidateQueries(['tryouts']);
    }
  });

  const createTeamMutation = useMutation({
    mutationFn: (data) => base44.entities.Team.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['teams']);
      setShowCreateTeamDialog(false);
      setTeamForm({ name: '', age_group: '', gender: 'Female', branch: '' });
      toast.success('Team created');
    }
  });

  // Filter teams for 26/27 season
  const nextYearTeams = useMemo(() => {
    const extractAge = (ag) => {
      const match = ag?.match(/U-?(\d+)/i);
      return match ? parseInt(match[1]) : 0;
    };

    return teams.filter(t => {
      const is2627 = t.name?.includes('26/27') || t.season?.includes('26/27');
      if (!is2627) return false;
      
      const matchesSearch = t.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGender = filterGender === 'all' || t.gender === filterGender;
      const matchesBranch = filterBranch === 'all' || t.branch === filterBranch;
      const matchesAgeGroup = filterAgeGroup === 'all' || t.age_group === filterAgeGroup;
      
      return matchesSearch && matchesGender && matchesBranch && matchesAgeGroup;
    }).sort((a, b) => {
      // Sort by age group descending (U19 first)
      const ageA = extractAge(a.age_group);
      const ageB = extractAge(b.age_group);
      if (ageA !== ageB) return ageB - ageA;
      // Then by team hierarchy
      const priority = { 'Girls Academy': 1, 'Aspire': 2, 'Green': 3, 'White': 4, 'Pre GA 1': 5, 'Pre GA 2': 6, 'Green White': 7 };
      const getName = (name) => {
        for (const key of Object.keys(priority)) {
          if (name?.includes(key)) return key;
        }
        return name;
      };
      return (priority[getName(a.name)] || 99) - (priority[getName(b.name)] || 99);
    });
  }, [teams, searchTerm, filterGender, filterBranch, filterAgeGroup]);

  // Get unassigned players
  const unassignedPlayers = useMemo(() => {
    return players.filter(p => {
      if (!p.next_year_team) return true;
      const hasValidNextTeam = nextYearTeams.some(t => t.name === p.next_year_team);
      return !hasValidNextTeam;
    }).filter(p => {
      const matchesSearch = p.full_name?.toLowerCase().includes(playerSearchTerm.toLowerCase());
      return matchesSearch;
    }).sort((a, b) => {
      // Sort oldest to youngest
      if (!a.date_of_birth) return 1;
      if (!b.date_of_birth) return -1;
      return new Date(a.date_of_birth) - new Date(b.date_of_birth);
    });
  }, [players, nextYearTeams, playerSearchTerm]);

  // Get players by team
  const getTeamPlayers = (teamName) => {
    return players.filter(p => p.next_year_team === teamName).sort((a, b) => {
      // Sort oldest to youngest
      if (!a.date_of_birth) return 1;
      if (!b.date_of_birth) return -1;
      return new Date(a.date_of_birth) - new Date(b.date_of_birth);
    });
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    const playerId = draggableId;
    const sourceTeam = source.droppableId === 'unassigned' ? null : source.droppableId;
    const destTeam = destination.droppableId === 'unassigned' ? null : destination.droppableId;

    if (sourceTeam === destTeam) return;

    try {
      await updatePlayerMutation.mutateAsync({
        id: playerId,
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
      <div className={`p-2.5 bg-white border-2 rounded-lg transition-all ${isDragging ? 'shadow-2xl border-emerald-500 rotate-2' : 'border-slate-200 hover:border-emerald-300 hover:shadow-md'}`}>
        <div className="flex items-start gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            {player.jersey_number || <User className="w-3 h-3" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-xs text-slate-900 truncate">{player.full_name}</div>
            <div className="text-[10px] text-slate-500">{player.primary_position}</div>
            <div className="flex flex-wrap gap-0.5 mt-1">
              {team?.age_group && <Badge className="text-[8px] px-1 py-0 bg-slate-100 text-slate-700">{team.age_group}</Badge>}
              {age && <Badge className="text-[8px] px-1 py-0 bg-blue-100 text-blue-700">{age}y</Badge>}
              {tryout?.team_role && <Badge className="text-[8px] px-1 py-0 bg-purple-100 text-purple-700">{tryout.team_role}</Badge>}
              {tryout?.recommendation && (
                <Badge className={`text-[8px] px-1 py-0 ${
                  tryout.recommendation === 'Move up' ? 'bg-emerald-100 text-emerald-700' :
                  tryout.recommendation === 'Move down' ? 'bg-orange-100 text-orange-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {tryout.recommendation}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const uniqueAgeGroups = [...new Set(teams.map(t => t.age_group).filter(Boolean))].sort((a, b) => {
    const extractAge = (ag) => {
      const match = ag?.match(/U-?(\d+)/i);
      return match ? parseInt(match[1]) : 0;
    };
    return extractAge(b) - extractAge(a);
  });

  return (
    <div className="p-4 md:p-6 max-w-[1800px] mx-auto">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Team Assignments - 2026/2027 Season</h1>
          <p className="text-slate-600 mt-1">Drag and drop players to assign them to next year's teams</p>
        </div>
        <Button onClick={() => setShowCreateTeamDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Team
        </Button>
      </div>

      <Card className="mb-6 border-none shadow-lg">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="relative">
              <Label className="text-xs mb-1 block">Search Teams</Label>
              <Search className="absolute left-3 top-[30px] w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Gender</Label>
              <Select value={filterGender} onValueChange={setFilterGender}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Female">Girls</SelectItem>
                  <SelectItem value="Male">Boys</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Age Group</Label>
              <Select value={filterAgeGroup} onValueChange={setFilterAgeGroup}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {uniqueAgeGroups.map(ag => (
                    <SelectItem key={ag} value={ag}>{ag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Branch</Label>
              <Select value={filterBranch} onValueChange={setFilterBranch}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {BRANCH_OPTIONS.map(branch => (
                    <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Teams Grid - 3 columns */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
            {nextYearTeams.map(team => {
              const teamPlayers = getTeamPlayers(team.name);
              return (
                <Card key={team.id} className={`border-2 ${team.gender === 'Male' ? 'border-blue-300' : 'border-pink-300'}`}>
                  <CardHeader className={`pb-2 ${team.gender === 'Male' ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gradient-to-r from-pink-600 to-pink-700'} text-white`}>
                    <CardTitle className="text-sm flex items-center justify-between">
                      <div>
                        <div className="font-bold">{team.name}</div>
                        <div className="text-xs opacity-90">{team.age_group}</div>
                      </div>
                      <Badge className="bg-white text-slate-900 text-xs">{teamPlayers.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                    <Droppable droppableId={team.name}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`min-h-[300px] space-y-1.5 p-2 rounded-lg ${snapshot.isDraggingOver ? `${team.gender === 'Male' ? 'bg-blue-100' : 'bg-pink-100'} border-2 border-dashed ${team.gender === 'Male' ? 'border-blue-400' : 'border-pink-400'}` : 'bg-slate-50'}`}
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
                            <div className="text-center py-8 text-slate-400 text-xs">
                              Drop players here
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

          {/* Unassigned Players Sidebar */}
          <Card className="border-2 border-orange-300 sticky top-4 self-start" style={{ maxHeight: 'calc(100vh - 280px)' }}>
            <CardHeader className="pb-2 bg-gradient-to-r from-orange-500 to-red-500 text-white">
              <CardTitle className="text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Unassigned
                </div>
                <Badge className="bg-white text-orange-700 text-xs">{unassignedPlayers.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="mb-2">
                <Input
                  placeholder="Search players..."
                  value={playerSearchTerm}
                  onChange={(e) => setPlayerSearchTerm(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <Droppable droppableId="unassigned">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-1.5 p-2 rounded-lg overflow-y-auto ${snapshot.isDraggingOver ? 'bg-orange-100 border-2 border-dashed border-orange-400' : 'bg-slate-50'}`}
                    style={{ maxHeight: 'calc(100vh - 400px)' }}
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
                      <div className="text-center py-8 text-slate-400 text-xs">
                        No unassigned players
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
            <DialogTitle>Create 2026/2027 Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Age Group *</Label>
              <Select value={teamForm.age_group} onValueChange={(v) => setTeamForm({...teamForm, age_group: v})}>
                <SelectTrigger>
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
              <Label>Team Level *</Label>
              <Select 
                value={teamForm.name} 
                onValueChange={(v) => {
                  const fullName = `${teamForm.age_group} ${v} 26/27`;
                  setTeamForm({...teamForm, name: fullName});
                }}
              >
                <SelectTrigger>
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
              <Label>Gender *</Label>
              <Select value={teamForm.gender} onValueChange={(v) => setTeamForm({...teamForm, gender: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Branch</Label>
              <Select value={teamForm.branch} onValueChange={(v) => setTeamForm({...teamForm, branch: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {BRANCH_OPTIONS.map(branch => (
                    <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-slate-100 p-3 rounded-lg">
              <Label className="text-xs text-slate-600">Preview Team Name:</Label>
              <p className="font-semibold text-slate-900 mt-1">{teamForm.name || 'Select options above'}</p>
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
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              Create Team
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}