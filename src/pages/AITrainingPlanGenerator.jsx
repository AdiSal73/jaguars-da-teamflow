import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AITrainingPlanGenerator() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const playerId = urlParams.get('playerId');

  const [generating, setGenerating] = useState(false);
  const [generatedModules, setGeneratedModules] = useState([]);

  const { data: player } = useQuery({
    queryKey: ['player', playerId],
    queryFn: async () => {
      const players = await base44.entities.Player.filter({ id: playerId });
      return players[0];
    },
    enabled: !!playerId
  });

  const { data: pathway } = useQuery({
    queryKey: ['pathway', playerId],
    queryFn: async () => {
      const pathways = await base44.entities.DevelopmentPathway.filter({ player_id: playerId });
      return pathways[0] || null;
    },
    enabled: !!playerId
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments', playerId],
    queryFn: () => base44.entities.PhysicalAssessment.filter({ player_id: playerId }, '-assessment_date'),
    enabled: !!playerId
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations', playerId],
    queryFn: () => base44.entities.Evaluation.filter({ player_id: playerId }, '-created_date'),
    enabled: !!playerId
  });

  const updatePathwayMutation = useMutation({
    mutationFn: (data) => {
      if (pathway?.id) {
        return base44.entities.DevelopmentPathway.update(pathway.id, data);
      } else {
        return base44.entities.DevelopmentPathway.create({
          player_id: playerId,
          position: player.primary_position,
          ...data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pathway', playerId]);
      toast.success('Training modules added successfully');
      navigate(`${createPageUrl('PlayerDashboard')}?id=${playerId}`);
    }
  });

  const handleGeneratePlan = async () => {
    setGenerating(true);
    try {
      const latestAssessment = assessments[0];
      const latestEvaluation = evaluations[0];

      const prompt = `Generate a personalized training plan for a soccer player with the following profile:

Name: ${player.full_name}
Position: ${player.primary_position}
Age: ${player.date_of_birth ? new Date().getFullYear() - new Date(player.date_of_birth).getFullYear() : 'Unknown'}

${latestAssessment ? `Physical Assessment:
- Speed Score: ${latestAssessment.speed_score}/100
- Power Score: ${latestAssessment.power_score}/100
- Endurance Score: ${latestAssessment.endurance_score}/100
- Agility Score: ${latestAssessment.agility_score}/100` : ''}

${latestEvaluation ? `Latest Evaluation:
- Growth Mindset: ${latestEvaluation.growth_mindset}/10
- Athleticism: ${latestEvaluation.athleticism}/10
- Strengths: ${latestEvaluation.player_strengths || 'N/A'}
- Areas of Growth: ${latestEvaluation.areas_of_growth || 'N/A'}
- Training Focus: ${latestEvaluation.training_focus || 'N/A'}` : ''}

${player.goals?.length > 0 ? `Current Goals:
${player.goals.map(g => `- ${g.description} (${g.progress}% complete)`).join('\n')}` : ''}

Please generate 4-6 specific training modules that will help this player develop. Each module should include:
1. A specific, actionable title
2. A brief description of what the module covers
3. Training type (Mobility Training, Technical Training, Functional Training, Video Analysis/Tactical Training)
4. Priority (High/Medium/Low)
5. Recommended weekly sessions (1-5)
6. Duration of the program in weeks (2-12)
7. Session duration in minutes (30-90)

Focus on the player's position-specific needs and identified areas of growth.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            modules: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  training_type: { type: 'string' },
                  priority: { type: 'string' },
                  weekly_sessions: { type: 'number' },
                  number_of_weeks: { type: 'number' },
                  session_duration: { type: 'number' }
                }
              }
            }
          }
        }
      });

      const modules = response.modules.map((m, idx) => ({
        id: `ai_module_${Date.now()}_${idx}`,
        ...m,
        auto_suggested: true,
        completed: false,
        start_date: new Date().toISOString().split('T')[0]
      }));

      setGeneratedModules(modules);
    } catch (error) {
      toast.error('Failed to generate training plan');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const handleAddModules = () => {
    const existingModules = pathway?.training_modules || [];
    const updatedModules = [...existingModules, ...generatedModules];
    updatePathwayMutation.mutate({ training_modules: updatedModules });
  };

  if (!player) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-slate-500">Loading player...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-emerald-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(`${createPageUrl('PlayerDashboard')}?id=${playerId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              AI Training Plan Generator
            </h1>
            <p className="text-slate-600 mt-1">Generate personalized training modules for {player.full_name}</p>
          </div>
        </div>

        <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm mb-6">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Player Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-600 mb-1">Position</div>
                <div className="font-semibold text-slate-900">{player.primary_position || 'Not set'}</div>
              </div>
              <div>
                <div className="text-sm text-slate-600 mb-1">Current Goals</div>
                <div className="font-semibold text-slate-900">{player.goals?.length || 0} active goals</div>
              </div>
              {assessments[0] && (
                <>
                  <div>
                    <div className="text-sm text-slate-600 mb-1">Latest Physical Scores</div>
                    <div className="flex gap-2">
                      <Badge className="bg-red-100 text-red-800">Speed: {assessments[0].speed_score}</Badge>
                      <Badge className="bg-blue-100 text-blue-800">Power: {assessments[0].power_score}</Badge>
                    </div>
                  </div>
                </>
              )}
              {evaluations[0] && (
                <div>
                  <div className="text-sm text-slate-600 mb-1">Areas of Growth</div>
                  <div className="text-sm text-slate-700">{evaluations[0].areas_of_growth || 'Not specified'}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {generatedModules.length === 0 ? (
          <Card className="border-none shadow-xl bg-gradient-to-br from-purple-100 to-blue-100">
            <CardContent className="p-12 text-center">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-purple-600" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">Ready to Generate Training Plan</h3>
              <p className="text-slate-600 mb-6">
               Adil will analyze {player.full_name}'s profile, assessments, and goals to create a personalized training plan.
              </p>
              <Button 
                onClick={handleGeneratePlan} 
                disabled={generating}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                size="lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Plan...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Training Plan
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm mb-6">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    Generated Training Modules ({generatedModules.length})
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setGeneratedModules([])}>
                      Regenerate
                    </Button>
                    <Button onClick={handleAddModules} className="bg-emerald-600 hover:bg-emerald-700">
                      Add to Player Profile
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {generatedModules.map(module => (
                    <div key={module.id} className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-bold text-slate-900">{module.title}</h4>
                          <p className="text-sm text-slate-600 mt-1">{module.description}</p>
                        </div>
                        <Badge className={`${
                          module.priority === 'High' ? 'bg-red-100 text-red-800' :
                          module.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {module.priority}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Badge className="bg-indigo-100 text-indigo-800">{module.training_type}</Badge>
                        <Badge variant="outline">{module.weekly_sessions}x per week</Badge>
                        <Badge variant="outline">{module.number_of_weeks} weeks</Badge>
                        <Badge variant="outline">{module.session_duration} min/session</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}