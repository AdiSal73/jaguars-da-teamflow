import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Megaphone, Plus, Pin, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function TeamCommunication() {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [announcementForm, setAnnouncementForm] = useState({
    team_id: '',
    title: '',
    message: '',
    priority: 'medium',
    pinned: false
  });

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => base44.entities.TeamAnnouncement.list('-created_date')
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: (data) => base44.entities.TeamAnnouncement.create({
      ...data,
      created_by: user?.email || ''
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements']);
      setShowDialog(false);
      setAnnouncementForm({
        team_id: '',
        title: '',
        message: '',
        priority: 'medium',
        pinned: false
      });
    }
  });

  const togglePinMutation = useMutation({
    mutationFn: ({ id, pinned }) => base44.entities.TeamAnnouncement.update(id, { pinned }),
    onSuccess: () => queryClient.invalidateQueries(['announcements'])
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: (id) => base44.entities.TeamAnnouncement.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['announcements'])
  });

  const filteredAnnouncements = selectedTeam === 'all' 
    ? announcements 
    : announcements.filter(a => a.team_id === selectedTeam);

  const pinnedAnnouncements = filteredAnnouncements.filter(a => a.pinned);
  const regularAnnouncements = filteredAnnouncements.filter(a => !a.pinned);

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Team Communication</h1>
          <p className="text-slate-600 mt-1">Announcements and updates for your teams</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          New Announcement
        </Button>
      </div>

      <Card className="border-none shadow-lg mb-6">
        <CardContent className="p-6">
          <Label>Filter by Team</Label>
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map(team => (
                <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {pinnedAnnouncements.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">📌 Pinned Announcements</h2>
          <div className="space-y-4">
            {pinnedAnnouncements.map(announcement => {
              const team = teams.find(t => t.id === announcement.team_id);
              return (
                <Card key={announcement.id} className="border-2 border-emerald-200 shadow-lg">
                  <CardHeader className="bg-emerald-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={priorityColors[announcement.priority]}>
                            {announcement.priority}
                          </Badge>
                          <Badge variant="outline">{team?.name}</Badge>
                        </div>
                        <CardTitle className="text-xl">{announcement.title}</CardTitle>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => togglePinMutation.mutate({ id: announcement.id, pinned: false })}
                        >
                          <Pin className="w-4 h-4 text-emerald-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (window.confirm('Delete this announcement?')) {
                              deleteAnnouncementMutation.mutate(announcement.id);
                            }
                          }}
                          className="hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="text-slate-700 whitespace-pre-wrap">{announcement.message}</p>
                    <div className="text-xs text-slate-500 mt-4">
                      Posted by {announcement.created_by} • {new Date(announcement.created_date).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Announcements</h2>
      <div className="space-y-4">
        {regularAnnouncements.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Megaphone className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No announcements yet</p>
            </CardContent>
          </Card>
        ) : (
          regularAnnouncements.map(announcement => {
            const team = teams.find(t => t.id === announcement.team_id);
            return (
              <Card key={announcement.id} className="border-none shadow-lg">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={priorityColors[announcement.priority]}>
                          {announcement.priority}
                        </Badge>
                        <Badge variant="outline">{team?.name}</Badge>
                      </div>
                      <CardTitle>{announcement.title}</CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => togglePinMutation.mutate({ id: announcement.id, pinned: true })}
                      >
                        <Pin className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (window.confirm('Delete this announcement?')) {
                            deleteAnnouncementMutation.mutate(announcement.id);
                          }
                        }}
                        className="hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 whitespace-pre-wrap">{announcement.message}</p>
                  <div className="text-xs text-slate-500 mt-4">
                    Posted by {announcement.created_by} • {new Date(announcement.created_date).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Team *</Label>
              <Select value={announcementForm.team_id} onValueChange={(value) => setAnnouncementForm({...announcementForm, team_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Title *</Label>
              <Input value={announcementForm.title} onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})} />
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={announcementForm.priority} onValueChange={(value) => setAnnouncementForm({...announcementForm, priority: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Message *</Label>
              <Textarea 
                value={announcementForm.message} 
                onChange={(e) => setAnnouncementForm({...announcementForm, message: e.target.value})}
                rows={6}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button 
              onClick={() => createAnnouncementMutation.mutate(announcementForm)}
              disabled={!announcementForm.team_id || !announcementForm.title || !announcementForm.message}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Post Announcement
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}