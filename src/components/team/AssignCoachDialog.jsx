import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { UserCog, X } from 'lucide-react';
import { toast } from 'sonner';

export default function AssignCoachDialog({ open, onClose, team }) {
  const queryClient = useQueryClient();
  const [selectedCoachIds, setSelectedCoachIds] = useState([]);

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  React.useEffect(() => {
    if (team?.coach_ids) {
      setSelectedCoachIds(team.coach_ids);
    }
  }, [team]);

  const updateTeamMutation = useMutation({
    mutationFn: (coachIds) => base44.entities.Team.update(team.id, { coach_ids: coachIds }),
    onSuccess: () => {
      queryClient.invalidateQueries(['team']);
      queryClient.invalidateQueries(['teams']);
      toast.success('Coaches updated successfully');
      onClose();
    },
    onError: () => {
      toast.error('Failed to update coaches');
    }
  });

  const toggleCoach = (coachId) => {
    setSelectedCoachIds(prev =>
      prev.includes(coachId)
        ? prev.filter(id => id !== coachId)
        : [...prev, coachId]
    );
  };

  const handleSave = () => {
    updateTeamMutation.mutate(selectedCoachIds);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="w-5 h-5 text-emerald-600" />
            Assign Coaches to {team?.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label className="mb-2 block">Select Coaches</Label>
            {selectedCoachIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 p-3 bg-emerald-50 rounded-lg">
                {selectedCoachIds.map(id => {
                  const coach = coaches.find(c => c.id === id);
                  return (
                    <Badge key={id} className="bg-emerald-600 text-white flex items-center gap-1">
                      {coach?.full_name}
                      <button onClick={() => toggleCoach(id)} className="ml-1 hover:bg-emerald-700 rounded-full p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
            <div className="border rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
              {coaches.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No coaches available</p>
              ) : (
                coaches.map(coach => (
                  <label
                    key={coach.id}
                    className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCoachIds.includes(coach.id)}
                      onChange={() => toggleCoach(coach.id)}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{coach.full_name}</div>
                      <div className="text-xs text-slate-500">{coach.email}</div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={updateTeamMutation.isPending}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {updateTeamMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}