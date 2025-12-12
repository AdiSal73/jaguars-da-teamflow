import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { isTrappedPlayer } from '../utils/trappedPlayer';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Edit2, Save, X } from 'lucide-react';
import { getPositionBorderColor } from './positionColors';

export default function EditablePlayerCard({ 
  player, 
  tryout, 
  team,
  teams = [],
  clubSettings = [],
  onEdit,
  compact = false,
  showEditButton = true,
  className = ''
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({});

  const updatePlayerMutation = useMutation({
    mutationFn: (data) => base44.entities.Player.update(player.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['players']);
      setShowEditDialog(false);
    }
  });

  const updateTryoutMutation = useMutation({
    mutationFn: async (data) => {
      if (tryout?.id) {
        return base44.entities.PlayerTryout.update(tryout.id, data);
      } else {
        return base44.entities.PlayerTryout.create({
          player_id: player.id,
          player_name: player.full_name,
          ...data
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries(['tryouts'])
  });

  const handleOpenEdit = (e) => {
    e?.stopPropagation?.();
    setEditForm({
      full_name: player.full_name || '',
      primary_position: player.primary_position || '',
      team_id: player.team_id || '',
      jersey_number: player.jersey_number || '',
      team_role: tryout?.team_role || '',
      recommendation: tryout?.recommendation || ''
    });
    setShowEditDialog(true);
  };

  const handleSave = async () => {
    await updatePlayerMutation.mutateAsync({
      full_name: editForm.full_name,
      primary_position: editForm.primary_position,
      team_id: editForm.team_id,
      jersey_number: editForm.jersey_number ? Number(editForm.jersey_number) : null
    });
    
    if (editForm.team_role || editForm.recommendation) {
      await updateTryoutMutation.mutateAsync({
        team_role: editForm.team_role || null,
        recommendation: editForm.recommendation || null
      });
    }
  };

  const getRolesForGender = () => {
    const gender = player.gender || 'Female';
    const customSettings = clubSettings.find(s => s.setting_type === 'team_roles' && s.gender === gender);
    if (customSettings?.values?.length > 0) return customSettings.values;
    
    return gender === 'Male' 
      ? ['Elite Starter', 'Elite Rotation', 'Premier Starter', 'Premier Rotation', 'Academy Starter', 'Academy Rotation', 'Development']
      : ['Indispensable Player', 'GA Starter', 'GA Rotation', 'Aspire Starter', 'Aspire Rotation', 'United Starter', 'United Rotation'];
  };

  const birthYear = player.date_of_birth ? new Date(player.date_of_birth).getFullYear() : null;

  return (
    <>
      <div 
        className={`p-2 rounded-lg border-2 bg-white cursor-pointer hover:shadow-md transition-all ${getPositionBorderColor(player.primary_position)} ${className}`}
        onClick={() => navigate(`${createPageUrl('PlayerDashboard')}?id=${player.id}`)}
      >
        <div className="flex items-start justify-between gap-1">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{player.full_name}</div>
            <div className="text-xs text-slate-500 truncate">{player.primary_position}</div>
            {!compact && (
              <div className="text-xs text-slate-400">
                {birthYear && <span>{birthYear}</span>}
                {team && <span> • {team.name}</span>}
              </div>
            )}
          </div>
          {showEditButton && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 flex-shrink-0 z-10"
              onClick={handleOpenEdit}
            >
              <Edit2 className="w-3 h-3" />
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {tryout?.team_role && (
            <Badge className="bg-purple-100 text-purple-800 text-[9px] px-1">{tryout.team_role}</Badge>
          )}
          {tryout?.recommendation && (
            <Badge className={`text-[9px] px-1 ${
              tryout.recommendation === 'Move up' ? 'bg-emerald-100 text-emerald-800' :
              tryout.recommendation === 'Move down' ? 'bg-orange-100 text-orange-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {tryout.recommendation}
            </Badge>
          )}
          {isTrappedPlayer(player.date_of_birth) && (
            <Badge className="bg-red-500 text-white text-[9px] px-1 font-bold">TRAPPED</Badge>
          )}
        </div>
      </div>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Player</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Name</Label>
              <Input
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Position</Label>
              <Select value={editForm.primary_position} onValueChange={(v) => setEditForm({ ...editForm, primary_position: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {['GK', 'Right Outside Back', 'Left Outside Back', 'Right Centerback', 'Left Centerback', 'Defensive Midfielder', 'Right Winger', 'Center Midfielder', 'Forward', 'Attacking Midfielder', 'Left Winger'].map(pos => (
                    <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Team</Label>
              <Select value={editForm.team_id} onValueChange={(v) => setEditForm({ ...editForm, team_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Jersey Number</Label>
              <Input
                type="number"
                value={editForm.jersey_number}
                onChange={(e) => setEditForm({ ...editForm, jersey_number: e.target.value })}
              />
            </div>
            <div>
              <Label>Team Role</Label>
              <Select value={editForm.team_role} onValueChange={(v) => setEditForm({ ...editForm, team_role: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {getRolesForGender().map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Recommendation</Label>
              <Select value={editForm.recommendation} onValueChange={(v) => setEditForm({ ...editForm, recommendation: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  <SelectItem value="Move up">Move up</SelectItem>
                  <SelectItem value="Keep">Keep</SelectItem>
                  <SelectItem value="Move down">Move down</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
              <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}