import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, Loader2, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function AIGoalGenerator({ player, onUpdatePlayer, assessments }) {
  const [showDialog, setShowDialog] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedGoals, setGeneratedGoals] = useState([]);

  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations', player.id],
    queryFn: () => base44.entities.Evaluation.filter({ player_id: player.id }, '-created_date'),
    enabled: !!player.id
  });

  const latestEvaluation = evaluations[0];
  const latestAssessment = assessments?.[0];

  const handleGenerateGoals = async () => {
    setGenerating(true);
    try {
      const positionKnowledge = POSITION_KNOWLEDGE_BANK[player.primary_position] || {};
      
      const knowledgeContext = positionKnowledge.title ? `
Position: ${positionKnowledge.title}
Role: ${(positionKnowledge.role || []).join(', ')}
Key Traits: ${(positionKnowledge.traits || []).slice(0, 5).join(', ')}
Defending Focus: ${(positionKnowledge.defending?.balanced || []).slice(0, 2).map(r => r.title).join(', ')}
Attacking Focus: ${(positionKnowledge.attacking?.balanced || []).slice(0, 2).map(r => r.title).join(', ')}
` : '';

      const prompt = `Generate personalized development goals for a soccer player based on their evaluation data and position requirements.

${knowledgeContext}

Player Profile:

Player Profile:
- Name: ${player.full_name}
- Position: ${player.primary_position}
- Age: ${player.date_of_birth ? new Date().getFullYear() - new Date(player.date_of_birth).getFullYear() : 'Unknown'}

${latestEvaluation ? `Latest Evaluation Scores (1-10 scale):
- Growth Mindset: ${latestEvaluation.growth_mindset}
- Resilience: ${latestEvaluation.resilience}
- Athleticism: ${latestEvaluation.athleticism}
- Team Focus: ${latestEvaluation.team_focus}
- Defending Organized: ${latestEvaluation.defending_organized}
- Attacking Organized: ${latestEvaluation.attacking_organized}
- Strengths: ${latestEvaluation.player_strengths || 'N/A'}
- Areas of Growth: ${latestEvaluation.areas_of_growth || 'N/A'}
- Training Focus: ${latestEvaluation.training_focus || 'N/A'}` : 'No evaluation data available.'}

${latestAssessment ? `Physical Assessment:
- Speed: ${latestAssessment.speed_score}/100
- Power: ${latestAssessment.power_score}/100
- Endurance: ${latestAssessment.endurance_score}/100
- Agility: ${latestAssessment.agility_score}/100` : ''}

Based on this data, generate 3-5 SMART development goals that are:
1. Specific and measurable
2. Aligned with the player's position requirements
3. Address identified areas of growth and training focus
4. Mix of technical, tactical, physical, and mental aspects
5. Realistic timeframes (suggest 4-12 weeks per goal)

For each goal, provide:
- description: A clear, actionable goal statement
- plan_of_action: Specific steps to achieve this goal
- category: Technical, Tactical, Physical, or Mental
- suggested_weeks: Recommended timeframe in weeks`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            goals: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  description: { type: 'string' },
                  plan_of_action: { type: 'string' },
                  category: { type: 'string' },
                  suggested_weeks: { type: 'number' }
                }
              }
            }
          }
        }
      });

      const goals = response.goals.map((g, idx) => ({
        id: `ai_goal_${Date.now()}_${idx}`,
        description: g.description,
        plan_of_action: g.plan_of_action,
        category: g.category,
        start_date: new Date().toISOString().split('T')[0],
        suggested_completion_date: new Date(Date.now() + g.suggested_weeks * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        progress: 0,
        completed: false,
        created_date: new Date().toISOString()
      }));

      setGeneratedGoals(goals);
    } catch (error) {
      toast.error('Failed to generate goals');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const handleAddGoals = () => {
    const existingGoals = player.goals || [];
    const updatedGoals = [...existingGoals, ...generatedGoals];
    onUpdatePlayer({ goals: updatedGoals });
    setShowDialog(false);
    setGeneratedGoals([]);
    toast.success(`Added ${generatedGoals.length} goals`);
  };

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        size="sm"
        variant="outline"
        className="border-purple-300 text-purple-700 hover:bg-purple-50">
        
        <Sparkles className="w-4 h-4 mr-1" />
        Adil's Goals
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold leading-none tracking-tight flex items-center gap-2">Adil's Generated Goals


            </DialogTitle>
          </DialogHeader>

          {generatedGoals.length === 0 ?
          <div className="py-8 text-center">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-purple-600" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Generate Personalized Goals</h3>
              <p className="text-slate-600 mb-6">
                Adil will analyze {player.full_name}'s evaluations, assessments, and position to create tailored development goals.
              </p>
              {!latestEvaluation &&
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  ⚠️ No evaluation data available. Goals will be based on position and physical data only.
                </div>
            }
              <Button
              onClick={handleGenerateGoals}
              disabled={generating}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              
                {generating ?
              <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Goals...
                  </> :

              <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Goals
                  </>
              }
              </Button>
            </div> :

          <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span className="font-semibold text-slate-900">{generatedGoals.length} goals generated</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => setGeneratedGoals([])}>
                  Regenerate
                </Button>
              </div>

              <div className="space-y-3">
                {generatedGoals.map((goal) =>
              <div key={goal.id} className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900">{goal.description}</h4>
                        <p className="text-sm text-slate-600 mt-1">{goal.plan_of_action}</p>
                      </div>
                      <Badge className={`ml-2 ${
                  goal.category === 'Technical' ? 'bg-blue-100 text-blue-800' :
                  goal.category === 'Tactical' ? 'bg-purple-100 text-purple-800' :
                  goal.category === 'Physical' ? 'bg-red-100 text-red-800' :
                  'bg-green-100 text-green-800'}`
                  }>
                        {goal.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-slate-500">
                        📅 {new Date(goal.start_date).toLocaleDateString()} → {new Date(goal.suggested_completion_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
              )}
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleAddGoals} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                  Add All Goals to Player
                </Button>
              </div>
            </div>
          }
        </DialogContent>
      </Dialog>
    </>);

}