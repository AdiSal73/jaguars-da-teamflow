import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function DeleteAllDialog({ 
  open, 
  onClose, 
  entityType, 
  entities = [],
  onDelete
}) {
  const [deleting, setDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);

  const handleDelete = async () => {
    setDeleting(true);
    setProgress(0);
    
    const results = { deleted: 0, errors: [] };
    const total = entities.length;
    
    const BATCH_SIZE = 3;
    const DELAY_MS = 2000;
    
    for (let i = 0; i < entities.length; i += BATCH_SIZE) {
      const batch = entities.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batch.map(async (entity) => {
        try {
          await onDelete(entity.id);
          results.deleted++;
        } catch (error) {
          results.errors.push({ 
            entity: entity.full_name || entity.name || `ID: ${entity.id}`, 
            error: error.message 
          });
        }
      }));
      
      setProgress(Math.round(((i + batch.length) / total) * 100));
      
      if (i + BATCH_SIZE < entities.length) {
        await new Promise(r => setTimeout(r, DELAY_MS));
      }
    }
    
    setResults(results);
    setDeleting(false);
  };

  const handleClose = () => {
    setResults(null);
    setProgress(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Delete All {entityType}
          </DialogTitle>
        </DialogHeader>

        {!results && (
          <div className="space-y-4 py-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-red-900 font-semibold mb-2">⚠️ Warning: Permanent Deletion</p>
              <p className="text-red-800 text-sm">
                This will permanently delete all <strong>{entities.length}</strong> {entityType}. 
                This action cannot be undone.
              </p>
            </div>

            {deleting && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-700">
                  <Loader2 className="w-5 h-5 animate-spin text-red-600" />
                  <span className="font-medium">Deleting {entityType}...</span>
                </div>
                <Progress value={progress} className="h-3" />
                <p className="text-sm text-slate-600 text-center">{progress}% Complete</p>
                <p className="text-xs text-slate-500 text-center">
                  Processing in batches to avoid rate limits. Please wait...
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={handleClose} disabled={deleting}>
                Cancel
              </Button>
              <Button 
                onClick={handleDelete} 
                disabled={deleting || entities.length === 0}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? 'Deleting...' : `Delete All ${entities.length} ${entityType}`}
              </Button>
            </div>
          </div>
        )}

        {results && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50 rounded-lg text-center">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-emerald-700">{results.deleted}</div>
                <div className="text-sm text-emerald-600">Successfully Deleted</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg text-center">
                <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-700">{results.errors.length}</div>
                <div className="text-sm text-red-600">Errors</div>
              </div>
            </div>

            {results.errors.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Errors:</p>
                <ScrollArea className="h-40 border rounded-lg">
                  <div className="p-3 space-y-2">
                    {results.errors.map((err, idx) => (
                      <div key={idx} className="text-xs bg-red-50 p-2 rounded">
                        <span className="font-medium text-red-900">{err.entity}:</span>
                        <span className="text-red-700 ml-1">{err.error}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleClose} className="bg-emerald-600 hover:bg-emerald-700">
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}