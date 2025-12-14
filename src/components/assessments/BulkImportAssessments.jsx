import React, { useState } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

export default function BulkImportAssessments({ players, teams, onImportComplete, onClose }) {
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
    const csv = 'Name,Team,Date,Sprint,Vertical,YIRT,Shuttle\nJohn Doe,2007 Girls Academy,09/01/25,3.5,15,45,4.8\nJane Smith,2009 Girls Academy,09/01/25,3.2,18,50,5.1';
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
    
    const headerLine = lines[0];
    const headers = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < headerLine.length; i++) {
      const char = headerLine[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        headers.push(current.trim().replace(/['"]/g, '').toLowerCase());
        current = '';
      } else {
        current += char;
      }
    }
    headers.push(current.trim().replace(/['"]/g, '').toLowerCase());
    
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
    
    for (const player of players) {
      const playerName = normalize(player.full_name);
      
      // Exact match
      if (playerName === normalizedInput) return player;
      
      // Split into parts
      const inputParts = normalizedInput.split(/\s+/).filter(Boolean);
      const playerParts = playerName.split(/\s+/).filter(Boolean);
      
      if (inputParts.length === 0 || playerParts.length === 0) continue;
      
      const inputFirst = inputParts[0];
      const inputLast = inputParts[inputParts.length - 1];
      const playerFirst = playerParts[0];
      const playerLast = playerParts[playerParts.length - 1];
      
      // Match if last names are equal and first names match or start with same letters
      if (inputLast === playerLast) {
        if (inputFirst === playerFirst) return player;
        if (inputFirst.length >= 2 && playerFirst.startsWith(inputFirst.substring(0, 2))) return player;
        if (playerFirst.length >= 2 && inputFirst.startsWith(playerFirst.substring(0, 2))) return player;
      }
      
      // Try reversed
      if (inputParts.length >= 2 && playerParts.length >= 2) {
        if (inputFirst === playerLast && inputLast === playerFirst) return player;
      }
    }
    
    return null;
  };

  const matchTeam = (teamName, teams, playerName) => {
    if (!teamName) return null;
    
    const normalize = (str) => str.toLowerCase().trim().replace(/\s+/g, ' ');
    const normalizedTeam = normalize(teamName);
    
    // Try exact match first
    let team = teams.find(t => normalize(t.name) === normalizedTeam);
    if (team) return team;
    
    // Try partial match
    team = teams.find(t => {
      const tName = normalize(t.name);
      return tName.includes(normalizedTeam) || normalizedTeam.includes(tName);
    });
    if (team) return team;
    
    // Try matching by team name containing year group
    const yearMatch = teamName.match(/20\d{2}/);
    if (yearMatch) {
      team = teams.find(t => normalize(t.name).includes(yearMatch[0]));
      if (team) return team;
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
    setResults(null);
    setCurrentStatus('Reading file...');

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      
      setCurrentStatus(`Analyzing ${rows.length} records...`);
      setProgress(5);
      
      const importErrors = [];
      const assessmentsToCreate = [];
      const unassignedToCreate = [];
      const foundDuplicates = [];
      const matched = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const analyzeProgress = 5 + ((i + 1) / rows.length) * 25;
        setProgress(analyzeProgress);
        
        const playerName = (row.name || row.player || row['player name'] || '').trim();
        const teamName = (row.team || row['team name'] || '').trim();
        const dateStr = (row.date || row.assessment_date || '').trim();
        
        // Parse date from MM/DD/YY format
        let date = '';
        if (dateStr) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            let [month, day, year] = parts;
            if (year.length === 2) {
              year = parseInt(year) >= 50 ? `19${year}` : `20${year}`;
            }
            date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
        }
        
        const sprint = parseFloat(row.sprint || '0');
        const vertical = parseFloat(row.vertical || '0');
        const yirt = parseFloat(row.yirt || '0');
        const shuttle = parseFloat(row.shuttle || '0');

        if (!playerName) {
          importErrors.push({ line: row._lineNumber, error: 'Missing player name', row: '' });
          continue;
        }
        if (!date) {
          importErrors.push({ line: row._lineNumber, error: 'Invalid date format', row: playerName });
          continue;
        }
        if (isNaN(sprint) || sprint === 0 || isNaN(vertical) || vertical === 0 || isNaN(yirt) || yirt === 0) {
          importErrors.push({ line: row._lineNumber, error: 'Missing Sprint/Vertical/YIRT', row: playerName });
          continue;
        }

        const player = matchPlayer(playerName, players);
        const team = matchTeam(teamName, teams, playerName);
        
        const scores = calculateScores(sprint, vertical, yirt, !isNaN(shuttle) && shuttle > 0 ? shuttle : null);

        if (!player) {
          unassignedToCreate.push({
            player_name: playerName,
            team_id: team?.id || '',
            assessment_date: date,
            sprint,
            vertical,
            yirt,
            shuttle: !isNaN(shuttle) && shuttle > 0 ? shuttle : 0,
            ...scores
          });
          continue;
        }

        // Check duplicates
        const isDuplicate = assessmentsToCreate.some(a => 
          a.player_id === player.id && a.assessment_date === date
        );
        if (isDuplicate) {
          foundDuplicates.push({ line: row._lineNumber, player: player.full_name, date });
          continue;
        }
        
        const assessmentData = {
          player_id: player.id,
          player_name: player.full_name,
          team_id: team?.id || player.team_id || '',
          assessment_date: date,
          sprint,
          vertical,
          yirt,
          shuttle: !isNaN(shuttle) && shuttle > 0 ? shuttle : 0,
          ...scores
        };
        
        assessmentsToCreate.push(assessmentData);
        matched.push({ player: player.full_name, team: team?.name || 'N/A', date });
      }

      setErrors(importErrors);
      setDuplicates(foundDuplicates);
      setUnassignedList(unassignedToCreate);
      setMatchedList(matched);
      setProgress(30);

      // Import ALL matched assessments in batches
      const BATCH_SIZE = 10;
      let imported = 0;
      const totalToImport = assessmentsToCreate.length;

      setCurrentStatus(`Starting import of ${totalToImport} matched records...`);
      
      for (let i = 0; i < assessmentsToCreate.length; i += BATCH_SIZE) {
        const batch = assessmentsToCreate.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(assessmentsToCreate.length / BATCH_SIZE);
        
        setCurrentStatus(`Batch ${batchNum}/${totalBatches}: Creating ${batch.length} assessments (${imported + batch.length}/${totalToImport} total)...`);
        
        try {
          await onImportComplete(batch, []);
          imported += batch.length;
          
          const importProgress = 30 + ((imported / totalToImport) * 60);
          setProgress(importProgress);
          
          // Small delay between batches
          await new Promise(resolve => setTimeout(resolve, 800));
        } catch (batchError) {
          console.error(`Batch ${batchNum} error:`, batchError);
          // Continue with next batch even if one fails
          importErrors.push({ 
            line: `Batch ${batchNum}`, 
            error: batchError.message, 
            row: `Records ${i+1}-${Math.min(i+BATCH_SIZE, assessmentsToCreate.length)}` 
          });
        }
      }

      // Import unassigned
      if (unassignedToCreate.length > 0) {
        try {
          setCurrentStatus('Creating unassigned records...');
          setProgress(90);
          await onImportComplete([], unassignedToCreate);
        } catch (unassignedError) {
          console.error('Unassigned import error:', unassignedError);
          importErrors.push({ line: 'Unassigned', error: unassignedError.message, row: 'Unassigned records' });
        }
      }

      setCurrentStatus('Complete!');
      setProgress(100);
      setResults({
        total: rows.length,
        success: imported,
        unassigned: unassignedToCreate.length,
        duplicates: foundDuplicates.length,
        failed: importErrors.length
      });
      
    } catch (error) {
      console.error('Import error:', error);
      setErrors([{ line: 0, error: `Import failed: ${error.message}`, row: 'N/A' }]);
      setCurrentStatus('Failed');
      setProgress(100);
      setResults({
        total: 0,
        success: 0,
        unassigned: 0,
        duplicates: 0,
        failed: 1
      });
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResults(null);
    setErrors([]);
    setDuplicates([]);
    setUnassignedList([]);
    setMatchedList([]);
    setProgress(0);
    setCurrentStatus('');
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Bulk Import Physical Assessments</CardTitle>
            {results && (
              <Button variant="ghost" size="icon" onClick={handleReset}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!results && (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  CSV Format: Name, Team, Date (MM/DD/YY), Sprint, Vertical, YIRT, Shuttle (optional)
                </AlertDescription>
              </Alert>

              <Button onClick={downloadTemplate} variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>

              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="hidden"
                  id="csv-upload"
                  disabled={importing}
                />
                <label htmlFor="csv-upload" className={importing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}>
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-sm text-slate-600">
                    {file ? file.name : 'Click to select CSV file'}
                  </p>
                </label>
              </div>

              {file && (
                <Button 
                  onClick={handleImport} 
                  disabled={importing}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-base font-semibold"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing... Do not close
                    </>
                  ) : (
                    'Start Import'
                  )}
                </Button>
              )}
            </>
          )}

          {importing && (
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">Import Progress</span>
                  <span className="text-sm font-bold text-emerald-600">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-3" />
                <p className="text-sm text-slate-600 text-center font-medium">{currentStatus}</p>
                
                <div className="grid grid-cols-4 gap-2 mt-4">
                  <div className="p-3 bg-white rounded-lg text-center shadow-sm border border-green-200">
                    <div className="text-2xl font-bold text-green-600">{matchedList.length}</div>
                    <div className="text-xs text-slate-600 mt-1">Matched</div>
                  </div>
                  <div className="p-3 bg-white rounded-lg text-center shadow-sm border border-orange-200">
                    <div className="text-2xl font-bold text-orange-600">{unassignedList.length}</div>
                    <div className="text-xs text-slate-600 mt-1">Unassigned</div>
                  </div>
                  <div className="p-3 bg-white rounded-lg text-center shadow-sm border border-amber-200">
                    <div className="text-2xl font-bold text-amber-600">{duplicates.length}</div>
                    <div className="text-xs text-slate-600 mt-1">Duplicates</div>
                  </div>
                  <div className="p-3 bg-white rounded-lg text-center shadow-sm border border-red-200">
                    <div className="text-2xl font-bold text-red-600">{errors.length}</div>
                    <div className="text-xs text-slate-600 mt-1">Errors</div>
                  </div>
                </div>
                
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertDescription className="text-xs text-blue-900 font-medium text-center">
                    ⏳ Please wait - Do not close this dialog
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {results && (
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <div className="font-semibold mb-2 text-green-900">Import Complete!</div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-green-900">
                    <div>✓ {results.success} imported successfully</div>
                    <div>⊗ {results.duplicates} duplicates skipped</div>
                    <div className="text-orange-700">⚠ {results.unassigned} saved as unassigned</div>
                    <div className="text-red-700">✗ {results.failed} errors</div>
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
                  <ScrollArea className="h-80 border rounded-lg p-3 bg-white">
                    <div className="space-y-1">
                      {matchedList.map((item, idx) => (
                        <div key={idx} className="text-xs p-2 bg-green-50 rounded flex justify-between items-center">
                          <span className="font-medium">{item.player}</span>
                          <div className="flex gap-2 items-center">
                            <Badge variant="outline" className="text-[9px]">{item.team}</Badge>
                            <span className="text-slate-500 text-[10px]">{item.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="unassigned">
                  <ScrollArea className="h-80 border rounded-lg p-3 bg-white">
                    <div className="space-y-1">
                      {unassignedList.map((item, idx) => (
                        <div key={idx} className="text-xs p-3 bg-orange-50 rounded border border-orange-200">
                          <div className="font-medium text-orange-900">"{item.player_name}"</div>
                          <div className="text-orange-700 text-[10px] mt-1">Date: {item.assessment_date} - No player match found</div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="duplicates">
                  <ScrollArea className="h-80 border rounded-lg p-3 bg-white">
                    <div className="space-y-1">
                      {duplicates.map((item, idx) => (
                        <div key={idx} className="text-xs p-2 bg-amber-50 rounded border border-amber-200">
                          Line {item.line}: <strong>{item.player}</strong> • {item.date} (already exists)
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="errors">
                  <ScrollArea className="h-80 border rounded-lg p-3 bg-white">
                    <div className="space-y-1">
                      {errors.map((item, idx) => (
                        <div key={idx} className="text-xs p-3 bg-red-50 rounded border border-red-200">
                          <div className="font-medium text-red-900">Line {item.line}: {item.row}</div>
                          <div className="text-red-700 text-[10px] mt-1">{item.error}</div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>

              <div className="flex gap-3">
                <Button onClick={handleReset} variant="outline" className="flex-1">
                  Import Another File
                </Button>
                <Button onClick={handleClose} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                  Close
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}