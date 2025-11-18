import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Activity, User, Search, SlidersHorizontal, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function Assessments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [seasonFilter, setSeasonFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newAssessment, setNewAssessment] = useState({
    player_id: '',
    assessment_date: new Date().toISOString().split('T')[0],
    position: '',
    age: '',
    linear_20m: '',
    speed_score: '',
    vertical_jump: '',
    vertical_score: '',
    yirt: '',
    yirt_score: '',
    agility_5_10_5: '',
    agility_score: '',
    energy_score: '',
    notes: ''
  });

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments'],
    queryFn: async () => {
      const allAssessments = await base44.entities.PhysicalAssessment.list('-assessment_date');
      if (user?.role === 'user') {
        const players = await base44.entities.Player.list();
        const currentPlayer = players.find(p => p.email === user.email);
        return allAssessments.filter(a => a.player_id === currentPlayer?.id);
      }
      if (user?.role === 'coach') {
        const coaches = await base44.entities.Coach.list();
        const currentCoach = coaches.find(c => c.email === user.email);
        if (currentCoach?.team_ids) {
          const teamPlayers = await base44.entities.Player.list();
          const playerIds = teamPlayers.filter(p => currentCoach.team_ids.includes(p.team_id)).map(p => p.id);
          return allAssessments.filter(a => playerIds.includes(a.player_id));
        }
      }
      return allAssessments;
    },
    enabled: !!user
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const createAssessmentMutation = useMutation({
    mutationFn: (data) => base44.entities.PhysicalAssessment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['assessments']);
      setShowCreateDialog(false);
      setNewAssessment({
        player_id: '',
        assessment_date: new Date().toISOString().split('T')[0],
        position: '',
        age: '',
        linear_20m: '',
        speed_score: '',
        vertical_jump: '',
        vertical_score: '',
        yirt: '',
        yirt_score: '',
        agility_5_10_5: '',
        agility_score: '',
        energy_score: '',
        notes: ''
      });
    }
  });

  const updateAssessmentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PhysicalAssessment.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['assessments'])
  });

  const deleteAssessmentMutation = useMutation({
    mutationFn: (id) => base44.entities.PhysicalAssessment.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['assessments'])
  });

  const calculateOverallScore = (assessment) => {
    const speed = assessment.speed_score || 0;
    const agility = assessment.agility_score || 0;
    const power = assessment.vertical_score || 0;
    const endurance = assessment.yirt_score || 0;
    return Math.round(((5 * speed) + agility + (3 * power) + (6 * endurance)) / 60);
  };

  const seasons = [...new Set(assessments.map(a => {
    const year = new Date(a.assessment_date).getFullYear();
    return `${year}-${(year + 1).toString().slice(2)}`;
  }))].sort();

  let filteredAssessments = assessments.filter(assessment => {
    const player = players.find(p => p.id === assessment.player_id);
    const playerName = player?.full_name?.toLowerCase() || '';
    const matchesSearch = playerName.includes(searchTerm.toLowerCase());
    const matchesTeam = teamFilter === 'all' || player?.team_id === teamFilter;
    const assessmentYear = new Date(assessment.assessment_date).getFullYear();
    const assessmentSeason = `${assessmentYear}-${(assessmentYear + 1).toString().slice(2)}`;
    const matchesSeason = seasonFilter === 'all' || assessmentSeason === seasonFilter;
    return matchesSearch && matchesTeam && matchesSeason;
  });

  filteredAssessments = filteredAssessments.sort((a, b) => {
    const playerA = players.find(p => p.id === a.player_id);
    const playerB = players.find(p => p.id === b.player_id);
    
    if (sortBy === 'name') {
      const lastNameA = playerA?.full_name?.split(' ').pop() || '';
      const lastNameB = playerB?.full_name?.split(' ').pop() || '';
      return lastNameA.localeCompare(lastNameB);
    } else if (sortBy === 'date') {
      return new Date(b.assessment_date) - new Date(a.assessment_date);
    } else if (sortBy === 'score') {
      return calculateOverallScore(b) - calculateOverallScore(a);
    }
    return 0;
  });

  const handleFieldUpdate = (assessmentId, field, value) => {
    updateAssessmentMutation.mutate({ id: assessmentId, data: { [field]: value } });
  };

  const handleCreateAssessment = () => {
    const cleanData = Object.fromEntries(
      Object.entries(newAssessment).filter(([_, v]) => v !== '' && v !== null)
    );
    createAssessmentMutation.mutate(cleanData);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Physical Assessments</h1>
          <p className="text-slate-600 mt-1">Monitor athletic performance and fitness levels</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          New Assessment
        </Button>
      </div>

      <Card className="border-none shadow-lg mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5" />
            Filters & Sorting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by player name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger><SelectValue placeholder="Filter by team" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map(team => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={seasonFilter} onValueChange={setSeasonFilter}>
              <SelectTrigger><SelectValue placeholder="Filter by season" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Seasons</SelectItem>
                {seasons.map(season => <SelectItem key={season} value={season}>{season}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger><SelectValue placeholder="Sort by" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (Newest)</SelectItem>
                <SelectItem value="name">Last Name</SelectItem>
                <SelectItem value="score">Overall Score</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="cards" className="w-full">
        <TabsList>
          <TabsTrigger value="cards">Card View</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
        </TabsList>

        <TabsContent value="cards">
          {filteredAssessments.length === 0 ? (
            <Card className="border-none shadow-lg">
              <CardContent className="p-12 text-center">
                <Activity className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No Assessments Found</h3>
                <p className="text-slate-600">Try adjusting your filters</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssessments.map(assessment => {
                const player = players.find(p => p.id === assessment.player_id);
                const team = teams.find(t => t.id === player?.team_id);
                const overallScore = calculateOverallScore(assessment);
                
                return (
                  <Link key={assessment.id} to={`${createPageUrl('PlayerProfile')}?id=${assessment.player_id}`}>
                    <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-slate-900">{player?.full_name || 'Player'}</h3>
                            <p className="text-xs text-slate-600">{new Date(assessment.assessment_date).toLocaleDateString()}</p>
                            {team && <p className="text-xs text-slate-500">{team.name}</p>}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="p-3 bg-red-50 rounded-lg">
                            <div className="text-xs text-red-600 mb-1">20m Linear</div>
                            <div className="text-lg font-bold text-red-700">{assessment.linear_20m?.toFixed(2) || 'N/A'}s</div>
                          </div>
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="text-xs text-blue-600 mb-1">Vertical</div>
                            <div className="text-lg font-bold text-blue-700">{assessment.vertical_jump?.toFixed(1) || 'N/A'}"</div>
                          </div>
                          <div className="p-3 bg-pink-50 rounded-lg">
                            <div className="text-xs text-pink-600 mb-1">YIRT</div>
                            <div className="text-lg font-bold text-pink-700">{assessment.yirt || 'N/A'}</div>
                          </div>
                          <div className="p-3 bg-emerald-50 rounded-lg">
                            <div className="text-xs text-emerald-600 mb-1">5-10-5</div>
                            <div className="text-lg font-bold text-emerald-700">{assessment.agility_5_10_5?.toFixed(2) || 'N/A'}s</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <span className="text-sm text-slate-600">Overall Score</span>
                          <span className="text-2xl font-bold text-slate-900">{overallScore}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="table">
          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>20m Linear</TableHead>
                      <TableHead>Speed Score</TableHead>
                      <TableHead>Vertical</TableHead>
                      <TableHead>Vertical Score</TableHead>
                      <TableHead>YIRT</TableHead>
                      <TableHead>YIRT Score</TableHead>
                      <TableHead>5-10-5</TableHead>
                      <TableHead>5-10-5 Score</TableHead>
                      <TableHead>Energy Score</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssessments.map(assessment => {
                      const player = players.find(p => p.id === assessment.player_id);
                      const team = teams.find(t => t.id === player?.team_id);
                      return (
                        <TableRow key={assessment.id}>
                          <TableCell className="font-medium">{player?.full_name}</TableCell>
                          <TableCell>{team?.name || 'N/A'}</TableCell>
                          <TableCell>
                            <Input type="date" value={assessment.assessment_date} 
                              onChange={(e) => handleFieldUpdate(assessment.id, 'assessment_date', e.target.value)} 
                              className="w-32" />
                          </TableCell>
                          <TableCell>
                            <Input value={assessment.position || ''} 
                              onChange={(e) => handleFieldUpdate(assessment.id, 'position', e.target.value)} 
                              className="w-24" />
                          </TableCell>
                          <TableCell>
                            <Input type="number" value={assessment.age || ''} 
                              onChange={(e) => handleFieldUpdate(assessment.id, 'age', parseFloat(e.target.value))} 
                              className="w-16" />
                          </TableCell>
                          <TableCell>
                            <Input type="number" step="0.01" value={assessment.linear_20m || ''} 
                              onChange={(e) => handleFieldUpdate(assessment.id, 'linear_20m', parseFloat(e.target.value))} 
                              className="w-20" />
                          </TableCell>
                          <TableCell>
                            <Input type="number" value={assessment.speed_score || ''} 
                              onChange={(e) => handleFieldUpdate(assessment.id, 'speed_score', parseFloat(e.target.value))} 
                              className="w-20" />
                          </TableCell>
                          <TableCell>
                            <Input type="number" step="0.1" value={assessment.vertical_jump || ''} 
                              onChange={(e) => handleFieldUpdate(assessment.id, 'vertical_jump', parseFloat(e.target.value))} 
                              className="w-20" />
                          </TableCell>
                          <TableCell>
                            <Input type="number" value={assessment.vertical_score || ''} 
                              onChange={(e) => handleFieldUpdate(assessment.id, 'vertical_score', parseFloat(e.target.value))} 
                              className="w-20" />
                          </TableCell>
                          <TableCell>
                            <Input type="number" value={assessment.yirt || ''} 
                              onChange={(e) => handleFieldUpdate(assessment.id, 'yirt', parseFloat(e.target.value))} 
                              className="w-20" />
                          </TableCell>
                          <TableCell>
                            <Input type="number" value={assessment.yirt_score || ''} 
                              onChange={(e) => handleFieldUpdate(assessment.id, 'yirt_score', parseFloat(e.target.value))} 
                              className="w-20" />
                          </TableCell>
                          <TableCell>
                            <Input type="number" step="0.01" value={assessment.agility_5_10_5 || ''} 
                              onChange={(e) => handleFieldUpdate(assessment.id, 'agility_5_10_5', parseFloat(e.target.value))} 
                              className="w-20" />
                          </TableCell>
                          <TableCell>
                            <Input type="number" value={assessment.agility_score || ''} 
                              onChange={(e) => handleFieldUpdate(assessment.id, 'agility_score', parseFloat(e.target.value))} 
                              className="w-20" />
                          </TableCell>
                          <TableCell>
                            <Input type="number" value={assessment.energy_score || ''} 
                              onChange={(e) => handleFieldUpdate(assessment.id, 'energy_score', parseFloat(e.target.value))} 
                              className="w-20" />
                          </TableCell>
                          <TableCell>
                            <Button variant="destructive" size="sm" onClick={() => deleteAssessmentMutation.mutate(assessment.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Physical Assessment</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <Label>Player *</Label>
              <Select value={newAssessment.player_id} onValueChange={(value) => setNewAssessment({...newAssessment, player_id: value})}>
                <SelectTrigger><SelectValue placeholder="Select player" /></SelectTrigger>
                <SelectContent>
                  {players.map(player => <SelectItem key={player.id} value={player.id}>{player.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date *</Label>
              <Input type="date" value={newAssessment.assessment_date} 
                onChange={(e) => setNewAssessment({...newAssessment, assessment_date: e.target.value})} />
            </div>
            <div>
              <Label>Position</Label>
              <Input value={newAssessment.position} 
                onChange={(e) => setNewAssessment({...newAssessment, position: e.target.value})} />
            </div>
            <div>
              <Label>Age</Label>
              <Input type="number" value={newAssessment.age} 
                onChange={(e) => setNewAssessment({...newAssessment, age: e.target.value})} />
            </div>
            <div>
              <Label>20m Linear (seconds)</Label>
              <Input type="number" step="0.01" value={newAssessment.linear_20m} 
                onChange={(e) => setNewAssessment({...newAssessment, linear_20m: e.target.value})} />
            </div>
            <div>
              <Label>Speed Score (0-100)</Label>
              <Input type="number" value={newAssessment.speed_score} 
                onChange={(e) => setNewAssessment({...newAssessment, speed_score: e.target.value})} />
            </div>
            <div>
              <Label>Vertical Jump (inches)</Label>
              <Input type="number" step="0.1" value={newAssessment.vertical_jump} 
                onChange={(e) => setNewAssessment({...newAssessment, vertical_jump: e.target.value})} />
            </div>
            <div>
              <Label>Vertical Score (0-100)</Label>
              <Input type="number" value={newAssessment.vertical_score} 
                onChange={(e) => setNewAssessment({...newAssessment, vertical_score: e.target.value})} />
            </div>
            <div>
              <Label>YIRT (levels)</Label>
              <Input type="number" value={newAssessment.yirt} 
                onChange={(e) => setNewAssessment({...newAssessment, yirt: e.target.value})} />
            </div>
            <div>
              <Label>YIRT Score (0-100)</Label>
              <Input type="number" value={newAssessment.yirt_score} 
                onChange={(e) => setNewAssessment({...newAssessment, yirt_score: e.target.value})} />
            </div>
            <div>
              <Label>5-10-5 (seconds)</Label>
              <Input type="number" step="0.01" value={newAssessment.agility_5_10_5} 
                onChange={(e) => setNewAssessment({...newAssessment, agility_5_10_5: e.target.value})} />
            </div>
            <div>
              <Label>5-10-5 Score (0-100)</Label>
              <Input type="number" value={newAssessment.agility_score} 
                onChange={(e) => setNewAssessment({...newAssessment, agility_score: e.target.value})} />
            </div>
            <div>
              <Label>Energy Score</Label>
              <Input type="number" value={newAssessment.energy_score} 
                onChange={(e) => setNewAssessment({...newAssessment, energy_score: e.target.value})} />
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <Input value={newAssessment.notes} 
                onChange={(e) => setNewAssessment({...newAssessment, notes: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateAssessment} disabled={!newAssessment.player_id} className="bg-emerald-600 hover:bg-emerald-700">
              Create Assessment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}