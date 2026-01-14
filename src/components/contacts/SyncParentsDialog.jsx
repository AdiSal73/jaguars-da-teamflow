import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { RefreshCw, CheckCircle2, XCircle, AlertCircle, Users, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

export default function SyncParentsDialog({ open, onClose }) {
  const queryClient = useQueryClient();
  const [syncResults, setSyncResults] = useState(null);

  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('syncParentsToUsers');
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Sync response:', data);
      if (data.success) {
        setSyncResults(data);
        queryClient.invalidateQueries(['users']);
        toast.success('✅ Sync completed successfully!');
      } else {
        toast.error(`❌ Sync failed: ${data.error}`);
      }
    },
    onError: (error) => {
      console.error('Sync error:', error);
      toast.error(`❌ Sync failed: ${error.message}`);
    }
  });

  const handleSync = () => {
    if (window.confirm('This will create/update parent user accounts based on player parent emails. Continue?')) {
      setSyncResults(null);
      syncMutation.mutate();
    }
  };

  const handleClose = () => {
    setSyncResults(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Sync Parents to Users
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!syncResults && !syncMutation.isPending && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900 font-medium mb-2">What this does:</p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Scans all player records for parent emails</li>
                  <li>Creates new user accounts for parents who don't have one</li>
                  <li>Updates existing users to link them to their children</li>
                  <li>Assigns "parent" role automatically</li>
                  <li>Skips admin and director accounts</li>
                </ul>
              </div>

              <Button
                onClick={handleSync}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                size="lg"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Start Sync
              </Button>
            </div>
          )}

          {syncMutation.isPending && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
              <p className="text-lg font-medium text-slate-900">Syncing parents...</p>
              <p className="text-sm text-slate-600">This may take a few moments</p>
            </div>
          )}

          {syncResults && syncResults.success && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 font-medium">Updated</p>
                  <p className="text-2xl font-bold text-green-900">{syncResults.summary?.updated || 0}</p>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium">Invited</p>
                  <p className="text-2xl font-bold text-blue-900">{syncResults.summary?.invited || 0}</p>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-700 font-medium">Skipped</p>
                  <p className="text-2xl font-bold text-amber-900">{syncResults.summary?.skipped || 0}</p>
                </div>
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 font-medium">Errors</p>
                  <p className="text-2xl font-bold text-red-900">{syncResults.summary?.errors || 0}</p>
                </div>
              </div>

              {/* Detailed Results */}
              <ScrollArea className="h-96 border rounded-lg p-4 bg-slate-50">
                <div className="space-y-4">
                  {/* Updated Users */}
                  {syncResults.details?.updated?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-green-900 flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Updated Accounts ({syncResults.details.updated.length})
                      </h3>
                      <div className="space-y-2">
                        {syncResults.details.updated.map((item, idx) => (
                          <div key={idx} className="p-3 bg-white border border-green-200 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-slate-900">{item.userName || item.email}</p>
                                <p className="text-sm text-slate-600">{item.email}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs bg-slate-100">
                                    {item.previousRole} → parent
                                  </Badge>
                                  <span className="text-xs text-slate-600">
                                    {item.playerCount} player{item.playerCount !== 1 ? 's' : ''}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                  {item.players.join(', ')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Invited Users */}
                  {syncResults.details?.invited?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-blue-900 flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4" />
                        New Invitations ({syncResults.details.invited.length})
                      </h3>
                      <div className="space-y-2">
                        {syncResults.details.invited.map((item, idx) => (
                          <div key={idx} className="p-3 bg-white border border-blue-200 rounded-lg">
                            <p className="font-medium text-slate-900">{item.parentName}</p>
                            <p className="text-sm text-slate-600">{item.email}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {item.playerCount} player{item.playerCount !== 1 ? 's' : ''}: {item.players.join(', ')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skipped Users */}
                  {syncResults.details?.skipped?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-amber-900 flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4" />
                        Skipped ({syncResults.details.skipped.length})
                      </h3>
                      <div className="space-y-2">
                        {syncResults.details.skipped.map((item, idx) => (
                          <div key={idx} className="p-3 bg-white border border-amber-200 rounded-lg">
                            <p className="font-medium text-slate-900">{item.email}</p>
                            <p className="text-sm text-amber-700">{item.reason}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {item.players.join(', ')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Errors */}
                  {syncResults.details?.errors?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-red-900 flex items-center gap-2 mb-2">
                        <XCircle className="w-4 h-4" />
                        Errors ({syncResults.details.errors.length})
                      </h3>
                      <div className="space-y-2">
                        {syncResults.details.errors.map((item, idx) => (
                          <div key={idx} className="p-3 bg-white border border-red-200 rounded-lg">
                            <p className="font-medium text-slate-900">{item.email}</p>
                            <p className="text-sm text-red-700">{item.error}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {item.players.join(', ')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <Button onClick={handleClose} className="w-full">
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}