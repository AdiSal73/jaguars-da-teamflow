import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Plus, Target, TrendingUp, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function GoalTracker({ playerId, playerName, goals = [] }) {
  const [showDialog, setShowDialog] = useState(false);
  const [newGoal, setNewGoal] = useState({
    description: '',
    target_value: 100,
    current_value: 0,
    metric_type: 'percentage',
    deadline: ''
  });

  const queryClient = useQueryClient();

  const updatePlayerMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Player.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['player', playerId]);
      queryClient.invalidateQueries(['players']);
    }
  });

  const handleAddGoal = () => {
    const updatedGoals = [...goals, { 
      ...newGoal, 
      id: Date.now().toString(),
      created_date: new Date().toISOString(),
      completed: false
    }];
    
    updatePlayerMutation.mutate({
      id: playerId,
      data: { goals: updatedGoals }
    });
    
    setShowDialog(false);
    setNewGoal({
      description: '',
      target_value: 100,
      current_value: 0,
      metric_type: 'percentage',
      deadline: ''
    });
  };

  const handleUpdateProgress = (goalId, newValue) => {
    const updatedGoals = goals.map(g => {
      if (g.id === goalId) {
        const completed = newValue >= g.target_value;
        return { ...g, current_value: newValue, completed };
      }
      return g;
    });
    
    updatePlayerMutation.mutate({
      id: playerId,
      data: { goals: updatedGoals }
    });
  };

  const activeGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="border-b border-slate-100">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-600" />
            Goal Tracker
          </CardTitle>
          <Button onClick={() => setShowDialog(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Goal
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {goals.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p>No goals set yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {activeGoals.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Active Goals</h4>
                <div className="space-y-3">
                  {activeGoals.map(goal => {
                    const progress = (goal.current_value / goal.target_value) * 100;
                    return (
                      <div key={goal.id} className="p-4 bg-slate-50 rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-slate-900">{goal.description}</h5>
                          <TrendingUp className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm text-slate-600">
                            <span>Progress</span>
                            <span className="font-semibold">{goal.current_value}/{goal.target_value}</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                          {goal.deadline && (
                            <div className="text-xs text-slate-500">
                              Deadline: {new Date(goal.deadline).toLocaleDateString()}
                            </div>
                          )}
                          <div className="flex gap-2 mt-2">
                            <Input
                              type="number"
                              value={goal.current_value}
                              onChange={(e) => handleUpdateProgress(goal.id, parseFloat(e.target.value))}
                              className="w-24 h-8 text-sm"
                            />
                            <Button size="sm" variant="outline" className="h-8">Update</Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {completedGoals.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Completed Goals</h4>
                <div className="space-y-2">
                  {completedGoals.map(goal => (
                    <div key={goal.id} className="p-3 bg-emerald-50 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-medium text-slate-900">{goal.description}</span>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800">Completed</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Goal Description *</Label>
              <Input
                value={newGoal.description}
                onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                placeholder="e.g., Improve 40m sprint time to under 5.5s"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Target Value</Label>
                <Input
                  type="number"
                  value={newGoal.target_value}
                  onChange={(e) => setNewGoal({...newGoal, target_value: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label>Current Value</Label>
                <Input
                  type="number"
                  value={newGoal.current_value}
                  onChange={(e) => setNewGoal({...newGoal, current_value: parseFloat(e.target.value)})}
                />
              </div>
            </div>
            <div>
              <Label>Deadline (Optional)</Label>
              <Input
                type="date"
                value={newGoal.deadline}
                onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleAddGoal}
              disabled={!newGoal.description}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Add Goal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}