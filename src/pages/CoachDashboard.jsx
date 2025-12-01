import React, { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Calendar, TrendingUp, Clock, Users, Activity, ChevronDown, ChevronUp, User, Edit2, Save, LayoutGrid, List } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getPositionBorderColor } from '../components/player/positionColors';
import EditablePlayerCard from '../components/player/EditablePlayerCard';

const formations = {
  '4-3-3': {
    positions: [
      { id: 'GK', x: 50, y: 95, label: 'GK' },
      { id: 'Right Outside Back', x: 80, y: 75, label: 'RB' },
      { id: 'Left Centerback', x: 62, y: 75, label: 'LCB' },
      { id: 'Right Centerback', x: 38, y: 75, label: 'RCB' },
      { id: 'Left Outside Back', x: 20, y: 75, label: 'LB' },
      { id: 'Center Midfielder', x: 62, y: 50, label: 'CM' },
      { id: 'Defensive Midfielder', x: 50, y: 50, label: 'DM' },
      { id: 'Attacking Midfielder', x: 38, y: 50, label: 'CAM' },
      { id: 'Right Winger', x: 75, y: 20, label: 'RW' },
      { id: 'Forward', x: 50, y: 15, label: 'ST' },
      { id: 'Left Winger', x: 25, y: 20, label: 'LW' }
    ]
  },
  '4-2-3-1': {
    positions: [
      { id: 'GK', x: 50, y: 95, label: 'GK' },
      { id: 'Right Outside Back', x: 80, y: 75, label: 'RB' },
      { id: 'Left Centerback', x: 62, y: 75, label: 'LCB' },
      { id: 'Right Centerback', x: 38, y: 75, label: 'RCB' },
      { id: 'Left Outside Back', x: 20, y: 75, label: 'LB' },
      { id: 'Defensive Midfielder', x: 60, y: 55, label: 'DM' },
      { id: 'Center Midfielder', x: 40, y: 55, label: 'CM' },
      { id: 'Right Winger', x: 75, y: 35, label: 'RW' },
      { id: 'Attacking Midfielder', x: 50, y: 35, label: 'CAM' },
      { id: 'Left Winger', x: 25, y: 35, label: 'LW' },
      { id: 'Forward', x: 50, y: 15, label: 'ST' }
    ]
  }
};

