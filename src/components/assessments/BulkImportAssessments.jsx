import React, { useState } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

export default function BulkImportAssessments({ players, teams, onImportComplete }) {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [importDetails, setImportDetails] = useState({ processed: 0, total: 0 });

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
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map((line, idx) => {
      const values = line.split(',').map(v => v.trim());
      const row = {};
      headers.forEach((header, i) => {
        row[header] = values[i];
      });
      row._lineNumber = idx + 2;
      return row;
    });
  };

  const calculateScores = (sprint, vertical, yirt, shuttle = null) => {
    const speed = sprint > 0 ? 5 * (20 - 10 * (3.5 * (sprint - 2.8) / sprint)) : 0;
    
    let power = 0;
    if (vertical > 13) {
      power = 5 * (20 - (20 * (26 - vertical) / vertical));
    } else if (vertical === 13) {
      power = 10;
    } else if (vertical === 12) {
      power = 9;
    } else if (vertical === 11) {
      power = 8;
    } else if (vertical === 10) {
      power = 7;
    } else if (vertical < 10) {
      power = 5;
    }
    
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

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      const importErrors = [];
      const assessmentsToCreate = [];
      const unassignedToCreate = [];
      const foundDuplicates = [];

      setImportDetails({ processed: 0, total: rows.length });

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const playerName = row.Name || row.name;
        const teamName = row.Team || row.team;
        const date = row.Date || row.date;
        const sprint = parseFloat(row.Sprint || row.sprint);
        const vertical = parseFloat(row.Vertical || row.vertical);
        const yirt = parseFloat(row.YIRT || row.yirt);
        const shuttle = parseFloat(row.Shuttle || row.shuttle);

        setProgress(((i + 1) / rows.length) * 100);
        setImportDetails({ processed: i + 1, total: rows.length });

        if (!playerName) {
          importErrors.push(`Line ${row._lineNumber}: Missing player name`);
          continue;
        }
        if (!date) {
          importErrors.push(`Line ${row._lineNumber}: Missing date`);
          continue;
        }
        if (isNaN(sprint) || isNaN(vertical) || isNaN(yirt)) {
          importErrors.push(`Line ${row._lineNumber}: Invalid numeric values for required fields (Sprint, Vertical, YIRT)`);
          continue;
        }

        // Try to match player by name (flexible matching)
        const player = players.find(p => {
          const pName = p.full_name.toLowerCase().trim();
          const rName = playerName.toLowerCase().trim();
          return pName === rName || 
                 pName.includes(rName) || 
                 rName.includes(pName);
        });

        const team = teams.find(t => {
          if (!teamName) return null;
          const tName = t.name.toLowerCase().trim();
          const rTeam = teamName.toLowerCase().trim();
          return tName === rTeam || 
                 tName.includes(rTeam) || 
                 rTeam.includes(tName);
        });

        if (!player) {
          // Still create unassigned record with all available data
          const scores = calculateScores(sprint, vertical, yirt, !isNaN(shuttle) ? shuttle : null);
          unassignedToCreate.push({
            player_name: playerName,
            team_name: teamName || '',
            assessment_date: date,
            sprint,
            vertical,
            yirt,
            shuttle: !isNaN(shuttle) ? shuttle : null,
            ...scores,
            assigned: false
          });
          continue;
        }

        // Check for duplicates in import batch
        const isDuplicate = assessmentsToCreate.some(a => 
          a.player_id === player.id && a.assessment_date === date
        );
        if (isDuplicate) {
          foundDuplicates.push({ player: player.full_name, date, line: row._lineNumber });
          continue;
        }

        const scores = calculateScores(sprint, vertical, yirt, !isNaN(shuttle) ? shuttle : null);
        
        const assessmentData = {
          player_id: player.id,
          player_name: player.full_name,
          team_id: team?.id || '',
          assessment_date: date,
          sprint,
          vertical,
          yirt,
          ...scores
        };
        
        if (!isNaN(shuttle)) {
          assessmentData.shuttle = shuttle;
        }
        
        assessmentsToCreate.push(assessmentData);
      }

      setErrors(importErrors);
      setDuplicates(foundDuplicates);

      // Import in batches to avoid rate limits
      const BATCH_SIZE = 10;
      for (let i = 0; i < assessmentsToCreate.length; i += BATCH_SIZE) {
        const batch = assessmentsToCreate.slice(i, i + BATCH_SIZE);
        await onImportComplete(batch, i === 0 ? unassignedToCreate : []);
        await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit delay
      }

      setResults({
        total: rows.length,
        success: assessmentsToCreate.length,
        unassigned: unassignedToCreate.length,
        duplicates: foundDuplicates.length,
        failed: importErrors.length
      });
      setProgress(100);
    } catch (error) {
      setErrors([`Import failed: ${error.message}`]);
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
              Upload a CSV file with columns: Name, Team, Date, Sprint, Vertical, YIRT, Shuttle (Shuttle is optional)
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

          {file && (
            <Button 
              onClick={handleImport} 
              disabled={importing}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {importing ? 'Importing...' : 'Start Import'}
            </Button>
          )}

          {importing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-slate-600 text-center">
                Processing {importDetails.processed} of {importDetails.total} records...
              </p>
            </div>
          )}

          {results && (
            <div className="space-y-3">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <div className="font-semibold mb-2">Import Complete!</div>
                  <div className="text-sm space-y-1">
                    <div>✓ {results.success} assessments imported</div>
                    {results.unassigned > 0 && <div>⚠️ {results.unassigned} unassigned (no matching player)</div>}
                    {results.duplicates > 0 && <div>⊗ {results.duplicates} duplicates skipped</div>}
                    {results.failed > 0 && <div className="text-red-600">✗ {results.failed} errors</div>}
                  </div>
                </AlertDescription>
              </Alert>
              {duplicates.length > 0 && (
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription>
                    <div className="font-semibold mb-2">Duplicates Found:</div>
                    <ul className="text-xs space-y-1">
                      {duplicates.slice(0, 5).map((dup, idx) => (
                        <li key={idx}>Line {dup.line}: {dup.player} on {dup.date}</li>
                      ))}
                      {duplicates.length > 5 && <li>... and {duplicates.length - 5} more</li>}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">Errors found:</div>
                <ul className="text-sm space-y-1">
                  {errors.slice(0, 10).map((error, idx) => (
                    <li key={idx}>• {error}</li>
                  ))}
                  {errors.length > 10 && (
                    <li>... and {errors.length - 10} more errors</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}