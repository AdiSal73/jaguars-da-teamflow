import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Save } from 'lucide-react';

export default function EditTryoutDialog({ open, onClose, tryout, playerId, playerName, onSave }) {
  const [form, setForm] = useState({
    team_role: tryout?.team_role || '',
    recommendation: tryout?.recommendation || '',
    dominant_foot: tryout?.dominant_foot || '',
    next_year_team: tryout?.next_year_team || '',
    next_season_status: tryout?.next_season_status || 'N/A',
    registration_status: tryout?.registration_status || 'Not Signed',
    notes: tryout?.notes || ''
  });

  const handleSave = () => {
    const data = {
      player_id: playerId,
      player_name: playerName,
      ...form
    };
    if (tryout?.id) {
      onSave(tryout.id, data);
    } else {
      onSave(null, data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Tryout Information</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>Team Role</Label>
            <Select value={form.team_role} onValueChange={v => setForm({...form, team_role: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Indispensable Player','GA Starter','GA Rotation','Aspire Starter','Aspire Rotation','United Starter','United Rotation'].map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Recommendation</Label>
            <Select value={form.recommendation} onValueChange={v => setForm({...form, recommendation: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Move up">Move up</SelectItem>
                <SelectItem value="Keep">Keep</SelectItem>
                <SelectItem value="Move down">Move down</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Dominant Foot</Label>
            <Select value={form.dominant_foot} onValueChange={v => setForm({...form, dominant_foot: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Left">Left</SelectItem>
                <SelectItem value="Right">Right</SelectItem>
                <SelectItem value="Both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Next Year Team</Label>
            <Select value={form.next_year_team} onValueChange={v => setForm({...form, next_year_team: v})}>
              <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>None</SelectItem>
                {/* Add teams dynamically if needed */}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Next Season Status</Label>
            <Select value={form.next_season_status} onValueChange={v => setForm({...form, next_season_status: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="N/A">N/A</SelectItem>
                <SelectItem value="Accepted Offer">Accepted Offer</SelectItem>
                <SelectItem value="Rejected Offer">Rejected Offer</SelectItem>
                <SelectItem value="Considering Offer">Considering Offer</SelectItem>
                <SelectItem value="Not Offered">Not Offered</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Registration Status</Label>
            <Select value={form.registration_status} onValueChange={v => setForm({...form, registration_status: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Not Signed">Not Signed</SelectItem>
                <SelectItem value="Signed">Signed</SelectItem>
                <SelectItem value="Signed and Paid">Signed and Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} className="bg-emerald-600">
            <Save className="w-4 h-4 mr-2" />Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}