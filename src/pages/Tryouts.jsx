import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User, AlertCircle, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Tryouts() {
  const navigate = useNavigate();
  const [selectedTeam, setSelectedTeam] = useState('all');

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

  const calculateTrapped = (dateOfBirth) => {
    if (!dateOfBirth) return 'Unknown';
    const date = new Date(dateOfBirth);
    const month = date.getMonth() + 1;
    return (month >= 9 && month <= 12) ? 'Yes' : 'No';
  };

  const getPlayerTryoutData = (player) => {
    const tryout = tryouts.find(t => t.player_id === player.id);
    const trapped = calculateTrapped(player.date_of_birth);
    return { ...player, tryout, trapped };
  };

  const sortTeamsByAge = (teamList) => {
    return [...teamList].sort((a, b) => {
      const extractAge = (name) => {
        const match = name.match(/U-?(\d+)/i);
        return match ? parseInt(match[1]) : 0;
      };
      return extractAge(b.name) - extractAge(a.name);
    });
  };

  const gaTeams = sortTeamsByAge(teams.filter(t => t.league === 'Girls Academy'));
  const aspireTeams = sortTeamsByAge(teams.filter(t => t.league === 'Aspire'));
  const otherTeams = sortTeamsByAge(teams.filter(t => t.league !== 'Girls Academy' && t.league !== 'Aspire'));

  const filteredGATeams = selectedTeam === 'all' ? gaTeams : gaTeams.filter(t => t.id === selectedTeam);
  const filteredAspireTeams = selectedTeam === 'all' ? aspireTeams : aspireTeams.filter(t => t.id === selectedTeam);
  const filteredOtherTeams = selectedTeam === 'all' ? otherTeams : otherTeams.filter(t => t.id === selectedTeam);

  const getTeamPlayers = (team) => {
    return players
      .filter(p => p.team_id === team.id)
      .map(p => getPlayerTryoutData(p))
      .sort((a, b) => {
        const lastNameA = a.full_name?.split(' ').pop() || '';
        const lastNameB = b.full_name?.split(' ').pop() || '';
        return lastNameA.localeCompare(lastNameB);
      });
  };

  const TeamColumn = ({ title, teams, bgColor }) => (
    <div className="flex-1 min-w-[350px]">
      <Card className="border-none shadow-xl h-full">
        <CardHeader className={`${bgColor} border-b`}>
          <CardTitle className="text-white text-center text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 overflow-y-auto max-h-[calc(100vh-250px)]">
          <div className="space-y-4">
            {teams.map(team => {
              const teamPlayers = getTeamPlayers(team);
              return (
                <Card key={team.id} className="border-2" style={{ borderColor: team.team_color }}>
                  <CardHeader className="pb-3" style={{ backgroundColor: `${team.team_color}20` }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: team.team_color }}
                        >
                          {team.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{team.name}</div>
                          <div className="text-xs text-slate-600">{teamPlayers.length} players</div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 space-y-2">
                    {teamPlayers.length === 0 ? (
                      <p className="text-center text-slate-400 text-sm py-4">No players</p>
                    ) : (
                      teamPlayers.map(player => (
                        <button
                          key={player.id}
                          onClick={() => navigate(`${createPageUrl('PlayerProfile')}?id=${player.id}`)}
                          className={`w-full p-3 rounded-lg transition-all hover:shadow-md text-left border-2 ${
                            player.trapped === 'Yes' 
                              ? 'border-red-500 bg-red-50' 
                              : 'border-slate-200 bg-white hover:border-emerald-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                                {player.jersey_number || <User className="w-5 h-5" />}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900">{player.full_name}</div>
                                <div className="text-xs text-slate-600">{player.position}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              {player.trapped === 'Yes' && (
                                <Badge className="bg-red-500 text-white mb-1">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Trapped
                                </Badge>
                              )}
                              {player.tryout && (
                                <div className="space-y-1">
                                  {player.tryout.team_role && (
                                    <div className="text-xs text-slate-600">{player.tryout.team_role}</div>
                                  )}
                                  {player.tryout.recommendation && (
                                    <Badge 
                                      className={
                                        player.tryout.recommendation === 'Move up' ? 'bg-emerald-500' :
                                        player.tryout.recommendation === 'Move down' ? 'bg-orange-500' :
                                        'bg-blue-500'
                                      }
                                    >
                                      {player.tryout.recommendation}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="p-8 max-w-[1800px] mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Tryouts Dashboard</h1>
        <p className="text-slate-600">Team rosters organized by league</p>
      </div>

      <Card className="border-none shadow-lg mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-slate-700">Filter by Team:</label>
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map(team => (
                  <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-6 overflow-x-auto pb-4">
        <TeamColumn 
          title="Girls Academy" 
          teams={filteredGATeams} 
          bgColor="bg-gradient-to-r from-purple-600 to-purple-700" 
        />
        <TeamColumn 
          title="Aspire League" 
          teams={filteredAspireTeams} 
          bgColor="bg-gradient-to-r from-blue-600 to-blue-700" 
        />
        <TeamColumn 
          title="Other Leagues" 
          teams={filteredOtherTeams} 
          bgColor="bg-gradient-to-r from-emerald-600 to-emerald-700" 
        />
      </div>
    </div>
  );
}