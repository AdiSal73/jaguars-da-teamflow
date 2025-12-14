import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, TrendingUp } from 'lucide-react';



export default function SkillMatrixEditor({ position, skillMatrix, onUpdate, allowPlayerInput = false }) {
  const [newSkill, setNewSkill] = useState('');
  
  const currentSkills = skillMatrix || [];

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    const updated = [...currentSkills, {
      skill_name: newSkill,
      current_rating: 5,
      target_rating: 8,
      coach_notes: '',
      player_self_rating: 0,
      player_notes: ''
    }];
    onUpdate(updated);
    setNewSkill('');
  };

  const handleUpdateSkill = (index, field, value) => {
    const updated = currentSkills.map((skill, i) => 
      i === index ? { ...skill, [field]: value } : skill
    );
    onUpdate(updated);
  };

  const handleDeleteSkill = (index) => {
    const updated = currentSkills.filter((_, i) => i !== index);
    onUpdate(updated);
  };

  return (
    <div className="space-y-4">
      {currentSkills.map((skill, idx) => (
        <Card key={idx} className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-semibold text-slate-900">{skill.skill_name}</h4>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteSkill(idx)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <Label className="text-xs">Coach Rating</Label>
                <Input 
                  type="number" 
                  min="1" 
                  max="10" 
                  value={skill.current_rating} 
                  onChange={e => handleUpdateSkill(idx, 'current_rating', parseInt(e.target.value))}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Target</Label>
                <Input 
                  type="number" 
                  min="1" 
                  max="10" 
                  value={skill.target_rating} 
                  onChange={e => handleUpdateSkill(idx, 'target_rating', parseInt(e.target.value))}
                  className="h-8 text-sm"
                />
              </div>
              {allowPlayerInput && (
                <div>
                  <Label className="text-xs">Self Rating</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    max="10" 
                    value={skill.player_self_rating || 0} 
                    onChange={e => handleUpdateSkill(idx, 'player_self_rating', parseInt(e.target.value))}
                    className="h-8 text-sm"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div>
                <Label className="text-xs">Coach Notes</Label>
                <Textarea 
                  value={skill.coach_notes || ''} 
                  onChange={e => handleUpdateSkill(idx, 'coach_notes', e.target.value)}
                  rows={2}
                  className="text-xs"
                  placeholder="Areas to focus on..."
                />
              </div>
              {allowPlayerInput && (
                <div>
                  <Label className="text-xs">Player Notes</Label>
                  <Textarea 
                    value={skill.player_notes || ''} 
                    onChange={e => handleUpdateSkill(idx, 'player_notes', e.target.value)}
                    rows={2}
                    className="text-xs"
                    placeholder="Your thoughts on this skill..."
                  />
                </div>
              )}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-400 via-yellow-400 to-green-500 transition-all"
                  style={{ width: `${(skill.current_rating / 10) * 100}%` }}
                />
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-400 to-green-500 transition-all"
                  style={{ width: `${(skill.target_rating / 10) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex gap-2">
        <Input 
          placeholder="Add custom skill..." 
          value={newSkill}
          onChange={e => setNewSkill(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleAddSkill()}
        />
        <Button onClick={handleAddSkill} disabled={!newSkill.trim()} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}