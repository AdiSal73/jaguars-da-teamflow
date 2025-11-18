import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Upload, FileText, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function PlayerDocuments({ playerId }) {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documentForm, setDocumentForm] = useState({
    title: '',
    document_type: 'other',
    notes: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['playerDocuments', playerId],
    queryFn: () => base44.entities.PlayerDocument.filter({ player_id: playerId }, '-created_date')
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async (data) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
      return base44.entities.PlayerDocument.create({
        ...data,
        file_url,
        uploaded_by: user?.email || ''
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['playerDocuments']);
      setShowUploadDialog(false);
      setSelectedFile(null);
      setDocumentForm({
        title: '',
        document_type: 'other',
        notes: ''
      });
    }
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (id) => base44.entities.PlayerDocument.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['playerDocuments'])
  });

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    await uploadDocumentMutation.mutateAsync({
      player_id: playerId,
      ...documentForm
    });
    setUploading(false);
  };

  const typeColors = {
    medical: 'bg-red-100 text-red-800',
    agreement: 'bg-blue-100 text-blue-800',
    certificate: 'bg-emerald-100 text-emerald-800',
    photo: 'bg-purple-100 text-purple-800',
    other: 'bg-slate-100 text-slate-800'
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-lg">
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <CardTitle>Player Documents</CardTitle>
            <Button onClick={() => setShowUploadDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No documents uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3 flex-1">
                    <FileText className="w-8 h-8 text-emerald-600" />
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">{doc.title}</div>
                      <div className="flex gap-2 mt-1">
                        <Badge className={typeColors[doc.document_type]}>{doc.document_type}</Badge>
                        <span className="text-xs text-slate-500">
                          Uploaded {new Date(doc.created_date).toLocaleDateString()}
                        </span>
                      </div>
                      {doc.notes && (
                        <p className="text-sm text-slate-600 mt-1">{doc.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => window.open(doc.file_url, '_blank')}>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (window.confirm('Delete this document?')) {
                          deleteDocumentMutation.mutate(doc.id);
                        }
                      }}
                      className="hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Document Title *</Label>
              <Input 
                value={documentForm.title} 
                onChange={(e) => setDocumentForm({...documentForm, title: e.target.value})}
                placeholder="e.g., Medical Certificate 2025"
              />
            </div>
            <div>
              <Label>Document Type</Label>
              <Select value={documentForm.document_type} onValueChange={(value) => setDocumentForm({...documentForm, document_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="agreement">Agreement</SelectItem>
                  <SelectItem value="certificate">Certificate</SelectItem>
                  <SelectItem value="photo">Photo</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>File *</Label>
              <Input 
                type="file" 
                onChange={(e) => setSelectedFile(e.target.files[0])}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea 
                value={documentForm.notes} 
                onChange={(e) => setDocumentForm({...documentForm, notes: e.target.value})}
                placeholder="Additional notes..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleUpload}
              disabled={!documentForm.title || !selectedFile || uploading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {uploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}