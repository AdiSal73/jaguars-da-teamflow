import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function GoogleCalendarConnectDialog({ open, onClose }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  const checkConnection = async () => {
    try {
      setIsChecking(true);
      const response = await base44.functions.invoke('connectGoogleCalendar', {});
      setIsConnected(response.data.connected);
      setUserEmail(response.data.email);
    } catch (error) {
      console.error('Error checking connection:', error);
      toast.error('Failed to check connection status');
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (open) {
      checkConnection();
    }
  }, [open]);

  const handleConnect = () => {
    // Redirect to Google Calendar OAuth flow
    const authUrl = base44.auth.getOAuthURL('googlecalendar', [
      'https://www.googleapis.com/auth/calendar.events'
    ]);
    window.location.href = authUrl;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            Google Calendar Sync
          </DialogTitle>
          <DialogDescription>
            Connect your Google Calendar to automatically sync all your bookings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {isChecking ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : (
            <>
              <div className={`p-4 rounded-lg border-2 ${
                isConnected 
                  ? 'bg-emerald-50 border-emerald-200' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-start gap-3">
                  {isConnected ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 mt-0.5" />
                  ) : (
                    <XCircle className="w-6 h-6 text-slate-400 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`font-semibold ${isConnected ? 'text-emerald-900' : 'text-slate-700'}`}>
                      {isConnected ? 'Connected' : 'Not Connected'}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      {isConnected 
                        ? `Your account (${userEmail}) is connected to Google Calendar. All your bookings will be automatically synced.`
                        : 'Connect your Google Calendar to enable automatic booking synchronization.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {!isConnected && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900 font-semibold mb-2">Benefits of connecting:</p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>✓ Automatic sync of all your bookings</li>
                    <li>✓ Real-time updates when bookings change</li>
                    <li>✓ Calendar reminders and notifications</li>
                    <li>✓ View all sessions in one place</li>
                  </ul>
                </div>
              )}

              <div className="flex gap-3">
                {isConnected ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={checkConnection}
                      className="flex-1"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh Status
                    </Button>
                    <Button
                      onClick={onClose}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    >
                      Done
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={onClose}
                      className="flex-1"
                    >
                      Maybe Later
                    </Button>
                    <Button
                      onClick={handleConnect}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Connect Calendar
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}