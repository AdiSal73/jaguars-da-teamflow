import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Share2, Copy, Mail, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SharePlayerDialog({ 
  open, 
  onClose, 
  player,
  onInvite
}) {
  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = player?.profile_password 
    ? `${window.location.origin}/player-dashboard?id=${player.id}&pwd=${player.profile_password}`
    : `${window.location.origin}/player-dashboard?id=${player?.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copied to clipboard');
  };

  const handleInvite = async () => {
    if (!email.trim()) return;
    setInviting(true);
    await onInvite(email, player);
    setInviting(false);
    setEmail('');
    toast.success('Invitation sent');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-emerald-600" />
            Share Player Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="font-semibold text-slate-900 mb-1">{player?.full_name}</p>
            <p className="text-xs text-slate-600">Player profile will be shared</p>
          </div>

          <div>
            <Label>Invite Parent/Player by Email</Label>
            <div className="flex gap-2 mt-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="parent@email.com"
                className="flex-1"
              />
              <Button 
                onClick={() => {
                  if (confirm(`Send invitation to ${email}?`)) {
                    handleInvite();
                  }
                }}
                disabled={!email.trim() || inviting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Mail className="w-4 h-4 mr-1" />
                {inviting ? 'Sending...' : 'Invite'}
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              They'll receive an email invitation to access the app
            </p>
          </div>

          <div className="relative">
            <Label>Share Link {player?.profile_password && '(Password Protected)'}</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1 bg-slate-50 text-xs"
              />
              <Button onClick={handleCopyLink} variant="outline">
                {copied ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            {!player?.profile_password && (
              <p className="text-xs text-orange-600 mt-1">
                ⚠️ No password set. Set a password in Edit mode to protect this link.
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}