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
import { Target, TrendingUp, BookOpen, Plus, CheckCircle, ExternalLink, Trash2, Grid3x3, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SkillMatrixEditor from './SkillMatrixEditor';
import EventsTimeline from './EventsTimeline';
import DevelopmentGoalsManager from './DevelopmentGoalsManager';
import { POSITION_KNOWLEDGE } from '../constants/positionKnowledgeBank';

export default function DevelopmentPathwayManager({ player, assessments, evaluations, onUpdatePlayer, onProvideFeedback }) {
  const [showMilestoneDialog, setShowMilestoneDialog] = useState(false);
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [showSkillMatrixDialog, setShowSkillMatrixDialog] = useState(false);
  const [showSelfAssessment, setShowSelfAssessment] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [newMilestone, setNewMilestone] = useState({ title: '', description: '', target_date: '', level: 'Intermediate', category: 'Technical' });
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
    const autoSuggestedModules = generateAutoModules();
    const initialSkillMatrix = generateInitialSkillMatrix();
    
    createPathwayMutation.mutate({
      player_id: player.id,
      position: player.primary_position,
      current_level: 'Beginner',
      training_modules: autoSuggestedModules,
      skill_matrix: initialSkillMatrix,
      events_camps: [],
      notes: ''
    });
  };

  const generateInitialSkillMatrix = () => {
    const positionKnowledge = POSITION_KNOWLEDGE[player.primary_position];
    if (!positionKnowledge) return [];
    
    const skills = [];
    Object.entries(positionKnowledge.categories).forEach(([category, data]) => {
      data.points.forEach(point => {
        skills.push({
          skill_name: point,
          current_rating: 5,
          target_rating: 8,
          coach_notes: '',
          player_self_rating: 0,
          player_notes: ''
        });
      });
    });
    
    return skills;
  };



  const generateAutoModules = () => {
    if (!assessments || assessments.length === 0) return [];
    
    const latest = assessments[0];
    const modules = [];
    
    if (latest.yirt < 30 || latest.endurance_score < 50) {
      modules.push({
        id: `module_${Date.now()}_1`,
        title: '90Min Fitness Program',
        description: 'Complete 4-week cardiovascular endurance program',
        resource_link: '/fitness-resources',
        priority: 'High',
        training_type: 'Functional Training',
        weekly_sessions: 2,
        number_of_weeks: 4,
        session_duration: 60,
        start_date: new Date().toISOString().split('T')[0],
        completed: false,
        auto_suggested: true
      });
    }
    
    return modules;
  };

  const handleUpdateEvents = (updatedEvents) => {
    updatePathwayMutation.mutate({ id: pathway.id, data: { events_camps: updatedEvents } });
  };

  const handleAddModule = () => {
    const module = {
      id: `module_${Date.now()}`,
      ...newModule,
      completed: false,
      auto_suggested: false
    };
    const updatedModules = [...(pathway.training_modules || []), module];
    updatePathwayMutation.mutate({ id: pathway.id, data: { training_modules: updatedModules } });
    setShowModuleDialog(false);
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
    updatePathwayMutation.mutate({ id: pathway.id, data: { training_modules: updatedModules } });
  };

  const handleDeleteModule = (moduleId) => {
    const updatedModules = pathway.training_modules.filter(m => m.id !== moduleId);
    updatePathwayMutation.mutate({ id: pathway.id, data: { training_modules: updatedModules } });
  };

  const handleUpdateSkillMatrix = (updatedMatrix) => {
    updatePathwayMutation.mutate({ id: pathway.id, data: { skill_matrix: updatedMatrix } });
  };

  const handleUpdatePlayerGoals = (data) => {
    const updatePlayerMutation = { mutate: (updateData) => {
      // Update player through the parent component
      window.location.reload(); // Temporary - ideally pass mutation from parent
    }};
    // This would normally be passed from parent, for now just trigger re-render
  };

  if (!pathway) {
    return (
      <Card className="border-none shadow-lg">
        <CardContent className="p-8 text-center">
          <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Development Pathway Yet</h3>
          <p className="text-slate-600 text-sm mb-4">Create a structured development plan with auto-suggested modules based on performance</p>
          <Button onClick={handleCreatePathway} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Development Pathway
          </Button>
        </CardContent>
      </Card>
    );
  }

  const completedModules = pathway.training_modules?.filter(m => m.completed).length || 0;
  const totalModules = pathway.training_modules?.length || 0;
  const progressPercent = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-50 to-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Development Pathway
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowSkillMatrixDialog(true)}>
                <Grid3x3 className="w-4 h-4 mr-1" />
                Skill Matrix
              </Button>
              <Badge className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white">
                {pathway.current_level}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-700 font-semibold">Training Progress</span>
                <span className="text-emerald-600 font-bold">{completedModules} / {totalModules}</span>
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

      <DevelopmentGoalsManager
        pathway={pathway}
        player={player}
        assessments={assessments}
        onUpdate={(data) => onUpdatePlayer && onUpdatePlayer(data)}
        onProvideFeedback={onProvideFeedback}
      />

      <EventsTimeline 
        events={pathway.events_camps || []} 
        onUpdate={handleUpdateEvents}
      />

      <Card className="border-none shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Training Modules
            </CardTitle>
            <div className="flex gap-2">
              <div className="flex gap-1 border rounded-lg p-1">
                <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="h-7 px-2 text-xs">
                  List
                </Button>
                <Button variant={viewMode === 'calendar' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('calendar')} className="h-7 px-2 text-xs">
                  Calendar
                </Button>
              </div>
              <Button onClick={() => setShowModuleDialog(true)} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-1" />
                Add Module
              </Button>
            </div>
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
            <div className={viewMode === 'calendar' ? 'grid md:grid-cols-2 gap-4' : ''}>
              {viewMode === 'calendar' && (
                <div className="border rounded-lg p-4 bg-slate-50">
                  <h4 className="font-semibold text-sm text-slate-900 mb-3">Training Schedule</h4>
                  <div className="space-y-2">
                    {pathway.training_modules?.filter(m => m.start_date).map(module => {
                      const startDate = new Date(module.start_date);
                      const endDate = module.end_date ? new Date(module.end_date) : new Date(startDate.getTime() + (module.number_of_weeks || 4) * 7 * 24 * 60 * 60 * 1000);
                      const now = new Date();
                      const isActive = now >= startDate && now <= endDate;
                      const isUpcoming = now < startDate;
                      
                      return (
                        <div key={module.id} className={`p-3 rounded-lg border-l-4 ${isActive ? 'bg-emerald-50 border-l-emerald-500' : isUpcoming ? 'bg-blue-50 border-l-blue-500' : 'bg-slate-100 border-l-slate-400'}`}>
                          <div className="font-semibold text-sm text-slate-900">{module.title}</div>
                          <div className="text-xs text-slate-600 mt-1">
                            {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                          </div>
                          <div className="flex gap-2 mt-1">
                            <Badge className="text-[9px] bg-white/80">{module.weekly_sessions}x/week</Badge>
                            <Badge className="text-[9px] bg-white/80">{module.session_duration}min</Badge>
                          </div>
                          {isActive && <div className="text-xs text-emerald-600 font-semibold mt-1">● Active</div>}
                        </div>
                      );
                    })}
                    {pathway.training_modules?.filter(m => !m.start_date).length > 0 && (
                      <div className="text-xs text-slate-500 italic mt-2">
                        {pathway.training_modules.filter(m => !m.start_date).length} module(s) not scheduled
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className={viewMode === 'calendar' ? '' : 'space-y-3'}>
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
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-slate-900">{module.title}</h4>
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
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-50 hover:text-red-600" onClick={() => handleDeleteModule(module.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showSkillMatrixDialog} onOpenChange={setShowSkillMatrixDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Position Skill Matrix - {pathway.position}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <SkillMatrixEditor 
              position={pathway.position}
              skillMatrix={pathway.skill_matrix}
              onUpdate={handleUpdateSkillMatrix}
              allowPlayerInput={showSelfAssessment}
            />
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowSelfAssessment(!showSelfAssessment)} size="sm">
                {showSelfAssessment ? 'Hide' : 'Show'} Player Self-Assessment
              </Button>
              <Button onClick={() => setShowSkillMatrixDialog(false)}>Done</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>



      <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
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
              <p className="text-xs text-slate-500 mt-1">Link to Fitness Resources page or external content</p>
            </div>
            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowModuleDialog(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleAddModule} disabled={!newModule.title} className="flex-1 bg-blue-600 hover:bg-blue-700">Add Module</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}