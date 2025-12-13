import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle, Target, TrendingUp, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { POSITION_KNOWLEDGE } from '../constants/positionKnowledgeBank';

export default function PlayerGoalsManager({ player, currentAssessment, onUpdate, onProvideFeedback }) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState(player.primary_position || '');
  const [editingGoal, setEditingGoal] = useState(null);

  const goals = player.goals || [];
  const positionKnowledge = POSITION_KNOWLEDGE[selectedPosition];

  // Auto-suggest endurance goal if assessment shows low endurance
  React.useEffect(() => {
    if (currentAssessment && currentAssessment.endurance_score < 30) {
      const hasEnduranceGoal = goals.some(g => 
        g.description?.toLowerCase().includes('endurance') || 
        g.category?.toLowerCase().includes('endurance')
      );
      
      if (!hasEnduranceGoal && goals.length < 5) {
        const today = new Date();
        const suggestedCompletion = new Date(today);
        suggestedCompletion.setMonth(suggestedCompletion.getMonth() + 2);
        
        const enduranceGoal = {
          id: `goal_${Date.now()}_endurance`,
          description: 'Improve cardiovascular endurance to maintain performance for full 90 minutes',
          plan_of_action: 'Follow 90Min fitness program workouts 2-3x per week. Focus on YIRT improvement and interval training.',
          suggested_start_date: today.toISOString().split('T')[0],
          start_date: '',
          suggested_completion_date: suggestedCompletion.toISOString().split('T')[0],
          completion_date: '',
          progress: 0,
          notes: `Current endurance score: ${currentAssessment.endurance_score}. Target: 60+`,
          category: 'fitness',
          position: player.primary_position,
          completed: false,
          created_date: new Date().toISOString()
        };
        
        onUpdate({ goals: [...goals, enduranceGoal] });
      }
    }
  }, [currentAssessment]);

  const handleOpenDialog = () => {
    setSelectedGoals([]);
    setSelectedPosition(player.primary_position || '');
    setShowDialog(true);
  };

  const handleToggleGoal = (category, point) => {
    const goalKey = `${category}|||${point}`;
    if (selectedGoals.includes(goalKey)) {
      setSelectedGoals(selectedGoals.filter(g => g !== goalKey));
    } else {
      if (selectedGoals.length < 5) {
        setSelectedGoals([...selectedGoals, goalKey]);
      }
    }
  };

  const handleSaveGoals = () => {
    const today = new Date();
    const suggestedCompletion = new Date(today);
    suggestedCompletion.setMonth(suggestedCompletion.getMonth() + 3);

    const newGoals = selectedGoals.map(goalKey => {
      const [category, point] = goalKey.split('|||');
      return {
        id: `goal_${Date.now()}_${Math.random()}`,
        description: point,
        plan_of_action: '',
        suggested_start_date: today.toISOString().split('T')[0],
        start_date: '',
        suggested_completion_date: suggestedCompletion.toISOString().split('T')[0],
        completion_date: '',
        progress: 0,
        notes: '',
        category: category,
        position: selectedPosition,
        completed: false,
        created_date: new Date().toISOString()
      };
    });

    // Auto-add endurance goal if needed
    const currentGoals = [...goals, ...newGoals];
    
    onUpdate({ goals: currentGoals });
    setShowDialog(false);
  };

  const handleDeleteGoal = (goalId) => {
    const updatedGoals = goals.filter(g => g.id !== goalId);
    onUpdate({ goals: updatedGoals });
  };

  const handleUpdateProgress = (goalId, newValue) => {
    const updatedGoals = goals.map(g => {
      if (g.id === goalId) {
        const completed = newValue >= 100;
        return { ...g, progress: newValue, completed };
      }
      return g;
    });
    onUpdate({ goals: updatedGoals });
  };

  const handleUpdateGoalField = (goalId, field, value) => {
    const updatedGoals = goals.map(g => {
      if (g.id === goalId) {
        return { ...g, [field]: value };
      }
      return g;
    });
    onUpdate({ goals: updatedGoals });
  };

  const categoryColors = {
    attacking_organized: 'from-emerald-500 to-green-600',
    attacking_final_third: 'from-blue-500 to-cyan-600',
    attacking_transition: 'from-purple-500 to-pink-600',
    defending_organized: 'from-orange-500 to-red-600',
    defending_final_third: 'from-red-500 to-rose-600',
    defending_transition: 'from-yellow-500 to-orange-600'
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-600" />
            SMART Goals
          </CardTitle>
          <Button onClick={handleOpenDialog} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-1" />
            Add Goals
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {goals.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Target className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm">No goals set yet</p>
            <p className="text-xs mt-1">Select up to 5 SMART goals from knowledge bank</p>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map(goal => {
              const progress = goal.progress || 0;
              const categoryColor = categoryColors[goal.category] || 'from-slate-500 to-slate-600';
              
              return (
                <div key={goal.id} className={`p-4 rounded-lg border-2 ${goal.completed ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{goal.description}</h4>
                        {goal.completed && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Badge className={`text-[10px] bg-gradient-to-r ${categoryColor} text-white border-0`}>
                          {goal.category?.replace(/_/g, ' ')}
                        </Badge>
                        {goal.position && (
                          <Badge variant="outline" className="text-[10px]">{goal.position}</Badge>
                        )}
                      </div>
                      {goal.start_date && (
                        <div className="text-xs text-slate-500 mt-1">
                          Started: {new Date(goal.start_date).toLocaleDateString()}
                          {goal.suggested_completion_date && ` • Target: ${new Date(goal.suggested_completion_date).toLocaleDateString()}`}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-200" onClick={() => setEditingGoal(goal)}>
                        <Edit className="w-3 h-3" />
                      </Button>
                      {onProvideFeedback && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-blue-50 hover:text-blue-600" onClick={() => onProvideFeedback(goal)}>
                          <TrendingUp className="w-3 h-3" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-50 hover:text-red-600" onClick={() => handleDeleteGoal(goal.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {goal.plan_of_action && (
                    <div className="mb-2 p-2 bg-blue-50 rounded text-xs text-slate-700">
                      <span className="font-semibold">Plan:</span> {goal.plan_of_action}
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Progress</span>
                      <span className="font-semibold">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  
                  {goal.notes && (
                    <div className="mt-2 p-2 bg-slate-100 rounded text-xs text-slate-600">
                      {goal.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={editingGoal !== null} onOpenChange={() => setEditingGoal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Goal Details</DialogTitle>
          </DialogHeader>
          {editingGoal && (
            <div className="space-y-4 mt-4">
              <div>
                <Label>Description</Label>
                <Input 
                  value={editingGoal.description} 
                  onChange={(e) => setEditingGoal({...editingGoal, description: e.target.value})}
                />
              </div>
              <div>
                <Label>Plan of Action</Label>
                <Textarea 
                  value={editingGoal.plan_of_action || ''} 
                  onChange={(e) => setEditingGoal({...editingGoal, plan_of_action: e.target.value})}
                  rows={3}
                  placeholder="What specific actions will you take to achieve this goal?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Suggested Start Date</Label>
                  <Input 
                    type="date" 
                    value={editingGoal.suggested_start_date || ''} 
                    onChange={(e) => setEditingGoal({...editingGoal, suggested_start_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Actual Start Date</Label>
                  <Input 
                    type="date" 
                    value={editingGoal.start_date || ''} 
                    onChange={(e) => setEditingGoal({...editingGoal, start_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Suggested Completion Date</Label>
                  <Input 
                    type="date" 
                    value={editingGoal.suggested_completion_date || ''} 
                    onChange={(e) => setEditingGoal({...editingGoal, suggested_completion_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Actual Completion Date</Label>
                  <Input 
                    type="date" 
                    value={editingGoal.completion_date || ''} 
                    onChange={(e) => setEditingGoal({...editingGoal, completion_date: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label>Progress (%)</Label>
                <div className="flex items-center gap-3">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={editingGoal.progress || 0}
                    onChange={(e) => setEditingGoal({...editingGoal, progress: parseInt(e.target.value)})}
                    className="flex-1"
                  />
                  <span className="text-lg font-bold text-emerald-600 w-12">{editingGoal.progress || 0}%</span>
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea 
                  value={editingGoal.notes || ''} 
                  onChange={(e) => setEditingGoal({...editingGoal, notes: e.target.value})}
                  rows={3}
                  placeholder="Additional notes or reflections"
                />
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setEditingGoal(null)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    handleUpdateGoalField(editingGoal.id, 'description', editingGoal.description);
                    handleUpdateGoalField(editingGoal.id, 'plan_of_action', editingGoal.plan_of_action);
                    handleUpdateGoalField(editingGoal.id, 'suggested_start_date', editingGoal.suggested_start_date);
                    handleUpdateGoalField(editingGoal.id, 'start_date', editingGoal.start_date);
                    handleUpdateGoalField(editingGoal.id, 'suggested_completion_date', editingGoal.suggested_completion_date);
                    handleUpdateGoalField(editingGoal.id, 'completion_date', editingGoal.completion_date);
                    handleUpdateGoalField(editingGoal.id, 'progress', editingGoal.progress);
                    handleUpdateGoalField(editingGoal.id, 'notes', editingGoal.notes);
                    setEditingGoal(null);
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Select SMART Goals from Knowledge Bank</DialogTitle>
            <p className="text-xs text-slate-600">Choose up to 5 goals to focus on ({selectedGoals.length}/5 selected)</p>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <Label>Position</Label>
              <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(POSITION_KNOWLEDGE).map(pos => (
                    <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {positionKnowledge && (
              <ScrollArea className="h-[60vh] border rounded-lg">
                <div className="p-4 grid md:grid-cols-2 gap-3">
                  {Object.entries(positionKnowledge.categories).map(([categoryKey, category]) => (
                    <div key={categoryKey} className={`rounded-xl overflow-hidden shadow-md border-2 ${categoryKey.includes('attacking') ? 'border-emerald-200' : 'border-red-200'}`}>
                      <div className={`bg-gradient-to-r ${categoryColors[categoryKey]} p-3 text-white`}>
                        <h3 className="font-bold text-sm">{category.title}</h3>
                      </div>
                      <div className="bg-white p-3 space-y-2">
                        {category.points.map((point, idx) => {
                          const goalKey = `${categoryKey}|||${point}`;
                          const isSelected = selectedGoals.includes(goalKey);
                          const isDisabled = !isSelected && selectedGoals.length >= 5;
                          
                          return (
                            <div key={idx} className={`flex items-start gap-2 p-2 rounded ${isSelected ? 'bg-emerald-50' : isDisabled ? 'opacity-40' : 'hover:bg-slate-50'}`}>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => handleToggleGoal(categoryKey, point)}
                                disabled={isDisabled}
                                className="mt-0.5"
                              />
                              <span className="text-xs leading-relaxed">{point}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {!positionKnowledge && (
              <div className="text-center py-8 text-slate-500">
                <p className="text-sm">Please select a position to see available goals</p>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleSaveGoals} 
                disabled={selectedGoals.length === 0}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                Add {selectedGoals.length} Goal{selectedGoals.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}