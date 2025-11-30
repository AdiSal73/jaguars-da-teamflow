import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Search, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const ratingLabels = {
  1: 'Basic',
  2: 'Novice',
  3: 'Beginner',
  4: 'Advanced Beginner',
  5: 'Intermediate',
  6: 'Competent',
  7: 'Advanced',
  8: 'Accomplished',
  9: 'Proficient',
  10: 'Expert'
};

export default function EvaluationsNew() {
  const [showDialog, setShowDialog] = useState(false);
  const [deleteEvalId, setDeleteEvalId] = useState(null);
  const [search, setSearch] = useState('');
  const POSITIONS = ['GK', 'Right Outside Back', 'Left Outside Back', 'Right Centerback', 'Left Centerback', 'Defensive Midfielder', 'Right Winger', 'Center Midfielder', 'Forward', 'Attacking Midfielder', 'Left Winger'];

  const [formData, setFormData] = useState({
    player_id: '',
    player_name: '',
    birth_year: '',
    team_name: '',
    my_goals: '',
    evaluator: '',
    current_team_status: '',
    growth_mindset: 5,
    resilience: 5,
    efficiency_in_execution: 5,
    athleticism: 5,
    team_focus: 5,
    primary_position: '',
    secondary_position: '',
    preferred_foot: 'Right',
    defending_organized: 5,
    defending_final_third: 5,
    defending_transition: 5,
    attacking_organized: 5,
    attacking_final_third: 5,
    attacking_in_transition: 5,
    player_strengths: '',
    areas_of_growth: '',
    training_focus: ''
  });

  const queryClient = useQueryClient();

  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations'],
    queryFn: () => base44.entities.Evaluation.list('-created_date')
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Evaluation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['evaluations']);
      setShowDialog(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Evaluation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['evaluations']);
      setDeleteEvalId(null);
    }
  });

  const resetForm = () => {
    setFormData({
      player_id: '',
      player_name: '',
      birth_year: '',
      team_name: '',
      my_goals: '',
      evaluator: '',
      current_team_status: '',
      growth_mindset: 5,
      resilience: 5,
      efficiency_in_execution: 5,
      athleticism: 5,
      team_focus: 5,
      primary_position: '',
      secondary_position: '',
      preferred_foot: 'Right',
      defending_organized: 5,
      defending_final_third: 5,
      defending_transition: 5,
      attacking_organized: 5,
      attacking_final_third: 5,
      attacking_in_transition: 5,
      player_strengths: '',
      areas_of_growth: '',
      training_focus: ''
    });
  };

  const handlePlayerSelect = (playerId) => {
    const player = players.find(p => p.id === playerId);
    if (player) {
      const team = teams.find(t => t.id === player.team_id);
      const birthYear = player.date_of_birth ? new Date(player.date_of_birth).getFullYear().toString() : '';
      setFormData({
        ...formData,
        player_id: playerId,
        player_name: player.full_name,
        birth_year: birthYear,
        team_name: team?.name || '',
        primary_position: player.primary_position || '',
        secondary_position: player.secondary_position || '',
        preferred_foot: player.preferred_foot || 'Right'
      });
    }
  };

  const RatingSlider = ({ label, value, onChange }) => (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-semibold text-slate-700">{label}</Label>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-emerald-600">{value}</span>
          <span className="text-sm font-medium text-slate-600 min-w-[140px]">{ratingLabels[value]}</span>
        </div>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-3 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded-lg appearance-none cursor-pointer slider"
        style={{
          background: `linear-gradient(to right, #fca5a5 0%, #fde047 50%, #86efac 100%)`
        }}
      />
      <div className="flex justify-between text-xs text-slate-500">
        <span>1 - Basic</span>
        <span>5 - Intermediate</span>
        <span>10 - Expert</span>
      </div>
    </div>
  );

  const filteredEvaluations = evaluations.filter(e => 
    e.player_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.team_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-[1800px] mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Player Evaluations</h1>
          <p className="text-slate-600 mt-1">Comprehensive player assessment and development tracking</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="bg-emerald-600 hover:bg-emerald-700 h-12 px-6 text-base font-semibold shadow-lg">
          <Plus className="w-5 h-5 mr-2" />
          New Evaluation
        </Button>
      </div>

      <Card className="border-none shadow-lg mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Search by player name or team..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 border-2 h-12"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {filteredEvaluations.map(evaluation => (
          <Card key={evaluation.id} className="border-none shadow-xl hover:shadow-2xl transition-all">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl text-slate-900">{evaluation.player_name}</CardTitle>
                  <div className="flex gap-4 mt-2 text-sm text-slate-600">
                    <span>Birth Year: {evaluation.birth_year}</span>
                    <span>•</span>
                    <span>Team: {evaluation.team_name}</span>
                    <span>•</span>
                    <span>Position: {evaluation.primary_position}</span>
                    <span>•</span>
                    <span>Evaluator: {evaluation.evaluator}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteEvalId(evaluation.id)}
                  className="hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h3 className="font-bold text-lg text-slate-900 border-b-2 border-emerald-500 pb-2">Mental & Physical</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Growth Mindset', value: evaluation.growth_mindset },
                      { label: 'Resilience', value: evaluation.resilience },
                      { label: 'Efficiency', value: evaluation.efficiency_in_execution },
                      { label: 'Athleticism', value: evaluation.athleticism },
                      { label: 'Team Focus', value: evaluation.team_focus }
                    ].map(item => (
                      <div key={item.label} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                        <span className="text-sm font-medium text-slate-700">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-600">{item.value}</span>
                          <span className="text-xs text-slate-500">{ratingLabels[item.value]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-bold text-lg text-slate-900 border-b-2 border-blue-500 pb-2">Defending</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Organized', value: evaluation.defending_organized },
                      { label: 'Final Third', value: evaluation.defending_final_third },
                      { label: 'Transition', value: evaluation.defending_transition }
                    ].map(item => (
                      <div key={item.label} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                        <span className="text-sm font-medium text-slate-700">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-600">{item.value}</span>
                          <span className="text-xs text-slate-500">{ratingLabels[item.value]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <h3 className="font-bold text-lg text-slate-900 border-b-2 border-orange-500 pb-2 mt-6">Attacking</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Organized', value: evaluation.attacking_organized },
                      { label: 'Final Third', value: evaluation.attacking_final_third },
                      { label: 'Transition', value: evaluation.attacking_in_transition }
                    ].map(item => (
                      <div key={item.label} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                        <span className="text-sm font-medium text-slate-700">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-orange-600">{item.value}</span>
                          <span className="text-xs text-slate-500">{ratingLabels[item.value]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-lg text-slate-900 border-b-2 border-purple-500 pb-2">Development Notes</h3>
                  {evaluation.my_goals && (
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="text-xs font-semibold text-purple-700 mb-1">Goals</div>
                      <div className="text-sm text-slate-700">{evaluation.my_goals}</div>
                    </div>
                  )}
                  {evaluation.player_strengths && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-xs font-semibold text-green-700 mb-1">Strengths</div>
                      <div className="text-sm text-slate-700">{evaluation.player_strengths}</div>
                    </div>
                  )}
                  {evaluation.areas_of_growth && (
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <div className="text-xs font-semibold text-orange-700 mb-1">Areas of Growth</div>
                      <div className="text-sm text-slate-700">{evaluation.areas_of_growth}</div>
                    </div>
                  )}
                  {evaluation.training_focus && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-xs font-semibold text-blue-700 mb-1">Training Focus</div>
                      <div className="text-sm text-slate-700">{evaluation.training_focus}</div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEvaluations.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          No evaluations found
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <div className="w-2 h-8 bg-gradient-to-b from-emerald-500 to-blue-500 rounded-full" />
              New Player Evaluation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-8 mt-6">
            <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
              <CardHeader className="border-b bg-gradient-to-r from-emerald-100 to-blue-100">
                <CardTitle className="text-lg">Player Information</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold">Select Player *</Label>
                    <Select value={formData.player_id} onValueChange={handlePlayerSelect}>
                      <SelectTrigger className="border-2 h-12">
                        <SelectValue placeholder="Choose player" />
                      </SelectTrigger>
                      <SelectContent>
                        {players.map(player => (
                          <SelectItem key={player.id} value={player.id}>{player.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-semibold">Birth Year</Label>
                    <Input value={formData.birth_year} readOnly className="bg-slate-50 border-2 h-12" />
                  </div>
                  <div>
                    <Label className="font-semibold">Team Name</Label>
                    <Input value={formData.team_name} readOnly className="bg-slate-50 border-2 h-12" />
                  </div>
                  <div>
                    <Label className="font-semibold">Evaluator</Label>
                    <Input
                      value={formData.evaluator}
                      onChange={(e) => setFormData({...formData, evaluator: e.target.value})}
                      placeholder="Your name"
                      className="border-2 h-12"
                    />
                  </div>
                  <div>
                    <Label className="font-semibold">Primary Position</Label>
                    <Select value={formData.primary_position} onValueChange={(val) => setFormData({...formData, primary_position: val})}>
                      <SelectTrigger className="border-2 h-12">
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        {POSITIONS.map(pos => (
                          <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-semibold">Secondary Position (Optional)</Label>
                    <Select value={formData.secondary_position} onValueChange={(val) => setFormData({...formData, secondary_position: val})}>
                      <SelectTrigger className="border-2 h-12">
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>None</SelectItem>
                        {POSITIONS.map(pos => (
                          <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-semibold">Preferred Foot</Label>
                    <Select value={formData.preferred_foot} onValueChange={(val) => setFormData({...formData, preferred_foot: val})}>
                      <SelectTrigger className="border-2 h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Left">Left</SelectItem>
                        <SelectItem value="Right">Right</SelectItem>
                        <SelectItem value="Both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="font-semibold">Current Team Status</Label>
                    <Input
                      value={formData.current_team_status}
                      onChange={(e) => setFormData({...formData, current_team_status: e.target.value})}
                      placeholder="e.g., Starter, Rotation, Development"
                      className="border-2 h-12"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="font-semibold">Player's Goals</Label>
                    <Textarea
                      value={formData.my_goals}
                      onChange={(e) => setFormData({...formData, my_goals: e.target.value})}
                      placeholder="What are the player's personal goals?"
                      rows={2}
                      className="border-2 resize-none"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200">
              <CardHeader className="border-b bg-gradient-to-r from-blue-100 to-purple-100">
                <CardTitle className="text-lg">Mental & Physical Attributes</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <RatingSlider label="Growth Mindset" value={formData.growth_mindset} onChange={(val) => setFormData({...formData, growth_mindset: val})} />
                <RatingSlider label="Resilience" value={formData.resilience} onChange={(val) => setFormData({...formData, resilience: val})} />
                <RatingSlider label="Efficiency in Execution" value={formData.efficiency_in_execution} onChange={(val) => setFormData({...formData, efficiency_in_execution: val})} />
                <RatingSlider label="Athleticism" value={formData.athleticism} onChange={(val) => setFormData({...formData, athleticism: val})} />
                <RatingSlider label="Team Focus" value={formData.team_focus} onChange={(val) => setFormData({...formData, team_focus: val})} />
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-2 border-blue-200">
                <CardHeader className="border-b bg-gradient-to-r from-blue-100 to-cyan-100">
                  <CardTitle className="text-lg">Defending Skills</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <RatingSlider label="Defending Organized" value={formData.defending_organized} onChange={(val) => setFormData({...formData, defending_organized: val})} />
                  <RatingSlider label="Defending Final Third" value={formData.defending_final_third} onChange={(val) => setFormData({...formData, defending_final_third: val})} />
                  <RatingSlider label="Defending Transition" value={formData.defending_transition} onChange={(val) => setFormData({...formData, defending_transition: val})} />
                </CardContent>
              </Card>

              <Card className="border-2 border-orange-200">
                <CardHeader className="border-b bg-gradient-to-r from-orange-100 to-red-100">
                  <CardTitle className="text-lg">Attacking Skills</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <RatingSlider label="Attacking Organized" value={formData.attacking_organized} onChange={(val) => setFormData({...formData, attacking_organized: val})} />
                  <RatingSlider label="Attacking Final Third" value={formData.attacking_final_third} onChange={(val) => setFormData({...formData, attacking_final_third: val})} />
                  <RatingSlider label="Attacking in Transition" value={formData.attacking_in_transition} onChange={(val) => setFormData({...formData, attacking_in_transition: val})} />
                </CardContent>
              </Card>
            </div>

            <Card className="border-2 border-purple-200">
              <CardHeader className="border-b bg-gradient-to-r from-purple-100 to-pink-100">
                <CardTitle className="text-lg">Development Notes</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label className="font-semibold">Player's Strengths</Label>
                  <Textarea
                    value={formData.player_strengths}
                    onChange={(e) => setFormData({...formData, player_strengths: e.target.value})}
                    placeholder="What does this player excel at?"
                    rows={3}
                    className="border-2 resize-none"
                  />
                </div>
                <div>
                  <Label className="font-semibold">Areas of Growth</Label>
                  <Textarea
                    value={formData.areas_of_growth}
                    onChange={(e) => setFormData({...formData, areas_of_growth: e.target.value})}
                    placeholder="What areas need improvement?"
                    rows={3}
                    className="border-2 resize-none"
                  />
                </div>
                <div>
                  <Label className="font-semibold">Training Focus</Label>
                  <Textarea
                    value={formData.training_focus}
                    onChange={(e) => setFormData({...formData, training_focus: e.target.value})}
                    placeholder="What should training focus on?"
                    rows={3}
                    className="border-2 resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
            <Button variant="outline" onClick={() => setShowDialog(false)} className="h-12 px-8">
              Cancel
            </Button>
            <Button 
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.player_id}
              className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 h-12 px-8 text-base font-semibold shadow-lg"
            >
              Create Evaluation
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteEvalId} onOpenChange={() => setDeleteEvalId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Evaluation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this evaluation. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleteEvalId)} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}