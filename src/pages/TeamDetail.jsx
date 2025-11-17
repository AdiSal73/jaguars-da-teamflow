import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Users, Calendar, Trophy, TrendingUp, Plus, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function TeamDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const teamId = urlParams.get('id');

  const [showGameDialog, setShowGameDialog] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [gameForm, setGameForm] = useState({
    team_id: teamId,
    opponent: '',
    game_date: '',
    game_time: '',
    location: '',
    home_away: 'Home',
    team_score: '',
    opponent_score: '',
    result: 'Scheduled',
    season: new Date().getFullYear().toString(),
    notes: ''
  });

  const { data: team } = useQuery({
    queryKey: ['team', teamId],
    queryFn: async () => {
      const teams = await base44.entities.Team.list();
      return teams.find(t => t.id === teamId);
    },
    enabled: !!teamId
  });

  const { data: players = [] } = useQuery({
    queryKey: ['teamPlayers', teamId],
    queryFn: () => base44.entities.Player.filter({ team_id: teamId })
  });

  const { data: games = [] } = useQuery({
    queryKey: ['teamGames', teamId],
    queryFn: () => base44.entities.Game.filter({ team_id: teamId }, '-game_date')
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['teamAssessments', teamId],
    queryFn: async () => {
      const playerIds = players.map(p => p.id);
      const allAssessments = await base44.entities.PhysicalAssessment.list('-assessment_date');
      return allAssessments.filter(a => playerIds.includes(a.player_id));
    },
    enabled: players.length > 0
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ['teamEvaluations', teamId],
    queryFn: async () => {
      const playerIds = players.map(p => p.id);
      const allEvaluations = await base44.entities.Evaluation.list('-evaluation_date');
      return allEvaluations.filter(e => playerIds.includes(e.player_id));
    },
    enabled: players.length > 0
  });

  const createGameMutation = useMutation({
    mutationFn: (data) => base44.entities.Game.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['teamGames', teamId]);
      setShowGameDialog(false);
      resetGameForm();
    }
  });

  const updateGameMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Game.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['teamGames', teamId]);
      setShowGameDialog(false);
      setEditingGame(null);
      resetGameForm();
    }
  });

  const deleteGameMutation = useMutation({
    mutationFn: (id) => base44.entities.Game.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['teamGames', teamId]);
    }
  });

  const resetGameForm = () => {
    setGameForm({
      team_id: teamId,
      opponent: '',
      game_date: '',
      game_time: '',
      location: '',
      home_away: 'Home',
      team_score: '',
      opponent_score: '',
      result: 'Scheduled',
      season: new Date().getFullYear().toString(),
      notes: ''
    });
  };

  const handleEditGame = (game) => {
    setEditingGame(game);
    setGameForm({
      team_id: game.team_id,
      opponent: game.opponent || '',
      game_date: game.game_date || '',
      game_time: game.game_time || '',
      location: game.location || '',
      home_away: game.home_away || 'Home',
      team_score: game.team_score ?? '',
      opponent_score: game.opponent_score ?? '',
      result: game.result || 'Scheduled',
      season: game.season || new Date().getFullYear().toString(),
      notes: game.notes || ''
    });
    setShowGameDialog(true);
  };

  const handleSaveGame = () => {
    if (editingGame) {
      updateGameMutation.mutate({ id: editingGame.id, data: gameForm });
    } else {
      createGameMutation.mutate(gameForm);
    }
  };

  if (!team) return null;

  const wins = games.filter(g => g.result === 'Win').length;
  const losses = games.filter(g => g.result === 'Loss').length;
  const draws = games.filter(g => g.result === 'Draw').length;

  const playerStats = players.map(player => {
    const playerAssessments = assessments.filter(a => a.player_id === player.id);
    const playerEvaluations = evaluations.filter(e => e.player_id === player.id);
    const latestAssessment = playerAssessments[0];
    const latestEvaluation = playerEvaluations[0];

    const physicalScore = latestAssessment 
      ? Math.round((latestAssessment.speed + latestAssessment.agility + latestAssessment.power + latestAssessment.endurance) / 4)
      : 0;

    return {
      ...player,
      physicalScore,
      evalScore: latestEvaluation?.overall_rating || 0
    };
  }).sort((a, b) => b.physicalScore - a.physicalScore);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold"
            style={{ backgroundColor: team.team_color }}
          >
            {team.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-4xl font-bold text-slate-900">{team.name}</h1>
            <p className="text-slate-600 text-lg">{team.age_group} • {team.division} • {team.season}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Total Players</div>
                <div className="text-3xl font-bold text-slate-900 mt-1">{players.length}</div>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Games Played</div>
                <div className="text-3xl font-bold text-slate-900 mt-1">{wins + losses + draws}</div>
              </div>
              <Trophy className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Record</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{wins}-{losses}-{draws}</div>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Win Rate</div>
                <div className="text-3xl font-bold text-slate-900 mt-1">
                  {wins + losses + draws > 0 ? Math.round((wins / (wins + losses + draws)) * 100) : 0}%
                </div>
              </div>
              <Trophy className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="roster" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="roster">Roster</TabsTrigger>
          <TabsTrigger value="schedule">Schedule & Results</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="roster" className="space-y-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Team Roster</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {playerStats.map(player => (
                  <Link key={player.id} to={`${createPageUrl('PlayerProfile')}?id=${player.id}`}>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                          {player.jersey_number || '?'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{player.full_name}</div>
                          <div className="text-sm text-slate-600">{player.position}</div>
                        </div>
                      </div>
                      <Badge className={player.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>
                        {player.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
              {players.length === 0 && (
                <div className="text-center py-12 text-slate-500">No players in this team</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Game Schedule & Results</CardTitle>
                <Button onClick={() => { setEditingGame(null); resetGameForm(); setShowGameDialog(true); }} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Game
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {games.map(game => (
                  <div key={game.id} className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={
                            game.result === 'Win' ? 'bg-emerald-100 text-emerald-800' :
                            game.result === 'Loss' ? 'bg-red-100 text-red-800' :
                            game.result === 'Draw' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-slate-100 text-slate-800'
                          }>
                            {game.result}
                          </Badge>
                          <Badge variant="outline">{game.home_away}</Badge>
                        </div>
                        <div className="text-lg font-bold text-slate-900">vs {game.opponent}</div>
                        <div className="text-sm text-slate-600">
                          {new Date(game.game_date).toLocaleDateString()} {game.game_time && `• ${game.game_time}`}
                        </div>
                        {game.location && <div className="text-sm text-slate-600">{game.location}</div>}
                      </div>
                      <div className="text-right">
                        {game.result !== 'Scheduled' && (
                          <div className="text-3xl font-bold text-slate-900 mb-2">
                            {game.team_score} - {game.opponent_score}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" onClick={() => handleEditGame(game)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => deleteGameMutation.mutate(game.id)}>
                            <Trash className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    {game.notes && <div className="text-sm text-slate-600 mt-2">{game.notes}</div>}
                  </div>
                ))}
              </div>
              {games.length === 0 && (
                <div className="text-center py-12 text-slate-500">No games scheduled</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Player Performance Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {playerStats.slice(0, 10).map((player, idx) => (
                  <Link key={player.id} to={`${createPageUrl('PlayerProfile')}?id=${player.id}`}>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                          idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-orange-600' : 'bg-slate-300'
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{player.full_name}</div>
                          <div className="text-sm text-slate-600">{player.position}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-emerald-600">{player.physicalScore}</div>
                        <div className="text-xs text-slate-500">Physical Score</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Team Evaluations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-4xl font-bold text-slate-900 mb-2">{evaluations.length}</div>
                  <div className="text-slate-600">Total Evaluations</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Physical Assessments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-4xl font-bold text-slate-900 mb-2">{assessments.length}</div>
                  <div className="text-slate-600">Total Assessments</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showGameDialog} onOpenChange={setShowGameDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingGame ? 'Edit Game' : 'Add New Game'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Opponent *</Label>
                <Input
                  value={gameForm.opponent}
                  onChange={(e) => setGameForm({...gameForm, opponent: e.target.value})}
                  placeholder="Opponent team name"
                />
              </div>
              <div>
                <Label>Home/Away</Label>
                <Select value={gameForm.home_away} onValueChange={(value) => setGameForm({...gameForm, home_away: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Home">Home</SelectItem>
                    <SelectItem value="Away">Away</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Game Date *</Label>
                <Input
                  type="date"
                  value={gameForm.game_date}
                  onChange={(e) => setGameForm({...gameForm, game_date: e.target.value})}
                />
              </div>
              <div>
                <Label>Game Time</Label>
                <Input
                  type="time"
                  value={gameForm.game_time}
                  onChange={(e) => setGameForm({...gameForm, game_time: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={gameForm.location}
                onChange={(e) => setGameForm({...gameForm, location: e.target.value})}
                placeholder="Game location"
              />
            </div>
            <div>
              <Label>Result</Label>
              <Select value={gameForm.result} onValueChange={(value) => setGameForm({...gameForm, result: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Win">Win</SelectItem>
                  <SelectItem value="Loss">Loss</SelectItem>
                  <SelectItem value="Draw">Draw</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {gameForm.result !== 'Scheduled' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Team Score</Label>
                  <Input
                    type="number"
                    value={gameForm.team_score}
                    onChange={(e) => setGameForm({...gameForm, team_score: e.target.value})}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Opponent Score</Label>
                  <Input
                    type="number"
                    value={gameForm.opponent_score}
                    onChange={(e) => setGameForm({...gameForm, opponent_score: e.target.value})}
                    placeholder="0"
                  />
                </div>
              </div>
            )}
            <div>
              <Label>Notes</Label>
              <Textarea
                value={gameForm.notes}
                onChange={(e) => setGameForm({...gameForm, notes: e.target.value})}
                placeholder="Game notes..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowGameDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleSaveGame}
              disabled={!gameForm.opponent || !gameForm.game_date}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {editingGame ? 'Update Game' : 'Add Game'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}