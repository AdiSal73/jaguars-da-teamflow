import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit2, Trash2, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EmailTemplateManager({ onTemplateSelect }) {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [testEmail, setTestEmail] = useState('');
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testingTemplate, setTestingTemplate] = useState(null);

  const [form, setForm] = useState({
    template_name: '',
    subject: '',
    html_content: '',
    template_type: 'custom',
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

  const sendTestMutation = useMutation({
    mutationFn: async ({ template, email }) => {
      const appUrl = 'https://jaguarsidp.com';
      let html = template.html_content
        .replace(/\{\{full_name\}\}/g, 'Test User')
        .replace(/\{\{role\}\}/g, 'Admin')
        .replace(/\{\{app_url\}\}/g, appUrl)
        .replace(/\{\{user_name\}\}/g, 'Test User')
        .replace(/\{\{dashboard_link\}\}/g, appUrl)
        .replace(/\{\{reset_url\}\}/g, appUrl)
        .replace(/\{\{login_link\}\}/g, appUrl);
      
      return await base44.functions.invoke('sendEmail', {
        to: email,
        subject: template.subject,
        html,
        from: 'Michigan Jaguars <Academy@jaguarsidp.com>'
      });
    },
    onSuccess: () => {
      toast.success('Test email sent');
      setShowTestDialog(false);
      setTestEmail('');
    },
    onError: () => {
      toast.error('Failed to send test email');
    }
  });

  const resetForm = () => {
    setForm({
      template_name: '',
      subject: '',
      html_content: '',
      template_type: 'custom',
      is_active: true
    });
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setForm({
      template_name: template.template_name,
      subject: template.subject,
      html_content: template.html_content,
      template_type: template.template_type,
      is_active: template.is_active
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Email Templates</h3>
        <Button onClick={() => { resetForm(); setShowDialog(true); }} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-1" />New Template
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {templates.map(t => (
          <Card key={t.id} className="border shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-bold text-sm">{t.template_name}</h4>
                  <p className="text-xs text-slate-600 mt-1">{t.subject}</p>
                  <div className="flex gap-1 mt-2">
                    <Badge className="text-xs bg-purple-100 text-purple-800">{t.template_type}</Badge>
                    {t.is_active && <Badge className="text-xs bg-green-100 text-green-800">Active</Badge>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => { setTestingTemplate(t); setShowTestDialog(true); }} className="h-7 w-7 p-0">
                    <Send className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(t)} className="h-7 w-7 p-0">
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(t.id)} className="h-7 w-7 p-0 hover:text-red-600">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) { setEditingTemplate(null); resetForm(); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit' : 'New'} Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Template Name</Label>
                <Input value={form.template_name} onChange={e => setForm({...form, template_name: e.target.value})} />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.template_type} onValueChange={v => setForm({...form, template_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invite">Invite</SelectItem>
                    <SelectItem value="reset_password">Reset Password</SelectItem>
                    <SelectItem value="welcome">Welcome</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Subject</Label>
              <Input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} />
            </div>
            <div>
              <Label>HTML Content</Label>
              <Textarea value={form.html_content} onChange={e => setForm({...form, html_content: e.target.value})} rows={12} className="font-mono text-xs" />
              <p className="text-xs text-slate-500 mt-1">Use variables: {'{{full_name}}'}, {'{{role}}'}, {'{{app_url}}'}</p>
            </div>
            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSave} disabled={!form.template_name || !form.subject || !form.html_content} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Send To</Label>
              <Input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="test@example.com" />
            </div>
            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowTestDialog(false)} className="flex-1">Cancel</Button>
              <Button 
                onClick={() => sendTestMutation.mutate({ template: testingTemplate, email: testEmail })}
                disabled={!testEmail || sendTestMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {sendTestMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Send Test
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}