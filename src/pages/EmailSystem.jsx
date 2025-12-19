import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Mail, Send, FileText, Users, CheckCircle2, AlertCircle, Loader2, Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function EmailSystem() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('templates');
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    template_name: '',
    subject: '',
    html_content: '',
    text_content: '',
    template_type: 'custom'
  });
  const [testEmail, setTestEmail] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['emailTemplates'],
    queryFn: () => base44.entities.EmailTemplate.list()
  });

  const isAdmin = currentUser?.role === 'admin';

  const createTemplateMutation = useMutation({
    mutationFn: (data) => base44.entities.EmailTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['emailTemplates']);
      setShowTemplateDialog(false);
      setEditingTemplate(null);
      setTemplateForm({
        template_name: '',
        subject: '',
        html_content: '',
        text_content: '',
        template_type: 'custom'
      });
      toast.success('Template saved successfully');
    },
    onError: () => {
      toast.error('Failed to save template');
    }
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EmailTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['emailTemplates']);
      setShowTemplateDialog(false);
      setEditingTemplate(null);
      toast.success('Template updated successfully');
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id) => base44.entities.EmailTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['emailTemplates']);
      toast.success('Template deleted');
    }
  });

  const sendTestEmailMutation = useMutation({
    mutationFn: async ({ templateId, email }) => {
      const template = templates.find(t => t.id === templateId);
      return await base44.functions.invoke('sendEmail', {
        to: email,
        subject: template.subject,
        body: template.html_content
      });
    },
    onSuccess: () => {
      toast.success('Test email sent successfully');
      setTestEmail('');
    },
    onError: () => {
      toast.error('Failed to send test email');
    }
  });

  const initializeDefaultTemplates = async () => {
    const defaultTemplates = [
      {
        template_name: 'User Invitation',
        subject: 'You\'re invited to join Michigan Jaguars',
        template_type: 'invite',
        html_content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Michigan Jaguars!</h1>
            </div>
            <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Hi {{full_name}},</p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                You've been invited to join the Michigan Jaguars platform as a <strong>{{role}}</strong>. 
                Our platform helps you stay connected with your player's development, track progress, and communicate with coaches.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{app_url}}" style="background: #10b981; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Get Started
                </a>
              </div>
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                If you have any questions, please don't hesitate to reach out to your coach or club administrator.
              </p>
              <div style="border-top: 2px solid #e5e7eb; margin-top: 30px; padding-top: 20px; text-align: center;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">Michigan Jaguars Soccer Club</p>
              </div>
            </div>
          </div>
        `,
        text_content: 'You\'ve been invited to join Michigan Jaguars as {{role}}. Visit {{app_url}} to get started.',
        variables: ['full_name', 'role', 'app_url'],
        is_active: true
      },
      {
        template_name: 'Password Reset',
        subject: 'Reset your Michigan Jaguars password',
        template_type: 'reset_password',
        html_content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset Request</h1>
            </div>
            <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Hi {{full_name}},</p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                We received a request to reset your password. Click the button below to create a new password:
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{reset_url}}" style="background: #3b82f6; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Reset Password
                </a>
              </div>
              <p style="font-size: 14px; color: #6b7280;">
                This link will expire in 24 hours. If you didn't request a password reset, please ignore this email.
              </p>
              <div style="border-top: 2px solid #e5e7eb; margin-top: 30px; padding-top: 20px; text-align: center;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">Michigan Jaguars Soccer Club</p>
              </div>
            </div>
          </div>
        `,
        text_content: 'Reset your password: {{reset_url}}',
        variables: ['full_name', 'reset_url'],
        is_active: true
      },
      {
        template_name: 'Welcome Message',
        subject: 'Welcome to Michigan Jaguars!',
        template_type: 'welcome',
        html_content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 32px;">🎉 Welcome Aboard!</h1>
            </div>
            <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Hi {{full_name}},</p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                Welcome to the Michigan Jaguars family! We're thrilled to have you on board.
              </p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                Here's what you can do with your account:
              </p>
              <ul style="font-size: 16px; color: #374151; line-height: 1.8; padding-left: 20px;">
                <li>View player profiles and performance data</li>
                <li>Track development goals and progress</li>
                <li>Communicate with coaches</li>
                <li>Book individual training sessions</li>
                <li>Access training resources</li>
              </ul>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{app_url}}" style="background: #10b981; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Explore Your Dashboard
                </a>
              </div>
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                Need help? Check out our FAQ page or contact your coach.
              </p>
              <div style="border-top: 2px solid #e5e7eb; margin-top: 30px; padding-top: 20px; text-align: center;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">Michigan Jaguars Soccer Club</p>
              </div>
            </div>
          </div>
        `,
        text_content: 'Welcome to Michigan Jaguars! Visit {{app_url}} to explore your dashboard.',
        variables: ['full_name', 'app_url'],
        is_active: true
      }
    ];

    try {
      await Promise.all(defaultTemplates.map(t => base44.entities.EmailTemplate.create(t)));
      queryClient.invalidateQueries(['emailTemplates']);
      toast.success('Default templates initialized');
    } catch (error) {
      toast.error('Failed to initialize templates');
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setTemplateForm({
      template_name: template.template_name,
      subject: template.subject,
      html_content: template.html_content,
      text_content: template.text_content || '',
      template_type: template.template_type
    });
    setShowTemplateDialog(true);
  };

  const handleSaveTemplate = () => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data: templateForm });
    } else {
      createTemplateMutation.mutate(templateForm);
    }
  };

  const handleSendTest = () => {
    if (!selectedTemplate || !testEmail) return;
    sendTestEmailMutation.mutate({ templateId: selectedTemplate, email: testEmail });
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
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Mail className="w-8 h-8 text-blue-600" />
            Email System
          </h1>
          <p className="text-slate-600 mt-1">Manage email templates and send transactional emails</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Send Test
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates">
            <Card className="border-none shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Email Templates
                  </CardTitle>
                  <div className="flex gap-2">
                    {templates.length === 0 && (
                      <Button onClick={initializeDefaultTemplates} size="sm" className="bg-white text-purple-600 hover:bg-purple-50">
                        Initialize Defaults
                      </Button>
                    )}
                    <Button onClick={() => {
                      setEditingTemplate(null);
                      setTemplateForm({
                        template_name: '',
                        subject: '',
                        html_content: '',
                        text_content: '',
                        template_type: 'custom'
                      });
                      setShowTemplateDialog(true);
                    }} size="sm" className="bg-white text-purple-600 hover:bg-purple-50">
                      <Plus className="w-4 h-4 mr-1" />
                      New Template
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {templates.map((template) => (
                    <div key={template.id} className="p-4 bg-white border-2 border-slate-200 rounded-xl hover:border-purple-300 transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-bold text-slate-900">{template.template_name}</h4>
                            <Badge className="bg-purple-100 text-purple-800 text-xs">{template.template_type}</Badge>
                            {template.is_active && (
                              <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mb-2">Subject: {template.subject}</p>
                          {template.variables && template.variables.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {template.variables.map((v, i) => (
                                <span key={i} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                                  {`{{${v}}}`}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleEditTemplate(template)} className="h-8 px-2">
                            <Edit2 className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => {
                            if (confirm('Delete this template?')) {
                              deleteTemplateMutation.mutate(template.id);
                            }
                          }} className="h-8 px-2">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {templates.length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500 mb-4">No email templates yet</p>
                      <Button onClick={initializeDefaultTemplates} className="bg-purple-600 hover:bg-purple-700">
                        Initialize Default Templates
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="test">
            <Card className="border-none shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Send Test Email
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label>Select Template</Label>
                    <Select value={selectedTemplate || ''} onValueChange={setSelectedTemplate}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Choose a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.filter(t => t.is_active).map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.template_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Recipient Email</Label>
                    <Input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="test@example.com"
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    onClick={handleSendTest} 
                    disabled={!selectedTemplate || !testEmail || sendTestEmailMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {sendTestEmailMutation.isPending ? (
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit' : 'Create'} Email Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Template Name</Label>
                <Input value={templateForm.template_name} onChange={e => setTemplateForm({...templateForm, template_name: e.target.value})} className="mt-1" />
              </div>
              <div>
                <Label>Template Type</Label>
                <Select value={templateForm.template_type} onValueChange={v => setTemplateForm({...templateForm, template_type: v})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invite">Invite</SelectItem>
                    <SelectItem value="reset_password">Reset Password</SelectItem>
                    <SelectItem value="welcome">Welcome</SelectItem>
                    <SelectItem value="booking_confirmation">Booking Confirmation</SelectItem>
                    <SelectItem value="evaluation_notification">Evaluation Notification</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Subject</Label>
              <Input value={templateForm.subject} onChange={e => setTemplateForm({...templateForm, subject: e.target.value})} className="mt-1" />
            </div>
            <div>
              <Label>HTML Content</Label>
              <Textarea value={templateForm.html_content} onChange={e => setTemplateForm({...templateForm, html_content: e.target.value})} rows={12} className="mt-1 font-mono text-xs" />
            </div>
            <div>
              <Label>Plain Text (Optional)</Label>
              <Textarea value={templateForm.text_content} onChange={e => setTemplateForm({...templateForm, text_content: e.target.value})} rows={4} className="mt-1" />
            </div>
            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowTemplateDialog(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSaveTemplate} disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending} className="flex-1 bg-purple-600 hover:bg-purple-700">
                {(createTemplateMutation.isPending || updateTemplateMutation.isPending) ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {editingTemplate ? 'Update' : 'Create'} Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}