
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Shield, Save, Users as UsersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

  const [localPermissions, setLocalPermissions] = useState({
    admin: null,
    coach: null,
    user: null
  });

  useEffect(() => {
    const adminPerms = permissions.find(p => p.role_name === 'admin');
    const coachPerms = permissions.find(p => p.role_name === 'coach');
    const userPerms = permissions.find(p => p.role_name === 'user');

    setLocalPermissions({
      admin: adminPerms?.permissions || getDefaultPermissions('admin'),
      coach: coachPerms?.permissions || getDefaultPermissions('coach'),
      user: userPerms?.permissions || getDefaultPermissions('user')
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
    }
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }) => {
      // First, check if user exists in User entity (from the useQuery data)
      const user = users.find(u => u.id === userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Update the user's role
      return await base44.entities.User.update(userId, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
    },
    onError: (error) => {
      console.error('Failed to update user role:', error);
      alert('Failed to update user role. Please try again.');
    }
  });

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

  if (!localPermissions.admin || !localPermissions.coach || !localPermissions.user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Shield className="w-8 h-8 text-emerald-600" />
          User Management & RBAC
        </h1>
        <p className="text-slate-600 mt-1">Manage users and customize role-based access control</p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="admin">Admin Role</TabsTrigger>
          <TabsTrigger value="coach">Coach Role</TabsTrigger>
          <TabsTrigger value="user">User/Player Role</TabsTrigger>
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
                    <TableHead>Change Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'coach' ? 'bg-blue-100 text-blue-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {user.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={user.role} 
                          onValueChange={(role) => {
                            if (window.confirm(`Change ${user.full_name}'s role to ${role}?`)) {
                              updateUserRoleMutation.mutate({ userId: user.id, role });
                            }
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="coach">Coach</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {['admin', 'coach', 'user'].map(role => (
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
    </div>
  );
}
