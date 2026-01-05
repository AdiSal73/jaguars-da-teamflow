import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Trophy, TrendingUp, Target, Users, Medal, Crown, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Leaderboard() {
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

  const { data: allProgress = [] } = useQuery({
    queryKey: ['playerProgress'],
    queryFn: () => base44.entities.PlayerProgress.list('-total_points')
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations'],
    queryFn: () => base44.entities.Evaluation.list('-overall_score')
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => base44.entities.PhysicalAssessment.list('-overall_score')
  });

  // Player leaderboard by points
  const playerLeaderboard = allProgress
    .map(prog => {
      const player = players.find(p => p.id === prog.player_id);
      if (!player) return null;
      const team = teams.find(t => t.id === player.team_id);
      return {
        ...prog,
        player_name: player.full_name,
        team_name: team?.name || 'N/A',
        team_id: player.team_id,
        position: player.primary_position
      };
    })
    .filter(Boolean)
    .filter(p => selectedTeam === 'all' || p.team_id === selectedTeam);

  // Team leaderboard by average points
  const teamLeaderboard = teams.map(team => {
    const teamPlayers = players.filter(p => p.team_id === team.id);
    const teamProgress = allProgress.filter(prog => 
      teamPlayers.some(p => p.id === prog.player_id)
    );
    const avgPoints = teamProgress.length > 0 
      ? teamProgress.reduce((sum, p) => sum + (p.total_points || 0), 0) / teamProgress.length 
      : 0;
    
    return {
      ...team,
      avg_points: Math.round(avgPoints),
      player_count: teamPlayers.length,
      total_points: teamProgress.reduce((sum, p) => sum + (p.total_points || 0), 0)
    };
  }).sort((a, b) => b.avg_points - a.avg_points);

  // Most improved players (based on evaluation scores)
  const mostImproved = players.map(player => {
    const playerEvals = evaluations.filter(e => e.player_id === player.id).sort((a, b) => 
      new Date(b.created_date) - new Date(a.created_date)
    );
    if (playerEvals.length < 2) return null;
    
    const improvement = (playerEvals[0].overall_score || 0) - (playerEvals[1].overall_score || 0);
    const team = teams.find(t => t.id === player.team_id);
    
    return {
      player_id: player.id,
      player_name: player.full_name,
      team_name: team?.name || 'N/A',
      improvement,
      latest_score: playerEvals[0].overall_score,
      position: player.primary_position
    };
  }).filter(p => p && p.improvement > 0).sort((a, b) => b.improvement - a.improvement);

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="text-sm font-bold text-slate-500">#{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            🏆 Leaderboards
          </h1>
          <p className="text-slate-600 mt-1">Track top performers and celebrate achievements</p>
        </div>

        <Tabs defaultValue="players" className="space-y-6">
          <TabsList className="bg-white/80 backdrop-blur">
            <TabsTrigger value="players">
              <Trophy className="w-4 h-4 mr-2" />
              Players
            </TabsTrigger>
            <TabsTrigger value="teams">
              <Users className="w-4 h-4 mr-2" />
              Teams
            </TabsTrigger>
            <TabsTrigger value="improved">
              <TrendingUp className="w-4 h-4 mr-2" />
              Most Improved
            </TabsTrigger>
          </TabsList>

          <TabsContent value="players">
            <Card className="border-none shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Top Players by Points ({playerLeaderboard.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-100 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold">Rank</th>
                        <th className="px-4 py-3 text-left text-xs font-bold">Player</th>
                        <th className="px-4 py-3 text-left text-xs font-bold">Team</th>
                        <th className="px-4 py-3 text-left text-xs font-bold">Position</th>
                        <th className="px-4 py-3 text-left text-xs font-bold">Level</th>
                        <th className="px-4 py-3 text-left text-xs font-bold">Points</th>
                        <th className="px-4 py-3 text-left text-xs font-bold">Badges</th>
                      </tr>
                    </thead>
                    <tbody>
                      {playerLeaderboard.map((player, idx) => (
                        <tr 
                          key={player.player_id}
                          onClick={() => navigate(`${createPageUrl('PlayerDashboard')}?id=${player.player_id}`)}
                          className="border-b hover:bg-purple-50 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {getRankIcon(idx + 1)}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">{player.player_name}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{player.team_name}</td>
                          <td className="px-4 py-3 text-sm">
                            <Badge className="bg-blue-100 text-blue-800 text-xs">{player.position}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className="bg-purple-100 text-purple-800">Lvl {player.level}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-purple-600 text-lg">{player.total_points || 0}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              {player.badges?.slice(0, 3).map((badge, i) => (
                                <span key={i} className="text-lg" title={badge.name}>{badge.icon}</span>
                              ))}
                              {player.badges?.length > 3 && (
                                <span className="text-xs text-slate-500">+{player.badges.length - 3}</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teams">
            <Card className="border-none shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Top Teams by Average Points
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-100 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold">Rank</th>
                        <th className="px-4 py-3 text-left text-xs font-bold">Team</th>
                        <th className="px-4 py-3 text-left text-xs font-bold">League</th>
                        <th className="px-4 py-3 text-left text-xs font-bold">Players</th>
                        <th className="px-4 py-3 text-left text-xs font-bold">Avg Points</th>
                        <th className="px-4 py-3 text-left text-xs font-bold">Total Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamLeaderboard.map((team, idx) => (
                        <tr 
                          key={team.id}
                          onClick={() => navigate(`${createPageUrl('TeamDashboard')}?id=${team.id}`)}
                          className="border-b hover:bg-blue-50 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {getRankIcon(idx + 1)}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">{team.name}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{team.league}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{team.player_count}</td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-blue-600 text-lg">{team.avg_points}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{team.total_points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="improved">
            <Card className="border-none shadow-lg">
              <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Most Improved Players
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-100 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold">Rank</th>
                        <th className="px-4 py-3 text-left text-xs font-bold">Player</th>
                        <th className="px-4 py-3 text-left text-xs font-bold">Team</th>
                        <th className="px-4 py-3 text-left text-xs font-bold">Position</th>
                        <th className="px-4 py-3 text-left text-xs font-bold">Latest Score</th>
                        <th className="px-4 py-3 text-left text-xs font-bold">Improvement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mostImproved.slice(0, 20).map((player, idx) => (
                        <tr 
                          key={player.player_id}
                          onClick={() => navigate(`${createPageUrl('PlayerDashboard')}?id=${player.player_id}`)}
                          className="border-b hover:bg-emerald-50 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {getRankIcon(idx + 1)}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">{player.player_name}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{player.team_name}</td>
                          <td className="px-4 py-3 text-sm">
                            <Badge className="bg-blue-100 text-blue-800 text-xs">{player.position}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-emerald-600">{player.latest_score?.toFixed(1)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className="bg-emerald-500 text-white">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              +{player.improvement.toFixed(1)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}