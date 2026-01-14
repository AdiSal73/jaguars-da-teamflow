import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Activity, Calendar, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import moment from 'moment';

export default function UserActivityLog({ users }) {
  // Fetch recent activity (using created users as proxy for now)
  const recentUsers = [...users]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 20);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            Recent User Activity
          </CardTitle>
          <CardDescription>
            Track user registrations and account changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentUsers.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No activity to show</p>
            ) : (
              recentUsers.map(user => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-semibold">
                      {(user.full_name || user.email)?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {user.full_name || 'Unnamed User'}
                      </p>
                      <p className="text-sm text-slate-600">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                      New Account
                    </Badge>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar className="w-4 h-4" />
                      {moment(user.created_date).fromNow()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity Statistics</CardTitle>
          <CardDescription>User account metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 rounded-lg">
              <p className="text-sm text-emerald-700 font-medium">New This Week</p>
              <p className="text-2xl font-bold text-emerald-900">
                {users.filter(u => 
                  moment(u.created_date).isAfter(moment().subtract(7, 'days'))
                ).length}
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700 font-medium">New This Month</p>
              <p className="text-2xl font-bold text-blue-900">
                {users.filter(u => 
                  moment(u.created_date).isAfter(moment().subtract(30, 'days'))
                ).length}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-700 font-medium">Total Users</p>
              <p className="text-2xl font-bold text-purple-900">{users.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}