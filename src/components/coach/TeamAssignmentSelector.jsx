import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, X } from 'lucide-react';

export default function TeamAssignmentSelector({ teams, selectedTeamIds = [], onChange }) {
  const [searchTerm, setSearchTerm] = useState('');

  const assignedTeams = teams.filter(t => selectedTeamIds.includes(t.id) && t.name && typeof t.name === 'string');
  const unassignedTeams = teams.filter(t => !selectedTeamIds.includes(t.id) && t.name && typeof t.name === 'string');
  const filteredUnassigned = unassignedTeams.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = (teamId) => {
    onChange([...selectedTeamIds, teamId]);
  };

  const handleRemove = (teamId) => {
    onChange(selectedTeamIds.filter(id => id !== teamId));
  };

  return (
    <div className="space-y-4">
      {/* Assigned Teams */}
      <div>
        <div className="text-sm font-medium text-slate-700 mb-2">
          Assigned Teams ({assignedTeams.length})
        </div>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {assignedTeams.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-3">No teams assigned</p>
          ) : (
            assignedTeams.map(team => (
              <div key={team.id} className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{team.name}</p>
                  <p className="text-xs text-slate-500">{team.age_group} • {team.league}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(team.id)}
                  className="hover:bg-red-100 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Search and Add */}
      <div>
        <div className="text-sm font-medium text-slate-700 mb-2">
          Add Teams
        </div>
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {filteredUnassigned.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-3">
              {searchTerm ? 'No teams found' : 'All teams assigned'}
            </p>
          ) : (
            filteredUnassigned.map(team => (
              <div key={team.id} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg hover:border-emerald-300">
                <div>
                  <p className="font-medium text-sm">{team.name}</p>
                  <p className="text-xs text-slate-500">{team.age_group} • {team.league}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleAdd(team.id)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}