import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function BulkImportDialog({ open, onOpenChange, onSuccess }) {
  const [entityType, setEntityType] = useState('Player');
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const entityTypes = [
    { value: 'Player', label: 'Players' },
    { value: 'Coach', label: 'Coaches' },
    { value: 'Team', label: 'Teams' },
    { value: 'Evaluation', label: 'Player Evaluations' },
    { value: 'PhysicalAssessment', label: 'Physical Assessments' }
  ];

  const downloadTemplate = () => {
    let csvContent = '';
    
    if (entityType === 'Player') {
      csvContent = 'Team Name,Parent Name,Email,Phone Number,Player Last Name,Player First Name,Primary Position,Secondary Position,Date of Birth,Gender,Grade\n';
      csvContent += 'Elite Squad,John Doe Sr,parent@email.com,+1234567890,Doe,John,Midfielder,Forward,2005-03-15,Male,10\n';
    } else if (entityType === 'Evaluation') {
      csvContent = 'Date,Player Name,Birth Year,Team Name,My Goals,Evaluator,Current Team Status,Growth Mindset,Resilience,Efficiency in execution,Adept Mover,Team Focus,Primary Position,Preferred Foot,Defending Organized:,Defending the final third,DEFENDING TRANSITION,Attacking Organized,Attacking The Final Third,Attacking in Transition,Player\'s Strengths,Areas of Growth,Training Focus\n';
      csvContent += '2024-01-15,John Doe,2005,Elite Squad,Improve passing,Coach Smith,Active,8,7,8,9,8,Midfielder,Right,7,8,8,9,8,9,Great vision,Work on defense,Tactical drills\n';
    } else if (entityType === 'PhysicalAssessment') {
      csvContent = 'Name,Team,Date,Position,Age,20 m linear,Speed Score,20 m All Time Rank,vertical,Vertical Score,Vertical Rank,YIRT,YIRT Score,YIRT All Time Rank,5-10-2005,5-10-5 Score,5-10-5 all time rank,Energy Score,All Time Rank,Jags Rank\n';
      csvContent += 'John Doe,Elite Squad,2024-01-15,Midfielder,18,3.2,85,5,65,82,3,2800,90,2,4.5,78,4,85,3,1\n';
    } else if (entityType === 'Coach') {
      csvContent = 'full_name,email,phone,specialization,bio\n';
      csvContent += 'Mike Smith,coach@email.com,+1234567890,Technical Training,Experienced coach\n';
    } else if (entityType === 'Team') {
      csvContent = 'name,age_group,division,season\n';
      csvContent += 'Elite Squad,U-18,Premier League,2024/2025\n';
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${entityType}_template.csv`;
    link.click();
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return { headers: [], rows: [] };
    
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });
    
    return { headers, rows };
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      const text = await file.text();
      const { rows } = parseCSV(text);
      
      if (rows.length === 0) {
        throw new Error('No data found in CSV file');
      }

      let records = [];

      if (entityType === 'Player') {
        const teams = await base44.entities.Team.list();
        
        records = rows.map(row => {
          const team = teams.find(t => t.name?.toLowerCase() === row['Team Name']?.toLowerCase());
          return {
            full_name: `${row['Player First Name'] || ''} ${row['Player Last Name'] || ''}`.trim(),
            email: row['Email'],
            phone: row['Phone Number'],
            date_of_birth: row['Date of Birth'],
            position: row['Primary Position'],
            team_id: team?.id,
            status: 'Active'
          };
        });
      } else if (entityType === 'Evaluation') {
        const players = await base44.entities.Player.list();
        
        records = rows.map(row => {
          const player = players.find(p => p.full_name?.toLowerCase() === row['Player Name']?.toLowerCase());
          if (!player) throw new Error(`Player not found: ${row['Player Name']}`);

          const growthMindset = parseInt(row['Growth Mindset']) || 0;
          const resilience = parseInt(row['Resilience']) || 0;
          const efficiency = parseInt(row['Efficiency in execution']) || 0;
          const adeptMover = parseInt(row['Adept Mover']) || 0;
          const teamFocus = parseInt(row['Team Focus']) || 0;
          const defendingOrg = parseInt(row['Defending Organized:']) || 0;
          const defendingFinal = parseInt(row['Defending the final third']) || 0;
          const defendingTrans = parseInt(row['DEFENDING TRANSITION']) || 0;
          const attackingOrg = parseInt(row['Attacking Organized']) || 0;
          const attackingFinal = parseInt(row['Attacking The Final Third']) || 0;
          const attackingTrans = parseInt(row['Attacking in Transition']) || 0;

          return {
            player_id: player.id,
            evaluator_name: row['Evaluator'],
            evaluation_date: row['Date'],
            technical_skills: Math.round((attackingOrg + attackingFinal) / 2),
            tactical_awareness: Math.round((defendingOrg + attackingOrg) / 2),
            physical_attributes: adeptMover,
            mental_attributes: Math.round((growthMindset + resilience) / 2),
            teamwork: teamFocus,
            overall_rating: Math.round((growthMindset + resilience + efficiency + adeptMover + teamFocus) / 5),
            strengths: row["Player's Strengths"],
            areas_for_improvement: row['Areas of Growth'],
            notes: `Goals: ${row['My Goals'] || 'N/A'}. Training Focus: ${row['Training Focus'] || 'N/A'}`
          };
        });
      } else if (entityType === 'PhysicalAssessment') {
        const players = await base44.entities.Player.list();
        
        records = rows.map(row => {
          const player = players.find(p => p.full_name?.toLowerCase() === row['Name']?.toLowerCase());
          if (!player) throw new Error(`Player not found: ${row['Name']}`);

          return {
            player_id: player.id,
            assessment_date: row['Date'],
            speed: parseInt(row['Speed Score']) || 0,
            agility: parseInt(row['5-10-5 Score']) || 0,
            power: parseInt(row['Vertical Score']) || 0,
            endurance: parseInt(row['YIRT Score']) || 0,
            sprint_time: parseFloat(row['20 m linear']) || null,
            vertical_jump: parseFloat(row['vertical']) || null,
            cooper_test: parseFloat(row['YIRT']) || null,
            assessor: row['Team'],
            notes: `Position: ${row['Position'] || 'N/A'}, Age: ${row['Age'] || 'N/A'}`
          };
        });
      } else if (entityType === 'Coach') {
        records = rows.map(row => ({
          full_name: row['full_name'],
          email: row['email'],
          phone: row['phone'],
          specialization: row['specialization'] || 'General Coaching',
          bio: row['bio']
        }));
      } else if (entityType === 'Team') {
        records = rows.map(row => ({
          name: row['name'],
          age_group: row['age_group'],
          division: row['division'],
          season: row['season'],
          team_color: '#22c55e'
        }));
      }

      let successCount = 0;
      const errors = [];
      
      for (let i = 0; i < records.length; i++) {
        try {
          const cleanRecord = Object.fromEntries(
            Object.entries(records[i]).filter(([_, v]) => v !== undefined && v !== null && v !== '')
          );
          await base44.entities[entityType].create(cleanRecord);
          successCount++;
        } catch (err) {
          errors.push(`Row ${i + 2}: ${err.message}`);
        }
      }
      
      setResult({
        success: successCount > 0,
        message: `Successfully imported ${successCount} out of ${records.length} records`,
        errors: errors.length > 0 ? errors.slice(0, 5) : null
      });
      
      if (successCount > 0 && onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setResult({
        success: false,
        message: error.message
      });
    }

    setImporting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Data</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div>
            <Label>Entity Type</Label>
            <Select value={entityType} onValueChange={(value) => {
              setEntityType(value);
              setFile(null);
              setResult(null);
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {entityTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" onClick={downloadTemplate} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Download CSV Template
          </Button>

          <div>
            <Label>Upload CSV File</Label>
            <div className="mt-2">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files[0])}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="flex items-center justify-center w-full p-6 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-emerald-500 transition-colors"
              >
                <div className="text-center">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  {file ? (
                    <p className="text-sm font-medium text-slate-900">{file.name}</p>
                  ) : (
                    <p className="text-sm text-slate-600">Click to upload CSV file</p>
                  )}
                </div>
              </label>
            </div>
          </div>

          {result && (
            <Alert variant={result.success ? 'default' : 'destructive'}>
              {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertDescription>
                {result.message}
                {result.errors && (
                  <div className="mt-2 text-xs">
                    <p className="font-semibold">Errors:</p>
                    {result.errors.map((err, idx) => (
                      <p key={idx}>• {err}</p>
                    ))}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || importing}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Data
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}