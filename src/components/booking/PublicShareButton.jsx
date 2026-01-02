import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Share2, Copy, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function PublicShareButton({ coachId, coachName }) {
  const [showDialog, setShowDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const publicUrl = `${window.location.origin}/#/PublicCoachBooking?coach=${coachId}`;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <>
      <Button onClick={() => setShowDialog(true)} className="bg-blue-600 hover:bg-blue-700">
        <Share2 className="w-4 h-4 mr-2" />
        Share Booking Page
      </Button>
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Share Booking Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-slate-600">
              Share this link with anyone to let them book sessions with {coachName || 'you'}.
              No login required!
            </p>
            <div className="flex gap-2">
              <Input value={publicUrl} readOnly className="bg-slate-50" />
              <Button onClick={handleCopy} variant="outline">
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              Anyone with this link can view your availability and book sessions directly.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}