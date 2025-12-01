import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, XCircle, AlertTriangle, Upload, Loader2 } from 'lucide-react';

export default function SmartImportDialog({ 
  open, 
  onClose, 
  entityType, 
  existingData = [],
  teams = [],
  players = [],
  onImport 
}) {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [previewData, setPreviewData] = useState(null);

  const parseCSV = (text) => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase().replace(/ /g, '_'));
    
    const records = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].match(/(".*?"|[^,]+)/g) || [];
      const record = {};
      headers.forEach((h, idx) => {
        let val = (values[idx] || '').replace(/^"|"$/g, '').replace(/""/g, '"').trim();
        record[h] = val;
      });
      records.push(record);
    }
    return { headers, records };
  };

  const findBestTeamMatch = (teamName, teams) => {
    if (!teamName) return null;
    const normalizedName = teamName.toLowerCase().trim();
    
    // Exact match
    let match = teams.find(t => t.name.toLowerCase() === normalizedName);
    if (match) return match;
    
    // Partial match
    match = teams.find(t => 
      t.name.toLowerCase().includes(normalizedName) || 
      normalizedName.includes(t.name.toLowerCase())
    );
    if (match) return match;
    
    // Match by age group in name
    const ageMatch = teamName.match(/U-?(\d+)/i);
    if (ageMatch) {
      match = teams.find(t => t.age_group?.includes(ageMatch[1]));
      if (match) return match;
    }
    
    return null;
  };

  const findPlayerByName = (name, players) => {
    if (!name) return null;
    const normalizedName = name.toLowerCase().trim();
    return players.find(p => p.full_name?.toLowerCase().trim() === normalizedName);
  };

  const checkDuplicate = (record, existing, entityType) => {
    if (entityType === 'players') {
      return existing.find(p => 
        p.full_name?.toLowerCase() === record.full_name?.toLowerCase() ||
        (record.email && p.email?.toLowerCase() === record.email?.toLowerCase())
      );
    }
    if (entityType === 'teams') {
      return existing.find(t => t.name?.toLowerCase() === record.name?.toLowerCase());
    }
    if (entityType === 'coaches') {
      return existing.find(c => 
        c.email?.toLowerCase() === record.email?.toLowerCase() ||
        c.full_name?.toLowerCase() === record.full_name?.toLowerCase()
      );
    }
    return null;
  };

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    const text = await selectedFile.text();
    const { headers, records } = parseCSV(text);
    
    // Analyze records for duplicates and matches
    const analyzed = records.map(record => {
      const duplicate = checkDuplicate(record, existingData, entityType);
      let teamMatch = null;
      let playerMatches = [];
      
      if (entityType === 'players' && record.team_name) {
        teamMatch = findBestTeamMatch(record.team_name, teams);
      }
      
      if (entityType === 'parents') {
        const playerNames = (record.player_names || '').split(';').filter(Boolean);
        playerMatches = playerNames.map(name => ({
          name,
          match: findPlayerByName(name.trim(), players)
        }));
      }
      
      return {
        ...record,
        _isDuplicate: !!duplicate,
        _duplicateOf: duplicate,
        _teamMatch: teamMatch,
        _playerMatches: playerMatches
      };
    });
    
    setPreviewData({ headers, records: analyzed });
  };

  const handleImport = async () => {
    if (!previewData) return;
    
    setImporting(true);
    setProgress(0);
    
    const results = {
      created: [],
      skipped: [],
      errors: [],
      parentsCreated: []
    };
    
    const recordsToImport = previewData.records.filter(r => !r._isDuplicate);
    const total = recordsToImport.length;
    
    for (let i = 0; i < recordsToImport.length; i++) {
      const record = recordsToImport[i];
      setProgress(Math.round(((i + 1) / total) * 100));
      
      try {
        if (entityType === 'players') {
          const playerData = {
            full_name: record.full_name,
            email: record.email || undefined,
            phone: record.phone || undefined,
            date_of_birth: record.date_of_birth || undefined,
            gender: record.gender || 'Female',
            primary_position: record.primary_position || record.position || undefined,
            jersey_number: record.jersey_number ? Number(record.jersey_number) : undefined,
            status: record.status || 'Active',
            parent_name: record.parent_name || undefined,
            team_id: record._teamMatch?.id || undefined
          };
          
          const created = await onImport('player', playerData);
          results.created.push({ ...record, _createdId: created?.id });
          
          // Auto-create parent if parent_name and parent_email exist
          if (record.parent_name && record.parent_email) {
            results.parentsCreated.push({
              name: record.parent_name,
              email: record.parent_email,
              playerId: created?.id
            });
          }
        } else if (entityType === 'teams') {
          const teamData = {
            name: record.name,
            age_group: record.age_group,
            league: record.league || undefined,
            gender: record.gender || 'Female',
            season: record.season || undefined
          };
          await onImport('team', teamData);
          results.created.push(record);
        } else if (entityType === 'coaches') {
          const coachData = {
            full_name: record.full_name,
            email: record.email,
            phone: record.phone || undefined,
            specialization: record.specialization || 'General Coaching'
          };
          await onImport('coach', coachData);
          results.created.push(record);
        }
      } catch (error) {
        results.errors.push({ record, error: error.message });
      }
    }
    
    results.skipped = previewData.records.filter(r => r._isDuplicate);
    setResults(results);
    setImporting(false);
  };

  const resetDialog = () => {
    setFile(null);
    setPreviewData(null);
    setResults(null);
    setProgress(0);
    setImporting(false);
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Smart Import {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
          </DialogTitle>
        </DialogHeader>

        {!previewData && !results && (
          <div className="space-y-4 py-4">
            <div>
              <Label>Select CSV File</Label>
              <Input 
                type="file" 
                accept=".csv"
                onChange={handleFileSelect}
                className="mt-2"
              />
            </div>
            <div className="text-sm text-slate-500">
              <p className="font-medium mb-2">Expected columns for {entityType}:</p>
              {entityType === 'players' && (
                <p>full_name, email, phone, date_of_birth, gender, primary_position, team_name, jersey_number, parent_name, parent_email</p>
              )}
              {entityType === 'teams' && (
                <p>name, age_group, league, gender, season</p>
              )}
              {entityType === 'coaches' && (
                <p>full_name, email, phone, specialization</p>
              )}
            </div>
          </div>
        )}

        {previewData && !results && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <Badge className="bg-emerald-100 text-emerald-800">
                {previewData.records.filter(r => !r._isDuplicate).length} New
              </Badge>
              <Badge className="bg-orange-100 text-orange-800">
                {previewData.records.filter(r => r._isDuplicate).length} Duplicates (will skip)
              </Badge>
              {entityType === 'players' && (
                <Badge className="bg-blue-100 text-blue-800">
                  {previewData.records.filter(r => r._teamMatch).length} Team Matches
                </Badge>
              )}
            </div>

            <ScrollArea className="flex-1 border rounded-lg">
              <div className="p-2 space-y-2">
                {previewData.records.slice(0, 50).map((record, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-lg border ${
                      record._isDuplicate ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {record._isDuplicate ? (
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        )}
                        <span className="font-medium">
                          {record.full_name || record.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {record._isDuplicate && (
                          <Badge variant="outline" className="text-orange-600">Duplicate</Badge>
                        )}
                        {record._teamMatch && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            → {record._teamMatch.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {entityType === 'players' && record.team_name && !record._teamMatch && (
                      <div className="text-xs text-orange-600 mt-1">
                        No team match found for: {record.team_name}
                      </div>
                    )}
                  </div>
                ))}
                {previewData.records.length > 50 && (
                  <div className="text-center text-slate-500 py-2">
                    ... and {previewData.records.length - 50} more records
                  </div>
                )}
              </div>
            </ScrollArea>

            {importing && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Importing... {progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={resetDialog}>Back</Button>
              <Button 
                onClick={handleImport} 
                disabled={importing}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {importing ? 'Importing...' : `Import ${previewData.records.filter(r => !r._isDuplicate).length} Records`}
              </Button>
            </div>
          </div>
        )}

        {results && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-50 rounded-lg text-center">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-emerald-700">{results.created.length}</div>
                <div className="text-sm text-emerald-600">Created</div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg text-center">
                <AlertTriangle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-700">{results.skipped.length}</div>
                <div className="text-sm text-orange-600">Skipped (Duplicates)</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg text-center">
                <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-700">{results.errors.length}</div>
                <div className="text-sm text-red-600">Errors</div>
              </div>
            </div>

            {results.parentsCreated.length > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="font-medium text-blue-800">
                  {results.parentsCreated.length} parents will need to be invited
                </div>
              </div>
            )}

            {results.errors.length > 0 && (
              <ScrollArea className="h-32 border rounded-lg">
                <div className="p-2 space-y-1">
                  {results.errors.map((err, idx) => (
                    <div key={idx} className="text-sm text-red-600">
                      {err.record.full_name || err.record.name}: {err.error}
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