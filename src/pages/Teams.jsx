import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Users, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function Teams() {
  const [showDialog, setShowDialog] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: '',
    age_group: '',
    division: '',
    season: '',
    team_color: '#22c55e'
  });

  const queryClient = useQueryClient();

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list('-created_date')
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const createTeamMutation = useMutation({
    mutationFn: (data) => base44.entities.Team.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['teams']);
      setShowDialog(false);
      setNewTeam({
        name: '',
        age_group: '',
        division: '',
        season: '',
        team_color: '#22c55e'
      });
    }
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Teams</h1>
          <p className="text-slate-600 mt-1">Manage your club's team structure</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Team Name *</Label>
                <Input
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
                  placeholder="e.g., Elite Squad"
                />
              </div>
              <div>
                <Label>Age Group *</Label>
                <Input
                  value={newTeam.age_group}
                  onChange={(e) => setNewTeam({...newTeam, age_group: e.target.value})}
                  placeholder="e.g., U-15, U-18, Senior"
                />
              </div>
              <div>
                <Label>Division</Label>
                <Input
                  value={newTeam.division}
                  onChange={(e) => setNewTeam({...newTeam, division: e.target.value})}
                  placeholder="e.g., Premier League"
                />
              </div>
              <div>
                <Label>Season</Label>
                <Input
                  value={newTeam.season}
                  onChange={(e) => setNewTeam({...newTeam, season: e.target.value})}
                  placeholder="e.g., 2024/2025"
                />
              </div>
              <div>
                <Label>Team Color</Label>
                <Input
                  type="color"
                  value={newTeam.team_color}
                  onChange={(e) => setNewTeam({...newTeam, team_color: e.target.value})}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button 
                onClick={() => createTeamMutation.mutate(newTeam)}
                disabled={!newTeam.name || !newTeam.age_group}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Create Team
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map(team => {
          const teamPlayers = players.filter(p => p.team_id === team.id);
          const headCoach = coaches.find(c => c.id === team.head_coach_id);

          return (
            <Card key={team.id} className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="border-b border-slate-100" style={{ backgroundColor: `${team.team_color}20` }}>
                <CardTitle className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: team.team_color }}
                  >
                    {team.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-lg">{team.name}</div>
                    <div className="text-sm font-normal text-slate-600">{team.age_group}</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {team.division && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Division:</span>
                      <span className="font-medium text-slate-900">{team.division}</span>
                    </div>
                  )}
                  {team.season && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Season:</span>
                      <span className="font-medium text-slate-900">{team.season}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Players:</span>
                    <span className="font-medium text-slate-900 flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {teamPlayers.length}
                    </span>
                  </div>
                  {headCoach && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Head Coach:</span>
                      <span className="font-medium text-slate-900 flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {headCoach.full_name}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {teams.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">No teams yet. Create your first team to get started.</p>
        </div>
      )}
    </div>
  );
}