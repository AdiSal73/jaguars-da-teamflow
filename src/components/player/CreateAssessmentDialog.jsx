import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';

export default function CreateAssessmentDialog({ open, onClose, playerId, playerName, teamId, onSave }) {
  const [form, setForm] = useState({
    assessment_date: new Date().toISOString().split('T')[0],
    sprint: '',
    vertical: '',
    yirt: '',
    shuttle: ''
  });

  const calculateScores = (sprint, vertical, yirt, shuttle) => {
    // Speed score: Lower sprint time is better (inverse relationship)
    const speed_score = Math.round(Math.max(0, Math.min(100, 100 - (sprint - 2.5) * 20)));
    
    // Power score: Higher vertical jump is better
    const power_score = Math.round(Math.max(0, Math.min(100, (vertical / 30) * 100)));
    
    // Endurance score: Higher YIRT level is better
    const endurance_score = Math.round(Math.max(0, Math.min(100, (yirt / 20) * 100)));
    
    // Agility score: Lower shuttle time is better (inverse relationship)
    const agility_score = Math.round(Math.max(0, Math.min(100, 100 - (shuttle - 4) * 15)));
    
    // Overall score: Average of all scores
    const overall_score = Math.round((speed_score + power_score + endurance_score + agility_score) / 4);
    
    return { speed_score, power_score, endurance_score, agility_score, overall_score };
  };

  const handleSave = () => {
    const sprint = parseFloat(form.sprint);
    const vertical = parseFloat(form.vertical);
    const yirt = parseFloat(form.yirt);
    const shuttle = parseFloat(form.shuttle);
    
    const scores = calculateScores(sprint, vertical, yirt, shuttle);
    
    const data = {
      player_id: playerId,
      player_name: playerName,
      team_id: teamId,
      assessment_date: form.assessment_date,
      sprint,
      vertical,
      yirt,
      shuttle,
      ...scores
    };
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Physical Assessment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>Assessment Date</Label>
            <Input type="date" value={form.assessment_date} onChange={e => setForm({...form, assessment_date: e.target.value})} />
          </div>
          <div>
            <Label>20m Sprint (seconds)</Label>
            <Input type="number" step="0.01" value={form.sprint} onChange={e => setForm({...form, sprint: e.target.value})} />
          </div>
          <div>
            <Label>Vertical Jump (inches)</Label>
            <Input type="number" step="0.1" value={form.vertical} onChange={e => setForm({...form, vertical: e.target.value})} />
          </div>
          <div>
            <Label>YIRT Level</Label>
            <Input type="number" step="0.1" value={form.yirt} onChange={e => setForm({...form, yirt: e.target.value})} />
          </div>
          <div>
            <Label>Shuttle Run (seconds)</Label>
            <Input type="number" step="0.01" value={form.shuttle} onChange={e => setForm({...form, shuttle: e.target.value})} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} className="bg-emerald-600">
            <Save className="w-4 h-4 mr-2" />Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}