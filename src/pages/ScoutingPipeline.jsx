import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, User, ExternalLink, Video, FileText, Bell } from 'lucide-react';
import { toast } from 'sonner';

const PIPELINE_STAGES = [
  { id: 'New Lead', label: 'New Leads', color: 'from-slate-600 to-slate-700', bgColor: 'bg-slate-50' },
  { id: 'Under Evaluation', label: 'Under Evaluation', color: 'from-blue-600 to-blue-700', bgColor: 'bg-blue-50' },
  { id: 'Invited to Tryout', label: 'Invited to Tryout', color: 'from-purple-600 to-purple-700', bgColor: 'bg-purple-50' },
  { id: 'Offered Spot', label: 'Offered Spot', color: 'from-orange-600 to-orange-700', bgColor: 'bg-orange-50' },
  { id: 'Recruited', label: 'Recruited', color: 'from-emerald-600 to-emerald-700', bgColor: 'bg-emerald-50' }
];

export default function ScoutingPipeline() {
  const queryClient = useQueryClient();
  const [showPlayerDialog, setShowPlayerDialog] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const [playerForm, setPlayerForm] = useState({
    full_name: '', email: '', phone: '', parent_name: '', parent_email: '', parent_phone: '',
    date_of_birth: '', grad_year: '', primary_position: '', secondary_position: '',
    current_club: '', current_team: '', scouting_recommendation: '', scouting_note: '',
    pipeline_stage: 'New Lead', notes: '', video_links: [], scouting_reports: []
  });

  const { data: scoutedPlayers = [] } = useQuery({
    queryKey: ['scoutedPlayers'],
    queryFn: () => base44.entities.ScoutedPlayer.list()
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const createPlayerMutation = useMutation({
    mutationFn: (data) => base44.entities.ScoutedPlayer.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['scoutedPlayers']);
      setShowPlayerDialog(false);
      resetForm();
      toast.success('Player added to pipeline');
    }
  });

  const updatePlayerMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ScoutedPlayer.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['scoutedPlayers']);
      setShowPlayerDialog(false);
      setShowDetailsDialog(false);
      setEditingPlayer(null);
      resetForm();
      toast.success('Player updated');
    }
  });

  const deletePlayerMutation = useMutation({
    mutationFn: (id) => base44.entities.ScoutedPlayer.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['scoutedPlayers']);
      setShowDetailsDialog(false);
      toast.success('Player deleted');
    }
  });

  const movePlayerMutation = useMutation({
    mutationFn: async ({ playerId, newStage, oldStage }) => {
      await base44.entities.ScoutedPlayer.update(playerId, { pipeline_stage: newStage });
      
      // Create notification for stage change
      const player = scoutedPlayers.find(p => p.id === playerId);
      if (player?.parent_email) {
        await base44.entities.Notification.create({
          user_email: player.parent_email,
          type: 'announcement',
          title: 'Scouting Status Update',
          message: `${player.full_name} has been moved to: ${newStage}`,
          priority: 'high'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['scoutedPlayers']);
      toast.success('Player moved');
    }
  });

  const calculateGradYear = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const birthDate = new Date(dateOfBirth);
    const birthYear = birthDate.getFullYear();
    const birthMonth = birthDate.getMonth();
    return birthMonth < 8 ? birthYear + 18 : birthYear + 19;
  };

  const resetForm = () => {
    setPlayerForm({
      full_name: '', email: '', phone: '', parent_name: '', parent_email: '', parent_phone: '',
      date_of_birth: '', grad_year: '', primary_position: '', secondary_position: '',
      current_club: '', current_team: '', scouting_recommendation: '', scouting_note: '',
      pipeline_stage: 'New Lead', notes: '', video_links: [], scouting_reports: []
    });
  };

  const handleEdit = (player) => {
    setEditingPlayer(player);
    setPlayerForm(player);
    setShowPlayerDialog(true);
  };

  const handleSave = () => {
    const data = {
      ...playerForm,
      grad_year: playerForm.grad_year || calculateGradYear(playerForm.date_of_birth)
    };
    if (editingPlayer) {
      updatePlayerMutation.mutate({ id: editingPlayer.id, data });
    } else {
      createPlayerMutation.mutate(data);
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const playerId = result.draggableId;
    const oldStage = result.source.droppableId;
    const newStage = result.destination.droppableId;
    
    if (oldStage !== newStage) {
      movePlayerMutation.mutate({ playerId, newStage, oldStage });
    }
  };

  const addVideoLink = () => {
    setPlayerForm({
      ...playerForm,
      video_links: [
        ...(playerForm.video_links || []),
        { id: `video_${Date.now()}`, title: '', url: '', date: '', notes: '' }
      ]
    });
  };

  const updateVideoLink = (index, field, value) => {
    const updated = [...(playerForm.video_links || [])];
    updated[index] = { ...updated[index], [field]: value };
    setPlayerForm({ ...playerForm, video_links: updated });
  };

  const removeVideoLink = (index) => {
    const updated = [...(playerForm.video_links || [])];
    updated.splice(index, 1);
    setPlayerForm({ ...playerForm, video_links: updated });
  };

  const addScoutingReport = () => {
    setPlayerForm({
      ...playerForm,
      scouting_reports: [
        ...(playerForm.scouting_reports || []),
        { id: `report_${Date.now()}`, date: new Date().toISOString().split('T')[0], scout_name: currentUser?.full_name || '', report: '', strengths: '', weaknesses: '', rating: 5 }
      ]
    });
  };

  const updateScoutingReport = (index, field, value) => {
    const updated = [...(playerForm.scouting_reports || [])];
    updated[index] = { ...updated[index], [field]: value };
    setPlayerForm({ ...playerForm, scouting_reports: updated });
  };

  const removeScoutingReport = (index) => {
    const updated = [...(playerForm.scouting_reports || [])];
    updated.splice(index, 1);
    setPlayerForm({ ...playerForm, scouting_reports: updated });
  };

  const PlayerCard = ({ player, provided, snapshot }) => (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      onClick={() => { setSelectedPlayer(player); setShowDetailsDialog(true); }}
      className={`p-3 border-2 rounded-xl cursor-pointer transition-all ${
        snapshot.isDragging ? 'shadow-2xl border-emerald-500 rotate-2 scale-105 bg-white' : 'border-slate-200 hover:border-emerald-400 hover:shadow-lg bg-white'
      }`}
    >
      <div className="flex items-start gap-3 mb-2">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
          {player.full_name?.charAt(0) || <User className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-slate-900 truncate">{player.full_name}</h4>
          <div className="flex flex-wrap gap-1 mt-1">
            {player.primary_position && <Badge className="text-xs bg-blue-100 text-blue-800">{player.primary_position}</Badge>}
            {player.grad_year && <Badge className="text-xs bg-purple-100 text-purple-800">{player.grad_year}</Badge>}
          </div>
        </div>
      </div>
      {player.current_club && (
        <div className="text-xs text-slate-600 mb-1">
          <span className="text-slate-500">Club:</span> {player.current_club}
        </div>
      )}
      {player.scouting_recommendation && (
        <Badge className="text-xs bg-green-100 text-green-800 mt-2">
          {player.scouting_recommendation}
        </Badge>
      )}
      {player.video_links?.length > 0 && (
        <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
          <Video className="w-3 h-3" />
          {player.video_links.length} video{player.video_links.length > 1 ? 's' : ''}
        </div>
      )}
      {player.scouting_reports?.length > 0 && (
        <div className="mt-1 flex items-center gap-1 text-xs text-purple-600">
          <FileText className="w-3 h-3" />
          {player.scouting_reports.length} report{player.scouting_reports.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="p-4 md:p-8 max-w-[1800px] mx-auto">
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Scouting Pipeline
            </h1>
            <p className="text-slate-600">Track and manage scouted players through recruitment stages</p>
          </div>
          <Button onClick={() => { resetForm(); setShowPlayerDialog(true); }} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />Add Scouted Player
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {PIPELINE_STAGES.map(stage => {
            const stagePlayers = scoutedPlayers.filter(p => (p.pipeline_stage || 'New Lead') === stage.id);
            
            return (
              <Droppable key={stage.id} droppableId={stage.id}>
                {(provided, snapshot) => (
                  <Card className={`border-none shadow-xl ${snapshot.isDraggingOver ? 'ring-4 ring-emerald-400' : ''}`}>
                    <CardHeader className={`pb-3 bg-gradient-to-r ${stage.color} text-white`}>
                      <CardTitle className="text-sm font-bold flex items-center justify-between">
                        {stage.label}
                        <Badge className="bg-white/30 backdrop-blur-sm text-white border-white/40">
                          {stagePlayers.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-3 min-h-[400px] max-h-[calc(100vh-300px)] overflow-y-auto ${stage.bgColor}`}
                    >
                      <div className="space-y-3">
                        {stagePlayers.map((player, index) => (
                          <Draggable key={player.id} draggableId={player.id} index={index}>
                            {(dragProvided, dragSnapshot) => (
                              <PlayerCard player={player} provided={dragProvided} snapshot={dragSnapshot} />
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {stagePlayers.length === 0 && (
                          <div className="text-center py-12 text-slate-400 text-sm">
                            No players in this stage
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </Droppable>
            );
          })}
        </div>

        {/* Add/Edit Player Dialog */}
        <Dialog open={showPlayerDialog} onOpenChange={(open) => { setShowPlayerDialog(open); if (!open) { setEditingPlayer(null); resetForm(); } }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPlayer ? 'Edit' : 'Add'} Scouted Player</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              {/* Basic Info */}
              <div>
                <h3 className="font-semibold text-sm mb-3 text-slate-700">Basic Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name *</Label>
                    <Input value={playerForm.full_name} onChange={e => setPlayerForm({...playerForm, full_name: e.target.value})} />
                  </div>
                  <div>
                    <Label>Date of Birth *</Label>
                    <Input type="date" value={playerForm.date_of_birth} onChange={e => {
                      const gradYear = calculateGradYear(e.target.value);
                      setPlayerForm({...playerForm, date_of_birth: e.target.value, grad_year: gradYear});
                    }} />
                  </div>
                  <div>
                    <Label>Grad Year</Label>
                    <Input type="number" value={playerForm.grad_year} onChange={e => setPlayerForm({...playerForm, grad_year: parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={playerForm.email} onChange={e => setPlayerForm({...playerForm, email: e.target.value})} />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={playerForm.phone} onChange={e => setPlayerForm({...playerForm, phone: e.target.value})} />
                  </div>
                  <div>
                    <Label>Pipeline Stage</Label>
                    <Select value={playerForm.pipeline_stage} onValueChange={v => setPlayerForm({...playerForm, pipeline_stage: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PIPELINE_STAGES.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Parent Info */}
              <div>
                <h3 className="font-semibold text-sm mb-3 text-slate-700">Parent Information</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>Parent Name</Label>
                    <Input value={playerForm.parent_name} onChange={e => setPlayerForm({...playerForm, parent_name: e.target.value})} />
                  </div>
                  <div>
                    <Label>Parent Email</Label>
                    <Input type="email" value={playerForm.parent_email} onChange={e => setPlayerForm({...playerForm, parent_email: e.target.value})} />
                  </div>
                  <div>
                    <Label>Parent Phone</Label>
                    <Input value={playerForm.parent_phone} onChange={e => setPlayerForm({...playerForm, parent_phone: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* Soccer Info */}
              <div>
                <h3 className="font-semibold text-sm mb-3 text-slate-700">Soccer Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Primary Position</Label>
                    <Select value={playerForm.primary_position} onValueChange={v => setPlayerForm({...playerForm, primary_position: v})}>
                      <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
                      <SelectContent>
                        {['GK','Right Outside Back','Left Outside Back','Right Centerback','Left Centerback','Defensive Midfielder','Right Winger','Center Midfielder','Forward','Attacking Midfielder','Left Winger'].map(pos => (
                          <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Secondary Position</Label>
                    <Select value={playerForm.secondary_position} onValueChange={v => setPlayerForm({...playerForm, secondary_position: v})}>
                      <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>None</SelectItem>
                        {['GK','Right Outside Back','Left Outside Back','Right Centerback','Left Centerback','Defensive Midfielder','Right Winger','Center Midfielder','Forward','Attacking Midfielder','Left Winger'].map(pos => (
                          <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Current Club</Label>
                    <Input value={playerForm.current_club} onChange={e => setPlayerForm({...playerForm, current_club: e.target.value})} />
                  </div>
                  <div>
                    <Label>Current Team</Label>
                    <Input value={playerForm.current_team} onChange={e => setPlayerForm({...playerForm, current_team: e.target.value})} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Scouting Recommendation</Label>
                    <Select value={playerForm.scouting_recommendation} onValueChange={v => setPlayerForm({...playerForm, scouting_recommendation: v})}>
                      <SelectTrigger><SelectValue placeholder="Select recommendation" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Indispensable Player">Indispensable Player</SelectItem>
                        <SelectItem value="GA Starter">GA Starter</SelectItem>
                        <SelectItem value="GA Rotation">GA Rotation</SelectItem>
                        <SelectItem value="Aspire Starter">Aspire Starter</SelectItem>
                        <SelectItem value="Aspire Rotation">Aspire Rotation</SelectItem>
                        <SelectItem value="United Starter">United Starter</SelectItem>
                        <SelectItem value="United Rotation">United Rotation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Video Links */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm text-slate-700">Video Links</h3>
                  <Button size="sm" variant="outline" onClick={addVideoLink}>
                    <Plus className="w-3 h-3 mr-1" />Add Video
                  </Button>
                </div>
                <div className="space-y-3">
                  {(playerForm.video_links || []).map((video, idx) => (
                    <Card key={video.id} className="bg-slate-50">
                      <CardContent className="p-3">
                        <div className="grid md:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Title</Label>
                            <Input value={video.title} onChange={e => updateVideoLink(idx, 'title', e.target.value)} className="h-8 text-xs" />
                          </div>
                          <div>
                            <Label className="text-xs">URL</Label>
                            <Input value={video.url} onChange={e => updateVideoLink(idx, 'url', e.target.value)} className="h-8 text-xs" placeholder="https://..." />
                          </div>
                          <div>
                            <Label className="text-xs">Date</Label>
                            <Input type="date" value={video.date} onChange={e => updateVideoLink(idx, 'date', e.target.value)} className="h-8 text-xs" />
                          </div>
                          <div>
                            <Label className="text-xs">Notes</Label>
                            <Input value={video.notes} onChange={e => updateVideoLink(idx, 'notes', e.target.value)} className="h-8 text-xs" />
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => removeVideoLink(idx)} className="mt-2 text-red-600 hover:text-red-700 h-6 px-2 text-xs">
                          <Trash2 className="w-3 h-3 mr-1" />Remove
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Scouting Reports */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm text-slate-700">Scouting Reports</h3>
                  <Button size="sm" variant="outline" onClick={addScoutingReport}>
                    <Plus className="w-3 h-3 mr-1" />Add Report
                  </Button>
                </div>
                <div className="space-y-3">
                  {(playerForm.scouting_reports || []).map((report, idx) => (
                    <Card key={report.id} className="bg-slate-50">
                      <CardContent className="p-3">
                        <div className="grid md:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Date</Label>
                            <Input type="date" value={report.date} onChange={e => updateScoutingReport(idx, 'date', e.target.value)} className="h-8 text-xs" />
                          </div>
                          <div>
                            <Label className="text-xs">Scout Name</Label>
                            <Input value={report.scout_name} onChange={e => updateScoutingReport(idx, 'scout_name', e.target.value)} className="h-8 text-xs" />
                          </div>
                          <div>
                            <Label className="text-xs">Rating (1-10)</Label>
                            <Input type="number" min="1" max="10" value={report.rating} onChange={e => updateScoutingReport(idx, 'rating', parseInt(e.target.value))} className="h-8 text-xs" />
                          </div>
                          <div>
                            <Label className="text-xs">Strengths</Label>
                            <Textarea value={report.strengths} onChange={e => updateScoutingReport(idx, 'strengths', e.target.value)} className="text-xs" rows={2} />
                          </div>
                          <div>
                            <Label className="text-xs">Weaknesses</Label>
                            <Textarea value={report.weaknesses} onChange={e => updateScoutingReport(idx, 'weaknesses', e.target.value)} className="text-xs" rows={2} />
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-xs">Report</Label>
                            <Textarea value={report.report} onChange={e => updateScoutingReport(idx, 'report', e.target.value)} className="text-xs" rows={3} />
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => removeScoutingReport(idx)} className="mt-2 text-red-600 hover:text-red-700 h-6 px-2 text-xs">
                          <Trash2 className="w-3 h-3 mr-1" />Remove
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label>Scouting Note</Label>
                <Textarea value={playerForm.scouting_note} onChange={e => setPlayerForm({...playerForm, scouting_note: e.target.value})} rows={3} placeholder="Initial observations and notes..." />
              </div>
              <div>
                <Label>Additional Notes</Label>
                <Textarea value={playerForm.notes} onChange={e => setPlayerForm({...playerForm, notes: e.target.value})} rows={2} />
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowPlayerDialog(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleSave} disabled={!playerForm.full_name || !playerForm.date_of_birth} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Player Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                {selectedPlayer?.full_name}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { handleEdit(selectedPlayer); setShowDetailsDialog(false); }}>
                    <Edit2 className="w-3 h-3 mr-1" />Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => deletePlayerMutation.mutate(selectedPlayer.id)} className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-3 h-3 mr-1" />Delete
                  </Button>
                </div>
              </DialogTitle>
            </DialogHeader>
            {selectedPlayer && (
              <div className="space-y-4 mt-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div><span className="text-xs text-slate-500">Position:</span> <span className="font-medium text-sm">{selectedPlayer.primary_position || 'N/A'}</span></div>
                    <div><span className="text-xs text-slate-500">Grad Year:</span> <span className="font-medium text-sm">{selectedPlayer.grad_year || 'N/A'}</span></div>
                    <div><span className="text-xs text-slate-500">Current Club:</span> <span className="font-medium text-sm">{selectedPlayer.current_club || 'N/A'}</span></div>
                    <div><span className="text-xs text-slate-500">Current Team:</span> <span className="font-medium text-sm">{selectedPlayer.current_team || 'N/A'}</span></div>
                  </div>
                  <div className="space-y-2">
                    <div><span className="text-xs text-slate-500">Email:</span> <span className="font-medium text-sm">{selectedPlayer.email || 'N/A'}</span></div>
                    <div><span className="text-xs text-slate-500">Phone:</span> <span className="font-medium text-sm">{selectedPlayer.phone || 'N/A'}</span></div>
                    <div><span className="text-xs text-slate-500">Parent:</span> <span className="font-medium text-sm">{selectedPlayer.parent_name || 'N/A'}</span></div>
                    <div><span className="text-xs text-slate-500">Parent Email:</span> <span className="font-medium text-sm">{selectedPlayer.parent_email || 'N/A'}</span></div>
                  </div>
                </div>

                {selectedPlayer.scouting_recommendation && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-xs font-semibold text-green-900 mb-1">Recommendation</div>
                    <Badge className="bg-green-600 text-white">{selectedPlayer.scouting_recommendation}</Badge>
                  </div>
                )}

                {selectedPlayer.scouting_note && (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="text-xs font-semibold text-amber-900 mb-1">Scouting Note</div>
                    <p className="text-sm text-amber-900">{selectedPlayer.scouting_note}</p>
                  </div>
                )}

                {selectedPlayer.video_links?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Video className="w-4 h-4 text-blue-600" />
                      Video Links
                    </h4>
                    <div className="space-y-2">
                      {selectedPlayer.video_links.map(video => (
                        <Card key={video.id} className="bg-blue-50">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-semibold text-sm">{video.title}</div>
                                <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
                                  <ExternalLink className="w-3 h-3" />
                                  {video.url}
                                </a>
                                {video.date && <div className="text-xs text-slate-500 mt-1">{new Date(video.date).toLocaleDateString()}</div>}
                                {video.notes && <p className="text-xs text-slate-600 mt-1">{video.notes}</p>}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPlayer.scouting_reports?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-600" />
                      Scouting Reports
                    </h4>
                    <div className="space-y-2">
                      {selectedPlayer.scouting_reports.map(report => (
                        <Card key={report.id} className="bg-purple-50">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="font-semibold text-sm">{report.scout_name}</div>
                                <div className="text-xs text-slate-500">{new Date(report.date).toLocaleDateString()}</div>
                              </div>
                              <Badge className="bg-purple-600 text-white">Rating: {report.rating}/10</Badge>
                            </div>
                            {report.report && <p className="text-sm text-slate-700 mb-2">{report.report}</p>}
                            <div className="grid md:grid-cols-2 gap-2">
                              {report.strengths && (
                                <div className="p-2 bg-green-50 rounded border border-green-200">
                                  <div className="text-xs font-semibold text-green-900 mb-1">Strengths</div>
                                  <p className="text-xs text-green-800">{report.strengths}</p>
                                </div>
                              )}
                              {report.weaknesses && (
                                <div className="p-2 bg-red-50 rounded border border-red-200">
                                  <div className="text-xs font-semibold text-red-900 mb-1">Weaknesses</div>
                                  <p className="text-xs text-red-800">{report.weaknesses}</p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DragDropContext>
  );
}