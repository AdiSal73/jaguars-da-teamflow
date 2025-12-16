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
import { POSITION_KNOWLEDGE, PHYSICAL_ASSESSMENTS } from '../constants/positionKnowledgeBank';

export default function PlayerDevelopmentDisplay({ 
  player, 
  pathway, 
  onUpdatePlayer, 
  onUpdatePathway, 
  onProvideFeedback,
  assessments 
}) {
  const [showAddGoalDialog, setShowAddGoalDialog] = useState(false);
  const [showEditGoalDialog, setShowEditGoalDialog] = useState(false);
  const [showAddModuleDialog, setShowAddModuleDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
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
    end_date: ''
  });

  // Get skills from player's position knowledge bank
  const getPositionSkills = () => {
    if (!player.primary_position) return [];
    const positionKnowledge = POSITION_KNOWLEDGE[player.primary_position];
    if (!positionKnowledge) return [];
    
    const allSkills = [];
    const categories = positionKnowledge.categories;
    if (categories) {
      Object.keys(categories).forEach(phaseKey => {
        const phase = categories[phaseKey];
        if (phase.points) {
          phase.points.forEach(point => {
            allSkills.push({ skill_name: point });
          });
        }
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
        return { 
          ...g, 
          progress, 
          completed: progress >= 100,
          completion_date: progress >= 100 && !g.completion_date ? new Date().toISOString().split('T')[0] : g.completion_date
        };
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
      end_date: ''
    });
  };

  const handleToggleModule = (moduleId) => {
    const updatedModules = pathway.training_modules.map(m => {
      if (m.id === moduleId) {
        return { ...m, completed: !m.completed };
      }
      return m;
    });
    onUpdatePathway({ training_modules: updatedModules });
  };

  const handleDeleteModule = (moduleId) => {
    const updatedModules = pathway.training_modules.filter(m => m.id !== moduleId);
    onUpdatePathway({ training_modules: updatedModules });
  };

  const getAutoProgress = (goal) => {
    if (!assessments || assessments.length < 2) return null;
    
    const latest = assessments[0];
    const previous = assessments[1];
    
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
    <div className="grid md:grid-cols-2 gap-6">
      {/* Player Development Pathway (Goals) */}
      <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-50 to-blue-50">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-600" />
              Player Development Pathway ({player.goals?.length || 0})
            </CardTitle>
            <Button onClick={() => setShowAddGoalDialog(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-1" />
              Add Goal
            </Button>
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
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setEditingGoal(goal); setShowEditGoalDialog(true); }}
                            className="h-6 w-6"
                          >
                            <Target className="w-3 h-3" />
                          </Button>
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

      {/* Training Modules */}
      <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-purple-50">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Training Modules
            </CardTitle>
            <div className="flex items-center gap-2">
              <Link to={`${createPageUrl('AITrainingPlanGenerator')}?playerId=${player.id}`}>
                <Button size="sm" variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                  <Target className="w-4 h-4 mr-1" />
                  AI Generate
                </Button>
              </Link>
              <Button onClick={() => setShowAddModuleDialog(true)} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-1" />
                Add Module
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {!pathway || pathway.training_modules?.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm mb-3">No training modules yet</p>
              <Link to={createPageUrl('FitnessResources')}>
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View Fitness Resources
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {pathway.training_modules?.map(module => (
                <div key={module.id} className={`p-3 rounded-lg border ${module.completed ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1">
                      <button onClick={() => handleToggleModule(module.id)} className="mt-1">
                        {module.completed ? (
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-slate-900">{module.title}</h4>
                          {module.auto_suggested && <Badge className="text-[8px] bg-purple-100 text-purple-700">Auto</Badge>}
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{module.description}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge className={`text-[9px] ${module.priority === 'High' ? 'bg-red-100 text-red-800' : module.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                            {module.priority}
                          </Badge>
                          {module.training_type && (
                            <Badge className="text-[9px] bg-indigo-100 text-indigo-800">{module.training_type}</Badge>
                          )}
                          {module.weekly_sessions && (
                            <span className="text-xs text-slate-600">{module.weekly_sessions}x/week</span>
                          )}
                          {module.number_of_weeks && (
                            <span className="text-xs text-slate-600">• {module.number_of_weeks} weeks</span>
                          )}
                          {module.session_duration && (
                            <span className="text-xs text-slate-600">• {module.session_duration}min</span>
                          )}
                          {module.resource_link && (
                            <a href={module.resource_link.startsWith('/') ? createPageUrl(module.resource_link.replace('/', '')) : module.resource_link} target={module.resource_link.startsWith('http') ? '_blank' : ''} rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" />
                              Resource
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-red-50 hover:text-red-600" onClick={() => handleDeleteModule(module.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
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
              <Label>Brief Description</Label>
              <Textarea 
                value={newGoal.plan_of_action} 
                onChange={e => setNewGoal({...newGoal, plan_of_action: e.target.value})}
                rows={2}
                placeholder="Brief overview of what this goal entails..."
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
                <Button variant="outline" onClick={() => setShowEditGoalDialog(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleUpdateGoal} className="flex-1 bg-emerald-600 hover:bg-emerald-700">Save</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Module Dialog */}
      <Dialog open={showAddModuleDialog} onOpenChange={setShowAddModuleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Training Module</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Title *</Label>
              <Input value={newModule.title} onChange={e => setNewModule({...newModule, title: e.target.value})} placeholder="e.g., 90Min Fitness Week 1" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={newModule.description} onChange={e => setNewModule({...newModule, description: e.target.value})} rows={2} placeholder="Brief overview of the module" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Training Type *</Label>
                <Select value={newModule.training_type} onValueChange={v => setNewModule({...newModule, training_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mobility Training">Mobility Training</SelectItem>
                    <SelectItem value="Technical Training">Technical Training</SelectItem>
                    <SelectItem value="Functional Training">Functional Training</SelectItem>
                    <SelectItem value="Video Analysis/Tactical Training">Video Analysis/Tactical</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={newModule.priority} onValueChange={v => setNewModule({...newModule, priority: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Sessions/Week</Label>
                <Input type="number" min="1" max="7" value={newModule.weekly_sessions} onChange={e => setNewModule({...newModule, weekly_sessions: parseInt(e.target.value)})} />
              </div>
              <div>
                <Label>Number of Weeks</Label>
                <Input type="number" min="1" value={newModule.number_of_weeks} onChange={e => setNewModule({...newModule, number_of_weeks: parseInt(e.target.value)})} />
              </div>
              <div>
                <Label>Duration (min)</Label>
                <Input type="number" min="15" step="15" value={newModule.session_duration} onChange={e => setNewModule({...newModule, session_duration: parseInt(e.target.value)})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={newModule.start_date} onChange={e => setNewModule({...newModule, start_date: e.target.value})} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={newModule.end_date} onChange={e => setNewModule({...newModule, end_date: e.target.value})} />
              </div>
            </div>
            <div>
              <Label>Resource Link</Label>
              <Input value={newModule.resource_link} onChange={e => setNewModule({...newModule, resource_link: e.target.value})} placeholder="/fitness-resources or https://..." />
            </div>
            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowAddModuleDialog(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleAddModule} disabled={!newModule.title} className="flex-1 bg-blue-600 hover:bg-blue-700">Add Module</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}