import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Trash2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ResetTeamsDialog({ open, onClose, onComplete }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [currentStep, setCurrentStep] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  const handleReset = async () => {
    setIsProcessing(true);
    setIsComplete(false);
    setLogs([]);

    try {
      // Step 1: Remove players from 26/27 teams
      setCurrentStep('Removing players from 26/27 teams...');
      setLogs(prev => [...prev, { type: 'info', message: '🔄 Removing players from 26/27 teams...' }]);
      
      const removeResponse = await base44.functions.invoke('resetTeamsFor2627', { 
        operation: 'remove_players_26_27' 
      });
      
      if (removeResponse.data?.logs) {
        setLogs(prev => [...prev, ...removeResponse.data.logs]);
      }
      setLogs(prev => [...prev, { type: 'success', message: `✅ ${removeResponse.data.message}` }]);

      // Step 2: Delete 26/27 teams
      setCurrentStep('Deleting 26/27 teams...');
      setLogs(prev => [...prev, { type: 'info', message: '🗑️ Deleting 26/27 teams...' }]);
      
      const deleteResponse = await base44.functions.invoke('resetTeamsFor2627', { 
        operation: 'delete_26_27_teams' 
      });
      
      if (deleteResponse.data?.logs) {
        setLogs(prev => [...prev, ...deleteResponse.data.logs]);
      }
      setLogs(prev => [...prev, { type: 'success', message: `✅ ${deleteResponse.data.message}` }]);

      // Done
      setLogs(prev => [...prev, { type: 'success', message: '\n🎉 Reset complete! All 26/27 teams deleted and players unassigned.' }]);
      setIsComplete(true);
      toast.success('Reset complete');
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      setLogs(prev => [...prev, { type: 'error', message: `❌ Error: ${error.message}` }]);
      toast.error('Reset failed');
    } finally {
      setIsProcessing(false);
      setCurrentStep('');
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setLogs([]);
      setIsComplete(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            Reset for 26/27 Season
          </DialogTitle>
          <DialogDescription>
            This will delete all 26/27 teams and unassign all players.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {logs.length === 0 ? (
            <>
              <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                <p className="text-sm text-red-800 font-semibold mb-2">⚠️ WARNING:</p>
                <ul className="text-sm text-red-700 space-y-1 ml-4 list-disc">
                  <li>All players will be removed from 26/27 teams</li>
                  <li>All 26/27 teams will be permanently deleted</li>
                  <li>This action cannot be undone</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose} className="flex-1" disabled={isProcessing}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleReset}
                  disabled={isProcessing}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete All 26/27 Teams
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              {currentStep && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                    {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                    {currentStep}
                  </div>
                </div>
              )}

              <div className="max-h-[400px] overflow-y-auto bg-slate-900 rounded-lg p-4 font-mono text-xs space-y-1">
                {logs.map((log, idx) => (
                  <div 
                    key={idx}
                    className={`flex items-start gap-2 ${
                      log.type === 'success' ? 'text-green-400' :
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'info' ? 'text-blue-400' :
                      'text-slate-300'
                    }`}
                  >
                    {log.type === 'success' && <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />}
                    {log.type === 'error' && <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />}
                    <span>{log.message}</span>
                  </div>
                ))}
              </div>

              {isComplete && (
                <Button onClick={handleClose} className="w-full bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Done
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}