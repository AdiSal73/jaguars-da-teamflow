import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Send, TestTube, Users, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function EmailSystem() {
  const [activeTab, setActiveTab] = useState('test');
  const [testEmail, setTestEmail] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('parent');
  const [inviteResult, setInviteResult] = useState(null);
  const [customTo, setCustomTo] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [customResult, setCustomResult] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const isAdmin = currentUser?.role === 'admin';

  const testEmailMutation = useMutation({
    mutationFn: async (email) => {
      return await base44.functions.invoke('sendTestEmail', { to: email });
    },
    onSuccess: () => {
      setTestResult({ success: true, message: `Test email sent to ${testEmail}` });
      toast.success('Test email sent successfully');
    },
    onError: (error) => {
      setTestResult({ success: false, message: error.message });
      toast.error('Failed to send test email');
    }
  });

  const inviteEmailMutation = useMutation({
    mutationFn: async ({ email, name, role }) => {
      return await base44.functions.invoke('sendInviteEmail', {
        recipient_email: email,
        full_name: name,
        role,
        app_url: window.location.origin
      });
    },
    onSuccess: () => {
      setInviteResult({ success: true, message: `Invitation sent to ${inviteEmail}` });
      toast.success('Invitation sent successfully');
      setInviteEmail('');
      setInviteName('');
    },
    onError: (error) => {
      setInviteResult({ success: false, message: error.message });
      toast.error('Failed to send invitation');
    }
  });

  const customEmailMutation = useMutation({
    mutationFn: async ({ to, subject, content }) => {
      return await base44.functions.invoke('sendEmail', { to, subject, body: content });
    },
    onSuccess: () => {
      setCustomResult({ success: true, message: `Email sent to ${customTo}` });
      toast.success('Email sent successfully');
      setCustomTo('');
      setCustomSubject('');
      setCustomMessage('');
    },
    onError: (error) => {
      setCustomResult({ success: false, message: error.message });
      toast.error('Failed to send email');
    }
  });

  const handleConfirmAction = () => {
    if (!pendingAction) return;
    
    if (pendingAction.type === 'test') {
      testEmailMutation.mutate(pendingAction.data.email);
    } else if (pendingAction.type === 'invite') {
      inviteEmailMutation.mutate(pendingAction.data);
    } else if (pendingAction.type === 'custom') {
      customEmailMutation.mutate(pendingAction.data);
    }
    
    setShowConfirm(false);
    setPendingAction(null);
  };

  const handleTestEmail = (e) => {
    e.preventDefault();
    setPendingAction({ type: 'test', data: { email: testEmail } });
    setShowConfirm(true);
  };

  const handleInvite = (e) => {
    e.preventDefault();
    setPendingAction({ 
      type: 'invite', 
      data: { email: inviteEmail, name: inviteName, role: inviteRole } 
    });
    setShowConfirm(true);
  };

  const handleCustomEmail = (e) => {
    e.preventDefault();
    setPendingAction({ 
      type: 'custom', 
      data: { to: customTo, subject: customSubject, content: customMessage } 
    });
    setShowConfirm(true);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-slate-600">Only administrators can access the email system.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Mail className="w-8 h-8 text-blue-600" />
            Email System
          </h1>
          <p className="text-slate-600 mt-1">Send test emails, invitations, and custom messages</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="test" className="flex items-center gap-2">
              <TestTube className="w-4 h-4" />
              Test Email
            </TabsTrigger>
            <TabsTrigger value="invite" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Send Invitation
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Custom Email
            </TabsTrigger>
          </TabsList>

          <TabsContent value="test">
            <Card className="border-none shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="w-5 h-5" />
                  Send Test Email
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleTestEmail} className="space-y-4">
                  <div>
                    <Label>Recipient Email</Label>
                    <Input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="test@example.com"
                      className="mt-1"
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={testEmailMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {testEmailMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Test Email
                      </>
                    )}
                  </Button>
                </form>

                {testResult && (
                  <Alert className={`mt-4 ${testResult.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                    {testResult.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription className={testResult.success ? 'text-green-900' : 'text-red-900'}>
                      {testResult.message}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invite">
            <Card className="border-none shadow-xl">
              <CardHeader className="bg-gradient-to-r from-emerald-500 to-green-500 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Send User Invitation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      placeholder="John Doe"
                      className="mt-1"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label>Email Address</Label>
                    <Input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="mt-1"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label>Role</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="coach">Coach</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={inviteEmailMutation.isPending}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    {inviteEmailMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Invitation
                      </>
                    )}
                  </Button>
                </form>

                {inviteResult && (
                  <Alert className={`mt-4 ${inviteResult.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                    {inviteResult.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription className={inviteResult.success ? 'text-green-900' : 'text-red-900'}>
                      {inviteResult.message}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="custom">
            <Card className="border-none shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Send Custom Email
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleCustomEmail} className="space-y-4">
                  <div>
                    <Label>To</Label>
                    <Input
                      type="email"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      placeholder="recipient@example.com"
                      className="mt-1"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label>Subject</Label>
                    <Input
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      placeholder="Email subject"
                      className="mt-1"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label>Message</Label>
                    <Textarea
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder="Email message..."
                      rows={8}
                      className="mt-1"
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={customEmailMutation.isPending}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {customEmailMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Email
                      </>
                    )}
                  </Button>
                </form>

                {customResult && (
                  <Alert className={`mt-4 ${customResult.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                    {customResult.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription className={customResult.success ? 'text-green-900' : 'text-red-900'}>
                      {customResult.message}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Email Send</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
              {pendingAction?.type === 'test' && (
                <>
                  <p className="text-sm font-semibold">Test Email</p>
                  <p className="text-sm text-slate-600">To: {pendingAction.data.email}</p>
                </>
              )}
              {pendingAction?.type === 'invite' && (
                <>
                  <p className="text-sm font-semibold">User Invitation</p>
                  <p className="text-sm text-slate-600">Name: {pendingAction.data.name}</p>
                  <p className="text-sm text-slate-600">Email: {pendingAction.data.email}</p>
                  <Badge className="bg-blue-100 text-blue-800">{pendingAction.data.role}</Badge>
                </>
              )}
              {pendingAction?.type === 'custom' && (
                <>
                  <p className="text-sm font-semibold">Custom Email</p>
                  <p className="text-sm text-slate-600">To: {pendingAction.data.to}</p>
                  <p className="text-sm text-slate-600">Subject: {pendingAction.data.subject}</p>
                </>
              )}
            </div>
            <p className="text-sm text-slate-600">Are you sure you want to send this email?</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowConfirm(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleConfirmAction} className="flex-1 bg-blue-600 hover:bg-blue-700">
                <Send className="w-4 h-4 mr-2" />
                Confirm & Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}