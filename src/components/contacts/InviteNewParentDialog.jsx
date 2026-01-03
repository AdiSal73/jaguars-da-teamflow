import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function InviteNewParentDialog({ open, onClose, players }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    player_ids: []
  });
  const [searchTerm, setSearchTerm] = useState('');

  const inviteParentMutation = useMutation({
    mutationFn: async (data) => {
      await base44.users.inviteUser(data.email, 'user');
      
      if (data.player_ids && data.player_ids.length > 0) {
        await Promise.all(data.player_ids.map(async (playerId) => {
          const player = players.find(p => p.id === playerId);
          if (player) {
            const updatedParentEmails = Array.from(new Set([...(player.parent_emails || []), data.email]));
            await base44.entities.Player.update(playerId, { parent_emails: updatedParentEmails });
          }
        }));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['players']);
      queryClient.invalidateQueries(['users']);
      toast.success('Parent invited successfully!');
      onClose();
      setForm({ full_name: '', email: '', player_ids: [] });
      setSearchTerm('');
    },
    onError: (error) => {
      toast.error('Failed to invite parent: ' + (error.message || 'Unknown error'));
    }
  });

  const handleCheckboxChange = (playerId) => {
    setForm(prev => ({
      ...prev,
      player_ids: prev.player_ids.includes(playerId)
        ? prev.player_ids.filter(id => id !== playerId)
        : [...prev.player_ids, playerId]
    }));
  };

  const filteredPlayers = players.filter(player =>
    player.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a,b) => (a.full_name || '').localeCompare(b.full_name || ''));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-600"/>
            Invite New Parent
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Parent's Full Name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="parent@example.com"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label>Assign to Players (Optional)</Label>
            <Input
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2 h-8 text-xs"
            />
            <div className="border rounded-md p-2 max-h-48 overflow-y-auto space-y-1">
              {filteredPlayers.length > 0 ? filteredPlayers.map(player => (
                <div key={player.id} className="flex items-center space-x-2 p-1 hover:bg-slate-50 rounded">
                  <Checkbox
                    id={`player-${player.id}`}
                    checked={form.player_ids.includes(player.id)}
                    onCheckedChange={() => handleCheckboxChange(player.id)}
                  />
                  <Label htmlFor={`player-${player.id}`} className="flex-1 cursor-pointer text-sm font-normal">
                    {player.full_name}
                  </Label>
                </div>
              )) : (
                <p className="text-sm text-slate-500">No players found.</p>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">Invited parent will be linked to selected players.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => inviteParentMutation.mutate(form)}
            disabled={!form.email || inviteParentMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {inviteParentMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
            {inviteParentMutation.isPending ? 'Inviting...' : 'Send Invite'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}