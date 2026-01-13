import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar as CalendarIcon, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function GoogleCalendarSync({ booking, size = "default" }) {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);

  const { data: connectionStatus } = useQuery({
    queryKey: ['googleCalendarConnection'],
    queryFn: () => base44.functions.invoke('connectGoogleCalendar'),
    select: (response) => response.data
  });

  const syncMutation = useMutation({
    mutationFn: async (action) => {
      setSyncing(true);
      const response = await base44.functions.invoke('syncBookingToGoogleCalendar', {
        bookingId: booking.id,
        action: action || 'sync'
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['bookings']);
      queryClient.invalidateQueries(['myBookings']);
      toast.success(data.message || 'Synced with Google Calendar');
      setSyncing(false);
    },
    onError: (error) => {
      console.error('Sync error:', error);
      toast.error(error.message || 'Failed to sync with calendar');
      setSyncing(false);
    }
  });

  if (!connectionStatus?.connected) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
          <AlertCircle className="w-3 h-3 mr-1" />
          Calendar not connected
        </Badge>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const connectUrl = base44.connectors.getConnectURL('googlecalendar');
            window.open(connectUrl, '_blank');
          }}
          className="h-7 text-xs"
        >
          Connect Calendar
        </Button>
      </div>
    );
  }

  const isSynced = !!booking.google_calendar_event_id;

  if (size === "small") {
    return (
      <Button
        size="sm"
        variant={isSynced ? "outline" : "default"}
        onClick={() => syncMutation.mutate(isSynced ? 'delete' : 'sync')}
        disabled={syncing}
        className={`h-7 text-xs ${isSynced ? 'bg-green-50 text-green-700 hover:bg-red-50 hover:text-red-700' : ''}`}
      >
        {syncing ? (
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        ) : isSynced ? (
          <CheckCircle className="w-3 h-3 mr-1" />
        ) : (
          <CalendarIcon className="w-3 h-3 mr-1" />
        )}
        {syncing ? 'Syncing...' : isSynced ? 'Synced' : 'Add to Calendar'}
      </Button>
    );
  }

  return (
    <Card className={isSynced ? 'border-green-200 bg-green-50' : 'border-slate-200'}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isSynced ? 'bg-green-500' : 'bg-blue-500'
            }`}>
              {syncing ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : isSynced ? (
                <CheckCircle className="w-5 h-5 text-white" />
              ) : (
                <CalendarIcon className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <div className="font-semibold text-sm">
                {isSynced ? 'Synced with Google Calendar' : 'Sync to Google Calendar'}
              </div>
              <div className="text-xs text-slate-600">
                {isSynced ? 'Event is on your calendar' : 'Add this booking to your calendar'}
              </div>
            </div>
          </div>
          <Button
            onClick={() => syncMutation.mutate(isSynced ? 'delete' : 'sync')}
            disabled={syncing}
            variant={isSynced ? "outline" : "default"}
            className={isSynced ? 'hover:bg-red-50 hover:text-red-600' : 'bg-blue-600 hover:bg-blue-700'}
          >
            {syncing ? 'Syncing...' : isSynced ? 'Remove from Calendar' : 'Add to Calendar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}