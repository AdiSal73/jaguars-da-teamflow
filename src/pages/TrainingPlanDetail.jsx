import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, CheckCircle, Circle, Trash2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function TrainingPlanDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const planId = urlParams.get('id');

  const [showExerciseDialog, setShowExerciseDialog] = useState(false);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackTarget, setFeedbackTarget] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [replyText, setReplyText] = useState('');

  const [newExercise, setNewExercise] = useState({
    name: '',
    description: '',
    type: 'Technical',
    sets: 3,
    reps: 10,
    duration: 30,
    completed: false,
    feedback: []
  });

  const [newGoal, setNewGoal] = useState({
    goal: '',
    target_value: 0,
    current_value: 0,
    completed: false,
    feedback: []
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: plan } = useQuery({
    queryKey: ['trainingPlan', planId],
    queryFn: async () => {
      const plans = await base44.entities.TrainingPlan.list();
      return plans.find(p => p.id === planId);
    },
    enabled: !!planId
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TrainingPlan.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['trainingPlan', planId]);
      queryClient.invalidateQueries(['trainingPlans']);
    }
  });

  const handleAddExercise = () => {
    const exercises = [...(plan.exercises || []), { ...newExercise, id: Date.now().toString() }];
    updatePlanMutation.mutate({ 
      id: planId, 
      data: { exercises }
    });
    setShowExerciseDialog(false);
    setNewExercise({ name: '', description: '', type: 'Technical', sets: 3, reps: 10, duration: 30, completed: false, feedback: [] });
  };

  const handleToggleExercise = (exerciseId) => {
    const exercises = plan.exercises.map(ex => 
      ex.id === exerciseId 
        ? { ...ex, completed: !ex.completed, completed_date: !ex.completed ? new Date().toISOString() : null }
        : ex
    );
    const completedCount = exercises.filter(ex => ex.completed).length;
    const progress = Math.round((completedCount / exercises.length) * 100);
    
    updatePlanMutation.mutate({ 
      id: planId, 
      data: { exercises, progress }
    });
  };

  const handleDeleteExercise = (exerciseId) => {
    const exercises = plan.exercises.filter(ex => ex.id !== exerciseId);
    const completedCount = exercises.filter(ex => ex.completed).length;
    const progress = exercises.length > 0 ? Math.round((completedCount / exercises.length) * 100) : 0;
    
    updatePlanMutation.mutate({ 
      id: planId, 
      data: { exercises, progress }
    });
  };

  const handleAddGoal = () => {
    const goals = [...(plan.goals || []), { ...newGoal, id: Date.now().toString() }];
    updatePlanMutation.mutate({ 
      id: planId, 
      data: { goals }
    });
    setShowGoalDialog(false);
    setNewGoal({ goal: '', target_value: 0, current_value: 0, completed: false, feedback: [] });
  };

  const handleUpdateGoalProgress = (goalId, currentValue) => {
    const goals = plan.goals.map(g => {
      if (g.id === goalId) {
        const completed = currentValue >= g.target_value;
        return { ...g, current_value: currentValue, completed };
      }
      return g;
    });
    
    updatePlanMutation.mutate({ 
      id: planId, 
      data: { goals }
    });
  };

  const handleAddFeedback = () => {
    if (!feedbackTarget || !feedbackText) return;

    const feedback = {
      id: Date.now().toString(),
      sender_id: user.id,
      sender_name: user.full_name || user.email,
      message: feedbackText,
      timestamp: new Date().toISOString(),
      replies: []
    };

    if (feedbackTarget.type === 'exercise') {
      const exercises = plan.exercises.map(ex => 
        ex.id === feedbackTarget.id 
          ? { ...ex, feedback: [...(ex.feedback || []), feedback] }
          : ex
      );
      updatePlanMutation.mutate({ id: planId, data: { exercises } });
    } else if (feedbackTarget.type === 'goal') {
      const goals = plan.goals.map(g => 
        g.id === feedbackTarget.id 
          ? { ...g, feedback: [...(g.feedback || []), feedback] }
          : g
      );
      updatePlanMutation.mutate({ id: planId, data: { goals } });
    }

    setShowFeedbackDialog(false);
    setFeedbackText('');
    setFeedbackTarget(null);
  };

  const handleReplyToFeedback = (itemType, itemId, feedbackId) => {
    if (!replyText) return;

    const reply = {
      sender_id: user.id,
      sender_name: user.full_name || user.email,
      message: replyText,
      timestamp: new Date().toISOString()
    };

    if (itemType === 'exercise') {
      const exercises = plan.exercises.map(ex => {
        if (ex.id === itemId) {
          const feedback = (ex.feedback || []).map(fb => 
            fb.id === feedbackId 
              ? { ...fb, replies: [...(fb.replies || []), reply] }
              : fb
          );
          return { ...ex, feedback };
        }
        return ex;
      });
      updatePlanMutation.mutate({ id: planId, data: { exercises } });
    } else if (itemType === 'goal') {
      const goals = plan.goals.map(g => {
        if (g.id === itemId) {
          const feedback = (g.feedback || []).map(fb => 
            fb.id === feedbackId 
              ? { ...fb, replies: [...(fb.replies || []), reply] }
              : fb
          );
          return { ...g, feedback };
        }
        return g;
      });
      updatePlanMutation.mutate({ id: planId, data: { goals } });
    }

    setReplyText('');
  };

  if (!plan) return null;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <Card className="border-none shadow-lg mb-6">
        <CardHeader className="border-b border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{plan.title}</CardTitle>
              <p className="text-slate-600 mt-2">{plan.description}</p>
              <div className="flex gap-4 mt-4 text-sm text-slate-600">
                <span>Player: <strong>{plan.player_name}</strong></span>
                {plan.coach_name && <span>Coach: <strong>{plan.coach_name}</strong></span>}
                <span>Duration: <strong>{plan.start_date} to {plan.end_date}</strong></span>
              </div>
            </div>
            <Badge className={plan.status === 'Active' ? 'bg-emerald-600' : 'bg-slate-600'}>
              {plan.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-2 text-sm text-slate-600">Overall Progress</div>
          <Progress value={plan.progress || 0} className="h-3" />
          <div className="text-right text-sm text-slate-600 mt-1">{plan.progress || 0}% Complete</div>
        </CardContent>
      </Card>

      <Tabs defaultValue="exercises" className="w-full">
        <TabsList>
          <TabsTrigger value="exercises">Exercises</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="exercises" className="space-y-6 mt-6">
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <div className="flex justify-between items-center">
                <CardTitle>Training Exercises</CardTitle>
                <Button onClick={() => setShowExerciseDialog(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Exercise
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {!plan.exercises || plan.exercises.length === 0 ? (
                <div className="text-center py-12 text-slate-500">No exercises yet</div>
              ) : (
                <div className="space-y-4">
                  {plan.exercises.map(exercise => (
                    <div key={exercise.id} className="p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <button
                            onClick={() => handleToggleExercise(exercise.id)}
                            className="mt-1"
                          >
                            {exercise.completed ? (
                              <CheckCircle className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-400" />
                            )}
                          </button>
                          <div className="flex-1">
                            <h4 className={`font-semibold text-slate-900 ${exercise.completed ? 'line-through' : ''}`}>
                              {exercise.name}
                            </h4>
                            <p className="text-sm text-slate-600 mt-1">{exercise.description}</p>
                            <div className="flex gap-4 mt-2 text-xs text-slate-500">
                              <span>Type: {exercise.type}</span>
                              {exercise.sets && <span>Sets: {exercise.sets}</span>}
                              {exercise.reps && <span>Reps: {exercise.reps}</span>}
                              {exercise.duration && <span>Duration: {exercise.duration}min</span>}
                            </div>
                            {exercise.completed && exercise.completed_date && (
                              <p className="text-xs text-emerald-600 mt-2">
                                Completed on {new Date(exercise.completed_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setFeedbackTarget({ type: 'exercise', id: exercise.id, name: exercise.name });
                              setShowFeedbackDialog(true);
                            }}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteExercise(exercise.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>

                      {exercise.feedback && exercise.feedback.length > 0 && (
                        <div className="ml-8 mt-3 space-y-2 border-t border-slate-200 pt-3">
                          {exercise.feedback.map(fb => (
                            <div key={fb.id} className="bg-blue-50 p-3 rounded-lg">
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-sm font-semibold text-slate-900">{fb.sender_name}</span>
                                <span className="text-xs text-slate-500">{new Date(fb.timestamp).toLocaleString()}</span>
                              </div>
                              <p className="text-sm text-slate-700">{fb.message}</p>
                              
                              {fb.replies && fb.replies.length > 0 && (
                                <div className="mt-2 ml-4 space-y-2">
                                  {fb.replies.map((reply, idx) => (
                                    <div key={idx} className="bg-white p-2 rounded">
                                      <div className="flex justify-between items-start mb-1">
                                        <span className="text-xs font-semibold">{reply.sender_name}</span>
                                        <span className="text-xs text-slate-500">{new Date(reply.timestamp).toLocaleString()}</span>
                                      </div>
                                      <p className="text-xs text-slate-700">{reply.message}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              <div className="mt-2 flex gap-2">
                                <Input
                                  placeholder="Reply..."
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  className="text-sm"
                                />
                                <Button 
                                  size="sm" 
                                  onClick={() => handleReplyToFeedback('exercise', exercise.id, fb.id)}
                                  disabled={!replyText}
                                >
                                  Reply
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6 mt-6">
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <div className="flex justify-between items-center">
                <CardTitle>Training Goals</CardTitle>
                <Button onClick={() => setShowGoalDialog(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Goal
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {!plan.goals || plan.goals.length === 0 ? (
                <div className="text-center py-12 text-slate-500">No goals yet</div>
              ) : (
                <div className="space-y-4">
                  {plan.goals.map(goal => {
                    const progress = goal.target_value > 0 ? (goal.current_value / goal.target_value) * 100 : 0;
                    return (
                      <div key={goal.id} className="p-4 bg-slate-50 rounded-xl">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-slate-900">{goal.goal}</h4>
                              {goal.completed && (
                                <Badge className="bg-emerald-600">Completed</Badge>
                              )}
                            </div>
                            <div className="mb-3">
                              <div className="flex justify-between text-sm text-slate-600 mb-1">
                                <span>Progress</span>
                                <span>{goal.current_value} / {goal.target_value}</span>
                              </div>
                              <Progress value={Math.min(progress, 100)} className="h-2" />
                            </div>
                            <div className="flex gap-2 items-center">
                              <Label className="text-xs">Update Progress:</Label>
                              <Input
                                type="number"
                                value={goal.current_value}
                                onChange={(e) => handleUpdateGoalProgress(goal.id, parseFloat(e.target.value) || 0)}
                                className="w-24 text-sm"
                              />
                            </div>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setFeedbackTarget({ type: 'goal', id: goal.id, name: goal.goal });
                              setShowFeedbackDialog(true);
                            }}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </div>

                        {goal.feedback && goal.feedback.length > 0 && (
                          <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                            {goal.feedback.map(fb => (
                              <div key={fb.id} className="bg-blue-50 p-3 rounded-lg">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="text-sm font-semibold text-slate-900">{fb.sender_name}</span>
                                  <span className="text-xs text-slate-500">{new Date(fb.timestamp).toLocaleString()}</span>
                                </div>
                                <p className="text-sm text-slate-700">{fb.message}</p>
                                
                                {fb.replies && fb.replies.length > 0 && (
                                  <div className="mt-2 ml-4 space-y-2">
                                    {fb.replies.map((reply, idx) => (
                                      <div key={idx} className="bg-white p-2 rounded">
                                        <div className="flex justify-between items-start mb-1">
                                          <span className="text-xs font-semibold">{reply.sender_name}</span>
                                          <span className="text-xs text-slate-500">{new Date(reply.timestamp).toLocaleString()}</span>
                                        </div>
                                        <p className="text-xs text-slate-700">{reply.message}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                <div className="mt-2 flex gap-2">
                                  <Input
                                    placeholder="Reply..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    className="text-sm"
                                  />
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleReplyToFeedback('goal', goal.id, fb.id)}
                                    disabled={!replyText}
                                  >
                                    Reply
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showExerciseDialog} onOpenChange={setShowExerciseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Exercise</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Exercise Name</Label>
              <Input
                value={newExercise.name}
                onChange={(e) => setNewExercise({...newExercise, name: e.target.value})}
                placeholder="e.g., Ball Control Drills"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newExercise.description}
                onChange={(e) => setNewExercise({...newExercise, description: e.target.value})}
                placeholder="Exercise details..."
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={newExercise.type} onValueChange={(value) => setNewExercise({...newExercise, type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Tactical">Tactical</SelectItem>
                  <SelectItem value="Physical">Physical</SelectItem>
                  <SelectItem value="Mental">Mental</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Sets</Label>
                <Input
                  type="number"
                  value={newExercise.sets}
                  onChange={(e) => setNewExercise({...newExercise, sets: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label>Reps</Label>
                <Input
                  type="number"
                  value={newExercise.reps}
                  onChange={(e) => setNewExercise({...newExercise, reps: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label>Duration (min)</Label>
                <Input
                  type="number"
                  value={newExercise.duration}
                  onChange={(e) => setNewExercise({...newExercise, duration: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowExerciseDialog(false)}>Cancel</Button>
            <Button onClick={handleAddExercise} disabled={!newExercise.name} className="bg-emerald-600 hover:bg-emerald-700">
              Add Exercise
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Goal Description</Label>
              <Textarea
                value={newGoal.goal}
                onChange={(e) => setNewGoal({...newGoal, goal: e.target.value})}
                placeholder="What do you want to achieve?"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Target Value</Label>
                <Input
                  type="number"
                  value={newGoal.target_value}
                  onChange={(e) => setNewGoal({...newGoal, target_value: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label>Current Value</Label>
                <Input
                  type="number"
                  value={newGoal.current_value}
                  onChange={(e) => setNewGoal({...newGoal, current_value: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowGoalDialog(false)}>Cancel</Button>
            <Button onClick={handleAddGoal} disabled={!newGoal.goal} className="bg-emerald-600 hover:bg-emerald-700">
              Add Goal
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Provide Feedback</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-sm text-slate-600">Feedback for:</div>
              <div className="font-semibold text-slate-900">{feedbackTarget?.name}</div>
            </div>
            <div>
              <Label>Your Feedback</Label>
              <Textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Enter your feedback..."
                rows={5}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowFeedbackDialog(false)}>Cancel</Button>
            <Button onClick={handleAddFeedback} disabled={!feedbackText} className="bg-emerald-600 hover:bg-emerald-700">
              Send Feedback
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}