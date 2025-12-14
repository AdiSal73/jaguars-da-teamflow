import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Loader2, Copy, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';

export default function BulkImportAssessments({ players, teams, onClose }) {
  const [pastedData, setPastedData] = useState('');
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [unassignedList, setUnassignedList] = useState([]);
  const [matchedList, setMatchedList] = useState([]);
  const [currentStatus, setCurrentStatus] = useState('');
  const [importMethod, setImportMethod] = useState('paste');

  const template = `Name\tDate\tSprint\tVertical\tYIRT\tShuttle
Alexis Blondeel\t09/01/2025\t3.37\t16.3\t11\t5.77
Allison Kraus\t09/01/2025\t3.31\t17.9\t45\t5.39`;

  const copyTemplate = () => {
    navigator.clipboard.writeText(template);
  };

  const parseCSV = async (file) => {
    const text = await file.text();
    return parseData(text);
  };

  const parseData = (text) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) return [];
    
    const firstLine = lines[0];
    const delimiter = firstLine.includes('\t') ? '\t' : ',';
    
    const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());
    
    return lines.slice(1).map((line, idx) => {
      const values = line.split(delimiter).map(v => v.trim());
      const row = { _lineNumber: idx + 2 };
      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });
      return row;
    });
  };

  const matchPlayer = (playerName) => {
    if (!playerName) return null;
    
    const norm = (str) => str.toLowerCase().trim().replace(/\s+/g, '');
    const input = norm(playerName);
    
    return players.find(p => {
      const pName = norm(p.full_name);
      if (pName === input) return true;
      
      const iParts = playerName.toLowerCase().trim().split(/\s+/);
      const pParts = p.full_name.toLowerCase().trim().split(/\s+/);
      
      if (iParts.length >= 2 && pParts.length >= 2) {
        const iLast = iParts[iParts.length - 1];
        const pLast = pParts[pParts.length - 1];
        const iFirst = iParts[0];
        const pFirst = pParts[0];
        
        if (iLast === pLast && (iFirst === pFirst || iFirst.startsWith(pFirst[0]) || pFirst.startsWith(iFirst[0]))) {
          return true;
        }
      }
      
      return false;
    });
  };

  const calculateScores = (sprint, vertical, yirt, shuttle) => {
    sprint = parseFloat(sprint) || 0;
    vertical = parseFloat(vertical) || 0;
    yirt = parseFloat(yirt) || 0;
    shuttle = parseFloat(shuttle) || 0;

    const speed = sprint > 0 ? 5 * (20 - 10 * (3.5 * (sprint - 2.8) / sprint)) : 0;
    
    let power = 0;
    if (vertical > 13) power = 5 * (20 - (20 * (26 - vertical) / vertical));
    else if (vertical === 13) power = 10;
    else if (vertical === 12) power = 9;
    else if (vertical === 11) power = 8;
    else if (vertical === 10) power = 7;
    else if (vertical < 10) power = 5;
    
    const endurance = yirt > 0 ? 5 * (20 - 10 * (55 - yirt) / 32) : 0;
    const agility = shuttle > 0 ? 5 * (20 - 10 * (5.2 * (shuttle - 4.6) / shuttle)) : 0;
    const overall = ((6 * speed) + (3 * power) + (6 * endurance)) / 15;
    
    return {
      speed_score: Math.max(0, Math.min(100, Math.round(speed))),
      power_score: Math.max(0, Math.min(100, Math.round(power))),
      endurance_score: Math.max(0, Math.min(100, Math.round(endurance))),
      agility_score: Math.max(0, Math.min(100, Math.round(agility))),
      overall_score: Math.max(0, Math.min(100, Math.round(overall)))
    };
  };

  const handleImport = async () => {
    let dataText = '';
    
    if (importMethod === 'paste') {
      if (!pastedData.trim()) return;
      dataText = pastedData;
    } else {
      if (!file) return;
      dataText = await file.text();
    }

    setImporting(true);
    setProgress(0);
    setErrors([]);
    setDuplicates([]);
    setUnassignedList([]);
    setMatchedList([]);
    setResults(null);
    setCurrentStatus('Parsing data...');

    try {
      const rows = parseData(dataText);
      
      setCurrentStatus(`Found ${rows.length} records - analyzing...`);
      setProgress(5);
      
      const importErrors = [];
      const toCreate = [];
      const unassigned = [];
      const dups = [];
      const matched = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        setProgress(5 + ((i + 1) / rows.length) * 15);
        
        const playerName = (row.name || '').trim();
        const dateStr = (row.date || '').trim();
        
        let date = '';
        if (dateStr) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            let [month, day, year] = parts;
            if (year.length === 2) year = parseInt(year) >= 50 ? `19${year}` : `20${year}`;
            date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
        }
        
        const sprint = parseFloat(row.sprint || '0');
        const vertical = parseFloat(row.vertical || '0');
        const yirt = parseFloat(row.yirt || '0');
        const shuttle = parseFloat(row.shuttle || '0');

        if (!playerName) {
          importErrors.push({ line: row._lineNumber, error: 'No name', row: '' });
          continue;
        }
        if (!date) {
          importErrors.push({ line: row._lineNumber, error: 'Invalid date', row: playerName });
          continue;
        }
        if (!sprint || !vertical || !yirt) {
          importErrors.push({ line: row._lineNumber, error: 'Missing metrics', row: playerName });
          continue;
        }

        const player = matchPlayer(playerName);
        const scores = calculateScores(sprint, vertical, yirt, shuttle);

        if (!player) {
          unassigned.push({
            player_name: playerName,
            assessment_date: date,
            sprint, vertical, yirt, shuttle,
            ...scores
          });
          continue;
        }

        const dupCheck = toCreate.some(a => a.player_id === player.id && a.assessment_date === date);
        if (dupCheck) {
          dups.push({ line: row._lineNumber, player: player.full_name, date });
          continue;
        }
        
        toCreate.push({
          player_id: player.id,
          player_name: player.full_name,
          team_id: player.team_id || '',
          assessment_date: date,
          sprint, vertical, yirt, shuttle,
          ...scores
        });
        matched.push({ player: player.full_name, date });
      }

      setErrors(importErrors);
      setDuplicates(dups);
      setUnassignedList(unassigned);
      setMatchedList(matched);
      setProgress(20);

      // Use bulk operations to avoid rate limits
      let successCount = 0;
      
      if (toCreate.length > 0) {
        setCurrentStatus(`Bulk creating ${toCreate.length} assessments...`);
        setProgress(25);
        
        try {
          await base44.entities.PhysicalAssessment.bulkCreate(toCreate);
          successCount = toCreate.length;
          setProgress(85);
        } catch (e) {
          console.error('Bulk create error:', e);
          importErrors.push({ 
            line: 'Bulk', 
            error: e.message, 
            row: 'Multiple records' 
          });
        }
      }

      if (unassigned.length > 0) {
        setCurrentStatus(`Saving ${unassigned.length} unassigned records...`);
        setProgress(90);
        try {
          await base44.entities.UnassignedPhysicalAssessment.bulkCreate(unassigned);
        } catch (e) {
          console.error('Unassigned bulk error:', e);
        }
      }

      setCurrentStatus('✓ Import Complete - All records processed');
      setProgress(100);
      setErrors(importErrors);
      setResults({
        total: rows.length,
        success: successCount,
        unassigned: unassigned.length,
        duplicates: dups.length,
        failed: importErrors.length
      });
      
    } catch (error) {
      console.error('Import error:', error);
      setErrors([{ line: 0, error: error.message, row: 'System Error' }]);
      setCurrentStatus('Import Failed');
      setResults({ total: 0, success: 0, unassigned: 0, duplicates: 0, failed: 1 });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {!results ? (
        <Card>
          <CardHeader>
            <CardTitle>Bulk Import Physical Assessments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={importMethod} onValueChange={setImportMethod}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="paste">Paste Spreadsheet</TabsTrigger>
                <TabsTrigger value="file">Upload CSV File</TabsTrigger>
              </TabsList>

              <TabsContent value="paste" className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Copy data from Excel/Google Sheets and paste below. Required columns: Name, Date, Sprint, Vertical, YIRT, Shuttle
                  </AlertDescription>
                </Alert>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Paste Data Here</Label>
                    <Button onClick={copyTemplate} variant="outline" size="sm">
                      <Copy className="w-3 h-3 mr-1" />
                      Copy Template
                    </Button>
                  </div>
                  <Textarea
                    value={pastedData}
                    onChange={(e) => setPastedData(e.target.value)}
                    placeholder="Paste your spreadsheet data here (Ctrl+V)..."
                    className="font-mono text-xs h-64"
                    disabled={importing}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Include header row. Date format: MM/DD/YYYY
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="file" className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Upload a CSV file with columns: Name, Date, Sprint, Vertical, YIRT, Shuttle
                  </AlertDescription>
                </Alert>

                <div>
                  <Label>Select CSV File</Label>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setFile(e.target.files[0])}
                    disabled={importing}
                    className="mt-2"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-lg text-xs font-mono">
                  <div className="font-bold mb-1">Template Format:</div>
                  <div className="whitespace-pre">{template}</div>
                </div>
              </TabsContent>
            </Tabs>

            <Button 
              onClick={handleImport} 
              disabled={importing || (importMethod === 'paste' && !pastedData.trim()) || (importMethod === 'file' && !file)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-base font-semibold"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing {Math.round(progress)}% - DO NOT CLOSE DIALOG
                </>
              ) : (
                `Start Import`
              )}
            </Button>

            {importing && (
              <Card className="border-emerald-200 bg-emerald-50">
                <CardContent className="p-4 space-y-3">
                  <Progress value={progress} className="h-3" />
                  <p className="text-sm text-slate-700 text-center font-semibold">{currentStatus}</p>
                  
                  <div className="grid grid-cols-4 gap-2">
                    <div className="p-3 bg-white rounded-lg text-center shadow">
                      <div className="text-2xl font-bold text-green-600">{matchedList.length}</div>
                      <div className="text-xs text-slate-600">Matched</div>
                    </div>
                    <div className="p-3 bg-white rounded-lg text-center shadow">
                      <div className="text-2xl font-bold text-orange-600">{unassignedList.length}</div>
                      <div className="text-xs text-slate-600">Unassigned</div>
                    </div>
                    <div className="p-3 bg-white rounded-lg text-center shadow">
                      <div className="text-2xl font-bold text-amber-600">{duplicates.length}</div>
                      <div className="text-xs text-slate-600">Duplicates</div>
                    </div>
                    <div className="p-3 bg-white rounded-lg text-center shadow">
                      <div className="text-2xl font-bold text-red-600">{errors.length}</div>
                      <div className="text-xs text-slate-600">Errors</div>
                    </div>
                  </div>
                  
                  <Alert className="bg-red-50 border-red-300">
                    <AlertDescription className="text-xs font-bold text-red-900 text-center">
                      ⚠️ PROCESSING - DO NOT CLOSE THIS DIALOG
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 space-y-4">
            <Alert className={results.success > 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
              <CheckCircle className={`h-4 w-4 ${results.success > 0 ? 'text-green-600' : 'text-red-600'}`} />
              <AlertDescription>
                <div className="font-bold mb-2 text-lg">{results.success > 0 ? '✓ Import Complete' : '✗ Import Failed'}</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-2 bg-white rounded font-semibold text-green-700">✓ {results.success} successfully imported</div>
                  <div className="p-2 bg-white rounded">⊗ {results.duplicates} duplicates skipped</div>
                  <div className="p-2 bg-white rounded text-orange-700">⚠ {results.unassigned} players not matched</div>
                  <div className="p-2 bg-white rounded text-red-700">✗ {results.failed} errors</div>
                </div>
              </AlertDescription>
            </Alert>

            <Tabs defaultValue="matched">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="matched">Matched ({matchedList.length})</TabsTrigger>
                <TabsTrigger value="unassigned">Unassigned ({unassignedList.length})</TabsTrigger>
                <TabsTrigger value="duplicates">Duplicates ({duplicates.length})</TabsTrigger>
                <TabsTrigger value="errors">Errors ({errors.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="matched">
                <ScrollArea className="h-80 border rounded-lg p-3 bg-white">
                  {matchedList.map((item, idx) => (
                    <div key={idx} className="text-xs p-2 bg-green-50 rounded mb-1 flex justify-between">
                      <span className="font-medium">{item.player}</span>
                      <span className="text-slate-500">{item.date}</span>
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="unassigned">
                <ScrollArea className="h-80 border rounded-lg p-3 bg-white">
                  {unassignedList.map((item, idx) => (
                    <div key={idx} className="text-xs p-3 bg-orange-50 rounded mb-1 border border-orange-200">
                      <div className="font-medium text-orange-900">"{item.player_name}"</div>
                      <div className="text-orange-700 text-[10px]">{item.assessment_date} - No player match found</div>
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="duplicates">
                <ScrollArea className="h-80 border rounded-lg p-3 bg-white">
                  {duplicates.map((item, idx) => (
                    <div key={idx} className="text-xs p-2 bg-amber-50 rounded mb-1">
                      Line {item.line}: {item.player} • {item.date}
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="errors">
                <ScrollArea className="h-80 border rounded-lg p-3 bg-white">
                  {errors.map((item, idx) => (
                    <div key={idx} className="text-xs p-3 bg-red-50 rounded mb-1 border border-red-200">
                      <div className="font-medium text-red-900">Line {item.line}</div>
                      <div className="text-red-700 text-[10px]">{item.error}: {item.row}</div>
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>
            </Tabs>

            <div className="flex gap-3 pt-4">
              <Button onClick={() => {
                setPastedData('');
                setFile(null);
                setResults(null);
                setErrors([]);
                setDuplicates([]);
                setUnassignedList([]);
                setMatchedList([]);
                setProgress(0);
              }} variant="outline" className="flex-1">
                Import More Data
              </Button>
              <Button onClick={onClose} className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-12 font-semibold">
                Done - Close Dialog
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}