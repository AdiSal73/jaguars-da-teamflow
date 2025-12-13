import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trash2, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function CleanAssessmentsDialog({ open, onClose, assessments, players, onComplete }) {
  const [scanning, setScanning] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duplicates, setDuplicates] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (open && !scanning && duplicates.length === 0) {
      scanData();
    }
  }, [open]);

  const scanData = () => {
    setScanning(true);
    
    // Find duplicates (same player_id + same assessment_date)
    const duplicateGroups = [];
    const seen = new Map();
    
    assessments.forEach(assessment => {
      if (assessment.player_id && assessment.assessment_date) {
        const key = `${assessment.player_id}_${assessment.assessment_date}`;
        if (seen.has(key)) {
          const existing = seen.get(key);
          const group = duplicateGroups.find(g => g.some(a => a.id === existing.id));
          if (group) {
            group.push(assessment);
          } else {
            duplicateGroups.push([existing, assessment]);
          }
        } else {
          seen.set(key, assessment);
        }
      }
    });
    
    // Find unassigned (no player_id or player not found)
    const unassignedList = assessments.filter(a => {
      if (!a.player_id) return true;
      return !players.some(p => p.id === a.player_id);
    });
    
    setDuplicates(duplicateGroups);
    setUnassigned(unassignedList);
    setScanning(false);
  };

  const handleClean = async () => {
    setCleaning(true);
    setProgress(0);
    const totalOperations = duplicates.length + unassigned.length;
    let completed = 0;
    const deleted = [];
    const errors = [];

    // Delete duplicates (keep first, delete rest)
    for (const group of duplicates) {
      for (let i = 1; i < group.length; i++) {
        try {
          await base44.entities.PhysicalAssessment.delete(group[i].id);
          deleted.push(`Duplicate: ${group[i].player_name || 'Unknown'} - ${group[i].assessment_date}`);
          completed++;
          setProgress((completed / totalOperations) * 100);
        } catch (error) {
          errors.push(`Failed to delete duplicate: ${group[i].id}`);
        }
      }
    }

    // Delete unassigned
    for (const assessment of unassigned) {
      try {
        await base44.entities.PhysicalAssessment.delete(assessment.id);
        deleted.push(`Unassigned: ${assessment.player_name || 'Unknown'}`);
        completed++;
        setProgress((completed / totalOperations) * 100);
      } catch (error) {
        errors.push(`Failed to delete unassigned: ${assessment.id}`);
      }
    }

    setResults({ deleted: deleted.length, errors });
    setCleaning(false);
    setProgress(100);
    
    if (onComplete) {
      onComplete();
    }
  };

  const totalIssues = duplicates.length + unassigned.length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-orange-600" />
            Clean & Sync Assessment Data
          </DialogTitle>
        </DialogHeader>

        {scanning ? (
          <div className="py-12 text-center">
            <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Scanning for issues...</p>
          </div>
        ) : results ? (
          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="font-semibold mb-2">Cleaning Complete!</div>
                <div className="text-sm space-y-1">
                  <div>✓ {results.deleted} records deleted</div>
                  {results.errors.length > 0 && <div className="text-red-600">✗ {results.errors.length} errors</div>}
                </div>
              </AlertDescription>
            </Alert>
            <Button onClick={onClose} className="w-full">Close</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Found <strong>{totalIssues}</strong> issue(s) in assessment data
              </AlertDescription>
            </Alert>

            {cleaning && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-slate-600 text-center">Cleaning data...</p>
              </div>
            )}

            <Tabs defaultValue="duplicates">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="duplicates">
                  Duplicates ({duplicates.length})
                </TabsTrigger>
                <TabsTrigger value="unassigned">
                  Unassigned ({unassigned.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="duplicates" className="mt-4">
                {duplicates.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center text-slate-500">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                      No duplicate assessments found
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {duplicates.map((group, idx) => {
                      const player = players.find(p => p.id === group[0].player_id);
                      return (
                        <Card key={idx} className="border-orange-200">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-semibold text-slate-900">{player?.full_name || group[0].player_name}</p>
                                <p className="text-xs text-slate-600">{group[0].assessment_date}</p>
                              </div>
                              <Badge className="bg-orange-100 text-orange-800">{group.length} duplicates</Badge>
                            </div>
                            <div className="text-xs text-slate-600 space-y-1">
                              {group.map((a, i) => (
                                <div key={a.id} className={`p-2 rounded ${i === 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                                  {i === 0 ? '✓ Keep' : '✗ Delete'}: Overall {a.overall_score} (Created: {new Date(a.created_date).toLocaleDateString()})
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="unassigned" className="mt-4">
                {unassigned.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center text-slate-500">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                      All assessments are properly assigned
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {unassigned.map(assessment => (
                      <Card key={assessment.id} className="border-red-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-slate-900">{assessment.player_name || 'Unknown Player'}</p>
                              <p className="text-xs text-slate-600">{assessment.assessment_date}</p>
                              <p className="text-xs text-red-600 mt-1">Player ID not found</p>
                            </div>
                            <Badge className="bg-red-100 text-red-800">Unassigned</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose} className="flex-1" disabled={cleaning}>
                Cancel
              </Button>
              <Button 
                onClick={handleClean}
                disabled={totalIssues === 0 || cleaning}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {cleaning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cleaning...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clean Data ({totalIssues})
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}