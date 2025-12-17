import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { sortPlayers, getBirthYear } from '../components/utils/playerSorting';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CreateEvaluationDialog from '../components/evaluation/CreateEvaluationDialog';
import { Label } from '@/components/ui/label';

export default function EvaluationsNew() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState('');
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterPosition, setFilterPosition] = useState('all');
  const [filterLeague, setFilterLeague] = useState('all');
  const [filterAgeGroup, setFilterAgeGroup] = useState('all');
  const [filterBirthYear, setFilterBirthYear] = useState('all');
  const [filterTeamRole, setFilterTeamRole] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerSearch, setPlayerSearch] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const currentCoach = coaches.find(c => c.email === user?.email);

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

  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations'],
    queryFn: () => base44.entities.Evaluation.list('-created_date')
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => base44.entities.PhysicalAssessment.list()
  });

  const getPlayerLatestEval = (playerId) => {
    const playerEvals = evaluations.filter(e => e.player_id === playerId);
    return playerEvals[0] || null;
  };

  const getPlayerLatestAssessment = (playerId) => {
    const playerAssessments = assessments.filter(a => a.player_id === playerId)
      .sort((a, b) => new Date(b.assessment_date) - new Date(a.assessment_date));
    return playerAssessments[0] || null;
  };

  // Only show players who have evaluations
  const playersWithEvaluations = players.filter(p => 
    evaluations.some(e => e.player_id === p.id)
  );

  const filteredPlayers = sortPlayers(
    playersWithEvaluations.filter(p => {
      const matchesSearch = p.full_name?.toLowerCase().includes(search.toLowerCase());
      const team = teams.find(t => t.id === p.team_id);
      const tryout = tryouts.find(t => t.player_id === p.id);
      
      const matchesTeam = filterTeam === 'all' || p.team_id === filterTeam;
      const matchesPosition = filterPosition === 'all' || p.primary_position === filterPosition;
      const matchesLeague = filterLeague === 'all' || team?.league === filterLeague;
      const matchesAgeGroup = filterAgeGroup === 'all' || team?.age_group === filterAgeGroup;
      
      const birthYear = getBirthYear(p.date_of_birth);
      const matchesBirthYear = filterBirthYear === 'all' || birthYear?.toString() === filterBirthYear;
      
      const matchesTeamRole = filterTeamRole === 'all' || 
        (filterTeamRole === 'none' ? !tryout?.team_role : tryout?.team_role === filterTeamRole);
      
      return matchesSearch && matchesTeam && matchesPosition && matchesLeague && 
             matchesAgeGroup && matchesBirthYear && matchesTeamRole;
    }),
    teams
  );

  const uniqueTeams = [...new Set(teams.map(t => t.name).filter(Boolean))];
  const uniqueLeagues = [...new Set(teams.map(t => t.league).filter(Boolean))];
  const uniqueAgeGroups = [...new Set(teams.map(t => t.age_group).filter(Boolean))];
  const uniqueBirthYears = [...new Set(players.map(p => getBirthYear(p.date_of_birth)).filter(Boolean))].sort((a, b) => b - a);
  const POSITIONS = ['GK', 'Right Outside Back', 'Left Outside Back', 'Right Centerback', 'Left Centerback', 'Defensive Midfielder', 'Right Winger', 'Center Midfielder', 'Forward', 'Attacking Midfielder', 'Left Winger'];

  const searchablePlayers = sortPlayers(
    players.filter(p => p.full_name?.toLowerCase().includes(playerSearch.toLowerCase())),
    teams
  ).slice(0, 50);

  return (
    <div className="p-4 md:p-8 max-w-[1800px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Player Evaluations</h1>
          <p className="text-slate-600 mt-1">View player performance and development data</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg">
          <Plus className="w-5 h-5 mr-2" />
          Create Evaluation
        </Button>
      </div>

      <Card className="border-none shadow-lg mb-6">
        <CardContent className="p-4">
          <div className="grid md:grid-cols-7 gap-3 mb-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Search players..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
            <Select value={filterTeam} onValueChange={setFilterTeam}>
              <SelectTrigger className="h-10"><SelectValue placeholder="All Teams" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {uniqueTeams.map(team => (
                  <SelectItem key={team} value={teams.find(t => t.name === team)?.id}>{team}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterLeague} onValueChange={setFilterLeague}>
              <SelectTrigger className="h-10"><SelectValue placeholder="All Leagues" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leagues</SelectItem>
                {uniqueLeagues.map(league => (
                  <SelectItem key={league} value={league}>{league}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterAgeGroup} onValueChange={setFilterAgeGroup}>
              <SelectTrigger className="h-10"><SelectValue placeholder="All Ages" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Age Groups</SelectItem>
                {uniqueAgeGroups.map(ag => (
                  <SelectItem key={ag} value={ag}>{ag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterBirthYear} onValueChange={setFilterBirthYear}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Birth Year" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {uniqueBirthYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPosition} onValueChange={setFilterPosition}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Position" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                {POSITIONS.map(pos => (
                  <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid md:grid-cols-7 gap-3">
            <Select value={filterTeamRole} onValueChange={setFilterTeamRole}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Team Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="Indispensable Player">Indispensable</SelectItem>
                <SelectItem value="GA Starter">GA Starter</SelectItem>
                <SelectItem value="GA Rotation">GA Rotation</SelectItem>
                <SelectItem value="Aspire Starter">Aspire Starter</SelectItem>
                <SelectItem value="Aspire Rotation">Aspire Rotation</SelectItem>
                <SelectItem value="United Starter">United Starter</SelectItem>
                <SelectItem value="United Rotation">United Rotation</SelectItem>
                <SelectItem value="none">No Role</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredPlayers.map(player => {
          const team = teams.find(t => t.id === player.team_id);
          const tryout = tryouts.find(t => t.player_id === player.id);
          const latestEval = getPlayerLatestEval(player.id);
          const latestAssessment = getPlayerLatestAssessment(player.id);
          const birthYear = getBirthYear(player.date_of_birth);

          return (
            <Card 
              key={player.id}
              className="border-none shadow-lg hover:shadow-xl transition-all cursor-pointer bg-gradient-to-br from-white to-emerald-50"
              onClick={() => navigate(`${createPageUrl('PlayerDashboard')}?id=${player.id}`)}
            >
              <CardHeader className="pb-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-lg font-bold">
                    {player.jersey_number || player.full_name?.charAt(0)}
                  </div>
                  {latestEval?.overall_score && (
                    <Badge className="bg-white/90 text-emerald-700 text-xs font-bold">
                      {latestEval.overall_score}/10
                    </Badge>
                  )}
                </div>
                <div className="mt-2">
                  <h3 className="font-bold text-base truncate">{player.full_name}</h3>
                  <p className="text-xs text-white/80 truncate">{player.primary_position}</p>
                </div>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                <div className="space-y-1">
                  {team && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Team</span>
                      <span className="font-semibold text-slate-900 truncate ml-2">{team.name}</span>
                    </div>
                  )}
                  {team?.age_group && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Age Group</span>
                      <span className="font-semibold text-slate-900">{team.age_group}</span>
                    </div>
                  )}
                  {birthYear && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Birth Year</span>
                      <span className="font-semibold text-slate-900">{birthYear}</span>
                    </div>
                  )}
                  {team?.league && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">League</span>
                      <span className="font-semibold text-slate-900 truncate ml-2">{team.league}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 pt-2 border-t">
                  {tryout?.team_role && (
                    <Badge className="bg-purple-100 text-purple-800 text-[9px] px-1.5">{tryout.team_role}</Badge>
                  )}
                  {tryout?.recommendation && (
                    <Badge className={`text-[9px] px-1.5 ${
                      tryout.recommendation === 'Move up' ? 'bg-emerald-100 text-emerald-800' :
                      tryout.recommendation === 'Move down' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {tryout.recommendation}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                  {latestEval?.overall_score ? (
                    <div className="bg-emerald-50 rounded-lg p-2 text-center">
                      <div className="text-[9px] text-emerald-600 font-medium">Evaluation</div>
                      <div className="text-lg font-bold text-emerald-700">{latestEval.overall_score}</div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-lg p-2 text-center">
                      <div className="text-[9px] text-slate-400">Evaluation</div>
                      <div className="text-sm text-slate-400">N/A</div>
                    </div>
                  )}
                  {latestAssessment?.overall_score ? (
                    <div className="bg-blue-50 rounded-lg p-2 text-center">
                      <div className="text-[9px] text-blue-600 font-medium">Physical</div>
                      <div className="text-lg font-bold text-blue-700">{latestAssessment.overall_score}</div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-lg p-2 text-center">
                      <div className="text-[9px] text-slate-400">Physical</div>
                      <div className="text-sm text-slate-400">N/A</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredPlayers.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          No players with evaluations found
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Player to Evaluate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search players..."
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {searchablePlayers.map(p => {
                const team = teams.find(t => t.id === p.team_id);
                return (
                  <div
                    key={p.id}
                    onClick={() => { setSelectedPlayer(p); setShowCreateDialog(false); }}
                    className="p-3 bg-white border border-slate-200 rounded-lg hover:border-emerald-500 hover:shadow-md cursor-pointer transition-all"
                  >
                    <div className="font-medium text-sm">{p.full_name}</div>
                    <div className="text-xs text-slate-500">
                      {p.primary_position} • {team?.name || 'No team'}
                    </div>
                  </div>
                );
              })}
              {searchablePlayers.length === 0 && (
                <p className="text-center text-slate-500 py-4 text-sm">No players found</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CreateEvaluationDialog
        open={!!selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
        player={selectedPlayer}
      />
    </div>
  );
}