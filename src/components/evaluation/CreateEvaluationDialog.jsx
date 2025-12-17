import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { getPositionFields } from '../constants/positionEvaluationFields';

export default function CreateEvaluationDialog({ open, onClose, player }) {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
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

  const createMutation = useMutation({
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

  const handleSubmit = () => {
    createMutation.mutate(form);
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Evaluation - {player?.full_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Primary Position</Label>
              <Select value={form.primary_position} onValueChange={v => setForm({...form, primary_position: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['GK', 'Right Outside Back', 'Left Outside Back', 'Right Centerback', 'Left Centerback', 'Defensive Midfielder', 'Right Winger', 'Center Midfielder', 'Forward', 'Attacking Midfielder', 'Left Winger'].map(pos => (
                    <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Preferred Foot</Label>
              <Select value={form.preferred_foot} onValueChange={v => setForm({...form, preferred_foot: v})}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Left">Left</SelectItem>
                  <SelectItem value="Right">Right</SelectItem>
                  <SelectItem value="Both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-emerald-700">Mental & Character</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <SliderField label="Growth Mindset" value={form.growth_mindset} onChange={v => setForm({...form, growth_mindset: v})} />
              <SliderField label="Resilience" value={form.resilience} onChange={v => setForm({...form, resilience: v})} />
              <SliderField label="Efficiency in Execution" value={form.efficiency_in_execution} onChange={v => setForm({...form, efficiency_in_execution: v})} />
              <SliderField label="Athleticism" value={form.athleticism} onChange={v => setForm({...form, athleticism: v})} />
              <SliderField label="Team Focus" value={form.team_focus} onChange={v => setForm({...form, team_focus: v})} />
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-red-700">Defending</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <SliderField label="Defending Organized" value={form.defending_organized} onChange={v => setForm({...form, defending_organized: v})} />
              <SliderField label="Defending Final Third" value={form.defending_final_third} onChange={v => setForm({...form, defending_final_third: v})} />
              <SliderField label="Defending Transition" value={form.defending_transition} onChange={v => setForm({...form, defending_transition: v})} />
              <SliderField label="Pressing" value={form.pressing} onChange={v => setForm({...form, pressing: v})} />
              <SliderField label="Defending Set Pieces" value={form.defending_set_pieces} onChange={v => setForm({...form, defending_set_pieces: v})} />
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-blue-700">Attacking</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <SliderField label="Attacking Organized" value={form.attacking_organized} onChange={v => setForm({...form, attacking_organized: v})} />
              <SliderField label="Attacking Final Third" value={form.attacking_final_third} onChange={v => setForm({...form, attacking_final_third: v})} />
              <SliderField label="Attacking in Transition" value={form.attacking_in_transition} onChange={v => setForm({...form, attacking_in_transition: v})} />
              <SliderField label="Building Out" value={form.building_out} onChange={v => setForm({...form, building_out: v})} />
              <SliderField label="Attacking Set Pieces" value={form.attacking_set_pieces} onChange={v => setForm({...form, attacking_set_pieces: v})} />
            </div>
          </div>

          {positionFields.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 text-purple-700">Position-Specific</h3>
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
            <div>
              <Label>Player Strengths</Label>
              <Textarea rows={3} value={form.player_strengths} onChange={e => setForm({...form, player_strengths: e.target.value})} />
            </div>
            <div>
              <Label>Areas of Growth</Label>
              <Textarea rows={3} value={form.areas_of_growth} onChange={e => setForm({...form, areas_of_growth: e.target.value})} />
            </div>
            <div>
              <Label>Training Focus</Label>
              <Textarea rows={3} value={form.training_focus} onChange={e => setForm({...form, training_focus: e.target.value})} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700">
              <Save className="w-4 h-4 mr-2" />
              Create Evaluation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}