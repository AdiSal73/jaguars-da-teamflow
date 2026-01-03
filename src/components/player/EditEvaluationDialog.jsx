import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, Loader2 } from 'lucide-react';

export default function EditEvaluationDialog({ open, onClose, evaluation, onSave, isPending }) {
  const [form, setForm] = useState({
    evaluator: '',
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
    player_strengths: '',
    areas_of_growth: '',
    training_focus: '',
    position_role_1_label: '',
    position_role_1: 5,
    position_role_2_label: '',
    position_role_2: 5,
    position_role_3_label: '',
    position_role_3: 5,
    position_role_4_label: '',
    position_role_4: 5
  });

  useEffect(() => {
    if (evaluation) {
      setForm({
        evaluator: evaluation.evaluator || '',
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
        player_strengths: evaluation.player_strengths || '',
        areas_of_growth: evaluation.areas_of_growth || '',
        training_focus: evaluation.training_focus || '',
        position_role_1_label: evaluation.position_role_1_label || '',
        position_role_1: evaluation.position_role_1 || 5,
        position_role_2_label: evaluation.position_role_2_label || '',
        position_role_2: evaluation.position_role_2 || 5,
        position_role_3_label: evaluation.position_role_3_label || '',
        position_role_3: evaluation.position_role_3 || 5,
        position_role_4_label: evaluation.position_role_4_label || '',
        position_role_4: evaluation.position_role_4 || 5
      });
    }
  }, [evaluation]);

  const handleSave = () => {
    onSave(evaluation.id, form);
  };

  const SliderField = ({ label, value, onChange }) => (
    <div>
      <div className="flex justify-between mb-2">
        <Label className="text-sm">{label}</Label>
        <span className="text-sm font-bold text-emerald-600">{value}/10</span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={onChange}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Evaluation</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-4 mt-4">
            <div>
              <Label>Evaluator</Label>
              <Input
                value={form.evaluator}
                onChange={e => setForm({ ...form, evaluator: e.target.value })}
                placeholder="Coach name"
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Character & Attributes</h3>
              <div className="space-y-3">
                <SliderField label="Growth Mindset" value={form.growth_mindset} onChange={e => setForm({ ...form, growth_mindset: parseInt(e.target.value) })} />
                <SliderField label="Resilience" value={form.resilience} onChange={e => setForm({ ...form, resilience: parseInt(e.target.value) })} />
                <SliderField label="Efficiency in Execution" value={form.efficiency_in_execution} onChange={e => setForm({ ...form, efficiency_in_execution: parseInt(e.target.value) })} />
                <SliderField label="Athleticism" value={form.athleticism} onChange={e => setForm({ ...form, athleticism: parseInt(e.target.value) })} />
                <SliderField label="Team Focus" value={form.team_focus} onChange={e => setForm({ ...form, team_focus: parseInt(e.target.value) })} />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Defending</h3>
              <div className="space-y-3">
                <SliderField label="Defending Organized" value={form.defending_organized} onChange={e => setForm({ ...form, defending_organized: parseInt(e.target.value) })} />
                <SliderField label="Defending Final Third" value={form.defending_final_third} onChange={e => setForm({ ...form, defending_final_third: parseInt(e.target.value) })} />
                <SliderField label="Defending Transition" value={form.defending_transition} onChange={e => setForm({ ...form, defending_transition: parseInt(e.target.value) })} />
                <SliderField label="Pressing" value={form.pressing} onChange={e => setForm({ ...form, pressing: parseInt(e.target.value) })} />
                <SliderField label="Defending Set Pieces" value={form.defending_set_pieces} onChange={e => setForm({ ...form, defending_set_pieces: parseInt(e.target.value) })} />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Attacking</h3>
              <div className="space-y-3">
                <SliderField label="Attacking Organized" value={form.attacking_organized} onChange={e => setForm({ ...form, attacking_organized: parseInt(e.target.value) })} />
                <SliderField label="Attacking Final Third" value={form.attacking_final_third} onChange={e => setForm({ ...form, attacking_final_third: parseInt(e.target.value) })} />
                <SliderField label="Attacking in Transition" value={form.attacking_in_transition} onChange={e => setForm({ ...form, attacking_in_transition: parseInt(e.target.value) })} />
                <SliderField label="Building Out" value={form.building_out} onChange={e => setForm({ ...form, building_out: parseInt(e.target.value) })} />
                <SliderField label="Attacking Set Pieces" value={form.attacking_set_pieces} onChange={e => setForm({ ...form, attacking_set_pieces: parseInt(e.target.value) })} />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Position-Specific Roles</h3>
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="space-y-2">
                    <Input
                      placeholder={`Role ${i} Label`}
                      value={form[`position_role_${i}_label`]}
                      onChange={e => setForm({ ...form, [`position_role_${i}_label`]: e.target.value })}
                    />
                    {form[`position_role_${i}_label`] && (
                      <SliderField
                        label={form[`position_role_${i}_label`]}
                        value={form[`position_role_${i}`]}
                        onChange={e => setForm({ ...form, [`position_role_${i}`]: parseInt(e.target.value) })}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Feedback</h3>
              <div className="space-y-3">
                <div>
                  <Label>Player Strengths</Label>
                  <Textarea
                    value={form.player_strengths}
                    onChange={e => setForm({ ...form, player_strengths: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Areas of Growth</Label>
                  <Textarea
                    value={form.areas_of_growth}
                    onChange={e => setForm({ ...form, areas_of_growth: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Training Focus</Label>
                  <Textarea
                    value={form.training_focus}
                    onChange={e => setForm({ ...form, training_focus: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} disabled={isPending} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}