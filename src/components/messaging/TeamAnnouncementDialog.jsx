import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Megaphone } from 'lucide-react';

export default function TeamAnnouncementDialog({ 
  open, 
  onClose, 
  teams = [],
  players = [],
  onSend,
  currentUser
}) {
  const [form, setForm] = useState({
    title: '',
    content: '',
    target_type: 'all',
    target_team_ids: [],
    target_player_ids: [],
    priority: 'normal'
  });

  const handleSend = () => {
    onSend({
      ...form,
      author_name: currentUser?.full_name,
      author_email: currentUser?.email
    });
    setForm({
      title: '',
      content: '',
      target_type: 'all',
      target_team_ids: [],
      target_player_ids: [],
      priority: 'normal'
    });
    onClose();
  };

  const toggleTeam = (teamId) => {
    if (form.target_team_ids.includes(teamId)) {
      setForm({...form, target_team_ids: form.target_team_ids.filter(id => id !== teamId)});
    } else {
      setForm({...form, target_team_ids: [...form.target_team_ids, teamId]});
    }
  };

  const togglePlayer = (playerId) => {
    if (form.target_player_ids.includes(playerId)) {
      setForm({...form, target_player_ids: form.target_player_ids.filter(id => id !== playerId)});
    } else {
      setForm({...form, target_player_ids: [...form.target_player_ids, playerId]});
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-emerald-600" />
            Create Announcement
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label>Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({...form, title: e.target.value})}
              placeholder="Announcement title"
            />
          </div>

          <div>
            <Label>Message *</Label>
            <Textarea
              value={form.content}
              onChange={(e) => setForm({...form, content: e.target.value})}
              placeholder="Type your announcement..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Target Audience</Label>
              <Select value={form.target_type} onValueChange={(v) => setForm({...form, target_type: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone</SelectItem>
                  <SelectItem value="team">Specific Teams</SelectItem>
                  <SelectItem value="players">Specific Players</SelectItem>
                  <SelectItem value="coaches">All Coaches</SelectItem>
                  <SelectItem value="parents">All Parents</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({...form, priority: v})}>
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

          {form.target_type === 'team' && (
            <div>
              <Label>Select Teams</Label>
              <ScrollArea className="h-40 border rounded-lg p-2">
                {teams.map(team => (
                  <div key={team.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded">
                    <Checkbox
                      checked={form.target_team_ids.includes(team.id)}
                      onCheckedChange={() => toggleTeam(team.id)}
                    />
                    <span className="text-sm">{team.name}</span>
                  </div>
                ))}
              </ScrollArea>
              <Badge className="mt-2">{form.target_team_ids.length} teams selected</Badge>
            </div>
          )}

          {form.target_type === 'players' && (
            <div>
              <Label>Select Players</Label>
              <ScrollArea className="h-40 border rounded-lg p-2">
                {players.map(player => (
                  <div key={player.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded">
                    <Checkbox
                      checked={form.target_player_ids.includes(player.id)}
                      onCheckedChange={() => togglePlayer(player.id)}
                    />
                    <span className="text-sm">{player.full_name}</span>
                  </div>
                ))}
              </ScrollArea>
              <Badge className="mt-2">{form.target_player_ids.length} players selected</Badge>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSend}
              disabled={!form.title.trim() || !form.content.trim()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              <Megaphone className="w-4 h-4 mr-2" />
              Send Announcement
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}