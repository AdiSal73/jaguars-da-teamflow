import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Mail, Search, Send, Loader2, CheckCircle2, XCircle, User, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import FilterControls from '../components/filters/FilterControls';

export default function ContactsManager() {
  const [search, setSearch] = useState('');
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [birthdayFrom, setBirthdayFrom] = useState('');
  const [birthdayTo, setBirthdayTo] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingInvite, setPendingInvite] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
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
    onSuccess: (data, variables) => {
      setLastResult({ success: true, email: variables.email, name: variables.name });
      toast.success(`Invitation sent to ${variables.email}`);
    },
    onError: (error, variables) => {
      setLastResult({ success: false, email: variables.email, error: error.message });
      toast.error(`Failed to send invitation: ${error.message}`);
    }
  });

  const handleInviteClick = (email, name, role) => {
    setPendingInvite({ email, name, role });
    setShowConfirmDialog(true);
  };

  const confirmInvite = () => {
    if (pendingInvite) {
      inviteMutation.mutate(pendingInvite);
    }
    setShowConfirmDialog(false);
    setPendingInvite(null);
  };

  const resetFilters = () => {
    setSearch('');
    setFilterTeam('all');
    setFilterType('all');
    setBirthdayFrom('');
    setBirthdayTo('');
  };

  const contacts = players.flatMap(player => {
    const team = teams.find(t => t.id === player.team_id);
    const contacts = [];

    // Player contact
    if (player.player_email) {
      contacts.push({
        id: `player_${player.id}`,
        type: 'Player',
        name: player.full_name,
        email: player.player_email,
        phone: player.player_phone,
        team: team?.name,
        player_id: player.id,
        date_of_birth: player.date_of_birth
      });
    }

    // Parent contacts
    (player.parent_emails || []).forEach((parentEmail, idx) => {
      contacts.push({
        id: `parent_${player.id}_${idx}`,
        type: 'Parent',
        name: player.parent_name || `Parent of ${player.full_name}`,
        email: parentEmail,
        phone: player.phone,
        team: team?.name,
        player_name: player.full_name,
        player_id: player.id,
        date_of_birth: player.date_of_birth
      });
    });

    return contacts;
  });

  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.name?.toLowerCase().includes(search.toLowerCase()) || 
                         c.email?.toLowerCase().includes(search.toLowerCase()) ||
                         c.player_name?.toLowerCase().includes(search.toLowerCase());
    const matchesTeam = filterTeam === 'all' || c.team === filterTeam;
    const matchesType = filterType === 'all' || c.type === filterType;
    
    let matchesBirthday = true;
    if (birthdayFrom && c.date_of_birth) {
      matchesBirthday = matchesBirthday && new Date(c.date_of_birth) >= new Date(birthdayFrom);
    }
    if (birthdayTo && c.date_of_birth) {
      matchesBirthday = matchesBirthday && new Date(c.date_of_birth) <= new Date(birthdayTo);
    }
    
    return matchesSearch && matchesTeam && matchesType && matchesBirthday;
  });

  const uniqueTeams = [...new Set(teams.map(t => t.name).filter(Boolean))];

  const filters = [
    {
      label: 'Type',
      value: filterType,
      onChange: setFilterType,
      placeholder: 'All Types',
      options: [
        { value: 'all', label: 'All Types' },
        { value: 'Player', label: 'Players' },
        { value: 'Parent', label: 'Parents' }
      ]
    },
    {
      label: 'Team',
      value: filterTeam,
      onChange: setFilterTeam,
      placeholder: 'All Teams',
      options: [
        { value: 'all', label: 'All Teams' },
        ...uniqueTeams.map(team => ({ value: team, label: team }))
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Contacts Manager
          </h1>
          <p className="text-slate-600 mt-1">View all player and parent contacts, send invitations</p>
        </div>

        <Card className="border-none shadow-lg mb-6">
          <CardContent className="p-4">
            <FilterControls
              search={search}
              onSearchChange={setSearch}
              filters={filters}
              onResetFilters={resetFilters}
              showBirthdayFilters={true}
              birthdayFrom={birthdayFrom}
              birthdayTo={birthdayTo}
              onBirthdayFromChange={setBirthdayFrom}
              onBirthdayToChange={setBirthdayTo}
            />
          </CardContent>
        </Card>

        {lastResult && (
          <Card className={`border-none shadow-lg mb-6 ${lastResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {lastResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div>
                  <div className={`font-semibold ${lastResult.success ? 'text-green-900' : 'text-red-900'}`}>
                    {lastResult.success ? 'Invitation sent successfully!' : 'Failed to send invitation'}
                  </div>
                  <div className="text-sm text-slate-600 mt-1">
                    {lastResult.success ? `Sent to ${lastResult.name} (${lastResult.email})` : lastResult.error}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setLastResult(null)} className="ml-auto">
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-none shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              All Contacts ({filteredContacts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Team</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Related To</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((contact) => {
                    const hasAccount = users.some(u => u.email === contact.email);
                    return (
                      <tr key={contact.id} className="border-b hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <Badge className={contact.type === 'Player' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
                            {contact.type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">{contact.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{contact.email}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{contact.phone || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{contact.team || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{contact.player_name || '-'}</td>
                        <td className="px-4 py-3">
                          {hasAccount ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Has Account
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleInviteClick(contact.email, contact.name, contact.type === 'Player' ? 'user' : 'parent')}
                              disabled={inviteMutation.isPending}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              {inviteMutation.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <>
                                  <Mail className="w-3 h-3 mr-1" />
                                  Invite
                                </>
                              )}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredContacts.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  No contacts found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Invitation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-slate-600">
              Send an invitation email to:
            </p>
            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span className="font-semibold">{pendingInvite?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">{pendingInvite?.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-800">
                  {pendingInvite?.role === 'parent' ? 'Parent' : 'User'}
                </Badge>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmInvite} className="bg-blue-600 hover:bg-blue-700">
                <Send className="w-4 h-4 mr-2" />
                Send Invitation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}