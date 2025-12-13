import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Send, Plus, Search, User, Clock, Mail, Megaphone, Users } from 'lucide-react';
import TeamAnnouncementDialog from '../components/messaging/TeamAnnouncementDialog';

export default function Messages() {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const [selectedThread, setSelectedThread] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessageForm, setNewMessageForm] = useState({
    recipient_id: '',
    subject: '',
    content: ''
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages'],
    queryFn: () => base44.entities.Message.list('-created_date')
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const isAdminOrCoach = user?.role === 'admin' || coaches.some(c => c.email === user?.email);

  const sendMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.Message.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['messages']);
      setNewMessage('');
    }
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: async (announcementData) => {
      // Create announcement
      const announcement = await base44.entities.Announcement.create(announcementData);
      
      // Send notifications to all targets
      const notifications = [];
      const targetEmails = new Set();
      
      if (announcementData.target_type === 'all') {
        users.forEach(u => targetEmails.add(u.email));
      } else if (announcementData.target_type === 'team' && announcementData.target_team_ids) {
        players.filter(p => announcementData.target_team_ids.includes(p.team_id))
          .forEach(p => { if (p.email) targetEmails.add(p.email); });
      } else if (announcementData.target_type === 'players' && announcementData.target_player_ids) {
        players.filter(p => announcementData.target_player_ids.includes(p.id))
          .forEach(p => { if (p.email) targetEmails.add(p.email); });
      } else if (announcementData.target_type === 'coaches') {
        coaches.forEach(c => { if (c.email) targetEmails.add(c.email); });
      } else if (announcementData.target_type === 'parents') {
        users.filter(u => u.role === 'parent').forEach(u => targetEmails.add(u.email));
      }
      
      // Create notifications
      for (const email of targetEmails) {
        notifications.push(base44.entities.Notification.create({
          user_email: email,
          type: 'announcement',
          title: announcementData.title,
          message: announcementData.content,
          priority: announcementData.priority === 'urgent' ? 'high' : 'medium'
        }));
      }
      
      await Promise.all(notifications);
      return announcement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements']);
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Message.update(id, { read: true }),
    onSuccess: () => queryClient.invalidateQueries(['messages'])
  });

  // Group messages into threads
  const threads = useMemo(() => {
    const userMessages = messages.filter(m => 
      m.sender_id === user?.id || m.recipient_id === user?.id ||
      m.sender_email === user?.email || m.recipient_email === user?.email
    );

    const threadMap = new Map();
    userMessages.forEach(msg => {
      const threadId = msg.thread_id || msg.id;
      if (!threadMap.has(threadId)) {
        threadMap.set(threadId, []);
      }
      threadMap.get(threadId).push(msg);
    });

    return Array.from(threadMap.entries()).map(([threadId, msgs]) => {
      const sorted = msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      const lastMessage = sorted[sorted.length - 1];
      const otherParty = lastMessage.sender_email === user?.email 
        ? { name: lastMessage.recipient_name, email: lastMessage.recipient_email }
        : { name: lastMessage.sender_name, email: lastMessage.sender_email };
      
      const unreadCount = msgs.filter(m => 
        !m.read && m.recipient_email === user?.email
      ).length;

      return {
        id: threadId,
        messages: sorted,
        lastMessage,
        otherParty,
        unreadCount,
        subject: sorted[0].subject || 'No Subject'
      };
    }).sort((a, b) => new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date));
  }, [messages, user]);

  const filteredThreads = threads.filter(thread => 
    thread.otherParty.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    thread.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedThreadData = threads.find(t => t.id === selectedThread);

  useEffect(() => {
    if (selectedThreadData) {
      selectedThreadData.messages.forEach(msg => {
        if (!msg.read && msg.recipient_email === user?.email) {
          markAsReadMutation.mutate(msg.id);
        }
      });
    }
  }, [selectedThread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedThreadData?.messages]);

  const handleSendReply = () => {
    if (!newMessage.trim() || !selectedThreadData) return;
    
    const lastMsg = selectedThreadData.lastMessage;
    const recipient = lastMsg.sender_email === user?.email 
      ? { id: lastMsg.recipient_id, name: lastMsg.recipient_name, email: lastMsg.recipient_email }
      : { id: lastMsg.sender_id, name: lastMsg.sender_name, email: lastMsg.sender_email };

    sendMessageMutation.mutate({
      sender_id: user.id,
      sender_name: user.full_name,
      sender_email: user.email,
      recipient_id: recipient.id,
      recipient_name: recipient.name,
      recipient_email: recipient.email,
      subject: `Re: ${selectedThreadData.subject}`,
      content: newMessage,
      thread_id: selectedThread
    });
  };

  const handleSendNewMessage = () => {
    const recipient = users.find(u => u.id === newMessageForm.recipient_id);
    if (!recipient || !newMessageForm.content.trim()) return;

    sendMessageMutation.mutate({
      sender_id: user.id,
      sender_name: user.full_name,
      sender_email: user.email,
      recipient_id: recipient.id,
      recipient_name: recipient.full_name,
      recipient_email: recipient.email,
      subject: newMessageForm.subject || 'No Subject',
      content: newMessageForm.content
    });

    setShowNewMessageDialog(false);
    setNewMessageForm({ recipient_id: '', subject: '', content: '' });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 86400000) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    if (diff < 604800000) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-emerald-600" />
            Messages
          </h1>
          <p className="text-slate-600 mt-1">Communicate with coaches and parents</p>
        </div>
        <div className="flex gap-2">
          {isAdminOrCoach && (
            <Button onClick={() => setShowAnnouncementDialog(true)} variant="outline">
              <Megaphone className="w-4 h-4 mr-2" />
              Announcement
            </Button>
          )}
          <Button onClick={() => setShowNewMessageDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            New Message
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
        {/* Thread List */}
        <Card className="border-none shadow-lg">
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-340px)]">
              {filteredThreads.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Mail className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>No messages yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredThreads.map(thread => (
                    <button
                      key={thread.id}
                      onClick={() => setSelectedThread(thread.id)}
                      className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                        selectedThread === thread.id ? 'bg-emerald-50 border-l-4 border-emerald-500' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                          {thread.otherParty.name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-900 truncate">{thread.otherParty.name}</span>
                            <span className="text-xs text-slate-500">{formatDate(thread.lastMessage.created_date)}</span>
                          </div>
                          <p className="text-sm text-slate-600 truncate">{thread.subject}</p>
                          <p className="text-xs text-slate-400 truncate">{thread.lastMessage.content}</p>
                        </div>
                        {thread.unreadCount > 0 && (
                          <Badge className="bg-emerald-500">{thread.unreadCount}</Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Message View */}
        <Card className="md:col-span-2 border-none shadow-lg flex flex-col">
          {!selectedThreadData ? (
            <CardContent className="flex-1 flex items-center justify-center text-slate-500">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p>Select a conversation to view messages</p>
              </div>
            </CardContent>
          ) : (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                    {selectedThreadData.otherParty.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{selectedThreadData.otherParty.name}</h3>
                    <p className="text-sm text-slate-500">{selectedThreadData.subject}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {selectedThreadData.messages.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_email === user?.email ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] rounded-lg p-3 ${
                          msg.sender_email === user?.email 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-slate-100 text-slate-900'
                        }`}>
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${
                            msg.sender_email === user?.email ? 'text-emerald-100' : 'text-slate-400'
                          }`}>
                            {formatDate(msg.created_date)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
                      className="flex-1"
                    />
                    <Button onClick={handleSendReply} className="bg-emerald-600 hover:bg-emerald-700">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>

      {/* New Message Dialog */}
      <Dialog open={showNewMessageDialog} onOpenChange={setShowNewMessageDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">To</label>
              <Select value={newMessageForm.recipient_id} onValueChange={(v) => setNewMessageForm({...newMessageForm, recipient_id: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  {users.filter(u => u.id !== user?.id).map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.full_name} ({u.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Subject</label>
              <Input
                value={newMessageForm.subject}
                onChange={(e) => setNewMessageForm({...newMessageForm, subject: e.target.value})}
                placeholder="Message subject"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Message</label>
              <Textarea
                value={newMessageForm.content}
                onChange={(e) => setNewMessageForm({...newMessageForm, content: e.target.value})}
                placeholder="Type your message..."
                rows={4}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowNewMessageDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleSendNewMessage} 
                disabled={!newMessageForm.recipient_id || !newMessageForm.content.trim()}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <TeamAnnouncementDialog
        open={showAnnouncementDialog}
        onClose={() => setShowAnnouncementDialog(false)}
        teams={teams}
        players={players}
        currentUser={user}
        onSend={(data) => createAnnouncementMutation.mutate(data)}
      />
    </div>
  );
}