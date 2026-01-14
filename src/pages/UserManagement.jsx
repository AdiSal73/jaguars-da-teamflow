import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Shield, Users, Settings, Activity, Key } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

// Import new components
import UserDirectory from '@/components/usermanagement/UserDirectory';
import RolePermissionsManager from '@/components/usermanagement/RolePermissionsManager';
import UserActivityLog from '@/components/usermanagement/UserActivityLog';
import AccountSettings from '@/components/usermanagement/AccountSettings';

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('users');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: permissions = [] } = useQuery({
    queryKey: ['rolePermissions'],
    queryFn: () => base44.entities.RolePermissions.list()
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  // Check if current user is admin
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
            <CardDescription>
              You must be an administrator to access User Management.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">User Management & RBAC</h1>
              <p className="text-slate-600">Manage users, roles, permissions, and access control</p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Users</p>
                  <p className="text-2xl font-bold text-slate-900">{users.length}</p>
                </div>
                <Users className="w-8 h-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Admins</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {users.filter(u => u.role === 'admin').length}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Coaches</p>
                  <p className="text-2xl font-bold text-slate-900">{coaches.length}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Parents</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {users.filter(u => u.role === 'parent' || (u.player_ids && u.player_ids.length > 0)).length}
                  </p>
                </div>
                <Users className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Card className="border-none shadow-xl">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-slate-200 px-6 pt-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  User Directory
                </TabsTrigger>
                <TabsTrigger value="permissions" className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Role Permissions
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Activity Log
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="users" className="p-6">
              <UserDirectory 
                users={users}
                coaches={coaches}
                players={players}
                currentUser={currentUser}
              />
            </TabsContent>

            <TabsContent value="permissions" className="p-6">
              <RolePermissionsManager permissions={permissions} />
            </TabsContent>

            <TabsContent value="activity" className="p-6">
              <UserActivityLog users={users} />
            </TabsContent>

            <TabsContent value="settings" className="p-6">
              <AccountSettings />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}