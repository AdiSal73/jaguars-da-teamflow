import React, { useState } from 'react';
import { Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

export default function BulkImportTeams({ onImportComplete }) {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState([]);

  const downloadTemplate = () => {
    const csv = 'name,age_group,League,season\nU-15 Elite,U-15,Girls Academy,2024/2025\nU-17 Aspire,U-17,Aspire,2024/2025';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'team_template.csv';
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

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setProgress(0);
    setErrors([]);

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      const importErrors = [];
      const teamsToCreate = [];

      rows.forEach(row => {
        const name = row.name;
        const ageGroup = row.age_group;
        const league = row.League;
        const season = row.season;

        if (!name) {
          importErrors.push(`Line ${row._lineNumber}: Missing team name`);
          return;
        }

        if (!ageGroup) {
          importErrors.push(`Line ${row._lineNumber}: Missing age group`);
          return;
        }

        teamsToCreate.push({
          name,
          age_group: ageGroup,
          league: league || '',
          season: season || '',
          team_color: '#22c55e',
          coach_ids: []
        });
      });

      setErrors(importErrors);
      setProgress(50);

      await onImportComplete(teamsToCreate);

      setResults({
        total: rows.length,
        teams: teamsToCreate.length,
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
      <Card className="border-none shadow-xl">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-600" />
            Bulk Import Teams
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              Upload a CSV file with columns: <strong>name, age_group, League, season</strong>
            </AlertDescription>
          </Alert>

          <Button onClick={downloadTemplate} variant="outline" className="w-full border-2 hover:bg-slate-50">
            <Download className="w-4 h-4 mr-2" />
            Download CSV Template
          </Button>

          <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center hover:border-emerald-400 transition-colors bg-gradient-to-br from-slate-50 to-white">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files[0])}
              className="hidden"
              id="csv-upload-teams"
            />
            <label htmlFor="csv-upload-teams" className="cursor-pointer">
              <Upload className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-sm text-slate-600 font-medium">
                {file ? file.name : 'Click to upload CSV file'}
              </p>
            </label>
          </div>

          {file && (
            <Button 
              onClick={handleImport} 
              disabled={importing}
              className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-base font-semibold"
            >
              {importing ? 'Importing...' : 'Start Import'}
            </Button>
          )}

          {importing && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-slate-600 text-center">Importing teams...</p>
            </div>
          )}

          {results && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                <strong>Import complete!</strong> {results.teams} teams imported, {results.failed} failed out of {results.total} total
              </AlertDescription>
            </Alert>
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