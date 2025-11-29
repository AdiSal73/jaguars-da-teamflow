import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { createPageUrl } from '@/utils';
import { ArrowLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const teamRoleColors = {
  'Indispensable Player': 'bg-purple-600',
  'GA Starter': 'bg-emerald-600',
  'GA Rotation': 'bg-teal-600',
  'Aspire Starter': 'bg-blue-600',
  'Aspire Rotation': 'bg-cyan-600',
  'United Starter': 'bg-orange-600',
  'United Rotation': 'bg-amber-600'
};

export default function TeamTacticalView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const teamIdParam = urlParams.get('teamId');
  const [selectedTeam, setSelectedTeam] = useState(teamIdParam || '');
  const [selectedFormation, setSelectedFormation] = useState('4-3-3');

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const { data: allPlayers = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => base44.entities.PhysicalAssessment.list()
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations'],
    queryFn: () => base44.entities.Evaluation.list()
  });

  const { data: tryouts = [] } = useQuery({
    queryKey: ['tryouts'],
    queryFn: () => base44.entities.PlayerTryout.list()
  });

  const team = teams.find((t) => t.id === selectedTeam);
  const players = allPlayers.filter((p) => p.team_id === selectedTeam);

  const getPlayerStats = (playerId) => {
    const playerAssessments = assessments.filter((a) => a.player_id === playerId).sort((a, b) =>
    new Date(b.assessment_date) - new Date(a.assessment_date)
    );
    const playerEvaluations = evaluations.filter((e) => e.player_id === playerId).sort((a, b) =>
    new Date(b.created_date) - new Date(a.created_date)
    );
    const tryout = tryouts.find((t) => t.player_id === playerId);

    return {
      assessment: playerAssessments[0],
      evaluation: playerEvaluations[0],
      tryout
    };
  };

  const formations = {
    '4-3-3': [
    { pos: 'GK', x: 50, y: 90 },
    { pos: 'RB', x: 80, y: 70 }, { pos: 'RCB', x: 60, y: 70 }, { pos: 'LCB', x: 40, y: 70 }, { pos: 'LB', x: 20, y: 70 },
    { pos: 'CM', x: 65, y: 45 }, { pos: 'DM', x: 50, y: 50 }, { pos: 'CAM', x: 35, y: 45 },
    { pos: 'RW', x: 75, y: 20 }, { pos: 'ST', x: 50, y: 15 }, { pos: 'LW', x: 25, y: 20 }],

    '4-2-3-1': [
    { pos: 'GK', x: 50, y: 90 },
    { pos: 'RB', x: 80, y: 70 }, { pos: 'RCB', x: 60, y: 70 }, { pos: 'LCB', x: 40, y: 70 }, { pos: 'LB', x: 20, y: 70 },
    { pos: 'DM', x: 60, y: 55 }, { pos: 'CM', x: 40, y: 55 },
    { pos: 'RW', x: 75, y: 35 }, { pos: 'CAM', x: 50, y: 35 }, { pos: 'LW', x: 25, y: 35 },
    { pos: 'ST', x: 50, y: 15 }]

  };

  const positionMap = {
    'GK': 'GK',
    'Right Outside Back': 'RB',
    'Left Outside Back': 'LB',
    'Right Centerback': 'RCB',
    'Left Centerback': 'LCB',
    'Defensive Midfielder': 'DM',
    'Right Winger': 'RW',
    'Center Midfielder': 'CM',
    'Forward': 'ST',
    'Attacking Midfielder': 'CAM',
    'Left Winger': 'LW'
  };

  const formationPositions = formations[selectedFormation] || formations['4-3-3'];

  const updateRankingMutation = useMutation({
    mutationFn: async ({ playerId, newRanking, position }) => {
      const player = allPlayers.find(p => p.id === playerId);
      const existingTryout = tryouts.find(t => t.player_id === playerId);
      const teamData = teams.find(t => t.id === player?.team_id);

      if (existingTryout) {
        return base44.entities.PlayerTryout.update(existingTryout.id, { team_ranking: newRanking, primary_position: position });
      } else {
        return base44.entities.PlayerTryout.create({
          player_id: playerId,
          player_name: player?.full_name,
          current_team: teamData?.name,
          primary_position: position,
          team_ranking: newRanking
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tryouts']);
    }
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const draggedPlayerId = result.draggableId.replace('player-', '');
    const newRanking = result.destination.index + 1;
    updateRankingMutation.mutate({ playerId: draggedPlayerId, newRanking });
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 md:p-8">
        <div className="mx-auto max-w-[1800px]">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 text-white hover:text-white hover:bg-slate-700/50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{team?.name || 'Team Tactical View'}</h1>
              <p className="text-slate-300">{team?.age_group} • {team?.league}</p>
            </div>
            <div className="flex gap-3">
              <Select value={selectedFormation} onValueChange={setSelectedFormation}>
                <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4-3-3">4-3-3</SelectItem>
                  <SelectItem value="4-2-3-1">4-2-3-1</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t) =>
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_450px] gap-6">
          {/* Formation View */}
          <Card className="bg-slate-800/70 border-slate-600 backdrop-blur-md overflow-hidden">
            <div className="relative w-full" style={{ paddingBottom: '140%', maxHeight: '800px', background: 'linear-gradient(180deg, #0f4c2e 0%, #15803d 50%, #0f4c2e 100%)' }}>
              <div className="absolute inset-0">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 140" preserveAspectRatio="none">
                  <rect x="2" y="2" width="96" height="136" fill="none" stroke="white" strokeWidth="0.3" opacity="0.4" />
                  <line x1="2" y1="70" x2="98" y2="70" stroke="white" strokeWidth="0.3" opacity="0.4" />
                  <circle cx="50" cy="70" r="8" fill="none" stroke="white" strokeWidth="0.3" opacity="0.4" />
                  <circle cx="50" cy="70" r="0.5" fill="white" opacity="0.4" />
                  <rect x="20" y="2" width="60" height="15" fill="none" stroke="white" strokeWidth="0.3" opacity="0.4" />
                  <rect x="20" y="123" width="60" height="15" fill="none" stroke="white" strokeWidth="0.3" opacity="0.4" />
                </svg>

                {formationPositions.map((formPos) => {
                  const fullPosition = Object.keys(positionMap).find((key) => positionMap[key] === formPos.pos);
                  const positionPlayers = players.filter((p) => p.primary_position === fullPosition);
                  const topPlayer = positionPlayers.sort((a, b) => {
                    const tryoutA = tryouts.find((t) => t.player_id === a.id);
                    const tryoutB = tryouts.find((t) => t.player_id === b.id);
                    return (tryoutA?.team_ranking || 9999) - (tryoutB?.team_ranking || 9999);
                  })[0];

                  return (
                    <button
                      key={formPos.pos}
                      onClick={() => topPlayer && navigate(`${createPageUrl('TacticalPlayerDashboard')}?id=${topPlayer.id}`)}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                      style={{
                        left: `${formPos.x}%`,
                        top: `${formPos.y}%`
                      }}>

                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-slate-700 to-slate-900 border-2 border-white rounded-full flex items-center justify-center font-bold text-xs md:text-sm shadow-2xl group-hover:scale-110 transition-all text-white">
                          {topPlayer?.jersey_number || <User className="w-5 h-5 md:w-6 md:h-6 text-white" />}
                        </div>
                        <div className="mt-1 md:mt-2 px-2 py-0.5 md:py-1 bg-slate-800/95 backdrop-blur-sm rounded-md text-[10px] md:text-xs font-bold shadow-xl border border-white/40 text-white">
                          {topPlayer?.full_name?.split(' ').pop() || formPos.pos}
                        </div>
                      </div>
                    </button>);

                })}
              </div>
            </div>
          </Card>

          {/* Player List */}
          <Card className="bg-slate-800/70 border-slate-600 backdrop-blur-md h-fit">
            <div className="p-4 md:p-6">
              <h3 className="text-xl font-bold mb-4 border-b border-slate-600 pb-3 text-white">Squad Selection</h3>
              <Droppable droppableId="squad-list">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2 max-h-[700px] overflow-y-auto">
                    {players
                      .sort((a, b) => {
                        const tryoutA = tryouts.find((t) => t.player_id === a.id);
                        const tryoutB = tryouts.find((t) => t.player_id === b.id);
                        return (tryoutA?.team_ranking || 9999) - (tryoutB?.team_ranking || 9999);
                      })
                      .map((player, index) => {
                        const stats = getPlayerStats(player.id);
                        return (
                          <Draggable key={player.id} draggableId={`player-${player.id}`} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <button
                                  onClick={() => !snapshot.isDragging && navigate(`${createPageUrl('TacticalPlayerDashboard')}?id=${player.id}`)}
                                  className={`w-full p-3 rounded-lg transition-all text-left border-2 ${
                                    snapshot.isDragging 
                                      ? 'bg-slate-600 border-emerald-400 shadow-2xl scale-105' 
                                      : 'bg-slate-700/50 border-slate-600 hover:bg-slate-600 hover:border-emerald-500'
                                  }`}
                                >
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                                      {player.jersey_number || <User className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-bold text-sm text-white">{player.full_name}</div>
                                      <div className="text-slate-300 text-xs">{player.primary_position}</div>
                                    </div>
                                    {stats.assessment && (
                                      <div className="text-right">
                                        <div className="text-2xl font-bold text-emerald-400">{stats.assessment.overall_score}</div>
                                        <div className="text-[10px] text-slate-400">Overall</div>
                                      </div>
                                    )}
                                  </div>
                                  {stats.tryout?.team_role && (
                                    <Badge className={`${teamRoleColors[stats.tryout.team_role]} text-white text-[10px] mr-2`}>
                                      {stats.tryout.team_role}
                                    </Badge>
                                  )}
                                  {stats.tryout?.recommendation && (
                                    <Badge className={`text-[10px] text-white ${
                                      stats.tryout.recommendation === 'Move up' ? 'bg-emerald-500' :
                                      stats.tryout.recommendation === 'Move down' ? 'bg-orange-500' :
                                      'bg-blue-500'
                                    }`}>
                                      {stats.tryout.recommendation}
                                    </Badge>
                                  )}
                                  {stats.assessment && (
                                    <div className="grid grid-cols-4 gap-2 mt-3 text-[10px]">
                                      <div className="text-center p-2 bg-slate-600/50 rounded">
                                        <div className="text-red-400 font-bold">{stats.assessment.speed_score}</div>
                                        <div className="text-slate-400">Speed</div>
                                      </div>
                                      <div className="text-center p-2 bg-slate-600/50 rounded">
                                        <div className="text-blue-400 font-bold">{stats.assessment.power_score}</div>
                                        <div className="text-slate-400">Power</div>
                                      </div>
                                      <div className="text-center p-2 bg-slate-600/50 rounded">
                                        <div className="text-emerald-400 font-bold">{stats.assessment.endurance_score}</div>
                                        <div className="text-slate-400">Endurance</div>
                                      </div>
                                      <div className="text-center p-2 bg-slate-600/50 rounded">
                                        <div className="text-pink-400 font-bold">{stats.assessment.agility_score}</div>
                                        <div className="text-slate-400">Agility</div>
                                      </div>
                                    </div>
                                  )}
                                </button>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </Card>
          </div>
        </div>
      </div>
    </DragDropContext>
  );
}