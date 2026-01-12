import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Mail, Send } from 'lucide-react';

export default function SendOfferDialog({ open, onClose, player, team, onSendOffer, isPending }) {
  const [message, setMessage] = useState('');

  React.useEffect(() => {
    if (open && player && team) {
      const teamName = typeof team === 'string' ? team : team?.name || 'the team';
      setMessage(`Dear ${player.full_name} and Family,

We are pleased to offer ${player.full_name} a position on the ${teamName} team for the 2026/2027 season.

${player.full_name} has shown excellent skills and dedication during the evaluation process, and we believe they will be a valuable member of our team.

Please review this offer and respond at your earliest convenience. If you accept, we will send registration information shortly.

Best regards,
Michigan Jaguars Coaching Staff`);
    }
  }, [open, player, team]);

  const handleSend = () => {
    onSendOffer(message);
  };

  if (!player) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Mail className="w-5 h-5 text-emerald-600" />
            Send Team Offer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl border-2 border-emerald-200">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                {player.jersey_number || player.full_name?.charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">{player.full_name}</h3>
                <div className="flex gap-2 mt-1">
                  <Badge className="bg-emerald-600 text-white">{team || 'Team'}</Badge>
                  <Badge className="bg-blue-600 text-white">{player.primary_position}</Badge>
                  {player.age_group && <Badge className="bg-purple-600 text-white">{player.age_group}</Badge>}
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold mb-2 block">Offer Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={12}
              className="font-mono text-sm"
              placeholder="Enter offer message..."
            />
          </div>

          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-slate-600">
              <strong>Note:</strong> This message will be sent to all parent contacts associated with {player.full_name}. 
              The offer status will be updated to "Offer Sent" and parents can respond through the system.
            </p>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={onClose} 
              variant="outline" 
              className="flex-1"
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSend}
              disabled={!message || isPending}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
            >
              <Send className="w-4 h-4 mr-2" />
              {isPending ? 'Sending...' : 'Send Offer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}