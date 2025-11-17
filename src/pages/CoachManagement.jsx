import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Shield, ShieldOff, Edit, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export default function CoachManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingCoach, setEditingCoach] = useState(null);
  const [coachForm, setCoachForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    specialization: 'General Coaching',
    bio: '',
    is_admin: false,
    booking_enabled: true
  });

  const queryClient = useQueryClient();

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list('-created_date')
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

  const resetForm = () => {
    setCoachForm({
      full_name: '',
      email: '',
      phone: '',
      specialization: 'General Coaching',
      bio: '',
      is_admin: false,
      booking_enabled: true
    });
  };

  const handleEdit = (coach) => {
    setEditingCoach(coach);
    setCoachForm({
      full_name: coach.full_name || '',
      email: coach.email || '',
      phone: coach.phone || '',
      specialization: coach.specialization || 'General Coaching',
      bio: coach.bio || '',
      is_admin: coach.is_admin || false,
      booking_enabled: coach.booking_enabled !== false
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

  const toggleAdminStatus = (coach) => {
    updateCoachMutation.mutate({
      id: coach.id,
      data: { ...coach, is_admin: !coach.is_admin }
    });
  };

  const filteredCoaches = coaches.filter(coach =>
    coach.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Coach Management</h1>
          <p className="text-slate-600 mt-1">Manage coaches, permissions, and admin roles</p>
        </div>
        <Button onClick={() => { setEditingCoach(null); resetForm(); setShowDialog(true); }} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Coach
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search coaches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCoaches.map(coach => (
          <Card key={coach.id} className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {coach.full_name}
                    {coach.is_admin && <Shield className="w-4 h-4 text-emerald-600" />}
                  </CardTitle>
                  <p className="text-sm text-slate-600 mt-1">{coach.specialization}</p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => handleEdit(coach)}>
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {coach.email && (
                  <div className="text-sm">
                    <span className="text-slate-600">Email:</span>
                    <span className="ml-2 text-slate-900">{coach.email}</span>
                  </div>
                )}
                {coach.phone && (
                  <div className="text-sm">
                    <span className="text-slate-600">Phone:</span>
                    <span className="ml-2 text-slate-900">{coach.phone}</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  {coach.is_admin && (
                    <Badge className="bg-emerald-100 text-emerald-800">
                      <Shield className="w-3 h-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                  {coach.booking_enabled && (
                    <Badge variant="outline">Bookings Enabled</Badge>
                  )}
                </div>
                <Button
                  variant={coach.is_admin ? "destructive" : "default"}
                  size="sm"
                  className="w-full mt-4"
                  onClick={() => toggleAdminStatus(coach)}
                >
                  {coach.is_admin ? (
                    <>
                      <ShieldOff className="w-4 h-4 mr-2" />
                      Remove Admin
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Make Admin
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCoach ? 'Edit Coach' : 'Add New Coach'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Full Name *</Label>
              <Input
                value={coachForm.full_name}
                onChange={(e) => setCoachForm({...coachForm, full_name: e.target.value})}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={coachForm.email}
                onChange={(e) => setCoachForm({...coachForm, email: e.target.value})}
                placeholder="coach@email.com"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={coachForm.phone}
                onChange={(e) => setCoachForm({...coachForm, phone: e.target.value})}
                placeholder="+1234567890"
              />
            </div>
            <div>
              <Label>Specialization *</Label>
              <Select value={coachForm.specialization} onValueChange={(value) => setCoachForm({...coachForm, specialization: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technical Training">Technical Training</SelectItem>
                  <SelectItem value="Tactical Analysis">Tactical Analysis</SelectItem>
                  <SelectItem value="Physical Conditioning">Physical Conditioning</SelectItem>
                  <SelectItem value="Goalkeeping">Goalkeeping</SelectItem>
                  <SelectItem value="Mental Coaching">Mental Coaching</SelectItem>
                  <SelectItem value="General Coaching">General Coaching</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea
                value={coachForm.bio}
                onChange={(e) => setCoachForm({...coachForm, bio: e.target.value})}
                placeholder="Coach biography..."
              />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label>Admin Privileges</Label>
                <p className="text-sm text-slate-600">Grant admin access to this coach</p>
              </div>
              <Switch
                checked={coachForm.is_admin}
                onCheckedChange={(checked) => setCoachForm({...coachForm, is_admin: checked})}
              />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label>Booking Enabled</Label>
                <p className="text-sm text-slate-600">Allow players to book sessions</p>
              </div>
              <Switch
                checked={coachForm.booking_enabled}
                onCheckedChange={(checked) => setCoachForm({...coachForm, booking_enabled: checked})}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleSave}
              disabled={!coachForm.full_name || !coachForm.specialization}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {editingCoach ? 'Update Coach' : 'Add Coach'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}