export default function CoachDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [expandedTeams, setExpandedTeams] = useState({});
  const [selectedFormation, setSelectedFormation] = useState('4-3-3');
  const [viewMode, setViewMode] = useState('overview');
  const [fieldViewTeam, setFieldViewTeam] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const currentCoach = coaches.find(c => c.email === user?.email);

  const { data: allPlayers = [] } = useQuery({
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

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => base44.entities.PhysicalAssessment.list()
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => base44.entities.Booking.list()
  });

  const { data: clubSettings = [] } = useQuery({
    queryKey: ['clubSettings'],
    queryFn: () => base44.entities.ClubSettings.list()
  });

  const coachTeams = useMemo(() => {
    if (!currentCoach?.team_ids) return [];
    return teams.filter(t => currentCoach.team_ids.includes(t.id));
  }, [currentCoach, teams]);

  const coachPlayers = useMemo(() => {
    const teamIds = coachTeams.map(t => t.id);
    return allPlayers.filter(p => teamIds.includes(p.team_id));
  }, [coachTeams, allPlayers]);

  const coachBookings = useMemo(() => {
    return bookings.filter(b => b.coach_id === currentCoach?.id);
  }, [bookings, currentCoach]);

  const upcomingBookings = coachBookings
    .filter(b => new Date(b.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  const teamPerformance = coachTeams.map(team => {
    const teamAssessments = assessments.filter(a => a.team_id === team.id);
    const avgOverall = teamAssessments.length > 0
      ? Math.round(teamAssessments.reduce((sum, a) => sum + (a.overall_score || 0), 0) / teamAssessments.length)
      : 0;
    return { name: team.name, score: avgOverall, playerCount: allPlayers.filter(p => p.team_id === team.id).length };
  });

  const toggleTeamExpanded = (teamId) => {
    setExpandedTeams(prev => ({ ...prev, [teamId]: !prev[teamId] }));
  };

  const updateRankingMutation = useMutation({
    mutationFn: async ({ playerId, newRanking, position }) => {
      const existingTryout = tryouts.find(t => t.player_id === playerId);
      if (existingTryout) {
        return base44.entities.PlayerTryout.update(existingTryout.id, { team_ranking: newRanking, primary_position: position });
      } else {
        const player = allPlayers.find(p => p.id === playerId);
        return base44.entities.PlayerTryout.create({
          player_id: playerId,
          player_name: player?.full_name,
          team_ranking: newRanking,
          primary_position: position
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries(['tryouts'])
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const playerId = result.draggableId.replace('player-', '');
    const destPositionId = result.destination.droppableId.replace('position-', '');
    const newRanking = result.destination.index + 1;

    base44.entities.Player.update(playerId, { primary_position: destPositionId }).then(() => {
      queryClient.invalidateQueries(['players']);
    });

    updateRankingMutation.mutate({ playerId, newRanking, position: destPositionId });
  };

  const getPlayersForPosition = (teamId, positionId) => {
    const teamPlayers = allPlayers.filter(p => p.team_id === teamId && p.primary_position === positionId);
    return teamPlayers.map(p => ({
      ...p,
      tryout: tryouts.find(t => t.player_id === p.id)
    })).sort((a, b) => (a.tryout?.team_ranking || 999) - (b.tryout?.team_ranking || 999));
  };

  if (!currentCoach) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Coach profile not found. Please contact administrator.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1800px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Coach Dashboard</h1>
          <p className="text-slate-600 mt-1">Welcome back, {currentCoach.full_name}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'overview' ? 'default' : 'outline'}
            onClick={() => setViewMode('overview')}
            className={viewMode === 'overview' ? 'bg-emerald-600' : ''}
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            Overview
          </Button>
          <Button
            variant={viewMode === 'field' ? 'default' : 'outline'}
            onClick={() => setViewMode('field')}
            className={viewMode === 'field' ? 'bg-emerald-600' : ''}
          >
            <List className="w-4 h-4 mr-2" />
            Field View
          </Button>
        </div>
      </div>

      {viewMode === 'overview' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-none shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-600">My Teams</div>
                    <div className="text-2xl font-bold text-slate-900">{coachTeams.length}</div>
                  </div>
                  <Users className="w-8 h-8 text-emerald-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-600">Total Players</div>
                    <div className="text-2xl font-bold text-slate-900">{coachPlayers.length}</div>
                  </div>
                  <Activity className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-600">Upcoming Sessions</div>
                    <div className="text-2xl font-bold text-slate-900">{upcomingBookings.length}</div>
                  </div>
                  <Clock className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-600">Assessments</div>
                    <div className="text-2xl font-bold text-slate-900">{assessments.filter(a => coachTeams.some(t => t.id === a.team_id)).length}</div>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Teams with Rosters */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">My Teams & Rosters</h2>
            {coachTeams.map(team => {
              const teamPlayers = allPlayers.filter(p => p.team_id === team.id);
              const isExpanded = expandedTeams[team.id];
              const isMaleTeam = team.gender === 'Male';

              return (
                <Card 
                  key={team.id} 
                  className={`border-none shadow-lg overflow-hidden ${
                    isMaleTeam ? 'bg-slate-800 text-white' : 'bg-white'
                  }`}
                >
                  <CardHeader 
                    className={`cursor-pointer ${isMaleTeam ? 'bg-slate-900' : 'bg-gradient-to-r from-emerald-50 to-blue-50'}`}
                    onClick={() => toggleTeamExpanded(team.id)}
                  >
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-md ${
                          isMaleTeam ? 'bg-slate-700 text-white' : 'bg-gradient-to-br from-emerald-500 to-blue-500 text-white'
                        }`}>
                          {team.age_group || team.name?.charAt(0)}
                        </div>
                        <div>
                          <div className={`text-lg ${isMaleTeam ? 'text-white' : ''}`}>{team.name}</div>
                          <div className={`text-sm font-normal ${isMaleTeam ? 'text-slate-400' : 'text-slate-600'}`}>
                            {team.age_group} • {teamPlayers.length} players
                          </div>
                        </div>
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); navigate(`${createPageUrl('TeamDashboard')}?teamId=${team.id}`); }}
                          className={isMaleTeam ? 'text-white hover:bg-slate-700' : ''}
                        >
                          View Details
                        </Button>
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </CardHeader>
                  
                  {isExpanded && (
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {teamPlayers.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || '')).map(player => {
                          const tryout = tryouts.find(t => t.player_id === player.id);
                          return (
                            <div 
                              key={player.id}
                              onClick={() => navigate(`${createPageUrl('PlayerDashboard')}?id=${player.id}`)}
                              className={`p-2 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${getPositionBorderColor(player.primary_position)} ${
                                isMaleTeam ? 'bg-slate-700 hover:bg-slate-600' : 'bg-white hover:bg-slate-50'
                              }`}
                            >
                              <div className={`font-medium text-sm truncate ${isMaleTeam ? 'text-white' : ''}`}>
                                {player.full_name}
                              </div>
                              <div className={`text-xs ${isMaleTeam ? 'text-slate-400' : 'text-slate-500'}`}>
                                {player.primary_position || 'No position'}
                              </div>
                              {tryout?.team_role && (
                                <Badge className="mt-1 text-[8px] bg-purple-100 text-purple-800">{tryout.team_role}</Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {teamPlayers.length === 0 && (
                        <p className={`text-center py-4 ${isMaleTeam ? 'text-slate-400' : 'text-slate-500'}`}>No players assigned to this team</p>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Performance Chart */}
          {teamPerformance.length > 0 && (
            <Card className="mt-6 border-none shadow-lg">
              <CardHeader>
                <CardTitle>Team Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={teamPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#10b981" name="Avg Score" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {viewMode === 'field' && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Select value={fieldViewTeam || ''} onValueChange={setFieldViewTeam}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {coachTeams.map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedFormation} onValueChange={setSelectedFormation}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(formations).map(f => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {fieldViewTeam ? (
              <Card className="border-none shadow-2xl overflow-hidden">
                <CardContent className="p-0">
                  <div
                    className="relative w-full"
                    style={{
                      paddingBottom: 'min(100%, 600px)',
                      background: 'linear-gradient(180deg, #166534 0%, #15803d 50%, #166534 100%)'
                    }}
                  >
                    <div className="absolute inset-0">
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <rect x="2" y="2" width="96" height="96" fill="none" stroke="white" strokeWidth="0.3" opacity="0.6" />
                        <line x1="2" y1="50" x2="98" y2="50" stroke="white" strokeWidth="0.3" opacity="0.6" />
                        <circle cx="50" cy="50" r="8" fill="none" stroke="white" strokeWidth="0.3" opacity="0.6" />
                      </svg>

                      {formations[selectedFormation].positions.map(position => {
                        const positionPlayers = getPlayersForPosition(fieldViewTeam, position.id);
                        return (
                          <Droppable key={position.id} droppableId={`position-${position.id}`}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                                style={{
                                  left: `${position.x}%`,
                                  top: `${position.y}%`,
                                  width: '120px'
                                }}
                              >
                                <div className="bg-white/90 p-2 rounded-lg shadow-lg">
                                  <div className="text-center text-xs font-bold text-slate-700 mb-1 border-b pb-1">
                                    {position.label}
                                  </div>
                                  <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {positionPlayers.length > 0 ? positionPlayers.map((player, idx) => (
                                      <Draggable key={player.id} draggableId={`player-${player.id}`} index={idx}>
                                        {(provided) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                          >
                                            <EditablePlayerCard
                                              player={player}
                                              tryout={player.tryout}
                                              team={teams.find(t => t.id === player.team_id)}
                                              teams={teams}
                                              clubSettings={clubSettings}
                                              compact
                                              className="cursor-grab"
                                            />
                                          </div>
                                        )}
                                      </Draggable>
                                    )) : (
                                      <div className="text-center text-xs text-slate-400 py-2">Empty</div>
                                    )}
                                    {provided.placeholder}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Droppable>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-none shadow-lg">
                <CardContent className="p-12 text-center">
                  <p className="text-slate-500">Select a team to view the field formation</p>
                </CardContent>
              </Card>
            )}
          </div>
        </DragDropContext>
      )}
    </div>
  );
}