import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function NewMessageDialog({ open, onClose, user }) {
  const queryClient = useQueryClient();
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list()
  });

  const currentCoach = coaches.find(c => c.email === user?.email);
  const isCoach = !!currentCoach;
  const isAdmin = user?.role === 'admin';

  const myPlayers = useMemo(() => {
    if (!user) return [];
    if (user.player_ids?.length > 0) {
      return players.filter(p => user.player_ids.includes(p.id));
    }
    return players.filter(p => p.email === user.email);
  }, [players, user]);

  const myTeamIds = useMemo(() => {
    return [...new Set(myPlayers.map(p => p.team_id).filter(Boolean))];
  }, [myPlayers]);

  const availableRecipients = useMemo(() => {
    let recipients = [];

    if (isAdmin) {
      // Admin can message everyone
      const allEmails = [...new Set([
        ...allUsers.map(u => ({ email: u.email, name: u.full_name, type: 'User' })),
        ...coaches.map(c => ({ email: c.email, name: c.full_name, type: 'Coach' })),
        ...players.flatMap(p => {
          const emails = [];
          if (p.email) emails.push({ email: p.email, name: `${p.full_name} (Parent)`, type: 'Parent' });
          if (p.parent_emails) {
            p.parent_emails.forEach(pe => emails.push({ email: pe, name: `${p.full_name} (Parent)`, type: 'Parent' }));
          }
          return emails;
        })
      ])];
      recipients = allEmails.filter((r, idx, arr) => arr.findIndex(x => x.email === r.email) === idx);
    } else if (isCoach) {
      // Coach can message players and parents on their teams
      const coachTeamIds = currentCoach?.team_ids || [];
      const teamPlayers = players.filter(p => coachTeamIds.includes(p.team_id));
      
      recipients = [...new Set([
        ...teamPlayers.map(p => ({ email: p.email, name: `${p.full_name} (Parent)`, type: 'Parent' })),
        ...teamPlayers.flatMap(p => (p.parent_emails || []).map(pe => ({ 
          email: pe, 
          name: `${p.full_name} (Parent)`, 
          type: 'Parent' 
        })))
      ])].filter((r, idx, arr) => arr.findIndex(x => x.email === r.email) === idx && r.email);
    } else {
      // Players/parents can message coaches and other players/parents on their teams
      const teamPlayers = players.filter(p => myTeamIds.includes(p.team_id));
      const teamCoaches = coaches.filter(c => c.team_ids?.some(tid => myTeamIds.includes(tid)));
      
      recipients = [...new Set([
        ...teamCoaches.map(c => ({ email: c.email, name: c.full_name, type: 'Coach' })),
        ...teamPlayers.map(p => ({ email: p.email, name: `${p.full_name} (Parent)`, type: 'Parent' })),
        ...teamPlayers.flatMap(p => (p.parent_emails || []).map(pe => ({ 
          email: pe, 
          name: `${p.full_name} (Parent)`, 
          type: 'Parent' 
        })))
      ])].filter((r, idx, arr) => arr.findIndex(x => x.email === r.email) === idx && r.email && r.email !== user?.email);
    }

    return recipients.filter(r => 
      r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [isAdmin, isCoach, currentCoach, players, coaches, allUsers, myTeamIds, user, searchTerm]);

  const sendMessageMutation = useMutation({
    mutationFn: async (data) => {
      const message = await base44.entities.Message.create(data);
      
      await base44.entities.Notification.create({
        user_email: data.recipient_email,
        type: 'message',
        title: `New message from ${data.sender_name}`,
        message: data.content.substring(0, 200),
        priority: 'medium'
      });

      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['messages']);
      queryClient.invalidateQueries(['notifications']);
      setMessageContent('');
      setRecipientEmail('');
      setRecipientName('');
      onClose();
      toast.success('Message sent');
    }
  });

  const handleSend = () => {
    if (!recipientEmail || !messageContent.trim()) {
      toast.error('Please select recipient and enter message');
      return;
    }

    sendMessageMutation.mutate({
      sender_id: user?.id,
      sender_name: user?.full_name,
      sender_email: user?.email,
      recipient_email: recipientEmail,
      recipient_name: recipientName,
      content: messageContent,
      thread_id: `${user?.email}-${recipientEmail}`,
      read: false
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>Search Recipient</Label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="mb-2"
            />
          </div>
          <div>
            <Label>Select Recipient *</Label>
            <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-1">
              {availableRecipients.map((recipient, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setRecipientEmail(recipient.email);
                    setRecipientName(recipient.name);
                  }}
                  className={`w-full text-left p-2 rounded-lg hover:bg-slate-100 transition-colors ${
                    recipientEmail === recipient.email ? 'bg-emerald-50 border border-emerald-300' : ''
                  }`}
                >
                  <div className="font-medium text-sm">{recipient.name}</div>
                  <div className="text-xs text-slate-500">{recipient.email} • {recipient.type}</div>
                </button>
              ))}
              {availableRecipients.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No recipients found</p>
              )}
            </div>
          </div>
          <div>
            <Label>Message *</Label>
            <Textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="Type your message..."
              rows={5}
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button 
              onClick={handleSend}
              disabled={!recipientEmail || !messageContent.trim() || sendMessageMutation.isPending}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              <Send className="w-4 h-4 mr-2" />
              {sendMessageMutation.isPending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}