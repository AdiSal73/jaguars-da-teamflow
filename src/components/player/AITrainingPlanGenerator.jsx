import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, Loader2, CheckCircle, Calendar, TrendingDown, Target } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AITrainingPlanGenerator({ player, pathway, assessments, evaluations, onAddModules }) {
  const [showDialog, setShowDialog] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedModules, setSelectedModules] = useState([]);
  const [weeklyFocus, setWeeklyFocus] = useState('');
  const [feedbackData, setFeedbackData] = useState([]);

  const generatePlanMutation = useMutation({
    mutationFn: async () => {
      // Fetch player feedback
      const feedback = await base44.entities.TrainingFeedback.filter({ player_id: player.id }, '-session_date', 20);
      setFeedbackData(feedback);

      const latestAssessment = assessments[0];
      const previousAssessment = assessments[1];
      const latestEval = evaluations[0];
      
      // Calculate performance trends
      const performanceTrend = previousAssessment ? {
        speed_change: (latestAssessment?.speed_score || 0) - (previousAssessment?.speed_score || 0),
        power_change: (latestAssessment?.power_score || 0) - (previousAssessment?.power_score || 0),
        endurance_change: (latestAssessment?.endurance_score || 0) - (previousAssessment?.endurance_score || 0),
        agility_change: (latestAssessment?.agility_score || 0) - (previousAssessment?.agility_score || 0)
      } : null;
      
      const weakAreas = [];
      if (latestAssessment) {
        if (latestAssessment.speed_score < 50) weakAreas.push('Speed (Sprint: ' + latestAssessment.sprint?.toFixed(2) + 's)');
        if (latestAssessment.power_score < 50) weakAreas.push('Power (Vertical: ' + latestAssessment.vertical + '")');
        if (latestAssessment.endurance_score < 50) weakAreas.push('Endurance (YIRT: ' + latestAssessment.yirt + ')');
        if (latestAssessment.agility_score < 50) weakAreas.push('Agility (Shuttle: ' + latestAssessment.shuttle?.toFixed(2) + 's)');
      }

      const lowSkills = (pathway?.skill_matrix || [])
        .filter(s => s.current_rating < s.target_rating)
        .sort((a, b) => (a.target_rating - a.current_rating) - (b.target_rating - b.current_rating))
        .slice(0, 5)
        .map(s => `${s.skill_name} (${s.current_rating}/${s.target_rating})`);

      // Analyze feedback patterns
      const feedbackAnalysis = feedback.length > 0 ? {
        avg_exertion: (feedback.reduce((sum, f) => sum + (f.perceived_exertion || 0), 0) / feedback.length).toFixed(1),
        completion_rate: ((feedback.filter(f => f.completion_status === 'Completed').length / feedback.length) * 100).toFixed(0) + '%',
        difficulty_feedback: feedback.filter(f => f.felt_difficulty === 'Too Hard').length > feedback.length * 0.3 ? 'Many sessions felt too hard - consider reducing intensity' : 
                            feedback.filter(f => f.felt_difficulty === 'Too Easy').length > feedback.length * 0.3 ? 'Many sessions felt too easy - increase challenge' : 
                            'Difficulty level appears appropriate',
        recent_skips: feedback.slice(0, 5).filter(f => f.completion_status === 'Skipped').length
      } : null;

      const prompt = `You are a professional soccer development coach with expertise in adaptive training methodologies. Create a personalized 4-week training plan for:

Player: ${player.full_name}
Position: ${player.primary_position}
Current Level: ${pathway?.current_level || 'Intermediate'}

PERFORMANCE DATA:
Physical Weaknesses: ${weakAreas.length > 0 ? weakAreas.join(', ') : 'None identified'}
Skills Needing Improvement: ${lowSkills.length > 0 ? lowSkills.join(', ') : 'On track'}

${performanceTrend ? `PERFORMANCE TREND (Recent Changes):
- Speed: ${performanceTrend.speed_change > 0 ? '+' : ''}${performanceTrend.speed_change} (${performanceTrend.speed_change > 0 ? 'Improving ✓' : performanceTrend.speed_change < 0 ? 'Declining ⚠' : 'Stable'})
- Power: ${performanceTrend.power_change > 0 ? '+' : ''}${performanceTrend.power_change} (${performanceTrend.power_change > 0 ? 'Improving ✓' : performanceTrend.power_change < 0 ? 'Declining ⚠' : 'Stable'})
- Endurance: ${performanceTrend.endurance_change > 0 ? '+' : ''}${performanceTrend.endurance_change} (${performanceTrend.endurance_change > 0 ? 'Improving ✓' : performanceTrend.endurance_change < 0 ? 'Declining ⚠' : 'Stable'})
- Agility: ${performanceTrend.agility_change > 0 ? '+' : ''}${performanceTrend.agility_change} (${performanceTrend.agility_change > 0 ? 'Improving ✓' : performanceTrend.agility_change < 0 ? 'Declining ⚠' : 'Stable'})` : ''}

${feedbackAnalysis ? `ADAPTIVE LEARNING - PLAYER FEEDBACK ANALYSIS:
- Average RPE (Rate of Perceived Exertion): ${feedbackAnalysis.avg_exertion}/10
- Session Completion Rate: ${feedbackAnalysis.completion_rate}
- Difficulty Assessment: ${feedbackAnalysis.difficulty_feedback}
- Recent Skipped Sessions: ${feedbackAnalysis.recent_skips}
${feedbackAnalysis.avg_exertion > 8 ? '⚠️ HIGH EXERTION - Player may be overtraining, reduce intensity' : ''}
${feedbackAnalysis.recent_skips > 2 ? '⚠️ MULTIPLE SKIPS - Plan may be too demanding or motivation issue' : ''}
${feedbackAnalysis.avg_exertion < 5 ? '📈 LOW EXERTION - Player can handle more challenging workload' : ''}

ADAPTIVE RECOMMENDATIONS:
${feedbackAnalysis.avg_exertion > 8 ? '- Reduce training volume by 15-20%\n- Include more recovery sessions\n- Lower intensity targets' : ''}
${feedbackAnalysis.avg_exertion < 5 ? '- Increase training intensity by 10-15%\n- Add more challenging exercises\n- Reduce rest periods' : ''}
${feedbackAnalysis.recent_skips > 2 ? '- Simplify session structure\n- Reduce session frequency\n- Add variety to prevent monotony' : ''}` : ''}

${latestEval ? `Latest Evaluation:
- Growth Mindset: ${latestEval.growth_mindset}/10
- Resilience: ${latestEval.resilience}/10
- Athleticism: ${latestEval.athleticism}/10
- Defending: ${latestEval.defending_organized}/10
- Attacking: ${latestEval.attacking_organized}/10

Strengths: ${latestEval.player_strengths || 'Not specified'}
Areas of Growth: ${latestEval.areas_of_growth || 'Not specified'}
Training Focus: ${latestEval.training_focus || 'Not specified'}` : ''}

Create an ADAPTIVE comprehensive 4-week training plan with:
1. Weekly training modules (3-4 per week)
2. Each module should include: title, detailed description with SPECIFIC EXERCISES, training type, weekly sessions, duration
3. Focus on addressing weaknesses while maintaining strengths
4. Include both physical and technical/tactical training
5. Progressive difficulty week-by-week, BUT ADJUST based on feedback analysis above
6. CRITICAL: In the description, reference specific exercises from the knowledge bank (Speed, Power, Endurance, Agility, Strength, Flexibility) and explicitly mention them. For example: "Week 1-2: Focus on plyometric exercises (see Power training) including box jumps and depth jumps"
7. ADAPTIVE LEARNING: If feedback shows overtraining (high RPE, skips), reduce intensity. If undertraining (low RPE, too easy), increase challenge.
8. Include recommended_intensity field (percentage 60-100%) based on feedback analysis

Return ONLY valid JSON matching this exact structure:
{
  "weekly_focus": "Brief description of the 4-week plan focus",
  "modules": [
    {
      "title": "Module name",
      "description": "Detailed description with specific exercises and progression",
      "training_type": "Mobility Training|Technical Training|Functional Training|Video Analysis/Tactical Training",
      "priority": "High|Medium|Low",
      "weekly_sessions": 2,
      "number_of_weeks": 4,
      "session_duration": 60,
      "knowledge_bank_links": ["Speed", "Agility"]
    }
  ]
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            weekly_focus: { type: 'string' },
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
                  session_duration: { type: 'number' },
                  recommended_intensity: { type: 'number' },
                  knowledge_bank_links: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        }
      });

      return response;
    },
    onSuccess: (data) => {
      setSuggestions(data);
      setWeeklyFocus(data.weekly_focus || '');
      setSelectedModules(data.modules?.map((_, idx) => idx) || []);
      setLoading(false);
    },
    onError: (error) => {
      console.error('AI generation error:', error);
      setLoading(false);
    }
  });

  const handleGenerate = () => {
    setLoading(true);
    setSuggestions(null);
    generatePlanMutation.mutate();
  };

  const handleApprove = () => {
    const modulesToAdd = suggestions.modules
      .filter((_, idx) => selectedModules.includes(idx))
      .map(m => ({
        id: `module_${Date.now()}_${Math.random()}`,
        ...m,
        start_date: new Date().toISOString().split('T')[0],
        completed: false,
        auto_suggested: true
      }));

    onAddModules(modulesToAdd);
    setShowDialog(false);
    setSuggestions(null);
  };

  return (
    <>
      <Button 
        onClick={() => setShowDialog(true)} 
        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Adil's Training Recommendation
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Adil'd Recommended Training Plan - {player.full_name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {!suggestions && !loading && (
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="p-6 text-center">
                  <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                  <h3 className="font-semibold text-lg mb-2">Generate Adaptive Training Plan</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Adil will analyze {player.full_name}'s performance data, skill gaps, recent feedback, and progression trends to create an optimized 4-week training program that adapts to their response.
                  </p>
                  {feedbackData.length > 0 && (
                    <div className="mb-4 p-3 bg-white/60 rounded-lg text-left">
                      <div className="text-xs font-semibold text-purple-700 mb-1">📊 Using {feedbackData.length} feedback sessions</div>
                      <div className="text-xs text-slate-600">
                        Recent training load and player responses will inform intensity recommendations
                      </div>
                    </div>
                  )}
                  <Button onClick={handleGenerate} className="bg-purple-600 hover:bg-purple-700">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Adaptive Plan
                  </Button>
                </CardContent>
              </Card>
            )}

            {loading && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Loader2 className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-spin" />
                  <p className="text-slate-700 font-semibold">Analyzing player data...</p>
                  <p className="text-xs text-slate-500 mt-1">This may take 10-15 seconds</p>
                </CardContent>
              </Card>
            )}

            {suggestions && (
              <div className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <Target className="h-4 w-4 text-blue-600" />
                  <AlertDescription>
                    <div className="font-semibold text-blue-900 mb-1">4-Week Training Focus</div>
                    <div className="text-sm text-blue-800">{suggestions.weekly_focus}</div>
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <Label className="text-base font-semibold">Suggested Training Modules</Label>
                  {suggestions.modules?.map((module, idx) => (
                    <Card key={idx} className={`cursor-pointer transition-all ${selectedModules.includes(idx) ? 'border-2 border-purple-500 bg-purple-50' : 'hover:bg-slate-50'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedModules.includes(idx)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedModules([...selectedModules, idx]);
                              } else {
                                setSelectedModules(selectedModules.filter(i => i !== idx));
                              }
                            }}
                            className="mt-1 w-4 h-4"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900">{module.title}</h4>
                            <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">{module.description}</p>
                            {module.knowledge_bank_links?.length > 0 && (
                              <div className="flex items-center gap-1 mt-2 text-xs">
                                <span className="text-slate-500">📚 Knowledge Bank:</span>
                                {module.knowledge_bank_links.map((link, i) => (
                                  <span key={link}>
                                    <span className="text-purple-600 font-medium">{link}</span>
                                    {i < module.knowledge_bank_links.length - 1 && <span className="text-slate-400">, </span>}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge className={`text-[9px] ${module.priority === 'High' ? 'bg-red-100 text-red-800' : module.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                {module.priority}
                              </Badge>
                              <Badge className="text-[9px] bg-indigo-100 text-indigo-800">{module.training_type}</Badge>
                              {module.recommended_intensity && (
                                <Badge className={`text-[9px] ${module.recommended_intensity > 85 ? 'bg-red-100 text-red-800' : module.recommended_intensity > 70 ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                                  {module.recommended_intensity}% intensity
                                </Badge>
                              )}
                              <span className="text-xs text-slate-600">{module.weekly_sessions}x/week</span>
                              <span className="text-xs text-slate-600">• {module.number_of_weeks}w</span>
                              <span className="text-xs text-slate-600">• {module.session_duration}min</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => setSuggestions(null)} className="flex-1">
                    Generate New Plan
                  </Button>
                  <Button 
                    onClick={handleApprove} 
                    disabled={selectedModules.length === 0}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Add {selectedModules.length} Module(s) to Pathway
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}