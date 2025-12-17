import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function GoalFeedbackDialog({ 
  open, 
  onClose, 
  goal,
  player,
  onSendFeedback
}) {
  const [feedback, setFeedback] = useState('');

  const handleSend = () => {
    onSendFeedback(player, goal, feedback);
    setFeedback('');
    onClose();
  };

  const progress = goal ? Math.min((goal.current_value / goal.target_value) * 100, 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            Send Goal Feedback
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="font-semibold text-slate-900 mb-1">{player?.full_name}</p>
            <p className="text-sm text-slate-700 mb-2">{goal?.description}</p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Progress</span>
                <span className="font-semibold">{goal?.current_value} / {goal?.target_value}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <Badge className={`mt-2 text-[10px] ${goal?.category?.includes('attacking') ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
              {goal?.category?.replace(/_/g, ' ')}
            </Badge>
          </div>

          <div>
            <Label>Feedback Message</Label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide constructive feedback on their progress..."
              rows={5}
              className="mt-2"
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (confirm(`Send feedback to ${player?.full_name}'s parents?`)) {
                  handleSend();
                }
              }}
              disabled={!feedback.trim()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Feedback
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}