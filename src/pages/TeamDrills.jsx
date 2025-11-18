import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function TeamDrills() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingDrill, setEditingDrill] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [drillForm, setDrillForm] = useState({
    team_id: '',
    name: '',
    description: '',
    category: 'technical',
    duration: 30,
    difficulty: 'intermediate',
    instructions: '',
    equipment: ''
  });

  const queryClient = useQueryClient();

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const { data: drills = [] } = useQuery({
    queryKey: ['drills'],
    queryFn: () => base44.entities.Drill.list('-created_date')
  });

  const createDrillMutation = useMutation({
    mutationFn: (data) => base44.entities.Drill.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['drills']);
      setShowDialog(false);
      resetForm();
    }
  });

  const updateDrillMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Drill.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['drills']);
      setShowDialog(false);
      setEditingDrill(null);
      resetForm();
    }
  });

  const deleteDrillMutation = useMutation({
    mutationFn: (id) => base44.entities.Drill.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['drills'])
  });

  const resetForm = () => {
    setDrillForm({
      team_id: '',
      name: '',
      description: '',
      category: 'technical',
      duration: 30,
      difficulty: 'intermediate',
      instructions: '',
      equipment: ''
    });
  };

  const handleEdit = (drill) => {
    setEditingDrill(drill);
    setDrillForm(drill);
    setShowDialog(true);
  };

  const handleSave = () => {
    if (editingDrill) {
      updateDrillMutation.mutate({ id: editingDrill.id, data: drillForm });
    } else {
      createDrillMutation.mutate(drillForm);
    }
  };

  const filteredDrills = selectedTeam === 'all' ? drills : drills.filter(d => d.team_id === selectedTeam);

  const categoryColors = {
    technical: 'bg-blue-100 text-blue-800',
    tactical: 'bg-purple-100 text-purple-800',
    physical: 'bg-emerald-100 text-emerald-800',
    mental: 'bg-orange-100 text-orange-800'
  };

  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800'
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Team Drills & Exercises</h1>
          <p className="text-slate-600 mt-1">Create and manage training drills</p>
        </div>
        <Button onClick={() => { setEditingDrill(null); resetForm(); setShowDialog(true); }} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          New Drill
        </Button>
      </div>

      <Card className="border-none shadow-lg mb-6">
        <CardContent className="p-6">
          <Label>Filter by Team</Label>
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map(team => (
                <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDrills.map(drill => {
          const team = teams.find(t => t.id === drill.team_id);
          return (
            <Card key={drill.id} className="border-none shadow-lg hover:shadow-xl transition-all">
              <CardHeader className="border-b">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{drill.name}</CardTitle>
                    <div className="flex gap-2 flex-wrap">
                      <Badge className={categoryColors[drill.category]}>{drill.category}</Badge>
                      <Badge className={difficultyColors[drill.difficulty]}>{drill.difficulty}</Badge>
                      <Badge variant="outline">{drill.duration} min</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(drill)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (window.confirm('Delete this drill?')) {
                          deleteDrillMutation.mutate(drill.id);
                        }
                      }}
                      className="hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600 mb-4">{drill.description}</p>
                {drill.equipment && (
                  <div className="text-xs text-slate-500">
                    <span className="font-medium">Equipment:</span> {drill.equipment}
                  </div>
                )}
                <div className="text-xs text-slate-500 mt-2">Team: {team?.name}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingDrill ? 'Edit Drill' : 'Create New Drill'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Team *</Label>
              <Select value={drillForm.team_id} onValueChange={(value) => setDrillForm({...drillForm, team_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Drill Name *</Label>
              <Input value={drillForm.name} onChange={(e) => setDrillForm({...drillForm, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={drillForm.category} onValueChange={(value) => setDrillForm({...drillForm, category: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="tactical">Tactical</SelectItem>
                    <SelectItem value="physical">Physical</SelectItem>
                    <SelectItem value="mental">Mental</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Difficulty</Label>
                <Select value={drillForm.difficulty} onValueChange={(value) => setDrillForm({...drillForm, difficulty: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Duration (min)</Label>
                <Input type="number" value={drillForm.duration} onChange={(e) => setDrillForm({...drillForm, duration: parseInt(e.target.value)})} />
              </div>
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea value={drillForm.description} onChange={(e) => setDrillForm({...drillForm, description: e.target.value})} />
            </div>
            <div>
              <Label>Instructions</Label>
              <Textarea value={drillForm.instructions} onChange={(e) => setDrillForm({...drillForm, instructions: e.target.value})} rows={4} />
            </div>
            <div>
              <Label>Equipment</Label>
              <Input value={drillForm.equipment} onChange={(e) => setDrillForm({...drillForm, equipment: e.target.value})} placeholder="Cones, balls, etc." />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => { setShowDialog(false); setEditingDrill(null); resetForm(); }}>Cancel</Button>
            <Button 
              onClick={handleSave}
              disabled={!drillForm.team_id || !drillForm.name || !drillForm.description}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {editingDrill ? 'Update Drill' : 'Create Drill'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}