import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Mail, UserPlus, Edit2, UserCog, Search, Filter, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

import InviteUserDialog from './InviteUserDialog';
import EditUserDialog from './EditUserDialog';
import BulkRoleEditDialog from './BulkRoleEditDialog';

export default function UserDirectory({ users, coaches, players, currentUser }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Get user's effective role
  const getUserRole = (user) => {
    if (user.role === 'admin') return 'admin';
    if (user.role === 'director') return 'director';
    const isCoach = coaches.find(c => c.email === user.email);
    if (isCoach) return 'coach';
    if (user.player_ids && user.player_ids.length > 0) return 'parent';
    if (user.role === 'player') return 'player';
    return user.role || 'user';
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const userRole = getUserRole(user);
    const matchesRole = roleFilter === 'all' || userRole === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Act as user
  const handleActAsUser = (user) => {
    if (window.confirm(`Act as ${user.full_name || user.email}? You will see the app as this user.`)) {
      localStorage.setItem('actingAsUser', JSON.stringify(user));
      const userRole = getUserRole(user);
      if (userRole === 'parent') {
        window.location.href = createPageUrl('ParentPortal');
      } else {
        window.location.reload();
      }
    }
  };

  // Edit user
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowEditDialog(true);
  };

  // Bulk role update
  const handleBulkRoleUpdate = async (userIds, newRole) => {
    toast.info(`Updating ${userIds.length} users...`);
    
    for (const userId of userIds) {
      try {
        const user = users.find(u => u.id === userId);
        if (!user) continue;
        
        // For parent role, ensure they have player_ids
        if (newRole === 'parent') {
          const userPlayers = players.filter(p => 
            p.parent_emails?.some(e => e.toLowerCase() === user.email.toLowerCase())
          );
          const playerIds = userPlayers.map(p => p.id);
          
          await base44.asServiceRole.entities.User.update(userId, {
            player_ids: playerIds
          });
        }
      } catch (error) {
        console.error(`Failed to update user ${userId}:`, error);
      }
    }
    
    queryClient.invalidateQueries(['users']);
    toast.success(`Updated ${userIds.length} users to ${newRole} role`);
  };

  // Role badge styling
  const getRoleBadgeClass = (role) => {
    const styles = {
      admin: 'bg-purple-100 text-purple-800 border-purple-300',
      director: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      coach: 'bg-blue-100 text-blue-800 border-blue-300',
      parent: 'bg-orange-100 text-orange-800 border-orange-300',
      player: 'bg-green-100 text-green-800 border-green-300',
      user: 'bg-slate-100 text-slate-800 border-slate-300'
    };
    return styles[role] || styles.user;
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-4 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="director">Director</SelectItem>
              <SelectItem value="coach">Coach</SelectItem>
              <SelectItem value="parent">Parent</SelectItem>
              <SelectItem value="player">Player</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={() => setShowBulkEditDialog(true)}
            variant="outline"
          >
            <Users className="w-4 h-4 mr-2" />
            Bulk Edit Roles
          </Button>
          <Button 
            onClick={() => setShowInviteDialog(true)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite User
          </Button>
        </div>
      </div>

      {/* User Table */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-semibold">User</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold">Role</TableHead>
              <TableHead className="font-semibold">Linked Players</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map(user => {
                const userRole = getUserRole(user);
                const linkedPlayers = (user.player_ids || [])
                  .map(pid => players.find(p => p.id === pid)?.full_name)
                  .filter(Boolean);

                return (
                  <TableRow key={user.id} className="hover:bg-slate-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-semibold">
                          {(user.display_name || user.full_name || user.email)?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {user.display_name || user.full_name || 'Unnamed User'}
                          </p>
                          {user.display_name && user.full_name && user.display_name !== user.full_name && (
                            <p className="text-xs text-slate-500">{user.full_name}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getRoleBadgeClass(userRole)}>
                        {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {linkedPlayers.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {linkedPlayers.map((name, idx) => (
                            <Badge key={idx} variant="outline" className="bg-slate-50 text-slate-700">
                              {name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        {user.id !== currentUser.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleActAsUser(user)}
                            className="border-purple-300 text-purple-600 hover:bg-purple-50"
                          >
                            <UserCog className="w-3 h-3 mr-1" />
                            Act As
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Showing results count */}
      <p className="text-sm text-slate-600">
        Showing {filteredUsers.length} of {users.length} users
      </p>

      {/* Dialogs */}
      <InviteUserDialog 
        open={showInviteDialog}
        onClose={() => setShowInviteDialog(false)}
        players={players}
      />

      <EditUserDialog
        open={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        players={players}
        coaches={coaches}
      />

      <BulkRoleEditDialog
        open={showBulkEditDialog}
        onClose={() => setShowBulkEditDialog(false)}
        users={filteredUsers}
        onComplete={handleBulkRoleUpdate}
      />
    </div>
  );
}