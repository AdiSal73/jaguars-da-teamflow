import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Trash2, Edit3, Save, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AnnotationPanel({ videoId, annotations, onUpdate, currentTime, isCoach = false }) {
  const [addingNote, setAddingNote] = useState(false);
  const [editingAnnotation, setEditingAnnotation] = useState(null);
  const [noteForm, setNoteForm] = useState({ content: '', timestamp: 0 });

  const sortedAnnotations = [...annotations].sort((a, b) => a.timestamp - b.timestamp);

  const handleAddNote = async () => {
    if (!noteForm.content) {
      toast.error('Please enter a note');
      return;
    }

    try {
      const user = await base44.auth.me();
      await base44.entities.VideoAnnotation.create({
        video_id: videoId,
        timestamp: noteForm.timestamp,
        annotation_type: 'comment',
        content: noteForm.content,
        created_by_id: user.id || user.email,
        created_by_name: user.full_name,
        visibility: isCoach ? 'shared' : 'shared'
      });

      toast.success('Note added');
      setNoteForm({ content: '', timestamp: 0 });
      setAddingNote(false);
      onUpdate?.();
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  const handleUpdateNote = async () => {
    if (!editingAnnotation || !editingAnnotation.content) return;

    try {
      await base44.entities.VideoAnnotation.update(editingAnnotation.id, {
        content: editingAnnotation.content
      });

      toast.success('Note updated');
      setEditingAnnotation(null);
      onUpdate?.();
    } catch (error) {
      toast.error('Failed to update note');
    }
  };

  const handleDeleteNote = async (annotationId) => {
    try {
      await base44.entities.VideoAnnotation.delete(annotationId);
      toast.success('Note deleted');
      onUpdate?.();
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Annotations ({annotations.length})
          </CardTitle>
          {isCoach && (
            <Button
              size="sm"
              onClick={() => {
                setAddingNote(true);
                setNoteForm({ ...noteForm, timestamp: currentTime });
              }}
              className="bg-gradient-to-r from-emerald-600 to-blue-600"
            >
              <Edit3 className="w-4 h-4 mr-1" />
              Add Note
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {addingNote && (
          <Card className="p-3 border-2 border-emerald-500">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge className="bg-emerald-100 text-emerald-800">
                  @ {formatTime(noteForm.timestamp)}
                </Badge>
                <Button size="icon" variant="ghost" onClick={() => setAddingNote(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <Textarea
                value={noteForm.content}
                onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                placeholder="Enter your note..."
                rows={3}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setAddingNote(false)} className="flex-1">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAddNote} className="flex-1 bg-emerald-600">
                  <Save className="w-3 h-3 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {sortedAnnotations.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No annotations yet</p>
            </div>
          ) : (
            sortedAnnotations.map((annotation) => (
              <Card key={annotation.id} className="p-3 hover:shadow-md transition-shadow">
                {editingAnnotation?.id === annotation.id ? (
                  <div className="space-y-2">
                    <Badge className="bg-blue-100 text-blue-800">
                      @ {formatTime(annotation.timestamp)}
                    </Badge>
                    <Textarea
                      value={editingAnnotation.content}
                      onChange={(e) => setEditingAnnotation({ ...editingAnnotation, content: e.target.value })}
                      rows={3}
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingAnnotation(null)} className="flex-1">
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleUpdateNote} className="flex-1 bg-blue-600">
                        <Save className="w-3 h-3 mr-1" />
                        Update
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          @ {formatTime(annotation.timestamp)}
                        </Badge>
                        {annotation.created_by_name && (
                          <span className="text-xs text-slate-600">{annotation.created_by_name}</span>
                        )}
                      </div>
                      {isCoach && (
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditingAnnotation(annotation)}
                            className="h-6 w-6"
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteNote(annotation.id)}
                            className="h-6 w-6 text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-slate-700">{annotation.content}</p>
                  </>
                )}
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}