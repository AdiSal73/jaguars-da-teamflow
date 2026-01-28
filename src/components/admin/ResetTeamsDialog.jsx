import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Trash2, Users, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ResetTeamsDialog({ open, onClose, onComplete }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [currentStep, setCurrentStep] = useState(null);

  const executeOperation = async (operation, stepName) => {
    setCurrentStep(stepName);
    setLogs(prev => [...prev, { type: 'info', message: `Starting: ${stepName}...` }]);

    try {
      const response = await base44.functions.invoke('resetTeamsFor2627', { operation });
      
      if (response.data.logs) {
        setLogs(prev => [...prev, ...response.data.logs]);
      }
      
      setLogs(prev => [...prev, { type: 'success', message: `✅ ${response.data.message}` }]);
      return true;
    } catch (error) {
      setLogs(prev => [...prev, { type: 'error', message: `❌ ${stepName} failed: ${error.message}` }]);
      toast.error(`${stepName} failed`);
      return false;
    }
  };

  const handleResetAll = async () => {
    setIsProcessing(true);
    setLogs([]);

    // Step 1: Reset 25/26 teams
    const step1Success = await executeOperation('reset_25_26_teams', 'Reset 25/26 Teams');
    if (!step1Success) {
      setIsProcessing(false);
      return;
    }

    // Step 2: Remove players from 26/27 teams
    const step2Success = await executeOperation('remove_players_26_27', 'Remove Players from 26/27');
    if (!step2Success) {
      setIsProcessing(false);
      return;
    }

    // Step 3: Delete 26/27 teams
    const step3Success = await executeOperation('delete_26_27_teams', 'Delete 26/27 Teams');
    if (!step3Success) {
      setIsProcessing(false);
      return;
    }

    setLogs(prev => [...prev, { type: 'success', message: '\n🎉 All operations completed successfully!' }]);
    toast.success('All reset operations completed');
    setIsProcessing(false);
    
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            Reset Teams for 26/27 Season
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {!isProcessing && logs.length === 0 ? (
            <>
              <div className="p-4 bg-orange-50 border-2 border-orange-300 rounded-lg">
                <p className="text-sm text-orange-800 font-semibold mb-2">⚠️ WARNING: This will perform the following actions:</p>
                <ul className="text-sm text-orange-700 space-y-1 ml-4 list-disc">
                  <li>Reset all 25/26 season teams (remove all players)</li>
                  <li>Remove all players from 26/27 teams</li>
                  <li>Delete all 26/27 teams</li>
                </ul>
                <p className="text-sm text-orange-800 font-bold mt-3">This action cannot be undone!</p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleResetAll}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Proceed with Reset
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm font-semibold text-blue-900">
                  {currentStep || 'Processing...'}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-900 rounded-lg p-4 font-mono text-xs space-y-1">
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

              {!isProcessing && (
                <Button onClick={onClose} className="w-full">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Close
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}