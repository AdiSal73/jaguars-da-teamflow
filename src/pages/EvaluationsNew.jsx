import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Search, ChevronDown, ChevronUp, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { getPositionFields } from '../components/constants/positionEvaluationFields';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

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
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedPlayerId = urlParams.get('playerId');

  const [showDialog, setShowDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState(null);
  const [deleteEvalId, setDeleteEvalId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterPosition, setFilterPosition] = useState('all');
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [generatingNotes, setGeneratingNotes] = useState(false);
  
  const POSITIONS = ['GK', 'Right Outside Back', 'Left Outside Back', 'Right Centerback', 'Left Centerback', 'Defensive Midfielder', 'Right Winger', 'Center Midfielder', 'Forward', 'Attacking Midfielder', 'Left Winger'];

  const initialFormData = {
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
    pressing: 5,
    defending_set_pieces: 5,
    attacking_organized: 5,
    attacking_final_third: 5,
    attacking_in_transition: 5,
    building_out: 5,
    attacking_set_pieces: 5,
    player_strengths: '',
    areas_of_growth: '',
    training_focus: '',
    position_role_1: 5,
    position_role_2: 5,
    position_role_3: 5,
    position_role_4: 5,
    position_role_1_label: '',
    position_role_2_label: '',
    position_role_3_label: '',
    position_role_4_label: ''
  };
  const [formData, setFormData] = useState(initialFormData);

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const currentCoach = coaches.find(c => c.email === user?.email);
  const isAdminOrCoach = user?.role === 'admin' || !!currentCoach;

  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations'],
    queryFn: async () => {
      const allEvals = await base44.entities.Evaluation.list('-created_date');
      if (currentCoach && user?.role !== 'admin') {
        const coachTeamIds = currentCoach.team_ids || [];
        const players = await base44.entities.Player.list();
        const coachPlayerIds = players.filter(p => coachTeamIds.includes(p.team_id)).map(p => p.id);
        return allEvals.filter(e => coachPlayerIds.includes(e.player_id));
      }
      return allEvals;
    }
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  useEffect(() => {
    // Set evaluator for new forms if user is available
    if (user && formData.evaluator === '') {
      setFormData(prev => ({ ...prev, evaluator: user.full_name || '' }));
    }
  }, [user]);

  useEffect(() => {
    if (preselectedPlayerId && players.length > 0) {
      const player = players.find(p => p.id === preselectedPlayerId);
      if (player) {
        handlePlayerSelect(preselectedPlayerId);
        setShowDialog(true);
      }
    }
  }, [preselectedPlayerId, players]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Evaluation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['evaluations']);
      setShowDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Evaluation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['evaluations']);
      setShowEditDialog(false);
      setEditingEvaluation(null);
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
      ...initialFormData,
      evaluator: user?.full_name || ''
    });
  };

  const handlePlayerSelect = (playerId) => {
    const player = players.find(p => p.id === playerId);
    if (player) {
      const team = teams.find(t => t.id === player.team_id);
      const birthYear = player.date_of_birth ? new Date(player.date_of_birth).getFullYear().toString() : '';
      const position = player.primary_position || '';
      const positionFields = getPositionFields(position);
      
      setFormData(prev => ({
        ...prev,
        player_id: playerId,
        player_name: player.full_name,
        birth_year: birthYear,
        team_name: team?.name || '',
        primary_position: position,
        secondary_position: player.secondary_position || '',
        preferred_foot: player.preferred_foot || 'Right',
        evaluator: prev.evaluator || user?.full_name || '',
        position_role_1_label: positionFields[0]?.label || '',
        position_role_2_label: positionFields[1]?.label || '',
        position_role_3_label: positionFields[2]?.label || '',
        position_role_4_label: positionFields[3]?.label || ''
      }));
    }
  };

  const handlePositionChange = (position) => {
    const positionFields = getPositionFields(position);
    setFormData(prev => ({
      ...prev,
      primary_position: position,
      position_role_1_label: positionFields[0]?.label || '',
      position_role_2_label: positionFields[1]?.label || '',
      position_role_3_label: positionFields[2]?.label || '',
      position_role_4_label: positionFields[3]?.label || ''
    }));
  };

  const handleEditEvaluation = (evaluation) => {
    setEditingEvaluation(evaluation);
    const positionFields = getPositionFields(evaluation.primary_position);

    setFormData({
      player_id: evaluation.player_id || '',
      player_name: evaluation.player_name || '',
      birth_year: evaluation.birth_year || '',
      team_name: evaluation.team_name || '',
      my_goals: evaluation.my_goals || '',
      evaluator: evaluation.evaluator || user?.full_name || '',
      current_team_status: evaluation.current_team_status || '',
      growth_mindset: evaluation.growth_mindset || 5,
      resilience: evaluation.resilience || 5,
      efficiency_in_execution: evaluation.efficiency_in_execution || 5,
      athleticism: evaluation.athleticism || 5,
      team_focus: evaluation.team_focus || 5,
      primary_position: evaluation.primary_position || '',
      secondary_position: evaluation.secondary_position || '',
      preferred_foot: evaluation.preferred_foot || 'Right',
      defending_organized: evaluation.defending_organized || 5,
      defending_final_third: evaluation.defending_final_third || 5,
      defending_transition: evaluation.defending_transition || 5,
      pressing: evaluation.pressing || 5,
      defending_set_pieces: evaluation.defending_set_pieces || 5,
      attacking_organized: evaluation.attacking_organized || 5,
      attacking_final_third: evaluation.attacking_final_third || 5,
      attacking_in_transition: evaluation.attacking_in_transition || 5,
      building_out: evaluation.building_out || 5,
      attacking_set_pieces: evaluation.attacking_set_pieces || 5,
      player_strengths: evaluation.player_strengths || '',
      areas_of_growth: evaluation.areas_of_growth || '',
      training_focus: evaluation.training_focus || '',
      position_role_1: evaluation.position_role_1 || 5,
      position_role_2: evaluation.position_role_2 || 5,
      position_role_3: evaluation.position_role_3 || 5,
      position_role_4: evaluation.position_role_4 || 5,
      position_role_1_label: evaluation.position_role_1_label || positionFields[0]?.label || '',
      position_role_2_label: evaluation.position_role_2_label || positionFields[1]?.label || '',
      position_role_3_label: evaluation.position_role_3_label || positionFields[2]?.label || '',
      position_role_4_label: evaluation.position_role_4_label || positionFields[3]?.label || ''
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (editingEvaluation) {
      updateMutation.mutate({ id: editingEvaluation.id, data: formData });
    }
  };

  const dialogPositionFields = getPositionFields(formData.primary_position);

  const RatingSlider = ({ label, value, onChange, description }) => (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <Label className="text-sm font-semibold text-slate-700">{label}</Label>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-emerald-600">{value}</span>
          <span className="text-sm font-medium text-slate-600 min-w-[100px]">{ratingLabels[value]}</span>
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

  const filteredEvaluations = evaluations.filter(e => {
    const matchesSearch = e.player_name?.toLowerCase().includes(search.toLowerCase()) ||
      e.team_name?.toLowerCase().includes(search.toLowerCase());
    const matchesTeam = filterTeam === 'all' || e.team_name === filterTeam;
    const matchesPosition = filterPosition === 'all' || e.primary_position === filterPosition;
    return matchesSearch && matchesTeam && matchesPosition;
  });

  const toggleCard = (id) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCards(newExpanded);
  };

  const uniqueTeams = [...new Set(evaluations.map(e => e.team_name).filter(Boolean))];

  const handleGenerateNotes = async () => {
    if (!formData.player_id) return;
    
    setGeneratingNotes(true);
    try {
      const player = players.find(p => p.id === formData.player_id);
      
      const prompt = `You are Adil, an expert soccer coach analyzing a player's evaluation data. Generate development notes for ${formData.player_name}.

Position: ${formData.primary_position}
Team: ${formData.team_name}

Current Ratings (1-10 scale):
Mental & Physical:
- Growth Mindset: ${formData.growth_mindset}/10
- Resilience: ${formData.resilience}/10
- Efficiency: ${formData.efficiency_in_execution}/10
- Athleticism: ${formData.athleticism}/10
- Team Focus: ${formData.team_focus}/10

Defending:
- Organized: ${formData.defending_organized}/10
- Final Third: ${formData.defending_final_third}/10
- Transition: ${formData.defending_transition}/10
- Pressing: ${formData.pressing}/10
- Set-Pieces: ${formData.defending_set_pieces}/10

Attacking:
- Organized: ${formData.attacking_organized}/10
- Final Third: ${formData.attacking_final_third}/10
- Transition: ${formData.attacking_in_transition}/10
- Building Out: ${formData.building_out}/10
- Set-Pieces: ${formData.attacking_set_pieces}/10

${formData.my_goals ? `Player's Goals: ${formData.my_goals}` : ''}

Generate concise, actionable development notes with 3-4 bullet points each for:
1. Strengths (what the player excels at)
2. Areas of Growth (what needs improvement)
3. Training Focus (specific training recommendations)

Be specific and actionable. Focus on the position and ratings provided.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            strengths: { type: 'string' },
            areas_of_growth: { type: 'string' },
            training_focus: { type: 'string' }
          }
        }
      });

      setFormData(prev => ({
        ...prev,
        player_strengths: response.strengths,
        areas_of_growth: response.areas_of_growth,
        training_focus: response.training_focus
      }));

    } catch (error) {
      console.error('Error generating notes:', error);
    } finally {
      setGeneratingNotes(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-[1800px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Player Evaluations</h1>
          <p className="text-slate-600 mt-1">Comprehensive player assessment and development tracking</p>
        </div>
        {isAdminOrCoach && (
          <Button onClick={() => { resetForm(); setShowDialog(true); }} className="bg-emerald-600 hover:bg-emerald-700 h-12 px-6 text-base font-semibold shadow-lg">
            <Plus className="w-5 h-5 mr-2" />
            New Evaluation
          </Button>
        )}
      </div>

      <Card className="border-none shadow-lg mb-6">
        <CardContent className="p-4">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Search by player name or team..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-2 h-12"
              />
            </div>
            <div>
              <Select value={filterTeam} onValueChange={setFilterTeam}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {uniqueTeams.map(team => (
                    <SelectItem key={team} value={team}>{team}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={filterPosition} onValueChange={setFilterPosition}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="All Positions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Positions</SelectItem>
                  {POSITIONS.map(pos => (
                    <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEvaluations.map(evaluation => {
          const evalPositionFields = getPositionFields(evaluation.primary_position);
          const isExpanded = expandedCards.has(evaluation.id);
          
          return (
            <Card 
              key={evaluation.id} 
              className="border-none shadow-lg hover:shadow-xl transition-all cursor-pointer relative group"
              onClick={() => !isExpanded && navigate(`${createPageUrl('PlayerDashboard')}?id=${evaluation.player_id}`)}
            >
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 border-b pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                    <CardTitle className="text-lg text-slate-900 mb-1">{evaluation.player_name}</CardTitle>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                      <Badge className="bg-slate-100 text-slate-700">{evaluation.birth_year}</Badge>
                      <Badge className="bg-blue-100 text-blue-700">{evaluation.team_name}</Badge>
                      <Badge className="bg-purple-100 text-purple-700">{evaluation.primary_position}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleCard(evaluation.id)}
                      className="h-8 w-8 hover:bg-slate-200"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                    {isAdminOrCoach && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditEvaluation(evaluation)}
                        className="h-8 w-8 hover:bg-emerald-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    {isAdminOrCoach && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteEvalId(evaluation.id)}
                        className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {!isExpanded && (
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between p-2 bg-emerald-50 rounded">
                      <span className="text-slate-600">Growth Mindset</span>
                      <span className="font-bold text-emerald-700">{evaluation.growth_mindset}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-blue-50 rounded">
                      <span className="text-slate-600">Athleticism</span>
                      <span className="font-bold text-blue-700">{evaluation.athleticism}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-orange-50 rounded">
                      <span className="text-slate-600">Attacking</span>
                      <span className="font-bold text-orange-700">{Math.round(((evaluation.attacking_organized || 0) + (evaluation.attacking_final_third || 0) + (evaluation.attacking_in_transition || 0)) / 3)}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-red-50 rounded">
                      <span className="text-slate-600">Defending</span>
                      <span className="font-bold text-red-700">{Math.round(((evaluation.defending_organized || 0) + (evaluation.defending_final_third || 0) + (evaluation.defending_transition || 0)) / 3)}</span>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-slate-500">
                    Evaluated by {evaluation.evaluator} • {new Date(evaluation.created_date).toLocaleDateString()}
                  </div>
                </CardContent>
              )}

              {isExpanded && (
                <CardContent className="p-4" onClick={(e) => e.stopPropagation()}>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm text-slate-700 mb-2">Mental & Physical</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Growth Mindset', value: evaluation.growth_mindset, color: 'emerald' },
                          { label: 'Resilience', value: evaluation.resilience, color: 'blue' },
                          { label: 'Efficiency', value: evaluation.efficiency_in_execution, color: 'purple' },
                          { label: 'Athleticism', value: evaluation.athleticism, color: 'orange' },
                          { label: 'Team Focus', value: evaluation.team_focus, color: 'pink' }
                        ].map(item => (
                          <div key={item.label} className={`flex justify-between items-center p-2 bg-${item.color}-50 rounded text-xs`}>
                            <span className="text-slate-700">{item.label}</span>
                            <span className={`font-bold text-${item.color}-700`}>{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-sm text-slate-700 mb-2">Defending</h4>
                        <div className="space-y-2">
                          {[
                            { label: 'Organized', value: evaluation.defending_organized },
                            { label: 'Final Third', value: evaluation.defending_final_third },
                            { label: 'Transition', value: evaluation.defending_transition },
                            { label: 'Pressing', value: evaluation.pressing },
                            { label: 'Set-Pieces', value: evaluation.defending_set_pieces }
                          ].map(item => item.value !== undefined && item.value !== null ? (
                            <div key={item.label} className="flex justify-between items-center p-2 bg-red-50 rounded text-xs">
                              <span className="text-slate-700">{item.label}</span>
                              <span className="font-bold text-red-700">{item.value}</span>
                            </div>
                          ) : null)}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-sm text-slate-700 mb-2">Attacking</h4>
                        <div className="space-y-2">
                          {[
                            { label: 'Organized', value: evaluation.attacking_organized },
                            { label: 'Final Third', value: evaluation.attacking_final_third },
                            { label: 'Transition', value: evaluation.attacking_in_transition },
                            { label: 'Building Out', value: evaluation.building_out },
                            { label: 'Set-Pieces', value: evaluation.attacking_set_pieces }
                          ].map(item => item.value !== undefined && item.value !== null ? (
                            <div key={item.label} className="flex justify-between items-center p-2 bg-orange-50 rounded text-xs">
                              <span className="text-slate-700">{item.label}</span>
                              <span className="font-bold text-orange-700">{item.value}</span>
                            </div>
                          ) : null)}
                        </div>
                      </div>
                    </div>

                    {evalPositionFields.some((_, idx) => evaluation[`position_role_${idx + 1}`]) && (
                      <div>
                        <h4 className="font-semibold text-sm text-slate-700 mb-2">Position Skills</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {evalPositionFields.map((field, idx) => {
                            const value = evaluation[`position_role_${idx + 1}`];
                            const label = evaluation[`position_role_${idx + 1}_label`] || field.label;
                            if (value === undefined || value === null) return null;
                            return (
                              <div key={idx} className="flex justify-between items-center p-2 bg-indigo-50 rounded text-xs">
                                <span className="text-slate-700 truncate pr-2">{label}</span>
                                <span className="font-bold text-indigo-700">{value}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {(evaluation.player_strengths || evaluation.areas_of_growth || evaluation.training_focus) && (
                      <div className="space-y-2">
                        {evaluation.player_strengths && (
                          <div className="p-2 bg-green-50 rounded">
                            <div className="text-xs font-semibold text-green-700 mb-1">Strengths</div>
                            <div className="text-xs text-slate-700">{evaluation.player_strengths}</div>
                          </div>
                        )}
                        {evaluation.areas_of_growth && (
                          <div className="p-2 bg-orange-50 rounded">
                            <div className="text-xs font-semibold text-orange-700 mb-1">Areas of Growth</div>
                            <div className="text-xs text-slate-700">{evaluation.areas_of_growth}</div>
                          </div>
                        )}
                        {evaluation.training_focus && (
                          <div className="p-2 bg-blue-50 rounded">
                            <div className="text-xs font-semibold text-blue-700 mb-1">Training Focus</div>
                            <div className="text-xs text-slate-700">{evaluation.training_focus}</div>
                          </div>
                        )}
                      </div>
                    )}
                    {evaluation.current_team_status && (
                        <div className="p-2 bg-gray-50 rounded">
                          <div className="text-xs font-semibold text-gray-700 mb-1">Current Team Status</div>
                          <div className="text-xs text-slate-700">{evaluation.current_team_status}</div>
                        </div>
                    )}
                    {evaluation.my_goals && (
                        <div className="p-2 bg-yellow-50 rounded">
                          <div className="text-xs font-semibold text-yellow-700 mb-1">Player's Goals</div>
                          <div className="text-xs text-slate-700">{evaluation.my_goals}</div>
                        </div>
                    )}
                    <div className="text-xs text-slate-500 border-t pt-2">
                      Evaluated by {evaluation.evaluator} • {new Date(evaluation.created_date).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {filteredEvaluations.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          No evaluations found
        </div>
      )}

      {/* New Evaluation Dialog */}
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
              <CardContent className="p-4 md:p-6 space-y-4">
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
                    <Select value={formData.primary_position} onValueChange={handlePositionChange}>
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
              <CardContent className="p-4 md:p-6 space-y-6">
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
                <CardContent className="p-4 md:p-6 space-y-6">
                  <RatingSlider label="Defending Organized" value={formData.defending_organized} onChange={(val) => setFormData({...formData, defending_organized: val})} />
                  <RatingSlider label="Defending Final Third" value={formData.defending_final_third} onChange={(val) => setFormData({...formData, defending_final_third: val})} />
                  <RatingSlider label="Defending Transition" value={formData.defending_transition} onChange={(val) => setFormData({...formData, defending_transition: val})} />
                  <RatingSlider label="Pressing" value={formData.pressing} onChange={(val) => setFormData({...formData, pressing: val})} />
                  <RatingSlider label="Defending Set-Pieces" value={formData.defending_set_pieces} onChange={(val) => setFormData({...formData, defending_set_pieces: val})} />
                </CardContent>
              </Card>

              <Card className="border-2 border-orange-200">
                <CardHeader className="border-b bg-gradient-to-r from-orange-100 to-red-100">
                  <CardTitle className="text-lg">Attacking Skills</CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 space-y-6">
                  <RatingSlider label="Attacking Organized" value={formData.attacking_organized} onChange={(val) => setFormData({...formData, attacking_organized: val})} />
                  <RatingSlider label="Attacking Final Third" value={formData.attacking_final_third} onChange={(val) => setFormData({...formData, attacking_final_third: val})} />
                  <RatingSlider label="Attacking in Transition" value={formData.attacking_in_transition} onChange={(val) => setFormData({...formData, attacking_in_transition: val})} />
                  <RatingSlider label="Building Out" value={formData.building_out} onChange={(val) => setFormData({...formData, building_out: val})} />
                  <RatingSlider label="Attacking Set-Pieces" value={formData.attacking_set_pieces} onChange={(val) => setFormData({...formData, attacking_set_pieces: val})} />
                </CardContent>
              </Card>
            </div>

            {formData.primary_position && (
              <Card className="border-2 border-indigo-200">
                <CardHeader className="border-b bg-gradient-to-r from-indigo-100 to-purple-100">
                  <CardTitle className="text-lg">Position-Specific Skills ({formData.primary_position})</CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 space-y-6">
                  {dialogPositionFields.map((field, idx) => (
                    <RatingSlider
                      key={field.key}
                      label={field.label}
                      description={field.description}
                      value={formData[`position_role_${idx + 1}`]}
                      onChange={(val) => setFormData(prev => ({...prev, [`position_role_${idx + 1}`]: val}))}
                    />
                  ))}
                </CardContent>
              </Card>
            )}

            <Card className="border-2 border-purple-200">
              <CardHeader className="border-b bg-gradient-to-r from-purple-100 to-pink-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Development Notes</CardTitle>
                  <Button
                    onClick={handleGenerateNotes}
                    disabled={!formData.player_id || generatingNotes}
                    variant="outline"
                    className="border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    {generatingNotes ? 'Generating...' : "Adil's Notes"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-4">
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

      {/* Edit Evaluation Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <div className="w-2 h-8 bg-gradient-to-b from-emerald-500 to-blue-500 rounded-full" />
              Edit Player Evaluation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-8 mt-6">
            <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
              <CardHeader className="border-b bg-gradient-to-r from-emerald-100 to-blue-100">
                <CardTitle className="text-lg">Player Information</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold">Player Name</Label>
                    <Input value={formData.player_name} readOnly className="bg-slate-50 border-2 h-12" />
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
                    <Select value={formData.primary_position} onValueChange={handlePositionChange}>
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
              <CardContent className="p-4 md:p-6 space-y-6">
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
                <CardContent className="p-4 md:p-6 space-y-6">
                  <RatingSlider label="Defending Organized" value={formData.defending_organized} onChange={(val) => setFormData({...formData, defending_organized: val})} />
                  <RatingSlider label="Defending Final Third" value={formData.defending_final_third} onChange={(val) => setFormData({...formData, defending_final_third: val})} />
                  <RatingSlider label="Defending Transition" value={formData.defending_transition} onChange={(val) => setFormData({...formData, defending_transition: val})} />
                  <RatingSlider label="Pressing" value={formData.pressing} onChange={(val) => setFormData({...formData, pressing: val})} />
                  <RatingSlider label="Defending Set-Pieces" value={formData.defending_set_pieces} onChange={(val) => setFormData({...formData, defending_set_pieces: val})} />
                </CardContent>
              </Card>

              <Card className="border-2 border-orange-200">
                <CardHeader className="border-b bg-gradient-to-r from-orange-100 to-red-100">
                  <CardTitle className="text-lg">Attacking Skills</CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 space-y-6">
                  <RatingSlider label="Attacking Organized" value={formData.attacking_organized} onChange={(val) => setFormData({...formData, attacking_organized: val})} />
                  <RatingSlider label="Attacking Final Third" value={formData.attacking_final_third} onChange={(val) => setFormData({...formData, attacking_final_third: val})} />
                  <RatingSlider label="Attacking in Transition" value={formData.attacking_in_transition} onChange={(val) => setFormData({...formData, attacking_in_transition: val})} />
                  <RatingSlider label="Building Out" value={formData.building_out} onChange={(val) => setFormData({...formData, building_out: val})} />
                  <RatingSlider label="Attacking Set-Pieces" value={formData.attacking_set_pieces} onChange={(val) => setFormData({...formData, attacking_set_pieces: val})} />
                </CardContent>
              </Card>
            </div>

            {formData.primary_position && (
              <Card className="border-2 border-indigo-200">
                <CardHeader className="border-b bg-gradient-to-r from-indigo-100 to-purple-100">
                  <CardTitle className="text-lg">Position-Specific Skills ({formData.primary_position})</CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 space-y-6">
                  {dialogPositionFields.map((field, idx) => (
                    <RatingSlider
                      key={field.key}
                      label={field.label}
                      description={field.description}
                      value={formData[`position_role_${idx + 1}`]}
                      onChange={(val) => setFormData(prev => ({...prev, [`position_role_${idx + 1}`]: val}))}
                    />
                  ))}
                </CardContent>
              </Card>
            )}

            <Card className="border-2 border-purple-200">
              <CardHeader className="border-b bg-gradient-to-r from-purple-100 to-pink-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Development Notes</CardTitle>
                  <Button
                    onClick={handleGenerateNotes}
                    disabled={!formData.player_id || generatingNotes}
                    variant="outline"
                    className="border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    {generatingNotes ? 'Generating...' : "Adil's Notes"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-4">
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
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="h-12 px-8">
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit}
              disabled={!formData.player_id}
              className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 h-12 px-8 text-base font-semibold shadow-lg"
            >
              Save Changes
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