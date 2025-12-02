import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  BarChart3, Users, Activity, TrendingUp, Target, Award, 
  ChevronRight, ChevronDown, Filter, Maximize2, X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend
} from 'recharts';
import TeamComparisonAnalytics from '../components/analytics/TeamComparisonAnalytics';
import PerformanceHeatmap from '../components/analytics/PerformanceHeatmap';
import HistoricalTrendAnalytics from '../components/analytics/HistoricalTrendAnalytics';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444'];

export default function Analytics() {
  const navigate = useNavigate();
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all');
  const [selectedLeague, setSelectedLeague] = useState('all');
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [expandedCard, setExpandedCard] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => base44.entities.PhysicalAssessment.list()
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations'],
    queryFn: () => base44.entities.Evaluation.list()
  });

  const { data: tryouts = [] } = useQuery({
    queryKey: ['tryouts'],
    queryFn: () => base44.entities.PlayerTryout.list()
  });

  // Get unique values for filters
  const ageGroups = [...new Set(teams.map(t => t.age_group).filter(Boolean))].sort((a, b) => {
    const extractAge = (ag) => {
      const match = ag?.match(/U-?(\d+)/i);
      return match ? parseInt(match[1]) : 0;
    };
    return extractAge(b) - extractAge(a);
  });
  
  const leagues = [...new Set(teams.map(t => t.league).filter(Boolean))];
  const positions = [...new Set(players.map(p => p.primary_position).filter(Boolean))];

  // Filter data based on selections
  const filteredTeams = teams.filter(t => {
    if (selectedAgeGroup !== 'all' && t.age_group !== selectedAgeGroup) return false;
    if (selectedLeague !== 'all' && t.league !== selectedLeague) return false;
    return true;
  });

  const filteredPlayers = players.filter(p => {
    const team = teams.find(t => t.id === p.team_id);
    if (selectedAgeGroup !== 'all' && team?.age_group !== selectedAgeGroup) return false;
    if (selectedLeague !== 'all' && team?.league !== selectedLeague) return false;
    if (selectedPosition !== 'all' && p.primary_position !== selectedPosition) return false;
    return true;
  });

  const filteredPlayerIds = filteredPlayers.map(p => p.id);
  const filteredAssessments = assessments.filter(a => filteredPlayerIds.includes(a.player_id));
  const filteredEvaluations = evaluations.filter(e => filteredPlayerIds.includes(e.player_id));
  const filteredTryouts = tryouts.filter(t => filteredPlayerIds.includes(t.player_id));

  // Overview stats
  const stats = {
    totalPlayers: filteredPlayers.length,
    totalTeams: filteredTeams.length,
    totalAssessments: filteredAssessments.length,
    totalEvaluations: filteredEvaluations.length,
    assessedPlayers: new Set(filteredAssessments.map(a => a.player_id)).size,
    evaluatedPlayers: new Set(filteredEvaluations.map(e => e.player_id)).size
  };

  // Assessment analytics by age group
  const assessmentsByAgeGroup = ageGroups.map(ag => {
    const agTeams = teams.filter(t => t.age_group === ag);
    const agPlayerIds = players.filter(p => agTeams.some(t => t.id === p.team_id)).map(p => p.id);
    const agAssessments = assessments.filter(a => agPlayerIds.includes(a.player_id));
    
    const latestByPlayer = {};
    agAssessments.forEach(a => {
      if (!latestByPlayer[a.player_id] || new Date(a.assessment_date) > new Date(latestByPlayer[a.player_id].assessment_date)) {
        latestByPlayer[a.player_id] = a;
      }
    });
    const latestAssessments = Object.values(latestByPlayer);
    
    const avg = (key) => latestAssessments.length > 0 
      ? Math.round(latestAssessments.reduce((sum, a) => sum + (a[key] || 0), 0) / latestAssessments.length) 
      : 0;
    
    return {
      ageGroup: ag,
      players: agPlayerIds.length,
      assessed: latestAssessments.length,
      avgSpeed: avg('speed_score'),
      avgPower: avg('power_score'),
      avgEndurance: avg('endurance_score'),
      avgAgility: avg('agility_score'),
      avgOverall: avg('overall_score')
    };
  }).filter(d => d.players > 0);

  // Evaluation analytics by age group
  const evaluationsByAgeGroup = ageGroups.map(ag => {
    const agTeams = teams.filter(t => t.age_group === ag);
    const agPlayerIds = players.filter(p => agTeams.some(t => t.id === p.team_id)).map(p => p.id);
    const agEvaluations = evaluations.filter(e => agPlayerIds.includes(e.player_id));
    
    const latestByPlayer = {};
    agEvaluations.forEach(e => {
      if (!latestByPlayer[e.player_id] || new Date(e.created_date) > new Date(latestByPlayer[e.player_id].created_date)) {
        latestByPlayer[e.player_id] = e;
      }
    });
    const latestEvals = Object.values(latestByPlayer);
    
    const avg = (key) => latestEvals.length > 0 
      ? Math.round(latestEvals.reduce((sum, e) => sum + (e[key] || 0), 0) / latestEvals.length * 10) / 10
      : 0;
    
    return {
      ageGroup: ag,
      evaluated: latestEvals.length,
      avgMental: Math.round(((avg('growth_mindset') + avg('resilience') + avg('team_focus')) / 3) * 10) / 10,
      avgDefending: Math.round(((avg('defending_organized') + avg('defending_final_third') + avg('defending_transition')) / 3) * 10) / 10,
      avgAttacking: Math.round(((avg('attacking_organized') + avg('attacking_final_third') + avg('attacking_in_transition')) / 3) * 10) / 10,
      avgAthleticism: avg('athleticism')
    };
  }).filter(d => d.evaluated > 0);

  // Tryout analytics
  const tryoutBreakdown = {
    registration: {
      'Signed & Paid': filteredTryouts.filter(t => t.registration_status === 'Signed and Paid').length,
      'Signed': filteredTryouts.filter(t => t.registration_status === 'Signed').length,
      'Not Signed': filteredTryouts.filter(t => !t.registration_status || t.registration_status === 'Not Signed').length
    },
    recommendation: {
      'Move Up': filteredTryouts.filter(t => t.recommendation === 'Move up').length,
      'Keep': filteredTryouts.filter(t => t.recommendation === 'Keep').length,
      'Move Down': filteredTryouts.filter(t => t.recommendation === 'Move down').length,
      'None': filteredTryouts.filter(t => !t.recommendation).length
    },
    status: {
      'Accepted': filteredTryouts.filter(t => t.next_season_status === 'Accepted Offer').length,
      'Considering': filteredTryouts.filter(t => t.next_season_status === 'Considering Offer').length,
      'Rejected': filteredTryouts.filter(t => t.next_season_status === 'Rejected Offer').length,
      'Not Offered': filteredTryouts.filter(t => t.next_season_status === 'Not Offered').length
    }
  };

  // Position breakdown
  const positionBreakdown = positions.map(pos => ({
    position: pos,
    count: filteredPlayers.filter(p => p.primary_position === pos).length
  })).sort((a, b) => b.count - a.count);

  // Team role breakdown
  const roleBreakdown = {};
  filteredTryouts.forEach(t => {
    if (t.team_role) {
      roleBreakdown[t.team_role] = (roleBreakdown[t.team_role] || 0) + 1;
    }
  });

  const registrationPieData = Object.entries(tryoutBreakdown.registration).map(([name, value], idx) => ({
    name, value, color: ['#10b981', '#3b82f6', '#ef4444'][idx]
  })).filter(d => d.value > 0);

  const recommendationPieData = Object.entries(tryoutBreakdown.recommendation).map(([name, value], idx) => ({
    name, value, color: COLORS[idx]
  })).filter(d => d.value > 0);

  const ExpandedDialog = ({ type, onClose }) => {
    if (type === 'assessments') {
      return (
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Physical Assessment Analytics</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="bg-blue-50"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">{stats.assessedPlayers}</div><div className="text-xs text-slate-600">Players Assessed</div></CardContent></Card>
              <Card className="bg-emerald-50"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-emerald-600">{stats.totalAssessments}</div><div className="text-xs text-slate-600">Total Assessments</div></CardContent></Card>
              <Card className="bg-purple-50"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-purple-600">{Math.round((stats.assessedPlayers / stats.totalPlayers) * 100) || 0}%</div><div className="text-xs text-slate-600">Assessment Rate</div></CardContent></Card>
              <Card className="bg-orange-50"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-orange-600">{assessmentsByAgeGroup.length > 0 ? Math.round(assessmentsByAgeGroup.reduce((sum, a) => sum + a.avgOverall, 0) / assessmentsByAgeGroup.length) : 0}</div><div className="text-xs text-slate-600">Avg Overall Score</div></CardContent></Card>
            </div>
            
            <Card><CardHeader><CardTitle className="text-sm">Average Scores by Age Group</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={assessmentsByAgeGroup}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="ageGroup" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avgSpeed" name="Speed" fill="#ef4444" />
                    <Bar dataKey="avgPower" name="Power" fill="#3b82f6" />
                    <Bar dataKey="avgEndurance" name="Endurance" fill="#10b981" />
                    <Bar dataKey="avgAgility" name="Agility" fill="#ec4899" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card><CardHeader><CardTitle className="text-sm">Overall Score by Age Group</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={assessmentsByAgeGroup}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="ageGroup" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="avgOverall" name="Avg Overall" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      );
    }

    if (type === 'evaluations') {
      return (
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Evaluation Analytics</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="bg-purple-50"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-purple-600">{stats.evaluatedPlayers}</div><div className="text-xs text-slate-600">Players Evaluated</div></CardContent></Card>
              <Card className="bg-blue-50"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">{stats.totalEvaluations}</div><div className="text-xs text-slate-600">Total Evaluations</div></CardContent></Card>
              <Card className="bg-emerald-50"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-emerald-600">{Math.round((stats.evaluatedPlayers / stats.totalPlayers) * 100) || 0}%</div><div className="text-xs text-slate-600">Evaluation Rate</div></CardContent></Card>
            </div>
            
            <Card><CardHeader><CardTitle className="text-sm">Skills by Age Group</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={evaluationsByAgeGroup}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="ageGroup" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avgMental" name="Mental" fill="#8b5cf6" />
                    <Bar dataKey="avgDefending" name="Defending" fill="#ef4444" />
                    <Bar dataKey="avgAttacking" name="Attacking" fill="#10b981" />
                    <Bar dataKey="avgAthleticism" name="Athleticism" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      );
    }

    if (type === 'tryouts') {
      return (
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tryout Analytics</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="bg-emerald-50"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-emerald-600">{tryoutBreakdown.registration['Signed & Paid']}</div><div className="text-xs text-slate-600">Signed & Paid</div></CardContent></Card>
              <Card className="bg-blue-50"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">{tryoutBreakdown.status['Accepted']}</div><div className="text-xs text-slate-600">Accepted Offers</div></CardContent></Card>
              <Card className="bg-orange-50"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-orange-600">{tryoutBreakdown.status['Considering']}</div><div className="text-xs text-slate-600">Considering</div></CardContent></Card>
              <Card className="bg-red-50"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-red-600">{tryoutBreakdown.status['Rejected']}</div><div className="text-xs text-slate-600">Rejected</div></CardContent></Card>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <Card><CardHeader><CardTitle className="text-sm">Registration Status</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={registrationPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {registrationPieData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card><CardHeader><CardTitle className="text-sm">Recommendations</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={recommendationPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {recommendationPieData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card><CardHeader><CardTitle className="text-sm">Team Role Distribution</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(roleBreakdown).map(([role, count], idx) => (
                    <div key={role} className="p-3 bg-slate-50 rounded-lg text-center">
                      <div className="text-lg font-bold" style={{ color: COLORS[idx % COLORS.length] }}>{count}</div>
                      <div className="text-[10px] text-slate-600">{role}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      );
    }

    if (type === 'positions') {
      return (
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Position Analytics</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <Card><CardHeader><CardTitle className="text-sm">Players by Position</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={positionBreakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="position" type="category" tick={{ fontSize: 10 }} width={120} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      );
    }

    return null;
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Club Analytics</h1>
        <p className="text-sm text-slate-600">Comprehensive insights across assessments, evaluations, and tryouts</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="comparison">Team Comparison</TabsTrigger>
          <TabsTrigger value="heatmap">Heatmaps</TabsTrigger>
          <TabsTrigger value="trends">Historical Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">

      {/* Filters */}
      <Card className="border-none shadow-lg mb-6 bg-gradient-to-br from-white via-slate-50 to-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">Filters</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Select value={selectedAgeGroup} onValueChange={setSelectedAgeGroup}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Age Group" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Age Groups</SelectItem>
                {ageGroups.map(ag => <SelectItem key={ag} value={ag}>{ag}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedLeague} onValueChange={setSelectedLeague}>
              <SelectTrigger className="h-10"><SelectValue placeholder="League" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leagues</SelectItem>
                {leagues.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedPosition} onValueChange={setSelectedPosition}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Position" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                {positions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-50 to-white cursor-pointer hover:shadow-xl transition-all" onClick={() => navigate(createPageUrl('Players'))}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><div className="text-[10px] text-slate-600">Players</div><div className="text-2xl font-bold text-slate-900">{stats.totalPlayers}</div></div>
              <Users className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-white cursor-pointer hover:shadow-xl transition-all" onClick={() => navigate(createPageUrl('Teams'))}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><div className="text-[10px] text-slate-600">Teams</div><div className="text-2xl font-bold text-slate-900">{stats.totalTeams}</div></div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-white cursor-pointer hover:shadow-xl transition-all" onClick={() => navigate(createPageUrl('Assessments'))}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><div className="text-[10px] text-slate-600">Assessments</div><div className="text-2xl font-bold text-slate-900">{stats.totalAssessments}</div></div>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg bg-gradient-to-br from-orange-50 to-white cursor-pointer hover:shadow-xl transition-all" onClick={() => navigate(createPageUrl('EvaluationsNew'))}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><div className="text-[10px] text-slate-600">Evaluations</div><div className="text-2xl font-bold text-slate-900">{stats.totalEvaluations}</div></div>
              <Award className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expandable Cards */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Assessment Card */}
        <Card className="border-none shadow-lg cursor-pointer hover:shadow-xl transition-all" onClick={() => setExpandedCard('assessments')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-blue-500" />Physical Assessments</CardTitle>
            <Maximize2 className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="text-center p-2 bg-blue-50 rounded"><div className="text-lg font-bold text-blue-600">{stats.assessedPlayers}</div><div className="text-[10px] text-slate-600">Assessed</div></div>
              <div className="text-center p-2 bg-emerald-50 rounded"><div className="text-lg font-bold text-emerald-600">{Math.round((stats.assessedPlayers / stats.totalPlayers) * 100) || 0}%</div><div className="text-[10px] text-slate-600">Rate</div></div>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={assessmentsByAgeGroup.slice(0, 5)}>
                <XAxis dataKey="ageGroup" tick={{ fontSize: 9 }} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="avgOverall" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Evaluation Card */}
        <Card className="border-none shadow-lg cursor-pointer hover:shadow-xl transition-all" onClick={() => setExpandedCard('evaluations')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-purple-500" />Evaluations</CardTitle>
            <Maximize2 className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="text-center p-2 bg-purple-50 rounded"><div className="text-lg font-bold text-purple-600">{stats.evaluatedPlayers}</div><div className="text-[10px] text-slate-600">Evaluated</div></div>
              <div className="text-center p-2 bg-pink-50 rounded"><div className="text-lg font-bold text-pink-600">{Math.round((stats.evaluatedPlayers / stats.totalPlayers) * 100) || 0}%</div><div className="text-[10px] text-slate-600">Rate</div></div>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={evaluationsByAgeGroup.slice(0, 5)}>
                <XAxis dataKey="ageGroup" tick={{ fontSize: 9 }} />
                <YAxis hide domain={[0, 10]} />
                <Tooltip />
                <Bar dataKey="avgAthleticism" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tryouts Card */}
        <Card className="border-none shadow-lg cursor-pointer hover:shadow-xl transition-all" onClick={() => setExpandedCard('tryouts')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Target className="w-4 h-4 text-emerald-500" />Tryout Status</CardTitle>
            <Maximize2 className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="text-center p-2 bg-emerald-50 rounded"><div className="text-lg font-bold text-emerald-600">{tryoutBreakdown.registration['Signed & Paid']}</div><div className="text-[9px] text-slate-600">Signed</div></div>
              <div className="text-center p-2 bg-blue-50 rounded"><div className="text-lg font-bold text-blue-600">{tryoutBreakdown.status['Accepted']}</div><div className="text-[9px] text-slate-600">Accepted</div></div>
              <div className="text-center p-2 bg-orange-50 rounded"><div className="text-lg font-bold text-orange-600">{tryoutBreakdown.status['Considering']}</div><div className="text-[9px] text-slate-600">Pending</div></div>
            </div>
            {registrationPieData.length > 0 && (
              <ResponsiveContainer width="100%" height={100}>
                <PieChart>
                  <Pie data={registrationPieData} cx="50%" cy="50%" innerRadius={25} outerRadius={45} dataKey="value">
                    {registrationPieData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Position Card */}
        <Card className="border-none shadow-lg cursor-pointer hover:shadow-xl transition-all" onClick={() => setExpandedCard('positions')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4 text-orange-500" />Position Distribution</CardTitle>
            <Maximize2 className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {positionBreakdown.slice(0, 5).map((p, idx) => (
                <div key={p.position} className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 truncate max-w-[100px]">{p.position}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(p.count / Math.max(...positionBreakdown.map(x => x.count))) * 100}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 w-6 text-right">{p.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expanded Dialog */}
      <Dialog open={!!expandedCard} onOpenChange={() => setExpandedCard(null)}>
        {expandedCard && <ExpandedDialog type={expandedCard} onClose={() => setExpandedCard(null)} />}
      </Dialog>
        </TabsContent>

        <TabsContent value="comparison" className="mt-6">
          <TeamComparisonAnalytics 
            teams={filteredTeams}
            assessments={filteredAssessments}
            evaluations={filteredEvaluations}
            players={filteredPlayers}
          />
        </TabsContent>

        <TabsContent value="heatmap" className="mt-6">
          <div className="space-y-6">
            <PerformanceHeatmap 
              players={filteredPlayers}
              assessments={filteredAssessments}
              evaluations={filteredEvaluations}
              metric="overall"
            />
            <div className="grid md:grid-cols-2 gap-6">
              <PerformanceHeatmap 
                players={filteredPlayers}
                assessments={filteredAssessments}
                evaluations={filteredEvaluations}
                metric="defending"
              />
              <PerformanceHeatmap 
                players={filteredPlayers}
                assessments={filteredAssessments}
                evaluations={filteredEvaluations}
                metric="attacking"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="mt-6">
          <HistoricalTrendAnalytics 
            teams={filteredTeams}
            assessments={filteredAssessments}
            players={filteredPlayers}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}