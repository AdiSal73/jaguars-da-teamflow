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
import { Target, Plus, Trash2, CheckCircle, BookOpen, MessageSquare, ChevronDown, ChevronUp, TrendingUp, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { POSITION_KNOWLEDGE_BANK, PHYSICAL_ASSESSMENTS } from '../constants/positionKnowledgeBank';
import AIGoalGenerator from './AIGoalGenerator';
import AITrainingPlanButton from './AITrainingPlanButton';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function PlayerDevelopmentDisplay({ 
  player, 
  pathway, 
  onUpdatePlayer, 
  onUpdatePathway, 
  onProvideFeedback,
  assessments,
  evaluations,
  isAdminOrCoach
}) {
  const queryClient = useQueryClient();
  const [showAddGoalDialog, setShowAddGoalDialog] = useState(false);
  const [showEditGoalDialog, setShowEditGoalDialog] = useState(false);
  const [showAddModuleDialog, setShowAddModuleDialog] = useState(false);
  const [showEditModuleDialog, setShowEditModuleDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [editingModule, setEditingModule] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('skill');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [customSkill, setCustomSkill] = useState('');
  const [expandedGoals, setExpandedGoals] = useState(new Set());
  
  const [newGoal, setNewGoal] = useState({
    description: '',
    plan_of_action: '',
    start_date: '',
    suggested_completion_date: '',
    progress: 0,
    notes: '',
    category: 'Technical',
    completed: false
  });

  const [newModule, setNewModule] = useState({
    title: '',
    description: '',
    resource_link: '',
    priority: 'Medium',
    training_type: 'Technical Training',
    weekly_sessions: 2,
    number_of_weeks: 4,
    session_duration: 60,
    start_date: '',
    end_date: '',
    preventative_measures: ''
  });



  const getPositionSkills = () => {
    if (!player.primary_position) return [];
    const positionKnowledge = POSITION_KNOWLEDGE_BANK[player.primary_position];
    if (!positionKnowledge) return [];
    
    const allSkills = [];
    
    if (positionKnowledge.defending) {
      Object.values(positionKnowledge.defending).forEach(phaseArray => {
        phaseArray.forEach(item => {
          if (item.points) {
            item.points.forEach(point => {
              allSkills.push({ skill_name: point });
            });
          }
        });
      });
    }
    
    if (positionKnowledge.attacking) {
      Object.values(positionKnowledge.attacking).forEach(phaseArray => {
        phaseArray.forEach(item => {
          if (item.points) {
            item.points.forEach(point => {
              allSkills.push({ skill_name: point });
            });
          }
        });
      });
    }
    
    return allSkills;
  };

  const positionSkills = pathway?.skill_matrix?.length > 0 ? pathway.skill_matrix : getPositionSkills();
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
    onUpdatePlayer({ goals: updatedGoals });
    resetGoalForm();
  };

  const handleUpdateGoal = () => {
    const updatedGoals = player.goals.map(g => g.id === editingGoal.id ? editingGoal : g);
    onUpdatePlayer({ goals: updatedGoals });
    setEditingGoal(null);
    setShowEditGoalDialog(false);
  };

  const handleDeleteGoal = (goalId) => {
    const updatedGoals = player.goals.filter(g => g.id !== goalId);
    onUpdatePlayer({ goals: updatedGoals });
  };

  const handleProgressChange = (goalId, progress) => {
    const updatedGoals = player.goals.map(g => {
      if (g.id === goalId) {
        const nowCompleted = progress >= 100;
        
        const updated = { 
          ...g, 
          progress, 
          completed: nowCompleted,
          completion_date: nowCompleted && !g.completion_date ? new Date().toISOString().split('T')[0] : g.completion_date
        };

        if (nowCompleted && !g.completed) {
          toast.success('Goal completed! 🎉');
        }
        
        return updated;
      }
      return g;
    });
    onUpdatePlayer({ goals: updatedGoals });
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

  const resetGoalForm = () => {
    setShowAddGoalDialog(false);
    setSelectedSkill('');
    setCustomSkill('');
    setNewGoal({
      description: '',
      plan_of_action: '',
      start_date: '',
      suggested_completion_date: '',
      progress: 0,
      notes: '',
      category: 'Technical',
      completed: false
    });
  };

  const handleAddModule = () => {
    const module = {
      id: `module_${Date.now()}`,
      ...newModule,
      completed: false,
      auto_suggested: false
    };
    const updatedModules = [...(pathway.training_modules || []), module];
    onUpdatePathway({ training_modules: updatedModules });
    setShowAddModuleDialog(false);
    setNewModule({
      title: '',
      description: '',
      resource_link: '',
      priority: 'Medium',
      training_type: 'Technical Training',
      weekly_sessions: 2,
      number_of_weeks: 4,
      session_duration: 60,
      start_date: '',
      end_date: '',
      preventative_measures: ''
    });
  };

  const handleUpdateModule = () => {
    const updatedModules = pathway.training_modules.map(m => m.id === editingModule.id ? editingModule : m);
    onUpdatePathway({ training_modules: updatedModules });
    setEditingModule(null);
    setShowEditModuleDialog(false);
  };

  const handleToggleModule = (moduleId) => {
    const module = pathway.training_modules.find(m => m.id === moduleId);
    const nowCompleted = !module?.completed;

    const updatedModules = pathway.training_modules.map(m => {
      if (m.id === moduleId) {
        return { ...m, completed: nowCompleted };
      }
      return m;
    });
    onUpdatePathway({ training_modules: updatedModules });

    if (nowCompleted && !module?.completed) {
      toast.success('Training module completed! 💪');
    }
  };

  const handleDeleteModule = (moduleId) => {
    const updatedModules = pathway.training_modules.filter(m => m.id !== moduleId);
    onUpdatePathway({ training_modules: updatedModules });
  };

  const getAutoProgress = (goal) => {
    if (!assessments || assessments.length < 2) return null;
    
    const latest = assessments[0];
    const previous = assessments[1];
    const descriptionLower = goal.description.toLowerCase();
    
    if (descriptionLower.includes('speed') || descriptionLower.includes('sprint')) {
      if (latest.speed_score > previous.speed_score) {
        return { improved: true, delta: latest.speed_score - previous.speed_score };
      }
    }
    if (descriptionLower.includes('power') || descriptionLower.includes('jump')) {
      if (latest.power_score > previous.power_score) {
        return { improved: true, delta: latest.power_score - previous.power_score };
      }
    }
    if (descriptionLower.includes('endurance') || descriptionLower.includes('fitness')) {
      if (latest.endurance_score > previous.endurance_score) {
        return { improved: true, delta: latest.endurance_score - previous.endurance_score };
      }
    }
    if (descriptionLower.includes('agility')) {
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
    <>
      {/* Player Development Pathway (Goals) */}
      <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-50 to-blue-50">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-600" />
                Player Development Pathway ({player.goals?.length || 0})
              </CardTitle>
              <p className="text-xs text-slate-600 mt-1">SMART Goals to help you track your progress and stay focused on your development journey.</p>
            </div>
            <div className="flex gap-2">
              {isAdminOrCoach && (
                <AIGoalGenerator 
                  player={player} 
                  onUpdatePlayer={onUpdatePlayer} 
                  assessments={assessments}
                  evaluations={evaluations}
                />
              )}
              <Button onClick={() => setShowAddGoalDialog(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-1" />
                Add Goal
              </Button>
            </div>
          </div>
        </CardHeader>
          <CardContent className="p-4">
            {sortedGoals.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No development goals set yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
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
                            : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm text-slate-900">{goal.description}</h4>
                              {goal.completed && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                              {autoProgress?.improved && (
                                <Badge className="bg-emerald-500 text-white text-[9px]">
                                  <TrendingUp className="w-3 h-3 mr-1" />
                                  +{autoProgress.delta.toFixed(0)}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1 mb-2">
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
                              className="h-6 w-6"
                            >
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </Button>
                            {onProvideFeedback && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onProvideFeedback(goal)}
                                className="h-6 w-6 hover:bg-blue-50"
                              >
                                <MessageSquare className="w-3 h-3" />
                              </Button>
                            )}
                            {isAdminOrCoach && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setEditingGoal(goal); setShowEditGoalDialog(true); }}
                                className="h-6 w-6"
                              >
                                <Target className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteGoal(goal.id)}
                              className="h-6 w-6 hover:bg-red-50 hover:text-red-600"
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
                          <div className="mt-2">
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
        </Card>

      {/* Add Goal Dialog */}
      <Dialog open={showAddGoalDialog} onOpenChange={(open) => !open && resetGoalForm()}>
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
                <Label className="mb-3 block">Select Skill from Knowledge Bank {player.primary_position && `(${player.primary_position})`}</Label>
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
                  <div className="text-sm text-slate-500 p-4 text-center border rounded-lg bg-amber-50 border-amber-200">
                    <p className="mb-2">No position-specific skills available.</p>
                    <p className="text-xs">Use custom skill input below to create your own goals.</p>
                  </div>
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
              <Label>Plan of Action</Label>
              <Textarea 
                value={newGoal.plan_of_action} 
                onChange={e => setNewGoal({...newGoal, plan_of_action: e.target.value})}
                rows={2}
                placeholder="How will you achieve this goal?"
              />
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
              <Button variant="outline" onClick={resetGoalForm} className="flex-1">Cancel</Button>
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

      {/* Edit Goal Dialog */}
      <Dialog open={showEditGoalDialog} onOpenChange={setShowEditGoalDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
          </DialogHeader>
          {editingGoal && (
            <div className="space-y-4 mt-4">
              <div>
                <Label>Goal Description *</Label>
                <Input 
                  value={editingGoal.description || ''} 
                  onChange={e => setEditingGoal({...editingGoal, description: e.target.value})}
                  placeholder="Goal description"
                />
              </div>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input 
                    type="date" 
                    value={editingGoal.start_date || ''} 
                    onChange={e => setEditingGoal({...editingGoal, start_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Target Date</Label>
                  <Input 
                    type="date" 
                    value={editingGoal.suggested_completion_date || ''} 
                    onChange={e => setEditingGoal({...editingGoal, suggested_completion_date: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={editingGoal.category || 'Technical'} onValueChange={v => setEditingGoal({...editingGoal, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Tactical">Tactical</SelectItem>
                    <SelectItem value="Physical">Physical</SelectItem>
                    <SelectItem value="Mental">Mental</SelectItem>
                  </SelectContent>
                </Select>
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
                <Button variant="outline" onClick={() => setShowEditGoalDialog(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleUpdateGoal} className="flex-1 bg-emerald-600 hover:bg-emerald-700">Save</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>



    </>
  );
}