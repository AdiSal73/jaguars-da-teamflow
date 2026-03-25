import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save } from 'lucide-react';

export default function EditPlayerInfoDialog({ open, onClose, player, teams, onSave }) {
  const [form, setForm] = useState({
    full_name: player?.full_name || '',
    jersey_number: player?.jersey_number || '',
    primary_position: player?.primary_position || '',
    secondary_position: player?.secondary_position || '',
    team_id: player?.team_id || '',
    current_25_26_team: player?.current_25_26_team || '',
    current_26_27_team: player?.current_26_27_team || '',
    email: player?.email || '',
    player_email: player?.player_email || '',
    phone: player?.phone || '',
    player_phone: player?.player_phone || '',
    date_of_birth: player?.date_of_birth || '',
    preferred_foot: player?.preferred_foot || '',
    status: player?.status || 'Active'
  });

  const handleSave = () => {
    // Build team_assignments to keep in sync
    const existingAssignments = (player?.team_assignments || []).filter(
      a => a.season !== '25/26' && a.season !== '26/27'
    );
    if (form.current_25_26_team) existingAssignments.push({ team_id: form.current_25_26_team, season: '25/26' });
    if (form.current_26_27_team) existingAssignments.push({ team_id: form.current_26_27_team, season: '26/27' });

    onSave({
      ...form,
      jersey_number: form.jersey_number ? Number(form.jersey_number) : null,
      team_assignments: existingAssignments
    });
  };

  const teams2526 = teams?.filter(t => t.season === '25/26' || t.name?.includes('25/26')) || [];
  const teams2627 = teams?.filter(t => t.season === '26/27' || t.name?.includes('26/27')) || [];

  const positions = ['GK','Right Outside Back','Left Outside Back','Right Centerback','Left Centerback','Defensive Midfielder','Right Winger','Center Midfielder','Forward','Attacking Midfielder','Left Winger'];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Player Information</DialogTitle>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div>
            <Label>Full Name *</Label>
            <Input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} />
          </div>
          <div>
            <Label>Jersey Number</Label>
            <Input type="number" value={form.jersey_number} onChange={e => setForm({...form, jersey_number: e.target.value})} />
          </div>
          <div>
            <Label>Primary Position</Label>
            <Select value={form.primary_position} onValueChange={v => setForm({...form, primary_position: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {positions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Secondary Position</Label>
            <Select value={form.secondary_position} onValueChange={v => setForm({...form, secondary_position: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>None</SelectItem>
                {positions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Team (General)</Label>
            <Select value={form.team_id} onValueChange={v => setForm({...form, team_id: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {teams?.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>25/26 Team</Label>
            <Select value={form.current_25_26_team} onValueChange={v => setForm({...form, current_25_26_team: v})}>
              <SelectTrigger><SelectValue placeholder="No team assigned" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>None</SelectItem>
                {teams2526.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>26/27 Team</Label>
            <Select value={form.current_26_27_team} onValueChange={v => setForm({...form, current_26_27_team: v})}>
              <SelectTrigger><SelectValue placeholder="No team assigned" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>None</SelectItem>
                {teams2627.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Date of Birth</Label>
            <Input type="date" value={form.date_of_birth} onChange={e => setForm({...form, date_of_birth: e.target.value})} />
          </div>
          <div>
            <Label>Preferred Foot</Label>
            <Select value={form.preferred_foot} onValueChange={v => setForm({...form, preferred_foot: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Left">Left</SelectItem>
                <SelectItem value="Right">Right</SelectItem>
                <SelectItem value="Both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Injured">Injured</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Parent Email</Label>
            <Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          </div>
          <div>
            <Label>Parent Phone</Label>
            <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          </div>
          <div>
            <Label>Player Email</Label>
            <Input value={form.player_email} onChange={e => setForm({...form, player_email: e.target.value})} />
          </div>
          <div>
            <Label>Player Phone</Label>
            <Input value={form.player_phone} onChange={e => setForm({...form, player_phone: e.target.value})} />
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