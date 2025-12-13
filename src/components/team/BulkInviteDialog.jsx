import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function BulkInviteDialog({ open, onClose, team, players }) {
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState(null);

  const getRecipientsCount = () => {
    const emails = new Set();
    players.forEach(player => {
      if (player.email) emails.add(player.email);
      if (player.parent_name && player.email) {
        // Assume parent might have same email domain or separate
        emails.add(player.email);
      }
    });
    return emails.size;
  };

  const handleSendInvites = async () => {
    setSending(true);
    const sent = [];
    const failed = [];

    for (const player of players) {
      if (player.email) {
        try {
          const shareUrl = player.profile_password 
            ? `${window.location.origin}/player-dashboard?id=${player.id}&pwd=${player.profile_password}`
            : `${window.location.origin}/player-dashboard?id=${player.id}`;

          await base44.integrations.Core.SendEmail({
            to: player.email,
            subject: `Access Your ${team.name} Player Dashboard`,
            body: `Hello ${player.full_name},\n\nWelcome to ${team.name}!\n\nYou can now access your personal player dashboard to view your evaluations, assessments, goals, and more.\n\nAccess your dashboard here:\n${shareUrl}\n\n${player.profile_password ? 'Password: ' + player.profile_password + '\n\n' : ''}If you need help accessing your dashboard, please contact your coach.\n\nGood luck this season!\n\n- ${team.name} Coaching Staff`
          });
          sent.push(player.full_name);
        } catch (error) {
          failed.push(player.full_name);
        }
      }
    }

    setResults({ sent: sent.length, failed: failed.length, failedNames: failed });
    setSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-emerald-600" />
            Bulk Invite Team Players & Parents
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This will send email invitations to all players on {team?.name} with their dashboard access links.
              {players.some(p => p.profile_password) && (
                <div className="mt-2 text-xs">
                  Password-protected dashboards will include the password in the email.
                </div>
              )}
            </AlertDescription>
          </Alert>

          <Card>
            <CardContent className="p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Team:</span>
                  <span className="font-semibold">{team?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Players with email:</span>
                  <span className="font-semibold">{players.filter(p => p.email).length} / {players.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Invitations to send:</span>
                  <span className="font-semibold text-emerald-600">{players.filter(p => p.email).length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {results && (
            <Alert className={results.failed > 0 ? 'border-orange-200 bg-orange-50' : 'bg-green-50 border-green-200'}>
              {results.failed > 0 ? <AlertCircle className="h-4 w-4 text-orange-600" /> : <CheckCircle className="h-4 w-4 text-green-600" />}
              <AlertDescription>
                <div className="font-semibold mb-1">
                  {results.sent} invitations sent successfully
                </div>
                {results.failed > 0 && (
                  <div className="text-xs text-orange-700 mt-1">
                    {results.failed} failed to send
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              {results ? 'Close' : 'Cancel'}
            </Button>
            {!results && (
              <Button 
                onClick={handleSendInvites}
                disabled={sending || players.filter(p => p.email).length === 0}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Invites
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}