import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function TrainingFeedbackForm({ playerId, module, onClose }) {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState({
    player_id: playerId,
    module_id: module.id,
    session_date: new Date().toISOString().split('T')[0],
    perceived_exertion: 5,
    completion_status: 'Completed',
    felt_difficulty: 'Just Right',
    energy_level_before: 7,
    energy_level_after: 5,
    enjoyed_session: true,
    session_notes: ''
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: (data) => base44.entities.TrainingFeedback.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['trainingFeedback']);
      toast.success('Feedback submitted - AI will use this to optimize future plans');
      onClose();
    }
  });

  const rpeDescriptions = {
    1: 'Very Easy',
    2: 'Easy',
    3: 'Moderate',
    4: 'Somewhat Hard',
    5: 'Hard',
    6: 'Harder',
    7: 'Very Hard',
    8: 'Very Very Hard',
    9: 'Extremely Hard',
    10: 'Maximum Effort'
  };

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-purple-600" />
          Training Session Feedback
        </CardTitle>
        <p className="text-xs text-slate-600 mt-1">{module.title}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Perceived Exertion (RPE) *</Label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="range"
                min="1"
                max="10"
                value={feedback.perceived_exertion}
                onChange={(e) => setFeedback({...feedback, perceived_exertion: parseInt(e.target.value)})}
                className="flex-1"
              />
              <div className="w-8 text-center font-bold text-purple-700">{feedback.perceived_exertion}</div>
            </div>
            <p className="text-xs text-slate-500 mt-1">{rpeDescriptions[feedback.perceived_exertion]}</p>
          </div>

          <div>
            <Label className="text-xs">Felt Difficulty</Label>
            <Select value={feedback.felt_difficulty} onValueChange={(v) => setFeedback({...feedback, felt_difficulty: v})}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Too Easy">Too Easy</SelectItem>
                <SelectItem value="Just Right">Just Right ✓</SelectItem>
                <SelectItem value="Too Hard">Too Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Completion Status</Label>
            <Select value={feedback.completion_status} onValueChange={(v) => setFeedback({...feedback, completion_status: v})}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Completed">Completed ✓</SelectItem>
                <SelectItem value="Partial">Partial</SelectItem>
                <SelectItem value="Skipped">Skipped</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Enjoyed Session?</Label>
            <Select value={feedback.enjoyed_session ? 'yes' : 'no'} onValueChange={(v) => setFeedback({...feedback, enjoyed_session: v === 'yes'})}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes 😊</SelectItem>
                <SelectItem value="no">No 😐</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="text-xs">Session Notes (optional)</Label>
          <Textarea
            value={feedback.session_notes}
            onChange={(e) => setFeedback({...feedback, session_notes: e.target.value})}
            placeholder="How did you feel? Any challenges or achievements?"
            rows={3}
            className="text-xs"
          />
        </div>

        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-blue-800">
            💡 Your feedback helps the AI optimize future training plans to match your capacity and prevent over/undertraining.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={() => submitFeedbackMutation.mutate(feedback)} className="flex-1 bg-purple-600 hover:bg-purple-700">
            <Save className="w-4 h-4 mr-2" />
            Submit Feedback
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}