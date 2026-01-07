import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserX, AlertTriangle } from 'lucide-react';

export default function ActAsUserDialog({ open, onClose, actingAsUser, onStopActing }) {
  if (!actingAsUser) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-sm" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="w-5 h-5" />
            Acting As User
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-900 font-semibold mb-2">You are currently acting as:</p>
            <div className="bg-white rounded-lg p-3 border border-orange-200">
              <p className="font-bold text-slate-900">{actingAsUser.full_name || actingAsUser.email}</p>
              <p className="text-sm text-slate-600">{actingAsUser.email}</p>
              <Badge className="mt-2 bg-orange-100 text-orange-800">
                {actingAsUser.role || 'user'}
              </Badge>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-900">
              ⚠️ All actions will be performed as this user. Click below to return to your admin account.
            </p>
          </div>
          <Button 
            onClick={onStopActing}
            className="w-full bg-slate-900 hover:bg-slate-800"
          >
            <UserX className="w-4 h-4 mr-2" />
            Stop Acting As User
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}