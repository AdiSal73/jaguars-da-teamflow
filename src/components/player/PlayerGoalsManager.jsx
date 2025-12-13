import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle, Target, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { POSITION_KNOWLEDGE } from '../constants/positionKnowledgeBank';

export default function PlayerGoalsManager({ player, onUpdate, onProvideFeedback }) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState(player.primary_position || '');

  const goals = player.goals || [];
  const positionKnowledge = POSITION_KNOWLEDGE[selectedPosition];

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
    const newGoals = selectedGoals.map(goalKey => {
      const [category, point] = goalKey.split('|||');
      return {
        id: `goal_${Date.now()}_${Math.random()}`,
        description: point,
        category: category,
        position: selectedPosition,
        target_value: 10,
        current_value: 0,
        metric_type: 'rating',
        completed: false,
        created_date: new Date().toISOString()
      };
    });

    onUpdate({ goals: [...goals, ...newGoals] });
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
              const progress = Math.min((goal.current_value / goal.target_value) * 100, 100);
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
                    </div>
                    <div className="flex gap-1">
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
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Progress (1-10 rating)</span>
                      <span className="font-semibold">{goal.current_value} / {goal.target_value}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  
                  {!goal.completed && (
                    <div className="mt-2">
                      <Select 
                        value={String(goal.current_value)} 
                        onValueChange={(val) => handleUpdateProgress(goal.id, parseFloat(val))}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Update progress" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1,2,3,4,5,6,7,8,9,10].map(num => (
                            <SelectItem key={num} value={String(num)}>
                              {num} - {num === 1 ? 'Basic' : num === 2 ? 'Novice' : num === 3 ? 'Beginner' : num === 4 ? 'Adv Beginner' : num === 5 ? 'Intermediate' : num === 6 ? 'Competent' : num === 7 ? 'Advanced' : num === 8 ? 'Accomplished' : num === 9 ? 'Proficient' : 'Expert'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

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