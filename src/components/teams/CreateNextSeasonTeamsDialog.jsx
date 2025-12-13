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
  onCreate
}) {
  const [creating, setCreating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);

  const AGE_GROUPS = ['U19', 'U18', 'U17', 'U16', 'U15', 'U14', 'U13', 'U12', 'U11', 'U10', 'U9', 'U8'];
  const VARIANTS = ['Girls Academy', 'Girls Academy Aspire', 'United Green', 'United White', 'United Black'];

  const handleCreate = async () => {
    setCreating(true);
    setProgress(0);
    
    const results = { created: 0, errors: [] };
    const teamsToCreate = [];
    
    // Generate all team combinations
    AGE_GROUPS.forEach(ageGroup => {
      VARIANTS.forEach(variant => {
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
            Create 26/27 Season Teams
          </DialogTitle>
        </DialogHeader>

        {!results && (
          <div className="space-y-4 py-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-blue-900 font-semibold mb-2">This will create:</p>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• {AGE_GROUPS.length} age groups (U19 down to U8)</li>
                <li>• {VARIANTS.length} variants per age group</li>
                <li>• Total: {AGE_GROUPS.length * VARIANTS.length} teams</li>
                <li>• Season: 26/27</li>
              </ul>
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