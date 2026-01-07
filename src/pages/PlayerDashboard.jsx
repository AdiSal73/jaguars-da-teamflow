import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, User, TrendingUp, ChevronLeft, ChevronRight, Target, Activity, Award, Save, Edit, Plus, MessageSquare, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, RadialBarChart, RadialBar, Legend } from 'recharts';
import PositionKnowledgeBank from '../components/player/PositionKnowledgeBank';
import PlayerDevelopmentDisplay from '../components/player/PlayerDevelopmentDisplay';
import EditPlayerInfoDialog from '../components/player/EditPlayerInfoDialog';
import EditTryoutDialog from '../components/player/EditTryoutDialog';
import CreateAssessmentDialog from '../components/player/CreateAssessmentDialog';
import CreateEvaluationDialog from '../components/evaluation/CreateEvaluationDialog';
import AddParentDialog from '../components/player/AddParentDialog';
import EditPhysicalAssessmentDialog from '../components/player/EditPhysicalAssessmentDialog';
import EditEvaluationDialog from '../components/player/EditEvaluationDialog';
import UpcomingBookings from '../components/player/UpcomingBookings';

export default function PlayerDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const playerId = urlParams.get('id');

  const [assessmentIndex, setAssessmentIndex] = useState(0);
  const [evaluationIndex, setEvaluationIndex] = useState(0);
  const [showEditInfoDialog, setShowEditInfoDialog] = useState(false);
  const [showEditTryoutDialog, setShowEditTryoutDialog] = useState(false);
  const [showCreateAssessmentDialog, setShowCreateAssessmentDialog] = useState(false);
  const [showCreateEvaluationDialog, setShowCreateEvaluationDialog] = useState(false);
  const [showAddParentDialog, setShowAddParentDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [showEditAssessmentDialog, setShowEditAssessmentDialog] = useState(false);
  const [showEditEvaluationDialog, setShowEditEvaluationDialog] = useState(false);
  const [showAddIDPMeetingDialog, setShowAddIDPMeetingDialog] = useState(false);
  const [idpMeetingForm, setIdpMeetingForm] = useState({
    meeting_date: new Date().toISOString().split('T')[0],
    meeting_time: '10:00',
    location: '',
    notes: '',
    coach_id: ''
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!playerId
  });

  const { data: allPlayers = [] } = useQuery({
    queryKey: ['allPlayers'],
    queryFn: () => base44.entities.Player.list(),
    enabled: !!playerId
  });

  const { data: player, isLoading: playerLoading } = useQuery({
    queryKey: ['player', playerId],
    queryFn: async () => {
      if (!playerId) return null;
      const players = await base44.entities.Player.filter({ id: playerId });
      return players[0];
    },
    enabled: !!playerId
  });

  const { data: playerProgress } = useQuery({
    queryKey: ['playerProgress', playerId],
    queryFn: async () => {
      const progress = await base44.entities.PlayerProgress.filter({ player_id: playerId });
      return progress[0] || null;
    },
    enabled: !!playerId
  });

  const isAdminOrCoach = currentUser?.role === 'admin' || currentUser?.role === 'director' || coaches.some(c => c.email === currentUser?.email);
  
  // Get all parent info - both registered users and emails from player record
  const allParentInfo = React.useMemo(() => {
    if (!player || !allPlayers || !users) return [];
    
    const parentMap = new Map();
    
    // Add registered users who have this player in their player_ids
    users.filter(u => u.player_ids?.includes(playerId)).forEach(user => {
      parentMap.set(user.email, {
        name: user.full_name || user.email,
        email: user.email,
        phone: user.phone || 'N/A',
        isRegistered: true,
        userId: user.id
      });
    });
    
    // Add parent_emails from player record (if not already registered)
    (player.parent_emails || []).forEach(email => {
      if (!parentMap.has(email)) {
        const playerWithInfo = allPlayers.find(p => (p.parent_emails || []).includes(email));
        parentMap.set(email, {
          name: playerWithInfo?.parent_name || email,
          email: email,
          phone: playerWithInfo?.phone || 'N/A',
          isRegistered: false
        });
      }
    });
    
    // Legacy: Check player.email field
    if (player.email && !parentMap.has(player.email)) {
      parentMap.set(player.email, {
        name: player.parent_name || player.email,
        email: player.email,
        phone: player.phone || 'N/A',
        isRegistered: users.some(u => u.email === player.email)
      });
    }
    
    return Array.from(parentMap.values());
  }, [player, users, playerId, allPlayers]);

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

  const { data: pathway } = useQuery({
    queryKey: ['pathway', playerId],
    queryFn: async () => {
      const pathways = await base44.entities.DevelopmentPathway.filter({ player_id: playerId });
      return pathways[0] || null;
    },
    enabled: !!playerId
  });

  const { data: idpMeetings = [] } = useQuery({
    queryKey: ['idpMeetings', playerId],
    queryFn: () => base44.entities.IDPMeeting.filter({ player_id: playerId }, '-meeting_date'),
    enabled: !!playerId
  });

  const updatePlayerMutation = useMutation({
    mutationFn: (data) => base44.entities.Player.update(playerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['player', playerId]);
      setShowEditInfoDialog(false);
      toast.success('Player updated');
    }
  });

  const updatePathwayMutation = useMutation({
    mutationFn: async (data) => {
      if (pathway?.id) {
        return base44.entities.DevelopmentPathway.update(pathway.id, data);
      } else {
        return base44.entities.DevelopmentPathway.create({
          player_id: playerId,
          position: player?.primary_position || 'Unknown',
          ...data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pathway', playerId]);
    }
  });

  const saveTryoutMutation = useMutation({
    mutationFn: ({ id, data }) => {
      if (id) {
        return base44.entities.PlayerTryout.update(id, data);
      } else {
        return base44.entities.PlayerTryout.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tryout', playerId]);
      setShowEditTryoutDialog(false);
      toast.success('Tryout info saved');
    }
  });

  const createAssessmentMutation = useMutation({
    mutationFn: (data) => base44.entities.PhysicalAssessment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['assessments', playerId]);
      setShowCreateAssessmentDialog(false);
      toast.success('Assessment created');
    }
  });

  const updateAssessmentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PhysicalAssessment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['assessments', playerId]);
      setShowEditAssessmentDialog(false);
      toast.success('Assessment updated');
    }
  });

  const updateEvaluationMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Evaluation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['evaluations', playerId]);
      setShowEditEvaluationDialog(false);
      toast.success('Evaluation updated');
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message) => {
      const recipientEmails = new Set();
      if (player.player_email) recipientEmails.add(player.player_email);
      allParentInfo.forEach(parent => recipientEmails.add(parent.email));

      for (const email of Array.from(recipientEmails)) {
        const parent = allParentInfo.find(p => p.email === email);
        const recipientName = parent ? parent.name : player.full_name;

        await base44.entities.Message.create({
          sender_email: currentUser.email,
          sender_name: currentUser.full_name,
          recipient_email: email,
          recipient_name: recipientName,
          subject: `Message about ${player.full_name} from ${currentUser.full_name}`,
          content: message
        });
      }
    },
    onSuccess: () => {
      setShowMessageDialog(false);
      setMessageContent('');
      toast.success('Message sent to player and parents');
    }
  });

  const createIDPMeetingMutation = useMutation({
    mutationFn: (data) => base44.entities.IDPMeeting.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['idpMeetings', playerId]);
      setShowAddIDPMeetingDialog(false);
      setIdpMeetingForm({
        meeting_date: new Date().toISOString().split('T')[0],
        meeting_time: '10:00',
        location: '',
        notes: '',
        coach_id: ''
      });
      toast.success('IDP Meeting recorded');
    }
  });

  const currentAssessment = assessments[assessmentIndex] || null;
  const currentEvaluation = evaluations[evaluationIndex] || null;
  const team = teams.find(t => t.id === player?.team_id);

  const radarData = currentEvaluation ? [
    { attribute: 'Growth Mindset', value: currentEvaluation.growth_mindset || 0 },
    { attribute: 'Resilience', value: currentEvaluation.resilience || 0 },
    { attribute: 'Athleticism', value: currentEvaluation.athleticism || 0 },
    { attribute: 'Def. Organized', value: currentEvaluation.defending_organized || 0 },
    { attribute: 'Att. Organized', value: currentEvaluation.attacking_organized || 0 }
  ] : [];

  if (!playerId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center text-white">
          <p className="text-lg mb-4">No player selected</p>
          <Button onClick={() => navigate(-1)} className="bg-emerald-600">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (playerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center text-white">
          <p className="text-lg mb-4">Player not found</p>
          <Button onClick={() => navigate(-1)} className="bg-emerald-600">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600/20 to-blue-600/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <Button onClick={() => navigate(-1)} variant="ghost" className="text-white hover:bg-white/10 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2 flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-4xl sm:text-5xl font-bold shadow-2xl flex-shrink-0">
                {player.jersey_number || player.full_name?.charAt(0)}
              </div>
              
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">{player.full_name}</h1>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3">
                  <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">{player.primary_position}</Badge>
                  <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">{team?.name || 'No Team'}</Badge>
                  {player.jersey_number && <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30">#{player.jersey_number}</Badge>}
                </div>
                {isAdminOrCoach && (
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => setShowEditInfoDialog(true)} size="sm" className="bg-white/20 hover:bg-white/30 text-white text-xs sm:text-sm">
                      <Edit className="w-3 h-3 sm:mr-1" /><span className="hidden sm:inline">Edit Info</span>
                    </Button>
                    <Button onClick={() => setShowMessageDialog(true)} size="sm" className="bg-white/20 hover:bg-white/30 text-white text-xs sm:text-sm">
                      <MessageSquare className="w-3 h-3 sm:mr-1" /><span className="hidden sm:inline">Message</span>
                    </Button>
                    <Button onClick={() => setShowAddParentDialog(true)} size="sm" className="bg-white/20 hover:bg-white/30 text-white text-xs sm:text-sm">
                      <UserPlus className="w-3 h-3 sm:mr-1" /><span className="hidden sm:inline">Add Parent</span>
                    </Button>
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 mt-4">
                  <div className="bg-white/5 rounded-lg p-2 sm:p-3 border border-white/10">
                    <div className="text-xs text-slate-400">DOB</div>
                    <div className="font-bold text-sm sm:text-base">{player.date_of_birth ? moment(player.date_of_birth, ["MM/DD/YYYY", "YYYY-MM-DD"]).format('MM/DD/YYYY') : 'N/A'}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 sm:p-3 border border-white/10">
                    <div className="text-xs text-slate-400">Age Group</div>
                    <Badge className="bg-purple-500 text-white text-sm px-2 py-1 font-bold">{player.age_group || 'N/A'}</Badge>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 sm:p-3 border border-white/10">
                    <div className="text-xs text-slate-400">Position</div>
                    <div className="font-bold text-sm sm:text-base">{player.primary_position}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 sm:p-3 border border-white/10">
                    <div className="text-xs text-slate-400">Team</div>
                    <div className="font-bold text-xs sm:text-sm">{team?.name || 'N/A'}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 sm:p-3 border border-white/10">
                    <div className="text-xs text-slate-400">Status</div>
                    <Badge className={`${player.status === 'Active' ? 'bg-green-500' : 'bg-red-500'} text-xs`}>{player.status || 'Active'}</Badge>
                  </div>
                  </div>
                {allParentInfo.length > 0 && (
                  <div className="mt-4 bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="text-xs text-slate-400 mb-3 font-semibold">Parent Contacts</div>
                    <div className="space-y-2">
                      {allParentInfo.map((parent, idx) => (
                        <div key={idx} className="bg-white/5 rounded-lg p-2 flex items-start justify-between border border-white/5">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">{parent.name}</span>
                              {parent.isRegistered && (
                                <Badge className="bg-green-500/20 text-green-300 border border-green-500/30 text-xs">
                                  ✓ Registered
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 mt-1">{parent.email}</div>
                            <div className="text-xs text-slate-400">{parent.phone}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Bookings */}
            <div>
              <UpcomingBookings playerId={playerId} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Physical Stats */}
          {currentAssessment ? (
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-400" />
                    Physical
                  </h3>
                  <div className="flex gap-1">
                    {isAdminOrCoach && (
                      <>
                        <button onClick={() => setShowCreateAssessmentDialog(true)} className="p-1 hover:bg-white/10 rounded text-emerald-400">
                          <Plus className="w-4 h-4" />
                        </button>
                        <button onClick={() => setShowEditAssessmentDialog(true)} className="p-1 hover:bg-white/10 rounded text-blue-400">
                          <Edit className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {assessments.length > 1 && (
                      <>
                        <button onClick={() => setAssessmentIndex(Math.max(0, assessmentIndex - 1))} disabled={assessmentIndex === 0} className="p-1 hover:bg-white/10 rounded disabled:opacity-30 text-white">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button onClick={() => setAssessmentIndex(Math.min(assessments.length - 1, assessmentIndex + 1))} disabled={assessmentIndex >= assessments.length - 1} className="p-1 hover:bg-white/10 rounded disabled:opacity-30 text-white">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-400 mb-4">{new Date(currentAssessment.assessment_date).toLocaleDateString()}</p>
                
                <div className="mb-4 text-center">
                  <div className="text-5xl font-bold text-emerald-400">{currentAssessment.overall_score || 0}</div>
                  <div className="text-xs text-slate-400">OVERALL SCORE</div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/30">
                    <div className="text-xs text-red-400">Sprint</div>
                    <div className="text-2xl font-bold text-red-400">{currentAssessment.sprint?.toFixed(2)}s</div>
                  </div>
                  <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/30">
                    <div className="text-xs text-blue-400">Vertical</div>
                    <div className="text-2xl font-bold text-blue-400">{currentAssessment.vertical}"</div>
                  </div>
                  <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/30">
                    <div className="text-xs text-green-400">YIRT</div>
                    <div className="text-2xl font-bold text-green-400">{currentAssessment.yirt}</div>
                  </div>
                  <div className="bg-pink-500/10 rounded-lg p-3 border border-pink-500/30">
                    <div className="text-xs text-pink-400">Shuttle</div>
                    <div className="text-2xl font-bold text-pink-400">{currentAssessment.shuttle?.toFixed(2)}s</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Speed</span>
                    <span className="text-red-400 font-bold">{currentAssessment.speed_score || 0}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${currentAssessment.speed_score || 0}%` }}></div>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Power</span>
                    <span className="text-blue-400 font-bold">{currentAssessment.power_score || 0}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${currentAssessment.power_score || 0}%` }}></div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Endurance</span>
                    <span className="text-green-400 font-bold">{currentAssessment.endurance_score || 0}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${currentAssessment.endurance_score || 0}%` }}></div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Agility</span>
                    <span className="text-pink-400 font-bold">{currentAssessment.agility_score || 0}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-pink-500 rounded-full transition-all" style={{ width: `${currentAssessment.agility_score || 0}%` }}></div>
                  </div>
                </div>

                {/* Apple Watch Style Radial Chart */}
                <div className="mt-6 pt-6 border-t border-slate-700">
                  <h4 className="text-sm font-semibold text-white mb-4 text-center">Performance Overview</h4>
                  <div className="flex justify-center items-center" style={{ height: 220 }}>
                    <div className="relative" style={{ width: 180, height: 180 }}>
                      {/* Speed Ring - Outermost */}
                      <svg className="absolute inset-0" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="90" cy="90" r="82" fill="none" stroke="#1e293b" strokeWidth="12" opacity="0.3" />
                        <circle 
                          cx="90" cy="90" r="82" 
                          fill="none" 
                          stroke="#ef4444" 
                          strokeWidth="12" 
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 82 * (currentAssessment.speed_score || 0) / 100} ${2 * Math.PI * 82}`}
                        />
                      </svg>
                      {/* Power Ring */}
                      <svg className="absolute inset-0" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="90" cy="90" r="65" fill="none" stroke="#1e293b" strokeWidth="12" opacity="0.3" />
                        <circle 
                          cx="90" cy="90" r="65" 
                          fill="none" 
                          stroke="#3b82f6" 
                          strokeWidth="12" 
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 65 * (currentAssessment.power_score || 0) / 100} ${2 * Math.PI * 65}`}
                        />
                      </svg>
                      {/* Endurance Ring */}
                      <svg className="absolute inset-0" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="90" cy="90" r="48" fill="none" stroke="#1e293b" strokeWidth="12" opacity="0.3" />
                        <circle 
                          cx="90" cy="90" r="48" 
                          fill="none" 
                          stroke="#10b981" 
                          strokeWidth="12" 
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 48 * (currentAssessment.endurance_score || 0) / 100} ${2 * Math.PI * 48}`}
                        />
                      </svg>
                      {/* Agility Ring - Innermost */}
                      <svg className="absolute inset-0" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="90" cy="90" r="31" fill="none" stroke="#1e293b" strokeWidth="12" opacity="0.3" />
                        <circle 
                          cx="90" cy="90" r="31" 
                          fill="none" 
                          stroke="#ec4899" 
                          strokeWidth="12" 
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 31 * (currentAssessment.agility_score || 0) / 100} ${2 * Math.PI * 31}`}
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-slate-300">Speed {currentAssessment.speed_score}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-slate-300">Power {currentAssessment.power_score}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-slate-300">Endurance {currentAssessment.endurance_score}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                      <span className="text-slate-300">Agility {currentAssessment.agility_score}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : isAdminOrCoach && (
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md">
              <CardContent className="p-6 text-center">
                <p className="text-slate-400 mb-3">No physical assessment yet</p>
                <Button onClick={() => setShowCreateAssessmentDialog(true)} size="sm" className="bg-emerald-600">
                  <Plus className="w-4 h-4 mr-2" />Create Assessment
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Evaluation Radar */}
          {currentEvaluation ? (
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md lg:col-span-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-emerald-400" />
                    Evaluation
                  </h3>
                  <div className="flex gap-1">
                    {isAdminOrCoach && (
                      <>
                        <button onClick={() => setShowCreateEvaluationDialog(true)} className="p-1 hover:bg-white/10 rounded text-emerald-400">
                          <Plus className="w-4 h-4" />
                        </button>
                        <button onClick={() => setShowEditEvaluationDialog(true)} className="p-1 hover:bg-white/10 rounded text-blue-400">
                          <Edit className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {evaluations.length > 1 && (
                      <>
                        <button onClick={() => setEvaluationIndex(Math.max(0, evaluationIndex - 1))} disabled={evaluationIndex === 0} className="p-1 hover:bg-white/10 rounded disabled:opacity-30 text-white">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEvaluationIndex(Math.min(evaluations.length - 1, evaluationIndex + 1))} disabled={evaluationIndex >= evaluations.length - 1} className="p-1 hover:bg-white/10 rounded disabled:opacity-30 text-white">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-400 mb-4">{new Date(currentEvaluation.created_date).toLocaleDateString()}</p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-center mb-4">
                      <div className="text-4xl font-bold text-emerald-400">{currentEvaluation.overall_score?.toFixed(1) || 'N/A'}</div>
                      <div className="text-xs text-slate-400">OVERALL SCORE</div>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#475569" />
                        <PolarAngleAxis dataKey="attribute" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <Radar name="Score" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2">
                    {[
                      { label: 'Growth Mindset', value: currentEvaluation.growth_mindset, color: 'purple' },
                      { label: 'Resilience', value: currentEvaluation.resilience, color: 'pink' },
                      { label: 'Efficiency', value: currentEvaluation.efficiency_in_execution, color: 'orange' },
                      { label: 'Athleticism', value: currentEvaluation.athleticism, color: 'emerald' },
                      { label: 'Team Focus', value: currentEvaluation.team_focus, color: 'blue' },
                      { label: 'Def. Organized', value: currentEvaluation.defending_organized, color: 'red' },
                      { label: 'Def. Final Third', value: currentEvaluation.defending_final_third, color: 'red' },
                      { label: 'Att. Organized', value: currentEvaluation.attacking_organized, color: 'blue' },
                      { label: 'Att. Final Third', value: currentEvaluation.attacking_final_third, color: 'blue' }
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-300">{item.label}</span>
                          <span className={`text-${item.color}-400 font-bold`}>{item.value || 0}/10</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div className={`h-full bg-${item.color}-500 rounded-full transition-all`} style={{ width: `${(item.value || 0) * 10}%` }}></div>
                        </div>
                      </div>
                    ))}

                    {/* Position Roles */}
                    {currentEvaluation.position_role_1_label && (
                      <div className="pt-3 mt-3 border-t border-slate-700">
                        <div className="text-xs text-slate-400 mb-2">Position Roles</div>
                        {[1,2,3,4].map(i => currentEvaluation[`position_role_${i}_label`] && (
                          <div key={i} className="mb-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-slate-300">{currentEvaluation[`position_role_${i}_label`]}</span>
                              <span className="text-indigo-400 font-bold">{currentEvaluation[`position_role_${i}`] || 0}/10</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${(currentEvaluation[`position_role_${i}`] || 0) * 10}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {(currentEvaluation.player_strengths || currentEvaluation.areas_of_growth || currentEvaluation.training_focus) && (
                  <div className="grid md:grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-700">
                    {currentEvaluation.player_strengths && (
                      <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/30">
                        <div className="text-xs text-emerald-400 font-semibold mb-2">💪 STRENGTHS</div>
                        <p className="text-xs text-slate-300 leading-relaxed">{currentEvaluation.player_strengths}</p>
                      </div>
                    )}
                    {currentEvaluation.areas_of_growth && (
                      <div className="bg-orange-500/10 rounded-lg p-3 border border-orange-500/30">
                        <div className="text-xs text-orange-400 font-semibold mb-2">📈 AREAS OF GROWTH</div>
                        <p className="text-xs text-slate-300 leading-relaxed">{currentEvaluation.areas_of_growth}</p>
                      </div>
                    )}
                    {currentEvaluation.training_focus && (
                      <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/30">
                        <div className="text-xs text-blue-400 font-semibold mb-2">🎯 TRAINING FOCUS</div>
                        <p className="text-xs text-slate-300 leading-relaxed">{currentEvaluation.training_focus}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : isAdminOrCoach && (
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md lg:col-span-2">
              <CardContent className="p-6 text-center">
                <p className="text-slate-400 mb-3">No evaluation yet</p>
                <Button onClick={() => setShowCreateEvaluationDialog(true)} size="sm" className="bg-emerald-600">
                  <Plus className="w-4 h-4 mr-2" />Create Evaluation
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Development Pathway - Show when evaluation exists */}
        {evaluations.length > 0 && (
          <div className="mt-6">
            <PlayerDevelopmentDisplay
              player={player}
              pathway={pathway}
              assessments={assessments}
              evaluations={evaluations}
              onUpdatePlayer={(data) => updatePlayerMutation.mutate(data)}
              onUpdatePathway={(data) => updatePathwayMutation.mutate(data)}
              isAdminOrCoach={isAdminOrCoach}
            />
          </div>
        )}

        {/* IDP Meetings */}
        {isAdminOrCoach && (
          <Card className="mt-6 bg-slate-800/30 border-slate-700/50 backdrop-blur-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-400" />
                  IDP Meetings
                </h3>
                <Button onClick={() => setShowAddIDPMeetingDialog(true)} size="sm" className="bg-emerald-600">
                  <Plus className="w-4 h-4 mr-1" />Add Meeting
                </Button>
              </div>
              {idpMeetings.length === 0 ? (
                <p className="text-slate-400 text-sm">No IDP meetings recorded yet</p>
              ) : (
                <div className="space-y-3">
                  {idpMeetings.map(meeting => {
                    const meetingCoach = coaches.find(c => c.id === meeting.coach_id);
                    return (
                      <div key={meeting.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-white">{new Date(meeting.meeting_date).toLocaleDateString()}</p>
                            <p className="text-sm text-slate-400">Coach: {meetingCoach?.full_name || meeting.coach_name}</p>
                          </div>
                          <p className="text-xs text-slate-400">{meeting.meeting_time}</p>
                        </div>
                        {meeting.location && <p className="text-xs text-slate-400 mb-2">📍 {meeting.location}</p>}
                        {meeting.notes && <p className="text-sm text-slate-300 bg-white/5 p-2 rounded mt-2">{meeting.notes}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Position Knowledge Bank */}
        {player.primary_position && (
          <div className="mt-6">
            <PositionKnowledgeBank position={player.primary_position} />
          </div>
        )}

        {/* Tryout Info Footer - Admin/Coach Only */}
        {isAdminOrCoach && (
          <Card className="mt-6 bg-slate-800/30 border-slate-700/50 backdrop-blur-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3 justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-400" />
                  <h3 className="text-sm font-bold text-white">Tryout Information (Admin/Coach Only)</h3>
                </div>
                <Button onClick={() => setShowEditTryoutDialog(true)} size="sm" variant="ghost" className="text-white hover:bg-white/10">
                  <Edit className="w-3 h-3 mr-1" />Edit
                </Button>
              </div>
              {tryout ? (
              <div className="grid grid-cols-6 gap-4 text-sm">
                <div>
                  <div className="text-xs text-slate-400">Role</div>
                  <Badge className="mt-1 text-xs">{tryout.team_role || 'N/A'}</Badge>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Recommendation</div>
                  <Badge className={`mt-1 text-xs ${tryout.recommendation === 'Move up' ? 'bg-green-500' : tryout.recommendation === 'Move down' ? 'bg-red-500' : 'bg-blue-500'}`}>
                    {tryout.recommendation || 'N/A'}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Dominant Foot</div>
                  <div className="text-white mt-1">{tryout.dominant_foot || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Next Team</div>
                  <div className="text-white mt-1 text-xs">{tryout.next_year_team || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Status</div>
                  <Badge className={`mt-1 text-xs ${tryout.next_season_status === 'Accepted Offer' ? 'bg-green-500' : 'bg-slate-500'}`}>
                    {tryout.next_season_status || 'N/A'}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Registration</div>
                  <Badge className={`mt-1 text-xs ${tryout.registration_status === 'Signed and Paid' ? 'bg-green-500' : 'bg-slate-500'}`}>
                    {tryout.registration_status || 'N/A'}
                  </Badge>
                </div>
              </div>
              ) : (
                <p className="text-slate-400 text-sm">No tryout information yet</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Dialogs */}
        {showEditInfoDialog && (
          <EditPlayerInfoDialog
            open={showEditInfoDialog}
            onClose={() => setShowEditInfoDialog(false)}
            player={player}
            teams={teams}
            onSave={(data) => updatePlayerMutation.mutate(data)}
          />
        )}

        {showEditTryoutDialog && (
          <EditTryoutDialog
            open={showEditTryoutDialog}
            onClose={() => setShowEditTryoutDialog(false)}
            tryout={tryout}
            playerId={playerId}
            playerName={player.full_name}
            onSave={(id, data) => saveTryoutMutation.mutate({ id, data })}
          />
        )}

        {showCreateAssessmentDialog && (
          <CreateAssessmentDialog
            open={showCreateAssessmentDialog}
            onClose={() => setShowCreateAssessmentDialog(false)}
            playerId={playerId}
            playerName={player.full_name}
            teamId={player.team_id}
            onSave={(data) => createAssessmentMutation.mutate(data)}
          />
        )}

        {showCreateEvaluationDialog && (
          <CreateEvaluationDialog
            open={showCreateEvaluationDialog}
            onClose={() => setShowCreateEvaluationDialog(false)}
            player={player}
            team={team}
          />
        )}

        {showAddParentDialog && (
          <AddParentDialog
            open={showAddParentDialog}
            onClose={() => setShowAddParentDialog(false)}
            player={player}
          />
        )}

        {showEditAssessmentDialog && currentAssessment && (
          <EditPhysicalAssessmentDialog
            open={showEditAssessmentDialog}
            onClose={() => setShowEditAssessmentDialog(false)}
            assessment={currentAssessment}
            onSave={(id, data) => updateAssessmentMutation.mutate({ id, data })}
            isPending={updateAssessmentMutation.isPending}
          />
        )}

        {showEditEvaluationDialog && currentEvaluation && (
          <EditEvaluationDialog
            open={showEditEvaluationDialog}
            onClose={() => setShowEditEvaluationDialog(false)}
            evaluation={currentEvaluation}
            onSave={(id, data) => updateEvaluationMutation.mutate({ id, data })}
            isPending={updateEvaluationMutation.isPending}
          />
        )}

        {/* Message Dialog */}
        {showMessageDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-lg w-full bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Message {player.full_name}</CardTitle>
                <p className="text-xs text-slate-400">Message will be sent to player and all parents</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  rows={6}
                  className="w-full p-3 rounded-lg bg-slate-700 text-white border border-slate-600"
                  placeholder="Type your message..."
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowMessageDialog(false)}>Cancel</Button>
                  <Button onClick={() => sendMessageMutation.mutate(messageContent)} disabled={!messageContent} className="bg-emerald-600">
                    <MessageSquare className="w-4 h-4 mr-2" />Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add IDP Meeting Dialog */}
        {showAddIDPMeetingDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-lg w-full bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Record IDP Meeting</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-slate-300">Date</Label>
                    <Input 
                      type="date" 
                      value={idpMeetingForm.meeting_date} 
                      onChange={e => setIdpMeetingForm({...idpMeetingForm, meeting_date: e.target.value})}
                      className="bg-slate-700 text-white border-slate-600"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Time</Label>
                    <Input 
                      type="time" 
                      value={idpMeetingForm.meeting_time} 
                      onChange={e => setIdpMeetingForm({...idpMeetingForm, meeting_time: e.target.value})}
                      className="bg-slate-700 text-white border-slate-600"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-slate-300">Coach</Label>
                  <Select value={idpMeetingForm.coach_id} onValueChange={v => setIdpMeetingForm({...idpMeetingForm, coach_id: v})}>
                    <SelectTrigger className="bg-slate-700 text-white border-slate-600">
                      <SelectValue placeholder="Select coach" />
                    </SelectTrigger>
                    <SelectContent>
                      {coaches.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">Location</Label>
                  <Input 
                    value={idpMeetingForm.location} 
                    onChange={e => setIdpMeetingForm({...idpMeetingForm, location: e.target.value})}
                    placeholder="Meeting location"
                    className="bg-slate-700 text-white border-slate-600"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Notes</Label>
                  <Textarea 
                    value={idpMeetingForm.notes} 
                    onChange={e => setIdpMeetingForm({...idpMeetingForm, notes: e.target.value})}
                    rows={4}
                    placeholder="Meeting notes and outcomes..."
                    className="bg-slate-700 text-white border-slate-600"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddIDPMeetingDialog(false)}>Cancel</Button>
                  <Button 
                    onClick={() => {
                      const selectedCoach = coaches.find(c => c.id === idpMeetingForm.coach_id);
                      createIDPMeetingMutation.mutate({
                        player_id: playerId,
                        player_name: player.full_name,
                        coach_id: idpMeetingForm.coach_id,
                        coach_name: selectedCoach?.full_name,
                        meeting_date: idpMeetingForm.meeting_date,
                        meeting_time: idpMeetingForm.meeting_time,
                        location: idpMeetingForm.location,
                        notes: idpMeetingForm.notes
                      });
                    }} 
                    disabled={!idpMeetingForm.coach_id}
                    className="bg-emerald-600"
                  >
                    <Save className="w-4 h-4 mr-2" />Save Meeting
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}