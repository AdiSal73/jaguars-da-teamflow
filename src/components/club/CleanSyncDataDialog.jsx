import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Trash2, Link as LinkIcon, CheckCircle, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CleanSyncDataDialog({ 
  open, 
  onClose, 
  players = [],
  teams = [],
  coaches = [],
  onCleanData
}) {
  const [scanning, setScanning] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);

  const findBestTeamMatch = (player) => {
    if (player.team_id) return null;
    
    const lastName = player.full_name?.split(' ').pop()?.toLowerCase();
    if (!lastName) return null;

    // Try to match based on common team naming patterns
    for (const team of teams) {
      const teamNameLower = team.name?.toLowerCase() || '';
      // Match if team contains common pattern like "U-15 Girls" and player's data suggests that
      if (teamNameLower.includes(lastName.substring(0, 3))) {
        return team;
      }
    }
    return null;
  };

  const scanData = useMemo(() => {
    const emptyRecords = {
      players: players.filter(p => !p.full_name || p.full_name.trim() === ''),
      teams: teams.filter(t => !t.name || t.name.trim() === ''),
      coaches: coaches.filter(c => !c.full_name || c.full_name.trim() === '')
    };

    const duplicates = {
      players: [],
      teams: [],
      coaches: []
    };

    // Find duplicate players
    const playerMap = new Map();
    players.forEach(p => {
      const key = p.full_name?.toLowerCase().trim();
      if (key) {
        if (playerMap.has(key)) {
          playerMap.get(key).push(p);
        } else {
          playerMap.set(key, [p]);
        }
      }
    });
    playerMap.forEach(arr => {
      if (arr.length > 1) {
        duplicates.players.push(...arr.slice(1));
      }
    });

    // Find duplicate teams
    const teamMap = new Map();
    teams.forEach(t => {
      const key = t.name?.toLowerCase().trim();
      if (key) {
        if (teamMap.has(key)) {
          teamMap.get(key).push(t);
        } else {
          teamMap.set(key, [t]);
        }
      }
    });
    teamMap.forEach(arr => {
      if (arr.length > 1) {
        duplicates.teams.push(...arr.slice(1));
      }
    });

    // Find duplicate coaches
    const coachMap = new Map();
    coaches.forEach(c => {
      const key = c.email?.toLowerCase().trim() || c.full_name?.toLowerCase().trim();
      if (key) {
        if (coachMap.has(key)) {
          coachMap.get(key).push(c);
        } else {
          coachMap.set(key, [c]);
        }
      }
    });
    coachMap.forEach(arr => {
      if (arr.length > 1) {
        duplicates.coaches.push(...arr.slice(1));
      }
    });

    // Find unassigned players that could be matched
    const unassignedPlayers = players.filter(p => !p.team_id && p.full_name);
    const suggestedMatches = unassignedPlayers.map(p => ({
      player: p,
      suggestedTeam: findBestTeamMatch(p)
    })).filter(m => m.suggestedTeam);

    return {
      emptyRecords,
      duplicates,
      suggestedMatches,
      totalIssues: 
        emptyRecords.players.length + 
        emptyRecords.teams.length + 
        emptyRecords.coaches.length +
        duplicates.players.length +
        duplicates.teams.length +
        duplicates.coaches.length
    };
  }, [players, teams, coaches]);

  const handleClean = async () => {
    setCleaning(true);
    setProgress(0);
    
    const results = { deleted: 0, matched: 0, errors: [] };
    const allToDelete = [
      ...scanData.emptyRecords.players,
      ...scanData.emptyRecords.teams,
      ...scanData.emptyRecords.coaches,
      ...scanData.duplicates.players,
      ...scanData.duplicates.teams,
      ...scanData.duplicates.coaches
    ];
    
    const total = allToDelete.length + scanData.suggestedMatches.length;
    let processed = 0;
    
    const BATCH_SIZE = 5;
    const DELAY_MS = 300;
    
    // Delete empty and duplicate records
    for (let i = 0; i < allToDelete.length; i += BATCH_SIZE) {
      const batch = allToDelete.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (record) => {
        try {
          if (record.team_id !== undefined) {
            await onCleanData('delete_player', record.id);
          } else if (record.age_group !== undefined) {
            await onCleanData('delete_team', record.id);
          } else {
            await onCleanData('delete_coach', record.id);
          }
          results.deleted++;
        } catch (error) {
          results.errors.push({ record, error: error.message });
        }
        processed++;
        setProgress(Math.round((processed / total) * 100));
      }));
      
      if (i + BATCH_SIZE < allToDelete.length) {
        await new Promise(r => setTimeout(r, DELAY_MS));
      }
    }
    
    // Match unassigned players
    for (let i = 0; i < scanData.suggestedMatches.length; i += BATCH_SIZE) {
      const batch = scanData.suggestedMatches.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (match) => {
        try {
          await onCleanData('update_player', { id: match.player.id, data: { team_id: match.suggestedTeam.id } });
          results.matched++;
        } catch (error) {
          results.errors.push({ record: match.player, error: error.message });
        }
        processed++;
        setProgress(Math.round((processed / total) * 100));
      }));
      
      if (i + BATCH_SIZE < scanData.suggestedMatches.length) {
        await new Promise(r => setTimeout(r, DELAY_MS));
      }
    }
    
    setResults(results);
    setCleaning(false);
  };

  const handleClose = () => {
    setResults(null);
    setProgress(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Clean & Sync Data
          </DialogTitle>
        </DialogHeader>

        {!results && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-red-50 rounded-lg text-center">
                <Trash2 className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-700">
                  {scanData.emptyRecords.players.length + scanData.emptyRecords.teams.length + scanData.emptyRecords.coaches.length}
                </div>
                <div className="text-xs text-red-600">Empty Records</div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg text-center">
                <AlertTriangle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-700">
                  {scanData.duplicates.players.length + scanData.duplicates.teams.length + scanData.duplicates.coaches.length}
                </div>
                <div className="text-xs text-orange-600">Duplicates</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <LinkIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-700">{scanData.suggestedMatches.length}</div>
                <div className="text-xs text-blue-600">Auto-Matches</div>
              </div>
            </div>

            <Tabs defaultValue="empty">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="empty">Empty Records</TabsTrigger>
                <TabsTrigger value="duplicates">Duplicates</TabsTrigger>
                <TabsTrigger value="matches">Suggested Matches</TabsTrigger>
              </TabsList>

              <TabsContent value="empty">
                <ScrollArea className="h-64 border rounded-lg">
                  <div className="p-2 space-y-1">
                    {scanData.emptyRecords.players.map(p => (
                      <div key={p.id} className="text-sm p-2 bg-red-50 rounded">Player ID: {p.id}</div>
                    ))}
                    {scanData.emptyRecords.teams.map(t => (
                      <div key={t.id} className="text-sm p-2 bg-red-50 rounded">Team ID: {t.id}</div>
                    ))}
                    {scanData.emptyRecords.coaches.map(c => (
                      <div key={c.id} className="text-sm p-2 bg-red-50 rounded">Coach ID: {c.id}</div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="duplicates">
                <ScrollArea className="h-64 border rounded-lg">
                  <div className="p-2 space-y-1">
                    {scanData.duplicates.players.map(p => (
                      <div key={p.id} className="text-sm p-2 bg-orange-50 rounded">Player: {p.full_name}</div>
                    ))}
                    {scanData.duplicates.teams.map(t => (
                      <div key={t.id} className="text-sm p-2 bg-orange-50 rounded">Team: {t.name}</div>
                    ))}
                    {scanData.duplicates.coaches.map(c => (
                      <div key={c.id} className="text-sm p-2 bg-orange-50 rounded">Coach: {c.full_name}</div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="matches">
                <ScrollArea className="h-64 border rounded-lg">
                  <div className="p-2 space-y-1">
                    {scanData.suggestedMatches.map((m, idx) => (
                      <div key={idx} className="text-sm p-2 bg-blue-50 rounded flex items-center justify-between">
                        <span>{m.player.full_name}</span>
                        <Badge className="bg-blue-100 text-blue-800">→ {m.suggestedTeam.name}</Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            {cleaning && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Cleaning... {progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button 
                onClick={handleClean} 
                disabled={cleaning || scanData.totalIssues === 0}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {cleaning ? 'Cleaning...' : `Clean ${scanData.totalIssues} Issues`}
              </Button>
            </div>
          </div>
        )}

        {results && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-red-50 rounded-lg text-center">
                <Trash2 className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-700">{results.deleted}</div>
                <div className="text-sm text-red-600">Deleted</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <LinkIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-700">{results.matched}</div>
                <div className="text-sm text-blue-600">Matched</div>
              </div>
              <div className="p-4 bg-emerald-50 rounded-lg text-center">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-emerald-700">Done</div>
                <div className="text-sm text-emerald-600">Completed</div>
              </div>
            </div>

            {results.errors.length > 0 && (
              <ScrollArea className="h-32 border rounded-lg">
                <div className="p-2 space-y-1">
                  {results.errors.map((err, idx) => (
                    <div key={idx} className="text-sm text-red-600">
                      {err.record.full_name || err.record.name || 'Unknown'}: {err.error}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            <div className="flex justify-end">
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