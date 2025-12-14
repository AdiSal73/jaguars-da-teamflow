import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Target, Plus, Trash2, CheckCircle, TrendingUp, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { POSITION_KNOWLEDGE, PHYSICAL_ASSESSMENTS } from '../constants/positionKnowledgeBank';

export default function DevelopmentGoalsManager({ pathway, player, assessments, onUpdate, onProvideFeedback }) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('skill');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [customSkill, setCustomSkill] = useState('');
  const [expandedGoals, setExpandedGoals] = useState(new Set());
  
  const [newGoal, setNewGoal] = useState({
    description: '',
    plan_of_action: '',
    suggested_start_date: '',
    start_date: '',
    suggested_completion_date: '',
    completion_date: '',
    progress: 0,
    notes: '',
    category: 'Technical',
    position: player?.primary_position || '',
    completed: false
  });

  // Get available skills from knowledge bank
  const positionSkills = pathway?.skill_matrix || [];
  const physicalCategories = ['Speed', 'Power', 'Endurance', 'Agility'];

  const handleAddGoal = () => {
    const goalDescription = selectedCategory === 'skill' 
      ? (selectedSkill || customSkill)
      : selectedSkill;

    const goal = {
      id: `goal_${Date.now()}`,
      ...newGoal,
      description: goalDescription,
      created_date: new Date().toISOString()
    };

    const updatedGoals = [...(player.goals || []), goal];
    onUpdate({ goals: updatedGoals });
    resetForm();
  };

  const handleUpdateGoal = () => {
    const updatedGoals = player.goals.map(g => g.id === editingGoal.id ? editingGoal : g);
    onUpdate({ goals: updatedGoals });
    setEditingGoal(null);
    setShowEditDialog(false);
  };

  const handleDeleteGoal = (goalId) => {
    const updatedGoals = player.goals.filter(g => g.id !== goalId);
    onUpdate({ goals: updatedGoals });
  };

  const handleProgressChange = (goalId, progress) => {
    const updatedGoals = player.goals.map(g => {
      if (g.id === goalId) {
        return { 
          ...g, 
          progress, 
          completed: progress >= 100,
          completion_date: progress >= 100 && !g.completion_date ? new Date().toISOString().split('T')[0] : g.completion_date
        };
      }
      return g;
    });
    onUpdate({ goals: updatedGoals });
  };

  const toggleExpand = (goalId) => {
    const newExpanded = new Set(expandedGoals);
    if (newExpanded.has(goalId)) {
      newExpanded.delete(goalId);
    } else {
      newExpanded.add(goalId);
    }
    setExpandedGoals(newExpanded);
  };

  const resetForm = () => {
    setShowAddDialog(false);
    setSelectedSkill('');
    setCustomSkill('');
    setNewGoal({
      description: '',
      plan_of_action: '',
      suggested_start_date: '',
      start_date: '',
      suggested_completion_date: '',
      completion_date: '',
      progress: 0,
      notes: '',
      category: 'Technical',
      position: player?.primary_position || '',
      completed: false
    });
  };

  const getAutoProgress = (goal) => {
    if (!assessments || assessments.length < 2) return null;
    
    const latest = assessments[0];
    const previous = assessments[1];
    
    // Check physical improvements
    if (goal.description.toLowerCase().includes('speed') || goal.description.toLowerCase().includes('sprint')) {
      if (latest.speed_score > previous.speed_score) {
        return { improved: true, delta: latest.speed_score - previous.speed_score };
      }
    }
    if (goal.description.toLowerCase().includes('power') || goal.description.toLowerCase().includes('jump')) {
      if (latest.power_score > previous.power_score) {
        return { improved: true, delta: latest.power_score - previous.power_score };
      }
    }
    if (goal.description.toLowerCase().includes('endurance') || goal.description.toLowerCase().includes('fitness')) {
      if (latest.endurance_score > previous.endurance_score) {
        return { improved: true, delta: latest.endurance_score - previous.endurance_score };
      }
    }
    if (goal.description.toLowerCase().includes('agility')) {
      if (latest.agility_score > previous.agility_score) {
        return { improved: true, delta: latest.agility_score - previous.agility_score };
      }
    }
    
    return null;
  };

  const sortedGoals = [...(player.goals || [])].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return b.progress - a.progress;
  });

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-600" />
            Development Goals ({player.goals?.length || 0})
          </CardTitle>
          <Button onClick={() => setShowAddDialog(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-1" />
            Add Goal
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {sortedGoals.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No development goals set yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedGoals.map(goal => {
              const autoProgress = getAutoProgress(goal);
              const isExpanded = expandedGoals.has(goal.id);
              
              return (
                <div 
                  key={goal.id} 
                  className={`rounded-lg border-2 transition-all ${
                    goal.completed 
                      ? 'bg-emerald-50 border-emerald-200' 
                      : goal.progress >= 50 
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-900">{goal.description}</h4>
                          {goal.completed && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                          {autoProgress?.improved && (
                            <Badge className="bg-emerald-500 text-white text-[9px]">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              +{autoProgress.delta.toFixed(0)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge className="text-[9px] bg-purple-100 text-purple-800">{goal.category}</Badge>
                          {goal.start_date && (
                            <span className="text-xs text-slate-500">Started: {new Date(goal.start_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleExpand(goal.id)}
                          className="h-7 w-7"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                        {onProvideFeedback && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onProvideFeedback(goal)}
                            className="h-7 w-7 hover:bg-blue-50"
                          >
                            <MessageSquare className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setEditingGoal(goal); setShowEditDialog(true); }}
                          className="h-7 w-7"
                        >
                          <Target className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="h-7 w-7 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-600">Progress</span>
                        <span className="font-bold text-emerald-600">{goal.progress}%</span>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                      <Input
                        type="range"
                        min="0"
                        max="100"
                        value={goal.progress}
                        onChange={(e) => handleProgressChange(goal.id, parseInt(e.target.value))}
                        className="w-full h-2 accent-emerald-600"
                      />
                    </div>

                    {goal.plan_of_action && (
                      <div className="mb-2">
                        <p className="text-xs text-slate-600 italic">{goal.plan_of_action}</p>
                      </div>
                    )}

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        {goal.notes && (
                          <div>
                            <div className="text-xs font-semibold text-slate-700 mb-1">Notes</div>
                            <p className="text-xs text-slate-600 bg-white p-2 rounded">{goal.notes}</p>
                          </div>
                        )}
                        {goal.completion_date && (
                          <div className="text-xs text-slate-500">
                            Completed: {new Date(goal.completion_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={showAddDialog} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Development Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Goal Type</Label>
              <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setSelectedSkill(''); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="skill">Position Skill</SelectItem>
                  <SelectItem value="physical">Physical Attribute</SelectItem>
                  <SelectItem value="custom">Custom Goal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedCategory === 'skill' && (
              <div>
                <Label className="mb-3 block">Select Skill from Knowledge Bank</Label>
                {positionSkills.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border rounded-lg bg-slate-50">
                    {positionSkills.map((skill, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => { setSelectedSkill(skill.skill_name); setCustomSkill(''); }}
                        className={`p-3 rounded-lg border-2 text-left text-sm transition-all ${
                          selectedSkill === skill.skill_name
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold shadow-md'
                            : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50'
                        }`}
                      >
                        {skill.skill_name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 p-4 text-center border rounded-lg bg-slate-50">
                    No skills in knowledge bank. Create pathway first to populate skill matrix.
                  </p>
                )}
                <div className="mt-3">
                  <Label>Or Create Custom Skill</Label>
                  <Input 
                    value={customSkill} 
                    onChange={e => { setCustomSkill(e.target.value); setSelectedSkill(''); }}
                    placeholder="e.g., Improve weak foot" 
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {selectedCategory === 'physical' && (
              <div>
                <Label className="mb-3 block">Select Physical Attribute</Label>
                <div className="grid grid-cols-2 gap-3">
                  {physicalCategories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedSkill(cat)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        selectedSkill === cat
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
                      }`}
                    >
                      <div className={`font-bold text-sm mb-1 ${selectedSkill === cat ? 'text-blue-900' : 'text-slate-900'}`}>
                        {cat}
                      </div>
                      <div className="text-xs text-slate-600 line-clamp-2">
                        {PHYSICAL_ASSESSMENTS[cat].description}
                      </div>
                    </button>
                  ))}
                </div>
                {selectedSkill && PHYSICAL_ASSESSMENTS[selectedSkill] && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-semibold text-sm text-blue-900 mb-2">{selectedSkill}</p>
                    <p className="text-xs text-blue-800 mb-2">{PHYSICAL_ASSESSMENTS[selectedSkill].description}</p>
                    <div className="text-xs text-blue-700">
                      <div className="font-semibold mb-1">Importance:</div>
                      <p>{PHYSICAL_ASSESSMENTS[selectedSkill].importance}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedCategory === 'custom' && (
              <div>
                <Label>Goal Description *</Label>
                <Input 
                  value={customSkill} 
                  onChange={e => setCustomSkill(e.target.value)}
                  placeholder="e.g., Master corner kicks" 
                />
              </div>
            )}

            <div>
              <Label>Brief Description</Label>
              <Textarea 
                value={newGoal.plan_of_action} 
                onChange={e => setNewGoal({...newGoal, plan_of_action: e.target.value})}
                rows={2}
                placeholder="Brief overview of what this goal entails and why it's important..."
              />
              <p className="text-xs text-slate-500 mt-1">Provide context about this goal and its significance</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input 
                  type="date" 
                  value={newGoal.start_date} 
                  onChange={e => setNewGoal({...newGoal, start_date: e.target.value})}
                />
              </div>
              <div>
                <Label>Target Date</Label>
                <Input 
                  type="date" 
                  value={newGoal.suggested_completion_date} 
                  onChange={e => setNewGoal({...newGoal, suggested_completion_date: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label>Category</Label>
              <Select value={newGoal.category} onValueChange={v => setNewGoal({...newGoal, category: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Tactical">Tactical</SelectItem>
                  <SelectItem value="Physical">Physical</SelectItem>
                  <SelectItem value="Mental">Mental</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={resetForm} className="flex-1">Cancel</Button>
              <Button 
                onClick={handleAddGoal} 
                disabled={!selectedSkill && !customSkill} 
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                Add Goal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
          </DialogHeader>
          {editingGoal && (
            <div className="space-y-4 mt-4">
              <div>
                <Label>Progress (%)</Label>
                <Input 
                  type="number" 
                  min="0" 
                  max="100" 
                  value={editingGoal.progress} 
                  onChange={e => setEditingGoal({...editingGoal, progress: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label>Action Plan</Label>
                <Textarea 
                  value={editingGoal.plan_of_action || ''} 
                  onChange={e => setEditingGoal({...editingGoal, plan_of_action: e.target.value})}
                  rows={3}
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea 
                  value={editingGoal.notes || ''} 
                  onChange={e => setEditingGoal({...editingGoal, notes: e.target.value})}
                  rows={2}
                />
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowEditDialog(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleUpdateGoal} className="flex-1 bg-emerald-600 hover:bg-emerald-700">Save</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}