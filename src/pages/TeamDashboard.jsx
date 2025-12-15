import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Users, User, Activity, Calendar, BarChart3, Award, Megaphone, Edit2, Save, TrendingUp, Target, CheckCircle, XCircle, Clock, ArrowUp, ArrowDown, Minus, GitCompare, FileDown, Plus, Mail } from 'lucide-react';
import { getPositionBorderColor } from '../components/player/positionColors';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell } from 'recharts';
import TeamPerformanceAnalytics from '../components/team/TeamPerformanceAnalytics';
import EnhancedPlayerComparisonModal from '../components/player/EnhancedPlayerComparisonModal';
import TeamComparisonAnalytics from '../components/analytics/TeamComparisonAnalytics';
import PerformanceHeatmap from '../components/analytics/PerformanceHeatmap';
import HistoricalTrendAnalytics from '../components/analytics/HistoricalTrendAnalytics';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import ExportDialog, { generateCSV, downloadFile, generatePDFContent, printPDF } from '../components/export/ExportDialog';
import TeamEvaluationForm from '../components/team/TeamEvaluationForm';
import BulkInviteDialog from '../components/team/BulkInviteDialog';
import TeamComparisonsTab from '../components/team/TeamComparisonsTab';
import CoachAssignmentDialog from '../components/team/CoachAssignmentDialog';

