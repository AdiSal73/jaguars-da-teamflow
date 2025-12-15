import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, X, User } from 'lucide-react';
import { toast } from 'sonner';

export default function CoachAssignmentDialog({ open, onClose, teamId, teamName }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCoachForm, setNewCoachForm] = useState({ full_name: '', email: '', branch: '' });
  const queryClient = useQueryClient();

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const assignedCoaches = coaches.filter(c => c.team_ids?.includes(teamId));
  const unassignedCoaches = coaches.filter(c => !c.team_ids?.includes(teamId));
  const filteredUnassigned = unassignedCoaches.filter(c => 
    c.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const assignCoachMutation = useMutation({
    mutationFn: async (coachId) => {
      const coach = coaches.find(c => c.id === coachId);
      const updatedTeamIds = [...(coach.team_ids || []), teamId];
      return base44.entities.Coach.update(coachId, { team_ids: updatedTeamIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['coaches']);
      toast.success('Coach assigned');
    }
  });

  const removeCoachMutation = useMutation({
    mutationFn: async (coachId) => {
      const coach = coaches.find(c => c.id === coachId);
      const updatedTeamIds = (coach.team_ids || []).filter(id => id !== teamId);
      return base44.entities.Coach.update(coachId, { team_ids: updatedTeamIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['coaches']);
      toast.success('Coach removed');
    }
  });

  const createCoachMutation = useMutation({
    mutationFn: async (data) => {
      const newCoach = await base44.entities.Coach.create({
        ...data,
        team_ids: [teamId]
      });
      return newCoach;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['coaches']);
      setShowCreateDialog(false);
      setNewCoachForm({ full_name: '', email: '', branch: '' });
      toast.success('Coach created and assigned');
    }
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Coaches to {teamName}</DialogTitle>
          </DialogHeader>

          {/* Assigned Coaches */}
          <div className="mb-4">
            <Label className="mb-2 block">Currently Assigned ({assignedCoaches.length})</Label>
            <div className="space-y-2">
              {assignedCoaches.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No coaches assigned</p>
              ) : (
                assignedCoaches.map(coach => (
                  <div key={coach.id} className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {coach.full_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{coach.full_name}</p>
                        {coach.branch && <p className="text-xs text-slate-500">{coach.branch}</p>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCoachMutation.mutate(coach.id)}
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
            <div className="flex items-center justify-between mb-2">
              <Label>Add Coaches</Label>
              <Button size="sm" onClick={() => setShowCreateDialog(true)} variant="outline">
                <Plus className="w-3 h-3 mr-1" />
                Create New
              </Button>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search coaches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredUnassigned.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  {searchTerm ? 'No coaches found' : 'All coaches assigned'}
                </p>
              ) : (
                filteredUnassigned.map(coach => (
                  <div key={coach.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-emerald-300">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {coach.full_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{coach.full_name}</p>
                        {coach.branch && <p className="text-xs text-slate-500">{coach.branch}</p>}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => assignCoachMutation.mutate(coach.id)}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Assign
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end mt-4 pt-4 border-t">
            <Button onClick={onClose}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Coach Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Coach</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Full Name *</Label>
              <Input
                value={newCoachForm.full_name}
                onChange={(e) => setNewCoachForm({...newCoachForm, full_name: e.target.value})}
                placeholder="Coach name"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={newCoachForm.email}
                onChange={(e) => setNewCoachForm({...newCoachForm, email: e.target.value})}
                placeholder="coach@email.com"
              />
            </div>
            <div>
              <Label>Branch</Label>
              <Input
                value={newCoachForm.branch}
                onChange={(e) => setNewCoachForm({...newCoachForm, branch: e.target.value})}
                placeholder="e.g., Novi"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="flex-1">Cancel</Button>
              <Button
                onClick={() => createCoachMutation.mutate(newCoachForm)}
                disabled={!newCoachForm.full_name}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                Create & Assign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}