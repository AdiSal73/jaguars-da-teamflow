import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import ParentContactsTable from '../components/contacts/ParentContactsTable';
import { BRANCH_OPTIONS } from '../components/constants/leagueOptions';

export default function ContactsManager() {
  const [search, setSearch] = useState('');
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');
  const [filterAgeGroup, setFilterAgeGroup] = useState('all');
  const [filterLeague, setFilterLeague] = useState('all');

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

  const { data: parents = [] } = useQuery({
    queryKey: ['parents'],
    queryFn: () => base44.entities.Parent.list()
  });

  // Extract parent data from players
  const contacts = useMemo(() => {
    const parentMap = new Map();
    
    players.forEach(player => {
      if (!player.parent_emails || player.parent_emails.length === 0) return;
      
      player.parent_emails.forEach(email => {
        if (!parentMap.has(email)) {
          parentMap.set(email, {
            email,
            name: player.parent_name || '',
            phone: player.phone || '',
            players: [],
            teams: new Set()
          });
        }
        
        const contact = parentMap.get(email);
        contact.players.push({
          id: player.id,
          name: player.full_name,
          team_id: player.team_id
        });
        
        const team = teams.find(t => t.id === player.team_id);
        if (team) {
          contact.teams.add(team.name);
        }
      });
    });
    
    return Array.from(parentMap.values()).map((contact, idx) => {
      const playerNames = contact.players.map(p => p.name).join(' - ');
      const teamNames = Array.from(contact.teams).join(', ');
      const primaryPlayer = players.find(p => p.id === contact.players[0]?.id);
      const primaryTeam = teams.find(t => t.id === primaryPlayer?.team_id);
      
      return {
        id: `parent_${idx}`,
        type: 'Parent',
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        team: teamNames,
        branch: primaryTeam?.branch,
        age_group: primaryTeam?.age_group,
        league: primaryTeam?.league,
        player_name: playerNames,
        player_id: contact.players[0]?.id,
        player_ids: contact.players.map(p => p.id),
        date_of_birth: primaryPlayer?.date_of_birth
      };
    });
  }, [players, teams]);

  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      const matchesSearch = c.name?.toLowerCase().includes(search.toLowerCase()) || 
                           c.email?.toLowerCase().includes(search.toLowerCase()) ||
                           c.player_name?.toLowerCase().includes(search.toLowerCase());
      const matchesTeam = filterTeam === 'all' || c.team === filterTeam;
      const matchesBranch = filterBranch === 'all' || c.branch === filterBranch;
      const matchesAgeGroup = filterAgeGroup === 'all' || c.age_group === filterAgeGroup;
      const matchesLeague = filterLeague === 'all' || c.league === filterLeague;
      
      return matchesSearch && matchesTeam && matchesBranch && matchesAgeGroup && matchesLeague;
    });
  }, [contacts, search, filterTeam, filterBranch, filterAgeGroup, filterLeague]);

  const uniqueTeams = [...new Set(teams.map(t => t.name).filter(Boolean))].sort();
  const uniqueBranches = [...new Set(teams.map(t => t.branch).filter(Boolean))].sort();
  const uniqueAgeGroups = [...new Set(teams.map(t => t.age_group).filter(Boolean))].sort();
  const uniqueLeagues = [...new Set(teams.map(t => t.league).filter(Boolean))].sort();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Parent Contacts Manager
          </h1>
          <p className="text-slate-600 mt-1">Manage all parent contacts, send invitations, and communicate</p>
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
              onUpdate={() => {}}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}