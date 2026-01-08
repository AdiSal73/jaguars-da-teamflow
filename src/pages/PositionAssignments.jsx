import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users, Shield, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { TeamRoleBadge } from '@/components/utils/teamRoleBadge';

const POSITIONS = [
  { id: 'GK', label: 'GK' },
  { id: 'Right Outside Back', label: 'Right Outside Back' },
  { id: 'Left Outside Back', label: 'Left Outside Back' },
  { id: 'Right Centerback', label: 'Right Centerback' },
  { id: 'Left Centerback', label: 'Left Centerback' },
  { id: 'Defensive Midfielder', label: 'Defensive Midfielder' },
  { id: 'Right Winger', label: 'Right Winger' },
  { id: 'Center Midfielder', label: 'Center Midfielder' },
  { id: 'Forward', label: 'Forward' },
  { id: 'Attacking Midfielder', label: 'Attacking Midfielder' },
  { id: 'Left Winger', label: 'Left Winger' }
];

export default function PositionAssignments() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedBirthYear, setSelectedBirthYear] = useState('all');
  const [selectedTeamRole, setSelectedTeamRole] = useState('all');
  const [selectedCurrentTeam, setSelectedCurrentTeam] = useState('all');
  const [collapsedPositions, setCollapsedPositions] = useState({});

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

  const updatePlayerMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Player.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['players']);
      toast.success('Position updated');
    }
  });

  const ageGroups = useMemo(() => {
    const groups = new Set(players.map(p => p.age_group).filter(Boolean));
    return Array.from(groups).sort();
  }, [players]);

  const branches = useMemo(() => {
    const br = new Set(players.map(p => p.branch).filter(Boolean));
    return Array.from(br).sort();
  }, [players]);

  const birthYears = useMemo(() => {
    const years = new Set(players.map(p => p.date_of_birth ? new Date(p.date_of_birth).getFullYear().toString() : null).filter(Boolean));
    return Array.from(years).sort((a, b) => b - a);
  }, [players]);

  const teamRoles = useMemo(() => {
    const roles = new Set(tryouts.map(t => t.team_role).filter(Boolean));
    return Array.from(roles).sort();
  }, [tryouts]);

  const currentTeams = useMemo(() => {
    const ct = new Set(tryouts.map(t => t.current_team).filter(Boolean));
    return Array.from(ct).sort();
  }, [tryouts]);

  const filteredPlayers = useMemo(() => {
    return players.filter(p => {
      const matchesSearch = !searchTerm || p.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAgeGroup = selectedAgeGroup === 'all' || p.age_group === selectedAgeGroup;
      const matchesGender = selectedGender === 'all' || p.gender === selectedGender;
      const matchesTeam = selectedTeam === 'all' || p.team_id === selectedTeam;
      const matchesBranch = selectedBranch === 'all' || p.branch === selectedBranch;
      const matchesBirthYear = selectedBirthYear === 'all' || (p.date_of_birth && new Date(p.date_of_birth).getFullYear().toString() === selectedBirthYear);
      const playerTryout = tryouts.find(t => t.player_id === p.id);
      const matchesTeamRole = selectedTeamRole === 'all' || playerTryout?.team_role === selectedTeamRole;
      const matchesCurrentTeam = selectedCurrentTeam === 'all' || playerTryout?.current_team === selectedCurrentTeam;
      return matchesSearch && matchesAgeGroup && matchesGender && matchesTeam && matchesBranch && matchesBirthYear && matchesTeamRole && matchesCurrentTeam;
    });
  }, [players, searchTerm, selectedAgeGroup, selectedGender, selectedTeam, selectedBranch, selectedBirthYear, selectedTeamRole, selectedCurrentTeam, tryouts]);

  const playersByPosition = useMemo(() => {
    const grouped = {};
    POSITIONS.forEach(pos => {
      grouped[pos.id] = filteredPlayers.filter(p => p.primary_position === pos.id);
    });
    grouped['unassigned'] = filteredPlayers.filter(p => !p.primary_position);
    return grouped;
  }, [filteredPlayers]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const playerId = result.draggableId;
    const destinationPosition = result.destination.droppableId;

    if (destinationPosition === 'unassigned') {
      updatePlayerMutation.mutate({ id: playerId, data: { primary_position: null } });
    } else {
      updatePlayerMutation.mutate({ id: playerId, data: { primary_position: destinationPosition } });
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-[1800px] mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-emerald-600" />
          Position Assignments
        </h1>
        <p className="text-slate-600">Drag and drop players to assign primary positions</p>
      </div>

      {/* Filters */}
      <Card className="mb-6 border-none shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedAgeGroup} onValueChange={setSelectedAgeGroup}>
              <SelectTrigger>
                <SelectValue placeholder="Age Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Age Groups</SelectItem>
                {ageGroups.map(ag => (
                  <SelectItem key={ag} value={ag}>{ag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedGender} onValueChange={setSelectedGender}>
              <SelectTrigger>
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger>
                <SelectValue placeholder="Team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger>
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map(b => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedBirthYear} onValueChange={setSelectedBirthYear}>
              <SelectTrigger>
                <SelectValue placeholder="Birth Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Birth Years</SelectItem>
                {birthYears.map(y => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedTeamRole} onValueChange={setSelectedTeamRole}>
              <SelectTrigger>
                <SelectValue placeholder="Team Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Team Roles</SelectItem>
                {teamRoles.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCurrentTeam} onValueChange={setSelectedCurrentTeam}>
              <SelectTrigger>
                <SelectValue placeholder="Current Team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Current Teams</SelectItem>
                {currentTeams.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setSelectedAgeGroup('all');
                setSelectedGender('all');
                setSelectedTeam('all');
                setSelectedBranch('all');
                setSelectedBirthYear('all');
                setSelectedTeamRole('all');
                setSelectedCurrentTeam('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Unassigned Players Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-none shadow-lg sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-orange-600" />
                    Unassigned
                  </span>
                  <Badge className="bg-orange-100 text-orange-800">{playersByPosition['unassigned']?.length || 0}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Droppable droppableId="unassigned">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-2 min-h-[200px] p-2 rounded-lg border-2 border-dashed transition-all ${
                        snapshot.isDraggingOver ? 'border-orange-500 bg-orange-50' : 'border-slate-200'
                      }`}
                    >
                      {playersByPosition['unassigned']?.map((player, index) => (
                        <Draggable key={player.id} draggableId={player.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-4 bg-white rounded-lg border-2 shadow-sm cursor-move hover:shadow-md transition-all ${
                                snapshot.isDragging ? 'ring-2 ring-orange-500 shadow-lg' : ''
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md">
                                  {player.jersey_number || player.full_name?.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-sm truncate">{player.full_name}</div>
                                  <div className="text-xs text-slate-600 font-medium">{player.primary_position || 'No Position'}</div>
                                  {teams.find(t => t.id === player.team_id) && (
                                    <div className="text-[10px] text-slate-500 mt-0.5">{teams.find(t => t.id === player.team_id)?.name}</div>
                                  )}
                                  <div className="flex gap-1 flex-wrap mt-1.5">
                                    {player.age_group && (
                                      <Badge className="bg-purple-100 text-purple-800 text-xs px-2 py-1 font-bold">{player.age_group}</Badge>
                                    )}
                                    {player.grad_year && (
                                      <Badge className="bg-slate-600 text-white text-[10px] px-1.5 py-0.5 font-bold">'{player.grad_year.toString().slice(-2)}</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {playersByPosition['unassigned']?.length === 0 && (
                        <div className="text-center text-slate-400 text-sm py-8">No unassigned players</div>
                      )}
                    </div>
                  )}
                </Droppable>
              </CardContent>
            </Card>
          </div>

          {/* Position Containers */}
          <div className="lg:col-span-3 grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {POSITIONS.map(position => {
              const positionPlayers = playersByPosition[position.id] || [];
              const tryoutData = tryouts.reduce((acc, t) => ({ ...acc, [t.player_id]: t }), {});

              return (
                <Collapsible key={position.id} open={!collapsedPositions[position.id]}>
                  <Card className="border-none shadow-lg">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="pb-3 cursor-pointer hover:bg-slate-50 transition-colors">
                        <CardTitle className="flex items-center justify-between text-base">
                          <span>{position.label}</span>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-100 text-emerald-800">{positionPlayers.length}</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCollapsedPositions(prev => ({...prev, [position.id]: !prev[position.id]}));
                              }}
                            >
                              {collapsedPositions[position.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent>
                        <Droppable droppableId={position.id}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`space-y-2 min-h-[150px] p-2 rounded-lg border-2 border-dashed transition-all ${
                                snapshot.isDraggingOver ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'
                              }`}
                            >
                          {positionPlayers.map((player, index) => {
                            const tryout = tryoutData[player.id];
                            return (
                              <Draggable key={player.id} draggableId={player.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`p-4 bg-white rounded-lg border-2 shadow-sm cursor-move hover:shadow-md transition-all ${
                                      snapshot.isDragging ? 'ring-2 ring-emerald-500 shadow-lg' : ''
                                    }`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md">
                                        {player.jersey_number || player.full_name?.charAt(0)}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="font-bold text-sm truncate">{player.full_name}</div>
                                        <div className="text-xs text-slate-600 font-medium">{player.primary_position}</div>
                                        {teams.find(t => t.id === player.team_id) && (
                                          <div className="text-[10px] text-slate-500 mt-0.5">{teams.find(t => t.id === player.team_id)?.name}</div>
                                        )}
                                        <div className="flex gap-1 flex-wrap mt-1.5">
                                          {player.age_group && (
                                            <Badge className="bg-purple-100 text-purple-800 text-xs px-2 py-1 font-bold">{player.age_group}</Badge>
                                          )}
                                          {player.grad_year && (
                                            <Badge className="bg-slate-600 text-white text-[10px] px-1.5 py-0.5 font-bold">'{player.grad_year.toString().slice(-2)}</Badge>
                                          )}
                                          {tryout?.team_role && <TeamRoleBadge role={tryout.team_role} size="default" />}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                          {positionPlayers.length === 0 && (
                            <div className="text-center text-slate-400 text-sm py-8">Drag players here</div>
                          )}
                            </div>
                          )}
                        </Droppable>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}