import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Loader2, RefreshCw, User, Users, Activity, FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AutoSyncDialog({ open, onOpenChange, onComplete }) {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    playersMatched: 0,
    teamsMatched: 0,
    assessmentsAssigned: 0,
    evaluationsAssigned: 0,
    errors: 0
  });

  const addLog = (type, message) => {
    setLogs(prev => [...prev, { type, message, time: new Date().toLocaleTimeString() }]);
  };

  const normalizeString = (str) => {
    if (!str) return '';
    return str.toLowerCase().trim().replace(/\s+/g, ' ');
  };

  const findBestMatch = (name, list, nameField = 'full_name') => {
    const normalizedName = normalizeString(name);
    
    // Exact match
    let match = list.find(item => normalizeString(item[nameField]) === normalizedName);
    if (match) return { match, confidence: 'exact' };

    // Partial match (contains)
    match = list.find(item => {
      const itemName = normalizeString(item[nameField]);
      return itemName.includes(normalizedName) || normalizedName.includes(itemName);
    });
    if (match) return { match, confidence: 'partial' };

    // First/Last name match
    const nameParts = normalizedName.split(' ');
    if (nameParts.length >= 2) {
      match = list.find(item => {
        const itemParts = normalizeString(item[nameField]).split(' ');
        return itemParts.some(part => nameParts.includes(part));
      });
      if (match) return { match, confidence: 'name-part' };
    }

    return { match: null, confidence: null };
  };

  const runAutoSync = async () => {
    setSyncing(true);
    setProgress(0);
    setLogs([]);
    setStats({ playersMatched: 0, teamsMatched: 0, assessmentsAssigned: 0, evaluationsAssigned: 0, errors: 0 });

    try {
      addLog('info', 'Starting auto-sync process...');

      // Fetch all data
      addLog('info', 'Fetching data from database...');
      const [players, teams, assessments, evaluations, unassignedEvals, unassignedAssess, tryouts] = await Promise.all([
        base44.entities.Player.list(),
        base44.entities.Team.list(),
        base44.entities.PhysicalAssessment.list(),
        base44.entities.Evaluation.list(),
        base44.entities.UnassignedEvaluation?.filter({ assigned: false }).catch(() => []),
        base44.entities.UnassignedPhysicalAssessment?.filter({ assigned: false }).catch(() => []),
        base44.entities.PlayerTryout.list()
      ]);

      setProgress(10);
      addLog('success', `Loaded ${players.length} players, ${teams.length} teams`);

      // Step 1: Match players to teams by team name in player data
      addLog('info', 'Matching players to teams...');
      let playersMatchedCount = 0;

      for (let i = 0; i < players.length; i++) {
        const player = players[i];
        
        // Skip if already has team
        if (player.team_id && teams.find(t => t.id === player.team_id)) continue;

        // Try to find team by various fields
        const possibleTeamNames = [
          player.team_id,  // Sometimes team name is stored here
          player.team_name,
        ].filter(Boolean);

        for (const teamName of possibleTeamNames) {
          const { match: team, confidence } = findBestMatch(teamName, teams, 'name');
          if (team) {
            try {
              await base44.entities.Player.update(player.id, { team_id: team.id });
              playersMatchedCount++;
              addLog('success', `Matched player "${player.full_name}" to team "${team.name}" (${confidence})`);
            } catch (err) {
              addLog('error', `Failed to update player "${player.full_name}": ${err.message}`);
              setStats(prev => ({ ...prev, errors: prev.errors + 1 }));
            }
            break;
          }
        }

        setProgress(10 + (i / players.length) * 20);
      }

      setStats(prev => ({ ...prev, playersMatched: playersMatchedCount }));

      // Step 2: Assign unassigned evaluations
      addLog('info', 'Processing unassigned evaluations...');
      let evalsAssignedCount = 0;

      for (let i = 0; i < unassignedEvals.length; i++) {
        const unassignedEval = unassignedEvals[i];
        const { match: player, confidence } = findBestMatch(unassignedEval.player_name, players);

        if (player) {
          try {
            await base44.entities.Evaluation.create({
              player_id: player.id,
              evaluation_date: unassignedEval.date,
              evaluator_name: unassignedEval.evaluator,
              growth_mindset: unassignedEval.growth_mindset,
              resilience: unassignedEval.resilience,
              efficiency_in_execution: unassignedEval.efficiency_in_execution,
              athleticism: unassignedEval.athleticism,
              team_focus: unassignedEval.team_focus,
              player_strengths: unassignedEval.strengths || unassignedEval.player_strengths,
              areas_of_growth: unassignedEval.areas_for_improvement || unassignedEval.areas_of_growth,
              training_focus: unassignedEval.training_focus
            });

            await base44.entities.UnassignedEvaluation.update(unassignedEval.id, { assigned: true });
            evalsAssignedCount++;
            addLog('success', `Assigned evaluation for "${unassignedEval.player_name}" to "${player.full_name}" (${confidence})`);
          } catch (err) {
            addLog('error', `Failed to assign evaluation: ${err.message}`);
            setStats(prev => ({ ...prev, errors: prev.errors + 1 }));
          }
        } else {
          addLog('warning', `No player match found for evaluation: "${unassignedEval.player_name}"`);
        }

        setProgress(30 + (i / Math.max(unassignedEvals.length, 1)) * 20);
      }

      setStats(prev => ({ ...prev, evaluationsAssigned: evalsAssignedCount }));

      // Step 3: Assign unassigned assessments
      addLog('info', 'Processing unassigned physical assessments...');
      let assessAssignedCount = 0;

      for (let i = 0; i < unassignedAssess.length; i++) {
        const unassignedAssess1 = unassignedAssess[i];
        const { match: player, confidence } = findBestMatch(unassignedAssess1.player_name, players);

        if (player) {
          try {
            await base44.entities.PhysicalAssessment.create({
              player_id: player.id,
              player_name: player.full_name,
              team_id: player.team_id,
              assessment_date: unassignedAssess1.assessment_date,
              sprint: unassignedAssess1.sprint_time,
              vertical: unassignedAssess1.vertical_jump,
              yirt: unassignedAssess1.endurance,
              shuttle: unassignedAssess1.agility,
              speed_score: unassignedAssess1.speed,
              power_score: unassignedAssess1.power,
              endurance_score: unassignedAssess1.endurance,
              agility_score: unassignedAssess1.agility,
              notes: unassignedAssess1.notes
            });

            await base44.entities.UnassignedPhysicalAssessment.update(unassignedAssess1.id, { assigned: true });
            assessAssignedCount++;
            addLog('success', `Assigned assessment for "${unassignedAssess1.player_name}" to "${player.full_name}" (${confidence})`);
          } catch (err) {
            addLog('error', `Failed to assign assessment: ${err.message}`);
            setStats(prev => ({ ...prev, errors: prev.errors + 1 }));
          }
        } else {
          addLog('warning', `No player match found for assessment: "${unassignedAssess1.player_name}"`);
        }

        setProgress(50 + (i / Math.max(unassignedAssess.length, 1)) * 20);
      }

      setStats(prev => ({ ...prev, assessmentsAssigned: assessAssignedCount }));

      // Step 4: Cross-reference tryouts with players
      addLog('info', 'Cross-referencing tryout data...');
      
      for (let i = 0; i < tryouts.length; i++) {
        const tryout = tryouts[i];
        if (!tryout.player_id) {
          const { match: player } = findBestMatch(tryout.player_name, players);
          if (player) {
            try {
              await base44.entities.PlayerTryout.update(tryout.id, { player_id: player.id });
              addLog('success', `Linked tryout for "${tryout.player_name}" to player record`);
            } catch (err) {
              addLog('error', `Failed to link tryout: ${err.message}`);
            }
          }
        }
        setProgress(70 + (i / Math.max(tryouts.length, 1)) * 20);
      }

      // Step 5: Sync assessment team_ids with player team_ids
      addLog('info', 'Syncing assessment team references...');
      
      for (const assessment of assessments) {
        const player = players.find(p => p.id === assessment.player_id);
        if (player && player.team_id && assessment.team_id !== player.team_id) {
          try {
            await base44.entities.PhysicalAssessment.update(assessment.id, { team_id: player.team_id });
          } catch (err) {
            // Silent fail for team sync
          }
        }
      }

      setProgress(100);
      addLog('success', 'Auto-sync completed!');
      
    } catch (error) {
      addLog('error', `Sync failed: ${error.message}`);
      setStats(prev => ({ ...prev, errors: prev.errors + 1 }));
    }

    setSyncing(false);
    onComplete?.();
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return <Loader2 className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className={`w-5 h-5 text-emerald-600 ${syncing ? 'animate-spin' : ''}`} />
            Auto-Sync Data
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress */}
          {syncing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Syncing...</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-blue-50 rounded-lg text-center">
              <User className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-blue-700">{stats.playersMatched}</p>
              <p className="text-xs text-slate-600">Players Matched</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg text-center">
              <Activity className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-emerald-700">{stats.assessmentsAssigned}</p>
              <p className="text-xs text-slate-600">Assessments</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg text-center">
              <FileText className="w-5 h-5 text-purple-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-purple-700">{stats.evaluationsAssigned}</p>
              <p className="text-xs text-slate-600">Evaluations</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg text-center">
              <AlertCircle className="w-5 h-5 text-red-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-red-700">{stats.errors}</p>
              <p className="text-xs text-slate-600">Errors</p>
            </div>
          </div>

          {/* Logs */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Sync Log</h3>
            <ScrollArea className="h-[250px] border rounded-lg p-3 bg-slate-50">
              {logs.length === 0 ? (
                <p className="text-center text-slate-500 py-8">
                  Click "Start Sync" to begin the auto-sync process
                </p>
              ) : (
                <div className="space-y-2">
                  {logs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      {getLogIcon(log.type)}
                      <span className="text-slate-500 text-xs">{log.time}</span>
                      <span className={`flex-1 ${
                        log.type === 'error' ? 'text-red-700' :
                        log.type === 'warning' ? 'text-yellow-700' :
                        log.type === 'success' ? 'text-emerald-700' :
                        'text-slate-700'
                      }`}>
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Close
            </Button>
            <Button 
              onClick={runAutoSync} 
              disabled={syncing}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Start Sync
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}