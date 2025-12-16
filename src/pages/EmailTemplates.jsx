import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Mail, Plus, Edit2, Trash2, Copy, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const DEFAULT_TEMPLATES = [
  {
    template_name: 'login',
    subject: 'Login to Soccer Club Portal',
    template_type: 'login',
    html_content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: #10b981; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">🔐 Login to Your Account</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #334155;">Hi {{user_name}},</p>
          <p style="font-size: 14px; color: #64748b; line-height: 1.6;">
            Click the button below to securely log in to your Soccer Club account.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{login_link}}" style="background-color: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Log In Now
            </a>
          </div>
          <p style="font-size: 12px; color: #94a3b8;">
            This link will expire in 15 minutes. If you didn't request this, please ignore this email.
          </p>
        </div>
      </div>
    `,
    text_content: 'Hi {{user_name}}, Click this link to log in: {{login_link}}',
    variables: ['user_name', 'login_link'],
    is_active: true
  },
  {
    template_name: 'password_recovery',
    subject: 'Reset Your Password - Soccer Club',
    template_type: 'password_recovery',
    html_content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: #3b82f6; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">🔑 Password Recovery</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #334155;">Hi {{user_name}},</p>
          <p style="font-size: 14px; color: #64748b; line-height: 1.6;">
            We received a request to reset your password. Click the button below to create a new password.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{reset_link}}" style="background-color: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="font-size: 12px; color: #94a3b8;">
            This link will expire in 1 hour. If you didn't request this, please ignore this email.
          </p>
        </div>
      </div>
    `,
    text_content: 'Hi {{user_name}}, Reset your password here: {{reset_link}}',
    variables: ['user_name', 'reset_link'],
    is_active: true
  },
  {
    template_name: 'welcome',
    subject: 'Welcome to Soccer Club! 🎉',
    template_type: 'welcome',
    html_content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: #10b981; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">⚽ Welcome to Soccer Club!</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #334155;">Hi {{user_name}},</p>
          <p style="font-size: 14px; color: #64748b; line-height: 1.6;">
            We're excited to have you join our soccer community! Your account has been created successfully.
          </p>
          <p style="font-size: 14px; color: #64748b; line-height: 1.6;">
            You can now access your player dashboard, track your progress, and communicate with coaches.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{dashboard_link}}" style="background-color: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
          <p style="font-size: 12px; color: #94a3b8;">
            If you have any questions, feel free to reach out to your coach.
          </p>
        </div>
      </div>
    `,
    text_content: 'Hi {{user_name}}, Welcome to Soccer Club! Access your dashboard: {{dashboard_link}}',
    variables: ['user_name', 'dashboard_link'],
    is_active: true
  }
];

export default function EmailTemplates() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testVariables, setTestVariables] = useState({});
  const [testingTemplate, setTestingTemplate] = useState(null);

  const [formData, setFormData] = useState({
    template_name: '',
    subject: '',
    html_content: '',
    text_content: '',
    template_type: 'custom',
    variables: [],
    is_active: true
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['emailTemplates'],
    queryFn: () => base44.entities.EmailTemplate.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.EmailTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['emailTemplates']);
      setShowDialog(false);
      resetForm();
      toast.success('Template created');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EmailTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['emailTemplates']);
      setShowDialog(false);
      setEditingTemplate(null);
      resetForm();
      toast.success('Template updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EmailTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['emailTemplates']);
      toast.success('Template deleted');
    }
  });

  const sendTestEmailMutation = useMutation({
    mutationFn: async ({ template, email, variables }) => {
      return base44.functions.invoke('sendResendEmail', {
        to: email,
        template_name: template.template_name,
        variables
      });
    },
    onSuccess: () => {
      toast.success('Test email sent');
      setShowTestDialog(false);
    },
    onError: () => {
      toast.error('Failed to send test email');
    }
  });

  const resetForm = () => {
    setFormData({
      template_name: '',
      subject: '',
      html_content: '',
      text_content: '',
      template_type: 'custom',
      variables: [],
      is_active: true
    });
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      template_name: template.template_name,
      subject: template.subject,
      html_content: template.html_content,
      text_content: template.text_content || '',
      template_type: template.template_type,
      variables: template.variables || [],
      is_active: template.is_active
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleInitializeDefaults = async () => {
    for (const template of DEFAULT_TEMPLATES) {
      const existing = templates.find(t => t.template_name === template.template_name);
      if (!existing) {
        await base44.entities.EmailTemplate.create(template);
      }
    }
    queryClient.invalidateQueries(['emailTemplates']);
    toast.success('Default templates initialized');
  };

  const handleTestEmail = (template) => {
    setTestingTemplate(template);
    const vars = {};
    (template.variables || []).forEach(v => {
      vars[v] = '';
    });
    setTestVariables(vars);
    setShowTestDialog(true);
  };

  const extractVariables = (text) => {
    const regex = /{{(\w+)}}/g;
    const matches = [...text.matchAll(regex)];
    return [...new Set(matches.map(m => m[1]))];
  };

  const handleContentChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      variables: [...new Set([
        ...extractVariables(field === 'html_content' ? value : prev.html_content),
        ...extractVariables(field === 'subject' ? value : prev.subject)
      ])]
    }));
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Mail className="w-8 h-8 text-emerald-600" />
            Email Templates
          </h1>
          <p className="text-slate-600 mt-1">Manage automated email templates for login, notifications, and more</p>
        </div>
        <div className="flex gap-2">
          {templates.length === 0 && (
            <Button onClick={handleInitializeDefaults} variant="outline" className="border-emerald-600 text-emerald-700">
              Initialize Defaults
            </Button>
          )}
          <Button onClick={() => { resetForm(); setShowDialog(true); }} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(template => (
          <Card key={template.id} className="border-none shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 border-b pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg text-slate-900">{template.template_name}</CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge className="text-xs bg-purple-100 text-purple-800">{template.template_type}</Badge>
                    {template.is_active ? (
                      <Badge className="text-xs bg-green-100 text-green-800">Active</Badge>
                    ) : (
                      <Badge className="text-xs bg-slate-100 text-slate-800">Inactive</Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleTestEmail(template)} className="h-7 w-7">
                    <Send className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(template)} className="h-7 w-7">
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(template.id)} className="h-7 w-7 hover:text-red-600">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div>
                  <div className="text-xs font-semibold text-slate-700">Subject:</div>
                  <div className="text-sm text-slate-600">{template.subject}</div>
                </div>
                {template.variables && template.variables.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-slate-700 mb-1">Variables:</div>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map(v => (
                        <code key={v} className="text-xs bg-slate-100 px-2 py-1 rounded">{`{{${v}}}`}</code>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <Mail className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">No email templates yet</p>
          <Button onClick={handleInitializeDefaults} className="bg-emerald-600 hover:bg-emerald-700">
            Initialize Default Templates
          </Button>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) { setEditingTemplate(null); resetForm(); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit' : 'New'} Email Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Template Name *</Label>
                <Input
                  value={formData.template_name}
                  onChange={(e) => setFormData({...formData, template_name: e.target.value})}
                  placeholder="e.g., booking_confirmation"
                  disabled={!!editingTemplate}
                />
              </div>
              <div>
                <Label>Template Type *</Label>
                <Select value={formData.template_type} onValueChange={v => setFormData({...formData, template_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="password_recovery">Password Recovery</SelectItem>
                    <SelectItem value="welcome">Welcome</SelectItem>
                    <SelectItem value="booking_confirmation">Booking Confirmation</SelectItem>
                    <SelectItem value="evaluation_notification">Evaluation Notification</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Subject Line *</Label>
              <Input
                value={formData.subject}
                onChange={(e) => handleContentChange('subject', e.target.value)}
                placeholder="e.g., Your booking is confirmed!"
              />
            </div>

            <div>
              <Label>HTML Content *</Label>
              <Textarea
                value={formData.html_content}
                onChange={(e) => handleContentChange('html_content', e.target.value)}
                rows={12}
                placeholder="Use {{variable_name}} for dynamic content"
                className="font-mono text-xs"
              />
            </div>

            <div>
              <Label>Plain Text Content (optional)</Label>
              <Textarea
                value={formData.text_content}
                onChange={(e) => setFormData({...formData, text_content: e.target.value})}
                rows={4}
                placeholder="Plain text version for email clients that don't support HTML"
              />
            </div>

            {formData.variables.length > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-semibold text-blue-900 mb-2">Detected Variables:</div>
                <div className="flex flex-wrap gap-2">
                  {formData.variables.map(v => (
                    <code key={v} className="text-xs bg-white px-2 py-1 rounded border border-blue-200">{`{{${v}}}`}</code>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
              />
              <Label>Active</Label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => { setShowDialog(false); setEditingTemplate(null); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!formData.template_name || !formData.subject || !formData.html_content} className="bg-emerald-600 hover:bg-emerald-700">
                <Save className="w-4 h-4 mr-2" />
                Save Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Send To</Label>
              <Input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
            {testingTemplate?.variables?.map(variable => (
              <div key={variable}>
                <Label>{variable}</Label>
                <Input
                  value={testVariables[variable] || ''}
                  onChange={(e) => setTestVariables({...testVariables, [variable]: e.target.value})}
                  placeholder={`Enter ${variable}`}
                />
              </div>
            ))}
            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowTestDialog(false)} className="flex-1">Cancel</Button>
              <Button 
                onClick={() => sendTestEmailMutation.mutate({ template: testingTemplate, email: testEmail, variables: testVariables })}
                disabled={!testEmail}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Test
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}