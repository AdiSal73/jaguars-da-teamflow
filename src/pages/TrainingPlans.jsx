import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Plus, User, Calendar, Target, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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

export default function TrainingPlans() {
  const [showDialog, setShowDialog] = useState(false);
  const [newPlan, setNewPlan] = useState({
    player_id: '',
    title: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    goals: [],
    exercises: [],
    status: 'Active'
  });

  const queryClient = useQueryClient();

  const { data: plans = [] } = useQuery({
    queryKey: ['trainingPlans'],
    queryFn: () => base44.entities.TrainingPlan.list('-created_date')
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const createPlanMutation = useMutation({
    mutationFn: (data) => base44.entities.TrainingPlan.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['trainingPlans']);
      setShowDialog(false);
      setNewPlan({
        player_id: '',
        title: '',
        description: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        goals: [],
        exercises: [],
        status: 'Active'
      });
    }
  });

  const handleCreatePlan = () => {
    const player = players.find(p => p.id === newPlan.player_id);
    createPlanMutation.mutate({
      ...newPlan,
      player_name: player?.full_name,
      progress: 0
    });
  };

  const statusColors = {
    'Active': 'bg-emerald-100 text-emerald-800',
    'Completed': 'bg-blue-100 text-blue-800',
    'Paused': 'bg-yellow-100 text-yellow-800'
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Training Plans</h1>
          <p className="text-slate-600 mt-1">Create and manage personalized training programs</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Plan
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map(plan => (
          <Link key={plan.id} to={`${createPageUrl('TrainingPlanDetail')}?id=${plan.id}`}>
            <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="border-b border-slate-100">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{plan.title}</CardTitle>
                  <Badge className={statusColors[plan.status]}>{plan.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700">{plan.player_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700">
                      {new Date(plan.start_date).toLocaleDateString()} - {new Date(plan.end_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700">{plan.goals?.length || 0} Goals</span>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600">Progress</span>
                      <span className="font-semibold text-emerald-600">{plan.progress || 0}%</span>
                    </div>
                    <Progress value={plan.progress || 0} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-12">
          <TrendingUp className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No training plans yet. Create one to get started.</p>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Training Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Player *</Label>
              <Select value={newPlan.player_id} onValueChange={(value) => setNewPlan({...newPlan, player_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select player" />
                </SelectTrigger>
                <SelectContent>
                  {players.map(player => (
                    <SelectItem key={player.id} value={player.id}>{player.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Plan Title *</Label>
              <Input
                value={newPlan.title}
                onChange={(e) => setNewPlan({...newPlan, title: e.target.value})}
                placeholder="e.g., Speed & Agility Development"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newPlan.description}
                onChange={(e) => setNewPlan({...newPlan, description: e.target.value})}
                placeholder="Describe the training plan objectives..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={newPlan.start_date}
                  onChange={(e) => setNewPlan({...newPlan, start_date: e.target.value})}
                />
              </div>
              <div>
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={newPlan.end_date}
                  onChange={(e) => setNewPlan({...newPlan, end_date: e.target.value})}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleCreatePlan}
              disabled={!newPlan.player_id || !newPlan.title || !newPlan.end_date}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Create Plan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}