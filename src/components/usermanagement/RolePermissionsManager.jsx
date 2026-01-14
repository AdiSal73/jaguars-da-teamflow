import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Save, Shield, Users, UserCog, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const PERMISSION_LABELS = {
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

const DEFAULT_PERMISSIONS = {
  admin: {
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
  },
  director: {
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
    manage_coaches: false,
    manage_users: false,
    access_club_management: false,
    send_messages: true
  },
  coach: {
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
  },
  parent: {
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
  },
  player: {
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
  },
  user: {
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
  }
};

export default function RolePermissionsManager({ permissions }) {
  const queryClient = useQueryClient();
  const [localPerms, setLocalPerms] = useState(DEFAULT_PERMISSIONS);

  useEffect(() => {
    const updated = { ...DEFAULT_PERMISSIONS };
    permissions.forEach(perm => {
      if (perm.role_name && perm.permissions) {
        updated[perm.role_name] = { ...DEFAULT_PERMISSIONS[perm.role_name], ...perm.permissions };
      }
    });
    setLocalPerms(updated);
  }, [permissions]);

  const saveMutation = useMutation({
    mutationFn: async (role) => {
      const existing = permissions.find(p => p.role_name === role);
      const data = {
        role_name: role,
        permissions: localPerms[role]
      };

      if (existing) {
        return base44.entities.RolePermissions.update(existing.id, data);
      } else {
        return base44.entities.RolePermissions.create(data);
      }
    },
    onSuccess: (data, role) => {
      queryClient.invalidateQueries(['rolePermissions']);
      toast.success(`✅ ${role.charAt(0).toUpperCase() + role.slice(1)} permissions saved`);
    },
    onError: (error) => {
      toast.error(`❌ Failed to save: ${error.message}`);
    }
  });

  const updatePermission = (role, permission, value) => {
    setLocalPerms(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permission]: value
      }
    }));
  };

  const roleIcons = {
    admin: Shield,
    director: UserCog,
    coach: Users,
    parent: User,
    player: User,
    user: User
  };

  return (
    <Tabs defaultValue="admin" className="w-full">
      <TabsList className="grid w-full grid-cols-6">
        {Object.keys(DEFAULT_PERMISSIONS).map(role => {
          const Icon = roleIcons[role];
          return (
            <TabsTrigger key={role} value={role} className="capitalize">
              <Icon className="w-4 h-4 mr-2" />
              {role}
            </TabsTrigger>
          );
        })}
      </TabsList>

      {Object.keys(DEFAULT_PERMISSIONS).map(role => (
        <TabsContent key={role} value={role}>
          <Card>
            <CardHeader>
              <CardTitle className="capitalize">{role} Role Permissions</CardTitle>
              <CardDescription>
                Configure what users with the {role} role can do in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <label htmlFor={`${role}-${key}`} className="font-medium text-slate-900 cursor-pointer flex-1">
                      {label}
                    </label>
                    <Switch
                      id={`${role}-${key}`}
                      checked={localPerms[role]?.[key] || false}
                      onCheckedChange={(checked) => updatePermission(role, key, checked)}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => saveMutation.mutate(role)}
                  disabled={saveMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saveMutation.isPending ? 'Saving...' : `Save ${role.charAt(0).toUpperCase() + role.slice(1)} Permissions`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
}