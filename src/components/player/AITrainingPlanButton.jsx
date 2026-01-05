import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Target, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { POSITION_KNOWLEDGE_BANK } from '../constants/positionKnowledgeBank';

export default function AITrainingPlanButton({ player, pathway, evaluations, onUpdatePathway }) {
  const [generating, setGenerating] = useState(false);

  const generateTrainingModules = async () => {
    setGenerating(true);
    try {
      const latestEval = evaluations?.[0];
      const positionKnowledge = POSITION_KNOWLEDGE_BANK[player.primary_position] || {};
      
      // Build context from PDP and Knowledge Bank
      const pdpContext = `
Michigan Jaguars Player Development Program Context:
- Mission: Training quality players while gaining lifelong lessons and experiences
- Core Values: Respect, Unity, Development/Growth, Competitiveness, Enjoyment
- Game Philosophy: Win the challenge, Be aggressive, Meaningful possession, Confident & creative soccer
- Age Stage: ${player.grad_year ? `Graduate ${player.grad_year}` : 'Development stage'}
`;

      const defendingContext = Object.entries(positionKnowledge.defending || {}).map(([phase, dataArray]) =>
        `  ${phase}: ${dataArray.map(d => d.points?.slice(0, 3).join(', ')).filter(Boolean).join(', ')}`
      ).join('\n');

      const attackingContext = Object.entries(positionKnowledge.attacking || {}).map(([phase, dataArray]) =>
        `  ${phase}: ${dataArray.map(d => d.points?.slice(0, 3).join(', ')).filter(Boolean).join(', ')}`
      ).join('\n');

      const positionContext = (positionKnowledge.defending || positionKnowledge.attacking) ? `
Position-Specific Knowledge for ${player.primary_position}:
${positionKnowledge.title ? `Position Title: ${positionKnowledge.title}` : ''}
${positionKnowledge.role && positionKnowledge.role.length > 0 ? `Key Roles: ${positionKnowledge.role.join(', ')}` : ''}
${positionKnowledge.traits && positionKnowledge.traits.length > 0 ? `Key Traits: ${positionKnowledge.traits.join(', ')}` : ''}

Defending Phases:
${defendingContext}

Attacking Phases:
${attackingContext}
` : '';

      const evaluationContext = latestEval ? `
Latest Player Evaluation:
- Overall Score: ${latestEval.overall_score?.toFixed(1) || 'N/A'}
- Strengths: ${latestEval.player_strengths || 'Not specified'}
- Areas of Growth: ${latestEval.areas_of_growth || 'Not specified'}
- Training Focus: ${latestEval.training_focus || 'Not specified'}
- Mental: Growth Mindset ${latestEval.growth_mindset}/10, Resilience ${latestEval.resilience}/10
- Physical: Athleticism ${latestEval.athleticism}/10
- Technical: Efficiency ${latestEval.efficiency_in_execution}/10
` : '';

      const prompt = `You are Adil, a professional soccer development coach for Michigan Jaguars FC.

${pdpContext}
${positionContext}
${evaluationContext}

Player: ${player.full_name}
Position: ${player.primary_position}

Based on the PDP philosophy, position-specific knowledge bank, and player evaluation, create 3-4 targeted training modules.

Each module should include:
- Title: specific module name
- Description: what the module addresses (50-80 words)
- Training Type: Mobility Training, Technical Training, Functional Training, or Video Analysis/Tactical Training
- Priority: High, Medium, or Low
- Weekly Sessions: 2
- Number of Weeks: 4
- Session Duration: 60 minutes
- Preventative Measures: specific injury prevention tips`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            modules: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  training_type: { type: "string" },
                  priority: { type: "string" },
                  weekly_sessions: { type: "number" },
                  number_of_weeks: { type: "number" },
                  session_duration: { type: "number" },
                  preventative_measures: { type: "string" }
                }
              }
            }
          }
        }
      });

      const modules = (response.modules || []).map(m => ({
        id: `module_${Date.now()}_${Math.random()}`,
        ...m,
        completed: false,
        auto_suggested: true,
        resource_link: '/fitness-resources',
        start_date: new Date().toISOString().split('T')[0]
      }));

      const existingModules = pathway?.training_modules || [];
      onUpdatePathway({ training_modules: [...existingModules, ...modules] });
      
      toast.success(`Generated ${modules.length} training modules`);
    } catch (error) {
      console.error('Error generating modules:', error);
      toast.error('Failed to generate training modules');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button 
      size="sm" 
      variant="outline" 
      className="border-purple-300 text-purple-700 hover:bg-purple-50"
      onClick={generateTrainingModules}
      disabled={generating}
    >
      {generating ? (
        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
      ) : (
        <Target className="w-4 h-4 mr-1" />
      )}
      Adil's Recommendations
    </Button>
  );
}