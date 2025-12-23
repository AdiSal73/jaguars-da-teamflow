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

const ratingLabels = {
  1: 'Basic',
  2: 'Novice',
  3: 'Beginner',
  4: 'Advanced Beginner',
  5: 'Intermediate',
  6: 'Competent',
  7: 'Advanced',
  8: 'Accomplished',
  9: 'Proficient',
  10: 'Expert'
};

const SliderField = ({ label, value, onChange }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 font-medium">{ratingLabels[value]}</span>
        <span className="text-sm font-bold text-emerald-600 w-6 text-right">{value}</span>
      </div>
    </div>
    <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={1} max={10} step={1} className="w-full" />
  </div>
);

export default function CreateEvaluationDialog({ open, onClose, player }) {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

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
    growth_mindset: 5,
    resilience: 5,
    efficiency_in_execution: 5,
    athleticism: 5,
    team_focus: 5,
    defending_organized: 5,
    defending_final_third: 5,
    defending_transition: 5,
    pressing: 5,
    defending_set_pieces: 5,
    attacking_organized: 5,
    attacking_final_third: 5,
    attacking_in_transition: 5,
    building_out: 5,
    attacking_set_pieces: 5,
    primary_position: player?.primary_position || '',
    preferred_foot: player?.preferred_foot || '',
    player_strengths: '',
    areas_of_growth: '',
    training_focus: '',
    my_goals: '',
    position_role_1: 5,
    position_role_2: 5,
    position_role_3: 5,
    position_role_4: 5,
    position_role_1_label: '',
    position_role_2_label: '',
    position_role_3_label: '',
    position_role_4_label: ''
  });

  const [generatingAI, setGeneratingAI] = useState({ strengths: false, growth: false, focus: false });

  React.useEffect(() => {
    if (player && open) {
      const positionFields = getPositionFields(player.primary_position);
      setForm(prev => ({
        ...prev,
        primary_position: player.primary_position || '',
        preferred_foot: player.preferred_foot || '',
        position_role_1_label: positionFields[0]?.label || '',
        position_role_2_label: positionFields[1]?.label || '',
        position_role_3_label: positionFields[2]?.label || '',
        position_role_4_label: positionFields[3]?.label || ''
      }));
    }
  }, [player, open]);

  const calculateGreatRating = (data) => {
    const mental = (
      2 * data.growth_mindset +
      2 * data.resilience +
      data.efficiency_in_execution +
      4 * data.athleticism +
      data.team_focus
    ) / 10;

    const defending = (
      2 * data.defending_organized +
      2 * data.defending_transition +
      3 * data.defending_final_third +
      data.defending_set_pieces
    ) / 8;

    const attacking = (
      2 * data.attacking_organized +
      2 * data.attacking_in_transition +
      3 * data.attacking_final_third +
      data.attacking_set_pieces
    ) / 8;

    const positionRoles = (
      data.position_role_1 +
      data.position_role_2 +
      data.position_role_3 +
      data.position_role_4
    ) / 4;

    return Math.round((2 * mental + 2 * defending + 2 * attacking + 4 * positionRoles) * 10) / 10;
  };

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const overall_score = calculateGreatRating(data);

      return base44.entities.Evaluation.create({
        player_id: player.id,
        player_name: player.full_name,
        birth_year: player.date_of_birth ? new Date(player.date_of_birth).getFullYear().toString() : '',
        evaluator: user?.full_name || user?.email,
        overall_score,
        ...data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['evaluations']);
      toast.success('Evaluation created');
      onClose();
    }
  });

  const generateAIContent = async (field) => {
    setGeneratingAI(prev => ({ ...prev, [field]: true }));
    
    try {
      const latestAssessment = assessments.length > 0 ? assessments[assessments.length - 1] : null;
      
      const knowledgeContext = `
      MICHIGAN JAGUARS PLAYER DEVELOPMENT PHILOSOPHY:
      - Win the challenge (tackle, header, game, league)
      - Be aggressive and always on the front foot
      - Possession that is meaningful
      - Play confident and creative soccer (take risks, failure is valuable)
      - Be positive in transition
      - Defend zonally but aggressively

      CORE VALUES: Respect, Unity, Development/Growth, Competitiveness, Enjoyment

      POSITION-SPECIFIC LANGUAGE (${form.primary_position}):
      ${form.primary_position === 'GK' ? '- Shot Stopping, Controlling the box, Distribution, Organization\n- Composed, Communication - Directing & Organizing\n- Recognizing Threats, Managing Space, Reading Pressure' : ''}
      ${form.primary_position?.includes('Centerback') ? '- Master 1v1 duels, Dominate aerial challenges, Build out of the back\n- Calm, Decisive, Relentless\n- Organization - Team Shape to Dictate Play\n- Ball winner - tackling, heading, intercepting' : ''}
      ${form.primary_position?.includes('Outside Back') ? '- Master 1v1 duels, Build out of the back, Join attack\n- Fast & Agile, Energetic and Dynamic\n- Delay-Deny-Dictate, Flank Defending\n- Overlapping runs, Quality crosses' : ''}
      ${form.primary_position === 'Defensive Midfielder' ? '- Master 1v1 duels, Organize the press and transition\n- Strong, quick, fit, Controlled, insightful, disciplined\n- Ball winner, Range of Passes, Spatial Awareness (360º)\n- Screening Middle, Breaking pressure, Progressive passing' : ''}
      ${form.primary_position === 'Attacking Midfielder' ? '- Create scoring chances, Advance the ball, Press and win back\n- Creative and Dangerous, Play Maker\n- Delay-Deny-Dictate, Through balls, Key passes' : ''}
      ${form.primary_position?.includes('Winger') ? '- Finish chances, Create chances, Wide overloads\n- Quick, explosive, agile, Creative and Energetic\n- Dominate in 1v1, Take on defenders, Quality crosses' : ''}
      ${form.primary_position === 'Forward' ? '- Finish chances, Create chances, Hold up and link play\n- Strong, explosive, quick, Dynamic and Dangerous\n- Clinical finishing, Back to goal, Target for long balls' : ''}
      `;

      const prompt = `You are a Michigan Jaguars coach evaluating ${player.full_name}, playing as ${form.primary_position}.

      ${knowledgeContext}

      Current Evaluation Scores (1-10 scale, where 10 = national team starter level):
      - Growth Mindset: ${form.growth_mindset}
      - Resilience: ${form.resilience}
      - Athleticism: ${form.athleticism}
      - Team Focus: ${form.team_focus}
      - Defending Organized: ${form.defending_organized}
      - Attacking Organized: ${form.attacking_organized}
      - Attacking Final Third: ${form.attacking_final_third}

      ${latestAssessment ? `Physical Assessment:
      - Speed: ${latestAssessment.speed_score}, Power: ${latestAssessment.power_score}
      - Endurance: ${latestAssessment.endurance_score}, Agility: ${latestAssessment.agility_score}` : ''}

      ${pathway?.skill_matrix ? `Skill Matrix:\n${pathway.skill_matrix.map(s => `- ${s.skill_name}: ${s.current_rating}/10`).join('\n')}` : ''}

      ${field === 'strengths' ? 'Write 2-3 sentences highlighting the player\'s key strengths. Use position-specific terminology from the knowledge bank above. Focus on what makes them dangerous and effective in their role.' : ''}
      ${field === 'growth' ? 'Write 2-3 sentences identifying areas of growth. Use technical language from the position profile. Be specific about skills and situations where improvement is needed (e.g., "1v1 defending in wide areas", "breaking defensive lines with progressive carries").' : ''}
      ${field === 'focus' ? 'Write 2-3 sentences recommending training focus. Reference specific responsibilities from the position profile (e.g., "defending in transition", "creating overloads in final third", "range of passing to switch play"). Be tactical and actionable.' : ''}

      Use Michigan Jaguars terminology. Be concise, specific, and actionable.`;

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
    createMutation.mutate(form);
  };

  const positionFields = getPositionFields(form.primary_position);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden bg-gradient-to-br from-white to-emerald-50">
        <DialogHeader className="bg-gradient-to-r from-emerald-600 to-green-600 -mx-6 -mt-6 px-6 py-4 text-white">
          <DialogTitle className="text-2xl flex items-center gap-2">
            📊 Create Evaluation - {player?.full_name}
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
            Create Evaluation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}