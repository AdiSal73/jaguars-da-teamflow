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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParent, setSelectedParent] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [parentForm, setParentForm] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list()
  });

  const existingParents = allUsers.filter(u => 
    u.player_ids && u.player_ids.length > 0
  );

  const filteredParents = existingParents.filter(p =>
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const linkExistingParentMutation = useMutation({
    mutationFn: async (parentUser) => {
      const updatedParentEmails = [...(player.parent_emails || []), parentUser.email];
      await base44.entities.Player.update(player.id, {
        parent_emails: updatedParentEmails
      });

      const currentPlayerIds = parentUser.player_ids || [];
      if (!currentPlayerIds.includes(player.id)) {
        await base44.entities.User.update(parentUser.id, {
          player_ids: [...currentPlayerIds, player.id]
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['player']);
      queryClient.invalidateQueries(['allUsers']);
      toast.success('Parent linked successfully');
      setSearchTerm('');
      setSelectedParent(null);
      onClose();
    }
  });

  const addNewParentMutation = useMutation({
    mutationFn: async (parentData) => {
      const updatedParentEmails = [...(player.parent_emails || []), parentData.email];
      await base44.entities.Player.update(player.id, {
        parent_emails: updatedParentEmails
      });

      const existingUser = allUsers.find(u => u.email === parentData.email);
      if (existingUser) {
        const currentPlayerIds = existingUser.player_ids || [];
        if (!currentPlayerIds.includes(player.id)) {
          await base44.entities.User.update(existingUser.id, {
            player_ids: [...currentPlayerIds, player.id]
          });
        }
      } else {
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
      toast.success('Parent added and invited');
      setParentForm({ name: '', email: '', phone: '' });
      setShowCreateForm(false);
      onClose();
    }
  });

  const handleLinkExisting = () => {
    if (!selectedParent) return;
    if ((player.parent_emails || []).includes(selectedParent.email)) {
      toast.error('This parent is already linked');
      return;
    }
    linkExistingParentMutation.mutate(selectedParent);
  };

  const handleCreateNew = () => {
    if (!parentForm.email || !parentForm.email.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }
    if (!parentForm.name) {
      toast.error('Please enter parent name');
      return;
    }
    if ((player.parent_emails || []).includes(parentForm.email)) {
      toast.error('This email is already linked');
      return;
    }
    addNewParentMutation.mutate(parentForm);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-600" />
            Add Parent/Guardian for {player?.full_name}
          </DialogTitle>
        </DialogHeader>
        
        {!showCreateForm ? (
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                Search for existing parents in the database or create a new parent entry
              </p>
            </div>

            <div>
              <Label>Search Existing Parents</Label>
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>

            {searchTerm && (
              <div className="max-h-60 overflow-y-auto space-y-2 p-3 bg-slate-50 rounded-lg">
                {filteredParents.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No parents found</p>
                ) : (
                  filteredParents.map(parent => (
                    <div
                      key={parent.id}
                      onClick={() => setSelectedParent(parent)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedParent?.id === parent.id 
                          ? 'border-emerald-500 bg-emerald-50' 
                          : 'border-slate-200 hover:border-emerald-300 bg-white'
                      }`}
                    >
                      <div className="font-semibold text-sm">{parent.full_name}</div>
                      <div className="text-xs text-slate-600">{parent.email}</div>
                      {parent.phone && <div className="text-xs text-slate-500">{parent.phone}</div>}
                      <div className="text-xs text-blue-600 mt-1">
                        {(parent.player_ids || []).length} player{(parent.player_ids || []).length !== 1 ? 's' : ''} linked
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

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
                onClick={() => setShowCreateForm(true)} 
                variant="outline"
                className="flex-1"
              >
                Create New Parent
              </Button>
              <Button
                onClick={handleLinkExisting}
                disabled={!selectedParent || linkExistingParentMutation.isPending}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {linkExistingParentMutation.isPending ? 'Linking...' : 'Link Selected'}
              </Button>
            </div>
          </div>
        ) : (
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

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowCreateForm(false)} className="flex-1">Back</Button>
              <Button
                onClick={handleCreateNew}
                disabled={!parentForm.email || !parentForm.name || addNewParentMutation.isPending}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {addNewParentMutation.isPending ? 'Creating...' : 'Create & Invite'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}