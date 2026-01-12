import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, X, AlertTriangle, Users, CheckCircle } from 'lucide-react';

export default function FinalizeRosterDialog({ open, onClose, team, players, onFinalize, isPending }) {
  if (!team) return null;
  
  const acceptedPlayers = players.filter(p => p.tryout?.next_season_status === 'Accepted Offer');
  const pendingPlayers = players.filter(p => 
    p.tryout?.next_season_status === 'Considering Offer' || 
    p.tryout?.next_season_status === 'Offer Sent' ||
    (!p.tryout?.next_season_status && p.tryout?.next_year_team === team.name)
  );
  const rejectedPlayers = players.filter(p => p.tryout?.next_season_status === 'Rejected Offer');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            Finalize Roster: {team.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200 text-center">
              <div className="text-2xl font-bold text-green-700">{acceptedPlayers.length}</div>
              <div className="text-xs text-green-600 font-semibold">Accepted</div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200 text-center">
              <div className="text-2xl font-bold text-yellow-700">{pendingPlayers.length}</div>
              <div className="text-xs text-yellow-600 font-semibold">Pending</div>
            </div>
            <div className="p-4 bg-red-50 rounded-xl border-2 border-red-200 text-center">
              <div className="text-2xl font-bold text-red-700">{rejectedPlayers.length}</div>
              <div className="text-xs text-red-600 font-semibold">Rejected</div>
            </div>
          </div>

          {/* Warnings */}
          {pendingPlayers.length > 0 && (
            <Alert className="border-yellow-500 bg-yellow-50">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <AlertDescription className="text-sm">
                <strong>Warning:</strong> {pendingPlayers.length} player{pendingPlayers.length > 1 ? 's have' : ' has'} not responded to the offer yet. 
                Finalizing will assign them to the team regardless.
              </AlertDescription>
            </Alert>
          )}

          {rejectedPlayers.length > 0 && (
            <Alert className="border-red-500 bg-red-50">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-sm">
                <strong>Note:</strong> {rejectedPlayers.length} player{rejectedPlayers.length > 1 ? 's' : ''} rejected the offer and will not be included in the final roster.
              </AlertDescription>
            </Alert>
          )}

          {/* Player Lists */}
          <div className="space-y-4">
            {acceptedPlayers.length > 0 && (
              <div>
                <h3 className="font-bold text-sm text-green-700 mb-2 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Accepted ({acceptedPlayers.length})
                </h3>
                <div className="space-y-1">
                  {acceptedPlayers.map(player => (
                    <div key={player.id} className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                          {player.jersey_number || player.full_name?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{player.full_name}</div>
                          <div className="text-xs text-slate-600">{player.primary_position}</div>
                        </div>
                      </div>
                      <Badge className="bg-green-600 text-white text-xs">
                        <Check className="w-3 h-3 mr-1" />
                        Confirmed
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingPlayers.length > 0 && (
              <div>
                <h3 className="font-bold text-sm text-yellow-700 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Pending Response ({pendingPlayers.length})
                </h3>
                <div className="space-y-1">
                  {pendingPlayers.map(player => (
                    <div key={player.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-yellow-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                          {player.jersey_number || player.full_name?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{player.full_name}</div>
                          <div className="text-xs text-slate-600">{player.primary_position}</div>
                        </div>
                      </div>
                      <Badge className="bg-yellow-600 text-white text-xs">
                        {player.tryout?.next_season_status || 'No Response'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Info */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-sm text-blue-900 mb-2">What happens when you finalize?</h4>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• All accepted players will be assigned to {team.name}</li>
              <li>• Players will receive a confirmation email with next steps</li>
              <li>• Team roster will be locked and visible to parents</li>
              <li>• Registration links will be sent to all confirmed players</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={onClose} 
              variant="outline" 
              className="flex-1"
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={onFinalize}
              disabled={acceptedPlayers.length === 0 || isPending}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {isPending ? 'Finalizing...' : `Finalize Roster (${acceptedPlayers.length} Players)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}