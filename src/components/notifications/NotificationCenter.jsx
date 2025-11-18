import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, Check, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link } from 'react-router-dom';
import NotificationSettingsDialog from './NotificationSettingsDialog';

export default function NotificationCenter() {
  const [showSettings, setShowSettings] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter({ user_email: user.email }, '-created_date', 50),
    enabled: !!user
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { read: true }),
    onSuccess: () => queryClient.invalidateQueries(['notifications'])
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['notifications'])
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const typeIcons = {
    game: '⚽',
    training: '🏃',
    assessment: '📊',
    evaluation: '📝',
    performance: '📈',
    goal: '🎯',
    training_plan: '📋',
    message: '💬'
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
                {unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="end">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Notifications</h3>
            <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>
          <ScrollArea className="h-96">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-slate-50 transition-colors ${!notification.read ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className="text-2xl">{typeIcons[notification.type]}</div>
                      <div className="flex-1 min-w-0">
                        {notification.link ? (
                          <Link to={notification.link} onClick={() => markAsReadMutation.mutate(notification.id)}>
                            <div className="font-semibold text-slate-900 hover:text-emerald-600">
                              {notification.title}
                            </div>
                            <p className="text-sm text-slate-600 line-clamp-2">{notification.message}</p>
                            <p className="text-xs text-slate-400 mt-1">
                              {new Date(notification.created_date).toLocaleString()}
                            </p>
                          </Link>
                        ) : (
                          <>
                            <div className="font-semibold text-slate-900">{notification.title}</div>
                            <p className="text-sm text-slate-600 line-clamp-2">{notification.message}</p>
                            <p className="text-xs text-slate-400 mt-1">
                              {new Date(notification.created_date).toLocaleString()}
                            </p>
                          </>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => markAsReadMutation.mutate(notification.id)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => deleteNotificationMutation.mutate(notification.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      <NotificationSettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
      />
    </>
  );
}