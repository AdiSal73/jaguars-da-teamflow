import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Users, Search, UserCheck } from 'lucide-react';

export default function UnassignedPlayersDialog({ open, onClose, players = [], teams = [] }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [assigningId, setAssigningId] = useState(null);
  const [selectedTeams, setSelectedTeams] = useState({});

  const teams2627 = useMemo(() =>
    teams.filter(t => t.season === '26/27' || t.name?.includes('26/27'))
      .sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [teams]
  );

  // Players with no 26/27 assignment
  const unassigned = useMemo(() => {
    return players.filter(p => {
      const hasAssignment = p.team_assignments?.some(a => a.season === '26/27');
      const hasLegacy = !!p.current_26_27_team;
      return !hasAssignment && !hasLegacy;
    }).filter(p =>
      !search || p.full_name?.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
  }, [players, search]);

  // Group by age_group
  const grouped = useMemo(() => {
    const g = {};
    for (const p of unassigned) {
      const ag = p.age_group || 'Unknown';
      if (!g[ag]) g[ag] = [];
      g[ag].push(p);
    }
    // Sort age groups descending (U18 before U14)
    return Object.entries(g).sort(([a], [b]) => {
      const n = s => parseInt(s.match(/\d+/)?.[0] || '0');
      return n(b) - n(a);
    });
  }, [unassigned]);

  const handleAssign = async (player) => {
    const teamId = selectedTeams[player.id];
    if (!teamId) { toast.error('Select a team first'); return; }
    setAssigningId(player.id);
    try {
      const assignments = (player.team_assignments || []).filter(a => a.season !== '26/27');
      assignments.push({ team_id: teamId, season: '26/27' });
      await base44.entities.Player.update(player.id, {
        current_26_27_team: teamId,
        team_assignments: assignments
      });
      queryClient.invalidateQueries(['players']);
      toast.success(`${player.full_name} assigned!`);
    } catch (e) {
      toast.error('Failed to assign player');
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-500" />
            Unassigned Players ({unassigned.length})
          </DialogTitle>
        </DialogHeader>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {grouped.length === 0 && (
            <p className="text-center text-slate-400 py-12 italic">No unassigned players found</p>
          )}
          {grouped.map(([ageGroup, agPlayers]) => (
            <div key={ageGroup}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">{ageGroup}</span>
                <span className="text-xs text-slate-400">{agPlayers.length} players</span>
              </div>
              <div className="space-y-2">
                {agPlayers.map(player => (
                  <div key={player.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-700 font-bold text-sm flex-shrink-0">
                      {player.full_name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{player.full_name}</p>
                      <p className="text-xs text-slate-500">{player.primary_position || 'No position'} {player.grad_year ? `· Grad ${player.grad_year}` : ''}</p>
                    </div>
                    <Select
                      value={selectedTeams[player.id] || ''}
                      onValueChange={v => setSelectedTeams(prev => ({ ...prev, [player.id]: v }))}
                    >
                      <SelectTrigger className="w-44 h-8 text-xs">
                        <SelectValue placeholder="Pick team..." />
                      </SelectTrigger>
                      <SelectContent>
                        {teams2627.map(t => (
                          <SelectItem key={t.id} value={t.id} className="text-xs">{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      disabled={!selectedTeams[player.id] || assigningId === player.id}
                      onClick={() => handleAssign(player)}
                      className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-xs flex-shrink-0"
                    >
                      <UserCheck className="w-3 h-3 mr-1" />
                      Assign
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}