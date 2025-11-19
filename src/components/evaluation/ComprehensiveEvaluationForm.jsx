import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

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

const RatingSlider = ({ label, value, onChange }) => (
  <div className="space-y-3">
    <div className="flex justify-between items-center">
      <Label className="text-sm font-semibold text-slate-700">{label}</Label>
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold text-emerald-600">{value}</span>
        <span className="text-sm font-medium text-slate-600 min-w-[140px]">{ratingLabels[value]}</span>
      </div>
    </div>
    <input
      type="range"
      min="1"
      max="10"
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full h-3 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded-lg appearance-none cursor-pointer slider"
      style={{
        background: `linear-gradient(to right, #fca5a5 0%, #fde047 50%, #86efac 100%)`
      }}
    />
    <div className="flex justify-between text-xs text-slate-500">
      <span>1 - Basic</span>
      <span>5 - Intermediate</span>
      <span>10 - Expert</span>
    </div>
  </div>
);

export default function ComprehensiveEvaluationForm({ player, teams, onSave, onCancel }) {
  const team = teams.find(t => t.id === player?.team_id);
  const birthYear = player?.date_of_birth ? new Date(player.date_of_birth).getFullYear().toString() : '';

  const [formData, setFormData] = useState({
    player_id: player?.id || '',
    player_name: player?.full_name || '',
    birth_year: birthYear,
    team_name: team?.name || '',
    my_goals: '',
    evaluator: '',
    current_team_status: '',
    growth_mindset: 5,
    resilience: 5,
    efficiency_in_execution: 5,
    athleticism: 5,
    team_focus: 5,
    primary_position: player?.position || '',
    preferred_foot: player?.preferred_foot || 'Right',
    defending_organized: 5,
    defending_final_third: 5,
    defending_transition: 5,
    attacking_organized: 5,
    attacking_final_third: 5,
    attacking_in_transition: 5,
    player_strengths: '',
    areas_of_growth: '',
    training_focus: ''
  });

  return (
    <div className="space-y-8 mt-6">
      <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
        <CardHeader className="border-b bg-gradient-to-r from-emerald-100 to-blue-100">
          <CardTitle className="text-lg">Player Information</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="font-semibold">Player Name</Label>
              <Input value={formData.player_name} readOnly className="bg-slate-50 border-2 h-12" />
            </div>
            <div>
              <Label className="font-semibold">Birth Year</Label>
              <Input value={formData.birth_year} readOnly className="bg-slate-50 border-2 h-12" />
            </div>
            <div>
              <Label className="font-semibold">Team Name</Label>
              <Input value={formData.team_name} readOnly className="bg-slate-50 border-2 h-12" />
            </div>
            <div>
              <Label className="font-semibold">Evaluator</Label>
              <Input
                value={formData.evaluator}
                onChange={(e) => setFormData({...formData, evaluator: e.target.value})}
                placeholder="Your name"
                className="border-2 h-12"
              />
            </div>
            <div>
              <Label className="font-semibold">Primary Position</Label>
              <Input
                value={formData.primary_position}
                onChange={(e) => setFormData({...formData, primary_position: e.target.value})}
                className="border-2 h-12"
              />
            </div>
            <div>
              <Label className="font-semibold">Preferred Foot</Label>
              <Select value={formData.preferred_foot} onValueChange={(val) => setFormData({...formData, preferred_foot: val})}>
                <SelectTrigger className="border-2 h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Left">Left</SelectItem>
                  <SelectItem value="Right">Right</SelectItem>
                  <SelectItem value="Both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label className="font-semibold">Current Team Status</Label>
              <Input
                value={formData.current_team_status}
                onChange={(e) => setFormData({...formData, current_team_status: e.target.value})}
                placeholder="e.g., Starter, Rotation, Development"
                className="border-2 h-12"
              />
            </div>
            <div className="md:col-span-2">
              <Label className="font-semibold">Player's Goals</Label>
              <Textarea
                value={formData.my_goals}
                onChange={(e) => setFormData({...formData, my_goals: e.target.value})}
                placeholder="What are the player's personal goals?"
                rows={2}
                className="border-2 resize-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-blue-200">
        <CardHeader className="border-b bg-gradient-to-r from-blue-100 to-purple-100">
          <CardTitle className="text-lg">Mental & Physical Attributes</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <RatingSlider label="Growth Mindset" value={formData.growth_mindset} onChange={(val) => setFormData({...formData, growth_mindset: val})} />
          <RatingSlider label="Resilience" value={formData.resilience} onChange={(val) => setFormData({...formData, resilience: val})} />
          <RatingSlider label="Efficiency in Execution" value={formData.efficiency_in_execution} onChange={(val) => setFormData({...formData, efficiency_in_execution: val})} />
          <RatingSlider label="Athleticism" value={formData.athleticism} onChange={(val) => setFormData({...formData, athleticism: val})} />
          <RatingSlider label="Team Focus" value={formData.team_focus} onChange={(val) => setFormData({...formData, team_focus: val})} />
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-2 border-blue-200">
          <CardHeader className="border-b bg-gradient-to-r from-blue-100 to-cyan-100">
            <CardTitle className="text-lg">Defending Skills</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <RatingSlider label="Defending Organized" value={formData.defending_organized} onChange={(val) => setFormData({...formData, defending_organized: val})} />
            <RatingSlider label="Defending Final Third" value={formData.defending_final_third} onChange={(val) => setFormData({...formData, defending_final_third: val})} />
            <RatingSlider label="Defending Transition" value={formData.defending_transition} onChange={(val) => setFormData({...formData, defending_transition: val})} />
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200">
          <CardHeader className="border-b bg-gradient-to-r from-orange-100 to-red-100">
            <CardTitle className="text-lg">Attacking Skills</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <RatingSlider label="Attacking Organized" value={formData.attacking_organized} onChange={(val) => setFormData({...formData, attacking_organized: val})} />
            <RatingSlider label="Attacking Final Third" value={formData.attacking_final_third} onChange={(val) => setFormData({...formData, attacking_final_third: val})} />
            <RatingSlider label="Attacking in Transition" value={formData.attacking_in_transition} onChange={(val) => setFormData({...formData, attacking_in_transition: val})} />
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 border-purple-200">
        <CardHeader className="border-b bg-gradient-to-r from-purple-100 to-pink-100">
          <CardTitle className="text-lg">Development Notes</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <Label className="font-semibold">Player's Strengths</Label>
            <Textarea
              value={formData.player_strengths}
              onChange={(e) => setFormData({...formData, player_strengths: e.target.value})}
              placeholder="What does this player excel at?"
              rows={3}
              className="border-2 resize-none"
            />
          </div>
          <div>
            <Label className="font-semibold">Areas of Growth</Label>
            <Textarea
              value={formData.areas_of_growth}
              onChange={(e) => setFormData({...formData, areas_of_growth: e.target.value})}
              placeholder="What areas need improvement?"
              rows={3}
              className="border-2 resize-none"
            />
          </div>
          <div>
            <Label className="font-semibold">Training Focus</Label>
            <Textarea
              value={formData.training_focus}
              onChange={(e) => setFormData({...formData, training_focus: e.target.value})}
              placeholder="What should training focus on?"
              rows={3}
              className="border-2 resize-none"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button variant="outline" onClick={onCancel} className="h-12 px-8">
          Cancel
        </Button>
        <Button 
          onClick={() => onSave(formData)}
          disabled={!formData.player_id}
          className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 h-12 px-8 text-base font-semibold shadow-lg"
        >
          Create Evaluation
        </Button>
      </div>
    </div>
  );
}