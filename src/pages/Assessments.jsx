import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Activity, User, Search, Plus, Trash2, ArrowUpDown, Users as UsersIcon, Upload, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';
import BulkImportAssessments from '../components/assessments/BulkImportAssessments';
import CleanAssessmentsDialog from '../components/assessments/CleanAssessmentsDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function Assessments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedAssessments, setSelectedAssessments] = useState([]);
  const [bulkTeamId, setBulkTeamId] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkImportDialog, setShowBulkImportDialog] = useState(false);
  const [showCleanDialog, setShowCleanDialog] = useState(false);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all');
  const [selectedLeague, setSelectedLeague] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedBirthYear, setSelectedBirthYear] = useState('all');
  const [sortBy, setSortBy] = useState('overall_score');
  const [sortDirection, setSortDirection] = useState('desc');
  const [newAssessment, setNewAssessment] = useState({
    player_id: '',
    team_id: '',
    assessment_date: new Date().toISOString().split('T')[0],
    sprint: '',
    vertical: '',
    yirt: '',
    shuttle: '',
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
          return allAssessments.filter(a => currentCoach.team_ids.includes(a.team_id));
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

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const calculateScores = (sprint, vertical, yirt, shuttle) => {
    const speed = sprint > 0 ? 5 * (20 - 10 * (3.5 * (sprint - 2.8) / sprint)) : 0;
    
    let power = 0;
    if (vertical > 13) {
      power = 5 * (20 - (20 * (26 - vertical) / vertical));
    } else if (vertical === 13) {
      power = 10;
    } else if (vertical === 12) {
      power = 9;
    } else if (vertical === 11) {
      power = 8;
    } else if (vertical === 10) {
      power = 7;
    } else if (vertical < 10) {
      power = 5;
    }
    
    const endurance = yirt > 0 ? 5 * (20 - 10 * (55 - yirt) / 32) : 0;
    const agility = shuttle > 0 ? 5 * (20 - 10 * (5.2 * (shuttle - 4.6) / shuttle)) : 0;
    const overall = ((6 * speed) + (3 * power) + (6 * endurance)) / 15;
    
    return {
      speed_score: Math.max(0, Math.min(100, Math.round(speed))),
      power_score: Math.max(0, Math.min(100, Math.round(power))),
      endurance_score: Math.max(0, Math.min(100, Math.round(endurance))),
      agility_score: Math.max(0, Math.min(100, Math.round(agility))),
      overall_score: Math.max(0, Math.min(100, Math.round(overall)))
    };
  };

  const createAssessmentMutation = useMutation({
    mutationFn: (data) => {
      const player = players.find(p => p.id === data.player_id);
      const scores = calculateScores(data.sprint, data.vertical, data.yirt, data.shuttle);
      return base44.entities.PhysicalAssessment.create({
        ...data,
        player_name: player?.full_name || '',
        ...scores
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['assessments']);
      setShowCreateDialog(false);
      setNewAssessment({
        player_id: '',
        team_id: '',
        assessment_date: new Date().toISOString().split('T')[0],
        sprint: '',
        vertical: '',
        yirt: '',
        shuttle: '',
        notes: ''
      });
    }
  });

  const updateAssessmentMutation = useMutation({
    mutationFn: ({ id, data }) => {
      const assessment = assessments.find(a => a.id === id);
      const newSprint = data.sprint !== undefined ? data.sprint : assessment.sprint;
      const newVertical = data.vertical !== undefined ? data.vertical : assessment.vertical;
      const newYirt = data.yirt !== undefined ? data.yirt : assessment.yirt;
      const newShuttle = data.shuttle !== undefined ? data.shuttle : assessment.shuttle;
      
      const scores = calculateScores(newSprint, newVertical, newYirt, newShuttle);
      
      return base44.entities.PhysicalAssessment.update(id, {
        ...data,
        ...scores
      });
    },
    onSuccess: () => queryClient.invalidateQueries(['assessments'])
  });

  const deleteAssessmentMutation = useMutation({
    mutationFn: (id) => base44.entities.PhysicalAssessment.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['assessments'])
  });

  const bulkUpdateTeamMutation = useMutation({
    mutationFn: async (teamId) => {
      for (const assessmentId of selectedAssessments) {
        await base44.entities.PhysicalAssessment.update(assessmentId, { team_id: teamId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['assessments']);
      setSelectedAssessments([]);
      setBulkTeamId('');
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      for (const assessmentId of selectedAssessments) {
        await base44.entities.PhysicalAssessment.delete(assessmentId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['assessments']);
      setSelectedAssessments([]);
      setShowDeleteDialog(false);
    }
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async ({ assessments, unassigned }) => {
      // Check for duplicates before creating
      for (const assessment of assessments) {
        const existing = await base44.entities.PhysicalAssessment.filter({
          player_id: assessment.player_id,
          assessment_date: assessment.assessment_date
        });
        
        if (existing.length === 0) {
          await base44.entities.PhysicalAssessment.create(assessment);
        }
      }
      for (const record of unassigned) {
        await base44.entities.UnassignedPhysicalAssessment.create(record);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['assessments']);
      queryClient.invalidateQueries(['unassignedAssessments']);
      setShowBulkImportDialog(false);
    }
  });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };

  const filteredAssessments = assessments.filter(assessment => {
    const player = players.find(p => p.id === assessment.player_id);
    const team = teams.find(t => t.id === assessment.team_id);
    const playerName = (player?.full_name || assessment.player_name || '').toLowerCase();
    const birthYear = player?.date_of_birth ? new Date(player.date_of_birth).getFullYear().toString() : null;
    
    const matchesSearch = playerName.includes(searchTerm.toLowerCase());
    const matchesTeam = teamFilter === 'all' || assessment.team_id === teamFilter;
    const matchesAgeGroup = selectedAgeGroup === 'all' || team?.age_group === selectedAgeGroup;
    const matchesLeague = selectedLeague === 'all' || team?.league === selectedLeague;
    const matchesGender = selectedGender === 'all' || player?.gender === selectedGender || team?.gender === selectedGender;
    const matchesBirthYear = selectedBirthYear === 'all' || birthYear === selectedBirthYear;
    
    return matchesSearch && matchesTeam && matchesAgeGroup && matchesLeague && matchesGender && matchesBirthYear;
  }).sort((a, b) => {
    const aVal = a[sortBy] || 0;
    const bVal = b[sortBy] || 0;
    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const handleFieldUpdate = (assessmentId, field, value) => {
    const numericFields = ['sprint', 'vertical', 'yirt', 'shuttle'];
    const finalValue = numericFields.includes(field) ? parseFloat(value) || 0 : value;
    updateAssessmentMutation.mutate({ id: assessmentId, data: { [field]: finalValue } });
  };

  const handleCreateAssessment = () => {
    const cleanData = {
      player_id: newAssessment.player_id,
      team_id: newAssessment.team_id,
      assessment_date: newAssessment.assessment_date,
      sprint: parseFloat(newAssessment.sprint) || 0,
      vertical: parseFloat(newAssessment.vertical) || 0,
      yirt: parseFloat(newAssessment.yirt) || 0,
      shuttle: parseFloat(newAssessment.shuttle) || 0,
      notes: newAssessment.notes || ''
    };
    createAssessmentMutation.mutate(cleanData);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedAssessments(filteredAssessments.map(a => a.id));
    } else {
      setSelectedAssessments([]);
    }
  };

  const handleSelectAssessment = (assessmentId, checked) => {
    if (checked) {
      setSelectedAssessments([...selectedAssessments, assessmentId]);
    } else {
      setSelectedAssessments(selectedAssessments.filter(id => id !== assessmentId));
    }
  };

  const CircleProgress = ({ value, label, color }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (value / 100) * circumference;
    
    return (
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke={color}
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-slate-900">{value}</span>
          </div>
        </div>
        <span className="text-sm text-slate-600 mt-2">{label}</span>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Physical Assessments</h1>
          <p className="text-slate-600 mt-1">Monitor athletic performance and fitness levels</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowCleanDialog(true)} variant="outline" className="bg-orange-50">
            <Sparkles className="w-4 h-4 mr-2" />
            Clean Data
          </Button>
          <Button onClick={() => setShowBulkImportDialog(true)} variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Import
          </Button>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            New Assessment
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-lg mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-2 block">Gender</label>
              <Select value={selectedGender} onValueChange={setSelectedGender}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Male">Boys</SelectItem>
                  <SelectItem value="Female">Girls</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-2 block">Birth Year</label>
              <Select value={selectedBirthYear} onValueChange={setSelectedBirthYear}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {[...new Set(players.map(p => p.date_of_birth ? new Date(p.date_of_birth).getFullYear() : null).filter(Boolean))].sort((a, b) => b - a).map(year => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-2 block">Age Group</label>
              <Select value={selectedAgeGroup} onValueChange={setSelectedAgeGroup}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Age Groups</SelectItem>
                  {[...new Set(teams.map((t) => t.age_group).filter(Boolean))].sort((a, b) => {
                    const extractAge = (ag) => {
                      const match = ag?.match(/U-?(\d+)/i);
                      return match ? parseInt(match[1]) : 0;
                    };
                    return extractAge(b) - extractAge(a);
                  }).map((ageGroup) => (
                    <SelectItem key={ageGroup} value={ageGroup}>{ageGroup}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-2 block">League</label>
              <Select value={selectedLeague} onValueChange={setSelectedLeague}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Leagues</SelectItem>
                  {[...new Set(teams.map(t => t.league).filter(Boolean))].map(league => (
                    <SelectItem key={league} value={league}>{league}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-2 block">Team</label>
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-2 block">Sort By</label>
              <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setSortDirection('desc'); }}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="speed_score">Speed</SelectItem>
                  <SelectItem value="power_score">Power</SelectItem>
                  <SelectItem value="endurance_score">Endurance</SelectItem>
                  <SelectItem value="agility_score">Agility</SelectItem>
                  <SelectItem value="overall_score">Overall</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by player name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
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
                <p className="text-slate-600">Try adjusting your filters or create a new assessment</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssessments.map(assessment => {
                const player = players.find(p => p.id === assessment.player_id);
                const team = teams.find(t => t.id === assessment.team_id);
                
                return (
                  <Link 
                    key={assessment.id} 
                    to={player ? `${createPageUrl('PlayerDashboard')}?id=${player.id}` : '#'}
                    className={player ? 'cursor-pointer' : 'cursor-default'}
                  >
                    <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900">{player?.full_name || assessment.player_name || 'Player'}</h3>
                          <p className="text-xs text-slate-600">{new Date(assessment.assessment_date).toLocaleDateString()}</p>
                          {team && <p className="text-xs text-slate-500">{team.name}</p>}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="p-3 bg-red-50 rounded-lg">
                          <div className="text-xs text-red-600 mb-1">Sprint</div>
                          <div className="text-lg font-bold text-red-700">{assessment.sprint?.toFixed(2)}s</div>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="text-xs text-blue-600 mb-1">Vertical</div>
                          <div className="text-lg font-bold text-blue-700">{assessment.vertical}"</div>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-lg">
                          <div className="text-xs text-emerald-600 mb-1">YIRT</div>
                          <div className="text-lg font-bold text-emerald-700">{assessment.yirt}</div>
                        </div>
                        <div className="p-3 bg-pink-50 rounded-lg">
                          <div className="text-xs text-pink-600 mb-1">Shuttle</div>
                          <div className="text-lg font-bold text-pink-700">{assessment.shuttle?.toFixed(2)}s</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 mb-4">
                        <CircleProgress value={assessment.speed_score || 0} label="Speed" color="#ef4444" />
                        <CircleProgress value={assessment.power_score || 0} label="Power" color="#3b82f6" />
                        <CircleProgress value={assessment.endurance_score || 0} label="Endurance" color="#10b981" />
                        <CircleProgress value={assessment.agility_score || 0} label="Agility" color="#ec4899" />
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <span className="text-sm text-slate-600">Overall Score</span>
                        <span className="text-2xl font-bold text-emerald-600">{assessment.overall_score || 0}</span>
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
          <Card className="border-none shadow-lg mb-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Bulk Actions</CardTitle>
                <div className="text-sm text-slate-600">{selectedAssessments.length} selected</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Select value={bulkTeamId} onValueChange={setBulkTeamId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team to assign" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={() => bulkUpdateTeamMutation.mutate(bulkTeamId)}
                  disabled={selectedAssessments.length === 0 || !bulkTeamId}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <UsersIcon className="w-4 h-4 mr-2" />
                  Assign to Team
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={selectedAssessments.length === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-slate-900 to-slate-800">
                      <TableHead className="w-12 text-white">
                        <Checkbox
                          checked={selectedAssessments.length === filteredAssessments.length && filteredAssessments.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="text-white cursor-pointer hover:bg-slate-700" onClick={() => handleSort('player_name')}>
                        <div className="flex items-center">Name {sortBy === 'player_name' ? (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />) : <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />}</div>
                      </TableHead>
                      <TableHead className="text-white">Team</TableHead>
                      <TableHead className="text-white cursor-pointer hover:bg-slate-700" onClick={() => handleSort('assessment_date')}>
                        <div className="flex items-center">Date {sortBy === 'assessment_date' ? (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />) : <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />}</div>
                      </TableHead>
                      <TableHead className="text-white cursor-pointer hover:bg-slate-700" onClick={() => handleSort('sprint')}>
                        <div className="flex items-center">Sprint {sortBy === 'sprint' ? (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />) : <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />}</div>
                      </TableHead>
                      <TableHead className="text-white cursor-pointer hover:bg-slate-700" onClick={() => handleSort('vertical')}>
                        <div className="flex items-center">Vertical {sortBy === 'vertical' ? (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />) : <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />}</div>
                      </TableHead>
                      <TableHead className="text-white cursor-pointer hover:bg-slate-700" onClick={() => handleSort('yirt')}>
                        <div className="flex items-center">YIRT {sortBy === 'yirt' ? (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />) : <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />}</div>
                      </TableHead>
                      <TableHead className="text-white cursor-pointer hover:bg-slate-700" onClick={() => handleSort('shuttle')}>
                        <div className="flex items-center">Shuttle {sortBy === 'shuttle' ? (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />) : <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />}</div>
                      </TableHead>
                      <TableHead className="text-white cursor-pointer hover:bg-slate-700" onClick={() => handleSort('speed_score')}>
                        <div className="flex items-center">Speed {sortBy === 'speed_score' ? (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />) : <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />}</div>
                      </TableHead>
                      <TableHead className="text-white cursor-pointer hover:bg-slate-700" onClick={() => handleSort('power_score')}>
                        <div className="flex items-center">Power {sortBy === 'power_score' ? (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />) : <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />}</div>
                      </TableHead>
                      <TableHead className="text-white cursor-pointer hover:bg-slate-700" onClick={() => handleSort('endurance_score')}>
                        <div className="flex items-center">Endurance {sortBy === 'endurance_score' ? (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />) : <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />}</div>
                      </TableHead>
                      <TableHead className="text-white cursor-pointer hover:bg-slate-700" onClick={() => handleSort('agility_score')}>
                        <div className="flex items-center">Agility {sortBy === 'agility_score' ? (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />) : <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />}</div>
                      </TableHead>
                      <TableHead className="text-white cursor-pointer hover:bg-slate-700" onClick={() => handleSort('overall_score')}>
                        <div className="flex items-center">Overall {sortBy === 'overall_score' ? (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />) : <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />}</div>
                      </TableHead>
                      <TableHead className="text-white">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssessments.map(assessment => {
                      const player = players.find(p => p.id === assessment.player_id);
                      const team = teams.find(t => t.id === assessment.team_id);
                      return (
                        <TableRow key={assessment.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedAssessments.includes(assessment.id)}
                              onCheckedChange={(checked) => handleSelectAssessment(assessment.id, checked)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{player?.full_name || assessment.player_name}</TableCell>
                          <TableCell>
                            <Select 
                              value={assessment.team_id || ''} 
                              onValueChange={(value) => handleFieldUpdate(assessment.id, 'team_id', value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input type="date" value={assessment.assessment_date} 
                              onChange={(e) => handleFieldUpdate(assessment.id, 'assessment_date', e.target.value)} 
                              className="w-32" />
                          </TableCell>
                          <TableCell>
                            <Input type="number" step="0.01" value={assessment.sprint || ''} 
                              onChange={(e) => handleFieldUpdate(assessment.id, 'sprint', e.target.value)} 
                              className="w-20" />
                          </TableCell>
                          <TableCell>
                            <Input type="number" value={assessment.vertical || ''} 
                              onChange={(e) => handleFieldUpdate(assessment.id, 'vertical', e.target.value)} 
                              className="w-20" />
                          </TableCell>
                          <TableCell>
                            <Input type="number" value={assessment.yirt || ''} 
                              onChange={(e) => handleFieldUpdate(assessment.id, 'yirt', e.target.value)} 
                              className="w-20" />
                          </TableCell>
                          <TableCell>
                            <Input type="number" step="0.01" value={assessment.shuttle || ''} 
                              onChange={(e) => handleFieldUpdate(assessment.id, 'shuttle', e.target.value)} 
                              className="w-20" />
                          </TableCell>
                          <TableCell className="text-center font-semibold text-red-600">{assessment.speed_score || 0}</TableCell>
                          <TableCell className="text-center font-semibold text-blue-600">{assessment.power_score || 0}</TableCell>
                          <TableCell className="text-center font-semibold text-emerald-600">{assessment.endurance_score || 0}</TableCell>
                          <TableCell className="text-center font-semibold text-pink-600">{assessment.agility_score || 0}</TableCell>
                          <TableCell className="text-center font-bold text-slate-900">{assessment.overall_score || 0}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (window.confirm('Delete this assessment?')) {
                                  deleteAssessmentMutation.mutate(assessment.id);
                                }
                              }}
                              className="hover:bg-red-50 hover:text-red-600"
                            >
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
        <DialogContent className="max-w-2xl">
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
              <Label>Team *</Label>
              <Select value={newAssessment.team_id} onValueChange={(value) => setNewAssessment({...newAssessment, team_id: value})}>
                <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                <SelectContent>
                  {teams.map(team => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date *</Label>
              <Input type="date" value={newAssessment.assessment_date} 
                onChange={(e) => setNewAssessment({...newAssessment, assessment_date: e.target.value})} />
            </div>
            <div>
              <Label>Sprint (seconds) *</Label>
              <Input type="number" step="0.01" value={newAssessment.sprint} 
                onChange={(e) => setNewAssessment({...newAssessment, sprint: e.target.value})} 
                placeholder="e.g., 3.5" />
            </div>
            <div>
              <Label>Vertical Jump (inches) *</Label>
              <Input type="number" value={newAssessment.vertical} 
                onChange={(e) => setNewAssessment({...newAssessment, vertical: e.target.value})} 
                placeholder="e.g., 15" />
            </div>
            <div>
              <Label>YIRT (levels) *</Label>
              <Input type="number" value={newAssessment.yirt} 
                onChange={(e) => setNewAssessment({...newAssessment, yirt: e.target.value})} 
                placeholder="e.g., 45" />
            </div>
            <div>
              <Label>Shuttle (seconds) *</Label>
              <Input type="number" step="0.01" value={newAssessment.shuttle} 
                onChange={(e) => setNewAssessment({...newAssessment, shuttle: e.target.value})} 
                placeholder="e.g., 4.8" />
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <Input value={newAssessment.notes} 
                onChange={(e) => setNewAssessment({...newAssessment, notes: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateAssessment} 
              disabled={!newAssessment.player_id || !newAssessment.team_id || !newAssessment.sprint || !newAssessment.vertical || !newAssessment.yirt || !newAssessment.shuttle} 
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Create Assessment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedAssessments.length} Assessment(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected assessments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => bulkDeleteMutation.mutate()} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showBulkImportDialog} onOpenChange={setShowBulkImportDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Bulk Import Assessments</DialogTitle>
          </DialogHeader>
          <BulkImportAssessments
            players={players}
            teams={teams}
            onImportComplete={(assessments, unassigned) => bulkCreateMutation.mutate({ assessments, unassigned })}
          />
        </DialogContent>
      </Dialog>

      <CleanAssessmentsDialog
        open={showCleanDialog}
        onClose={() => setShowCleanDialog(false)}
        assessments={assessments}
        players={players}
        onComplete={() => {
          queryClient.invalidateQueries(['assessments']);
          setShowCleanDialog(false);
        }}
      />
    </div>
  );
}