import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CheckCircle, XCircle, AlertTriangle, Upload, Loader2, Download, Info } from 'lucide-react';

const FIELD_CONFIGS = {
  players: {
    fields: [
      { key: 'parent_name', label: 'Parent Name', required: false },
      { key: 'email', label: 'Email', required: false },
      { key: 'phone_number', label: 'Phone Number', required: false },
      { key: 'player_last_name', label: 'Player Last Name', required: true },
      { key: 'player_first_name', label: 'Player First Name', required: true },
      { key: 'date_of_birth', label: 'Date of Birth', required: false },
      { key: 'gender', label: 'Gender', required: true },
      { key: 'grade', label: 'Grade', required: false },
      { key: 'team_name', label: 'Team Name', required: false },
      { key: 'branch', label: 'Branch', required: false },
      { key: 'season', label: 'Season', required: false }
    ],
    template: 'Parent Name,Email,Phone Number,Player Last Name,Player First Name,Date of Birth,Gender,Grade,Team Name,Branch,Season'
  },
  teams: {
    fields: [
      { key: 'team_name', label: 'Team Name', required: true },
      { key: 'age_group', label: 'Age Group', required: true },
      { key: 'gender', label: 'Gender', required: true },
      { key: 'league', label: 'League', required: false },
      { key: 'branch', label: 'Branch', required: false },
      { key: 'season', label: 'Season', required: false },
      { key: 'coach', label: 'Coach', required: false }
    ],
    template: 'Team Name,Age Group,Gender,League,Branch,Season,Coach'
  },
  coaches: {
    fields: [
      { key: 'first_name', label: 'First Name', required: true },
      { key: 'last_name', label: 'Last Name', required: true },
      { key: 'email_address', label: 'Email Address', required: false },
      { key: 'phone_number', label: 'Phone Number', required: false },
      { key: 'branch', label: 'Branch', required: false }
    ],
    template: 'First Name,Last Name,Email Address,Phone Number,Branch'
  }
};

