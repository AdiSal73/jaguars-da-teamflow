import React, { useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

export default function BadgeEarnedDialog({ badge, open, onClose }) {
  useEffect(() => {
    if (open && badge) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [open, badge]);

  if (!badge) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md text-center">
        <div className="py-6">
          <div className="text-6xl mb-4 animate-bounce-slow">{badge.icon}</div>
          <h2 className="text-2xl font-bold text-purple-900 mb-2">Badge Unlocked!</h2>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">{badge.name}</h3>
          <p className="text-sm text-slate-600 mb-4">{badge.description}</p>
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-900 px-4 py-2 rounded-full font-bold">
            +{badge.points} Points
          </div>
          <Button onClick={onClose} className="mt-6 bg-purple-600 hover:bg-purple-700">
            Awesome!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}