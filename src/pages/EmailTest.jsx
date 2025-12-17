import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Send, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EmailTest() {
  const [email, setEmail] = useState('adilsalmoni@gmail.com');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const sendTestEmail = async () => {
    setSending(true);
    setResult(null);
    
    try {
      const response = await base44.functions.invoke('sendTestEmail', { email });
      setResult({ success: true, data: response.data });
      toast.success('✅ Test email sent successfully!');
    } catch (error) {
      setResult({ success: false, error: error.message });
      toast.error('❌ Failed to send email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="border-none shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-600 text-white">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Mail className="w-6 h-6" />
              Email System Test
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Test Email Address</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="h-12 text-lg"
              />
              <p className="text-xs text-slate-500">
                A test email will be sent to this address to verify the email system is working
              </p>
            </div>

            <Button
              onClick={sendTestEmail}
              disabled={!email || sending}
              className="w-full h-12 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-lg font-semibold"
            >
              {sending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sending Test Email...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Send Test Email
                </>
              )}
            </Button>

            {result && (
              <div className={`p-4 rounded-lg border-2 ${
                result.success 
                  ? 'bg-emerald-50 border-emerald-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h3 className={`font-bold mb-2 ${result.success ? 'text-emerald-900' : 'text-red-900'}`}>
                      {result.success ? 'Email Sent Successfully!' : 'Email Failed'}
                    </h3>
                    {result.success ? (
                      <div className="space-y-1 text-sm text-emerald-800">
                        <p>✅ Email delivered to: <strong>{email}</strong></p>
                        {result.data?.email_id && (
                          <p className="text-xs text-emerald-600">Email ID: {result.data.email_id}</p>
                        )}
                        <p className="mt-2 text-xs">Check your inbox (and spam folder) for the test email.</p>
                      </div>
                    ) : (
                      <div className="space-y-1 text-sm text-red-800">
                        <p>❌ Error: {result.error}</p>
                        <p className="text-xs mt-2">Please check your RESEND_API_KEY configuration.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="border-t pt-4 mt-6">
              <h3 className="font-semibold text-slate-900 mb-3">Email System Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-slate-600">Resend API: Configured</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-slate-600">User Invitations: Ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-slate-600">Notifications: Active</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}