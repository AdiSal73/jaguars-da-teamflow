import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle, Target, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function PlayerGoalsManager({ player, onUpdate }) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [goalForm, setGoalForm] = useState({
    description: '',
    target_value: '',
    current_value: 0,
    metric_type: 'count',
    deadline: '',
  });

  const goals = player.goals || [];

  const handleAddGoal = () => {
    setEditingGoal(null);
    setGoalForm({
      description: '',
      target_value: '',
      current_value: 0,
      metric_type: 'count',
      deadline: '',
    });
    setShowDialog(true);
  };

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setGoalForm({
      description: goal.description,
      target_value: goal.target_value,
      current_value: goal.current_value,
      metric_type: goal.metric_type,
      deadline: goal.deadline,
    });
    setShowDialog(true);
  };

  const handleSaveGoal = () => {
    const newGoal = {
      id: editingGoal?.id || `goal_${Date.now()}`,
      description: goalForm.description,
      target_value: parseFloat(goalForm.target_value) || 0,
      current_value: parseFloat(goalForm.current_value) || 0,
      metric_type: goalForm.metric_type,
      deadline: goalForm.deadline,
      completed: false,
      created_date: editingGoal?.created_date || new Date().toISOString()
    };

    const updatedGoals = editingGoal
      ? goals.map(g => g.id === editingGoal.id ? newGoal : g)
      : [...goals, newGoal];

    onUpdate({ goals: updatedGoals });
    setShowDialog(false);
  };

  const handleDeleteGoal = (goalId) => {
    const updatedGoals = goals.filter(g => g.id !== goalId);
    onUpdate({ goals: updatedGoals });
  };

  const handleUpdateProgress = (goalId, newValue) => {
    const updatedGoals = goals.map(g => {
      if (g.id === goalId) {
        const completed = newValue >= g.target_value;
        return { ...g, current_value: newValue, completed };
      }
      return g;
    });
    onUpdate({ goals: updatedGoals });
  };

  const metricTypes = [
    { value: 'count', label: 'Count (e.g., goals scored)' },
    { value: 'percentage', label: 'Percentage (%)' },
    { value: 'rating', label: 'Rating (1-10)' },
    { value: 'time', label: 'Time (seconds)' },
    { value: 'distance', label: 'Distance (meters)' }
  ];

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-600" />
            Player Goals
          </CardTitle>
          <Button onClick={handleAddGoal} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-1" />
            Add Goal
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {goals.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Target className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm">No goals set yet</p>
            <p className="text-xs mt-1">Add SMART goals to track progress</p>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map(goal => {
              const progress = Math.min((goal.current_value / goal.target_value) * 100, 100);
              const isOverdue = goal.deadline && new Date(goal.deadline) < new Date() && !goal.completed;
              
              return (
                <div key={goal.id} className={`p-4 rounded-lg border-2 ${goal.completed ? 'bg-emerald-50 border-emerald-200' : isOverdue ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{goal.description}</h4>
                        {goal.completed && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Badge variant="outline" className="text-[10px]">
                          {goal.metric_type}
                        </Badge>
                        {goal.deadline && (
                          <Badge className={`text-[10px] ${isOverdue ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                            Due: {new Date(goal.deadline).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditGoal(goal)}>
                        <TrendingUp className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-50 hover:text-red-600" onClick={() => handleDeleteGoal(goal.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Progress</span>
                      <span className="font-semibold">{goal.current_value} / {goal.target_value}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  
                  {!goal.completed && (
                    <div className="mt-2 flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Update progress"
                        className="h-8 text-xs"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateProgress(goal.id, parseFloat(e.target.value) || 0);
                            e.target.value = '';
                          }
                        }}
                      />
                      <span className="text-xs text-slate-500">Press Enter</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingGoal ? 'Edit Goal' : 'Add New Goal'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Goal Description *</Label>
              <Textarea
                value={goalForm.description}
                onChange={(e) => setGoalForm({...goalForm, description: e.target.value})}
                placeholder="e.g., Score 10 goals this season"
                rows={2}
              />
              <p className="text-xs text-slate-500 mt-1">Be specific and measurable</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Target Value *</Label>
                <Input
                  type="number"
                  value={goalForm.target_value}
                  onChange={(e) => setGoalForm({...goalForm, target_value: e.target.value})}
                  placeholder="e.g., 10"
                />
              </div>
              <div>
                <Label>Current Value</Label>
                <Input
                  type="number"
                  value={goalForm.current_value}
                  onChange={(e) => setGoalForm({...goalForm, current_value: e.target.value})}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label>Metric Type *</Label>
              <Select value={goalForm.metric_type} onValueChange={(v) => setGoalForm({...goalForm, metric_type: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {metricTypes.map(mt => (
                    <SelectItem key={mt.value} value={mt.value}>{mt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Deadline (Time-bound)</Label>
              <Input
                type="date"
                value={goalForm.deadline}
                onChange={(e) => setGoalForm({...goalForm, deadline: e.target.value})}
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs font-semibold text-blue-900 mb-1">SMART Goal Tips:</p>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• <strong>Specific:</strong> Clearly define what you want to achieve</li>
                <li>• <strong>Measurable:</strong> Use numbers you can track</li>
                <li>• <strong>Achievable:</strong> Set realistic targets</li>
                <li>• <strong>Relevant:</strong> Align with player development</li>
                <li>• <strong>Time-bound:</strong> Set a deadline</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleSaveGoal} 
                disabled={!goalForm.description || !goalForm.target_value}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {editingGoal ? 'Update Goal' : 'Add Goal'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}