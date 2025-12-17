import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, Users, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function EmailSystemManager() {
  const [testEmail, setTestEmail] = useState('');
  const [emailType, setEmailType] = useState('custom');
  const [recipientType, setRecipientType] = useState('individual');
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [testResult, setTestResult] = useState(null);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const testEmailMutation = useMutation({
    mutationFn: async (email) => {
      const response = await base44.functions.invoke('testEmailSystem', { test_email: email });
      return response.data;
    },
    onSuccess: (data) => {
      setTestResult(data);
      if (data.success) {
        toast.success('Test email sent successfully!');
      } else {
        toast.error('Test email failed: ' + data.error);
      }
    },
    onError: (error) => {
      toast.error('Error testing email: ' + error.message);
      setTestResult({ success: false, error: error.message });
    }
  });

  const sendEmailMutation = useMutation({
    mutationFn: async ({ to, subject, html }) => {
      const response = await base44.functions.invoke('sendEmail', {
        to,
        subject,
        html,
        text: message
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Email sent successfully!');
      setSubject('');
      setMessage('');
      setSelectedRecipients([]);
    },
    onError: (error) => {
      toast.error('Failed to send email: ' + error.message);
    }
  });

  const inviteUserMutation = useMutation({
    mutationFn: async ({ email, full_name, role }) => {
      const response = await base44.functions.invoke('sendInviteEmail', {
        email,
        full_name,
        role,
        app_url: window.location.origin
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Invitation sent successfully!');
    },
    onError: (error) => {
      toast.error('Failed to send invitation: ' + error.message);
    }
  });

  const handleTestEmail = () => {
    if (!testEmail) {
      toast.error('Please enter a test email address');
      return;
    }
    testEmailMutation.mutate(testEmail);
  };

  const handleSendEmail = () => {
    if (!subject || !message) {
      toast.error('Subject and message are required');
      return;
    }

    let recipients = [];
    if (recipientType === 'individual' && selectedRecipients.length > 0) {
      recipients = selectedRecipients;
    } else if (recipientType === 'all_users') {
      recipients = users.map(u => u.email).filter(Boolean);
    } else if (recipientType === 'all_coaches') {
      recipients = coaches.map(c => c.email).filter(Boolean);
    } else if (recipientType === 'all_parents') {
      recipients = users.filter(u => u.player_ids?.length > 0).map(u => u.email).filter(Boolean);
    }

    if (recipients.length === 0) {
      toast.error('No recipients selected');
      return;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; width: 60px; height: 60px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 12px; margin-bottom: 20px;"></div>
          <h1 style="color: #10b981; margin: 0;">Soccer Club</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 12px; margin-bottom: 20px;">
          <div style="font-size: 16px; color: #334155; white-space: pre-wrap;">${message}</div>
        </div>
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">
          Soccer Club Management System
        </p>
      </div>
    `;

    sendEmailMutation.mutate({ to: recipients, subject, html });
  };

  const handleInviteUser = (email, name, role) => {
    if (!email || !name) {
      toast.error('Email and name are required');
      return;
    }
    inviteUserMutation.mutate({ email, full_name: name, role });
  };

  return (
    <div className="space-y-6">
      {/* Email System Test */}
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email System Test
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="Enter test email address"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleTestEmail}
              disabled={testEmailMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {testEmailMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Test
            </Button>
          </div>

          {testResult && (
            <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-start gap-3">
                {testResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className={`font-semibold ${testResult.success ? 'text-green-900' : 'text-red-900'}`}>
                    {testResult.success ? 'Email sent successfully!' : 'Email failed'}
                  </div>
                  {testResult.message && (
                    <div className="text-sm text-slate-600 mt-1">{testResult.message}</div>
                  )}
                  {testResult.error && (
                    <div className="text-sm text-red-700 mt-1">Error: {testResult.error}</div>
                  )}
                  {testResult.details && (
                    <pre className="text-xs mt-2 bg-white p-2 rounded overflow-auto">
                      {JSON.stringify(testResult.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Custom Email */}
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Send Email
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <Label>Recipient Type</Label>
            <Select value={recipientType} onValueChange={setRecipientType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual Users</SelectItem>
                <SelectItem value="all_users">All Users</SelectItem>
                <SelectItem value="all_coaches">All Coaches</SelectItem>
                <SelectItem value="all_parents">All Parents</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {recipientType === 'individual' && (
            <div>
              <Label>Select Recipients</Label>
              <Select value={selectedRecipients[0]} onValueChange={(v) => setSelectedRecipients([v])}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.email}>{user.full_name} ({user.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
            />
          </div>

          <div>
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              placeholder="Email message..."
            />
          </div>

          <Button 
            onClick={handleSendEmail}
            disabled={sendEmailMutation.isPending}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {sendEmailMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Send Email
          </Button>
        </CardContent>
      </Card>

      {/* Quick Invite Users */}
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Quick Invite
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {[
              { email: '', name: '', role: 'coach', label: 'Invite Coach' },
              { email: '', name: '', role: 'parent', label: 'Invite Parent' },
              { email: '', name: '', role: 'user', label: 'Invite User' }
            ].map((template, idx) => (
              <div key={idx} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-xs">Email</Label>
                  <Input
                    placeholder="email@example.com"
                    id={`invite-email-${idx}`}
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs">Name</Label>
                  <Input
                    placeholder="Full Name"
                    id={`invite-name-${idx}`}
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    const email = document.getElementById(`invite-email-${idx}`).value;
                    const name = document.getElementById(`invite-name-${idx}`).value;
                    if (email && name) {
                      handleInviteUser(email, name, template.role);
                    } else {
                      toast.error('Email and name required');
                    }
                  }}
                  disabled={inviteUserMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {template.label}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}