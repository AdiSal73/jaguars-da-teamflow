import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Shield, ShieldOff, Edit, Search, Trash2, Table, Grid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import TeamAssignmentSelector from '../components/coach/TeamAssignmentSelector';

export default function CoachManagement() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingCoach, setEditingCoach] = useState(null);
  const [filterBranch, setFilterBranch] = useState('all');
  const [filterAdmin, setFilterAdmin] = useState('all');
  const [viewMode, setViewMode] = useState('cards');
  const [selectedCoaches, setSelectedCoaches] = useState([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [coachForm, setCoachForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    branch: '',
    bio: '',
    is_admin: false,
    booking_enabled: true,
    team_ids: []
  });

  const queryClient = useQueryClient();

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list('-created_date')
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const createCoachMutation = useMutation({
    mutationFn: (data) => base44.entities.Coach.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['coaches']);
      setShowDialog(false);
      resetForm();
    }
  });

  const updateCoachMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Coach.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['coaches']);
      setShowDialog(false);
      setEditingCoach(null);
      resetForm();
    }
  });

  const deleteCoachMutation = useMutation({
    mutationFn: (id) => base44.entities.Coach.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['coaches'])
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      for (const id of selectedCoaches) {
        await base44.entities.Coach.delete(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['coaches']);
      setSelectedCoaches([]);
      setShowDeleteDialog(false);
    }
  });

  const resetForm = () => {
    setCoachForm({
      full_name: '',
      email: '',
      phone: '',
      branch: '',
      bio: '',
      is_admin: false,
      booking_enabled: true,
      team_ids: []
    });
  };

  const handleEdit = (coach) => {
    setEditingCoach(coach);
    setCoachForm({
      full_name: coach.full_name || '',
      email: coach.email || '',
      phone: coach.phone || '',
      branch: coach.branch || '',
      bio: coach.bio || '',
      is_admin: coach.is_admin || false,
      booking_enabled: coach.booking_enabled !== false,
      team_ids: coach.team_ids || []
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (editingCoach) {
      updateCoachMutation.mutate({ id: editingCoach.id, data: coachForm });
    } else {
      createCoachMutation.mutate(coachForm);
    }
  };

  const handleFieldUpdate = (coachId, field, value) => {
    updateCoachMutation.mutate({ id: coachId, data: { [field]: value } });
  };

  const toggleAdminStatus = (coach) => {
    updateCoachMutation.mutate({ id: coach.id, data: { is_admin: !coach.is_admin } });
  };

  const getCoachTeams = (coach) => {
    return teams.filter(t => coach.team_ids?.includes(t.id));
  };

  const uniqueBranches = [...new Set(coaches.map(c => c.branch).filter(Boolean))];

  const filteredCoaches = useMemo(() => {
    return coaches.filter(coach => {
      const matchesSearch = coach.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coach.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBranch = filterBranch === 'all' || coach.branch === filterBranch;
      const matchesAdmin = filterAdmin === 'all' || 
        (filterAdmin === 'admin' && coach.is_admin) ||
        (filterAdmin === 'coach' && !coach.is_admin);
      return matchesSearch && matchesBranch && matchesAdmin;
    });
  }, [coaches, searchTerm, filterBranch, filterAdmin]);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedCoaches(filteredCoaches.map(c => c.id));
    } else {
      setSelectedCoaches([]);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Coach Management</h1>
          <p className="text-slate-600 mt-1">Manage coaches and permissions</p>
        </div>
        <Button onClick={() => { setEditingCoach(null); resetForm(); setShowDialog(true); }} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Coach
        </Button>
      </div>

      <Card className="mb-6 border-none shadow-lg">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-end justify-between">
            <div className="flex flex-wrap gap-3 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search coaches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Select value={filterBranch} onValueChange={setFilterBranch}>
                <SelectTrigger className="h-9 w-32">
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {uniqueBranches.map(b => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterAdmin} onValueChange={setFilterAdmin}>
                <SelectTrigger className="h-9 w-32">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="coach">Coaches</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant={viewMode === 'cards' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('cards')} className={viewMode === 'cards' ? 'bg-emerald-600' : ''}>
                <Grid className="w-4 h-4" />
              </Button>
              <Button variant={viewMode === 'table' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('table')} className={viewMode === 'table' ? 'bg-emerald-600' : ''}>
                <Table className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={viewMode} onValueChange={setViewMode}>
        <TabsContent value="cards">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCoaches.map(coach => {
              const coachTeams = getCoachTeams(coach);
              return (
                <Card key={coach.id} className="border-none shadow-lg hover:shadow-xl transition-all">
                  <CardHeader className="border-b border-slate-100 pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          {coach.full_name}
                          {coach.is_admin && <Shield className="w-4 h-4 text-emerald-600" />}
                        </CardTitle>
                        {coach.branch && <p className="text-xs text-slate-500 mt-1">{coach.branch}</p>}
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(coach)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-2 text-sm">
                      {coach.email && <div><span className="text-slate-500">Email:</span> <span className="ml-1">{coach.email}</span></div>}
                      {coach.phone && <div><span className="text-slate-500">Phone:</span> <span className="ml-1">{coach.phone}</span></div>}
                      <div className="pt-2">
                        <span className="text-slate-500 text-xs">Teams:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {coachTeams.length === 0 ? (
                            <span className="text-xs italic text-slate-400">No teams assigned</span>
                          ) : (
                            coachTeams.map(t => (
                              <Button
                                key={t.id}
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-xs hover:bg-emerald-50 hover:border-emerald-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(createPageUrl('TeamDashboard', `teamId=${t.id}`));
                                }}
                              >
                                {t.name}
                              </Button>
                            ))
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        {coach.is_admin && <Badge className="bg-emerald-100 text-emerald-800"><Shield className="w-3 h-3 mr-1" />Admin</Badge>}
                        {coach.booking_enabled && <Badge variant="outline">Bookings</Badge>}
                      </div>
                      <Button
                        variant={coach.is_admin ? "destructive" : "default"}
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => toggleAdminStatus(coach)}
                      >
                        {coach.is_admin ? <><ShieldOff className="w-4 h-4 mr-2" />Remove Admin</> : <><Shield className="w-4 h-4 mr-2" />Make Admin</>}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="table">
          {selectedCoaches.length > 0 && (
            <Card className="mb-4 border-none shadow-lg">
              <CardContent className="p-4 flex items-center justify-between">
                <span className="text-sm text-slate-600">{selectedCoaches.length} coaches selected</span>
                <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="w-4 h-4 mr-2" />Delete Selected
                </Button>
              </CardContent>
            </Card>
          )}
          <Card className="border-none shadow-xl">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-900 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <Checkbox checked={selectedCoaches.length === filteredCoaches.length && filteredCoaches.length > 0} onCheckedChange={handleSelectAll} />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-bold">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-bold">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-bold">Branch</th>
                      <th className="px-4 py-3 text-left text-xs font-bold">Teams</th>
                      <th className="px-4 py-3 text-left text-xs font-bold">Admin</th>
                      <th className="px-4 py-3 text-center text-xs font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCoaches.map((coach, idx) => {
                      const coachTeams = getCoachTeams(coach);
                      return (
                        <tr key={coach.id} className={`border-b hover:bg-slate-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                          <td className="px-4 py-3">
                            <Checkbox
                              checked={selectedCoaches.includes(coach.id)}
                              onCheckedChange={(checked) => {
                                if (checked) setSelectedCoaches([...selectedCoaches, coach.id]);
                                else setSelectedCoaches(selectedCoaches.filter(id => id !== coach.id));
                              }}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input value={coach.full_name || ''} onChange={(e) => handleFieldUpdate(coach.id, 'full_name', e.target.value)} className="border-transparent hover:border-slate-300 text-xs h-8" />
                          </td>
                          <td className="px-4 py-3">
                            <Input value={coach.email || ''} onChange={(e) => handleFieldUpdate(coach.id, 'email', e.target.value)} className="border-transparent hover:border-slate-300 text-xs h-8" />
                          </td>
                          <td className="px-4 py-3">
                            <Input value={coach.phone || ''} onChange={(e) => handleFieldUpdate(coach.id, 'phone', e.target.value)} className="border-transparent hover:border-slate-300 text-xs h-8" />
                          </td>
                          <td className="px-4 py-3">
                            <Input value={coach.branch || ''} onChange={(e) => handleFieldUpdate(coach.id, 'branch', e.target.value)} className="border-transparent hover:border-slate-300 text-xs h-8" />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {coachTeams.slice(0, 2).map(t => (
                                <Badge key={t.id} variant="outline" className="text-[10px]">{t.name}</Badge>
                              ))}
                              {coachTeams.length > 2 && <Badge variant="outline" className="text-[10px]">+{coachTeams.length - 2}</Badge>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Switch checked={coach.is_admin} onCheckedChange={() => toggleAdminStatus(coach)} />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(coach)}><Edit className="w-3 h-3" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-50 hover:text-red-600" onClick={() => deleteCoachMutation.mutate(coach.id)}><Trash2 className="w-3 h-3" /></Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCoach ? 'Edit Coach' : 'Add New Coach'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Full Name *</Label>
              <Input value={coachForm.full_name} onChange={(e) => setCoachForm({...coachForm, full_name: e.target.value})} className="mt-1" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={coachForm.email} onChange={(e) => setCoachForm({...coachForm, email: e.target.value})} className="mt-1" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={coachForm.phone} onChange={(e) => setCoachForm({...coachForm, phone: e.target.value})} className="mt-1" />
            </div>
            <div>
              <Label>Branch</Label>
              <Input value={coachForm.branch} onChange={(e) => setCoachForm({...coachForm, branch: e.target.value})} className="mt-1" />
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea value={coachForm.bio} onChange={(e) => setCoachForm({...coachForm, bio: e.target.value})} className="mt-1" />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label>Admin Privileges</Label>
                <p className="text-xs text-slate-500">Grant admin access</p>
              </div>
              <Switch checked={coachForm.is_admin} onCheckedChange={(checked) => setCoachForm({...coachForm, is_admin: checked})} />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label>Booking Enabled</Label>
                <p className="text-xs text-slate-500">Allow session bookings</p>
              </div>
              <Switch checked={coachForm.booking_enabled} onCheckedChange={(checked) => setCoachForm({...coachForm, booking_enabled: checked})} />
            </div>
            <div>
              <Label>Assign Teams</Label>
              <TeamAssignmentSelector
                teams={teams}
                selectedTeamIds={coachForm.team_ids}
                onChange={(teamIds) => setCoachForm({...coachForm, team_ids: teamIds})}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!coachForm.full_name} className="bg-emerald-600 hover:bg-emerald-700">
              {editingCoach ? 'Update' : 'Add'} Coach
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCoaches.length} Coaches?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => bulkDeleteMutation.mutate()} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}