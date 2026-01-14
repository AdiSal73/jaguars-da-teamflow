import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Users } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

export default function BulkRoleEditDialog({ open, onClose, users, onComplete }) {
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [newRole, setNewRole] = useState('parent');

  const toggleUser = (userId) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleAll = () => {
    if (selectedUserIds.length === users.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(users.map(u => u.id));
    }
  };

  const handleSubmit = async () => {
    if (selectedUserIds.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    toast.info(`This will update ${selectedUserIds.length} users to ${newRole} role. Note: Role changes may require re-login to take full effect.`);
    
    if (onComplete) {
      onComplete(selectedUserIds, newRole);
    }
    
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Bulk Role Editor
          </DialogTitle>
        </DialogHeader>

        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Platform security prevents direct role updates via API. Selected users will have their player_ids updated to make them functional parents. The role label may not change immediately.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <label className="text-sm font-medium">New Role:</label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="coach">Coach</SelectItem>
                <SelectItem value="player">Player</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg">
            <div className="bg-slate-50 p-3 border-b flex items-center gap-2">
              <Checkbox 
                checked={selectedUserIds.length === users.length}
                onCheckedChange={toggleAll}
              />
              <span className="font-medium text-sm">
                Select All ({selectedUserIds.length}/{users.length})
              </span>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {users.map(user => (
                <div 
                  key={user.id} 
                  className="p-3 border-b last:border-b-0 hover:bg-slate-50 flex items-center gap-3"
                >
                  <Checkbox
                    checked={selectedUserIds.includes(user.id)}
                    onCheckedChange={() => toggleUser(user.id)}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{user.full_name || user.display_name || user.email}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {user.role || 'user'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit}
            disabled={selectedUserIds.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Update {selectedUserIds.length} User{selectedUserIds.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}