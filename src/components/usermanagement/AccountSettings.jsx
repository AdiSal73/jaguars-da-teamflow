import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings, Bell, Shield, Mail } from 'lucide-react';

export default function AccountSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600" />
            System Settings
          </CardTitle>
          <CardDescription>
            Configure system-wide user management settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex-1">
              <Label className="font-medium text-slate-900">Email Verification Required</Label>
              <p className="text-sm text-slate-600 mt-1">
                Require new users to verify their email address before accessing the system
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex-1">
              <Label className="font-medium text-slate-900">Two-Factor Authentication</Label>
              <p className="text-sm text-slate-600 mt-1">
                Enable 2FA for all admin accounts
              </p>
            </div>
            <Switch />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex-1">
              <Label className="font-medium text-slate-900">Auto-Lock Inactive Accounts</Label>
              <p className="text-sm text-slate-600 mt-1">
                Automatically lock accounts inactive for 90 days
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-600" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Configure admin notifications for user activity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex-1">
              <Label className="font-medium text-slate-900">New User Registrations</Label>
              <p className="text-sm text-slate-600 mt-1">
                Notify admins when new users register
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex-1">
              <Label className="font-medium text-slate-900">Role Changes</Label>
              <p className="text-sm text-slate-600 mt-1">
                Notify when user roles are modified
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex-1">
              <Label className="font-medium text-slate-900">Security Alerts</Label>
              <p className="text-sm text-slate-600 mt-1">
                Notify on suspicious login attempts
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Settings className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}