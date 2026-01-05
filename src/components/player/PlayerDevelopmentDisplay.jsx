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
import { calculatePoints, checkBadgeEarned } from '../gamification/BadgeSystem';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import BadgeEarnedDialog from '../gamification/BadgeEarnedDialog';

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
  const [earnedBadge, setEarnedBadge] = useState(null);
  
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

  // Fetch player progress
  const { data: playerProgress } = useQuery({
    queryKey: ['playerProgress', player.id],
    queryFn: async () => {
      const progress = await base44.entities.PlayerProgress.filter({ player_id: player.id });
      return progress[0] || null;
    }
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ action, points }) => {
      let currentProgress = playerProgress;

      if (!currentProgress) {
        // Create initial progress if none exists
        currentProgress = await base44.entities.PlayerProgress.create({
          player_id: player.id,
          total_points: 0,
          level: 1,
          badges: [],
          achievements: {
            goals_completed: 0,
            modules_completed: 0,
            assessments_taken: 0,
            evaluations_received: 0,
            streak_days: 0,
            longest_streak: 0
          },
          last_activity_date: new Date().toISOString().split('T')[0]
        });
      }

      const newPoints = (currentProgress.total_points || 0) + points;
      const newLevel = Math.floor(newPoints / 100) + 1;
      const achievements = { ...(currentProgress.achievements || {}) };

      if (action === 'goal_completed') achievements.goals_completed = (achievements.goals_completed || 0) + 1;
      if (action === 'module_completed') achievements.modules_completed = (achievements.modules_completed || 0) + 1;

      const updatedProgressData = {
        total_points: newPoints,
        level: newLevel,
        achievements,
        last_activity_date: new Date().toISOString().split('T')[0]
      };

      const existingBadges = currentProgress.badges || [];
      const newBadges = checkBadgeEarned({ ...currentProgress, ...updatedProgressData }, action, existingBadges);
      
      if (newBadges.length > 0) {
        const badgeWithDate = newBadges.map(b => ({
          ...b,
          earned_date: new Date().toISOString().split('T')[0]
        }));
        updatedProgressData.badges = [...existingBadges, ...badgeWithDate];
        updatedProgressData.total_points += newBadges.reduce((sum, b) => sum + (b.points || 0), 0);
        setEarnedBadge(badgeWithDate[0]);
      }

      return await base44.entities.PlayerProgress.update(currentProgress.id, updatedProgressData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['playerProgress', player.id]);
    }
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
        const wasCompleted = g.completed;
        const nowCompleted = progress >= 100;
        
        const updated = { 
          ...g, 
          progress, 
          completed: nowCompleted,
          completion_date: nowCompleted && !g.completion_date ? new Date().toISOString().split('T')[0] : g.completion_date
        };

        if (!wasCompleted && nowCompleted) {
          const points = calculatePoints('goal_completed');
          updateProgressMutation.mutate({ action: 'goal_completed', points });
          toast.success(`+${points} points! Goal completed! 🎉`);
        } else if (!g.completed && !nowCompleted) {
          if (progress === 25 && g.progress < 25) {
            const points = calculatePoints('goal_progress_25');
            updateProgressMutation.mutate({ action: 'goal_progress_25', points });
            toast.success(`+${points} points for reaching 25% progress!`);
          } else if (progress === 50 && g.progress < 50) {
            const points = calculatePoints('goal_progress_50');
            updateProgressMutation.mutate({ action: 'goal_progress_50', points });
            toast.success(`+${points} points for reaching 50% progress!`);
          } else if (progress === 75 && g.progress < 75) {
            const points = calculatePoints('goal_progress_75');
            updateProgressMutation.mutate({ action: 'goal_progress_75', points });
            toast.success(`+${points} points for reaching 75% progress!`);
          }
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
    const wasCompleted = module?.completed;
    const nowCompleted = !wasCompleted;

    const updatedModules = pathway.training_modules.map(m => {
      if (m.id === moduleId) {
        return { ...m, completed: nowCompleted };
      }
      return m;
    });
    onUpdatePathway({ training_modules: updatedModules });

    if (!wasCompleted && nowCompleted) {
      const points = calculatePoints('module_completed');
      updateProgressMutation.mutate({ action: 'module_completed', points });
      toast.success(`+${points} points! Training module completed! 💪`);
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
      <div className="grid md:grid-cols-2 gap-6">
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

        {/* Training Modules */}
        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-purple-50">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  Training Modules
                </CardTitle>
                <p className="text-xs text-slate-600 mt-1">Training with intent is the most efficient way to improve. Use your teams sessions or extra practices to work on your game with purpose and intent.</p>
              </div>
              <div className="flex items-center gap-2">
                {isAdminOrCoach && (
                  <AITrainingPlanButton 
                    player={player}
                    pathway={pathway}
                    evaluations={evaluations}
                    onUpdatePathway={onUpdatePathway}
                  />
                )}
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
                          {module.preventative_measures && (
                            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                              <div className="text-[10px] font-semibold text-amber-900 mb-1">🛡️ Injury Prevention:</div>
                              <p className="text-xs text-amber-800">{module.preventative_measures}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {isAdminOrCoach && (
                          <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-blue-50" onClick={() => { setEditingModule(module); setShowEditModuleDialog(true); }}>
                            <BookOpen className="w-3 h-3" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-red-50 hover:text-red-600" onClick={() => handleDeleteModule(module.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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

      {/* Edit Module Dialog */}
      <Dialog open={showEditModuleDialog} onOpenChange={setShowEditModuleDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Training Module</DialogTitle>
          </DialogHeader>
          {editingModule && (
            <div className="space-y-4 mt-4">
              <div>
                <Label>Title *</Label>
                <Input value={editingModule.title} onChange={e => setEditingModule({...editingModule, title: e.target.value})} placeholder="e.g., 90Min Fitness Week 1" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={editingModule.description} onChange={e => setEditingModule({...editingModule, description: e.target.value})} rows={2} placeholder="Brief overview of the module" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Training Type *</Label>
                  <Select value={editingModule.training_type} onValueChange={v => setEditingModule({...editingModule, training_type: v})}>
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
                  <Select value={editingModule.priority} onValueChange={v => setEditingModule({...editingModule, priority: v})}>
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
                  <Input type="number" min="1" max="7" value={editingModule.weekly_sessions} onChange={e => setEditingModule({...editingModule, weekly_sessions: parseInt(e.target.value)})} />
                </div>
                <div>
                  <Label>Number of Weeks</Label>
                  <Input type="number" min="1" value={editingModule.number_of_weeks} onChange={e => setEditingModule({...editingModule, number_of_weeks: parseInt(e.target.value)})} />
                </div>
                <div>
                  <Label>Duration (min)</Label>
                  <Input type="number" min="15" step="15" value={editingModule.session_duration} onChange={e => setEditingModule({...editingModule, session_duration: parseInt(e.target.value)})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input type="date" value={editingModule.start_date} onChange={e => setEditingModule({...editingModule, start_date: e.target.value})} />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input type="date" value={editingModule.end_date} onChange={e => setEditingModule({...editingModule, end_date: e.target.value})} />
                </div>
              </div>
              <div>
                <Label>Resource Link</Label>
                <Input value={editingModule.resource_link} onChange={e => setEditingModule({...editingModule, resource_link: e.target.value})} placeholder="/fitness-resources or https://..." />
              </div>
              <div>
                <Label>Injury Prevention Measures (Optional)</Label>
                <Textarea 
                  value={editingModule.preventative_measures} 
                  onChange={e => setEditingModule({...editingModule, preventative_measures: e.target.value})} 
                  rows={2} 
                  placeholder="e.g., Include dynamic warm-up, focus on proper landing mechanics, strengthen stabilizing muscles..." 
                />
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowEditModuleDialog(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleUpdateModule} disabled={!editingModule.title} className="flex-1 bg-blue-600 hover:bg-blue-700">Save</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Module Dialog */}
      <Dialog open={showAddModuleDialog} onOpenChange={setShowAddModuleDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
            <div>
              <Label>Injury Prevention Measures (Optional)</Label>
              <Textarea 
                value={newModule.preventative_measures} 
                onChange={e => setNewModule({...newModule, preventative_measures: e.target.value})} 
                rows={2} 
                placeholder="e.g., Include dynamic warm-up, focus on proper landing mechanics, strengthen stabilizing muscles..." 
              />
            </div>
            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowAddModuleDialog(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleAddModule} disabled={!newModule.title} className="flex-1 bg-blue-600 hover:bg-blue-700">Add Module</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BadgeEarnedDialog 
        badge={earnedBadge} 
        open={!!earnedBadge} 
        onClose={() => setEarnedBadge(null)} 
      />
    </>
  );
}