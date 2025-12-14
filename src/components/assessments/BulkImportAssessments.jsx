import React, { useState } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

export default function BulkImportAssessments({ players, teams, onImportComplete }) {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [unassignedList, setUnassignedList] = useState([]);
  const [matchedList, setMatchedList] = useState([]);
  const [currentStatus, setCurrentStatus] = useState('');

  const downloadTemplate = () => {
    const csv = 'Name,Team,Date,Sprint,Vertical,YIRT,Shuttle\nJohn Doe,Team A,2025-01-15,3.5,15,45,4.8\nJane Smith,Team B,2025-01-16,3.2,18,50,';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'assessment_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, '').toLowerCase());
    
    return lines.slice(1).map((line, idx) => {
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/^["']|["']$/g, ''));
      
      const row = { _lineNumber: idx + 2 };
      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });
      return row;
    });
  };

  const matchPlayer = (playerName, players) => {
    if (!playerName) return null;
    
    const normalize = (str) => str.toLowerCase().trim().replace(/\s+/g, ' ').replace(/['".,]/g, '');
    const normalizedInput = normalize(playerName);
    
    // Try exact match first
    let match = players.find(p => normalize(p.full_name) === normalizedInput);
    if (match) return match;
    
    // Parse name parts
    const inputParts = normalizedInput.split(/[,\s]+/).filter(Boolean);
    
    for (const player of players) {
      const playerName = normalize(player.full_name);
      const playerParts = playerName.split(/\s+/).filter(Boolean);
      
      if (playerParts.length === 0 || inputParts.length === 0) continue;
      
      // Handle "Last, First" format
      if (normalizedInput.includes(',')) {
        const [last, ...rest] = normalizedInput.split(',');
        const first = rest.join(' ').trim();
        const playerLast = playerParts[playerParts.length - 1];
        const playerFirst = playerParts.slice(0, -1).join(' ');
        
        if (normalize(last) === playerLast && normalize(first) === playerFirst) return player;
      }
      
      // Match by last name + first initial or first name
      const inputLast = inputParts[inputParts.length - 1];
      const inputFirst = inputParts[0];
      const playerLast = playerParts[playerParts.length - 1];
      const playerFirst = playerParts[0];
      
      if (inputLast === playerLast) {
        // Exact first name match
        if (inputFirst === playerFirst) return player;
        // First initial match
        if (inputFirst.length === 1 && playerFirst.startsWith(inputFirst)) return player;
        if (playerFirst.length === 1 && inputFirst.startsWith(playerFirst)) return player;
        // Partial first name match
        if (inputFirst.length >= 3 && playerFirst.startsWith(inputFirst)) return player;
        if (playerFirst.length >= 3 && inputFirst.startsWith(playerFirst)) return player;
      }
      
      // Try reversed (First Last vs Last First)
      if (inputParts.length === 2 && playerParts.length >= 2) {
        if (inputParts[0] === playerParts[playerParts.length - 1] && 
            inputParts[1] === playerParts[0]) {
          return player;
        }
      }
    }
    
    return null;
  };

  const calculateScores = (sprint, vertical, yirt, shuttle = null) => {
    const speed = sprint > 0 ? 5 * (20 - 10 * (3.5 * (sprint - 2.8) / sprint)) : 0;
    let power = 0;
    if (vertical > 13) power = 5 * (20 - (20 * (26 - vertical) / vertical));
    else if (vertical === 13) power = 10;
    else if (vertical === 12) power = 9;
    else if (vertical === 11) power = 8;
    else if (vertical === 10) power = 7;
    else if (vertical < 10) power = 5;
    
    const endurance = yirt > 0 ? 5 * (20 - 10 * (55 - yirt) / 32) : 0;
    const agility = shuttle && shuttle > 0 ? 5 * (20 - 10 * (5.2 * (shuttle - 4.6) / shuttle)) : 0;
    const overall = ((6 * speed) + (3 * power) + (6 * endurance)) / 15;
    
    return {
      speed_score: Math.max(0, Math.min(100, Math.round(speed))),
      power_score: Math.max(0, Math.min(100, Math.round(power))),
      endurance_score: Math.max(0, Math.min(100, Math.round(endurance))),
      agility_score: shuttle ? Math.max(0, Math.min(100, Math.round(agility))) : 0,
      overall_score: Math.max(0, Math.min(100, Math.round(overall)))
    };
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setProgress(0);
    setErrors([]);
    setDuplicates([]);
    setUnassignedList([]);
    setMatchedList([]);
    setCurrentStatus('Parsing CSV...');

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      
      setCurrentStatus(`Analyzing ${rows.length} records...`);
      
      const importErrors = [];
      const assessmentsToCreate = [];
      const unassignedToCreate = [];
      const foundDuplicates = [];
      const matched = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        setProgress(((i + 1) / rows.length) * 50);
        
        const playerName = row.name || row.player || row['player name'] || '';
        const teamName = row.team || row['team name'] || '';
        const date = row.date || row.assessment_date || '';
        const sprint = parseFloat(row.sprint || '0');
        const vertical = parseFloat(row.vertical || '0');
        const yirt = parseFloat(row.yirt || '0');
        const shuttle = parseFloat(row.shuttle || '0');

        if (!playerName) {
          importErrors.push({ line: row._lineNumber, error: 'Missing player name', row: playerName });
          continue;
        }
        if (!date) {
          importErrors.push({ line: row._lineNumber, error: 'Missing date', row: playerName });
          continue;
        }
        if (isNaN(sprint) || sprint === 0 || isNaN(vertical) || vertical === 0 || isNaN(yirt) || yirt === 0) {
          importErrors.push({ line: row._lineNumber, error: 'Missing required metrics (Sprint, Vertical, YIRT)', row: playerName });
          continue;
        }

        const player = matchPlayer(playerName, players);

        if (!player) {
          const scores = calculateScores(sprint, vertical, yirt, !isNaN(shuttle) && shuttle > 0 ? shuttle : null);
          unassignedToCreate.push({
            player_name: playerName,
            team_name: teamName,
            assessment_date: date,
            sprint,
            vertical,
            yirt,
            shuttle: !isNaN(shuttle) && shuttle > 0 ? shuttle : 0,
            ...scores
          });
          continue;
        }

        // Check for duplicates
        const isDuplicate = assessmentsToCreate.some(a => 
          a.player_id === player.id && a.assessment_date === date
        );
        if (isDuplicate) {
          foundDuplicates.push({ line: row._lineNumber, player: player.full_name, date });
          continue;
        }

        const team = teams.find(t => {
          if (!teamName) return null;
          const tName = t.name.toLowerCase().trim();
          const rTeam = teamName.toLowerCase().trim();
          return tName === rTeam || tName.includes(rTeam) || rTeam.includes(tName);
        });

        const scores = calculateScores(sprint, vertical, yirt, !isNaN(shuttle) && shuttle > 0 ? shuttle : null);
        
        const assessmentData = {
          player_id: player.id,
          player_name: player.full_name,
          team_id: team?.id || '',
          assessment_date: date,
          sprint,
          vertical,
          yirt,
          shuttle: !isNaN(shuttle) && shuttle > 0 ? shuttle : 0,
          ...scores
        };
        
        assessmentsToCreate.push(assessmentData);
        matched.push({ player: player.full_name, team: team?.name || 'N/A' });
      }

      setErrors(importErrors);
      setDuplicates(foundDuplicates);
      setUnassignedList(unassignedToCreate);
      setMatchedList(matched);

      // Import in batches
      const BATCH_SIZE = 5;
      const totalItems = assessmentsToCreate.length + (unassignedToCreate.length > 0 ? 1 : 0);
      let imported = 0;

      setCurrentStatus('Importing matched assessments...');
      
      for (let i = 0; i < assessmentsToCreate.length; i += BATCH_SIZE) {
        const batch = assessmentsToCreate.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(assessmentsToCreate.length / BATCH_SIZE);
        
        setCurrentStatus(`Batch ${batchNum}/${totalBatches}: Importing ${batch.length} assessments...`);
        
        await onImportComplete(batch, []);
        imported += batch.length;
        setProgress(50 + ((imported / totalItems) * 50));
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Import unassigned
      if (unassignedToCreate.length > 0) {
        setCurrentStatus('Creating unassigned records...');
        await onImportComplete([], unassignedToCreate);
      }

      setCurrentStatus('Complete!');
      setResults({
        total: rows.length,
        success: assessmentsToCreate.length,
        unassigned: unassignedToCreate.length,
        duplicates: foundDuplicates.length,
        failed: importErrors.length
      });
      setProgress(100);
    } catch (error) {
      setErrors([{ line: 0, error: `Import failed: ${error.message}`, row: '' }]);
      setCurrentStatus('Failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Import Physical Assessments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Upload CSV with: Name, Team, Date, Sprint, Vertical, YIRT, Shuttle (optional)
            </AlertDescription>
          </Alert>

          <Button onClick={downloadTemplate} variant="outline" className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Download CSV Template
          </Button>

          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files[0])}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-sm text-slate-600">
                {file ? file.name : 'Click to upload CSV file'}
              </p>
            </label>
          </div>

          {file && !results && (
            <Button 
              onClick={handleImport} 
              disabled={importing}
              className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-base font-semibold"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                'Start Import'
              )}
            </Button>
          )}

          {importing && (
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">Import Progress</span>
                  <span className="text-sm font-bold text-emerald-600">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-3" />
                <p className="text-sm text-slate-600 text-center">{currentStatus}</p>
                
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="p-2 bg-white rounded-lg text-center shadow-sm">
                    <div className="text-xl font-bold text-green-600">{matchedList.length}</div>
                    <div className="text-xs text-slate-600">Matched</div>
                  </div>
                  <div className="p-2 bg-white rounded-lg text-center shadow-sm">
                    <div className="text-xl font-bold text-orange-600">{unassignedList.length}</div>
                    <div className="text-xs text-slate-600">Unassigned</div>
                  </div>
                  <div className="p-2 bg-white rounded-lg text-center shadow-sm">
                    <div className="text-xl font-bold text-red-600">{errors.length}</div>
                    <div className="text-xs text-slate-600">Errors</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {results && (
            <div className="space-y-3">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <div className="font-semibold mb-2 text-green-900">Import Complete!</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>✓ <strong>{results.success}</strong> imported</div>
                    <div>⊗ <strong>{results.duplicates}</strong> duplicates</div>
                    <div className="text-orange-700">⚠ <strong>{results.unassigned}</strong> unassigned</div>
                    <div className="text-red-700">✗ <strong>{results.failed}</strong> errors</div>
                  </div>
                </AlertDescription>
              </Alert>

              <Tabs defaultValue="matched" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="matched">Matched ({matchedList.length})</TabsTrigger>
                  <TabsTrigger value="unassigned">Unassigned ({unassignedList.length})</TabsTrigger>
                  <TabsTrigger value="duplicates">Duplicates ({duplicates.length})</TabsTrigger>
                  <TabsTrigger value="errors">Errors ({errors.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="matched">
                  <ScrollArea className="h-64 border rounded-lg p-3">
                    <div className="space-y-1">
                      {matchedList.map((item, idx) => (
                        <div key={idx} className="text-xs p-2 bg-green-50 rounded flex justify-between">
                          <span className="font-medium">{item.player}</span>
                          <Badge variant="outline" className="text-[9px]">{item.team}</Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="unassigned">
                  <ScrollArea className="h-64 border rounded-lg p-3">
                    <div className="space-y-1">
                      {unassignedList.map((item, idx) => (
                        <div key={idx} className="text-xs p-2 bg-orange-50 rounded">
                          <div className="font-medium text-orange-900">"{item.player_name}"</div>
                          <div className="text-orange-700">No matching player found - saved as unassigned</div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="duplicates">
                  <ScrollArea className="h-64 border rounded-lg p-3">
                    <div className="space-y-1">
                      {duplicates.map((item, idx) => (
                        <div key={idx} className="text-xs p-2 bg-amber-50 rounded">
                          Line {item.line}: <strong>{item.player}</strong> on {item.date}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="errors">
                  <ScrollArea className="h-64 border rounded-lg p-3">
                    <div className="space-y-1">
                      {errors.map((item, idx) => (
                        <div key={idx} className="text-xs p-2 bg-red-50 rounded">
                          <div className="font-medium text-red-900">Line {item.line}: {item.row || 'Unknown'}</div>
                          <div className="text-red-700">{item.error}</div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>

              <Button onClick={() => { setResults(null); setFile(null); }} className="w-full">
                Import Another File
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}