export default function SmartImportDialog({ 
  open, 
  onClose, 
  entityType, 
  existingData = [],
  teams = [],
  coaches = [],
  players = [],
  onImport,
  onBulkImport
}) {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [duplicateActions, setDuplicateActions] = useState({});

  const config = FIELD_CONFIGS[entityType] || {};

  const downloadTemplate = () => {
    const blob = new Blob([config.template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entityType}_template.csv`;
    a.click();
  };

  const parseCSV = (text) => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase().replace(/ /g, '_'));
    
    const records = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Handle CSV with commas inside quotes
      const values = [];
      let current = '';
      let inQuotes = false;
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      
      const record = {};
      let hasRequiredData = false;
      
      headers.forEach((h, idx) => {
        let val = (values[idx] || '').replace(/^"|"$/g, '').replace(/""/g, '"').trim();
        record[h] = val;
      });
      
      // Check if record has meaningful data (at least one required field or name)
      const hasName = record.full_name || record.player_first_name || record.player_last_name || 
                      record.first_name || record.last_name || record.team_name || record.name;
      const hasEmail = record.email || record.email_address;
      
      if (hasName || hasEmail) {
        hasRequiredData = true;
      }
      
      if (hasRequiredData) {
        records.push(record);
      }
    }
    return { headers, records };
  };

  const normalizeRecord = (record, entityType) => {
    if (entityType === 'players') {
      const firstName = record.player_first_name || '';
      const lastName = record.player_last_name || '';
      return {
        ...record,
        full_name: `${firstName} ${lastName}`.trim(),
        phone: record.phone_number || record.phone,
        email: record.email
      };
    }
    if (entityType === 'teams') {
      return {
        ...record,
        name: record.team_name || record.name
      };
    }
    if (entityType === 'coaches') {
      const firstName = record.first_name || '';
      const lastName = record.last_name || '';
      return {
        ...record,
        full_name: `${firstName} ${lastName}`.trim(),
        email: record.email_address || record.email,
        phone: record.phone_number || record.phone
      };
    }
    return record;
  };

  const findBestTeamMatch = (teamName) => {
    if (!teamName) return null;
    const normalizedName = teamName.toLowerCase().trim();
    let match = teams.find(t => t.name?.toLowerCase() === normalizedName);
    if (match) return match;
    match = teams.find(t => 
      t.name?.toLowerCase().includes(normalizedName) || 
      normalizedName.includes(t.name?.toLowerCase() || '')
    );
    return match || null;
  };

  const findCoachMatch = (coachName) => {
    if (!coachName) return null;
    const normalizedName = coachName.toLowerCase().trim();
    return coaches.find(c => c.full_name?.toLowerCase().includes(normalizedName));
  };

  const checkDuplicate = (record, entityType) => {
    const normalized = normalizeRecord(record, entityType);
    
    if (entityType === 'players') {
      return existingData.find(p => 
        p.full_name?.toLowerCase() === normalized.full_name?.toLowerCase() ||
        (normalized.email && p.email?.toLowerCase() === normalized.email?.toLowerCase())
      );
    }
    if (entityType === 'teams') {
      return existingData.find(t => t.name?.toLowerCase() === normalized.name?.toLowerCase());
    }
    if (entityType === 'coaches') {
      return existingData.find(c => 
        c.email?.toLowerCase() === normalized.email?.toLowerCase() ||
        c.full_name?.toLowerCase() === normalized.full_name?.toLowerCase()
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
    
    const analyzed = records.map((record, idx) => {
      const normalized = normalizeRecord(record, entityType);
      const duplicate = checkDuplicate(record, entityType);
      let teamMatch = null;
      let coachMatch = null;
      
      if (entityType === 'players') {
        teamMatch = findBestTeamMatch(record.team_name);
      }
      if (entityType === 'teams') {
        coachMatch = findCoachMatch(record.coach);
      }
      
      return {
        ...record,
        _normalized: normalized,
        _idx: idx,
        _isDuplicate: !!duplicate,
        _duplicateOf: duplicate,
        _teamMatch: teamMatch,
        _coachMatch: coachMatch
      };
    });
    
    const initialActions = {};
    analyzed.forEach((r, idx) => {
      if (r._isDuplicate) {
        initialActions[idx] = 'skip';
      }
    });
    setDuplicateActions(initialActions);
    setPreviewData({ headers, records: analyzed });
  };

  const handleDuplicateAction = (idx, action) => {
    setDuplicateActions(prev => ({ ...prev, [idx]: action }));
  };

  const handleImport = async () => {
    if (!previewData) return;
    
    setImporting(true);
    setProgress(0);
    
    const results = {
      created: [],
      updated: [],
      skipped: [],
      errors: []
    };
    
    const recordsToProcess = previewData.records;
    const total = recordsToProcess.length;
    
    // Batch processing to avoid rate limits
    const BATCH_SIZE = 3;
    const DELAY_MS = 2000;
    
    for (let i = 0; i < recordsToProcess.length; i += BATCH_SIZE) {
      const batch = recordsToProcess.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batch.map(async (record) => {
        const action = record._isDuplicate ? (duplicateActions[record._idx] || 'skip') : 'create';
        
        try {
          if (action === 'skip') {
            results.skipped.push(record);
            return;
          }
          
          if (entityType === 'players') {
            const playerData = {
              full_name: record._normalized.full_name,
              email: record._normalized.email || undefined,
              phone: record._normalized.phone || undefined,
              date_of_birth: record.date_of_birth || undefined,
              gender: record.gender || 'Female',
              grade: record.grade || undefined,
              parent_name: record.parent_name || undefined,
              team_id: record._teamMatch?.id || undefined,
              branch: record.branch || undefined,
              status: 'Active'
            };
            
            if (action === 'replace' && record._duplicateOf) {
              await onImport('player_update', { id: record._duplicateOf.id, data: playerData });
              results.updated.push(record);
            } else {
              await onImport('player', playerData);
              results.created.push(record);
            }
          } else if (entityType === 'teams') {
            const teamData = {
              name: record._normalized.name,
              age_group: record.age_group,
              league: record.league || undefined,
              branch: record.branch || undefined,
              gender: record.gender || 'Female',
              season: record.season || undefined
            };
            
            if (action === 'replace' && record._duplicateOf) {
              await onImport('team_update', { id: record._duplicateOf.id, data: teamData });
              results.updated.push(record);
            } else {
              const newTeam = await onImport('team', teamData);
              if (record._coachMatch && newTeam?.id) {
                const coach = record._coachMatch;
                const updatedTeamIds = [...(coach.team_ids || []), newTeam.id];
                await onImport('coach_update', { id: coach.id, data: { team_ids: updatedTeamIds } });
              }
              results.created.push(record);
            }
          } else if (entityType === 'coaches') {
            const coachData = {
              full_name: record._normalized.full_name,
              first_name: record.first_name,
              last_name: record.last_name,
              email: record._normalized.email || undefined,
              phone: record._normalized.phone || undefined,
              branch: record.branch || undefined,
              specialization: 'General Coaching'
            };
            
            if (action === 'replace' && record._duplicateOf) {
              await onImport('coach_update', { id: record._duplicateOf.id, data: coachData });
              results.updated.push(record);
            } else {
              await onImport('coach', coachData);
              results.created.push(record);
            }
          }
        } catch (error) {
          results.errors.push({ record, error: error.message });
        }
      }));
      
      setProgress(Math.round(((i + batch.length) / total) * 100));
      
      if (i + BATCH_SIZE < recordsToProcess.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }
    }
    
    setResults(results);
    setImporting(false);
  };

  const resetDialog = () => {
    setFile(null);
    setPreviewData(null);
    setResults(null);
    setProgress(0);
    setImporting(false);
    setDuplicateActions({});
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  const duplicateRecords = previewData?.records.filter(r => r._isDuplicate) || [];
  const newRecords = previewData?.records.filter(r => !r._isDuplicate) || [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
          </DialogTitle>
        </DialogHeader>

        {!previewData && !results && (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Label>Select CSV File</Label>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </div>
            <Input 
              type="file" 
              accept=".csv"
              onChange={handleFileSelect}
            />
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 mb-2">Required Fields for {entityType}:</p>
                  <div className="grid grid-cols-2 gap-1 text-sm">
                    {config.fields?.map(field => (
                      <div key={field.key} className="flex items-center gap-1">
                        {field.required ? (
                          <span className="text-red-500">*</span>
                        ) : (
                          <span className="text-transparent">*</span>
                        )}
                        <span className={field.required ? 'font-medium text-blue-900' : 'text-blue-700'}>
                          {field.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-blue-600 mt-2">* Required fields</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {previewData && !results && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <Badge className="bg-emerald-100 text-emerald-800">
                {newRecords.length} New
              </Badge>
              <Badge className="bg-orange-100 text-orange-800">
                {duplicateRecords.length} Duplicates
              </Badge>
              {entityType === 'players' && (
                <Badge className="bg-blue-100 text-blue-800">
                  {previewData.records.filter(r => r._teamMatch).length} Team Matches
                </Badge>
              )}
            </div>

            <ScrollArea className="flex-1 border rounded-lg">
              <div className="p-2 space-y-2">
                {previewData.records.map((record, idx) => (
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
                          {record._normalized?.full_name || record._normalized?.name}
                        </span>
                        {record._normalized?.email && (
                          <span className="text-xs text-slate-500">({record._normalized.email})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {record._teamMatch && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            → {record._teamMatch.name}
                          </Badge>
                        )}
                        {record._coachMatch && (
                          <Badge className="bg-purple-100 text-purple-800 text-xs">
                            Coach: {record._coachMatch.full_name}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {record._isDuplicate && (
                      <div className="mt-3 p-2 bg-orange-100 rounded">
                        <p className="text-xs text-orange-800 mb-2">
                          Duplicate of: <span className="font-medium">{record._duplicateOf?.full_name || record._duplicateOf?.name}</span>
                        </p>
                        <RadioGroup
                          value={duplicateActions[record._idx] || 'skip'}
                          onValueChange={(val) => handleDuplicateAction(record._idx, val)}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="skip" id={`skip-${idx}`} />
                            <Label htmlFor={`skip-${idx}`} className="text-xs">Skip (keep existing)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="replace" id={`replace-${idx}`} />
                            <Label htmlFor={`replace-${idx}`} className="text-xs">Replace (update existing)</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    )}
                  </div>
                ))}
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
                {importing ? 'Importing...' : 'Import Records'}
              </Button>
            </div>
          </div>
        )}

        {results && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-emerald-50 rounded-lg text-center">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-emerald-700">{results.created.length}</div>
                <div className="text-sm text-emerald-600">Created</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <CheckCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-700">{results.updated.length}</div>
                <div className="text-sm text-blue-600">Updated</div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg text-center">
                <AlertTriangle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-700">{results.skipped.length}</div>
                <div className="text-sm text-orange-600">Skipped</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg text-center">
                <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-700">{results.errors.length}</div>
                <div className="text-sm text-red-600">Errors</div>
              </div>
            </div>

            {results.errors.length > 0 && (
              <ScrollArea className="h-32 border rounded-lg">
                <div className="p-2 space-y-1">
                  {results.errors.map((err, idx) => (
                    <div key={idx} className="text-sm text-red-600">
                      {err.record._normalized?.full_name || err.record._normalized?.name}: {err.error}
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