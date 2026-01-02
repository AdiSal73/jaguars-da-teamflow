import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Upload, Edit2, Trash2, User, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const calculateGradYear = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const birthDate = new Date(dateOfBirth);
  const birthYear = birthDate.getFullYear();
  const birthMonth = birthDate.getMonth();
  
  // If born before September (month 8), they graduate in birthYear + 18
  // If born September or later, they graduate in birthYear + 19
  return birthMonth < 8 ? birthYear + 18 : birthYear + 19;
};

export default function TryoutPlayers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('tryout');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showScoutDialog, setShowScoutDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [csvFile, setCsvFile] = useState(null);

  const [tryoutForm, setTryoutForm] = useState({
    full_name: '', email: '', phone: '', parent_name: '', parent_email: '', parent_phone: '',
    date_of_birth: '', grad_year: '', primary_position: '', secondary_position: '',
    current_club: '', current_team: '', scouting_note: '', notes: ''
  });

  const [scoutForm, setScoutForm] = useState({
    full_name: '', email: '', phone: '', parent_name: '', parent_email: '', parent_phone: '',
    date_of_birth: '', grad_year: '', primary_position: '', secondary_position: '',
    current_club: '', current_team: '', scouting_recommendation: '', scouting_note: '', notes: ''
  });

  const { data: tryoutPlayers = [] } = useQuery({
    queryKey: ['tryoutPlayers'],
    queryFn: () => base44.entities.TryoutPlayer.list()
  });

  const { data: scoutedPlayers = [] } = useQuery({
    queryKey: ['scoutedPlayers'],
    queryFn: () => base44.entities.ScoutedPlayer.list()
  });

  const createTryoutMutation = useMutation({
    mutationFn: (data) => base44.entities.TryoutPlayer.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tryoutPlayers']);
      setShowAddDialog(false);
      resetTryoutForm();
      toast.success('Tryout player added');
    }
  });

  const updateTryoutMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TryoutPlayer.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tryoutPlayers']);
      setShowAddDialog(false);
      setEditingPlayer(null);
      resetTryoutForm();
      toast.success('Tryout player updated');
    }
  });

  const deleteTryoutMutation = useMutation({
    mutationFn: (id) => base44.entities.TryoutPlayer.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['tryoutPlayers']);
      toast.success('Tryout player deleted');
    }
  });

  const createScoutedMutation = useMutation({
    mutationFn: (data) => base44.entities.ScoutedPlayer.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['scoutedPlayers']);
      setShowScoutDialog(false);
      resetScoutForm();
      toast.success('Scouted player added');
    }
  });

  const updateScoutedMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ScoutedPlayer.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['scoutedPlayers']);
      setShowScoutDialog(false);
      setEditingPlayer(null);
      resetScoutForm();
      toast.success('Scouted player updated');
    }
  });

  const deleteScoutedMutation = useMutation({
    mutationFn: (id) => base44.entities.ScoutedPlayer.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['scoutedPlayers']);
      toast.success('Scouted player deleted');
    }
  });

  const importCSVMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: 'object',
          properties: {
            players: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  full_name: { type: 'string' },
                  email: { type: 'string' },
                  phone: { type: 'string' },
                  parent_name: { type: 'string' },
                  parent_email: { type: 'string' },
                  parent_phone: { type: 'string' },
                  date_of_birth: { type: 'string' },
                  grad_year: { type: 'number' },
                  primary_position: { type: 'string' },
                  secondary_position: { type: 'string' },
                  current_club: { type: 'string' },
                  current_team: { type: 'string' },
                  scouting_note: { type: 'string' },
                  notes: { type: 'string' }
                }
              }
            }
          }
        }
      });

      if (result.status === 'error') {
        throw new Error(result.details);
      }

      const playersData = result.output.players || [];
      const processedPlayers = playersData.map(p => ({
        ...p,
        grad_year: p.grad_year || calculateGradYear(p.date_of_birth)
      }));

      await base44.entities.TryoutPlayer.bulkCreate(processedPlayers);
      return processedPlayers.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries(['tryoutPlayers']);
      setShowImportDialog(false);
      setCsvFile(null);
      toast.success(`Imported ${count} tryout players`);
    },
    onError: (error) => {
      toast.error(`Import failed: ${error.message}`);
    }
  });

  const resetTryoutForm = () => {
    setTryoutForm({
      full_name: '', email: '', phone: '', parent_name: '', parent_email: '', parent_phone: '',
      date_of_birth: '', grad_year: '', primary_position: '', secondary_position: '',
      current_club: '', current_team: '', scouting_note: '', notes: ''
    });
  };

  const resetScoutForm = () => {
    setScoutForm({
      full_name: '', email: '', phone: '', parent_name: '', parent_email: '', parent_phone: '',
      date_of_birth: '', grad_year: '', primary_position: '', secondary_position: '',
      current_club: '', current_team: '', scouting_recommendation: '', scouting_note: '', notes: ''
    });
  };

  const handleEditTryout = (player) => {
    setEditingPlayer(player);
    setTryoutForm(player);
    setShowAddDialog(true);
  };

  const handleEditScouted = (player) => {
    setEditingPlayer(player);
    setScoutForm(player);
    setShowScoutDialog(true);
  };

  const handleSaveTryout = () => {
    const data = {
      ...tryoutForm,
      grad_year: tryoutForm.grad_year || calculateGradYear(tryoutForm.date_of_birth)
    };
    if (editingPlayer) {
      updateTryoutMutation.mutate({ id: editingPlayer.id, data });
    } else {
      createTryoutMutation.mutate(data);
    }
  };

  const handleSaveScouted = () => {
    const data = {
      ...scoutForm,
      grad_year: scoutForm.grad_year || calculateGradYear(scoutForm.date_of_birth)
    };
    if (editingPlayer) {
      updateScoutedMutation.mutate({ id: editingPlayer.id, data });
    } else {
      createScoutedMutation.mutate(data);
    }
  };

  const filteredTryout = tryoutPlayers.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredScouted = scoutedPlayers.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const PlayerCard = ({ player, onEdit, onDelete, isScouted = false }) => (
    <Card className="border-2 border-slate-200 hover:border-emerald-400 hover:shadow-lg transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
              {player.full_name?.charAt(0) || <User className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-slate-900 truncate">{player.full_name}</h4>
              <div className="flex flex-wrap gap-1 mt-1">
                {player.primary_position && <Badge className="text-xs bg-blue-100 text-blue-800">{player.primary_position}</Badge>}
                {player.grad_year && <Badge className="text-xs bg-purple-100 text-purple-800">{player.grad_year}</Badge>}
                {player.scouting_recommendation && <Badge className="text-xs bg-green-100 text-green-800">{player.scouting_recommendation}</Badge>}
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => onEdit(player)} className="h-7 w-7 p-0">
              <Edit2 className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDelete(player.id)} className="h-7 w-7 p-0 hover:text-red-600">
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {player.current_club && (
            <div><span className="text-slate-500">Club:</span> <span className="font-medium">{player.current_club}</span></div>
          )}
          {player.current_team && (
            <div><span className="text-slate-500">Team:</span> <span className="font-medium">{player.current_team}</span></div>
          )}
          {player.parent_name && (
            <div><span className="text-slate-500">Parent:</span> <span className="font-medium">{player.parent_name}</span></div>
          )}
          {player.date_of_birth && (
            <div><span className="text-slate-500">DOB:</span> <span className="font-medium">{new Date(player.date_of_birth).toLocaleDateString()}</span></div>
          )}
        </div>
        {player.scouting_note && (
          <div className="mt-3 p-2 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-xs text-amber-900"><strong>Scout Note:</strong> {player.scouting_note}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-2">
          Outside Tryout Players
        </h1>
        <p className="text-slate-600">Manage external players trying out for Michigan Jaguars teams</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="tryout">Tryout Players ({tryoutPlayers.length})</TabsTrigger>
          <TabsTrigger value="scouted">Scouted Players ({scoutedPlayers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="tryout">
          <Card className="border-none shadow-xl mb-4">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-600 text-white pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <CardTitle className="text-lg">Tryout Players</CardTitle>
                <div className="flex gap-2">
                  <Button onClick={() => setShowImportDialog(true)} size="sm" className="bg-white text-emerald-600 hover:bg-emerald-50">
                    <Upload className="w-4 h-4 mr-1" />Import CSV
                  </Button>
                  <Button onClick={() => { resetTryoutForm(); setShowAddDialog(true); }} size="sm" className="bg-white text-emerald-600 hover:bg-emerald-50">
                    <Plus className="w-4 h-4 mr-1" />Add Player
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search players..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTryout?.map(player => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    onEdit={handleEditTryout}
                    onDelete={(id) => deleteTryoutMutation.mutate(id)}
                  />
                ))}
              </div>
              {filteredTryout.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  {searchTerm ? 'No players found' : 'No tryout players yet'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scouted">
          <Card className="border-none shadow-xl mb-4">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <CardTitle className="text-lg">Scouted Players</CardTitle>
                <Button onClick={() => { resetScoutForm(); setShowScoutDialog(true); }} size="sm" className="bg-white text-blue-600 hover:bg-blue-50">
                  <Plus className="w-4 h-4 mr-1" />Scout Player
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search players..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredScouted?.map(player => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    onEdit={handleEditScouted}
                    onDelete={(id) => deleteScoutedMutation.mutate(id)}
                    isScouted
                  />
                ))}
              </div>
              {filteredScouted.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  {searchTerm ? 'No players found' : 'No scouted players yet'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Tryout Player Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) { setEditingPlayer(null); resetTryoutForm(); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlayer ? 'Edit' : 'Add'} Tryout Player</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Full Name *</Label>
                <Input value={tryoutForm.full_name} onChange={e => setTryoutForm({...tryoutForm, full_name: e.target.value})} />
              </div>
              <div>
                <Label>Date of Birth *</Label>
                <Input type="date" value={tryoutForm.date_of_birth} onChange={e => {
                  const gradYear = calculateGradYear(e.target.value);
                  setTryoutForm({...tryoutForm, date_of_birth: e.target.value, grad_year: gradYear});
                }} />
              </div>
              <div>
                <Label>Grad Year</Label>
                <Input type="number" value={tryoutForm.grad_year} onChange={e => setTryoutForm({...tryoutForm, grad_year: parseInt(e.target.value)})} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={tryoutForm.email} onChange={e => setTryoutForm({...tryoutForm, email: e.target.value})} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={tryoutForm.phone} onChange={e => setTryoutForm({...tryoutForm, phone: e.target.value})} />
              </div>
              <div>
                <Label>Parent Name</Label>
                <Input value={tryoutForm.parent_name} onChange={e => setTryoutForm({...tryoutForm, parent_name: e.target.value})} />
              </div>
              <div>
                <Label>Parent Email</Label>
                <Input type="email" value={tryoutForm.parent_email} onChange={e => setTryoutForm({...tryoutForm, parent_email: e.target.value})} />
              </div>
              <div>
                <Label>Parent Phone</Label>
                <Input value={tryoutForm.parent_phone} onChange={e => setTryoutForm({...tryoutForm, parent_phone: e.target.value})} />
              </div>
              <div>
                <Label>Primary Position</Label>
                <Select value={tryoutForm.primary_position} onValueChange={v => setTryoutForm({...tryoutForm, primary_position: v})}>
                  <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
                  <SelectContent>
                    {['GK','Right Outside Back','Left Outside Back','Right Centerback','Left Centerback','Defensive Midfielder','Right Winger','Center Midfielder','Forward','Attacking Midfielder','Left Winger']?.map(pos => (
                      <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Secondary Position</Label>
                <Select value={tryoutForm.secondary_position} onValueChange={v => setTryoutForm({...tryoutForm, secondary_position: v})}>
                  <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>None</SelectItem>
                    {['GK','Right Outside Back','Left Outside Back','Right Centerback','Left Centerback','Defensive Midfielder','Right Winger','Center Midfielder','Forward','Attacking Midfielder','Left Winger']?.map(pos => (
                      <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Current Club</Label>
                <Input value={tryoutForm.current_club} onChange={e => setTryoutForm({...tryoutForm, current_club: e.target.value})} />
              </div>
              <div>
                <Label>Current Team</Label>
                <Input value={tryoutForm.current_team} onChange={e => setTryoutForm({...tryoutForm, current_team: e.target.value})} />
              </div>
            </div>
            <div>
              <Label>Scouting Note</Label>
              <Textarea value={tryoutForm.scouting_note} onChange={e => setTryoutForm({...tryoutForm, scouting_note: e.target.value})} rows={2} />
            </div>
            <div>
              <Label>Additional Notes</Label>
              <Textarea value={tryoutForm.notes} onChange={e => setTryoutForm({...tryoutForm, notes: e.target.value})} rows={2} />
            </div>
            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSaveTryout} disabled={!tryoutForm.full_name || !tryoutForm.date_of_birth} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Scout Player Dialog */}
      <Dialog open={showScoutDialog} onOpenChange={(open) => { setShowScoutDialog(open); if (!open) { setEditingPlayer(null); resetScoutForm(); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlayer ? 'Edit' : 'Scout'} Outside Player</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Full Name *</Label>
                <Input value={scoutForm.full_name} onChange={e => setScoutForm({...scoutForm, full_name: e.target.value})} />
              </div>
              <div>
                <Label>Date of Birth *</Label>
                <Input type="date" value={scoutForm.date_of_birth} onChange={e => {
                  const gradYear = calculateGradYear(e.target.value);
                  setScoutForm({...scoutForm, date_of_birth: e.target.value, grad_year: gradYear});
                }} />
              </div>
              <div>
                <Label>Grad Year</Label>
                <Input type="number" value={scoutForm.grad_year} onChange={e => setScoutForm({...scoutForm, grad_year: parseInt(e.target.value)})} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={scoutForm.email} onChange={e => setScoutForm({...scoutForm, email: e.target.value})} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={scoutForm.phone} onChange={e => setScoutForm({...scoutForm, phone: e.target.value})} />
              </div>
              <div>
                <Label>Parent Name</Label>
                <Input value={scoutForm.parent_name} onChange={e => setScoutForm({...scoutForm, parent_name: e.target.value})} />
              </div>
              <div>
                <Label>Parent Email</Label>
                <Input type="email" value={scoutForm.parent_email} onChange={e => setScoutForm({...scoutForm, parent_email: e.target.value})} />
              </div>
              <div>
                <Label>Parent Phone</Label>
                <Input value={scoutForm.parent_phone} onChange={e => setScoutForm({...scoutForm, parent_phone: e.target.value})} />
              </div>
              <div>
                <Label>Primary Position</Label>
                <Select value={scoutForm.primary_position} onValueChange={v => setScoutForm({...scoutForm, primary_position: v})}>
                  <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
                  <SelectContent>
                    {['GK','Right Outside Back','Left Outside Back','Right Centerback','Left Centerback','Defensive Midfielder','Right Winger','Center Midfielder','Forward','Attacking Midfielder','Left Winger']?.map(pos => (
                      <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Secondary Position</Label>
                <Select value={scoutForm.secondary_position} onValueChange={v => setScoutForm({...scoutForm, secondary_position: v})}>
                  <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>None</SelectItem>
                    {['GK','Right Outside Back','Left Outside Back','Right Centerback','Left Centerback','Defensive Midfielder','Right Winger','Center Midfielder','Forward','Attacking Midfielder','Left Winger']?.map(pos => (
                      <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Current Club</Label>
                <Input value={scoutForm.current_club} onChange={e => setScoutForm({...scoutForm, current_club: e.target.value})} />
              </div>
              <div>
                <Label>Current Team</Label>
                <Input value={scoutForm.current_team} onChange={e => setScoutForm({...scoutForm, current_team: e.target.value})} />
              </div>
              <div>
                <Label>Scouting Recommendation</Label>
                <Select value={scoutForm.scouting_recommendation} onValueChange={v => setScoutForm({...scoutForm, scouting_recommendation: v})}>
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
            <div>
              <Label>Scouting Note</Label>
              <Textarea value={scoutForm.scouting_note} onChange={e => setScoutForm({...scoutForm, scouting_note: e.target.value})} rows={3} placeholder="Detailed scouting observations..." />
            </div>
            <div>
              <Label>Additional Notes</Label>
              <Textarea value={scoutForm.notes} onChange={e => setScoutForm({...scoutForm, notes: e.target.value})} rows={2} />
            </div>
            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowScoutDialog(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSaveScouted} disabled={!scoutForm.full_name || !scoutForm.date_of_birth} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* CSV Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Tryout Players (CSV)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Upload CSV File</Label>
              <Input type="file" accept=".csv" onChange={e => setCsvFile(e.target.files[0])} className="mt-1" />
              <p className="text-xs text-slate-500 mt-2">
                Expected columns: full_name, email, phone, parent_name, parent_email, parent_phone, 
                date_of_birth, grad_year, primary_position, secondary_position, current_club, current_team, scouting_note
              </p>
            </div>
            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowImportDialog(false)} className="flex-1">Cancel</Button>
              <Button onClick={() => importCSVMutation.mutate(csvFile)} disabled={!csvFile || importCSVMutation.isPending} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                {importCSVMutation.isPending ? 'Importing...' : 'Import'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}