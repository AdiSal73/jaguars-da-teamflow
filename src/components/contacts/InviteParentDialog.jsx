import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function InviteParentDialog({ open, onClose, contact }) {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const { data: templates = [] } = useQuery({
    queryKey: ['emailTemplates'],
    queryFn: () => base44.entities.EmailTemplate.list()
  });

  const inviteTemplate = templates.find(t => t.template_type === 'invite' && t.is_active);

  const inviteMutation = useMutation({
    mutationFn: async ({ email, name }) => {
      const response = await base44.functions.invoke('sendInviteEmail', {
        recipient_email: email,
        full_name: name,
        role: 'parent',
        app_url: window.location.origin
      });
      return response.data;
    },
    onSuccess: () => {
      setResult({ success: true, message: 'Invitation sent successfully!' });
      toast.success('Invitation sent successfully');
      setTimeout(() => {
        onClose();
        setResult(null);
      }, 2000);
    },
    onError: (error) => {
      setResult({ success: false, message: error.message || 'Failed to send invitation' });
      toast.error('Failed to send invitation');
    }
  });

  const handleSend = () => {
    setSending(true);
    inviteMutation.mutate({
      email: contact.email,
      name: contact.name
    });
  };

  const renderEmailPreview = () => {
    if (!inviteTemplate) {
      return (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">No invite template found. Please create an invite template in the Email System.</p>
        </div>
      );
    }

    let preview = inviteTemplate.html_content
      .replace(/\{\{full_name\}\}/g, contact.name || 'Parent')
      .replace(/\{\{role\}\}/g, 'parent')
      .replace(/\{\{app_url\}\}/g, window.location.origin);

    return (
      <div className="border-2 border-slate-200 rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
        <div className="bg-slate-50 p-3 border-b">
          <div className="text-xs text-slate-600 mb-1">Subject</div>
          <div className="font-semibold text-slate-900">{inviteTemplate.subject}</div>
        </div>
        <div 
          className="p-4 bg-white" 
          dangerouslySetInnerHTML={{ __html: preview }}
        />
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-emerald-600" />
            Send Parent Invitation
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="bg-emerald-50 p-4 rounded-lg border-2 border-emerald-200">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-bold text-emerald-900">{contact?.name}</p>
                <p className="text-sm text-emerald-700">{contact?.email}</p>
              </div>
              <Badge className="bg-purple-100 text-purple-800">Parent</Badge>
            </div>
            {contact?.player_ids && contact.player_ids.length > 0 && (
              <div className="mt-2 text-xs text-emerald-700">
                Associated with {contact.player_ids.length} player(s)
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Preview
            </h3>
            {renderEmailPreview()}
          </div>

          {result && (
            <div className={`p-4 rounded-lg border-2 flex items-start gap-3 ${
              result.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              {result.success ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p className={`font-semibold ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                  {result.success ? 'Success!' : 'Error'}
                </p>
                <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                  {result.message}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1"
              disabled={inviteMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSend} 
              disabled={inviteMutation.isPending || !inviteTemplate}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {inviteMutation.isPending ? (
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}