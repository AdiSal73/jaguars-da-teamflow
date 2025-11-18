import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Mail, Send, Users, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

export default function BulkEmail() {
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedPlayers(players.filter(p => p.email).map(p => p.id));
    } else {
      setSelectedPlayers([]);
    }
  };

  const handleSelectPlayer = (playerId, checked) => {
    if (checked) {
      setSelectedPlayers([...selectedPlayers, playerId]);
    } else {
      setSelectedPlayers(selectedPlayers.filter(id => id !== playerId));
    }
  };

  const handleSelectTeam = (teamId) => {
    const teamPlayerIds = players.filter(p => p.team_id === teamId && p.email).map(p => p.id);
    const allSelected = teamPlayerIds.every(id => selectedPlayers.includes(id));
    
    if (allSelected) {
      setSelectedPlayers(selectedPlayers.filter(id => !teamPlayerIds.includes(id)));
    } else {
      setSelectedPlayers([...new Set([...selectedPlayers, ...teamPlayerIds])]);
    }
  };

  const handleSendEmails = async () => {
    if (selectedPlayers.length === 0 || !subject || !message) {
      toast.error('Please select recipients and fill in all fields');
      return;
    }

    setSending(true);
    try {
      const recipients = players.filter(p => selectedPlayers.includes(p.id));
      
      for (const player of recipients) {
        await base44.integrations.Core.SendEmail({
          to: player.email,
          subject: subject,
          body: `Hi ${player.full_name},\n\n${message}`
        });
      }
      
      toast.success(`Email sent to ${recipients.length} players successfully!`);
      setSelectedPlayers([]);
      setSubject('');
      setMessage('');
    } catch (error) {
      toast.error('Failed to send emails');
    } finally {
      setSending(false);
    }
  };

  const groupedByTeam = teams.map(team => ({
    team,
    players: players.filter(p => p.team_id === team.id && p.email)
  })).filter(g => g.players.length > 0);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Mail className="w-8 h-8 text-emerald-600" />
          Bulk Email
        </h1>
        <p className="text-slate-600 mt-1">Send emails to multiple players at once</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                Select Recipients ({selectedPlayers.length} selected)
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectAll(selectedPlayers.length !== players.filter(p => p.email).length)}
              >
                {selectedPlayers.length === players.filter(p => p.email).length ? (
                  <>
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4 mr-2" />
                    Select All
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="max-h-[600px] overflow-y-auto">
            {groupedByTeam.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No players with email addresses found</p>
            ) : (
              <div className="space-y-4">
                {groupedByTeam.map(({ team, players: teamPlayers }) => {
                  const teamPlayerIds = teamPlayers.map(p => p.id);
                  const allSelected = teamPlayerIds.every(id => selectedPlayers.includes(id));
                  
                  return (
                    <div key={team.id} className="border border-slate-200 rounded-lg p-4">
                      <button
                        onClick={() => handleSelectTeam(team.id)}
                        className="flex items-center gap-3 mb-3 w-full text-left hover:bg-slate-50 p-2 rounded-lg transition-colors"
                      >
                        <div className="flex items-center justify-center w-5 h-5">
                          {allSelected ? (
                            <CheckSquare className="w-5 h-5 text-emerald-600" />
                          ) : selectedPlayers.some(id => teamPlayerIds.includes(id)) ? (
                            <Square className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: team.team_color }}
                        >
                          {team.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{team.name}</div>
                          <div className="text-xs text-slate-600">{teamPlayers.length} players</div>
                        </div>
                      </button>
                      <div className="space-y-2 ml-8">
                        {teamPlayers.map(player => (
                          <button
                            key={player.id}
                            onClick={() => handleSelectPlayer(player.id, !selectedPlayers.includes(player.id))}
                            className="flex items-center gap-3 w-full text-left hover:bg-slate-50 p-2 rounded-lg transition-colors"
                          >
                            <Checkbox
                              checked={selectedPlayers.includes(player.id)}
                              onCheckedChange={(checked) => handleSelectPlayer(player.id, checked)}
                            />
                            <div className="flex-1">
                              <div className="font-medium text-slate-900">{player.full_name}</div>
                              <div className="text-xs text-slate-600">{player.email}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Compose Email</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Subject *</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject"
                />
              </div>
              <div>
                <Label>Message *</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your message here..."
                  rows={12}
                />
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-800">
                  <strong>Note:</strong> The email will be personalized with each player's name automatically.
                </div>
              </div>
              <Button
                onClick={handleSendEmails}
                disabled={selectedPlayers.length === 0 || !subject || !message || sending}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                size="lg"
              >
                <Send className="w-4 h-4 mr-2" />
                {sending ? 'Sending...' : `Send Email to ${selectedPlayers.length} Player${selectedPlayers.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}