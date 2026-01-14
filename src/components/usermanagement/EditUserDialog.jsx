import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Save, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function EditUserDialog({ open, onClose, user, players, coaches }) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    display_name: '',
    assigned_role: 'user',
    player_ids: []
  });

  const [playerSearch, setPlayerSearch] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        display_name: user.display_name || user.full_name || '',
        assigned_role: user.assigned_role || user.role || 'user',
        player_ids: user.player_ids || []
      });
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.User.update(user.id, data);
    },
    onSuccess: () => {
      toast.success('✅ User updated successfully');
      queryClient.invalidateQueries(['users']);
      onClose();
    },
    onError: (error) => {
      toast.error(`❌ Update failed: ${error.message}`);
    }
  });

  const createCoachMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.Coach.create({
        full_name: user.full_name,
        email: user.email,
        booking_enabled: true
      });
    },
    onSuccess: () => {
      toast.success('✅ User promoted to coach');
      queryClient.invalidateQueries(['coaches']);
    },
    onError: (error) => {
      toast.error(`❌ Failed to create coach: ${error.message}`);
    }
  });

  const removeCoachMutation = useMutation({
    mutationFn: async () => {
      const coach = coaches.find(c => c.email === user.email);
      if (coach) {
        await base44.entities.Coach.delete(coach.id);
      }
    },
    onSuccess: () => {
      toast.success('✅ Coach role removed');
      queryClient.invalidateQueries(['coaches']);
    },
    onError: (error) => {
      toast.error(`❌ Failed to remove coach: ${error.message}`);
    }
  });

  const handleSave = () => {
    const updateData = {
      display_name: formData.display_name,
      assigned_role: formData.assigned_role,
      player_ids: formData.player_ids
    };

    updateMutation.mutate(updateData);
  };

  const handleToggleCoach = () => {
    const isCoach = coaches.find(c => c.email === user.email);
    
    if (isCoach) {
      if (window.confirm('Remove coach role?')) {
        removeCoachMutation.mutate();
      }
    } else {
      if (window.confirm('Promote to coach?')) {
        createCoachMutation.mutate();
      }
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

  const isCoach = coaches.find(c => c.email === user?.email);

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User - {user.full_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label className="mb-2 block">Display Name</Label>
            <Input
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="Display name shown in app"
            />
            <p className="text-xs text-slate-500 mt-1">
              This overrides the account name throughout the app
            </p>
          </div>

          <div>
            <Label className="mb-2 block">Account Name (Read-only)</Label>
            <Input value={user.full_name} readOnly className="bg-slate-100" />
          </div>

          <div>
            <Label className="mb-2 block">Email (Read-only)</Label>
            <Input value={user.email} readOnly className="bg-slate-100" />
          </div>

          <div>
            <Label className="mb-2 block">Assigned Role</Label>
            <Select value={formData.assigned_role} onValueChange={(v) => setFormData({ ...formData, assigned_role: v })}>
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
              This role takes precedence and can be changed anytime
            </p>
          </div>

          <div>
            <Label className="mb-2 block">Linked Players</Label>
            <Input
              placeholder="Search players..."
              value={playerSearch}
              onChange={(e) => setPlayerSearch(e.target.value)}
              className="mb-2"
            />
            <div className="border rounded-md p-2 max-h-48 overflow-y-auto space-y-1">
              {filteredPlayers.map(player => (
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
              ))}
            </div>
            {formData.player_ids.length > 0 && (
              <p className="text-xs text-emerald-600 mt-1">
                {formData.player_ids.length} player(s) linked
              </p>
            )}
          </div>

          <div className="border-t pt-4">
            <Label className="mb-2 block">Coach Status</Label>
            <Button
              variant="outline"
              onClick={handleToggleCoach}
              className="w-full"
            >
              {isCoach ? 'Remove Coach Role' : 'Promote to Coach'}
            </Button>
            <p className="text-xs text-slate-500 mt-1">
              Creates/removes Coach entity separate from role
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}