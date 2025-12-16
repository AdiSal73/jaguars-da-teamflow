import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, Mail, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function CommunicationPreferences() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: preferences } = useQuery({
    queryKey: ['commPreferences'],
    queryFn: async () => {
      const prefs = await base44.entities.CommunicationPreferences.filter({ user_email: user.email });
      return prefs[0] || null;
    },
    enabled: !!user
  });

  const [localPrefs, setLocalPrefs] = useState({
    email_notifications_enabled: true,
    notification_types: {
      evaluations: true,
      assessments: true,
      bookings: true,
      announcements: true,
      training_plans: true,
      goals: true
    },
    email_frequency: 'immediate'
  });

  React.useEffect(() => {
    if (preferences) {
      setLocalPrefs({
        email_notifications_enabled: preferences.email_notifications_enabled ?? true,
        notification_types: preferences.notification_types || {
          evaluations: true,
          assessments: true,
          bookings: true,
          announcements: true,
          training_plans: true,
          goals: true
        },
        email_frequency: preferences.email_frequency || 'immediate'
      });
    }
  }, [preferences]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (preferences?.id) {
        return base44.entities.CommunicationPreferences.update(preferences.id, data);
      } else {
        return base44.entities.CommunicationPreferences.create({
          user_email: user.email,
          ...data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['commPreferences']);
      toast.success('Preferences saved');
    }
  });

  const handleSave = () => {
    saveMutation.mutate(localPrefs);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Bell className="w-8 h-8 text-emerald-600" />
          Communication Preferences
        </h1>
        <p className="text-slate-600 mt-1">Manage how you receive notifications and updates</p>
      </div>

      <div className="space-y-6">
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-600" />
              Email Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <Label className="font-semibold text-slate-900">Enable Email Notifications</Label>
                <p className="text-xs text-slate-600 mt-1">Receive updates via email</p>
              </div>
              <Switch
                checked={localPrefs.email_notifications_enabled}
                onCheckedChange={(checked) => setLocalPrefs({...localPrefs, email_notifications_enabled: checked})}
              />
            </div>

            {localPrefs.email_notifications_enabled && (
              <>
                <div>
                  <Label className="mb-3 block font-semibold">Email Frequency</Label>
                  <Select value={localPrefs.email_frequency} onValueChange={(v) => setLocalPrefs({...localPrefs, email_frequency: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate (as they happen)</SelectItem>
                      <SelectItem value="daily_digest">Daily Digest</SelectItem>
                      <SelectItem value="weekly_digest">Weekly Digest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-3 block font-semibold">Notification Types</Label>
                  <div className="space-y-3">
                    {[
                      { key: 'evaluations', label: 'Player Evaluations', desc: 'New evaluations and feedback' },
                      { key: 'assessments', label: 'Physical Assessments', desc: 'Assessment results and progress' },
                      { key: 'bookings', label: 'Booking Updates', desc: 'Session confirmations and changes' },
                      { key: 'announcements', label: 'Team Announcements', desc: 'Important team news and updates' },
                      { key: 'training_plans', label: 'Training Plans', desc: 'New training modules and updates' },
                      { key: 'goals', label: 'Goal Updates', desc: 'Progress on development goals' }
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                        <div>
                          <Label className="font-medium text-slate-900">{item.label}</Label>
                          <p className="text-xs text-slate-600">{item.desc}</p>
                        </div>
                        <Switch
                          checked={localPrefs.notification_types[item.key]}
                          onCheckedChange={(checked) => setLocalPrefs({
                            ...localPrefs,
                            notification_types: {...localPrefs.notification_types, [item.key]: checked}
                          })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
                <Save className="w-4 h-4 mr-2" />
                Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}