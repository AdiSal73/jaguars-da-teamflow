import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Shield, Save, Users as UsersIcon, Plus, Edit2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function UserManagement() {
  const queryClient = useQueryClient();

  const { data: permissions = [] } = useQuery({
    queryKey: ['rolePermissions'],
    queryFn: () => base44.entities.RolePermissions.list()
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const [localPermissions, setLocalPermissions] = useState({
    admin: null,
    coach: null,
    user: null,
    parent: null
  });

  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editUserForm, setEditUserForm] = useState({ full_name: '', display_name: '', email: '', role: '', player_ids: [] });
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', full_name: '', role: 'user', player_ids: [] });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  useEffect(() => {
    const adminPerms = permissions.find(p => p.role_name === 'admin');
    const coachPerms = permissions.find(p => p.role_name === 'coach');
    const userPerms = permissions.find(p => p.role_name === 'user');
    const parentPerms = permissions.find(p => p.role_name === 'parent');

    setLocalPermissions({
      admin: adminPerms?.permissions || getDefaultPermissions('admin'),
      coach: coachPerms?.permissions || getDefaultPermissions('coach'),
      user: userPerms?.permissions || getDefaultPermissions('user'),
      parent: parentPerms?.permissions || getDefaultPermissions('parent')
    });
  }, [permissions]);

  const saveMutation = useMutation({
    mutationFn: async (role) => {
      const existing = permissions.find(p => p.role_name === role);
      const data = {
        role_name: role,
        permissions: localPermissions[role]
      };

      if (existing) {
        return base44.entities.RolePermissions.update(existing.id, data);
      } else {
        return base44.entities.RolePermissions.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['rolePermissions']);
      toast.success('Permissions saved');
    }
  });

  const createCoachMutation = useMutation({
    mutationFn: async (userData) => {
      return await base44.entities.Coach.create({
        full_name: userData.full_name,
        email: userData.email,
        specialization: 'General Coaching',
        booking_enabled: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['coaches']);
      toast.success('User promoted to coach');
    }
  });

  const removeCoachMutation = useMutation({
    mutationFn: async (email) => {
      const coach = coaches.find(c => c.email === email);
      if (coach) {
        await base44.entities.Coach.delete(coach.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['coaches']);
      toast.success('Coach role removed');
    }
  });

  const getUserRole = (user) => {
    if (user.role === 'admin') return 'admin';
    if (user.role === 'parent') return 'parent';
    const isCoach = coaches.find(c => c.email === user.email);
    if (isCoach) return 'coach';
    return 'user';
  };

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }) => {
      return base44.entities.User.update(userId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      queryClient.invalidateQueries(['currentUser']);
      setShowEditUserDialog(false);
      setEditingUser(null);
      toast.success('User updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update user: ' + error.message);
    }
  });

  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditUserForm({
      full_name: user.full_name || '',
      display_name: user.display_name || '',
      email: user.email || '',
      role: user.role || 'user',
      player_ids: user.player_ids || []
    });
    setShowEditUserDialog(true);
  };

  const inviteUserMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('sendInviteEmail', {
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        app_url: window.location.origin
      });
      return response.data;
    },
    onSuccess: (result) => {
      setShowInviteDialog(false);
      setInviteForm({ email: '', full_name: '', role: 'user', player_ids: [] });
      toast.success(`✅ Invitation sent to ${inviteForm.email}`);
    },
    onError: (error) => {
      toast.error('Failed to send invitation: ' + (error.response?.data?.error || error.message));
    }
  });

  const handleSaveUser = async () => {
    try {
      await updateUserMutation.mutateAsync({
        userId: editingUser.id,
        data: {
          display_name: editUserForm.display_name,
          role: editUserForm.role,
          player_ids: editUserForm.player_ids
        }
      });
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  };

  const toggleCoachRole = async (user) => {
    const currentRole = getUserRole(user);
    if (currentRole === 'admin') {
      toast.error('Cannot change admin users to coach. Remove admin role first.');
      return;
    }
    
    if (currentRole === 'coach') {
      if (window.confirm(`Remove coach role from ${user.full_name}?`)) {
        removeCoachMutation.mutate(user.email);
      }
    } else {
      if (window.confirm(`Promote ${user.full_name} to coach?`)) {
        createCoachMutation.mutate(user);
      }
    }
  };

  const getDefaultPermissions = (role) => {
    if (role === 'admin') {
      return {
        view_all_players: true,
        edit_all_players: true,
        view_all_teams: true,
        edit_all_teams: true,
        view_all_assessments: true,
        create_assessments: true,
        view_all_evaluations: true,
        create_evaluations: true,
        view_all_bookings: true,
        manage_bookings: true,
        view_all_training_plans: true,
        create_training_plans: true,
        manage_coaches: true,
        manage_users: true,
        access_club_management: true,
        send_messages: true
      };
    } else if (role === 'coach') {
      return {
        view_all_players: false,
        edit_all_players: false,
        view_all_teams: false,
        edit_all_teams: false,
        view_all_assessments: false,
        create_assessments: true,
        view_all_evaluations: false,
        create_evaluations: true,
        view_all_bookings: false,
        manage_bookings: true,
        view_all_training_plans: false,
        create_training_plans: true,
        manage_coaches: false,
        manage_users: false,
        access_club_management: false,
        send_messages: true
      };
    } else if (role === 'parent') {
      return {
        view_all_players: false,
        edit_all_players: false,
        view_all_teams: false,
        edit_all_teams: false,
        view_all_assessments: false,
        create_assessments: false,
        view_all_evaluations: false,
        create_evaluations: false,
        view_all_bookings: false,
        manage_bookings: false,
        view_all_training_plans: false,
        create_training_plans: false,
        manage_coaches: false,
        manage_users: false,
        access_club_management: false,
        send_messages: true
      };
    } else {
      return {
        view_all_players: false,
        edit_all_players: false,
        view_all_teams: false,
        edit_all_teams: false,
        view_all_assessments: false,
        create_assessments: false,
        view_all_evaluations: false,
        create_evaluations: false,
        view_all_bookings: false,
        manage_bookings: false,
        view_all_training_plans: false,
        create_training_plans: false,
        manage_coaches: false,
        manage_users: false,
        access_club_management: false,
        send_messages: false
      };
    }
  };

  const permissionLabels = {
    view_all_players: 'View All Players',
    edit_all_players: 'Edit All Players',
    view_all_teams: 'View All Teams',
    edit_all_teams: 'Edit All Teams',
    view_all_assessments: 'View All Assessments',
    create_assessments: 'Create Assessments',
    view_all_evaluations: 'View All Evaluations',
    create_evaluations: 'Create Evaluations',
    view_all_bookings: 'View All Bookings',
    manage_bookings: 'Manage Bookings',
    view_all_training_plans: 'View All Training Plans',
    create_training_plans: 'Create Training Plans',
    manage_coaches: 'Manage Coaches',
    manage_users: 'Manage Users',
    access_club_management: 'Access Club Management',
    send_messages: 'Send Messages'
  };

  const updatePermission = (role, permission, value) => {
    setLocalPermissions({
      ...localPermissions,
      [role]: {
        ...localPermissions[role],
        [permission]: value
      }
    });
  };

  if (!localPermissions.admin || !localPermissions.coach || !localPermissions.user || !localPermissions.parent) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Shield className="w-8 h-8 text-emerald-600" />
            User Management & RBAC
          </h1>
          <p className="text-slate-600 mt-1">Manage users and customize role-based access control</p>
        </div>
        <Button onClick={() => setShowInviteDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Mail className="w-4 h-4 mr-2" />
          Invite User
        </Button>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
          <TabsTrigger value="coach">Coach</TabsTrigger>
          <TabsTrigger value="user">Player</TabsTrigger>
          <TabsTrigger value="parent">Parent</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-emerald-600" />
                All Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => {
                    const userRole = getUserRole(user);
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.display_name || user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge className={
                            userRole === 'admin' ? 'bg-purple-100 text-purple-800' :
                            userRole === 'coach' ? 'bg-blue-100 text-blue-800' :
                            userRole === 'parent' ? 'bg-orange-100 text-orange-800' :
                            'bg-slate-100 text-slate-800'
                          }>
                            {userRole}
                          </Badge>
                          {userRole === 'parent' && (user.player_ids || []).length > 0 && (
                            <span className="ml-2 text-xs text-slate-500">
                              → {(user.player_ids || []).map(pid => players.find(p => p.id === pid)?.full_name).filter(Boolean).join(', ') || 'Unknown'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit2 className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleCoachRole(user)}
                              disabled={userRole === 'admin' || userRole === 'parent'}
                            >
                              {userRole === 'coach' ? 'Remove Coach' : 'Make Coach'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {['admin', 'coach', 'user', 'parent'].map(role => (
          <TabsContent key={role} value={role}>
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="capitalize">{role} Permissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.keys(permissionLabels).map(permission => (
                    <div key={permission} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <label htmlFor={`${role}-${permission}`} className="font-medium text-slate-900 cursor-pointer">
                        {permissionLabels[permission]}
                      </label>
                      <Switch
                        id={`${role}-${permission}`}
                        checked={localPermissions[role]?.[permission] || false}
                        onCheckedChange={(checked) => updatePermission(role, permission, checked)}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-6">
                  <Button
                    onClick={() => saveMutation.mutate(role)}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save {role.charAt(0).toUpperCase() + role.slice(1)} Permissions
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="mb-2 block">Display Name</Label>
              <Input
                value={editUserForm.display_name}
                onChange={(e) => setEditUserForm({ ...editUserForm, display_name: e.target.value })}
                placeholder="Display Name"
              />
              <p className="text-xs text-slate-500 mt-1">This is the name shown throughout the app</p>
            </div>
            <div>
              <Label className="mb-2 block">Account Name (Read-only)</Label>
              <Input
                value={editUserForm.full_name}
                readOnly
                className="bg-slate-100"
              />
            </div>
            <div>
              <Label className="mb-2 block">Email</Label>
              <Input
                type="email"
                value={editUserForm.email}
                readOnly
                className="bg-slate-100"
              />
              <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <Label className="mb-2 block">Role</Label>
              <Select value={editUserForm.role} onValueChange={(v) => setEditUserForm({ ...editUserForm, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Player</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {editUserForm.role === 'parent' && (
              <div>
                <Label className="mb-2 block">Assigned Players (Multiple)</Label>
                <div className="border rounded-md p-2 max-h-48 overflow-y-auto space-y-1">
                  {players.map(player => (
                    <label key={player.id} className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(editUserForm.player_ids || []).includes(player.id)}
                        onChange={(e) => {
                          const currentIds = editUserForm.player_ids || [];
                          if (e.target.checked) {
                            setEditUserForm({ ...editUserForm, player_ids: [...currentIds, player.id] });
                          } else {
                            setEditUserForm({ ...editUserForm, player_ids: currentIds.filter(id => id !== player.id) });
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{player.full_name}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-1">Parent will be able to view these players' dashboards</p>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowEditUserDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveUser} className="bg-emerald-600 hover:bg-emerald-700">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="mb-2 block">Full Name</Label>
              <Input
                value={inviteForm.full_name}
                onChange={(e) => setInviteForm({ ...inviteForm, full_name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label className="mb-2 block">Email *</Label>
              <Input
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label className="mb-2 block">Role</Label>
              <Select value={inviteForm.role} onValueChange={(v) => setInviteForm({ ...inviteForm, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Player</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {inviteForm.role === 'parent' && (
              <div>
                <Label className="mb-2 block">Assign to Players (Optional)</Label>
                <div className="border rounded-md p-2 max-h-48 overflow-y-auto space-y-1">
                  {players.map(player => (
                    <label key={player.id} className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(inviteForm.player_ids || []).includes(player.id)}
                        onChange={(e) => {
                          const currentIds = inviteForm.player_ids || [];
                          if (e.target.checked) {
                            setInviteForm({ ...inviteForm, player_ids: [...currentIds, player.id] });
                          } else {
                            setInviteForm({ ...inviteForm, player_ids: currentIds.filter(id => id !== player.id) });
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{player.full_name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setShowInviteDialog(false)}>Cancel</Button>
              <Button 
                onClick={() => {
                  if (confirm(`Send invitation email to ${inviteForm.email}?`)) {
                    inviteUserMutation.mutate(inviteForm);
                  }
                }}
                disabled={!inviteForm.email || inviteUserMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Mail className="w-4 h-4 mr-2" />
                {inviteUserMutation.isPending ? 'Sending...' : 'Send Invite'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
      );
      }