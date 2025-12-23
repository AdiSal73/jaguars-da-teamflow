import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function ShareBookingLinkDialog({ open, onClose, coach }) {
  const bookingUrl = `${window.location.origin}${window.location.pathname}#/BookCoach?coach=${coach?.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(bookingUrl);
    toast.success('Link copied to clipboard');
  };

  const handleOpen = () => {
    window.open(bookingUrl, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Share Booking Page</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label className="text-sm text-slate-600 mb-2 block">
              Share this link to allow anyone to book sessions with you
            </Label>
            <div className="flex gap-2">
              <Input
                value={bookingUrl}
                readOnly
                className="flex-1 bg-slate-50 font-mono text-xs"
              />
              <Button onClick={handleCopy} variant="outline" size="icon">
                <Copy className="w-4 h-4" />
              </Button>
              <Button onClick={handleOpen} variant="outline" size="icon">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900">
              💡 Anyone with this link can book sessions with you, even if they're not on your teams.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}