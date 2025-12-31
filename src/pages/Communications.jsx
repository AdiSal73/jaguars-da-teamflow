import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MessageSquare, Send, Bell, Megaphone, Search, Plus, Clock, User, Filter, CheckCheck, Check, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import NewMessageDialog from '../components/messaging/NewMessageDialog';

export default function Communications() {
  const queryClient = useQueryClient();
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedThread, setSelectedThread] = useState(null);
  const [messageContent, setMessageContent] = useState('');
  const [messageSearchTerm, setMessageSearchTerm] = useState('');
  const [messageDateFilter, setMessageDateFilter] = useState('all');
  const [messageSenderFilter, setMessageSenderFilter] = useState('all');
  const [showAnnouncementConfirm, setShowAnnouncementConfirm] = useState(false);
  const [announcementRecipients, setAnnouncementRecipients] = useState([]);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    target_type: 'team',
    target_team_ids: [],
    priority: 'normal'
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

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

  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => base44.entities.Announcement.list('-created_date')
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages'],
    queryFn: () => base44.entities.Message.list('-created_date')
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Notification.filter({ user_email: user?.email }, '-created_date'),
    enabled: !!user
  });

  const currentCoach = coaches.find(c => c.email === user?.email);
  const isCoach = !!currentCoach;
  const isAdmin = user?.role === 'admin';

  const createAnnouncementMutation = useMutation({
    mutationFn: async (data) => {
      const announcement = await base44.entities.Announcement.create(data);
      
      let targetEmails = [];
      if (data.target_type === 'team' && data.target_team_ids?.length > 0) {
        const targetPlayers = players.filter(p => data.target_team_ids.includes(p.team_id));
        targetEmails = [...new Set([
          ...targetPlayers.map(p => p.email),
          ...targetPlayers.flatMap(p => p.parent_emails || [])
        ])].filter(Boolean);
      } else if (data.target_type === 'all') {
        targetEmails = [...new Set([
          ...players.map(p => p.email),
          ...players.flatMap(p => p.parent_emails || []),
          ...coaches.map(c => c.email)
        ])].filter(Boolean);
      } else if (data.target_type === 'coaches') {
        targetEmails = coaches.map(c => c.email).filter(Boolean);
      } else if (data.target_type === 'players') {
        targetEmails = [...new Set([
          ...players.map(p => p.email),
          ...players.flatMap(p => p.parent_emails || [])
        ])].filter(Boolean);
      }

      for (const email of targetEmails) {
        await base44.entities.Notification.create({
          user_email: email,
          type: 'announcement',
          title: data.title,
          message: data.content.substring(0, 200),
          priority: data.priority
        });
      }

      try {
        await base44.functions.invoke('sendEmail', {
          to: targetEmails,
          subject: `[Announcement] ${data.title}`,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">${data.title}</h2>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; white-space: pre-wrap; line-height: 1.6;">
              ${data.content}
            </div>
            <p style="color: #6b7280; font-size: 12px;">From: ${data.author_name}</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;"/>
            <p style="color: #6b7280; font-size: 12px;">Michigan Jaguars Player Development System</p>
          </div>`,
          text: `${data.title}\n\n${data.content}\n\nFrom: ${data.author_name}`
        });
      } catch (error) {
        console.error('Email send error:', error);
      }

      return announcement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements']);
      queryClient.invalidateQueries(['notifications']);
      setShowAnnouncementDialog(false);
      setAnnouncementForm({ title: '', content: '', target_type: 'team', target_team_ids: [], priority: 'normal' });
      toast.success('Announcement sent with email notifications');
    }
  });

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

      try {
        await base44.functions.invoke('sendEmail', {
          to: data.recipient_email,
          subject: `New message from ${data.sender_name}`,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">New Message</h2>
            <p>You have a new message from <strong>${data.sender_name}</strong>:</p>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; white-space: pre-wrap;">
              ${data.content}
            </div>
            <p style="color: #6b7280; font-size: 14px;">Reply via the Michigan Jaguars app.</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;"/>
            <p style="color: #6b7280; font-size: 12px;">Michigan Jaguars Player Development System</p>
          </div>`,
          text: `You have a new message from ${data.sender_name}:\n\n${data.content}\n\nReply via the app.`
        });
      } catch (error) {
        console.error('Email send error:', error);
      }

      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['messages']);
      queryClient.invalidateQueries(['notifications']);
      setMessageContent('');
      toast.success('Message sent');
    }
  });

  const markMessageReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Message.update(id, { read: true }),
    onSuccess: () => queryClient.invalidateQueries(['messages'])
  });

  const markNotificationReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { read: true }),
    onSuccess: () => queryClient.invalidateQueries(['notifications'])
  });

  const myMessages = useMemo(() => {
    return messages.filter(m => 
      m.sender_email === user?.email || m.recipient_email === user?.email
    );
  }, [messages, user]);

  const messageThreads = useMemo(() => {
    const threads = {};
    myMessages.forEach(msg => {
      const otherEmail = msg.sender_email === user?.email ? msg.recipient_email : msg.sender_email;
      if (!threads[otherEmail]) {
        threads[otherEmail] = {
          email: otherEmail,
          name: msg.sender_email === user?.email ? msg.recipient_name : msg.sender_name,
          messages: [],
          lastMessage: null,
          unreadCount: 0
        };
      }
      threads[otherEmail].messages.push(msg);
      if (!threads[otherEmail].lastMessage || new Date(msg.created_date) > new Date(threads[otherEmail].lastMessage.created_date)) {
        threads[otherEmail].lastMessage = msg;
      }
      if (msg.recipient_email === user?.email && !msg.read) {
        threads[otherEmail].unreadCount++;
      }
    });
    
    // Apply filters
    let filteredThreads = Object.values(threads);
    
    if (messageSenderFilter !== 'all') {
      filteredThreads = filteredThreads.filter(t => t.email === messageSenderFilter);
    }
    
    if (messageDateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      if (messageDateFilter === 'today') {
        filterDate.setHours(0, 0, 0, 0);
      } else if (messageDateFilter === 'week') {
        filterDate.setDate(now.getDate() - 7);
      } else if (messageDateFilter === 'month') {
        filterDate.setMonth(now.getMonth() - 1);
      }
      filteredThreads = filteredThreads.filter(t => 
        new Date(t.lastMessage.created_date) >= filterDate
      );
    }
    
    return filteredThreads.sort((a, b) => 
      new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date)
    );
  }, [myMessages, user, messageSenderFilter, messageDateFilter]);

  // Get unique senders for filter
  const uniqueSenders = useMemo(() => {
    const senders = new Map();
    myMessages.forEach(msg => {
      const otherEmail = msg.sender_email === user?.email ? msg.recipient_email : msg.sender_email;
      const otherName = msg.sender_email === user?.email ? msg.recipient_name : msg.sender_name;
      if (!senders.has(otherEmail)) {
        senders.set(otherEmail, otherName);
      }
    });
    return Array.from(senders.entries());
  }, [myMessages, user]);

  const relevantAnnouncements = useMemo(() => {
    return announcements.filter(a => {
      if (isAdmin) return true;
      if (a.target_type === 'all') return true;
      if (isCoach) {
        const coachTeamIds = currentCoach?.team_ids || [];
        return a.target_team_ids?.some(tid => coachTeamIds.includes(tid));
      }
      const myPlayer = players.find(p => p.email === user?.email);
      if (myPlayer && a.target_team_ids?.includes(myPlayer.team_id)) return true;
      if (user?.player_ids) {
        return players.some(p => 
          user.player_ids.includes(p.id) && a.target_team_ids?.includes(p.team_id)
        );
      }
      return false;
    });
  }, [announcements, isAdmin, isCoach, currentCoach, players, user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSendMessage = (recipientEmail, recipientName) => {
    if (!messageContent.trim()) return;
    
    sendMessageMutation.mutate({
      sender_id: user?.id,
      sender_name: user?.full_name,
      sender_email: user?.email,
      recipient_id: null,
      recipient_email: recipientEmail,
      recipient_name: recipientName,
      content: messageContent,
      subject: '',
      thread_id: `${user?.email}-${recipientEmail}`,
      read: false
    });
  };

  // Mark messages as read when thread is opened
  React.useEffect(() => {
    if (selectedThread) {
      const unreadMessages = selectedThread.messages.filter(m => 
        m.recipient_email === user?.email && !m.read
      );
      unreadMessages.forEach(msg => {
        markMessageReadMutation.mutate(msg.id);
      });
    }
  }, [selectedThread?.email]);

  const handlePrepareAnnouncement = () => {
    if (!announcementForm.title || !announcementForm.content) {
      toast.error('Please fill in title and content');
      return;
    }

    let recipients = [];
    if (announcementForm.target_type === 'all') {
      recipients = ['All users'];
    } else if (announcementForm.target_type === 'team' && announcementForm.target_team_ids.length > 0) {
      recipients = announcementForm.target_team_ids.map(tid => {
        const team = teams.find(t => t.id === tid);
        return team?.name || 'Unknown Team';
      });
    } else if (announcementForm.target_type === 'players') {
      recipients = ['All players & parents'];
    } else if (announcementForm.target_type === 'coaches') {
      recipients = ['All coaches'];
    }

    setAnnouncementRecipients(recipients);
    createAnnouncementMutation.mutate({
      ...announcementForm,
      author_name: user?.full_name,
      author_email: user?.email
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            Communications Hub
          </h1>
          <p className="text-slate-600 mt-1">Stay connected with your team</p>
        </div>
        {(isCoach || isAdmin) && (
          <Button onClick={() => setShowAnnouncementDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Megaphone className="w-4 h-4 mr-2" />
            New Announcement
          </Button>
        )}
      </div>

      <Tabs defaultValue="messages" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="announcements" className="flex items-center gap-2">
            <Megaphone className="w-4 h-4" />
            Announcements
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2 relative">
            <Bell className="w-4 h-4" />
            Notifications
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] h-5 w-5 flex items-center justify-center rounded-full">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Threads List */}
            <Card className="lg:col-span-1 border-none shadow-xl">
              <CardHeader className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Conversations
                  </CardTitle>
                  <Button size="sm" onClick={() => setShowNewMessageDialog(true)} className="bg-white/20 hover:bg-white/30 text-white h-7 border-0">
                    <Plus className="w-3 h-3 mr-1" />
                    New
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Message Filters */}
                <div className="p-3 border-b bg-slate-50 space-y-2">
                  <Input
                    placeholder="Search conversations..."
                    value={messageSearchTerm}
                    onChange={(e) => setMessageSearchTerm(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={messageSenderFilter} onValueChange={setMessageSenderFilter}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="All contacts" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All contacts</SelectItem>
                        {uniqueSenders.map(([email, name]) => (
                          <SelectItem key={email} value={email}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={messageDateFilter} onValueChange={setMessageDateFilter}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This week</SelectItem>
                        <SelectItem value="month">This month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="divide-y max-h-[600px] overflow-y-auto">
                  {messageThreads
                    .filter(thread => 
                      !messageSearchTerm || 
                      thread.name?.toLowerCase().includes(messageSearchTerm.toLowerCase()) ||
                      thread.email?.toLowerCase().includes(messageSearchTerm.toLowerCase())
                    )
                    .map(thread => (
                    <button
                      key={thread.email}
                      onClick={() => setSelectedThread(thread)}
                      className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                        selectedThread?.email === thread.email ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                              {thread.name?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm truncate">{thread.name}</div>
                              <div className="text-xs text-slate-500 truncate flex items-center gap-1">
                                {thread.lastMessage.sender_email === user?.email && (
                                  thread.lastMessage.read ? 
                                    <CheckCheck className="w-3 h-3 text-blue-500" /> : 
                                    <Check className="w-3 h-3 text-slate-400" />
                                )}
                                {thread.lastMessage?.content}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {format(new Date(thread.lastMessage.created_date), 'MMM d, h:mm a')}
                              </div>
                            </div>
                          </div>
                        </div>
                        {thread.unreadCount > 0 && (
                          <Badge className="bg-emerald-500 text-white text-[10px]">
                            {thread.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                  {messageThreads.length === 0 && (
                    <div className="p-8 text-center text-slate-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No conversations yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Message Thread */}
            <Card className="lg:col-span-2 border-none shadow-xl">
              {selectedThread ? (
                <>
                  <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 border-b">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {selectedThread.name?.charAt(0)}
                      </div>
                      <div>
                        <div>{selectedThread.name}</div>
                        <div className="text-xs text-slate-500 font-normal">{selectedThread.email}</div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    {/* Message History */}
                    <div className="space-y-4 mb-4 max-h-[450px] overflow-y-auto pr-2">
                      {selectedThread.messages
                        .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
                        .map(msg => {
                        const isSent = msg.sender_email === user?.email;
                        return (
                          <div key={msg.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] ${isSent ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                              <div className={`p-3 rounded-2xl ${
                                isSent 
                                  ? 'bg-emerald-500 text-white rounded-br-sm' 
                                  : 'bg-slate-100 text-slate-900 rounded-bl-sm'
                              }`}>
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                              </div>
                              <div className="flex items-center gap-1 px-2">
                                <p className={`text-[10px] ${isSent ? 'text-emerald-600' : 'text-slate-500'}`}>
                                  {format(new Date(msg.created_date), 'MMM d, h:mm a')}
                                </p>
                                {isSent && (
                                  msg.read ? 
                                    <CheckCheck className="w-3 h-3 text-blue-500" title="Read" /> : 
                                    <Check className="w-3 h-3 text-slate-400" title="Sent" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Message Input */}
                    <div className="flex gap-2 border-t pt-4">
                      <Textarea
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        placeholder="Type your message..."
                        rows={2}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (messageContent.trim()) {
                              handleSendMessage(selectedThread.email, selectedThread.name);
                            }
                          }
                        }}
                        className="resize-none"
                      />
                      <Button 
                        onClick={() => handleSendMessage(selectedThread.email, selectedThread.name)}
                        disabled={!messageContent.trim() || sendMessageMutation.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700 self-end"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="p-12 text-center">
                  <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 mb-4">Select a conversation to start messaging</p>
                  <Button onClick={() => setShowNewMessageDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Start New Conversation
                  </Button>
                </CardContent>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4">
          {relevantAnnouncements.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Megaphone className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No announcements yet</p>
              </CardContent>
            </Card>
          ) : (
            relevantAnnouncements.map(announcement => (
              <Card key={announcement.id} className={`border-l-4 ${
                announcement.priority === 'urgent' ? 'border-l-red-500 bg-red-50/50' :
                announcement.priority === 'high' ? 'border-l-orange-500 bg-orange-50/50' :
                'border-l-emerald-500'
              }`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {announcement.title}
                        {announcement.priority !== 'normal' && (
                          <Badge className={`text-xs ${
                            announcement.priority === 'urgent' ? 'bg-red-500' :
                            'bg-orange-500'
                          }`}>
                            {announcement.priority}
                          </Badge>
                        )}
                        {announcement.pinned && (
                          <Badge className="bg-blue-500 text-xs">Pinned</Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-3 mt-2 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {announcement.author_name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(announcement.created_date), 'MMM d, h:mm a')}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 whitespace-pre-wrap">{announcement.content}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="notifications" className="space-y-3">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No notifications</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map(notification => (
              <Card 
                key={notification.id} 
                className={`${notification.read ? 'bg-slate-50' : 'bg-white border-l-4 border-l-emerald-500 shadow-md'} cursor-pointer hover:shadow-lg transition-shadow`}
                onClick={() => !notification.read && markNotificationReadMutation.mutate(notification.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Bell className={`w-4 h-4 ${notification.read ? 'text-slate-400' : 'text-emerald-600'}`} />
                        <span className={`font-semibold text-sm ${notification.read ? 'text-slate-600' : 'text-slate-900'}`}>
                          {notification.title}
                        </span>
                        {notification.priority === 'high' && (
                          <Badge className="bg-red-500 text-white text-[10px]">Important</Badge>
                        )}
                      </div>
                      <p className={`text-sm ml-6 ${notification.read ? 'text-slate-500' : 'text-slate-700'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-slate-400 ml-6 mt-1">
                        {format(new Date(notification.created_date), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Announcement Dialog */}
      <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={announcementForm.title}
                onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                placeholder="Announcement title"
              />
            </div>
            <div>
              <Label>Message *</Label>
              <Textarea
                value={announcementForm.content}
                onChange={(e) => setAnnouncementForm({...announcementForm, content: e.target.value})}
                placeholder="Write your announcement..."
                rows={5}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Target</Label>
                <Select
                  value={announcementForm.target_type}
                  onValueChange={(v) => setAnnouncementForm({...announcementForm, target_type: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Everyone</SelectItem>
                    <SelectItem value="team">Specific Teams</SelectItem>
                    <SelectItem value="coaches">All Coaches</SelectItem>
                    <SelectItem value="players">All Players</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select
                  value={announcementForm.priority}
                  onValueChange={(v) => setAnnouncementForm({...announcementForm, priority: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {announcementForm.target_type === 'team' && (
              <div>
                <Label>Select Teams</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {(isAdmin ? teams : teams.filter(t => currentCoach?.team_ids?.includes(t.id)))
                    .filter(team => team.name && typeof team.name === 'string')
                    .map(team => (
                    <label key={team.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={announcementForm.target_team_ids.includes(team.id)}
                        onChange={(e) => {
                          const newIds = e.target.checked
                            ? [...announcementForm.target_team_ids, team.id]
                            : announcementForm.target_team_ids.filter(id => id !== team.id);
                          setAnnouncementForm({...announcementForm, target_team_ids: newIds});
                        }}
                        className="rounded"
                      />
                      {team.name}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowAnnouncementDialog(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handlePrepareAnnouncement}
              disabled={!announcementForm.title || !announcementForm.content || createAnnouncementMutation.isPending}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              <Send className="w-4 h-4 mr-2" />
              {createAnnouncementMutation.isPending ? 'Sending...' : 'Send Announcement'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <NewMessageDialog 
        open={showNewMessageDialog}
        onClose={() => setShowNewMessageDialog(false)}
        user={user}
      />
    </div>
  );
}