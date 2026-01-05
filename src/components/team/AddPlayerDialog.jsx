import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { User, Users } from 'lucide-react';

export default function AddPlayerDialog({ open, onClose, teamId, teamName }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    full_name: '',
    player_email: '',
    player_phone: '',
    date_of_birth: '',
    grad_year: '',
    gender: '',
    primary_position: '',
    branch: '',
    team_id: teamId,
    parent_name: '',
    parent_email: '',
    parent_phone: ''
  });

  const createPlayerMutation = useMutation({
    mutationFn: (data) => base44.entities.Player.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['teamPlayers']);
      queryClient.invalidateQueries(['players']);
      toast.success('Player added successfully');
      onClose();
      setFormData({ 
        full_name: '', 
        player_email: '', 
        player_phone: '', 
        date_of_birth: '', 
        grad_year: '', 
        gender: '', 
        primary_position: '', 
        branch: '', 
        team_id: teamId,
        parent_name: '',
        parent_email: '',
        parent_phone: ''
      });
    },
    onError: () => {
      toast.error('Failed to add player');
    }
  });

  const handleSubmit = () => {
    if (!formData.full_name || !formData.gender) {
      toast.error('Name and gender are required');
      return;
    }
    
    const playerData = {
      full_name: formData.full_name,
      gender: formData.gender,
      team_id: teamId,
      date_of_birth: formData.date_of_birth || undefined,
      grad_year: formData.grad_year ? Number(formData.grad_year) : undefined,
      primary_position: formData.primary_position || undefined,
      branch: formData.branch || undefined,
      player_email: formData.player_email || undefined,
      player_phone: formData.player_phone || undefined,
      parent_name: formData.parent_name || undefined,
      phone: formData.parent_phone || undefined,
      parent_emails: formData.parent_email ? [formData.parent_email] : undefined
    };
    
    createPlayerMutation.mutate(playerData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Player to {teamName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          {/* Player Information Section */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Player Information</h3>
            </div>
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
                <Label>Gender *</Label>
                <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Player Email</Label>
                <Input
                  type="email"
                  value={formData.player_email}
                  onChange={(e) => setFormData({ ...formData, player_email: e.target.value })}
                  placeholder="player@email.com"
                />
              </div>
              <div>
                <Label>Player Phone</Label>
                <Input
                  value={formData.player_phone}
                  onChange={(e) => setFormData({ ...formData, player_phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <Label>Date of Birth</Label>
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
                <Label>Branch</Label>
                <Select value={formData.branch} onValueChange={(v) => setFormData({ ...formData, branch: v })}>
                  <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>
                    {['CW3', 'Dearborn', 'Downriver', 'Genesee', 'Huron Valley', 'Jackson', 'Lansing', 'Marshall', 'Northville', 'Novi', 'Rochester Romeo', 'West Bloomfield'].map(b => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Parent/Guardian Information Section */}
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-emerald-900">Parent/Guardian Information</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Parent Name</Label>
                <Input
                  value={formData.parent_name}
                  onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                  placeholder="Parent full name"
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
              <div>
                <Label>Parent Phone</Label>
                <Input
                  value={formData.parent_phone}
                  onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={createPlayerMutation.isPending}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {createPlayerMutation.isPending ? 'Adding...' : 'Add Player'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}