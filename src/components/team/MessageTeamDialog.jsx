import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Mail, Users, UserCheck, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function MessageTeamDialog({ open, onClose, team, players = [] }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState(new Set());
  const [filterGroup, setFilterGroup] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    enabled: open
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list(),
    enabled: open
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  // Build recipient list
  const recipients = useMemo(() => {
    const list = [];

    // Add players
    players.forEach(player => {
      if (player.player_email) {
        list.push({
          id: `player_${player.id}`,
          name: player.full_name,
          email: player.player_email,
          type: 'player',
          playerId: player.id
        });
      }
    });

    // Add parents
    players.forEach(player => {
      const parentEmails = player.parent_emails || [];
      if (player.email && !parentEmails.includes(player.email)) {
        parentEmails.push(player.email);
      }
      
      parentEmails.forEach((email, idx) => {
        const parentUser = users.find(u => u.email === email);
        list.push({
          id: `parent_${player.id}_${idx}`,
          name: parentUser?.full_name || player.parent_name || email,
          email: email,
          type: 'parent',
          playerId: player.id,
          playerName: player.full_name
        });
      });
    });

    // Add coaches assigned to this team
    const teamCoaches = coaches.filter(c => c.team_ids?.includes(team?.id));
    teamCoaches.forEach(coach => {
      list.push({
        id: `coach_${coach.id}`,
        name: coach.full_name,
        email: coach.email,
        type: 'coach'
      });
    });

    return list;
  }, [players, users, coaches, team]);

  // Filter recipients
  const filteredRecipients = useMemo(() => {
    let filtered = recipients;

    if (filterGroup !== 'all') {
      filtered = filtered.filter(r => r.type === filterGroup);
    }

    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [recipients, filterGroup, searchTerm]);

  const sendMessageMutation = useMutation({
    mutationFn: async ({ recipients, subject, content }) => {
      const senderEmail = currentUser?.email;
      const senderName = currentUser?.full_name;

      for (const recipient of recipients) {
        await base44.entities.Message.create({
          sender_email: senderEmail,
          sender_name: senderName,
          recipient_email: recipient.email,
          recipient_name: recipient.name,
          subject: subject || `Team Message: ${team?.name}`,
          content: content
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['messages']);
      toast.success(`Message sent to ${selectedRecipients.size} recipient(s)`);
      resetForm();
      onClose();
    },
    onError: (error) => {
      toast.error(`Failed to send message: ${error.message}`);
    }
  });

  const resetForm = () => {
    setSubject('');
    setMessage('');
    setSelectedRecipients(new Set());
    setSelectAll(false);
    setFilterGroup('all');
    setSearchTerm('');
    setShowConfirmation(false);
  };

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedRecipients(new Set(filteredRecipients.map(r => r.id)));
    } else {
      setSelectedRecipients(new Set());
    }
  };

  const handleToggleRecipient = (recipientId) => {
    const newSelected = new Set(selectedRecipients);
    if (newSelected.has(recipientId)) {
      newSelected.delete(recipientId);
    } else {
      newSelected.add(recipientId);
    }
    setSelectedRecipients(newSelected);
    setSelectAll(newSelected.size === filteredRecipients.length);
  };

  const handleSend = () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }
    if (selectedRecipients.size === 0) {
      toast.error('Please select at least one recipient');
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmSend = () => {
    const recipientsToSend = recipients.filter(r => selectedRecipients.has(r.id));
    sendMessageMutation.mutate({
      recipients: recipientsToSend,
      subject,
      content: message
    });
  };

  const selectedPlayerCount = Array.from(selectedRecipients).filter(id => id.startsWith('player_')).length;
  const selectedParentCount = Array.from(selectedRecipients).filter(id => id.startsWith('parent_')).length;
  const selectedCoachCount = Array.from(selectedRecipients).filter(id => id.startsWith('coach_')).length;

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) { resetForm(); onClose(); } }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            Message Team - {team?.name}
          </DialogTitle>
        </DialogHeader>

        {!showConfirmation ? (
          <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-180px)] px-1">
            {/* Subject */}
            <div>
              <Label>Subject (Optional)</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={`Team Message: ${team?.name}`}
                className="mt-1"
              />
            </div>

            {/* Message */}
            <div>
              <Label>Message *</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={6}
                className="mt-1"
              />
            </div>

            {/* Filter & Search */}
            <div className="flex gap-2 items-center">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={filterGroup === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterGroup('all')}
                >
                  All ({recipients.length})
                </Button>
                <Button
                  size="sm"
                  variant={filterGroup === 'player' ? 'default' : 'outline'}
                  onClick={() => setFilterGroup('player')}
                >
                  Players ({recipients.filter(r => r.type === 'player').length})
                </Button>
                <Button
                  size="sm"
                  variant={filterGroup === 'parent' ? 'default' : 'outline'}
                  onClick={() => setFilterGroup('parent')}
                >
                  Parents ({recipients.filter(r => r.type === 'parent').length})
                </Button>
                <Button
                  size="sm"
                  variant={filterGroup === 'coach' ? 'default' : 'outline'}
                  onClick={() => setFilterGroup('coach')}
                >
                  Coaches ({recipients.filter(r => r.type === 'coach').length})
                </Button>
              </div>
              <Input
                placeholder="Search recipients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-xs"
              />
            </div>

            {/* Select All */}
            <div className="flex items-center gap-2 py-2 border-y">
              <Checkbox
                id="select-all"
                checked={selectAll}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all" className="cursor-pointer font-medium">
                Select All ({filteredRecipients.length})
              </Label>
              {selectedRecipients.size > 0 && (
                <Badge className="ml-auto bg-blue-600">
                  {selectedRecipients.size} selected
                </Badge>
              )}
            </div>

            {/* Recipients List */}
            <div className="space-y-1 max-h-64 overflow-y-auto border rounded-lg p-3 bg-slate-50">
              {filteredRecipients.map((recipient) => (
                <div key={recipient.id} className="flex items-center gap-2 p-2 hover:bg-white rounded-lg">
                  <Checkbox
                    id={recipient.id}
                    checked={selectedRecipients.has(recipient.id)}
                    onCheckedChange={() => handleToggleRecipient(recipient.id)}
                  />
                  <Label htmlFor={recipient.id} className="flex-1 cursor-pointer text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{recipient.name}</span>
                      <Badge className={`text-xs ${
                        recipient.type === 'player' ? 'bg-blue-100 text-blue-800' :
                        recipient.type === 'parent' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {recipient.type}
                      </Badge>
                      {recipient.type === 'parent' && recipient.playerName && (
                        <span className="text-xs text-slate-500">→ {recipient.playerName}</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">{recipient.email}</div>
                  </Label>
                </div>
              ))}
              {filteredRecipients.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No recipients found
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-yellow-900 mb-1">Confirm Send</h4>
                <p className="text-sm text-yellow-800">
                  You are about to send this message to {selectedRecipients.size} recipient(s):
                </p>
                <div className="flex gap-3 mt-2 text-sm">
                  {selectedPlayerCount > 0 && (
                    <Badge className="bg-blue-100 text-blue-800">{selectedPlayerCount} Players</Badge>
                  )}
                  {selectedParentCount > 0 && (
                    <Badge className="bg-green-100 text-green-800">{selectedParentCount} Parents</Badge>
                  )}
                  {selectedCoachCount > 0 && (
                    <Badge className="bg-purple-100 text-purple-800">{selectedCoachCount} Coaches</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border">
              <div className="text-sm font-semibold text-slate-700 mb-1">Subject:</div>
              <div className="text-sm text-slate-900 mb-3">{subject || `Team Message: ${team?.name}`}</div>
              <div className="text-sm font-semibold text-slate-700 mb-1">Message:</div>
              <div className="text-sm text-slate-900 whitespace-pre-wrap max-h-32 overflow-y-auto">
                {message}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          {!showConfirmation ? (
            <>
              <Button variant="outline" onClick={() => { resetForm(); onClose(); }}>
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={!message.trim() || selectedRecipients.size === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Mail className="w-4 h-4 mr-2" />
                Review & Send
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setShowConfirmation(false)}>
                Back
              </Button>
              <Button
                onClick={handleConfirmSend}
                disabled={sendMessageMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                {sendMessageMutation.isPending ? 'Sending...' : 'Confirm & Send'}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}