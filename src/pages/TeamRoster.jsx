import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Users, User, UserMinus, Eye, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { BRANCH_OPTIONS } from '../components/constants/leagueOptions';

export default function TeamRoster() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');
  const [filterAgeGroup, setFilterAgeGroup] = useState('all');
  const [filterLeague, setFilterLeague] = useState('all');
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [playerToRemove, setPlayerToRemove] = useState(null);

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

  const removePlayerMutation = useMutation({
    mutationFn: (playerId) => base44.entities.Player.update(playerId, { team_id: null }),
    onSuccess: () => {
      queryClient.invalidateQueries(['players']);
      setShowRemoveDialog(false);
      setPlayerToRemove(null);
      toast.success('Player removed from team');
    }
  });

  const extractAge = (ag) => {
    const match = ag?.match(/U-?(\d+)/i);
    return match ? parseInt(match[1]) : 0;
  };

  const filteredTeams = teams.filter(t => {
    const matchesSearch = !searchTerm || t.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = filterGender === 'all' || t.gender === filterGender;
    const matchesBranch = filterBranch === 'all' || t.branch === filterBranch;
    const matchesAgeGroup = filterAgeGroup === 'all' || t.age_group === filterAgeGroup;
    const matchesLeague = filterLeague === 'all' || t.league === filterLeague;
    return matchesSearch && matchesGender && matchesBranch && matchesAgeGroup && matchesLeague && t.name;
  }).sort((a, b) => {
    const ageA = extractAge(a.age_group);
    const ageB = extractAge(b.age_group);
    return ageB - ageA;
  });

  const uniqueAgeGroups = [...new Set(teams.map(t => t.age_group).filter(Boolean))].sort((a, b) => extractAge(b) - extractAge(a));
  const uniqueLeagues = [...new Set(teams.map(t => t.league).filter(Boolean))];

  const getTeamPlayers = (teamId) => {
    return players.filter(p => p.team_id === teamId).map(p => {
      const tryout = tryouts.find(t => t.player_id === p.id);
      return { ...p, tryout };
    }).sort((a, b) => {
      const lastNameA = a.full_name?.split(' ').pop() || '';
      const lastNameB = b.full_name?.split(' ').pop() || '';
      return lastNameA.localeCompare(lastNameB);
    });
  };

  const team = selectedTeam ? teams.find(t => t.id === selectedTeam) : null;
  const teamPlayers = team ? getTeamPlayers(team.id) : [];

  return (
    <div className="p-4 md:p-8 max-w-[1800px] mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
          Team Rosters
        </h1>
        <p className="text-slate-600 mt-2">Manage current team rosters and player assignments</p>
      </div>

      <div className="grid lg:grid-cols-[400px_1fr] gap-6">
        {/* Teams List */}
        <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm sticky top-4 self-start" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          <CardHeader className="pb-3 bg-gradient-to-r from-emerald-50 to-blue-50 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              Teams ({filteredTeams.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search teams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterGender} onValueChange={setFilterGender}>
                <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="Female">Girls</SelectItem>
                  <SelectItem value="Male">Boys</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterAgeGroup} onValueChange={setFilterAgeGroup}>
                <SelectTrigger><SelectValue placeholder="Age Group" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ages</SelectItem>
                  {uniqueAgeGroups.map(ag => (
                    <SelectItem key={ag} value={ag}>{ag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterLeague} onValueChange={setFilterLeague}>
                <SelectTrigger><SelectValue placeholder="League" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Leagues</SelectItem>
                  {uniqueLeagues.map(league => (
                    <SelectItem key={league} value={league}>{league}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 480px)' }}>
              {filteredTeams.map(t => {
                const playerCount = players.filter(p => p.team_id === t.id).length;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTeam(t.id)}
                    className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                      selectedTeam === t.id
                        ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white border-emerald-500 shadow-lg'
                        : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate">{t.name}</div>
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          <Badge className={selectedTeam === t.id ? 'bg-white/30 text-white' : 'bg-slate-100 text-slate-700'}>
                            {t.age_group}
                          </Badge>
                          {t.league && (
                            <Badge className={selectedTeam === t.id ? 'bg-white/30 text-white' : 'bg-blue-100 text-blue-700'}>
                              {t.league}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Badge className={`text-sm font-bold ${selectedTeam === t.id ? 'bg-white text-emerald-600' : 'bg-emerald-100 text-emerald-700'}`}>
                        {playerCount}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Team Roster Details */}
        {team ? (
          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4 bg-gradient-to-r from-emerald-600 to-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{team.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-white/30 text-white">{team.age_group}</Badge>
                    {team.league && <Badge className="bg-white/30 text-white">{team.league}</Badge>}
                    {team.branch && <Badge className="bg-white/30 text-white">{team.branch}</Badge>}
                    <Badge className="bg-white text-emerald-700 font-bold">{teamPlayers.length} Players</Badge>
                  </div>
                </div>
                <Button onClick={() => navigate(`${createPageUrl('TeamDashboard')}?id=${team.id}`)} className="bg-white text-emerald-600 hover:bg-white/90">
                  <Eye className="w-4 h-4 mr-2" />
                  View Dashboard
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {teamPlayers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">No players assigned to this team</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teamPlayers.map(player => {
                    const age = player.date_of_birth ? new Date().getFullYear() - new Date(player.date_of_birth).getFullYear() : null;
                    return (
                      <Card key={player.id} className="border-2 border-slate-200 hover:border-emerald-400 hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate(`${createPageUrl('PlayerDashboard')}?id=${player.id}`)}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                              {player.jersey_number || <User className="w-6 h-6" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-slate-900 truncate">{player.full_name}</div>
                              <div className="text-sm text-slate-600">{player.primary_position}</div>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {age && <Badge className="bg-blue-100 text-blue-800 text-xs">{age}y</Badge>}
                                {player.status === 'Injured' && <Badge className="bg-red-100 text-red-800 text-xs">Injured</Badge>}
                                {player.tryout?.team_role && (
                                  <Badge className="bg-purple-100 text-purple-800 text-xs">
                                    {player.tryout.team_role.replace('Indispensable Player', 'IND').replace(' Starter', '').replace(' Rotation', ' R')}
                                  </Badge>
                                )}
                                {player.tryout?.next_season_status && player.tryout.next_season_status !== 'N/A' && (
                                  <Badge className={`text-xs ${
                                    player.tryout.next_season_status === 'Accepted Offer' ? 'bg-green-100 text-green-800' :
                                    player.tryout.next_season_status === 'Rejected Offer' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {player.tryout.next_season_status}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPlayerToRemove(player);
                                setShowRemoveDialog(true);
                              }}
                              className="hover:bg-red-50 hover:text-red-600"
                            >
                              <UserMinus className="w-4 h-4" />
                            </Button>
                          </div>
                          {player.tryout && (
                            <div className="mt-3 pt-3 border-t border-slate-200 text-xs space-y-1">
                              {player.tryout.recommendation && (
                                <div className="flex justify-between">
                                  <span className="text-slate-600">Recommendation:</span>
                                  <Badge className={`text-xs ${
                                    player.tryout.recommendation === 'Move up' ? 'bg-emerald-100 text-emerald-800' :
                                    player.tryout.recommendation === 'Move down' ? 'bg-orange-100 text-orange-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {player.tryout.recommendation}
                                  </Badge>
                                </div>
                              )}
                              {player.tryout.next_year_team && (
                                <div className="flex justify-between">
                                  <span className="text-slate-600">Next Year:</span>
                                  <span className="font-semibold text-slate-900">{player.tryout.next_year_team}</span>
                                </div>
                              )}
                              {player.tryout.registration_status && (
                                <div className="flex justify-between">
                                  <span className="text-slate-600">Registration:</span>
                                  <Badge className={`text-xs ${
                                    player.tryout.registration_status === 'Signed and Paid' ? 'bg-green-100 text-green-800' :
                                    player.tryout.registration_status === 'Signed' ? 'bg-blue-100 text-blue-800' :
                                    'bg-slate-100 text-slate-700'
                                  }`}>
                                    {player.tryout.registration_status}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <Users className="w-20 h-20 mx-auto mb-4 text-slate-300" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">Select a Team</h3>
              <p className="text-slate-500">Choose a team from the list to view and manage its roster</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Player from Team?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600">
              Are you sure you want to remove <span className="font-bold text-slate-900">{playerToRemove?.full_name}</span> from <span className="font-bold text-slate-900">{team?.name}</span>?
            </p>
            <p className="text-sm text-slate-500 mt-2">
              The player will remain in the system but won't be assigned to any team.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowRemoveDialog(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={() => removePlayerMutation.mutate(playerToRemove.id)} 
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Remove Player
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}