import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getPositionFields } from '../constants/positionEvaluationFields';

export default function EditEvaluationDialog({ open, onClose, evaluation, player }) {
  const queryClient = useQueryClient();

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments', player?.id],
    queryFn: () => base44.entities.PhysicalAssessment.filter({ player_id: player.id }),
    enabled: !!player?.id
  });

  const { data: pathway } = useQuery({
    queryKey: ['pathway', player?.id],
    queryFn: async () => {
      const pathways = await base44.entities.DevelopmentPathway.filter({ player_id: player.id });
      return pathways[0] || null;
    },
    enabled: !!player?.id
  });

  const [form, setForm] = useState({
    growth_mindset: evaluation?.growth_mindset || 5,
    resilience: evaluation?.resilience || 5,
    efficiency_in_execution: evaluation?.efficiency_in_execution || 5,
    athleticism: evaluation?.athleticism || 5,
    team_focus: evaluation?.team_focus || 5,
    defending_organized: evaluation?.defending_organized || 5,
    defending_final_third: evaluation?.defending_final_third || 5,
    defending_transition: evaluation?.defending_transition || 5,
    pressing: evaluation?.pressing || 5,
    defending_set_pieces: evaluation?.defending_set_pieces || 5,
    attacking_organized: evaluation?.attacking_organized || 5,
    attacking_final_third: evaluation?.attacking_final_third || 5,
    attacking_in_transition: evaluation?.attacking_in_transition || 5,
    building_out: evaluation?.building_out || 5,
    attacking_set_pieces: evaluation?.attacking_set_pieces || 5,
    primary_position: evaluation?.primary_position || '',
    preferred_foot: evaluation?.preferred_foot || '',
    player_strengths: evaluation?.player_strengths || '',
    areas_of_growth: evaluation?.areas_of_growth || '',
    training_focus: evaluation?.training_focus || '',
    position_role_1: evaluation?.position_role_1 || 5,
    position_role_2: evaluation?.position_role_2 || 5,
    position_role_3: evaluation?.position_role_3 || 5,
    position_role_4: evaluation?.position_role_4 || 5,
  });

  const [generatingAI, setGeneratingAI] = useState({ strengths: false, growth: false, focus: false });

  React.useEffect(() => {
    if (evaluation && open) {
      setForm({
        growth_mindset: evaluation.growth_mindset || 5,
        resilience: evaluation.resilience || 5,
        efficiency_in_execution: evaluation.efficiency_in_execution || 5,
        athleticism: evaluation.athleticism || 5,
        team_focus: evaluation.team_focus || 5,
        defending_organized: evaluation.defending_organized || 5,
        defending_final_third: evaluation.defending_final_third || 5,
        defending_transition: evaluation.defending_transition || 5,
        pressing: evaluation.pressing || 5,
        defending_set_pieces: evaluation.defending_set_pieces || 5,
        attacking_organized: evaluation.attacking_organized || 5,
        attacking_final_third: evaluation.attacking_final_third || 5,
        attacking_in_transition: evaluation.attacking_in_transition || 5,
        building_out: evaluation.building_out || 5,
        attacking_set_pieces: evaluation.attacking_set_pieces || 5,
        primary_position: evaluation.primary_position || '',
        preferred_foot: evaluation.preferred_foot || '',
        player_strengths: evaluation.player_strengths || '',
        areas_of_growth: evaluation.areas_of_growth || '',
        training_focus: evaluation.training_focus || '',
        position_role_1: evaluation.position_role_1 || 5,
        position_role_2: evaluation.position_role_2 || 5,
        position_role_3: evaluation.position_role_3 || 5,
        position_role_4: evaluation.position_role_4 || 5,
      });
    }
  }, [evaluation, open]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const scores = [
        data.growth_mindset, data.resilience, data.efficiency_in_execution,
        data.athleticism, data.team_focus, data.defending_organized,
        data.defending_final_third, data.defending_transition,
        data.attacking_organized, data.attacking_final_third, data.attacking_in_transition,
        data.position_role_1, data.position_role_2, data.position_role_3, data.position_role_4
      ].filter(s => s > 0);
      
      const overall_score = scores.length > 0 
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
        : 0;

      return base44.entities.Evaluation.update(evaluation.id, {
        overall_score,
        ...data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['evaluations']);
      toast.success('Evaluation updated');
      onClose();
    }
  });

  const generateAIContent = async (field) => {
    setGeneratingAI(prev => ({ ...prev, [field]: true }));
    
    try {
      const latestAssessment = assessments.length > 0 ? assessments[assessments.length - 1] : null;
      
      const prompt = `You are evaluating a soccer player named ${player.full_name}, position: ${form.primary_position}.

Evaluation Scores (1-10 scale):
- Growth Mindset: ${form.growth_mindset}
- Resilience: ${form.resilience}
- Athleticism: ${form.athleticism}
- Team Focus: ${form.team_focus}
- Defending Organized: ${form.defending_organized}
- Attacking Organized: ${form.attacking_organized}
- Attacking Final Third: ${form.attacking_final_third}

${latestAssessment ? `Latest Physical Assessment:
- Speed Score: ${latestAssessment.speed_score}
- Power Score: ${latestAssessment.power_score}
- Endurance Score: ${latestAssessment.endurance_score}
- Agility Score: ${latestAssessment.agility_score}` : ''}

${pathway?.skill_matrix ? `Current Skill Matrix:
${pathway.skill_matrix.map(s => `- ${s.skill_name}: ${s.current_rating}/10`).join('\n')}` : ''}

${field === 'strengths' ? 'Write 2-3 sentences highlighting the player\'s key strengths based on the scores above.' : ''}
${field === 'growth' ? 'Write 2-3 sentences identifying the main areas where this player should focus on improvement.' : ''}
${field === 'focus' ? 'Write 2-3 sentences recommending specific training focus areas and drills that would benefit this player most.' : ''}

Keep it concise, specific, and actionable.`;

      const response = await base44.integrations.Core.InvokeLLM({ prompt });
      
      if (field === 'strengths') setForm({...form, player_strengths: response});
      if (field === 'growth') setForm({...form, areas_of_growth: response});
      if (field === 'focus') setForm({...form, training_focus: response});
      
      toast.success('AI content generated');
    } catch (error) {
      toast.error('Failed to generate content');
    } finally {
      setGeneratingAI(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleSubmit = () => {
    updateMutation.mutate(form);
  };

  const SliderField = ({ label, value, onChange }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium">{label}</Label>
        <span className="text-sm font-bold text-emerald-600">{value}</span>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={1} max={10} step={1} className="w-full" />
    </div>
  );

  const positionFields = getPositionFields(form.primary_position);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden bg-gradient-to-br from-white to-emerald-50">
        <DialogHeader className="bg-gradient-to-r from-emerald-600 to-green-600 -mx-6 -mt-6 px-6 py-4 text-white">
          <DialogTitle className="text-2xl flex items-center gap-2">
            ✏️ Edit Evaluation - {player?.full_name}
          </DialogTitle>
          <p className="text-sm text-white/80 mt-1">Ratings are 1-10. 10 is what a national team starter would get.</p>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[calc(95vh-180px)] px-6 py-4">
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4 bg-white p-4 rounded-xl shadow-sm">
              <div>
                <Label className="text-xs font-semibold text-slate-600">Primary Position</Label>
                <Select value={form.primary_position} onValueChange={v => setForm({...form, primary_position: v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['GK', 'Right Outside Back', 'Left Outside Back', 'Right Centerback', 'Left Centerback', 'Defensive Midfielder', 'Right Winger', 'Center Midfielder', 'Forward', 'Attacking Midfielder', 'Left Winger'].map(pos => (
                      <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-600">Preferred Foot</Label>
                <Select value={form.preferred_foot} onValueChange={v => setForm({...form, preferred_foot: v})}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Left">Left</SelectItem>
                    <SelectItem value="Right">Right</SelectItem>
                    <SelectItem value="Both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl shadow-sm">
              <h3 className="font-bold mb-4 text-purple-900 flex items-center gap-2 text-lg">
                🧠 Mental & Character
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <SliderField label="Growth Mindset" value={form.growth_mindset} onChange={v => setForm({...form, growth_mindset: v})} />
                <SliderField label="Resilience" value={form.resilience} onChange={v => setForm({...form, resilience: v})} />
                <SliderField label="Efficiency in Execution" value={form.efficiency_in_execution} onChange={v => setForm({...form, efficiency_in_execution: v})} />
                <SliderField label="Athleticism" value={form.athleticism} onChange={v => setForm({...form, athleticism: v})} />
                <SliderField label="Team Focus" value={form.team_focus} onChange={v => setForm({...form, team_focus: v})} />
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-xl shadow-sm">
              <h3 className="font-bold mb-4 text-red-900 flex items-center gap-2 text-lg">
                🛡️ Defending
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <SliderField label="Defending Organized" value={form.defending_organized} onChange={v => setForm({...form, defending_organized: v})} />
                <SliderField label="Defending Final Third" value={form.defending_final_third} onChange={v => setForm({...form, defending_final_third: v})} />
                <SliderField label="Defending Transition" value={form.defending_transition} onChange={v => setForm({...form, defending_transition: v})} />
                <SliderField label="Pressing" value={form.pressing} onChange={v => setForm({...form, pressing: v})} />
                <SliderField label="Defending Set Pieces" value={form.defending_set_pieces} onChange={v => setForm({...form, defending_set_pieces: v})} />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl shadow-sm">
              <h3 className="font-bold mb-4 text-blue-900 flex items-center gap-2 text-lg">
                ⚽ Attacking
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <SliderField label="Attacking Organized" value={form.attacking_organized} onChange={v => setForm({...form, attacking_organized: v})} />
                <SliderField label="Attacking Final Third" value={form.attacking_final_third} onChange={v => setForm({...form, attacking_final_third: v})} />
                <SliderField label="Attacking in Transition" value={form.attacking_in_transition} onChange={v => setForm({...form, attacking_in_transition: v})} />
                <SliderField label="Building Out" value={form.building_out} onChange={v => setForm({...form, building_out: v})} />
                <SliderField label="Attacking Set Pieces" value={form.attacking_set_pieces} onChange={v => setForm({...form, attacking_set_pieces: v})} />
              </div>
            </div>

            {positionFields.length > 0 && (
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl shadow-sm">
                <h3 className="font-bold mb-4 text-indigo-900 flex items-center gap-2 text-lg">
                  🎯 Position-Specific ({form.primary_position})
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {positionFields.slice(0, 4).map((field, idx) => (
                    <SliderField 
                      key={idx}
                      label={field.label} 
                      value={form[`position_role_${idx + 1}`]} 
                      onChange={v => setForm({...form, [`position_role_${idx + 1}`]: v})} 
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border-2 border-emerald-100">
                <div className="flex items-center justify-between mb-2">
                  <Label className="font-semibold text-emerald-900">Player Strengths</Label>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => generateAIContent('strengths')}
                    disabled={generatingAI.strengths}
                    className="h-7 text-xs bg-gradient-to-r from-emerald-500 to-green-500 text-white border-none hover:from-emerald-600 hover:to-green-600"
                  >
                    {generatingAI.strengths ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                    Adil's Suggestions
                  </Button>
                </div>
                <Textarea 
                  rows={4} 
                  value={form.player_strengths} 
                  onChange={e => setForm({...form, player_strengths: e.target.value})}
                  className="text-sm"
                  placeholder="Key strengths and what the player excels at..."
                />
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border-2 border-orange-100">
                <div className="flex items-center justify-between mb-2">
                  <Label className="font-semibold text-orange-900">Areas of Growth</Label>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => generateAIContent('growth')}
                    disabled={generatingAI.growth}
                    className="h-7 text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white border-none hover:from-orange-600 hover:to-red-600"
                  >
                    {generatingAI.growth ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                    Adil's Suggestions
                  </Button>
                </div>
                <Textarea 
                  rows={4} 
                  value={form.areas_of_growth} 
                  onChange={e => setForm({...form, areas_of_growth: e.target.value})}
                  className="text-sm"
                  placeholder="Areas that need improvement..."
                />
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border-2 border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <Label className="font-semibold text-blue-900">Training Focus</Label>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => generateAIContent('focus')}
                    disabled={generatingAI.focus}
                    className="h-7 text-xs bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-none hover:from-blue-600 hover:to-cyan-600"
                  >
                    {generatingAI.focus ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                    Adil's Suggestions
                  </Button>
                </div>
                <Textarea 
                  rows={4} 
                  value={form.training_focus} 
                  onChange={e => setForm({...form, training_focus: e.target.value})}
                  className="text-sm"
                  placeholder="Recommended training priorities..."
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 px-6 pb-4 border-t bg-slate-50 -mx-6 -mb-6">
          <Button variant="outline" onClick={onClose} className="px-6">Cancel</Button>
          <Button onClick={handleSubmit} className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 px-6 shadow-lg">
            <Save className="w-4 h-4 mr-2" />
            Update Evaluation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}