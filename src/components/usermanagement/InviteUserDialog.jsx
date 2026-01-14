import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Mail, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function InviteUserDialog({ open, onClose, players }) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'user',
    player_ids: []
  });

  const [playerSearch, setPlayerSearch] = useState('');

  const inviteMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('sendInviteEmail', {
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        app_url: window.location.origin
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success(`✅ Invitation sent successfully to ${formData.email}`);
      queryClient.invalidateQueries(['users']);
      resetForm();
      onClose();
    },
    onError: (error) => {
      toast.error(`❌ Failed to send invitation: ${error.message}`);
    }
  });

  const resetForm = () => {
    setFormData({
      email: '',
      full_name: '',
      role: 'user',
      player_ids: []
    });
    setPlayerSearch('');
  };

  const handleSubmit = () => {
    if (!formData.email) {
      toast.error('Email is required');
      return;
    }

    if (window.confirm(`Send invitation to ${formData.email}?`)) {
      inviteMutation.mutate(formData);
    }
  };

  const togglePlayer = (playerId) => {
    setFormData(prev => ({
      ...prev,
      player_ids: prev.player_ids.includes(playerId)
        ? prev.player_ids.filter(id => id !== playerId)
        : [...prev.player_ids, playerId]
    }));
  };

  const filteredPlayers = players.filter(p =>
    !playerSearch || p.full_name?.toLowerCase().includes(playerSearch.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-emerald-600" />
            Invite New User
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label className="mb-2 block">Full Name</Label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="John Doe"
            />
          </div>

          <div>
            <Label className="mb-2 block">Email Address *</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@example.com"
            />
          </div>

          <div>
            <Label className="mb-2 block">Role</Label>
            <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="director">Director</SelectItem>
                <SelectItem value="coach">Coach</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="player">Player</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500 mt-1">
              Assign the user's primary role in the system
            </p>
          </div>

          {formData.role !== 'admin' && (
            <div>
              <Label className="mb-2 block">Link to Players (Optional)</Label>
              <Input
                placeholder="Search players..."
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                className="mb-2"
              />
              <div className="border rounded-md p-2 max-h-48 overflow-y-auto space-y-1">
                {filteredPlayers.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No players found</p>
                ) : (
                  filteredPlayers.map(player => (
                    <label
                      key={player.id}
                      className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.player_ids.includes(player.id)}
                        onChange={() => togglePlayer(player.id)}
                        className="rounded"
                      />
                      <span className="text-sm">{player.full_name}</span>
                    </label>
                  ))
                )}
              </div>
              {formData.player_ids.length > 0 && (
                <p className="text-xs text-emerald-600 mt-1">
                  {formData.player_ids.length} player(s) selected - user will be assigned 'parent' role
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => { resetForm(); onClose(); }}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={inviteMutation.isPending || !formData.email}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Mail className="w-4 h-4 mr-2" />
              {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}