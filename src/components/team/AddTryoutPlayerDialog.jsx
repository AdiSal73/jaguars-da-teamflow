import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function AddTryoutPlayerDialog({ open, onClose, teamId }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    parent_name: '',
    parent_email: '',
    parent_phone: '',
    date_of_birth: '',
    grad_year: '',
    primary_position: '',
    current_club: '',
    current_team: '',
    scouting_note: ''
  });

  const createTryoutPlayerMutation = useMutation({
    mutationFn: async (data) => {
      // Create as regular player with is_tryout_player flag
      return base44.entities.Player.create({
        ...data,
        team_id: teamId,
        is_tryout_player: true,
        status: 'Active'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['teamPlayers']);
      queryClient.invalidateQueries(['players']);
      toast.success('Tryout player added successfully');
      onClose();
      setFormData({ full_name: '', email: '', phone: '', parent_name: '', parent_email: '', parent_phone: '', date_of_birth: '', grad_year: '', primary_position: '', current_club: '', current_team: '', scouting_note: '' });
    },
    onError: () => {
      toast.error('Failed to add tryout player');
    }
  });

  const handleSubmit = () => {
    if (!formData.full_name || !formData.date_of_birth) {
      toast.error('Name and date of birth are required');
      return;
    }
    createTryoutPlayerMutation.mutate({
      ...formData,
      grad_year: formData.grad_year ? Number(formData.grad_year) : undefined,
      tryout_notes: formData.scouting_note
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Tryout Player</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Full Name *</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Player name"
              />
            </div>
            <div>
              <Label>Date of Birth *</Label>
              <Input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              />
            </div>
            <div>
              <Label>Grad Year</Label>
              <Input
                type="number"
                value={formData.grad_year}
                onChange={(e) => setFormData({ ...formData, grad_year: e.target.value })}
                placeholder="2026"
              />
            </div>
            <div>
              <Label>Primary Position</Label>
              <Select value={formData.primary_position} onValueChange={(v) => setFormData({ ...formData, primary_position: v })}>
                <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
                <SelectContent>
                  {['GK', 'Right Outside Back', 'Left Outside Back', 'Right Centerback', 'Left Centerback', 'Defensive Midfielder', 'Right Winger', 'Center Midfielder', 'Forward', 'Attacking Midfielder', 'Left Winger'].map(pos => (
                    <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Current Club</Label>
              <Input
                value={formData.current_club}
                onChange={(e) => setFormData({ ...formData, current_club: e.target.value })}
                placeholder="Current club"
              />
            </div>
            <div>
              <Label>Current Team</Label>
              <Input
                value={formData.current_team}
                onChange={(e) => setFormData({ ...formData, current_team: e.target.value })}
                placeholder="Current team"
              />
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm mb-3">Parent/Guardian Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Parent Name</Label>
                <Input
                  value={formData.parent_name}
                  onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                  placeholder="Parent name"
                />
              </div>
              <div>
                <Label>Parent Email</Label>
                <Input
                  type="email"
                  value={formData.parent_email}
                  onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                  placeholder="parent@email.com"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Parent Phone</Label>
                <Input
                  value={formData.parent_phone}
                  onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                  placeholder="Parent phone"
                />
              </div>
            </div>
          </div>

          <div>
            <Label>Scouting Notes</Label>
            <Textarea
              value={formData.scouting_note}
              onChange={(e) => setFormData({ ...formData, scouting_note: e.target.value })}
              placeholder="Initial observations and notes about the player..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={createTryoutPlayerMutation.isPending}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {createTryoutPlayerMutation.isPending ? 'Adding...' : 'Add Tryout Player'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}