export default function TeamDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const teamId = urlParams.get('teamId');

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedPlayersForCompare, setSelectedPlayersForCompare] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showTeamEvalDialog, setShowTeamEvalDialog] = useState(false);
  const [showAddPlayerDialog, setShowAddPlayerDialog] = useState(false);
  const [showBulkInviteDialog, setShowBulkInviteDialog] = useState(false);
  const [showCoachAssignDialog, setShowCoachAssignDialog] = useState(false);
  const [newPlayerForm, setNewPlayerForm] = useState({
    full_name: '',
    gender: 'Female',
    primary_position: 'Center Midfielder',
    team_id: teamId
  });
  const [editTeamForm, setEditTeamForm] = useState({
    name: '',
    age_group: '',
    league: '',
    season: '',
    head_coach_id: ''
  });

  const { data: team } = useQuery({
    queryKey: ['team', teamId],
    queryFn: async () => {
      const teams = await base44.entities.Team.list();
      return teams.find(t => t.id === teamId);
    }
  });

  const { data: players = [] } = useQuery({
    queryKey: ['teamPlayers', teamId],
    queryFn: async () => {
      const all = await base44.entities.Player.list();
      return all.filter(p => p.team_id === teamId);
    },
    retry: false
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['teamAssessments', teamId],
    queryFn: async () => {
      const all = await base44.entities.PhysicalAssessment.list();
      // Get assessments for all players in the team (by player_id, not just team_id)
      const teamPlayerIds = players.map(p => p.id);
      return all.filter(a => a.team_id === teamId || teamPlayerIds.includes(a.player_id));
    },
    enabled: players.length > 0
  });

  const { data: events = [] } = useQuery({
    queryKey: ['teamEvents', teamId],
    queryFn: async () => {
      const all = await base44.entities.TeamEvent.list();
      return all.filter(e => e.team_id === teamId);
    }
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ['teamAnnouncements', teamId],
    queryFn: async () => {
      const all = await base44.entities.TeamAnnouncement.list('-created_date', 5);
      return all.filter(a => a.team_id === teamId);
    }
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const { data: tryouts = [] } = useQuery({
    queryKey: ['teamTryouts', teamId],
    queryFn: async () => {
      const all = await base44.entities.PlayerTryout.list();
      const playerIds = players.map(p => p.id);
      return all.filter(t => playerIds.includes(t.player_id));
    },
    enabled: players.length > 0
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ['teamEvaluations', teamId],
    queryFn: async () => {
      const all = await base44.entities.Evaluation.list();
      const playerIds = players.map(p => p.id);
      return all.filter(e => playerIds.includes(e.player_id));
    },
    enabled: players.length > 0
  });

  const { data: teamEvaluations = [] } = useQuery({
    queryKey: ['teamEvals', teamId],
    queryFn: async () => {
      const all = await base44.entities.TeamEvaluation.list('-created_date');
      return all.filter(e => e.team_id === teamId);
    }
  });

  const { data: allPlayers = [] } = useQuery({
    queryKey: ['allPlayers'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: allTeams = [] } = useQuery({
    queryKey: ['allTeams'],
    queryFn: () => base44.entities.Team.list()
  });

  const { data: allAssessments = [] } = useQuery({
    queryKey: ['allAssessments'],
    queryFn: () => base44.entities.PhysicalAssessment.list()
  });

  const { data: allEvaluations = [] } = useQuery({
    queryKey: ['allEvaluations'],
    queryFn: () => base44.entities.Evaluation.list()
  });

  const { data: allTryouts = [] } = useQuery({
    queryKey: ['allTryouts'],
    queryFn: () => base44.entities.PlayerTryout.list()
  });

  React.useEffect(() => {
    if (team) {
      setEditTeamForm({
        name: team.name || '',
        age_group: team.age_group || '',
        league: team.league || '',
        season: team.season || '',
        head_coach_id: team.head_coach_id || ''
      });
      setNewPlayerForm(prev => ({
        ...prev,
        gender: team.gender || 'Female',
        team_id: teamId
      }));
    }
  }, [team, teamId]);

  const updateTeamMutation = useMutation({
    mutationFn: (updatedData) => base44.entities.Team.update(teamId, updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries(['team', teamId]);
      setShowEditDialog(false);
    }
  });

  const createPlayerMutation = useMutation({
    mutationFn: (data) => base44.entities.Player.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['teamPlayers', teamId]);
      queryClient.invalidateQueries(['players']);
      setShowAddPlayerDialog(false);
      setNewPlayerForm({
        full_name: '',
        gender: team?.gender || 'Female',
        primary_position: 'Center Midfielder',
        team_id: teamId
      });
    }
  });

  const handleEditSubmit = () => {
    updateTeamMutation.mutate(editTeamForm);
  };

  const teamCoaches = coaches.filter(c => c.team_ids?.includes(teamId));

  // Calculate detailed team analytics
  const teamAnalytics = React.useMemo(() => {
    const playersWithAssessments = players.filter(p => 
      assessments.some(a => a.player_id === p.id)
    );
    
    const assessmentRate = players.length > 0 
      ? Math.round((playersWithAssessments.length / players.length) * 100)
      : 0;

    const activePlayers = players.filter(p => p.status === 'Active').length;
    const retentionRate = players.length > 0 
      ? Math.round((activePlayers / players.length) * 100)
      : 0;

    const avgPhysical = assessments.length > 0
      ? {
          speed: Math.round(assessments.reduce((sum, a) => sum + (a.speed_score || 0), 0) / assessments.length),
          power: Math.round(assessments.reduce((sum, a) => sum + (a.power_score || 0), 0) / assessments.length),
          endurance: Math.round(assessments.reduce((sum, a) => sum + (a.endurance_score || 0), 0) / assessments.length),
          agility: Math.round(assessments.reduce((sum, a) => sum + (a.agility_score || 0), 0) / assessments.length),
          overall: Math.round(assessments.reduce((sum, a) => sum + (a.overall_score || 0), 0) / assessments.length),
        }
      : { speed: 0, power: 0, endurance: 0, agility: 0, overall: 0 };

    return { assessmentRate, retentionRate, avgPhysical, activePlayers };
  }, [players, assessments]);

  // Tryout analytics
  const tryoutAnalytics = React.useMemo(() => {
    const total = tryouts.length;
    
    // Registration status breakdown
    const registrationBreakdown = {
      'Signed and Paid': tryouts.filter(t => t.registration_status === 'Signed and Paid').length,
      'Signed': tryouts.filter(t => t.registration_status === 'Signed').length,
      'Not Signed': tryouts.filter(t => !t.registration_status || t.registration_status === 'Not Signed').length
    };
    
    // Recommendation breakdown
    const recommendationBreakdown = {
      'Move up': tryouts.filter(t => t.recommendation === 'Move up').length,
      'Keep': tryouts.filter(t => t.recommendation === 'Keep').length,
      'Move down': tryouts.filter(t => t.recommendation === 'Move down').length,
      'None': tryouts.filter(t => !t.recommendation).length
    };
    
    // Next season status
    const seasonStatusBreakdown = {
      'Accepted Offer': tryouts.filter(t => t.next_season_status === 'Accepted Offer').length,
      'Rejected Offer': tryouts.filter(t => t.next_season_status === 'Rejected Offer').length,
      'Considering Offer': tryouts.filter(t => t.next_season_status === 'Considering Offer').length,
      'Not Offered': tryouts.filter(t => t.next_season_status === 'Not Offered').length,
      'N/A': tryouts.filter(t => !t.next_season_status || t.next_season_status === 'N/A').length
    };

    // Team role breakdown
    const roleBreakdown = tryouts.reduce((acc, t) => {
      if (t.team_role) {
        acc[t.team_role] = (acc[t.team_role] || 0) + 1;
      }
      return acc;
    }, {});

    return { total, registrationBreakdown, recommendationBreakdown, seasonStatusBreakdown, roleBreakdown };
  }, [tryouts]);

  // Evaluation analytics
  const evaluationAnalytics = React.useMemo(() => {
    if (evaluations.length === 0) return null;

    const latestByPlayer = {};
    evaluations.forEach(e => {
      if (!latestByPlayer[e.player_id] || new Date(e.created_date) > new Date(latestByPlayer[e.player_id].created_date)) {
        latestByPlayer[e.player_id] = e;
      }
    });

    const latestEvals = Object.values(latestByPlayer);
    const avg = (key) => Math.round(latestEvals.reduce((sum, e) => sum + (e[key] || 0), 0) / latestEvals.length * 10) / 10;

    return {
      avgGrowthMindset: avg('growth_mindset'),
      avgResilience: avg('resilience'),
      avgEfficiency: avg('efficiency_in_execution'),
      avgAthleticism: avg('athleticism'),
      avgTeamFocus: avg('team_focus'),
      avgDefOrganized: avg('defending_organized'),
      avgDefFinalThird: avg('defending_final_third'),
      avgDefTransition: avg('defending_transition'),
      avgAttOrganized: avg('attacking_organized'),
      avgAttFinalThird: avg('attacking_final_third'),
      avgAttTransition: avg('attacking_in_transition'),
      totalEvaluations: evaluations.length,
      playersEvaluated: latestEvals.length
    };
  }, [evaluations]);

  const registrationPieData = [
    { name: 'Signed & Paid', value: tryoutAnalytics.registrationBreakdown['Signed and Paid'], color: '#10b981' },
    { name: 'Signed', value: tryoutAnalytics.registrationBreakdown['Signed'], color: '#3b82f6' },
    { name: 'Not Signed', value: tryoutAnalytics.registrationBreakdown['Not Signed'], color: '#ef4444' }
  ].filter(d => d.value > 0);

  const recommendationPieData = [
    { name: 'Move Up', value: tryoutAnalytics.recommendationBreakdown['Move up'], color: '#10b981' },
    { name: 'Keep', value: tryoutAnalytics.recommendationBreakdown['Keep'], color: '#3b82f6' },
    { name: 'Move Down', value: tryoutAnalytics.recommendationBreakdown['Move down'], color: '#f59e0b' },
    { name: 'None', value: tryoutAnalytics.recommendationBreakdown['None'], color: '#94a3b8' }
  ].filter(d => d.value > 0);

  const radarData = [
    { attribute: 'Speed', value: teamAnalytics.avgPhysical.speed, fullMark: 100 },
    { attribute: 'Power', value: teamAnalytics.avgPhysical.power, fullMark: 100 },
    { attribute: 'Endurance', value: teamAnalytics.avgPhysical.endurance, fullMark: 100 },
    { attribute: 'Agility', value: teamAnalytics.avgPhysical.agility, fullMark: 100 },
  ];

  const upcomingEvents = events
    .filter(e => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  const positionBreakdown = players.reduce((acc, p) => {
    acc[p.primary_position] = (acc[p.primary_position] || 0) + 1;
    return acc;
  }, {});

  const positionData = Object.entries(positionBreakdown).map(([position, count]) => ({
    position,
    count
  }));

  // Export function for team data
  const handleTeamExport = (format, selectedOptions) => {
    if (format === 'csv') {
      const headers = ['Player Name', 'Jersey', 'Position', 'Status', 'DOB', 'Email', 'Phone',
        'Team Role', 'Recommendation', 'Next Season Status', 'Registration',
        'Sprint', 'Vertical', 'YIRT', 'Shuttle', 'Speed', 'Power', 'Endurance', 'Agility', 'Overall',
        'Growth Mindset', 'Resilience', 'Athleticism', 'Team Focus', 'Def Organized', 'Att Organized'];
      
      const rows = players.map(player => {
        const tryout = tryouts.find(t => t.player_id === player.id);
        const playerAssessments = assessments.filter(a => a.player_id === player.id);
        const latestAssessment = playerAssessments.sort((a, b) => new Date(b.assessment_date) - new Date(a.assessment_date))[0];
        const playerEvals = evaluations.filter(e => e.player_id === player.id);
        const latestEval = playerEvals.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
        
        return [
          player.full_name || '',
          player.jersey_number || '',
          player.primary_position || '',
          player.status || '',
          player.date_of_birth || '',
          player.email || '',
          player.phone || '',
          tryout?.team_role || '',
          tryout?.recommendation || '',
          tryout?.next_season_status || '',
          tryout?.registration_status || '',
          latestAssessment?.sprint?.toFixed(2) || '',
          latestAssessment?.vertical || '',
          latestAssessment?.yirt || '',
          latestAssessment?.shuttle?.toFixed(2) || '',
          latestAssessment?.speed_score || '',
          latestAssessment?.power_score || '',
          latestAssessment?.endurance_score || '',
          latestAssessment?.agility_score || '',
          latestAssessment?.overall_score || '',
          latestEval?.growth_mindset || '',
          latestEval?.resilience || '',
          latestEval?.athleticism || '',
          latestEval?.team_focus || '',
          latestEval?.defending_organized || '',
          latestEval?.attacking_organized || ''
        ];
      });

      const csv = generateCSV(headers, rows);
      downloadFile(csv, `team_${team?.name?.replace(/\s+/g, '_') || 'export'}.csv`);
    } else {
      const playersTableRows = players.map(player => {
        const tryout = tryouts.find(t => t.player_id === player.id);
        const playerAssessments = assessments.filter(a => a.player_id === player.id);
        const latestAssessment = playerAssessments.sort((a, b) => new Date(b.assessment_date) - new Date(a.assessment_date))[0];
        const playerEvals = evaluations.filter(e => e.player_id === player.id);
        const latestEval = playerEvals.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
        
        return `<tr>
          <td>${player.full_name || ''}</td>
          <td>${player.jersey_number || ''}</td>
          <td>${player.primary_position || ''}</td>
          <td>${tryout?.team_role || ''}</td>
          <td>${tryout?.recommendation || ''}</td>
          <td>${latestAssessment?.overall_score || '-'}</td>
          <td>${latestEval?.athleticism || '-'}</td>
        </tr>`;
      }).join('');

      const sections = [
        {
          title: 'Team Overview',
          content: `
            <table>
              <tr><th>Team</th><td>${team?.name || ''}</td></tr>
              <tr><th>Age Group</th><td>${team?.age_group || ''}</td></tr>
              <tr><th>League</th><td>${team?.league || ''}</td></tr>
              <tr><th>Total Players</th><td>${players.length}</td></tr>
              <tr><th>Avg Physical Score</th><td>${teamAnalytics.avgPhysical.overall}</td></tr>
            </table>
          `
        },
        {
          title: 'Player Roster',
          content: `
            <table>
              <thead>
                <tr><th>Name</th><th>Jersey</th><th>Position</th><th>Role</th><th>Rec</th><th>Physical</th><th>Athletic</th></tr>
              </thead>
              <tbody>
                ${playersTableRows}
              </tbody>
            </table>
          `
        }
      ];

      const html = generatePDFContent(`Team Report: ${team?.name || 'Team'}`, sections);
      printPDF(html);
    }
    setShowExportDialog(false);
  };

  const performanceTrend = assessments
    .sort((a, b) => new Date(a.assessment_date) - new Date(b.assessment_date))
    .slice(-10)
    .map(a => ({
      date: new Date(a.assessment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      overall: a.overall_score || 0
    }));

  const topPerformers = players
    .map(p => {
      const playerAssessments = assessments.filter(a => a.player_id === p.id);
      const latest = playerAssessments.sort((a, b) => new Date(b.assessment_date) - new Date(a.assessment_date))[0];
      return {
        ...p,
        latestScore: latest?.overall_score || 0,
        latestAssessment: latest
      };
    })
    .filter(p => p.latestScore > 0)
    .sort((a, b) => b.latestScore - a.latestScore)
    .slice(0, 5);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 md:mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Teams
      </Button>

      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div 
            className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-white text-xl md:text-2xl font-bold"
            style={{ backgroundColor: team?.team_color || '#22c55e' }}
          >
            {team?.name?.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{team?.name}</h1>
              <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)}>
                <FileDown className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="hidden md:inline">Export</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
                <Edit2 className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="hidden md:inline">Edit Team</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowAddPlayerDialog(true)}>
                <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="hidden md:inline">Add Player</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowTeamEvalDialog(true)} className="bg-purple-50">
                <Award className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="hidden md:inline">Team Evaluation</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowBulkInviteDialog(true)} className="bg-blue-50">
                <Mail className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="hidden md:inline">Invite All</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowCoachAssignDialog(true)} className="bg-purple-50">
                <User className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="hidden md:inline">Assign Coaches</span>
              </Button>
            </div>
            <p className="text-sm md:text-base text-slate-600">{team?.age_group} • {team?.league}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 md:gap-4 mb-6 md:mb-8">
        <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] md:text-xs text-slate-600">Players</div>
                <div className="text-lg md:text-2xl font-bold text-slate-900">{players.length}</div>
              </div>
              <Users className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] md:text-xs text-slate-600">Avg Score</div>
                <div className="text-lg md:text-2xl font-bold text-slate-900">{teamAnalytics.avgPhysical.overall}</div>
              </div>
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] md:text-xs text-slate-600">Assessment Rate</div>
                <div className="text-lg md:text-2xl font-bold text-slate-900">{teamAnalytics.assessmentRate}%</div>
              </div>
              <Target className="w-5 h-5 md:w-6 md:h-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] md:text-xs text-slate-600">Retention</div>
                <div className="text-lg md:text-2xl font-bold text-slate-900">{teamAnalytics.retentionRate}%</div>
              </div>
              <Activity className="w-5 h-5 md:w-6 md:h-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-pink-50 to-white">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] md:text-xs text-slate-600">Assessments</div>
                <div className="text-lg md:text-2xl font-bold text-slate-900">{assessments.length}</div>
              </div>
              <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-pink-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-cyan-50 to-white">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] md:text-xs text-slate-600">Events</div>
                <div className="text-lg md:text-2xl font-bold text-slate-900">{upcomingEvents.length}</div>
              </div>
              <Calendar className="w-5 h-5 md:w-6 md:h-6 text-cyan-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="roster" className="w-full">
        <TabsList className="grid w-full grid-cols-4 md:grid-cols-8 text-xs">
          <TabsTrigger value="roster">Roster</TabsTrigger>
          <TabsTrigger value="tryouts">Tryouts</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
          <TabsTrigger value="comparisons">Comparisons</TabsTrigger>
          <TabsTrigger value="announcements">News</TabsTrigger>
        </TabsList>

        <TabsContent value="roster" className="mt-4 md:mt-6 space-y-4 md:space-y-6">
          <Card className="border-none shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base md:text-lg">Team Roster</CardTitle>
              {selectedPlayersForCompare.length >= 2 && (
                <Button onClick={() => setShowCompareModal(true)} className="bg-blue-600 hover:bg-blue-700">
                  <GitCompare className="w-4 h-4 mr-2" />
                  Compare ({selectedPlayersForCompare.length})
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {players.map(player => {
                  const tryout = tryouts.find(t => t.player_id === player.id);
                  const birthYear = player.date_of_birth ? new Date(player.date_of_birth).getFullYear() : null;
                  const isSelected = selectedPlayersForCompare.includes(player.id);
                  return (
                    <div key={player.id} className={`p-3 md:p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all text-left border-2 ${isSelected ? 'border-blue-500 bg-blue-50' : `${getPositionBorderColor(player.primary_position)} hover:border-emerald-500`}`}>
                      <div className="flex items-start gap-2">
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedPlayersForCompare([...selectedPlayersForCompare, player.id]);
                            } else {
                              setSelectedPlayersForCompare(selectedPlayersForCompare.filter(id => id !== player.id));
                            }
                          }}
                          className="mt-1"
                        />
                        <button
                          onClick={() => navigate(`${createPageUrl('PlayerDashboard')}?id=${player.id}`)}
                          className="flex-1 text-left"
                        >
                          <div className="flex items-center gap-2 md:gap-3 mb-2">
                            <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base">
                              {player.jersey_number || player.full_name?.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-slate-900 text-sm md:text-base">{player.full_name}</div>
                              <div className="text-xs text-slate-600">{player.primary_position}</div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                           {birthYear && <Badge variant="outline" className="text-[9px]">{birthYear}</Badge>}
                           {player.status === 'Injured' && (
                             <Badge className="bg-red-100 text-red-800 text-[10px]">Injured</Badge>
                           )}
                          </div>
                                                          <div className="flex flex-wrap gap-1 mt-1">
                                                            {tryout?.team_role && <Badge className="text-[9px] bg-purple-100 text-purple-800">{tryout.team_role}</Badge>}
                                                            {tryout?.recommendation && (
                                                              <Badge className={`text-[9px] ${tryout.recommendation === 'Move up' ? 'bg-green-100 text-green-800' : tryout.recommendation === 'Move down' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                                                                {tryout.recommendation}
                                                              </Badge>
                                                            )}
                                                          </div>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Position Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={positionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="position" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Award className="w-4 h-4 md:w-5 md:h-5 text-yellow-600" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="space-y-2 md:space-y-3">
                  {topPerformers.map((player, idx) => (
                    <div key={player.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-xs md:text-sm">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm md:text-base">{player.full_name}</div>
                          <div className="text-xs text-slate-600">{player.primary_position}</div>
                        </div>
                      </div>
                      <div className="text-lg md:text-xl font-bold text-emerald-600">{player.latestScore}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            </div>

            {/* Team Physical Profile */}
            <Card className="border-none shadow-lg mt-6">
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Team Physical Profile</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="attribute" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar 
                      name="Team Average" 
                      dataKey="value" 
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-red-50 rounded-xl text-center">
                    <p className="text-2xl md:text-3xl font-bold text-red-600">{teamAnalytics.avgPhysical.speed}</p>
                    <p className="text-xs text-slate-600 mt-1">Speed</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl text-center">
                    <p className="text-2xl md:text-3xl font-bold text-blue-600">{teamAnalytics.avgPhysical.power}</p>
                    <p className="text-xs text-slate-600 mt-1">Power</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-xl text-center">
                    <p className="text-2xl md:text-3xl font-bold text-emerald-600">{teamAnalytics.avgPhysical.endurance}</p>
                    <p className="text-xs text-slate-600 mt-1">Endurance</p>
                  </div>
                  <div className="p-4 bg-pink-50 rounded-xl text-center">
                    <p className="text-2xl md:text-3xl font-bold text-pink-600">{teamAnalytics.avgPhysical.agility}</p>
                    <p className="text-xs text-slate-600 mt-1">Agility</p>
                  </div>
                </div>
              </div>
            </CardContent>
            </Card>
            </TabsContent>

        <TabsContent value="tryouts" className="mt-4 md:mt-6 space-y-4">
          {/* Tryout Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-50 to-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{tryoutAnalytics.registrationBreakdown['Signed and Paid']}</div>
                    <div className="text-xs text-slate-600">Signed & Paid</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-8 h-8 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{tryoutAnalytics.seasonStatusBreakdown['Considering Offer']}</div>
                    <div className="text-xs text-slate-600">Considering</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <ArrowUp className="w-8 h-8 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{tryoutAnalytics.recommendationBreakdown['Move up']}</div>
                    <div className="text-xs text-slate-600">Move Up</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg bg-gradient-to-br from-orange-50 to-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <ArrowDown className="w-8 h-8 text-orange-500" />
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{tryoutAnalytics.recommendationBreakdown['Move down']}</div>
                    <div className="text-xs text-slate-600">Move Down</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-sm">Registration Status</CardTitle>
              </CardHeader>
              <CardContent>
                {registrationPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={registrationPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {registrationPieData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center py-8 text-slate-500 text-sm">No tryout data</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-sm">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                {recommendationPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={recommendationPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {recommendationPieData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center py-8 text-slate-500 text-sm">No recommendation data</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Player Tryout List */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-sm">Player Tryout Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {players.map(player => {
                  const tryout = tryouts.find(t => t.player_id === player.id);
                  return (
                    <div key={player.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          {player.jersey_number || player.full_name?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-sm text-slate-900">{player.full_name}</div>
                          <div className="text-xs text-slate-500">{player.primary_position}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {tryout?.team_role && (
                          <Badge className="text-[10px] bg-purple-100 text-purple-800">{tryout.team_role}</Badge>
                        )}
                        {tryout?.recommendation && (
                          <Badge className={`text-[10px] ${
                            tryout.recommendation === 'Move up' ? 'bg-emerald-100 text-emerald-800' :
                            tryout.recommendation === 'Move down' ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {tryout.recommendation}
                          </Badge>
                        )}
                        {tryout?.next_season_status && tryout.next_season_status !== 'N/A' && (
                          <Badge className={`text-[10px] ${
                            tryout.next_season_status === 'Accepted Offer' ? 'bg-emerald-100 text-emerald-800' :
                            tryout.next_season_status === 'Rejected Offer' ? 'bg-red-100 text-red-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {tryout.next_season_status}
                          </Badge>
                        )}
                        {tryout?.registration_status && (
                          <Badge className={`text-[10px] ${
                            tryout.registration_status === 'Signed and Paid' ? 'bg-emerald-100 text-emerald-800' :
                            tryout.registration_status === 'Signed' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {tryout.registration_status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Evaluation Summary */}
          {evaluationAnalytics && (
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-sm">Team Evaluation Averages ({evaluationAnalytics.playersEvaluated} players)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {[
                    { label: 'Growth Mindset', value: evaluationAnalytics.avgGrowthMindset, color: '#8b5cf6' },
                    { label: 'Resilience', value: evaluationAnalytics.avgResilience, color: '#ec4899' },
                    { label: 'Efficiency', value: evaluationAnalytics.avgEfficiency, color: '#f59e0b' },
                    { label: 'Athleticism', value: evaluationAnalytics.avgAthleticism, color: '#10b981' },
                    { label: 'Team Focus', value: evaluationAnalytics.avgTeamFocus, color: '#3b82f6' },
                    { label: 'Def. Organized', value: evaluationAnalytics.avgDefOrganized, color: '#ef4444' }
                  ].map(({ label, value, color }) => (
                    <div key={label} className="text-center p-3 bg-slate-50 rounded-lg">
                      <div className="text-xl font-bold" style={{ color }}>{value}</div>
                      <div className="text-[10px] text-slate-600 mt-1">{label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="mt-4 md:mt-6">
          <TeamPerformanceAnalytics teamId={teamId} teamName={team?.name} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-4 md:mt-6">
          <HistoricalTrendAnalytics 
            teams={[team].filter(Boolean)}
            assessments={assessments}
            players={players}
          />
        </TabsContent>

        <TabsContent value="heatmap" className="mt-4 md:mt-6">
          <div className="space-y-6">
            <PerformanceHeatmap 
              players={players}
              assessments={assessments}
              evaluations={evaluations}
              metric="overall"
            />
            <div className="grid md:grid-cols-2 gap-6">
              <PerformanceHeatmap 
                players={players}
                assessments={assessments}
                evaluations={evaluations}
                metric="defending"
              />
              <PerformanceHeatmap 
                players={players}
                assessments={assessments}
                evaluations={evaluations}
                metric="attacking"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="evaluations" className="mt-4 md:mt-6 space-y-4">
          {evaluationAnalytics ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-white">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{evaluationAnalytics.playersEvaluated}</div>
                    <div className="text-xs text-slate-600">Players Evaluated</div>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-white">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{evaluationAnalytics.totalEvaluations}</div>
                    <div className="text-xs text-slate-600">Total Evaluations</div>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-50 to-white">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-600">{evaluationAnalytics.avgAthleticism}</div>
                    <div className="text-xs text-slate-600">Avg Athleticism</div>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-lg bg-gradient-to-br from-orange-50 to-white">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">{evaluationAnalytics.avgTeamFocus}</div>
                    <div className="text-xs text-slate-600">Avg Team Focus</div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="text-sm">Mental & Character Averages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-3">
                    {[
                      { label: 'Growth Mindset', value: evaluationAnalytics.avgGrowthMindset, color: '#8b5cf6' },
                      { label: 'Resilience', value: evaluationAnalytics.avgResilience, color: '#ec4899' },
                      { label: 'Efficiency', value: evaluationAnalytics.avgEfficiency, color: '#f59e0b' },
                      { label: 'Athleticism', value: evaluationAnalytics.avgAthleticism, color: '#10b981' },
                      { label: 'Team Focus', value: evaluationAnalytics.avgTeamFocus, color: '#3b82f6' }
                    ].map(({ label, value, color }) => (
                      <div key={label} className="text-center p-3 bg-slate-50 rounded-lg">
                        <div className="text-xl font-bold" style={{ color }}>{value}</div>
                        <div className="text-[9px] text-slate-600 mt-1">{label}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border-none shadow-lg bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-sm">Defending Averages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Organized', value: evaluationAnalytics.avgDefOrganized },
                        { label: 'Final Third', value: evaluationAnalytics.avgDefFinalThird },
                        { label: 'Transition', value: evaluationAnalytics.avgDefTransition }
                      ].map(({ label, value }) => (
                        <div key={label} className="text-center p-3 bg-white rounded-lg">
                          <div className="text-xl font-bold text-red-600">{value}</div>
                          <div className="text-[9px] text-slate-600 mt-1">{label}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-sm">Attacking Averages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Organized', value: evaluationAnalytics.avgAttOrganized },
                        { label: 'Final Third', value: evaluationAnalytics.avgAttFinalThird },
                        { label: 'In Transition', value: evaluationAnalytics.avgAttTransition }
                      ].map(({ label, value }) => (
                        <div key={label} className="text-center p-3 bg-white rounded-lg">
                          <div className="text-xl font-bold text-green-600">{value}</div>
                          <div className="text-[9px] text-slate-600 mt-1">{label}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="text-sm">Player Evaluation Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {players.map(player => {
                      const playerEvals = evaluations.filter(e => e.player_id === player.id);
                      const latestEval = playerEvals.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
                      if (!latestEval) return null;
                      const avgMental = Math.round(((latestEval.growth_mindset || 0) + (latestEval.resilience || 0) + (latestEval.team_focus || 0)) / 3 * 10) / 10;
                      const avgDef = Math.round(((latestEval.defending_organized || 0) + (latestEval.defending_final_third || 0) + (latestEval.defending_transition || 0)) / 3 * 10) / 10;
                      const avgAtt = Math.round(((latestEval.attacking_organized || 0) + (latestEval.attacking_final_third || 0) + (latestEval.attacking_in_transition || 0)) / 3 * 10) / 10;
                      return (
                        <div key={player.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                              {player.jersey_number || player.full_name?.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium text-sm text-slate-900">{player.full_name}</div>
                              <div className="text-xs text-slate-500">{player.primary_position}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-center">
                              <div className="text-sm font-bold text-purple-600">{avgMental}</div>
                              <div className="text-[8px] text-slate-500">Mental</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-bold text-red-600">{avgDef}</div>
                              <div className="text-[8px] text-slate-500">Def</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-bold text-green-600">{avgAtt}</div>
                              <div className="text-[8px] text-slate-500">Att</div>
                            </div>
                          </div>
                        </div>
                      );
                    }).filter(Boolean)}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-none shadow-lg">
              <CardContent className="p-12 text-center">
                <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">No Evaluation Data</h3>
                <p className="text-sm text-slate-500">Create evaluations for players to see analytics here</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="comparisons" className="mt-4 md:mt-6">
          <TeamComparisonsTab
            allTeams={allTeams}
            allPlayers={allPlayers}
            allAssessments={allAssessments}
            allEvaluations={allEvaluations}
            allTryouts={allTryouts}
          />
        </TabsContent>

        <TabsContent value="announcements" className="mt-4 md:mt-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Megaphone className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
                Recent Announcements
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {announcements.length === 0 ? (
                <p className="text-center text-slate-500 py-6 md:py-8 text-sm">No announcements</p>
              ) : (
                <div className="space-y-2 md:space-y-3">
                  {announcements.map(announcement => (
                    <div key={announcement.id} className="p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-start justify-between mb-1 md:mb-2">
                        <h3 className="font-semibold text-slate-900 text-sm">{announcement.title}</h3>
                        <Badge className={`text-[10px] ${announcement.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-700'}`}>
                          {announcement.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-700 mb-1 md:mb-2">{announcement.message}</p>
                      <div className="text-[10px] text-slate-500">
                        {new Date(announcement.created_date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
          </DialogHeader>
          {team && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="teamName" className="mb-2 block">Team Name</Label>
                <Input
                  id="teamName"
                  value={editTeamForm.name}
                  onChange={(e) => setEditTeamForm({ ...editTeamForm, name: e.target.value })}
                  className="h-10"
                />
              </div>
              <div>
                <Label htmlFor="ageGroup" className="mb-2 block">Age Group</Label>
                <Input
                  id="ageGroup"
                  value={editTeamForm.age_group}
                  onChange={(e) => setEditTeamForm({ ...editTeamForm, age_group: e.target.value })}
                  className="h-10"
                />
              </div>
              <div>
                <Label htmlFor="league" className="mb-2 block">League</Label>
                <Input
                  id="league"
                  value={editTeamForm.league}
                  onChange={(e) => setEditTeamForm({ ...editTeamForm, league: e.target.value })}
                  className="h-10"
                />
              </div>
              <div>
                <Label htmlFor="season" className="mb-2 block">Season</Label>
                <Input
                  id="season"
                  value={editTeamForm.season}
                  onChange={(e) => setEditTeamForm({ ...editTeamForm, season: e.target.value })}
                  className="h-10"
                />
              </div>
              <div>
                <Label htmlFor="headCoach" className="mb-2 block">Head Coach</Label>
                <Select
                  value={editTeamForm.head_coach_id || ''}
                  onValueChange={(value) => setEditTeamForm({ ...editTeamForm, head_coach_id: value })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select a coach" />
                  </SelectTrigger>
                  <SelectContent>
                    {coaches.map(coach => (
                      <SelectItem key={coach.id} value={coach.id}>{coach.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleEditSubmit} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <EnhancedPlayerComparisonModal
                    open={showCompareModal}
                    onClose={() => setShowCompareModal(false)}
                    players={players.filter(p => selectedPlayersForCompare.includes(p.id))}
                    assessments={assessments}
                    evaluations={evaluations}
                    tryouts={tryouts}
                  />

      <ExportDialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        title={`Export ${team?.name || 'Team'} Data`}
        options={[
          { id: 'players', label: 'Player Information' },
          { id: 'tryouts', label: 'Tryout Data' },
          { id: 'assessments', label: 'Physical Assessments' },
          { id: 'evaluations', label: 'Evaluations' }
        ]}
        onExport={handleTeamExport}
      />

      <Dialog open={showTeamEvalDialog} onOpenChange={setShowTeamEvalDialog}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Team Evaluation - {team?.name}</DialogTitle>
          </DialogHeader>
          <TeamEvaluationForm
            teamId={teamId}
            teamName={team?.name}
            onClose={() => setShowTeamEvalDialog(false)}
            allEvaluations={teamEvaluations}
            playerEvaluations={evaluations}
          />
        </DialogContent>
      </Dialog>

      <BulkInviteDialog
        open={showBulkInviteDialog}
        onClose={() => setShowBulkInviteDialog(false)}
        team={team}
        players={players}
      />

      <CoachAssignmentDialog
        open={showCoachAssignDialog}
        onClose={() => setShowCoachAssignDialog(false)}
        teamId={teamId}
        teamName={team?.name}
      />

      <Dialog open={showAddPlayerDialog} onOpenChange={setShowAddPlayerDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Player to {team?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Full Name *</Label>
              <Input
                value={newPlayerForm.full_name}
                onChange={(e) => setNewPlayerForm({...newPlayerForm, full_name: e.target.value})}
                placeholder="Player name"
              />
            </div>
            <div>
              <Label>Gender *</Label>
              <Select value={newPlayerForm.gender} onValueChange={(v) => setNewPlayerForm({...newPlayerForm, gender: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Primary Position</Label>
              <Select value={newPlayerForm.primary_position} onValueChange={(v) => setNewPlayerForm({...newPlayerForm, primary_position: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['GK', 'Right Outside Back', 'Left Outside Back', 'Right Centerback', 'Left Centerback', 'Defensive Midfielder', 'Right Winger', 'Center Midfielder', 'Forward', 'Attacking Midfielder', 'Left Winger'].map(pos => (
                    <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowAddPlayerDialog(false)} className="flex-1">Cancel</Button>
              <Button 
                onClick={() => createPlayerMutation.mutate(newPlayerForm)} 
                disabled={!newPlayerForm.full_name}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                Add Player
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}