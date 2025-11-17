import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, CheckCircle, Target, Dumbbell, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  const [newExercise, setNewExercise] = useState({
    name: '',
    description: '',
    type: 'Technical',
    sets: 3,
    reps: 10,
    duration: 30,
    completed: false
  });
  const [newGoal, setNewGoal] = useState({
    goal: '',
    target_value: 100,
    current_value: 0,
    completed: false
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
    setNewExercise({
      name: '',
      description: '',
      type: 'Technical',
      sets: 3,
      reps: 10,
      duration: 30,
      completed: false
    });
  };

  const handleAddGoal = () => {
    const goals = [...(plan.goals || []), newGoal];
    updatePlanMutation.mutate({
      id: planId,
      data: { goals }
    });
    setShowGoalDialog(false);
    setNewGoal({
      goal: '',
      target_value: 100,
      current_value: 0,
      completed: false
    });
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
    updatePlanMutation.mutate({
      id: planId,
      data: { exercises }
    });
  };

  const handleUpdateGoalProgress = (goalIndex, value) => {
    const goals = [...plan.goals];
    goals[goalIndex].current_value = value;
    goals[goalIndex].completed = value >= goals[goalIndex].target_value;
    
    updatePlanMutation.mutate({
      id: planId,
      data: { goals }
    });
  };

  if (!plan) return null;

  const completedExercises = plan.exercises?.filter(ex => ex.completed).length || 0;
  const totalExercises = plan.exercises?.length || 0;
  const completedGoals = plan.goals?.filter(g => g.completed).length || 0;
  const totalGoals = plan.goals?.length || 0;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <CardTitle>Plan Overview</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.title}</h3>
                  <p className="text-slate-600 text-sm">{plan.description}</p>
                </div>
                <div>
                  <div className="text-sm text-slate-600 mb-1">Player</div>
                  <div className="font-semibold text-slate-900">{plan.player_name}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 mb-1">Duration</div>
                  <div className="text-sm text-slate-900">
                    {new Date(plan.start_date).toLocaleDateString()} - {new Date(plan.end_date).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">Progress</span>
                    <span className="font-semibold text-emerald-600">{plan.progress || 0}%</span>
                  </div>
                  <Progress value={plan.progress || 0} className="h-3" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-emerald-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-emerald-600">{completedExercises}/{totalExercises}</div>
                    <div className="text-xs text-slate-600 mt-1">Exercises</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">{completedGoals}/{totalGoals}</div>
                    <div className="text-xs text-slate-600 mt-1">Goals</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="exercises" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="exercises">Exercises</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
            </TabsList>

            <TabsContent value="exercises" className="space-y-4">
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex justify-between items-center">
                    <CardTitle>Exercises</CardTitle>
                    <Button onClick={() => setShowExerciseDialog(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Exercise
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {totalExercises === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <Dumbbell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      No exercises added yet
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {plan.exercises.map(exercise => (
                        <div key={exercise.id} className={`p-4 rounded-xl border-2 transition-all ${
                          exercise.completed ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'
                        }`}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <button
                                onClick={() => handleToggleExercise(exercise.id)}
                                className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                  exercise.completed 
                                    ? 'bg-emerald-600 border-emerald-600' 
                                    : 'border-slate-300 hover:border-emerald-500'
                                }`}
                              >
                                {exercise.completed && <CheckCircle className="w-4 h-4 text-white" />}
                              </button>
                              <div className="flex-1">
                                <h4 className={`font-semibold ${exercise.completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                                  {exercise.name}
                                </h4>
                                <p className="text-sm text-slate-600 mt-1">{exercise.description}</p>
                                <div className="flex gap-4 mt-2 text-xs text-slate-500">
                                  <Badge variant="outline">{exercise.type}</Badge>
                                  {exercise.sets && <span>{exercise.sets} sets</span>}
                                  {exercise.reps && <span>{exercise.reps} reps</span>}
                                  {exercise.duration && <span>{exercise.duration} min</span>}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteExercise(exercise.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="goals" className="space-y-4">
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
                  {totalGoals === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      No goals set yet
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {plan.goals.map((goal, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 rounded-xl">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold text-slate-900">{goal.goal}</h4>
                            {goal.completed && (
                              <Badge className="bg-emerald-100 text-emerald-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Completed
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Progress</span>
                              <span className="font-semibold">{goal.current_value}/{goal.target_value}</span>
                            </div>
                            <Progress value={(goal.current_value / goal.target_value) * 100} className="h-2" />
                            <div className="flex gap-2 mt-2">
                              <Input
                                type="number"
                                value={goal.current_value}
                                onChange={(e) => handleUpdateGoalProgress(idx, parseInt(e.target.value))}
                                className="w-24"
                              />
                              <Button size="sm" variant="outline">Update</Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={showExerciseDialog} onOpenChange={setShowExerciseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Exercise</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Exercise Name *</Label>
              <Input
                value={newExercise.name}
                onChange={(e) => setNewExercise({...newExercise, name: e.target.value})}
                placeholder="e.g., Sprint Intervals"
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
                  <SelectItem value="Physical">Physical</SelectItem>
                  <SelectItem value="Tactical">Tactical</SelectItem>
                  <SelectItem value="Mental">Mental</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Sets</Label>
                <Input
                  type="number"
                  value={newExercise.sets}
                  onChange={(e) => setNewExercise({...newExercise, sets: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label>Reps</Label>
                <Input
                  type="number"
                  value={newExercise.reps}
                  onChange={(e) => setNewExercise({...newExercise, reps: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label>Duration (min)</Label>
                <Input
                  type="number"
                  value={newExercise.duration}
                  onChange={(e) => setNewExercise({...newExercise, duration: parseInt(e.target.value)})}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowExerciseDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleAddExercise}
              disabled={!newExercise.name}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Add Exercise
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Goal Description *</Label>
              <Input
                value={newGoal.goal}
                onChange={(e) => setNewGoal({...newGoal, goal: e.target.value})}
                placeholder="e.g., Improve 40m sprint time"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Target Value</Label>
                <Input
                  type="number"
                  value={newGoal.target_value}
                  onChange={(e) => setNewGoal({...newGoal, target_value: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label>Current Value</Label>
                <Input
                  type="number"
                  value={newGoal.current_value}
                  onChange={(e) => setNewGoal({...newGoal, current_value: parseInt(e.target.value)})}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowGoalDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleAddGoal}
              disabled={!newGoal.goal}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Add Goal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}