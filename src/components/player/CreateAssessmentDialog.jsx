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

  const handleSave = () => {
    const data = {
      player_id: playerId,
      player_name: playerName,
      team_id: teamId,
      assessment_date: form.assessment_date,
      sprint: parseFloat(form.sprint),
      vertical: parseFloat(form.vertical),
      yirt: parseFloat(form.yirt),
      shuttle: parseFloat(form.shuttle)
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