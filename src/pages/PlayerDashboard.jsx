import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, User, Mail, Phone, Calendar, Save, ChevronLeft, ChevronRight, TrendingUp, Plus, FileDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ComboboxInput from '../components/ui/ComboboxInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ExportDialog, { generateCSV, downloadFile, generatePDFContent, printPDF } from '../components/export/ExportDialog';
import PlayerGoalsManager from '../components/player/PlayerGoalsManager';
import PositionKnowledgeBank from '../components/player/PositionKnowledgeBank';

const metricColors = {
  growth_mindset: '#8b5cf6',
  resilience: '#ec4899',
  efficiency_in_execution: '#f59e0b',
  athleticism: '#10b981',
  team_focus: '#3b82f6',
  defending_organized: '#ef4444',
  defending_final_third: '#f97316',
  defending_transition: '#eab308',
  attacking_organized: '#22c55e',
  attacking_final_third: '#14b8a6',
  attacking_in_transition: '#06b6d4'
};

const metricLabels = {
  growth_mindset: 'Growth Mindset',
  resilience: 'Resilience',
  efficiency_in_execution: 'Efficiency',
  athleticism: 'Athleticism',
  team_focus: 'Team Focus',
  defending_organized: 'Def. Organized',
  defending_final_third: 'Def. Final Third',
  defending_transition: 'Def. Transition',
  attacking_organized: 'Att. Organized',
  attacking_final_third: 'Att. Final Third',
  attacking_in_transition: 'Att. Transition'
};

