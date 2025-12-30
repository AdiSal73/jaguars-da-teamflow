import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, User, Mail, Phone, Save, ChevronLeft, ChevronRight, TrendingUp, Plus, FileDown, Share2, Printer } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import SharePlayerDialog from '../components/messaging/SharePlayerDialog';
import GoalFeedbackDialog from '../components/messaging/GoalFeedbackDialog';
import ParentEmailsManager from '../components/player/ParentEmailsManager';
import AddParentDialog from '../components/player/AddParentDialog';
import CreateEvaluationDialog from '../components/evaluation/CreateEvaluationDialog';
import EditEvaluationDialog from '../components/evaluation/EditEvaluationDialog';
import EvaluationRadarChart from '../components/evaluation/EvaluationRadarChart';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ComboboxInput from '../components/ui/ComboboxInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import ExportDialog, { generateCSV, downloadFile, generatePDFContent, printPDF } from '../components/export/ExportDialog';
import PositionKnowledgeBank from '../components/player/PositionKnowledgeBank';
import PlayerDevelopmentDisplay from '../components/player/PlayerDevelopmentDisplay';

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
  const [showEditInjuryDialog, setShowEditInjuryDialog] = useState(false);
  const [editingInjury, setEditingInjury] = useState(null);
  const [newInjury, setNewInjury] = useState({ 
    injury_date: '', 
    injury_type: '', 
    recovery_date: '', 
    treatment_notes: '',
    severity: 'Minor',
    status: 'Active'
  });
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackGoal, setFeedbackGoal] = useState(null);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [showCreateEvalDialog, setShowCreateEvalDialog] = useState(false);
  const [showEditEvalDialog, setShowEditEvalDialog] = useState(false);
  const [showAddParentDialog, setShowAddParentDialog] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const { data: player, isLoading: playerLoading, isError: playerError } = useQuery({
    queryKey: ['player', playerId],
    queryFn: async () => {
      if (!playerId) return null;
      const players = await base44.entities.Player.filter({ id: playerId });
      if (players.length === 0) {
        throw new Error('Player not found');
      }
      return players[0];
    },
    enabled: !!playerId,
    retry: 1
  });

  const isAdminOrCoach = currentUser?.role === 'admin' || coaches.some(c => c.email === currentUser?.email);
  const canEdit = isAdminOrCoach;
  
  const isAuthorized = React.useMemo(() => {
    if (!currentUser) return false;
    if (!player) return true;
    if (currentUser.role === 'admin') return true;
    
    const currentCoach = coaches.find(c => c.email === currentUser.email);
    if (currentCoach) return true;
    
    if (currentUser.player_ids && currentUser.player_ids.includes(playerId)) return true;
    if (player.email && player.email === currentUser.email) return true;
    return false;
  }, [currentUser, player, playerId, coaches]);

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

  const { data: pathway } = useQuery({
    queryKey: ['pathway', playerId],
    queryFn: async () => {
      const pathways = await base44.entities.DevelopmentPathway.filter({ player_id: playerId });
      return pathways[0] || null;
    },
    enabled: !!playerId
  });

  const assignedParents = allUsers.filter(u => 
    (u.player_ids || []).includes(playerId)
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
        player_email: player.player_email || '',
        player_phone: player.player_phone || '',
        date_of_birth: player.date_of_birth || '',
        grad_year: player.grad_year || '',
        jersey_number: player.jersey_number || '',
        primary_position: player.primary_position || '',
        secondary_position: player.secondary_position || '',
        parent_name: player.parent_name || '',
        parent_emails: player.parent_emails || [],
        status: player.status || 'Active',
        team_id: player.team_id || '',
        profile_password: player.profile_password || ''
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
    mutationFn: async (data) => {
      await base44.entities.Player.update(playerId, data);
      
      if (data.parent_emails) {
        const currentParentEmails = player?.parent_emails || [];
        const removedParentEmails = currentParentEmails.filter(email => !data.parent_emails.includes(email));

        for (const email of removedParentEmails) {
          const existingUser = allUsers.find(u => u.email === email);
          if (existingUser) {
            const updatedPlayerIds = (existingUser.player_ids || []).filter(id => id !== playerId);
            await base44.entities.User.update(existingUser.id, { player_ids: updatedPlayerIds });
          }
        }

        for (const email of data.parent_emails) {
          const existingUser = allUsers.find(u => u.email === email);
          if (existingUser) {
            const currentPlayerIds = existingUser.player_ids || [];
            if (!currentPlayerIds.includes(playerId)) {
              await base44.entities.User.update(existingUser.id, {
                player_ids: [...currentPlayerIds, playerId]
              });
            }
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['player', playerId]);
      queryClient.invalidateQueries(['allUsers']);
    }
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

  const updatePathwayMutation = useMutation({
    mutationFn: (data) => {
      if (pathway?.id) {
        return base44.entities.DevelopmentPathway.update(pathway.id, data);
      }
    },
    onSuccess: () => queryClient.invalidateQueries(['pathway', playerId])
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
      ...data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['injuries', playerId]);
      setShowInjuryDialog(false);
      setNewInjury({ injury_date: '', injury_type: '', recovery_date: '', treatment_notes: '', severity: 'Minor', status: 'Active' });
    }
  });

  const updateInjuryMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.InjuryRecord.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['injuries', playerId]);
      setShowEditInjuryDialog(false);
      setEditingInjury(null);
    }
  });

  const handleSendGoalFeedback = async (player, goal, feedback) => {
    const registeredUsers = assignedParents.map(p => p.email).filter(Boolean);

    for (const email of registeredUsers) {
      await base44.entities.Notification.create({
        user_email: email,
        type: 'goal',
        title: 'Coach Feedback on Goal',
        message: `${currentUser?.full_name} provided feedback on ${player.full_name}'s goal: ${goal.description}\n\nFeedback: ${feedback}`,
        link: `${createPageUrl('PlayerDashboard')}?id=${playerId}`
      });
    }

    toast.success('Feedback notification sent to assigned parents');
  };

  const handleSaveAll = async () => {
    const playerData = {
      ...playerForm,
      jersey_number: playerForm.jersey_number ? Number(playerForm.jersey_number) : null
    };
    await updatePlayerMutation.mutateAsync(playerData);
    if (isAdminOrCoach) {
      await updateTryoutMutation.mutateAsync(tryoutForm);
    }
    setIsEditing(false);
    toast.success('Player updated successfully');
  };

  const teamPlayers = player?.team_id 
    ? [...allPlayers].filter(p => p.team_id === player.team_id).sort((a, b) => {
        const lastNameA = a.full_name?.split(' ').pop() || '';
        const lastNameB = b.full_name?.split(' ').pop() || '';
        return lastNameA.localeCompare(lastNameB);
      })
    : [...allPlayers].sort((a, b) => {
        const lastNameA = a.full_name?.split(' ').pop() || '';
        const lastNameB = b.full_name?.split(' ').pop() || '';
        return lastNameA.localeCompare(lastNameB);
      });
  
  const currentPlayerIndex = teamPlayers.findIndex(p => p.id === playerId);
  const previousPlayer = currentPlayerIndex > 0 ? teamPlayers[currentPlayerIndex - 1] : null;
  const nextPlayer = currentPlayerIndex < teamPlayers.length - 1 ? teamPlayers[currentPlayerIndex + 1] : null;

  const existingTeamNames = [...new Set(allTeams.map(t => t.name).filter(Boolean))];

  const physicalTrendData = assessments.slice().reverse().map(a => ({
    date: new Date(a.assessment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Speed: a.speed_score || 0,
    Power: a.power_score || 0,
    Endurance: a.endurance_score || 0,
    Agility: a.agility_score || 0
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

  if (!player || playerError || !isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-slate-500">
          {!player ? 'Player not found' : !isAuthorized ? 'You do not have permission to view this player' : 'Error loading player'}
        </p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-2 md:p-4">
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl p-4 mb-2 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-white hover:bg-white/20 h-8 px-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-xl font-bold text-white ring-2 ring-white/30">
              {player.jersey_number || player.full_name?.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{player.full_name}</h1>
              <div className="flex gap-1.5">
                <Badge className="text-[10px] bg-white/20 text-white border-white/30">{player.primary_position}</Badge>
                <Badge className="text-[10px] bg-white/20 text-white border-white/30">{team?.name}</Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" disabled={!previousPlayer} onClick={() => navigate(`?id=${previousPlayer?.id}`)} className="text-white hover:bg-white/20 h-8 px-2">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" disabled={!nextPlayer} onClick={() => navigate(`?id=${nextPlayer?.id}`)} className="text-white hover:bg-white/20 h-8 px-2">
              <ChevronRight className="w-4 h-4" />
            </Button>
            {canEdit && (
              <Button onClick={() => isEditing ? handleSaveAll() : setIsEditing(true)} size="sm" className="bg-white text-emerald-600 hover:bg-white/90 h-8">
                {isEditing ? <><Save className="w-3 h-3 mr-1" />Save</> : 'Edit'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-2 auto-rows-min">
        {/* Player Info - Compact */}
        <Card className="col-span-12 md:col-span-4 bg-gradient-to-br from-white to-emerald-50 border-none shadow-lg">
          <CardHeader className="pb-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-3">
            <CardTitle className="text-sm flex items-center gap-2"><User className="w-4 h-4" />Info</CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><Label className="text-[9px] text-slate-500">Jersey</Label>{isEditing ? <Input value={playerForm.jersey_number} onChange={e => setPlayerForm({...playerForm, jersey_number: e.target.value})} className="h-7 text-xs" /> : <p className="font-medium">{player.jersey_number || 'N/A'}</p>}</div>
              <div><Label className="text-[9px] text-slate-500">DOB</Label>{isEditing ? <Input type="date" value={playerForm.date_of_birth} onChange={e => setPlayerForm({...playerForm, date_of_birth: e.target.value})} className="h-7 text-xs" /> : <p className="font-medium text-xs">{player.date_of_birth ? new Date(player.date_of_birth).toLocaleDateString() : 'N/A'}</p>}</div>
              <div><Label className="text-[9px] text-slate-500">Position</Label>{isEditing ? <Select value={playerForm.primary_position} onValueChange={v => setPlayerForm({...playerForm, primary_position: v})}><SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger><SelectContent>{['GK','Right Outside Back','Left Outside Back','Right Centerback','Left Centerback','Defensive Midfielder','Right Winger','Center Midfielder','Forward','Attacking Midfielder','Left Winger'].map(pos => <SelectItem key={pos} value={pos}>{pos}</SelectItem>)}</SelectContent></Select> : <p className="font-medium text-xs">{player.primary_position || 'N/A'}</p>}</div>
              <div><Label className="text-[9px] text-slate-500">Team</Label><p className="font-medium text-xs">{team?.name || 'N/A'}</p></div>
            </div>
            <div className="border-t pt-2">
              <div className="text-[9px] font-semibold text-slate-500 mb-1">Parent Emails</div>
              <ParentEmailsManager parentEmails={playerForm.parent_emails || []} onChange={(emails) => setPlayerForm({...playerForm, parent_emails: emails})} disabled={!isEditing} />
            </div>
          </CardContent>
        </Card>

        {/* Tryout Info */}
        {isAdminOrCoach && (
        <Card className="col-span-12 md:col-span-4 bg-gradient-to-br from-white to-emerald-50 border-none shadow-lg">
          <CardHeader className="pb-2 bg-gradient-to-r from-emerald-700 to-green-700 text-white p-3">
            <CardTitle className="text-sm">🎯 Tryout Info</CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><Label className="text-[9px] text-slate-500">Role</Label>{isEditing ? <Select value={tryoutForm.team_role} onValueChange={v => setTryoutForm({...tryoutForm, team_role: v})}><SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger><SelectContent>{['Indispensable Player','GA Starter','GA Rotation','Aspire Starter','Aspire Rotation','United Starter','United Rotation'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select> : <Badge className="text-[9px]">{tryout?.team_role || 'N/A'}</Badge>}</div>
              <div><Label className="text-[9px] text-slate-500">Recommendation</Label>{isEditing ? <Select value={tryoutForm.recommendation} onValueChange={v => setTryoutForm({...tryoutForm, recommendation: v})}><SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Move up">🔼 Move up</SelectItem><SelectItem value="Keep">✅ Keep</SelectItem><SelectItem value="Move down">🔽 Move down</SelectItem></SelectContent></Select> : <Badge className={`text-[9px] ${tryout?.recommendation === 'Move up' ? 'bg-green-100 text-green-800' : tryout?.recommendation === 'Move down' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{tryout?.recommendation || 'N/A'}</Badge>}</div>
              <div><Label className="text-[9px] text-slate-500">Dominant Foot</Label>{isEditing ? <Select value={tryoutForm.dominant_foot} onValueChange={v => setTryoutForm({...tryoutForm, dominant_foot: v})}><SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Left">Left</SelectItem><SelectItem value="Right">Right</SelectItem><SelectItem value="Both">Both</SelectItem></SelectContent></Select> : <p className="font-medium text-xs">{tryout?.dominant_foot || 'N/A'}</p>}</div>
              <div><Label className="text-[9px] text-slate-500">Secondary Pos</Label>{isEditing ? <Select value={playerForm.secondary_position || ''} onValueChange={v => setPlayerForm({...playerForm, secondary_position: v})}><SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={null}>None</SelectItem>{['GK','Right Outside Back','Left Outside Back','Right Centerback','Left Centerback','Defensive Midfielder','Right Winger','Center Midfielder','Forward','Attacking Midfielder','Left Winger'].map(pos => <SelectItem key={pos} value={pos}>{pos}</SelectItem>)}</SelectContent></Select> : <p className="font-medium text-xs">{player.secondary_position || 'N/A'}</p>}</div>
              <div><Label className="text-[9px] text-slate-500">Next Team</Label>{isEditing ? <ComboboxInput value={tryoutForm.next_year_team} onChange={(val) => setTryoutForm({...tryoutForm, next_year_team: val})} options={existingTeamNames} placeholder="Team" className="text-xs h-7" /> : <p className="font-medium text-xs">{tryout?.next_year_team || 'N/A'}</p>}</div>
              <div><Label className="text-[9px] text-slate-500">Registration</Label>{isEditing ? <Select value={tryoutForm.registration_status} onValueChange={v => setTryoutForm({...tryoutForm, registration_status: v})}><SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Not Signed">Not Signed</SelectItem><SelectItem value="Signed">Signed</SelectItem><SelectItem value="Signed and Paid">Signed & Paid</SelectItem></SelectContent></Select> : <Badge className={`text-[9px] ${tryout?.registration_status === 'Signed and Paid' ? 'bg-green-500 text-white' : 'bg-slate-300'}`}>{tryout?.registration_status || 'N/A'}</Badge>}</div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Physical Assessment - Compact with Radial Chart */}
        <Card className="col-span-12 md:col-span-4 bg-gradient-to-br from-white to-emerald-50 border-none shadow-lg">
          <CardHeader className="pb-2 bg-gradient-to-r from-green-700 to-emerald-700 text-white p-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">💪 Physical</CardTitle>
                {currentAssessment && <p className="text-[9px] text-white/80">{new Date(currentAssessment.assessment_date).toLocaleDateString()}</p>}
              </div>
              {assessments.length > 1 && (
                <div className="flex gap-1">
                  <button onClick={() => setAssessmentIndex(Math.max(0, assessmentIndex - 1))} disabled={assessmentIndex === 0} className="p-0.5 hover:bg-white/20 rounded disabled:opacity-30"><ChevronLeft className="w-3 h-3" /></button>
                  <button onClick={() => setAssessmentIndex(Math.min(assessments.length - 1, assessmentIndex + 1))} disabled={assessmentIndex >= assessments.length - 1} className="p-0.5 hover:bg-white/20 rounded disabled:opacity-30"><ChevronRight className="w-3 h-3" /></button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-3">
            {currentAssessment ? (
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-2 text-center text-[10px] mb-2">
                  <div className="p-1 bg-red-50 rounded"><div className="font-bold text-red-700">{currentAssessment.sprint?.toFixed(2)}s</div><div className="text-slate-500">Sprint</div></div>
                  <div className="p-1 bg-blue-50 rounded"><div className="font-bold text-blue-700">{currentAssessment.vertical}"</div><div className="text-slate-500">Vert</div></div>
                  <div className="p-1 bg-green-50 rounded"><div className="font-bold text-green-700">{currentAssessment.yirt}</div><div className="text-slate-500">YIRT</div></div>
                  <div className="p-1 bg-pink-50 rounded"><div className="font-bold text-pink-700">{currentAssessment.shuttle?.toFixed(2)}s</div><div className="text-slate-500">Shuttle</div></div>
                </div>
                <ResponsiveContainer width="100%" height={140}>
                  <RadialBarChart 
                    cx="50%" 
                    cy="50%" 
                    innerRadius="20%" 
                    outerRadius="90%" 
                    data={[
                      { name: 'Speed', value: currentAssessment.speed_score || 0, fill: '#ef4444' },
                      { name: 'Power', value: currentAssessment.power_score || 0, fill: '#3b82f6' },
                      { name: 'Endurance', value: currentAssessment.endurance_score || 0, fill: '#10b981' },
                      { name: 'Agility', value: currentAssessment.agility_score || 0, fill: '#ec4899' }
                    ]}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar background dataKey="value" cornerRadius={10} />
                    <Tooltip contentStyle={{ fontSize: 10 }} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-4 gap-1 text-[9px] text-center">
                  <div><span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span>Speed</div>
                  <div><span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1"></span>Power</div>
                  <div><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>Endur</div>
                  <div><span className="inline-block w-2 h-2 rounded-full bg-pink-500 mr-1"></span>Agility</div>
                </div>
              </div>
            ) : <p className="text-center text-xs text-slate-500 py-4">No data</p>}
          </CardContent>
        </Card>

        {/* Evaluation */}
        <Card className="col-span-12 md:col-span-5 bg-gradient-to-br from-white to-emerald-50 border-none shadow-lg">
          <CardHeader className="pb-2 bg-gradient-to-r from-green-800 to-emerald-800 text-white p-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">📊 Evaluation</CardTitle>
                {currentEvaluation && <p className="text-[9px] text-white/80">{new Date(currentEvaluation.created_date).toLocaleDateString()}</p>}
              </div>
              <div className="flex gap-1">
                {evaluations.length > 1 && (
                  <>
                    <button onClick={() => setEvaluationIndex(Math.max(0, evaluationIndex - 1))} disabled={evaluationIndex === 0} className="p-0.5 hover:bg-white/20 rounded disabled:opacity-30"><ChevronLeft className="w-3 h-3" /></button>
                    <button onClick={() => setEvaluationIndex(Math.min(evaluations.length - 1, evaluationIndex + 1))} disabled={evaluationIndex >= evaluations.length - 1} className="p-0.5 hover:bg-white/20 rounded disabled:opacity-30"><ChevronRight className="w-3 h-3" /></button>
                  </>
                )}
                <Button size="sm" onClick={() => setShowCreateEvalDialog(true)} className="h-6 px-2 text-[10px] bg-white/20 hover:bg-white/30 text-white border-0"><Plus className="w-3 h-3" /></Button>
                {currentEvaluation && isAdminOrCoach && <Button size="sm" onClick={() => setShowEditEvalDialog(true)} className="h-6 px-2 text-[10px] bg-white/20 hover:bg-white/30 text-white border-0">Edit</Button>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            {currentEvaluation ? (
              <div className="space-y-1.5">
                {['growth_mindset','resilience','athleticism','defending_organized','attacking_organized'].map(key=><SliderBar key={key} label={metricLabels[key]} value={currentEvaluation[key]} color={metricColors[key]}/>)}
                {currentEvaluation.position_role_1_label && (
                  <div className="border-t pt-2 mt-2">
                    <p className="text-[9px] font-semibold text-slate-500 mb-1">Position Roles</p>
                    {[1,2,3,4].map(i => currentEvaluation[`position_role_${i}_label`] && (
                      <SliderBar key={i} label={currentEvaluation[`position_role_${i}_label`]} value={currentEvaluation[`position_role_${i}`]} color="#6366f1" />
                    ))}
                  </div>
                )}
              </div>
            ) : <p className="text-center text-xs py-4">No evaluation</p>}
          </CardContent>
        </Card>

        {/* Radar Chart */}
        {currentEvaluation && <div className="col-span-12 md:col-span-3"><EvaluationRadarChart evaluation={currentEvaluation} /></div>}

        {/* Physical Trend */}
        {assessments.length > 1 && (
        <Card className="col-span-12 md:col-span-6 bg-white border-none shadow-lg">
          <CardHeader className="pb-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white p-3">
            <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4" />Physical Progress</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={physicalTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ fontSize: 10 }} />
                <Legend wrapperStyle={{ fontSize: 9 }} />
                <Line type="monotone" dataKey="Speed" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="Power" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="Endurance" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="Agility" stroke="#ec4899" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        )}

        {/* Evaluation Trend */}
        {evaluations.length > 1 && (
        <Card className="col-span-12 md:col-span-6 bg-white border-none shadow-lg">
          <CardHeader className="pb-2 bg-gradient-to-r from-green-700 to-emerald-700 text-white p-3">
            <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4" />Evaluation Progress</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={evaluationTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ fontSize: 10 }} />
                <Legend wrapperStyle={{ fontSize: 9 }} />
                <Line type="monotone" dataKey="Mental" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="Physical" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="Defending" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="Attacking" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        )}

        {/* Development Pathway */}
        {pathway?.training_modules?.length > 0 && (
        <div className="col-span-12">
          <PlayerDevelopmentDisplay
            player={player}
            pathway={pathway}
            assessments={assessments}
            onUpdatePlayer={(data) => updatePlayerMutation.mutate(data)}
            onUpdatePathway={(data) => updatePathwayMutation.mutate(data)}
            onProvideFeedback={isAdminOrCoach ? (goal) => { setFeedbackGoal(goal); setShowFeedbackDialog(true); } : null}
            isAdminOrCoach={isAdminOrCoach}
          />
        </div>
        )}

        {/* Position Knowledge Bank */}
        {player.primary_position && (
        <div className="col-span-12">
          <PositionKnowledgeBank position={player.primary_position} />
        </div>
        )}

        {/* Injuries */}
        {injuries.length > 0 && (
        <Card className="col-span-12 md:col-span-6 bg-white border-none shadow-lg max-h-[400px] overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">🏥 Injuries</CardTitle>
              {isAdminOrCoach && <Button size="sm" onClick={() => setShowInjuryDialog(true)} variant="ghost" className="h-6 px-2 text-white hover:bg-white/20"><Plus className="w-3 h-3" /></Button>}
            </div>
          </CardHeader>
          <CardContent className="p-3 overflow-y-auto max-h-80">
            <div className="space-y-2">
              {injuries.map(injury => (
                <div key={injury.id} className={`p-2 rounded-lg border ${injury.status === 'Active' ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-bold text-xs">{injury.injury_type}</div>
                      <div className="text-[9px] text-slate-600">{new Date(injury.injury_date).toLocaleDateString()}</div>
                    </div>
                    <Badge className={`text-[8px] ${injury.status === 'Active' ? 'bg-red-500' : 'bg-green-500'}`}>{injury.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        )}

        {/* Documents */}
        {documents.length > 0 && (
        <Card className="col-span-12 md:col-span-6 bg-white border-none shadow-lg max-h-[400px] overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-emerald-700 to-green-700 text-white p-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">📄 Documents</CardTitle>
              {isAdminOrCoach && <Button size="sm" onClick={() => setShowDocumentDialog(true)} variant="ghost" className="h-6 px-2 text-white hover:bg-white/20"><Plus className="w-3 h-3" /></Button>}
            </div>
          </CardHeader>
          <CardContent className="p-3 overflow-y-auto max-h-80">
            <div className="space-y-2">
              {documents.map(doc => (
                <a key={doc.id} href={doc.file_url} target="_blank" rel="noopener noreferrer" className="block p-2 rounded-lg border border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all">
                  <div className="font-semibold text-xs text-blue-600">{doc.title}</div>
                  <div className="text-[9px] text-slate-500">{doc.document_type}</div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
        )}
      </div>

      {/* Dialogs */}
      <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div><Label>Type</Label><Select value={newDocument.document_type} onValueChange={v => setNewDocument({...newDocument, document_type: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Medical Report">Medical Report</SelectItem><SelectItem value="Scouting Note">Scouting Note</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select></div>
            <div><Label>Title</Label><Input value={newDocument.title} onChange={e => setNewDocument({...newDocument, title: e.target.value})} /></div>
            <div><Label>File</Label><Input type="file" onChange={e => setNewDocument({...newDocument, file: e.target.files[0]})} /></div>
            <div className="flex gap-3"><Button variant="outline" onClick={() => setShowDocumentDialog(false)} className="flex-1">Cancel</Button><Button onClick={() => uploadDocumentMutation.mutate(newDocument)} disabled={!newDocument.title || !newDocument.file} className="flex-1 bg-emerald-600">Upload</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showInjuryDialog} onOpenChange={setShowInjuryDialog}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Log New Injury</DialogTitle></DialogHeader><div className="space-y-4 mt-4"><div className="grid grid-cols-2 gap-4"><div><Label>Date *</Label><Input type="date" value={newInjury.injury_date} onChange={e => setNewInjury({...newInjury, injury_date: e.target.value})} /></div><div><Label>Severity</Label><Select value={newInjury.severity} onValueChange={v => setNewInjury({...newInjury, severity: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Minor">Minor</SelectItem><SelectItem value="Moderate">Moderate</SelectItem><SelectItem value="Severe">Severe</SelectItem></SelectContent></Select></div></div><div><Label>Type *</Label><Input value={newInjury.injury_type} onChange={e => setNewInjury({...newInjury, injury_type: e.target.value})} /></div><div><Label>Recovery Date</Label><Input type="date" value={newInjury.recovery_date} onChange={e => setNewInjury({...newInjury, recovery_date: e.target.value})} /></div><div><Label>Treatment Notes</Label><Textarea value={newInjury.treatment_notes} onChange={e => setNewInjury({...newInjury, treatment_notes: e.target.value})} rows={2} /></div><div className="flex gap-3"><Button variant="outline" onClick={() => setShowInjuryDialog(false)} className="flex-1">Cancel</Button><Button onClick={() => createInjuryMutation.mutate(newInjury)} disabled={!newInjury.injury_date || !newInjury.injury_type} className="flex-1 bg-red-600">Log</Button></div></div></DialogContent>
      </Dialog>

      <Dialog open={showEditInjuryDialog} onOpenChange={setShowEditInjuryDialog}>
        <DialogContent><DialogHeader><DialogTitle>Update Injury</DialogTitle></DialogHeader>{editingInjury && <div className="space-y-4 mt-4"><div className="grid grid-cols-2 gap-4"><div><Label>Status</Label><Select value={editingInjury.status} onValueChange={v => setEditingInjury({...editingInjury, status: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Recovering">Recovering</SelectItem><SelectItem value="Recovered">Recovered</SelectItem></SelectContent></Select></div><div><Label>Recovery Date</Label><Input type="date" value={editingInjury.recovery_date || ''} onChange={e => setEditingInjury({...editingInjury, recovery_date: e.target.value})} /></div></div><div><Label>Notes</Label><Textarea value={editingInjury.treatment_notes || ''} onChange={e => setEditingInjury({...editingInjury, treatment_notes: e.target.value})} rows={2} /></div><div className="flex gap-3"><Button variant="outline" onClick={() => setShowEditInjuryDialog(false)} className="flex-1">Cancel</Button><Button onClick={() => updateInjuryMutation.mutate({ id: editingInjury.id, data: editingInjury })} className="flex-1 bg-emerald-600">Update</Button></div></div>}</DialogContent>
      </Dialog>

      <SharePlayerDialog open={showShareDialog} onClose={() => setShowShareDialog(false)} player={player} onInvite={() => {}} />
      <GoalFeedbackDialog open={showFeedbackDialog} onClose={() => { setShowFeedbackDialog(false); setFeedbackGoal(null); }} goal={feedbackGoal} player={player} onSendFeedback={handleSendGoalFeedback} />
      <CreateEvaluationDialog open={showCreateEvalDialog} onClose={() => setShowCreateEvalDialog(false)} player={player} />
      <EditEvaluationDialog open={showEditEvalDialog} onClose={() => setShowEditEvalDialog(false)} evaluation={currentEvaluation} player={player} />
      <AddParentDialog open={showAddParentDialog} onClose={() => setShowAddParentDialog(false)} player={player} />
    </div>
  );
}