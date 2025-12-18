import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, MessageSquare, Edit2, Trash2, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

export default function ParentContactsTable({ contacts, players, teams, users }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [deletingContact, setDeletingContact] = useState(null);
  const [inviteContact, setInviteContact] = useState(null);
  const [messageContact, setMessageContact] = useState(null);
  const [messageContent, setMessageContent] = useState('');
  const [editForm, setEditForm] = useState({ name: '', phone: '' });

  const updateContactMutation = useMutation({
    mutationFn: async ({ contact, data }) => {
      // Update all associated players
      for (const playerId of contact.player_ids) {
        const player = players.find(p => p.id === playerId);
        if (player && (player.email === contact.email || player.parent_emails?.includes(contact.email))) {
          await base44.entities.Player.update(playerId, {
            parent_name: data.name,
            phone: data.phone
          });
        }
      }

      // Update User entity if exists
      if (contact.has_user_account && contact.user_id) {
        await base44.entities.User.update(contact.user_id, {
          full_name: data.name,
          phone: data.phone
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['players']);
      queryClient.invalidateQueries(['users']);
      setShowEditDialog(false);
      toast.success('Contact updated successfully');
    },
    onError: () => {
      toast.error('Failed to update contact');
    }
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (contact) => {
      if (contact.has_user_account) {
        toast.error('Cannot delete user accounts. Remove parent email from player profiles instead.');
        throw new Error('Cannot delete user accounts');
      }

      // Remove email from all associated players
      for (const playerId of contact.player_ids) {
        const player = players.find(p => p.id === playerId);
        if (player) {
          const updates = {};
          
          if (player.email === contact.email) {
            updates.email = '';
            updates.phone = '';
            updates.parent_name = '';
          }
          
          if (player.parent_emails?.includes(contact.email)) {
            updates.parent_emails = player.parent_emails.filter(e => e !== contact.email);
          }
          
          if (Object.keys(updates).length > 0) {
            await base44.entities.Player.update(playerId, updates);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['players']);
      setShowDeleteDialog(false);
      toast.success('Contact removed from all players');
    },
    onError: (error) => {
      if (error.message !== 'Cannot delete user accounts') {
        toast.error('Failed to delete contact');
      }
    }
  });

  const inviteMutation = useMutation({
    mutationFn: async ({ email, name }) => {
      const response = await base44.functions.invoke('sendInviteEmail', {
        recipient_email: email,
        full_name: name,
        role: 'parent',
        app_url: window.location.origin
      });
      return response.data;
    },
    onSuccess: () => {
      setShowInviteDialog(false);
      toast.success('Invitation sent successfully');
    },
    onError: () => {
      toast.error('Failed to send invitation');
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ email, content }) => {
      await base44.functions.invoke('sendResendEmail', {
        to: email,
        subject: 'Message from Michigan Jaguars',
        content
      });
    },
    onSuccess: () => {
      setShowMessageDialog(false);
      setMessageContent('');
      toast.success('Message sent successfully');
    },
    onError: () => {
      toast.error('Failed to send message');
    }
  });

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setEditForm({
      name: contact.name || '',
      phone: contact.phone || ''
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    updateContactMutation.mutate({
      contact: editingContact,
      data: editForm
    });
  };

  const handleDelete = (contact) => {
    setDeletingContact(contact);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (deletingContact) {
      deleteContactMutation.mutate(deletingContact);
    }
  };

  const handleInvite = (contact) => {
    if (contact.has_user_account) {
      toast.info('This parent already has an account');
      return;
    }
    setInviteContact(contact);
    setShowInviteDialog(true);
  };

  const confirmInvite = () => {
    inviteMutation.mutate({
      email: inviteContact.email,
      name: inviteContact.name
    });
  };

  const handleMessage = (contact) => {
    setMessageContact(contact);
    setShowMessageDialog(true);
  };

  const sendMessage = () => {
    sendMessageMutation.mutate({
      email: messageContact.email,
      content: messageContent
    });
  };

  const toggleContact = (contactId) => {
    setSelectedContacts(prev =>
      prev.includes(contactId) ? prev.filter(id => id !== contactId) : [...prev, contactId]
    );
  };

  const toggleAll = () => {
    const contactsWithoutAccount = contacts.filter(c => !c.has_user_account);
    if (selectedContacts.length === contactsWithoutAccount.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contactsWithoutAccount.map(c => c.id));
    }
  };

  const handleBulkInvite = async () => {
    const contactsToInvite = contacts.filter(c => selectedContacts.includes(c.id) && !c.has_user_account);
    if (contactsToInvite.length === 0) {
      toast.error('No valid contacts selected');
      return;
    }

    try {
      await Promise.all(contactsToInvite.map(c =>
        base44.functions.invoke('sendInviteEmail', {
          recipient_email: c.email,
          full_name: c.name,
          role: 'parent',
          app_url: window.location.origin
        })
      ));
      toast.success(`${contactsToInvite.length} invitation(s) sent`);
      setSelectedContacts([]);
    } catch {
      toast.error('Some invitations failed');
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left w-12">
                <input
                  type="checkbox"
                  checked={selectedContacts.length > 0 && selectedContacts.length === contacts.filter(c => !c.has_user_account).length}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border-slate-300"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Player(s)</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Team</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Branch</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 w-48">Actions</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => (
              <tr key={contact.id} className="border-b hover:bg-slate-50">
                <td className="px-4 py-3">
                  {!contact.has_user_account && (
                    <input
                      type="checkbox"
                      checked={selectedContacts.includes(contact.id)}
                      onChange={() => toggleContact(contact.id)}
                      className="w-4 h-4 rounded border-slate-300"
                    />
                  )}
                </td>
                <td className="px-4 py-3 text-sm font-medium">{contact.name}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{contact.email}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{contact.phone}</td>
                <td className="px-4 py-3 text-sm">
                  {contact.player_ids?.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {contact.player_ids.map(pid => {
                        const p = players.find(pl => pl.id === pid);
                        return p ? (
                          <button
                            key={pid}
                            onClick={() => navigate(`${createPageUrl('PlayerDashboard')}?id=${pid}`)}
                            className="text-blue-600 hover:underline text-xs text-left"
                          >
                            {p.full_name}
                          </button>
                        ) : null;
                      })}
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs">No players</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{contact.team}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{contact.branch || 'N/A'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {contact.has_user_account ? (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleInvite(contact)}
                        className="h-7 px-2 hover:bg-blue-50"
                        title="Send invitation"
                      >
                        <Mail className="w-3 h-3 text-blue-600" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleMessage(contact)}
                      className="h-7 px-2 hover:bg-purple-50"
                      title="Send message"
                    >
                      <MessageSquare className="w-3 h-3 text-purple-600" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(contact)}
                      className="h-7 px-2 hover:bg-emerald-50"
                      title="Edit contact"
                    >
                      <Edit2 className="w-3 h-3 text-emerald-600" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(contact)}
                      className="h-7 px-2 hover:bg-red-50"
                      title="Remove contact"
                    >
                      <Trash2 className="w-3 h-3 text-red-600" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {contacts.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No contacts found
          </div>
        )}
      </div>

      {selectedContacts.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">
            {selectedContacts.length} contact(s) selected
          </span>
          <div className="flex gap-2">
            <Button onClick={handleBulkInvite} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Send className="w-4 h-4 mr-2" />
              Invite Selected
            </Button>
            <Button onClick={() => setSelectedContacts([])} size="sm" variant="outline">
              Clear
            </Button>
          </div>
        </div>
      )}

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Name</Label>
              <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowEditDialog(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={updateContactMutation.isPending} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                {updateContactMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-slate-600">
              Remove <strong>{deletingContact?.name}</strong> ({deletingContact?.email}) from all linked players?
            </p>
            <p className="text-xs text-amber-600">This will remove their email from all associated player profiles.</p>
            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="flex-1">Cancel</Button>
              <Button onClick={confirmDelete} disabled={deleteContactMutation.isPending} className="flex-1 bg-red-600 hover:bg-red-700">
                {deleteContactMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Remove
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Invitation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-slate-600">Send an invitation email to:</p>
            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
              <div className="font-semibold">{inviteContact?.name}</div>
              <div className="text-sm text-slate-600">{inviteContact?.email}</div>
              <Badge className="bg-purple-100 text-purple-800">Parent</Badge>
            </div>
            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowInviteDialog(false)} className="flex-1">Cancel</Button>
              <Button onClick={confirmInvite} disabled={inviteMutation.isPending} className="flex-1 bg-blue-600 hover:bg-blue-700">
                {inviteMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Send Invitation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>To: {messageContact?.name}</Label>
              <Input value={messageContact?.email || ''} disabled className="mt-1" />
            </div>
            <div>
              <Label>Message</Label>
              <Input value={messageContent} onChange={e => setMessageContent(e.target.value)} placeholder="Type your message..." className="mt-1" />
            </div>
            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowMessageDialog(false)} className="flex-1">Cancel</Button>
              <Button onClick={sendMessage} disabled={!messageContent || sendMessageMutation.isPending} className="flex-1 bg-purple-600 hover:bg-purple-700">
                {sendMessageMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}