import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function TacticalPlayerProfile() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const playerId = urlParams.get('id');

  const { data: player } = useQuery({
    queryKey: ['player', playerId],
    queryFn: async () => {
      const players = await base44.entities.Player.list();
      return players.find(p => p.id === playerId);
    }
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments', playerId],
    queryFn: () => base44.entities.PhysicalAssessment.filter({ player_id: playerId }, '-assessment_date')
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations', playerId],
    queryFn: () => base44.entities.Evaluation.filter({ player_id: playerId }, '-created_date')
  });

  const { data: team } = useQuery({
    queryKey: ['team', player?.team_id],
    queryFn: async () => {
      if (!player?.team_id) return null;
      const teams = await base44.entities.Team.list();
      return teams.find(t => t.id === player.team_id);
    },
    enabled: !!player?.team_id
  });

  const latestEval = evaluations[0];
  const latestAssessment = assessments[0];

  const attributes = [
    { category: 'Mental & Character', items: [
      { name: 'Growth Mindset', value: latestEval?.growth_mindset || 0, max: 10 },
      { name: 'Resilience', value: latestEval?.resilience || 0, max: 10 },
      { name: 'Team Focus', value: latestEval?.team_focus || 0, max: 10 }
    ]},
    { category: 'Physical', items: [
      { name: 'Speed', value: latestAssessment?.speed_score || 0, max: 100 },
      { name: 'Power', value: latestAssessment?.power_score || 0, max: 100 },
      { name: 'Endurance', value: latestAssessment?.endurance_score || 0, max: 100 },
      { name: 'Agility', value: latestAssessment?.agility_score || 0, max: 100 }
    ]},
    { category: 'Defending', items: [
      { name: 'Organized', value: latestEval?.defending_organized || 0, max: 10 },
      { name: 'Final Third', value: latestEval?.defending_final_third || 0, max: 10 },
      { name: 'Transition', value: latestEval?.defending_transition || 0, max: 10 }
    ]},
    { category: 'Attacking', items: [
      { name: 'Organized', value: latestEval?.attacking_organized || 0, max: 10 },
      { name: 'Final Third', value: latestEval?.attacking_final_third || 0, max: 10 },
      { name: 'Transition', value: latestEval?.attacking_in_transition || 0, max: 10 }
    ]}
  ];

  const getBarColor = (value, max) => {
    const percentage = (value / max) * 100;
    if (percentage >= 80) return 'bg-emerald-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 text-white hover:text-white hover:bg-slate-700">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="grid md:grid-cols-[300px_1fr] gap-6">
          {/* Left Panel - Player Info */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <div className="p-6 space-y-6">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center text-6xl font-bold mb-4">
                  {player?.jersey_number || player?.full_name?.charAt(0)}
                </div>
                <h2 className="text-2xl font-bold mb-1">{player?.full_name}</h2>
                <p className="text-slate-400 text-sm">{player?.primary_position}</p>
                <Badge className="mt-2 bg-emerald-600">{player?.status}</Badge>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-slate-700">
                  <span className="text-slate-400">Team</span>
                  <span className="font-semibold">{team?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-700">
                  <span className="text-slate-400">Age Group</span>
                  <span className="font-semibold">{team?.age_group || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-700">
                  <span className="text-slate-400">Date of Birth</span>
                  <span className="font-semibold">
                    {player?.date_of_birth ? new Date(player.date_of_birth).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-700">
                  <span className="text-slate-400">Preferred Foot</span>
                  <span className="font-semibold">{player?.preferred_foot || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-700">
                  <span className="text-slate-400">Height</span>
                  <span className="font-semibold">{player?.height ? `${player.height} cm` : 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-700">
                  <span className="text-slate-400">Weight</span>
                  <span className="font-semibold">{player?.weight ? `${player.weight} kg` : 'N/A'}</span>
                </div>
              </div>

              {latestAssessment && (
                <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
                  <div className="text-xs text-slate-400 mb-2">Overall Score</div>
                  <div className="text-4xl font-bold text-emerald-500">{latestAssessment.overall_score || 0}</div>
                </div>
              )}
            </div>
          </Card>

          {/* Right Panel - Attributes */}
          <div className="space-y-4">
            {attributes.map((section) => (
              <Card key={section.category} className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <div className="p-4 md:p-6">
                  <h3 className="text-lg font-bold mb-4 border-b border-slate-700 pb-2">{section.category}</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {section.items.map((attr) => (
                      <div key={attr.name} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-300">{attr.name}</span>
                          <span className="text-lg font-bold">{attr.value}</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getBarColor(attr.value, attr.max)} transition-all duration-300`}
                            style={{ width: `${(attr.value / attr.max) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}

            {latestEval && (
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <div className="p-4 md:p-6">
                  <h3 className="text-lg font-bold mb-4 border-b border-slate-700 pb-2">Development Notes</h3>
                  <div className="space-y-4">
                    {latestEval.player_strengths && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-emerald-500" />
                          <span className="text-sm font-semibold text-emerald-500">Strengths</span>
                        </div>
                        <p className="text-sm text-slate-300 pl-6">{latestEval.player_strengths}</p>
                      </div>
                    )}
                    {latestEval.areas_of_growth && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingDown className="w-4 h-4 text-orange-500" />
                          <span className="text-sm font-semibold text-orange-500">Areas of Growth</span>
                        </div>
                        <p className="text-sm text-slate-300 pl-6">{latestEval.areas_of_growth}</p>
                      </div>
                    )}
                    {latestEval.training_focus && (
                      <div>
                        <div className="text-sm font-semibold text-blue-500 mb-2">Training Focus</div>
                        <p className="text-sm text-slate-300 pl-6">{latestEval.training_focus}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}