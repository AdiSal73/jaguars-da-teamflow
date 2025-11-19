import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Send, Reply, MessageSquare, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Messages() {
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [newMessage, setNewMessage] = useState({
    recipient_id: '',
    team_id: '',
    subject: '',
    message: '',
    send_to_type: 'player',
    is_broadcast: false
  });

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages'],
    queryFn: () => base44.entities.Message.list('-created_date')
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data) => {
      if (data.is_broadcast && data.team_id) {
        // Send to all players in the team
        const teamPlayers = players.filter(p => p.team_id === data.team_id);
        const promises = teamPlayers.map(player => 
          base44.entities.Message.create({
            ...data,
            recipient_id: player.id,
            recipient_name: player.full_name
          })
        );
        return Promise.all(promises);
      } else {
        return base44.entities.Message.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['messages']);
      setShowSendDialog(false);
      setNewMessage({
        recipient_id: '',
        team_id: '',
        subject: '',
        message: '',
        send_to_type: 'player',
        is_broadcast: false
      });
    }
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, reply }) => {
      const message = messages.find(m => m.id === id);
      const replies = [...(message.replies || []), reply];
      return base44.entities.Message.update(id, { replies });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['messages']);
      setReplyText('');
    }
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Message.update(id, { read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['messages']);
    }
  });

  const handleSendMessage = () => {
    const messageData = {
      sender_id: user.id,
      sender_name: user.full_name || user.email,
      subject: newMessage.subject,
      message: newMessage.message,
      read: false,
      replies: [],
      is_broadcast: newMessage.is_broadcast
    };

    if (newMessage.send_to_type === 'player') {
      const player = players.find(p => p.id === newMessage.recipient_id);
      messageData.recipient_id = newMessage.recipient_id;
      messageData.recipient_name = player?.full_name;
    } else if (newMessage.send_to_type === 'coach') {
      const coach = coaches.find(c => c.id === newMessage.recipient_id);
      messageData.recipient_id = newMessage.recipient_id;
      messageData.recipient_name = coach?.full_name;
    } else {
      const team = teams.find(t => t.id === newMessage.team_id);
      messageData.team_id = newMessage.team_id;
      messageData.recipient_name = `Team: ${team?.name}`;
    }

    sendMessageMutation.mutate(messageData);
  };

  const handleReply = (messageId) => {
    const reply = {
      sender_id: user.id,
      sender_name: user.full_name || user.email,
      message: replyText,
      timestamp: new Date().toISOString()
    };
    replyMutation.mutate({ id: messageId, reply });
  };

  const handleOpenMessage = (message) => {
    setSelectedConversation(message);
    if (!message.read && message.recipient_id === user.id) {
      markReadMutation.mutate(message.id);
    }
  };

  // Group messages by conversation
  const directMessages = messages.filter(m => 
    (m.recipient_id === user.id || m.sender_id === user.id) && !m.team_id
  );

  const teamMessages = messages.filter(m => {
    if (m.team_id) {
      const playerInTeam = players.find(p => p.id === user.id && p.team_id === m.team_id);
      const coachInTeam = coaches.find(c => c.email === user.email && c.team_ids?.includes(m.team_id));
      return playerInTeam || coachInTeam || user.role === 'admin';
    }
    return false;
  });

  const unreadDirect = directMessages.filter(m => !m.read && m.recipient_id === user.id).length;
  const unreadTeam = teamMessages.filter(m => !m.read && m.recipient_id === user.id).length;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Messages</h1>
          <p className="text-slate-600 mt-1">
            {unreadDirect + unreadTeam > 0 && `${unreadDirect + unreadTeam} unread messages`}
          </p>
        </div>
        <Button onClick={() => setShowSendDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          New Message
        </Button>
      </div>

      <Tabs defaultValue="direct" className="w-full">
        <TabsList>
          <TabsTrigger value="direct">
            Direct Messages {unreadDirect > 0 && <Badge className="ml-2 bg-blue-600">{unreadDirect}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="team">
            Team Messages {unreadTeam > 0 && <Badge className="ml-2 bg-blue-600">{unreadTeam}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="direct">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle>Direct Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {directMessages.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p>No messages yet</p>
                      </div>
                    ) : (
                      directMessages.map(message => (
                        <button
                          key={message.id}
                          onClick={() => handleOpenMessage(message)}
                          className={`w-full p-3 rounded-xl text-left transition-all ${
                            selectedConversation?.id === message.id
                              ? 'bg-emerald-50 border-2 border-emerald-500'
                              : message.read
                              ? 'bg-slate-50 hover:bg-slate-100'
                              : 'bg-blue-50 hover:bg-blue-100 border-2 border-blue-200'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold text-slate-900 text-sm">
                              {message.sender_id === user.id ? `To: ${message.recipient_name}` : message.sender_name}
                            </span>
                            {!message.read && message.recipient_id === user.id && (
                              <Badge className="bg-blue-600 text-white text-xs">New</Badge>
                            )}
                          </div>
                          <div className="text-sm text-slate-600 truncate">{message.subject}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            {new Date(message.created_date).toLocaleDateString()}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              {selectedConversation && !selectedConversation.team_id ? (
                <Card className="border-none shadow-lg">
                  <CardHeader className="border-b border-slate-100">
                    <CardTitle>{selectedConversation.subject}</CardTitle>
                    <div className="text-sm text-slate-600">
                      From: {selectedConversation.sender_name} • {new Date(selectedConversation.created_date).toLocaleString()}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="mb-6">
                      <p className="text-slate-700 whitespace-pre-wrap">{selectedConversation.message}</p>
                    </div>

                    {selectedConversation.replies && selectedConversation.replies.length > 0 && (
                      <div className="mb-6 space-y-3">
                        <h4 className="font-semibold text-slate-900">Replies</h4>
                        {selectedConversation.replies.map((reply, idx) => (
                          <div key={idx} className="p-4 bg-slate-50 rounded-xl">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium text-slate-900">{reply.sender_name}</span>
                              <span className="text-xs text-slate-500">
                                {new Date(reply.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-slate-700">{reply.message}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="border-t border-slate-200 pt-4">
                      <Label>Reply</Label>
                      <Textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply..."
                        className="mt-2"
                      />
                      <Button
                        onClick={() => handleReply(selectedConversation.id)}
                        disabled={!replyText}
                        className="mt-3 bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Reply className="w-4 h-4 mr-2" />
                        Send Reply
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-none shadow-lg">
                  <CardContent className="p-12 text-center">
                    <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Select a Message</h3>
                    <p className="text-slate-600">Choose a message to view</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="team">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Team Messages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {teamMessages.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p>No team messages</p>
                      </div>
                    ) : (
                      teamMessages.map(message => (
                        <button
                          key={message.id}
                          onClick={() => handleOpenMessage(message)}
                          className={`w-full p-3 rounded-xl text-left transition-all ${
                            selectedConversation?.id === message.id
                              ? 'bg-emerald-50 border-2 border-emerald-500'
                              : message.read
                              ? 'bg-slate-50 hover:bg-slate-100'
                              : 'bg-blue-50 hover:bg-blue-100 border-2 border-blue-200'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold text-slate-900 text-sm">
                              {message.recipient_name}
                            </span>
                            {!message.read && message.recipient_id === user.id && (
                              <Badge className="bg-blue-600 text-white text-xs">New</Badge>
                            )}
                          </div>
                          <div className="text-sm text-slate-600 truncate">{message.subject}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            From: {message.sender_name}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              {selectedConversation && selectedConversation.team_id ? (
                <Card className="border-none shadow-lg">
                  <CardHeader className="border-b border-slate-100">
                    <CardTitle>{selectedConversation.subject}</CardTitle>
                    <div className="text-sm text-slate-600">
                      From: {selectedConversation.sender_name} • To: {selectedConversation.recipient_name}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="mb-6">
                      <p className="text-slate-700 whitespace-pre-wrap">{selectedConversation.message}</p>
                    </div>

                    {selectedConversation.replies && selectedConversation.replies.length > 0 && (
                      <div className="mb-6 space-y-3">
                        <h4 className="font-semibold text-slate-900">Discussion</h4>
                        {selectedConversation.replies.map((reply, idx) => (
                          <div key={idx} className="p-4 bg-slate-50 rounded-xl">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium text-slate-900">{reply.sender_name}</span>
                              <span className="text-xs text-slate-500">
                                {new Date(reply.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-slate-700">{reply.message}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="border-t border-slate-200 pt-4">
                      <Label>Reply to Team</Label>
                      <Textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply..."
                        className="mt-2"
                      />
                      <Button
                        onClick={() => handleReply(selectedConversation.id)}
                        disabled={!replyText}
                        className="mt-3 bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Reply className="w-4 h-4 mr-2" />
                        Send Reply
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-none shadow-lg">
                  <CardContent className="p-12 text-center">
                    <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Select a Team Message</h3>
                    <p className="text-slate-600">Choose a team message to view</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <div className="w-2 h-8 bg-gradient-to-b from-emerald-500 to-blue-500 rounded-full" />
              Send New Message
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Send To</Label>
              <Select value={newMessage.send_to_type} onValueChange={(value) => setNewMessage({...newMessage, send_to_type: value, recipient_id: '', team_id: '', is_broadcast: false})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="player">Individual Player</SelectItem>
                  <SelectItem value="coach">Individual Coach</SelectItem>
                  <SelectItem value="team">Team (Group Chat)</SelectItem>
                  <SelectItem value="broadcast">Broadcast to Team</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newMessage.send_to_type === 'player' && (
              <div>
                <Label>Select Player</Label>
                <Select value={newMessage.recipient_id} onValueChange={(value) => setNewMessage({...newMessage, recipient_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose player" />
                  </SelectTrigger>
                  <SelectContent>
                    {players.map(player => (
                      <SelectItem key={player.id} value={player.id}>{player.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {newMessage.send_to_type === 'coach' && (
              <div>
                <Label>Select Coach</Label>
                <Select value={newMessage.recipient_id} onValueChange={(value) => setNewMessage({...newMessage, recipient_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose coach" />
                  </SelectTrigger>
                  <SelectContent>
                    {coaches.map(coach => (
                      <SelectItem key={coach.id} value={coach.id}>{coach.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(newMessage.send_to_type === 'team' || newMessage.send_to_type === 'broadcast') && (
              <div>
                <Label>Select Team</Label>
                <Select value={newMessage.team_id} onValueChange={(value) => {
                  setNewMessage({
                    ...newMessage, 
                    team_id: value, 
                    is_broadcast: newMessage.send_to_type === 'broadcast'
                  });
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {newMessage.send_to_type === 'broadcast' && (
                  <p className="text-xs text-slate-600 mt-2">
                    This will send individual messages to all players in the team
                  </p>
                )}
              </div>
            )}

            <div>
              <Label>Subject</Label>
              <Input
                value={newMessage.subject}
                onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                placeholder="Message subject"
              />
            </div>

            <div>
              <Label>Message</Label>
              <Textarea
                value={newMessage.message}
                onChange={(e) => setNewMessage({...newMessage, message: e.target.value})}
                placeholder="Type your message..."
                rows={6}
              />
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
            <Button variant="outline" onClick={() => setShowSendDialog(false)} className="h-12 px-8">Cancel</Button>
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.subject || !newMessage.message || (!newMessage.recipient_id && !newMessage.team_id)}
              className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 h-12 px-8 text-base font-semibold shadow-lg"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Message
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}