function SliderBar({ label, value, color }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-slate-700">{label}</span>
        <span className="text-sm font-bold" style={{ color }}>{value || 0}</span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${(value || 0) * 10}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function PlayerDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const playerId = urlParams.get('id');

  const [isEditing, setIsEditing] = useState(false);
  const [playerForm, setPlayerForm] = useState({});
  const [tryoutForm, setTryoutForm] = useState({});
  const [assessmentIndex, setAssessmentIndex] = useState(0);
  const [evaluationIndex, setEvaluationIndex] = useState(0);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [newDocument, setNewDocument] = useState({ title: '', document_type: 'Other', notes: '', file: null });
  const [showInjuryDialog, setShowInjuryDialog] = useState(false);
  const [newInjury, setNewInjury] = useState({ injury_date: '', injury_type: '', recovery_date: '', treatment_notes: '' });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const isAdminOrCoach = currentUser?.role === 'admin' || coaches.some(c => c.email === currentUser?.email);

  const { data: player, isLoading: playerLoading } = useQuery({
    queryKey: ['player', playerId],
    queryFn: async () => {
      const players = await base44.entities.Player.list();
      return players.find(p => p.id === playerId);
    },
    enabled: !!playerId
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const { data: tryout } = useQuery({
    queryKey: ['tryout', playerId],
    queryFn: async () => {
      const tryouts = await base44.entities.PlayerTryout.filter({ player_id: playerId });
      return tryouts[0] || null;
    },
    enabled: !!playerId
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments', playerId],
    queryFn: () => base44.entities.PhysicalAssessment.filter({ player_id: playerId }, '-assessment_date'),
    enabled: !!playerId
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations', playerId],
    queryFn: () => base44.entities.Evaluation.filter({ player_id: playerId }, '-created_date'),
    enabled: !!playerId
  });

  const { data: allPlayers = [] } = useQuery({
    queryKey: ['allPlayers'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: allTeams = [] } = useQuery({
    queryKey: ['allTeams'],
    queryFn: () => base44.entities.Team.list()
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: injuries = [] } = useQuery({
    queryKey: ['injuries', playerId],
    queryFn: () => base44.entities.InjuryRecord.filter({ player_id: playerId }, '-injury_date'),
    enabled: !!playerId
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', playerId],
    queryFn: () => base44.entities.PlayerDocument.filter({ player_id: playerId }, '-upload_date'),
    enabled: !!playerId
  });

  // Get parents assigned to this player
  const assignedParents = allUsers.filter(u => 
    u.role === 'parent' && (u.player_ids || []).includes(playerId)
  );

  const currentAssessment = assessments[assessmentIndex] || null;
  const currentEvaluation = evaluations[evaluationIndex] || null;
  const team = teams.find(t => t.id === player?.team_id);

  React.useEffect(() => {
    if (player) {
      setPlayerForm({
        full_name: player.full_name || '',
        email: player.email || '',
        phone: player.phone || '',
        date_of_birth: player.date_of_birth || '',
        jersey_number: player.jersey_number || '',
        primary_position: player.primary_position || '',
        secondary_position: player.secondary_position || '',
        parent_name: player.parent_name || '',
        status: player.status || 'Active',
        team_id: player.team_id || ''
      });
    }
  }, [player]);

  React.useEffect(() => {
    setAssessmentIndex(0);
    setEvaluationIndex(0);
  }, [playerId]);

  React.useEffect(() => {
    if (tryout) {
      setTryoutForm({
        team_role: tryout.team_role || '',
        recommendation: tryout.recommendation || '',
        next_year_team: tryout.next_year_team || '',
        next_season_status: tryout.next_season_status || 'N/A',
        registration_status: tryout.registration_status || 'Not Signed',
        dominant_foot: tryout.dominant_foot || '',
        notes: tryout.notes || ''
      });
    }
  }, [tryout]);

  const updatePlayerMutation = useMutation({
    mutationFn: (data) => base44.entities.Player.update(playerId, data),
    onSuccess: () => queryClient.invalidateQueries(['player', playerId])
  });

  const updateTryoutMutation = useMutation({
    mutationFn: (data) => {
      if (tryout?.id) {
        return base44.entities.PlayerTryout.update(tryout.id, data);
      } else {
        return base44.entities.PlayerTryout.create({ player_id: playerId, player_name: player?.full_name, ...data });
      }
    },
    onSuccess: () => queryClient.invalidateQueries(['tryout', playerId])
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async (data) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: data.file });
      return base44.entities.PlayerDocument.create({
        player_id: playerId,
        title: data.title,
        document_type: data.document_type,
        file_url,
        notes: data.notes,
        upload_date: new Date().toISOString().split('T')[0]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['documents', playerId]);
      setShowDocumentDialog(false);
      setNewDocument({ title: '', document_type: 'Other', notes: '', file: null });
    }
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (id) => base44.entities.PlayerDocument.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['documents', playerId])
  });

  const createInjuryMutation = useMutation({
    mutationFn: (data) => base44.entities.InjuryRecord.create({
      player_id: playerId,
      ...data,
      status: 'Active'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['injuries', playerId]);
      setShowInjuryDialog(false);
      setNewInjury({ injury_date: '', injury_type: '', recovery_date: '', treatment_notes: '' });
    }
  });

  const handleSaveAll = async () => {
    const playerData = {
      ...playerForm,
      jersey_number: playerForm.jersey_number ? Number(playerForm.jersey_number) : null
    };
    await updatePlayerMutation.mutateAsync(playerData);
    await updateTryoutMutation.mutateAsync(tryoutForm);
    setIsEditing(false);
  };

  // Navigation
  const sortedPlayers = [...allPlayers].sort((a, b) => {
    const lastNameA = a.full_name?.split(' ').pop() || '';
    const lastNameB = b.full_name?.split(' ').pop() || '';
    return lastNameA.localeCompare(lastNameB);
  });
  const currentPlayerIndex = sortedPlayers.findIndex(p => p.id === playerId);
  const previousPlayer = currentPlayerIndex > 0 ? sortedPlayers[currentPlayerIndex - 1] : null;
  const nextPlayer = currentPlayerIndex < sortedPlayers.length - 1 ? sortedPlayers[currentPlayerIndex + 1] : null;

  // Get unique team names for combobox
  const existingTeamNames = [...new Set(allTeams.map(t => t.name).filter(Boolean))];

  // Export functions
  const handleExport = (format, selectedOptions) => {
    if (format === 'csv') {
      const headers = ['Field', 'Value'];
      const rows = [
        ['Name', player.full_name],
        ['Jersey Number', player.jersey_number || ''],
        ['Position', player.primary_position || ''],
        ['Team', team?.name || ''],
        ['Status', player.status || ''],
        ['DOB', player.date_of_birth || ''],
        ['Email', player.email || ''],
        ['Phone', player.phone || ''],
        ['Parent', player.parent_name || '']
      ];

      if (selectedOptions.includes('tryout') && isAdminOrCoach && tryout) {
        rows.push(
          ['--- Tryout Info ---', ''],
          ['Team Role', tryout.team_role || ''],
          ['Recommendation', tryout.recommendation || ''],
          ['Next Year Team', tryout.next_year_team || ''],
          ['Next Season Status', tryout.next_season_status || ''],
          ['Registration Status', tryout.registration_status || ''],
          ['Dominant Foot', tryout.dominant_foot || ''],
          ['Notes', tryout.notes || '']
        );
      }

      if (selectedOptions.includes('assessment') && currentAssessment) {
        rows.push(
          ['--- Physical Assessment ---', ''],
          ['Date', currentAssessment.assessment_date || ''],
          ['Sprint (20m)', currentAssessment.sprint?.toFixed(2) || ''],
          ['Vertical', currentAssessment.vertical || ''],
          ['YIRT', currentAssessment.yirt || ''],
          ['Shuttle', currentAssessment.shuttle?.toFixed(2) || ''],
          ['Speed Score', currentAssessment.speed_score || ''],
          ['Power Score', currentAssessment.power_score || ''],
          ['Endurance Score', currentAssessment.endurance_score || ''],
          ['Agility Score', currentAssessment.agility_score || ''],
          ['Overall Score', currentAssessment.overall_score || '']
        );
      }

      if (selectedOptions.includes('evaluation') && currentEvaluation) {
        rows.push(
          ['--- Evaluation ---', ''],
          ['Date', new Date(currentEvaluation.created_date).toLocaleDateString()],
          ['Growth Mindset', currentEvaluation.growth_mindset || ''],
          ['Resilience', currentEvaluation.resilience || ''],
          ['Efficiency', currentEvaluation.efficiency_in_execution || ''],
          ['Athleticism', currentEvaluation.athleticism || ''],
          ['Team Focus', currentEvaluation.team_focus || ''],
          ['Defending Organized', currentEvaluation.defending_organized || ''],
          ['Defending Final Third', currentEvaluation.defending_final_third || ''],
          ['Defending Transition', currentEvaluation.defending_transition || ''],
          ['Attacking Organized', currentEvaluation.attacking_organized || ''],
          ['Attacking Final Third', currentEvaluation.attacking_final_third || ''],
          ['Attacking In Transition', currentEvaluation.attacking_in_transition || ''],
          ['Strengths', currentEvaluation.player_strengths || ''],
          ['Areas of Growth', currentEvaluation.areas_of_growth || ''],
          ['Training Focus', currentEvaluation.training_focus || '']
        );
      }

      const csv = generateCSV(headers, rows);
      downloadFile(csv, `player_${player.full_name.replace(/\s+/g, '_')}.csv`);
    } else {
      const sections = [
        {
          title: 'Player Information',
          content: `
            <table>
              <tr><th>Name</th><td>${player.full_name}</td></tr>
              <tr><th>Jersey</th><td>${player.jersey_number || 'N/A'}</td></tr>
              <tr><th>Position</th><td>${player.primary_position || 'N/A'}</td></tr>
              <tr><th>Team</th><td>${team?.name || 'N/A'}</td></tr>
              <tr><th>Status</th><td>${player.status || 'N/A'}</td></tr>
              <tr><th>DOB</th><td>${player.date_of_birth || 'N/A'}</td></tr>
              <tr><th>Email</th><td>${player.email || 'N/A'}</td></tr>
              <tr><th>Phone</th><td>${player.phone || 'N/A'}</td></tr>
            </table>
          `
        }
      ];

      if (selectedOptions.includes('tryout') && isAdminOrCoach && tryout) {
        sections.push({
          title: 'Tryout Information',
          content: `
            <table>
              <tr><th>Team Role</th><td>${tryout.team_role || 'N/A'}</td></tr>
              <tr><th>Recommendation</th><td>${tryout.recommendation || 'N/A'}</td></tr>
              <tr><th>Next Year Team</th><td>${tryout.next_year_team || 'N/A'}</td></tr>
              <tr><th>Next Season Status</th><td>${tryout.next_season_status || 'N/A'}</td></tr>
              <tr><th>Registration</th><td>${tryout.registration_status || 'N/A'}</td></tr>
              <tr><th>Notes</th><td>${tryout.notes || 'N/A'}</td></tr>
            </table>
          `
        });
      }

      if (selectedOptions.includes('assessment') && currentAssessment) {
        sections.push({
          title: 'Physical Assessment',
          content: `
            <table>
              <tr><th>Date</th><td>${currentAssessment.assessment_date || 'N/A'}</td></tr>
              <tr><th>Sprint (20m)</th><td>${currentAssessment.sprint?.toFixed(2) || 'N/A'}s</td></tr>
              <tr><th>Vertical</th><td>${currentAssessment.vertical || 'N/A'}"</td></tr>
              <tr><th>YIRT</th><td>${currentAssessment.yirt || 'N/A'}</td></tr>
              <tr><th>Shuttle</th><td>${currentAssessment.shuttle?.toFixed(2) || 'N/A'}s</td></tr>
              <tr><th>Speed</th><td>${currentAssessment.speed_score || 'N/A'}</td></tr>
              <tr><th>Power</th><td>${currentAssessment.power_score || 'N/A'}</td></tr>
              <tr><th>Endurance</th><td>${currentAssessment.endurance_score || 'N/A'}</td></tr>
              <tr><th>Agility</th><td>${currentAssessment.agility_score || 'N/A'}</td></tr>
              <tr><th>Overall</th><td>${currentAssessment.overall_score || 'N/A'}</td></tr>
            </table>
          `
        });
      }

      if (selectedOptions.includes('evaluation') && currentEvaluation) {
        sections.push({
          title: 'Evaluation',
          content: `
            <table>
              <tr><th>Growth Mindset</th><td>${currentEvaluation.growth_mindset || 'N/A'}</td></tr>
              <tr><th>Resilience</th><td>${currentEvaluation.resilience || 'N/A'}</td></tr>
              <tr><th>Athleticism</th><td>${currentEvaluation.athleticism || 'N/A'}</td></tr>
              <tr><th>Team Focus</th><td>${currentEvaluation.team_focus || 'N/A'}</td></tr>
              <tr><th>Defending Organized</th><td>${currentEvaluation.defending_organized || 'N/A'}</td></tr>
              <tr><th>Attacking Organized</th><td>${currentEvaluation.attacking_organized || 'N/A'}</td></tr>
              <tr><th>Strengths</th><td>${currentEvaluation.player_strengths || 'N/A'}</td></tr>
              <tr><th>Areas of Growth</th><td>${currentEvaluation.areas_of_growth || 'N/A'}</td></tr>
            </table>
          `
        });
      }

      const html = generatePDFContent(`Player Report: ${player.full_name}`, sections);
      printPDF(html);
    }
    setShowExportDialog(false);
  };

  const exportOptions = [
    { id: 'player', label: 'Player Information' },
    { id: 'assessment', label: 'Physical Assessment' },
    { id: 'evaluation', label: 'Evaluation Data' },
    ...(isAdminOrCoach ? [{ id: 'tryout', label: 'Tryout Information' }] : [])
  ];

  // Analytics data with raw metrics in tooltip
  const physicalTrendData = assessments.slice().reverse().map(a => ({
    date: new Date(a.assessment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Speed: a.speed_score || 0,
    Power: a.power_score || 0,
    Endurance: a.endurance_score || 0,
    Agility: a.agility_score || 0,
    sprint: a.sprint,
    vertical: a.vertical,
    yirt: a.yirt,
    shuttle: a.shuttle
  }));

  const evaluationTrendData = evaluations.slice().reverse().map(e => ({
    date: new Date(e.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Mental: Math.round(((e.growth_mindset || 0) + (e.resilience || 0) + (e.team_focus || 0)) / 3),
    Physical: e.athleticism || 0,
    Defending: Math.round(((e.defending_organized || 0) + (e.defending_final_third || 0) + (e.defending_transition || 0)) / 3),
    Attacking: Math.round(((e.attacking_organized || 0) + (e.attacking_final_third || 0) + (e.attacking_in_transition || 0)) / 3)
  }));

  if (playerLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-slate-500">Player not found</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">{player.full_name}</h1>
          {player.status === 'Injured' && (
            <Badge className="bg-red-100 text-red-800">
              Injured
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={!previousPlayer} onClick={() => navigate(`?id=${previousPlayer?.id}`)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" disabled={!nextPlayer} onClick={() => navigate(`?id=${nextPlayer?.id}`)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)}>
            <FileDown className="w-4 h-4 mr-1" />
            Export
          </Button>
          <Button onClick={() => isEditing ? handleSaveAll() : setIsEditing(true)} className="bg-emerald-600 hover:bg-emerald-700">
            {isEditing ? <><Save className="w-4 h-4 mr-2" />Save All</> : 'Edit'}
          </Button>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${isAdminOrCoach ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
        {/* Player Info & Contact */}
        <Card className="border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="w-4 h-4" /> Player Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-center mb-3">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {player.jersey_number || player.full_name?.charAt(0)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-slate-500">Name</Label>
                {isEditing ? (
                  <Input value={playerForm.full_name} onChange={e => setPlayerForm({...playerForm, full_name: e.target.value})} className="h-8 text-xs" />
                ) : (
                  <p className="text-sm font-medium">{player.full_name}</p>
                )}
              </div>
              <div>
                <Label className="text-[10px] text-slate-500">Jersey #</Label>
                {isEditing ? (
                  <Input type="number" value={playerForm.jersey_number} onChange={e => setPlayerForm({...playerForm, jersey_number: e.target.value})} className="h-8 text-xs" />
                ) : (
                  <p className="text-sm font-medium">{player.jersey_number || 'N/A'}</p>
                )}
              </div>
              <div>
                <Label className="text-[10px] text-slate-500">Position</Label>
                {isEditing ? (
                  <Select value={playerForm.primary_position} onValueChange={v => setPlayerForm({...playerForm, primary_position: v})}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['GK','Right Outside Back','Left Outside Back','Right Centerback','Left Centerback','Defensive Midfielder','Right Winger','Center Midfielder','Forward','Attacking Midfielder','Left Winger'].map(pos => (
                        <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm font-medium">{player.primary_position || 'N/A'}</p>
                )}
              </div>
              <div>
               <Label className="text-[10px] text-slate-500">Team</Label>
               {isEditing ? (
                 <Select value={playerForm.team_id || ''} onValueChange={v => setPlayerForm({...playerForm, team_id: v})}>
                   <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select team" /></SelectTrigger>
                   <SelectContent>
                     {allTeams.map(t => (
                       <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               ) : (
                 <p className="text-sm font-medium">{team?.name || 'N/A'}</p>
               )}
              </div>
              <div>
                <Label className="text-[10px] text-slate-500">Status</Label>
                {isEditing ? (
                  <Select value={playerForm.status} onValueChange={v => setPlayerForm({...playerForm, status: v})}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Injured">Injured</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  player.status === 'Injured' ? <Badge className="bg-red-100 text-red-800 text-[10px]">Injured</Badge> : <span className="text-xs">-</span>
                )}
              </div>
              <div>
                <Label className="text-[10px] text-slate-500">DOB</Label>
                {isEditing ? (
                  <Input type="date" value={playerForm.date_of_birth} onChange={e => setPlayerForm({...playerForm, date_of_birth: e.target.value})} className="h-8 text-xs" />
                ) : (
                  <p className="text-sm font-medium">{player.date_of_birth ? new Date(player.date_of_birth).toLocaleDateString() : 'N/A'}</p>
                )}
              </div>
              <div>
                <Label className="text-[10px] text-slate-500">Parent</Label>
                {isEditing ? (
                  <Input value={playerForm.parent_name} onChange={e => setPlayerForm({...playerForm, parent_name: e.target.value})} className="h-8 text-xs" />
                ) : (
                  <p className="text-sm font-medium">{player.parent_name || 'N/A'}</p>
                )}
              </div>
            </div>
            <div className="border-t pt-2 space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="w-3 h-3 text-slate-400" />
                {isEditing ? (
                  <Input type="email" value={playerForm.email} onChange={e => setPlayerForm({...playerForm, email: e.target.value})} className="h-7 text-xs flex-1" />
                ) : (
                  <span className="text-xs text-slate-600">{player.email || 'N/A'}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    {isEditing ? (
                                      <Input value={playerForm.phone} onChange={e => setPlayerForm({...playerForm, phone: e.target.value})} className="h-7 text-xs flex-1" />
                                    ) : (
                                      <span className="text-xs text-slate-600">{player.phone || 'N/A'}</span>
                                    )}
                                  </div>
                                </div>
                                {/* Parent Contacts */}
                                {assignedParents.length > 0 && (
                                  <div className="border-t pt-2 mt-2">
                                    <div className="text-[10px] font-semibold text-slate-500 mb-1">Assigned Parents</div>
                                    {assignedParents.map(parent => (
                                      <div key={parent.id} className="text-xs text-slate-600 mb-1">
                                        <div className="font-medium">{parent.full_name}</div>
                                        <div className="text-slate-500">{parent.email}</div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </CardContent>
                            </Card>

        {/* Tryout Info - Only visible to admin/coach */}
        {isAdminOrCoach && (
        <Card className="border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tryout Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-slate-500">Team Role</Label>
                {isEditing ? (
                  <Select value={tryoutForm.team_role} onValueChange={v => setTryoutForm({...tryoutForm, team_role: v})}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {['Indispensable Player','GA Starter','GA Rotation','Aspire Starter','Aspire Rotation','United Starter','United Rotation'].map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className="bg-purple-100 text-purple-800 text-[10px]">{tryout?.team_role || 'N/A'}</Badge>
                )}
              </div>
              <div>
                <Label className="text-[10px] text-slate-500">Recommendation</Label>
                {isEditing ? (
                  <Select value={tryoutForm.recommendation} onValueChange={v => setTryoutForm({...tryoutForm, recommendation: v})}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Move up">🔼 Move up</SelectItem>
                      <SelectItem value="Keep">✅ Keep</SelectItem>
                      <SelectItem value="Move down">🔽 Move down</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={`text-[10px] ${tryout?.recommendation === 'Move up' ? 'bg-emerald-100 text-emerald-800' : tryout?.recommendation === 'Move down' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                    {tryout?.recommendation || 'N/A'}
                  </Badge>
                )}
              </div>
              <div>
                <Label className="text-[10px] text-slate-500">Dominant Foot</Label>
                {isEditing ? (
                  <Select value={tryoutForm.dominant_foot} onValueChange={v => setTryoutForm({...tryoutForm, dominant_foot: v})}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Left">Left</SelectItem>
                      <SelectItem value="Right">Right</SelectItem>
                      <SelectItem value="Both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm font-medium">{tryout?.dominant_foot || 'N/A'}</p>
                )}
              </div>
              <div>
                <Label className="text-[10px] text-slate-500">Next Year Team</Label>
                {isEditing ? (
                  <ComboboxInput
                    value={tryoutForm.next_year_team}
                    onChange={(val) => setTryoutForm({...tryoutForm, next_year_team: val})}
                    options={existingTeamNames}
                    placeholder="Select or type team"
                    className="text-xs"
                  />
                ) : (
                  <p className="text-sm font-medium">{tryout?.next_year_team || 'N/A'}</p>
                )}
              </div>
              <div>
                <Label className="text-[10px] text-slate-500">Next Season Status</Label>
                {isEditing ? (
                  <Select value={tryoutForm.next_season_status} onValueChange={v => setTryoutForm({...tryoutForm, next_season_status: v})}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N/A">N/A</SelectItem>
                      <SelectItem value="Accepted Offer">Accepted</SelectItem>
                      <SelectItem value="Rejected Offer">Rejected</SelectItem>
                      <SelectItem value="Considering Offer">Considering</SelectItem>
                      <SelectItem value="Not Offered">Not Offered</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm font-medium">{tryout?.next_season_status || 'N/A'}</p>
                )}
              </div>
              <div>
                <Label className="text-[10px] text-slate-500">Registration</Label>
                {isEditing ? (
                  <Select value={tryoutForm.registration_status} onValueChange={v => setTryoutForm({...tryoutForm, registration_status: v})}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Not Signed">Not Signed</SelectItem>
                      <SelectItem value="Signed">Signed</SelectItem>
                      <SelectItem value="Signed and Paid">Signed & Paid</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={`text-[10px] ${tryout?.registration_status === 'Signed and Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
                    {tryout?.registration_status || 'Not Signed'}
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <Label className="text-[10px] text-slate-500">Notes</Label>
              {isEditing ? (
                <Textarea value={tryoutForm.notes} onChange={e => setTryoutForm({...tryoutForm, notes: e.target.value})} className="text-xs" rows={2} />
              ) : (
                <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded">{tryout?.notes || 'No notes'}</p>
              )}
            </div>
          </CardContent>
        </Card>
        )}

        {/* Physical Assessment */}
        <Card className="border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                Physical Assessment
                {assessments.length > 1 && (
                  <span className="text-[10px] text-slate-400">({assessmentIndex + 1}/{assessments.length})</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {assessments.length > 1 && (
                  <>
                    <button onClick={() => setAssessmentIndex(Math.min(assessmentIndex + 1, assessments.length - 1))} disabled={assessmentIndex >= assessments.length - 1} className="p-1 hover:bg-slate-100 rounded disabled:opacity-30">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={() => setAssessmentIndex(Math.max(assessmentIndex - 1, 0))} disabled={assessmentIndex <= 0} className="p-1 hover:bg-slate-100 rounded disabled:opacity-30">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
                {currentAssessment && <span className="text-[10px] font-normal text-slate-500">{new Date(currentAssessment.assessment_date).toLocaleDateString()}</span>}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentAssessment ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-red-50 rounded-lg text-center">
                    <div className="text-[10px] text-red-600">Sprint (20m)</div>
                    <div className="text-lg font-bold text-red-700">{currentAssessment.sprint?.toFixed(2)}s</div>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg text-center">
                    <div className="text-[10px] text-blue-600">Vertical</div>
                    <div className="text-lg font-bold text-blue-700">{currentAssessment.vertical}"</div>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded-lg text-center">
                    <div className="text-[10px] text-emerald-600">YIRT</div>
                    <div className="text-lg font-bold text-emerald-700">{currentAssessment.yirt}</div>
                  </div>
                  <div className="p-2 bg-pink-50 rounded-lg text-center">
                    <div className="text-[10px] text-pink-600">Shuttle</div>
                    <div className="text-lg font-bold text-pink-700">{currentAssessment.shuttle?.toFixed(2)}s</div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { label: 'Speed', score: currentAssessment.speed_score, color: '#ef4444' },
                    { label: 'Power', score: currentAssessment.power_score, color: '#3b82f6' },
                    { label: 'Endurance', score: currentAssessment.endurance_score, color: '#10b981' },
                    { label: 'Agility', score: currentAssessment.agility_score, color: '#ec4899' }
                  ].map(({ label, score, color }) => (
                    <div key={label} className="text-center">
                      <div className="relative w-10 h-10 mx-auto">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="20" cy="20" r="16" stroke="#e5e7eb" strokeWidth="4" fill="none" />
                          <circle cx="20" cy="20" r="16" stroke={color} strokeWidth="4" fill="none"
                            strokeDasharray={`${2 * Math.PI * 16}`}
                            strokeDashoffset={`${2 * Math.PI * 16 * (1 - (score || 0) / 100)}`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">{score || 0}</div>
                      </div>
                      <div className="text-[8px] text-slate-500 mt-1">{label}</div>
                    </div>
                  ))}
                </div>
                <div className="text-center p-2 bg-slate-900 rounded-lg">
                  <div className="text-[10px] text-white/70">Overall</div>
                  <div className="text-xl font-bold text-white">{currentAssessment.overall_score || 0}</div>
                </div>
              </div>
            ) : (
              <p className="text-center text-slate-500 py-6 text-sm">No assessments yet</p>
            )}
          </CardContent>
        </Card>

        {/* Evaluation Metrics */}
        <Card className="border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                Evaluation
                {evaluations.length > 1 && (
                  <span className="text-[10px] text-slate-400">({evaluationIndex + 1}/{evaluations.length})</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {evaluations.length > 1 && (
                  <>
                    <button onClick={() => setEvaluationIndex(Math.min(evaluationIndex + 1, evaluations.length - 1))} disabled={evaluationIndex >= evaluations.length - 1} className="p-1 hover:bg-slate-100 rounded disabled:opacity-30">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEvaluationIndex(Math.max(evaluationIndex - 1, 0))} disabled={evaluationIndex <= 0} className="p-1 hover:bg-slate-100 rounded disabled:opacity-30">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => navigate(`${createPageUrl('EvaluationsNew')}?playerId=${playerId}`)}>
                  <Plus className="w-3 h-3 mr-1" />New
                </Button>
              </div>
            </CardTitle>
            {currentEvaluation && <span className="text-[10px] font-normal text-slate-500">{new Date(currentEvaluation.created_date).toLocaleDateString()}</span>}
          </CardHeader>
          <CardContent>
            {currentEvaluation ? (
              <div className="space-y-2">
                <div className="text-[10px] font-semibold text-slate-700 mb-1">Mental & Character</div>
                {['growth_mindset', 'resilience', 'efficiency_in_execution', 'athleticism', 'team_focus'].map(key => (
                  <SliderBar
                    key={key}
                    label={metricLabels[key]}
                    value={currentEvaluation[key]}
                    color={metricColors[key]}
                  />
                ))}
                <div className="text-[10px] font-semibold text-slate-700 mt-3 mb-1">Defending</div>
                {['defending_organized', 'defending_final_third', 'defending_transition'].map(key => (
                  <SliderBar
                    key={key}
                    label={metricLabels[key]}
                    value={currentEvaluation[key]}
                    color={metricColors[key]}
                  />
                ))}
                <div className="text-[10px] font-semibold text-slate-700 mt-3 mb-1">Attacking</div>
                {['attacking_organized', 'attacking_final_third', 'attacking_in_transition'].map(key => (
                  <SliderBar
                    key={key}
                    label={metricLabels[key]}
                    value={currentEvaluation[key]}
                    color={metricColors[key]}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-slate-500 text-sm mb-2">No evaluations yet</p>
                <Button size="sm" onClick={() => navigate(`${createPageUrl('EvaluationsNew')}?playerId=${playerId}`)} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-1" />Create Evaluation
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics Row */}
      {(assessments.length > 1 || evaluations.length > 1) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          {assessments.length > 1 && (
            <Card className="border-none shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Physical Progress ({assessments.length} assessments)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={physicalTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ fontSize: 11 }} 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-2 border rounded shadow-lg text-xs">
                              <p className="font-bold mb-1">{data.date}</p>
                              <p>Sprint: {data.sprint?.toFixed(2)}s</p>
                              <p>Vertical: {data.vertical}"</p>
                              <p>YIRT: {data.yirt}</p>
                              <p>Shuttle: {data.shuttle?.toFixed(2)}s</p>
                              <hr className="my-1" />
                              {payload.map((p, i) => (
                                <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="Speed" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Power" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Endurance" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Agility" stroke="#ec4899" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {evaluations.length > 1 && (
            <Card className="border-none shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  Evaluation Progress ({evaluations.length} evaluations)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={evaluationTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="Mental" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Physical" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Defending" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Attacking" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Injury History */}
      {(isAdminOrCoach || injuries.length > 0) && (
        <Card className="border-none shadow-lg mt-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Injury History</CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={injuries.some(i => i.status === 'Active') ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}>
                  {injuries.some(i => i.status === 'Active') ? 'Currently Injured' : 'Healthy'}
                </Badge>
                {isAdminOrCoach && (
                  <Button variant="outline" size="sm" onClick={() => setShowInjuryDialog(true)}>
                    <Plus className="w-3 h-3 mr-1" />
                    Add Injury
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {injuries.length === 0 ? (
              <p className="text-center text-slate-500 py-4 text-sm">No injury records</p>
            ) : (
              <div className="space-y-2">
                {injuries.map(injury => (
                  <div key={injury.id} className={`p-3 rounded-lg border-l-4 ${injury.status === 'Active' ? 'bg-red-50 border-l-red-500' : injury.status === 'Recovering' ? 'bg-yellow-50 border-l-yellow-500' : 'bg-green-50 border-l-green-500'}`}>
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <div className="font-semibold text-sm text-slate-900">{injury.injury_type}</div>
                        <div className="text-xs text-slate-600">
                          {new Date(injury.injury_date).toLocaleDateString()}
                          {injury.recovery_date && ` → ${new Date(injury.recovery_date).toLocaleDateString()}`}
                        </div>
                      </div>
                      <Badge className={`text-[10px] ${injury.status === 'Active' ? 'bg-red-100 text-red-800' : injury.status === 'Recovering' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                        {injury.status}
                      </Badge>
                    </div>
                    {injury.severity && <Badge className="text-[9px] bg-slate-100 text-slate-700 mr-2">{injury.severity}</Badge>}
                    {injury.treatment_notes && <p className="text-xs text-slate-600 mt-1">{injury.treatment_notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      {isAdminOrCoach && (
        <Card className="border-none shadow-lg mt-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Documents & Reports</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowDocumentDialog(true)}>
                <Plus className="w-3 h-3 mr-1" />
                Upload
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <p className="text-center text-slate-500 py-4 text-sm">No documents uploaded</p>
            ) : (
              <div className="space-y-2">
                {documents.map(doc => (
                  <div key={doc.id} className="p-3 bg-slate-50 rounded-lg flex items-start justify-between">
                    <div className="flex-1">
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="font-medium text-sm text-emerald-600 hover:underline">
                        {doc.title}
                      </a>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="text-[9px] bg-blue-100 text-blue-800">{doc.document_type}</Badge>
                        {doc.upload_date && <span className="text-xs text-slate-500">{new Date(doc.upload_date).toLocaleDateString()}</span>}
                      </div>
                      {doc.notes && <p className="text-xs text-slate-600 mt-1">{doc.notes}</p>}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => deleteDocumentMutation.mutate(doc.id)} className="hover:bg-red-50 hover:text-red-600">
                      <span className="text-xs">Delete</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Player Goals */}
      {isAdminOrCoach && (
        <div className="mt-4">
          <PlayerGoalsManager 
            player={player} 
            onUpdate={(data) => updatePlayerMutation.mutate(data)}
          />
        </div>
      )}

      {/* Position Knowledge Bank */}
      {player.primary_position && (
        <div className="mt-4">
          <PositionKnowledgeBank position={player.primary_position} />
        </div>
      )}

      {/* Development Notes */}
      {currentEvaluation && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <Card className="border-none shadow-lg bg-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-800">Strengths</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-700">{currentEvaluation.player_strengths || 'Not specified'}</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-lg bg-orange-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-orange-800">Areas of Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-orange-700">{currentEvaluation.areas_of_growth || 'Not specified'}</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-lg bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-800">Training Focus</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-700">{currentEvaluation.training_focus || 'Not specified'}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Document Type</Label>
              <Select value={newDocument.document_type} onValueChange={v => setNewDocument({...newDocument, document_type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Medical Report">Medical Report</SelectItem>
                  <SelectItem value="Scouting Note">Scouting Note</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Title</Label>
              <Input value={newDocument.title} onChange={e => setNewDocument({...newDocument, title: e.target.value})} placeholder="e.g., Pre-season Medical" />
            </div>
            <div>
              <Label>File</Label>
              <Input type="file" onChange={e => setNewDocument({...newDocument, file: e.target.files[0]})} />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea value={newDocument.notes} onChange={e => setNewDocument({...newDocument, notes: e.target.value})} rows={2} />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowDocumentDialog(false)} className="flex-1">Cancel</Button>
              <Button onClick={() => uploadDocumentMutation.mutate(newDocument)} disabled={!newDocument.title || !newDocument.file} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                Upload
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showInjuryDialog} onOpenChange={setShowInjuryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Injury Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Date of Injury *</Label>
              <Input type="date" value={newInjury.injury_date} onChange={e => setNewInjury({...newInjury, injury_date: e.target.value})} />
            </div>
            <div>
              <Label>Injury Description *</Label>
              <Input value={newInjury.injury_type} onChange={e => setNewInjury({...newInjury, injury_type: e.target.value})} placeholder="e.g., Ankle sprain" />
            </div>
            <div>
              <Label>Projected Return to Play Date</Label>
              <Input type="date" value={newInjury.recovery_date} onChange={e => setNewInjury({...newInjury, recovery_date: e.target.value})} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={newInjury.treatment_notes} onChange={e => setNewInjury({...newInjury, treatment_notes: e.target.value})} rows={3} placeholder="Treatment notes, recovery plan..." />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowInjuryDialog(false)} className="flex-1">Cancel</Button>
              <Button onClick={() => createInjuryMutation.mutate(newInjury)} disabled={!newInjury.injury_date || !newInjury.injury_type} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                Add Injury
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ExportDialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        title="Export Player Data"
        options={exportOptions}
        onExport={handleExport}
      />
    </div>
  );
}