import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, CheckCircle, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CreateNextSeasonTeamsDialog({ 
  open, 
  onClose, 
  onCreate,
  onDeleteAll
}) {
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);

  const AGE_GROUPS_OLDER = ['U19', 'U17', 'U16', 'U15', 'U14', 'U13'];
  const AGE_GROUPS_YOUNGER = ['U12', 'U11', 'U10', 'U9', 'U8', 'U7'];
  const VARIANTS_OLDER = ['Girls Academy', 'Girls Academy Aspire', 'Green', 'White', 'Black'];
  const VARIANTS_YOUNGER = ['Pre GA 1', 'Pre GA 2', 'Green', 'White', 'Black'];

  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to delete all 26/27 teams? This cannot be undone.')) {
      return;
    }
    
    setDeleting(true);
    setProgress(0);
    await onDeleteAll();
    setDeleting(false);
    setProgress(0);
  };

  const handleCreate = async () => {
    setCreating(true);
    setProgress(0);
    
    const results = { created: 0, errors: [] };
    const teamsToCreate = [];
    
    // Generate teams for older age groups
    AGE_GROUPS_OLDER.forEach(ageGroup => {
      VARIANTS_OLDER.forEach(variant => {
        const teamName = `${ageGroup} ${variant}`;
        let league = '';
        
        if (variant === 'Girls Academy') {
          league = 'Girls Academy';
        } else if (variant === 'Girls Academy Aspire') {
          league = 'Aspire';
        } else {
          league = 'MSPSP';
        }
        
        teamsToCreate.push({
          name: teamName,
          age_group: ageGroup,
          gender: 'Female',
          league: league,
          season: '26/27'
        });
      });
    });

    // Generate teams for younger age groups
    AGE_GROUPS_YOUNGER.forEach(ageGroup => {
      VARIANTS_YOUNGER.forEach(variant => {
        const teamName = `${ageGroup} ${variant}`;
        let league = '';
        
        if (variant.startsWith('Pre GA')) {
          league = 'Directors Academy';
        } else {
          league = 'MSDSL';
        }
        
        teamsToCreate.push({
          name: teamName,
          age_group: ageGroup,
          gender: 'Female',
          league: league,
          season: '26/27'
        });
      });
    });
    
    const total = teamsToCreate.length;
    const BATCH_SIZE = 3;
    const DELAY_MS = 2000;
    
    for (let i = 0; i < teamsToCreate.length; i += BATCH_SIZE) {
      const batch = teamsToCreate.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batch.map(async (team) => {
        try {
          await onCreate(team);
          results.created++;
        } catch (error) {
          results.errors.push({ team: team.name, error: error.message });
        }
      }));
      
      setProgress(Math.round(((i + batch.length) / total) * 100));
      
      if (i + BATCH_SIZE < teamsToCreate.length) {
        await new Promise(r => setTimeout(r, DELAY_MS));
      }
    }
    
    setResults(results);
    setCreating(false);
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
            <Calendar className="w-5 h-5 text-emerald-600" />
            Create Future Season Teams
          </DialogTitle>
        </DialogHeader>

        {!results && (
          <div className="space-y-4 py-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-sm">
              <p className="text-blue-900 font-bold mb-3 text-lg">📋 Team Structure</p>
              <div className="space-y-3">
                <div className="bg-white/80 rounded-lg p-3 border border-blue-100">
                  <p className="font-semibold text-blue-900 mb-2">Older Groups (U19-U13):</p>
                  <ul className="text-blue-800 text-sm space-y-1 ml-4">
                    {AGE_GROUPS_OLDER.map(age => (
                      <li key={age}>• {age}: {VARIANTS_OLDER.join(', ')}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white/80 rounded-lg p-3 border border-blue-100">
                  <p className="font-semibold text-blue-900 mb-2">Younger Groups (U12-U7):</p>
                  <ul className="text-blue-800 text-sm space-y-1 ml-4">
                    {AGE_GROUPS_YOUNGER.map(age => (
                      <li key={age}>• {age}: {VARIANTS_YOUNGER.join(', ')}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-200">
                  <p className="text-emerald-900 font-semibold text-sm">
                    Total: {(AGE_GROUPS_OLDER.length * VARIANTS_OLDER.length) + (AGE_GROUPS_YOUNGER.length * VARIANTS_YOUNGER.length)} teams for Season 26/27
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <Button 
                onClick={handleDeleteAll}
                disabled={deleting || creating}
                variant="destructive"
                size="sm"
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? 'Deleting...' : 'Delete All 26/27 Teams'}
              </Button>
              <span className="text-xs text-amber-800">Clear existing 26/27 teams before creating new ones</span>
            </div>

            {creating && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-700">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                  <span className="font-medium">Creating teams...</span>
                </div>
                <Progress value={progress} className="h-3" />
                <p className="text-sm text-slate-600 text-center">{progress}% Complete</p>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={handleClose} disabled={creating} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {creating ? 'Creating...' : 'Create Teams'}
              </Button>
            </div>
          </div>
        )}

        {results && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50 rounded-lg text-center">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-emerald-700">{results.created}</div>
                <div className="text-sm text-emerald-600">Created</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-700">{results.errors.length}</div>
                <div className="text-sm text-red-600">Errors</div>
              </div>
            </div>

            {results.errors.length > 0 && (
              <ScrollArea className="h-40 border rounded-lg">
                <div className="p-3 space-y-2">
                  {results.errors.map((err, idx) => (
                    <div key={idx} className="text-xs bg-red-50 p-2 rounded">
                      <span className="font-medium text-red-900">{err.team}:</span>
                      <span className="text-red-700 ml-1">{err.error}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
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