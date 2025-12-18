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

export default function ParentContactsTable({ contacts, players, teams, users, onUpdate }) {
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
  const [editForm, setEditForm] = useState({ parent_name: '', phone: '' });

  const updateParentMutation = useMutation({
    mutationFn: ({ parentId, data }) => base44.entities.Parent.update(parentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['parents']);
      setShowEditDialog(false);
      toast.success('Contact updated');
    }
  });

  const deleteParentMutation = useMutation({
    mutationFn: (parentId) => base44.entities.Parent.delete(parentId),
    onSuccess: () => {
      queryClient.invalidateQueries(['parents']);
      setShowDeleteDialog(false);
      toast.success('Contact deleted');
    }
  });

  const inviteMutation = useMutation({
    mutationFn: async ({ email, name, role }) => {
      const response = await base44.functions.invoke('sendInviteEmail', {
        recipient_email: email,
        full_name: name,
        role,
        app_url: window.location.origin
      });
      return response.data;
    },
    onSuccess: () => {
      setShowInviteDialog(false);
      toast.success('Invitation sent');
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ email, subject, content }) => {
      await base44.functions.invoke('sendResendEmail', {
        to: email,
        subject,
        content
      });
    },
    onSuccess: () => {
      setShowMessageDialog(false);
      setMessageContent('');
      toast.success('Message sent');
    }
  });

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setEditForm({
      parent_name: contact.name || '',
      phone: contact.phone || ''
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    updateParentMutation.mutate({
      parentId: editingContact.id,
      data: {
        full_name: editForm.parent_name,
        phone: editForm.phone
      }
    });
  };

  const handleDelete = (contact) => {
    setDeletingContact(contact);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (deletingContact) {
      deleteParentMutation.mutate(deletingContact.id);
    }
  };

  const handleInvite = (contact) => {
    setInviteContact(contact);
    setShowInviteDialog(true);
  };

  const confirmInvite = () => {
    inviteMutation.mutate({
      email: inviteContact.email,
      name: inviteContact.name,
      role: 'parent'
    });
  };

  const handleMessage = (contact) => {
    setMessageContact(contact);
    setShowMessageDialog(true);
  };

  const sendMessage = () => {
    sendMessageMutation.mutate({
      email: messageContact.email,
      subject: `Message from ${messageContact.name}`,
      content: messageContent
    });
  };

  const toggleContact = (contactId) => {
    setSelectedContacts(prev =>
      prev.includes(contactId) ? prev.filter(id => id !== contactId) : [...prev, contactId]
    );
  };

  const toggleAll = () => {
    const contactsWithoutAccount = contacts.filter(c => !users.some(u => u.email === c.email));
    if (selectedContacts.length === contactsWithoutAccount.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contactsWithoutAccount.map(c => c.id));
    }
  };

  const handleBulkInvite = () => {
    const contactsToInvite = contacts.filter(c => selectedContacts.includes(c.id) && !users.some(u => u.email === c.email));
    if (contactsToInvite.length === 0) {
      toast.error('No valid contacts selected');
      return;
    }

    Promise.all(contactsToInvite.map(c =>
      base44.functions.invoke('sendInviteEmail', {
        recipient_email: c.email,
        full_name: c.name,
        role: 'parent',
        app_url: window.location.origin
      })
    )).then(() => {
      toast.success(`${contactsToInvite.length} invitation(s) sent`);
      setSelectedContacts([]);
    }).catch(() => {
      toast.error('Some invitations failed');
    });
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
                  checked={selectedContacts.length > 0 && selectedContacts.length === contacts.filter(c => !users.some(u => u.email === c.email)).length}
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
            {contacts.map((contact) => {
              const hasAccount = users.some(u => u.email === contact.email);
              return (
                <tr key={contact.id} className="border-b hover:bg-slate-50">
                  <td className="px-4 py-3">
                    {!hasAccount && (
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
                  <td className="px-4 py-3 text-sm text-slate-600">{contact.phone || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm">
                    {contact.player_ids?.length > 1 ? (
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
                      <button
                        onClick={() => navigate(`${createPageUrl('PlayerDashboard')}?id=${contact.player_id}`)}
                        className="text-blue-600 hover:underline"
                      >
                        {contact.player_name}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{contact.team || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{contact.branch || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {hasAccount ? (
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
                        >
                          <Mail className="w-3 h-3 text-blue-600" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMessage(contact)}
                        className="h-7 px-2 hover:bg-purple-50"
                      >
                        <MessageSquare className="w-3 h-3 text-purple-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(contact)}
                        className="h-7 px-2 hover:bg-emerald-50"
                      >
                        <Edit2 className="w-3 h-3 text-emerald-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(contact)}
                        className="h-7 px-2 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
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

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Parent Name</Label>
              <Input value={editForm.parent_name} onChange={e => setEditForm({ ...editForm, parent_name: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowEditDialog(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSaveEdit} className="flex-1 bg-emerald-600 hover:bg-emerald-700">Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-slate-600">
              Permanently delete <strong>{deletingContact?.name}</strong> ({deletingContact?.email})?
            </p>
            <p className="text-xs text-red-600">This will remove the parent record completely.</p>
            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="flex-1">Cancel</Button>
              <Button onClick={confirmDelete} className="flex-1 bg-red-600 hover:bg-red-700">Delete</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
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

      {/* Message Dialog */}
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
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}