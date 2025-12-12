import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Save } from 'lucide-react';

const ratingLabels = {
  1: 'Basic', 2: 'Novice', 3: 'Beginner', 4: 'Advanced Beginner', 5: 'Intermediate',
  6: 'Competent', 7: 'Advanced', 8: 'Accomplished', 9: 'Proficient', 10: 'Expert'
};

const RatingSlider = ({ label, value, onChange, description }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <div className="flex-1">
        <Label className="text-sm font-semibold text-slate-700">{label}</Label>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold text-emerald-600">{value}</span>
        <span className="text-xs font-medium text-slate-600 min-w-[80px]">{ratingLabels[value]}</span>
      </div>
    </div>
    <input
      type="range"
      min="1"
      max="10"
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full h-2 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded-lg appearance-none cursor-pointer"
    />
  </div>
);

export default function TeamEvaluationForm({ teamId, teamName, existingEvaluation, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(existingEvaluation || {
    team_id: teamId,
    team_name: teamName,
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
    team_strengths: '',
    areas_of_growth: '',
    training_focus: ''
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TeamEvaluation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['teamEvaluations']);
      onClose?.();
    }
  });

  const handleSubmit = () => {
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-emerald-200">
        <CardHeader className="bg-gradient-to-r from-emerald-100 to-blue-100">
          <CardTitle className="text-lg">Team Information</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div>
            <Label>Team Name</Label>
            <Input value={formData.team_name} readOnly className="bg-slate-50" />
          </div>
          <div>
            <Label>Evaluator</Label>
            <Input
              value={formData.evaluator}
              onChange={(e) => setFormData({...formData, evaluator: e.target.value})}
              placeholder="Your name"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-100 to-purple-100">
          <CardTitle className="text-lg">Mental & Physical Attributes</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <RatingSlider label="Growth Mindset" value={formData.growth_mindset} onChange={(val) => setFormData({...formData, growth_mindset: val})} />
          <RatingSlider label="Resilience" value={formData.resilience} onChange={(val) => setFormData({...formData, resilience: val})} />
          <RatingSlider label="Efficiency in Execution" value={formData.efficiency_in_execution} onChange={(val) => setFormData({...formData, efficiency_in_execution: val})} />
          <RatingSlider label="Athleticism" value={formData.athleticism} onChange={(val) => setFormData({...formData, athleticism: val})} />
          <RatingSlider label="Team Focus" value={formData.team_focus} onChange={(val) => setFormData({...formData, team_focus: val})} />
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-2 border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-100 to-cyan-100">
            <CardTitle className="text-lg">Defending Skills</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <RatingSlider label="Defending Organized" value={formData.defending_organized} onChange={(val) => setFormData({...formData, defending_organized: val})} />
            <RatingSlider label="Defending Final Third" value={formData.defending_final_third} onChange={(val) => setFormData({...formData, defending_final_third: val})} />
            <RatingSlider label="Defending Transition" value={formData.defending_transition} onChange={(val) => setFormData({...formData, defending_transition: val})} />
            <RatingSlider label="Pressing" value={formData.pressing} onChange={(val) => setFormData({...formData, pressing: val})} />
            <RatingSlider label="Defending Set-Pieces" value={formData.defending_set_pieces} onChange={(val) => setFormData({...formData, defending_set_pieces: val})} />
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200">
          <CardHeader className="bg-gradient-to-r from-orange-100 to-red-100">
            <CardTitle className="text-lg">Attacking Skills</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <RatingSlider label="Attacking Organized" value={formData.attacking_organized} onChange={(val) => setFormData({...formData, attacking_organized: val})} />
            <RatingSlider label="Attacking Final Third" value={formData.attacking_final_third} onChange={(val) => setFormData({...formData, attacking_final_third: val})} />
            <RatingSlider label="Attacking in Transition" value={formData.attacking_in_transition} onChange={(val) => setFormData({...formData, attacking_in_transition: val})} />
            <RatingSlider label="Building Out" value={formData.building_out} onChange={(val) => setFormData({...formData, building_out: val})} />
            <RatingSlider label="Attacking Set-Pieces" value={formData.attacking_set_pieces} onChange={(val) => setFormData({...formData, attacking_set_pieces: val})} />
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 border-purple-200">
        <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100">
          <CardTitle className="text-lg">Development Notes</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div>
            <Label>Team's Strengths</Label>
            <Textarea
              value={formData.team_strengths}
              onChange={(e) => setFormData({...formData, team_strengths: e.target.value})}
              placeholder="What does this team excel at?"
              rows={3}
            />
          </div>
          <div>
            <Label>Areas of Growth</Label>
            <Textarea
              value={formData.areas_of_growth}
              onChange={(e) => setFormData({...formData, areas_of_growth: e.target.value})}
              placeholder="What areas need improvement?"
              rows={3}
            />
          </div>
          <div>
            <Label>Training Focus</Label>
            <Textarea
              value={formData.training_focus}
              onChange={(e) => setFormData({...formData, training_focus: e.target.value})}
              placeholder="What should training focus on?"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={!formData.evaluator} className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700">
          <Save className="w-4 h-4 mr-2" />
          Save Team Evaluation
        </Button>
      </div>
    </div>
  );
}