import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Share2, Copy, Mail, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function ShareBookingLink({ coachId }) {
  const [showDialog, setShowDialog] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const bookingUrl = `${window.location.origin}/book-session${coachId ? `?coach=${coachId}` : ''}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = async () => {
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    setSending(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: 'Book a Training Session',
        body: `Hello,\n\nYou've been invited to book a training session. Click the link below to view available times and schedule your session:\n\n${bookingUrl}\n\nLooking forward to training with you!`
      });
      toast.success('Email sent successfully!');
      setEmail('');
      setShowDialog(false);
    } catch (error) {
      toast.error('Failed to send email');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setShowDialog(true)}
        className="flex items-center gap-2"
      >
        <Share2 className="w-4 h-4" />
        Share Booking Link
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Booking Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Booking Link</Label>
              <div className="flex gap-2 mt-2">
                <Input value={bookingUrl} readOnly className="flex-1" />
                <Button variant="outline" onClick={handleCopyLink}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                This link works for both authenticated and unauthenticated users
              </p>
            </div>
            <div className="border-t pt-4">
              <Label>Send via Email</Label>
              <div className="space-y-3 mt-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="recipient@example.com"
                />
                <Button
                  onClick={handleSendEmail}
                  disabled={!email || sending}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {sending ? 'Sending...' : 'Send Email'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}