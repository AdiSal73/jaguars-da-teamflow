import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, BookOpen, Plus, CheckCircle, ExternalLink, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function DevelopmentPathwayManager({ player }) {
  const [showMilestoneDialog, setShowMilestoneDialog] = useState(false);
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ title: '', description: '', target_date: '', level: 'Intermediate', category: 'Technical' });
  const [newModule, setNewModule] = useState({ title: '', description: '', resource_link: '', priority: 'Medium' });

  const queryClient = useQueryClient();

  const { data: pathway } = useQuery({
    queryKey: ['pathway', player.id],
    queryFn: async () => {
      const pathways = await base44.entities.DevelopmentPathway.filter({ player_id: player.id });
      return pathways[0] || null;
    }
  });

  const createPathwayMutation = useMutation({
    mutationFn: (data) => base44.entities.DevelopmentPathway.create(data),
    onSuccess: () => queryClient.invalidateQueries(['pathway', player.id])
  });

  const updatePathwayMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DevelopmentPathway.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['pathway', player.id])
  });

  const handleCreatePathway = () => {
    createPathwayMutation.mutate({
      player_id: player.id,
      position: player.primary_position,
      current_level: 'Beginner',
      milestones: [],
      training_modules: [],
      skill_goals: [],
      notes: ''
    });
  };

  const handleAddMilestone = () => {
    const milestone = {
      id: `milestone_${Date.now()}`,
      ...newMilestone,
      completed: false,
      completion_date: ''
    };
    const updatedMilestones = [...(pathway.milestones || []), milestone];
    updatePathwayMutation.mutate({ id: pathway.id, data: { milestones: updatedMilestones } });
    setShowMilestoneDialog(false);
    setNewMilestone({ title: '', description: '', target_date: '', level: 'Intermediate', category: 'Technical' });
  };

  const handleToggleMilestone = (milestoneId) => {
    const updatedMilestones = pathway.milestones.map(m => {
      if (m.id === milestoneId) {
        return { ...m, completed: !m.completed, completion_date: !m.completed ? new Date().toISOString().split('T')[0] : '' };
      }
      return m;
    });
    updatePathwayMutation.mutate({ id: pathway.id, data: { milestones: updatedMilestones } });
  };

  const handleDeleteMilestone = (milestoneId) => {
    const updatedMilestones = pathway.milestones.filter(m => m.id !== milestoneId);
    updatePathwayMutation.mutate({ id: pathway.id, data: { milestones: updatedMilestones } });
  };

  const handleAddModule = () => {
    const module = {
      id: `module_${Date.now()}`,
      ...newModule,
      completed: false
    };
    const updatedModules = [...(pathway.training_modules || []), module];
    updatePathwayMutation.mutate({ id: pathway.id, data: { training_modules: updatedModules } });
    setShowModuleDialog(false);
    setNewModule({ title: '', description: '', resource_link: '', priority: 'Medium' });
  };

  const handleToggleModule = (moduleId) => {
    const updatedModules = pathway.training_modules.map(m => {
      if (m.id === moduleId) {
        return { ...m, completed: !m.completed };
      }
      return m;
    });
    updatePathwayMutation.mutate({ id: pathway.id, data: { training_modules: updatedModules } });
  };

  const handleDeleteModule = (moduleId) => {
    const updatedModules = pathway.training_modules.filter(m => m.id !== moduleId);
    updatePathwayMutation.mutate({ id: pathway.id, data: { training_modules: updatedModules } });
  };

  if (!pathway) {
    return (
      <Card className="border-none shadow-lg">
        <CardContent className="p-8 text-center">
          <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Development Pathway Yet</h3>
          <p className="text-slate-600 text-sm mb-4">Create a structured development plan for {player.full_name}</p>
          <Button onClick={handleCreatePathway} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Development Pathway
          </Button>
        </CardContent>
      </Card>
    );
  }

  const completedMilestones = pathway.milestones?.filter(m => m.completed).length || 0;
  const totalMilestones = pathway.milestones?.length || 0;
  const progressPercent = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-50 to-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Development Pathway
            </CardTitle>
            <Badge className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white">
              {pathway.current_level}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-700 font-semibold">Overall Progress</span>
                <span className="text-emerald-600 font-bold">{completedMilestones} / {totalMilestones}</span>
              </div>
              <Progress value={progressPercent} className="h-3" />
            </div>
            <div className="flex gap-2">
              <Select value={pathway.current_level} onValueChange={(val) => updatePathwayMutation.mutate({ id: pathway.id, data: { current_level: val } })}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                  <SelectItem value="Elite">Elite</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Development Milestones</CardTitle>
            <Button onClick={() => setShowMilestoneDialog(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-1" />
              Add Milestone
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pathway.milestones?.length === 0 ? (
            <p className="text-center text-slate-500 py-4 text-sm">No milestones yet</p>
          ) : (
            <div className="space-y-3">
              {pathway.milestones?.map(milestone => (
                <div key={milestone.id} className={`p-4 rounded-lg border-2 ${milestone.completed ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <button onClick={() => handleToggleMilestone(milestone.id)} className="mt-1">
                        {milestone.completed ? (
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                        )}
                      </button>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">{milestone.title}</h4>
                        <p className="text-xs text-slate-600 mt-1">{milestone.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className="text-[9px] bg-blue-100 text-blue-800">{milestone.level}</Badge>
                          <Badge className="text-[9px] bg-purple-100 text-purple-800">{milestone.category}</Badge>
                          {milestone.target_date && (
                            <span className="text-xs text-slate-500">Target: {new Date(milestone.target_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-50 hover:text-red-600" onClick={() => handleDeleteMilestone(milestone.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Training Modules
            </CardTitle>
            <Button onClick={() => setShowModuleDialog(true)} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-1" />
              Add Module
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pathway.training_modules?.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-slate-500 text-sm mb-3">No training modules yet</p>
              <Link to={createPageUrl('FitnessResources')}>
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View Fitness Resources
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {pathway.training_modules?.map(module => (
                <div key={module.id} className={`p-4 rounded-lg border ${module.completed ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <button onClick={() => handleToggleModule(module.id)} className="mt-1">
                        {module.completed ? (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                        )}
                      </button>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">{module.title}</h4>
                        <p className="text-xs text-slate-600 mt-1">{module.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={`text-[9px] ${module.priority === 'High' ? 'bg-red-100 text-red-800' : module.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                            {module.priority} Priority
                          </Badge>
                          {module.resource_link && (
                            <a href={module.resource_link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" />
                              View Resource
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-50 hover:text-red-600" onClick={() => handleDeleteModule(module.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showMilestoneDialog} onOpenChange={setShowMilestoneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Development Milestone</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Title *</Label>
              <Input value={newMilestone.title} onChange={e => setNewMilestone({...newMilestone, title: e.target.value})} placeholder="e.g., Master first touch control" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={newMilestone.description} onChange={e => setNewMilestone({...newMilestone, description: e.target.value})} rows={2} placeholder="Describe what success looks like" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Level</Label>
                <Select value={newMilestone.level} onValueChange={v => setNewMilestone({...newMilestone, level: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                    <SelectItem value="Elite">Elite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={newMilestone.category} onValueChange={v => setNewMilestone({...newMilestone, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Tactical">Tactical</SelectItem>
                    <SelectItem value="Physical">Physical</SelectItem>
                    <SelectItem value="Mental">Mental</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Target Date</Label>
              <Input type="date" value={newMilestone.target_date} onChange={e => setNewMilestone({...newMilestone, target_date: e.target.value})} />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowMilestoneDialog(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleAddMilestone} disabled={!newMilestone.title} className="flex-1 bg-emerald-600 hover:bg-emerald-700">Add Milestone</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
        <DialogContent>
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
            <div>
              <Label>Resource Link</Label>
              <Input value={newModule.resource_link} onChange={e => setNewModule({...newModule, resource_link: e.target.value})} placeholder="https://..." />
              <p className="text-xs text-slate-500 mt-1">Link to Fitness Resources or external content</p>
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
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowModuleDialog(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleAddModule} disabled={!newModule.title} className="flex-1 bg-blue-600 hover:bg-blue-700">Add Module</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}