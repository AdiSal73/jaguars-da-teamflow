import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Users, Search, Mail, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ParentContactsTable from '../components/contacts/ParentContactsTable';
import InviteNewParentDialog from '../components/contacts/InviteNewParentDialog';
import SyncParentsDialog from '../components/contacts/SyncParentsDialog';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';

export default function ContactsManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');
  const [filterAgeGroup, setFilterAgeGroup] = useState('all');
  const [filterLeague, setFilterLeague] = useState('all');
  const [showInviteNewParentDialog, setShowInviteNewParentDialog] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');



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

  // Extract unique parent contacts from players
  const contacts = useMemo(() => {
    const contactMap = new Map();

    players.forEach(player => {
      const emailsToProcess = [];
      
      // Add parent_emails array
      if (player.parent_emails && player.parent_emails.length > 0) {
        emailsToProcess.push(...player.parent_emails);
      }
      
      // Also add single email field if it exists
      if (player.email) {
        emailsToProcess.push(player.email);
      }

      emailsToProcess.forEach(email => {
        if (!email) return;
        
        if (!contactMap.has(email)) {
          const userAccount = users.find(u => u.email === email);
          contactMap.set(email, {
            email,
            full_name: player.parent_name || userAccount?.full_name || '',
            phone: player.phone || userAccount?.phone || '',
            player_ids: [],
            teams: new Set(),
            has_user_account: !!userAccount,
            user_id: userAccount?.id
          });
        }
        
        const contact = contactMap.get(email);
        if (!contact.player_ids.includes(player.id)) {
          contact.player_ids.push(player.id);
        }
        
        const team = teams.find(t => t.id === player.team_id);
        if (team) {
          contact.teams.add(team.name);
        }
      });
    });

    return Array.from(contactMap.values()).map((contact, idx) => {
      const associatedPlayers = players.filter(p => contact.player_ids.includes(p.id));
      const playerNames = associatedPlayers.map(p => p.full_name).join(' - ');
      const teamNames = Array.from(contact.teams).join(', ');
      const primaryPlayer = associatedPlayers[0];
      const primaryTeam = primaryPlayer ? teams.find(t => t.id === primaryPlayer.team_id) : null;

      return {
        id: contact.user_id || `derived_${idx}`,
        email: contact.email,
        name: contact.full_name || 'N/A',
        phone: contact.phone || 'N/A',
        team: teamNames || 'N/A',
        branch: primaryTeam?.branch,
        age_group: primaryTeam?.age_group,
        league: primaryTeam?.league,
        player_name: playerNames,
        player_id: primaryPlayer?.id,
        player_ids: contact.player_ids,
        date_of_birth: primaryPlayer?.date_of_birth,
        has_user_account: contact.has_user_account,
        user_id: contact.user_id
      };
    });
  }, [players, teams, users]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 inline opacity-50" />;
    return sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 ml-1 inline" /> : <ChevronDown className="w-3 h-3 ml-1 inline" />;
  };

  const filteredContacts = useMemo(() => {
    const filtered = contacts.filter(c => {
      const matchesSearch = c.name?.toLowerCase().includes(search.toLowerCase()) || 
                           c.email?.toLowerCase().includes(search.toLowerCase()) ||
                           c.player_name?.toLowerCase().includes(search.toLowerCase());
      const matchesTeam = filterTeam === 'all' || c.team.includes(filterTeam);
      const matchesBranch = filterBranch === 'all' || c.branch === filterBranch;
      const matchesAgeGroup = filterAgeGroup === 'all' || c.age_group === filterAgeGroup;
      const matchesLeague = filterLeague === 'all' || c.league === filterLeague;
      
      return matchesSearch && matchesTeam && matchesBranch && matchesAgeGroup && matchesLeague;
    });

    return filtered.sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (sortDirection === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });
  }, [contacts, search, filterTeam, filterBranch, filterAgeGroup, filterLeague, sortField, sortDirection]);

  const uniqueTeams = [...new Set(teams.map(t => t.name).filter(Boolean))].sort();
  const uniqueBranches = [...new Set(teams.map(t => t.branch).filter(Boolean))].sort();
  const uniqueAgeGroups = [...new Set(teams.map(t => t.age_group).filter(Boolean))].sort();
  const uniqueLeagues = [...new Set(teams.map(t => t.league).filter(Boolean))].sort();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Parent Contacts Manager
            </h1>
            <p className="text-slate-600 mt-1">Manage all parent contacts, send invitations, and communicate</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowSyncDialog(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync All Parents
            </Button>
            <Button onClick={() => setShowInviteNewParentDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Mail className="w-4 h-4 mr-2" />
              Invite New Parent
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-lg mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <div className="relative col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search contacts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterTeam} onValueChange={setFilterTeam}>
                <SelectTrigger><SelectValue placeholder="Team" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {uniqueTeams.map(team => (
                    <SelectItem key={team} value={team}>{team}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterBranch} onValueChange={setFilterBranch}>
                <SelectTrigger><SelectValue placeholder="Branch" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {uniqueBranches.map(branch => (
                    <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterAgeGroup} onValueChange={setFilterAgeGroup}>
                <SelectTrigger><SelectValue placeholder="Age Group" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ages</SelectItem>
                  {uniqueAgeGroups.map(ag => (
                    <SelectItem key={ag} value={ag}>{ag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterLeague} onValueChange={setFilterLeague}>
                <SelectTrigger><SelectValue placeholder="League" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Leagues</SelectItem>
                  {uniqueLeagues.map(league => (
                    <SelectItem key={league} value={league}>{league}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Parent Contacts ({filteredContacts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ParentContactsTable
              contacts={filteredContacts}
              players={players}
              teams={teams}
              users={users}
            />
          </CardContent>
        </Card>

        <InviteNewParentDialog
          open={showInviteNewParentDialog}
          onClose={() => setShowInviteNewParentDialog(false)}
          players={players}
        />

        <SyncParentsDialog
          open={showSyncDialog}
          onClose={() => setShowSyncDialog(false)}
        />
      </div>
    </div>
  );
}