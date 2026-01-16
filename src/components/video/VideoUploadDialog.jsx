import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function VideoUploadDialog({ open, onClose, playerId, playerName, coachId, onSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [videoForm, setVideoForm] = useState({
    title: '',
    description: '',
    video_type: 'Training',
    tags: '',
    visibility: 'player'
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) {
        toast.error('File size must be less than 500MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !videoForm.title) {
      toast.error('Please select a file and enter a title');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });

      const user = await base44.auth.me();
      const tagsArray = videoForm.tags ? videoForm.tags.split(',').map(t => t.trim()) : [];

      await base44.entities.Video.create({
        title: videoForm.title,
        description: videoForm.description,
        file_url: file_url,
        video_type: videoForm.video_type,
        tags: tagsArray,
        visibility: videoForm.visibility,
        uploaded_by_id: user.id || user.email,
        uploaded_by_name: user.full_name,
        player_id: playerId,
        player_name: playerName,
        coach_id: coachId,
        shared_with: playerId ? [playerId] : []
      });

      toast.success('Video uploaded successfully');
      setVideoForm({ title: '', description: '', video_type: 'Training', tags: '', visibility: 'player' });
      setSelectedFile(null);
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error('Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Video
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Video File *</Label>
            <Input
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="mt-1"
            />
            {selectedFile && (
              <p className="text-xs text-slate-600 mt-1">
                {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div>
            <Label>Title *</Label>
            <Input
              value={videoForm.title}
              onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
              placeholder="e.g., Match Analysis - Nov 15"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={videoForm.description}
              onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
              placeholder="Add context or notes about this video..."
              rows={3}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Video Type</Label>
              <Select value={videoForm.video_type} onValueChange={(v) => setVideoForm({ ...videoForm, video_type: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Training">Training</SelectItem>
                  <SelectItem value="Match">Match</SelectItem>
                  <SelectItem value="Analysis">Analysis</SelectItem>
                  <SelectItem value="Drill">Drill</SelectItem>
                  <SelectItem value="Evaluation">Evaluation</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Visibility</Label>
              <Select value={videoForm.visibility} onValueChange={(v) => setVideoForm({ ...videoForm, visibility: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Coach Only</SelectItem>
                  <SelectItem value="player">Shared with Player</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Tags (comma-separated)</Label>
            <Input
              value={videoForm.tags}
              onChange={(e) => setVideoForm({ ...videoForm, tags: e.target.value })}
              placeholder="e.g., positioning, passing, tactical"
              className="mt-1"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || !selectedFile || !videoForm.title}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-blue-600"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Video
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}