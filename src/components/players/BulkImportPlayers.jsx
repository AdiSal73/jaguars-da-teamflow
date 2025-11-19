import React, { useState } from 'react';
import { Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

export default function BulkImportPlayers({ teams, onImportComplete }) {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState([]);

  const downloadTemplate = () => {
    const csv = 'Name,Parent Name,Email,Phone,Date of Birth,Grade,Position,Team,Jersey Number,League\nJane Smith,Parent Smith,jane@email.com,555-0001,2010-05-15,10th,Forward,U-15 Elite,10,Girls Academy';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'player_template.csv';
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
      const playersToCreate = [];
      const teamsToCreate = new Map();

      rows.forEach(row => {
        const name = row.Name || row.name;
        const parentName = row['Parent Name'] || row['parent name'] || row.parent_name;
        const email = row.Email || row.email;
        const phone = row.Phone || row.phone;
        const dob = row['Date of Birth'] || row['date of birth'] || row.date_of_birth;
        const grade = row.Grade || row.grade;
        const position = row.Position || row.position;
        const teamName = row.Team || row.team;
        const jerseyNumber = row['Jersey Number'] || row['jersey number'] || row.jersey_number;
        const league = row.League || row.league;

        if (!name) {
          importErrors.push(`Line ${row._lineNumber}: Missing player name`);
          return;
        }

        if (!position) {
          importErrors.push(`Line ${row._lineNumber}: Missing position`);
          return;
        }

        let teamId = null;
        if (teamName) {
          let team = teams.find(t => t.name.toLowerCase().trim() === teamName.toLowerCase().trim());
          
          if (!team) {
            if (!teamsToCreate.has(teamName)) {
              const ageMatch = teamName.match(/U-?(\d+)/i);
              const ageGroup = ageMatch ? `U-${ageMatch[1]}` : 'Senior';
              
              teamsToCreate.set(teamName, {
                name: teamName,
                age_group: ageGroup,
                league: league || ''
              });
            }
            teamId = `pending_${teamName}`;
          } else {
            teamId = team.id;
          }
        }

        playersToCreate.push({
          full_name: name,
          parent_name: parentName || '',
          email: email || '',
          phone: phone || '',
          date_of_birth: dob || '',
          grade: grade || '',
          position: position,
          team_id: teamId,
          jersey_number: jerseyNumber ? parseInt(jerseyNumber) : null,
          status: 'Active',
          _teamName: teamName
        });
      });

      setErrors(importErrors);
      setProgress(50);

      const createdTeams = new Map();
      for (const [teamName, teamData] of teamsToCreate.entries()) {
        try {
          const team = await onImportComplete.createTeam(teamData);
          createdTeams.set(teamName, team.id);
        } catch (error) {
          importErrors.push(`Failed to create team: ${teamName}`);
        }
      }

      const finalPlayersToCreate = playersToCreate.map(player => ({
        ...player,
        team_id: player.team_id?.startsWith('pending_') 
          ? createdTeams.get(player._teamName) || '' 
          : player.team_id
      }));

      await onImportComplete.createPlayers(finalPlayersToCreate);

      setResults({
        total: rows.length,
        players: finalPlayersToCreate.length,
        teams: createdTeams.size,
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
          <CardTitle>Bulk Import Players</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Upload a CSV file with columns: Name, Parent Name, Email, Phone, Date of Birth, Grade, Position, Team, Jersey Number, League
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
              <p className="text-sm text-slate-600 text-center">Importing players and creating teams...</p>
            </div>
          )}

          {results && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Import complete: {results.players} players imported, {results.teams} teams created, {results.failed} failed out of {results.total} total
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