import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Mail, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export default function AddParentDialog({ open, onClose, player }) {
  const queryClient = useQueryClient();
  const [parentForm, setParentForm] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list()
  });

  const addParentMutation = useMutation({
    mutationFn: async (parentData) => {
      // Add email to player's parent_emails array
      const updatedParentEmails = [...(player.parent_emails || []), parentData.email];
      await base44.entities.Player.update(player.id, {
        parent_emails: updatedParentEmails
      });

      // Check if user exists with this email
      const existingUser = allUsers.find(u => u.email === parentData.email);
      if (existingUser) {
        // Add player to user's player_ids
        const currentPlayerIds = existingUser.player_ids || [];
        if (!currentPlayerIds.includes(player.id)) {
          await base44.entities.User.update(existingUser.id, {
            player_ids: [...currentPlayerIds, player.id]
          });
        }
      } else {
        // Send invitation
        await base44.functions.invoke('sendInviteEmail', {
          email: parentData.email,
          full_name: parentData.name,
          role: 'parent',
          app_url: window.location.origin,
          player_name: player.full_name
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['player']);
      queryClient.invalidateQueries(['allUsers']);
      toast.success('Parent added successfully');
      setParentForm({ name: '', email: '', phone: '' });
      onClose();
    },
    onError: () => {
      toast.error('Failed to add parent');
    }
  });

  const handleSubmit = () => {
    if (!parentForm.email || !parentForm.email.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }
    if (!parentForm.name) {
      toast.error('Please enter parent name');
      return;
    }
    if ((player.parent_emails || []).includes(parentForm.email)) {
      toast.error('This email is already linked to the player');
      return;
    }
    addParentMutation.mutate(parentForm);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-600" />
            Add Parent/Guardian for {player?.full_name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900 flex items-start gap-2">
              <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                The parent will receive an invitation email and will be able to:
                <ul className="mt-2 ml-4 list-disc space-y-1">
                  <li>View this player's dashboard</li>
                  <li>Book coaching sessions</li>
                  <li>View evaluations and progress</li>
                </ul>
              </span>
            </p>
          </div>

          <div>
            <Label>Parent/Guardian Name *</Label>
            <Input
              value={parentForm.name}
              onChange={(e) => setParentForm({...parentForm, name: e.target.value})}
              placeholder="Full name"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Email *</Label>
            <Input
              type="email"
              value={parentForm.email}
              onChange={(e) => setParentForm({...parentForm, email: e.target.value})}
              placeholder="parent@email.com"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Phone Number</Label>
            <Input
              type="tel"
              value={parentForm.phone}
              onChange={(e) => setParentForm({...parentForm, phone: e.target.value})}
              placeholder="(555) 123-4567"
              className="mt-1"
            />
          </div>

          {player?.parent_emails?.length > 0 && (
            <div>
              <Label className="text-xs text-slate-600">Currently Linked Parents</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {player.parent_emails.map((parentEmail, idx) => (
                  <Badge key={idx} className="bg-slate-100 text-slate-700">
                    {parentEmail}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!parentForm.email || !parentForm.name || addParentMutation.isPending}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {addParentMutation.isPending ? 'Adding...' : 'Add Parent'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}