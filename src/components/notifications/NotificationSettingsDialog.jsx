import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

export default function NotificationSettingsDialog({ open, onOpenChange }) {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: settings } = useQuery({
    queryKey: ['notificationSettings', user?.email],
    queryFn: async () => {
      const allSettings = await base44.entities.NotificationSettings.list();
      const userSettings = allSettings.find(s => s.user_email === user.email);
      return userSettings || {
        user_email: user.email,
        game_notifications: true,
        training_notifications: true,
        assessment_notifications: true,
        evaluation_notifications: true,
        performance_notifications: true,
        goal_notifications: true,
        training_plan_notifications: true,
        message_notifications: true
      };
    },
    enabled: !!user
  });

  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    if (settings) setLocalSettings(settings);
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (settings?.id) {
        return base44.entities.NotificationSettings.update(settings.id, data);
      } else {
        return base44.entities.NotificationSettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notificationSettings']);
      onOpenChange(false);
    }
  });

  const notificationTypes = [
    { key: 'game_notifications', label: 'Game & Match Updates' },
    { key: 'training_notifications', label: 'Training Session Reminders' },
    { key: 'assessment_notifications', label: 'New Physical Assessments' },
    { key: 'evaluation_notifications', label: 'New Evaluations' },
    { key: 'performance_notifications', label: 'Performance Changes' },
    { key: 'goal_notifications', label: 'Goal Achievements' },
    { key: 'training_plan_notifications', label: 'Training Plan Updates' },
    { key: 'message_notifications', label: 'New Messages' }
  ];

  if (!localSettings) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Notification Preferences</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {notificationTypes.map(type => (
            <div key={type.key} className="flex items-center justify-between">
              <Label htmlFor={type.key} className="cursor-pointer">{type.label}</Label>
              <Switch
                id={type.key}
                checked={localSettings[type.key]}
                onCheckedChange={(checked) => setLocalSettings({...localSettings, [type.key]: checked})}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => saveMutation.mutate(localSettings)} className="bg-emerald-600 hover:bg-emerald-700">
            Save Preferences
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}