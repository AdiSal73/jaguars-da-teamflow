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
import { Upload, Download, CheckCircle, AlertCircle, Loader2, Info } from 'lucide-react';
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

  const templateData = {
    Player: {
      headers: ['Team Name', 'Parent Name', 'Email', 'Phone Number', 'Player Last Name', 'Player First Name', 'Primary Position', 'Secondary Position', 'Date of Birth', 'Gender', 'Grade'],
      example: ['Elite Squad', 'John Doe Sr', 'parent@email.com', '+1234567890', 'Doe', 'John', 'Midfielder', 'Forward', '2005-03-15', 'Male', '10']
    },
    Coach: {
      headers: ['full_name', 'email', 'phone', 'specialization', 'bio', 'session_duration', 'booking_enabled'],
      example: ['Mike Smith', 'mike@example.com', '+1234567890', 'Technical Training', 'Experienced coach', '60', 'true']
    },
    Team: {
      headers: ['name', 'age_group', 'division', 'season', 'team_color'],
      example: ['Elite Squad', 'U-18', 'Premier League', '2024/2025', '#22c55e']
    },
    Evaluation: {
      headers: ['Date', 'Player Name', 'Birth Year', 'Team Name', 'My Goals', 'Evaluator', 'Current Team Status', 'Growth Mindset', 'Resilience', 'Efficiency in execution', 'Adept Mover', 'Team Focus', 'Primary Position', 'Preferred Foot', 'Defending Organized:', 'Defending the final third', 'DEFENDING TRANSITION', 'Attacking Organized', 'Attacking The Final Third', 'Attacking in Transition', "Player's Strengths", 'Areas of Growth', 'Training Focus'],
      example: ['2024-01-15', 'John Doe', '2005', 'Elite Squad', 'Improve passing', 'Coach Smith', 'Active', '8', '7', '8', '9', '8', 'Midfielder', 'Right', '7', '8', '8', '9', '8', '9', 'Great vision', 'Work on defense', 'Tactical drills']
    },
    PhysicalAssessment: {
      headers: ['Name', 'Team', 'Date', 'Position', 'Age', '20 m linear', 'Speed Score', '20 m All Time Rank', 'vertical', 'Vertical Score', 'Vertical Rank', 'YIRT', 'YIRT Score', 'YIRT All Time Rank', '5-10-2005', '5-10-5 Score', '5-10-5 all time rank', 'Energy Score', 'All Time Rank', 'Jags Rank'],
      example: ['John Doe', 'Elite Squad', '2024-01-15', 'Midfielder', '18', '3.2', '85', '5', '65', '82', '3', '2800', '90', '2', '4.5', '78', '4', '85', '3', '1']
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const downloadTemplate = () => {
    const { headers, example } = templateData[entityType];
    const csvContent = headers.join(',') + '\n' + example.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${entityType}_template.csv`;
    link.click();
  };

  const getEntitySchema = (type) => {
    const schemas = {
      Player: {
        type: 'object',
        properties: {
          team_name: { type: 'string' },
          parent_name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          last_name: { type: 'string' },
          first_name: { type: 'string' },
          primary_position: { type: 'string' },
          secondary_position: { type: 'string' },
          date_of_birth: { type: 'string' },
          gender: { type: 'string' },
          grade: { type: 'string' }
        }
      },
      Coach: {
        type: 'object',
        properties: {
          full_name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          specialization: { type: 'string' },
          bio: { type: 'string' },
          session_duration: { type: 'number' },
          booking_enabled: { type: 'boolean' }
        }
      },
      Team: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age_group: { type: 'string' },
          division: { type: 'string' },
          season: { type: 'string' },
          team_color: { type: 'string' }
        }
      },
      Evaluation: {
        type: 'object',
        properties: {
          date: { type: 'string' },
          player_name: { type: 'string' },
          birth_year: { type: 'string' },
          team_name: { type: 'string' },
          goals: { type: 'string' },
          evaluator: { type: 'string' },
          team_status: { type: 'string' },
          growth_mindset: { type: 'number' },
          resilience: { type: 'number' },
          efficiency: { type: 'number' },
          adept_mover: { type: 'number' },
          team_focus: { type: 'number' },
          primary_position: { type: 'string' },
          preferred_foot: { type: 'string' },
          defending_organized: { type: 'number' },
          defending_final_third: { type: 'number' },
          defending_transition: { type: 'number' },
          attacking_organized: { type: 'number' },
          attacking_final_third: { type: 'number' },
          attacking_transition: { type: 'number' },
          strengths: { type: 'string' },
          areas_of_growth: { type: 'string' },
          training_focus: { type: 'string' }
        }
      },
      PhysicalAssessment: {
        type: 'object',
        properties: {
          player_name: { type: 'string' },
          team_name: { type: 'string' },
          assessment_date: { type: 'string' },
          position: { type: 'string' },
          age: { type: 'number' },
          sprint_time: { type: 'number' },
          speed: { type: 'number' },
          vertical_jump: { type: 'number' },
          power: { type: 'number' },
          cooper_test: { type: 'number' },
          endurance: { type: 'number' },
          agility_time: { type: 'number' },
          agility: { type: 'number' }
        }
      }
    };
    return schemas[type];
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const schema = getEntitySchema(entityType);
      
      const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: 'object',
          properties: {
            records: {
              type: 'array',
              items: schema
            }
          }
        }
      });

      if (extractResult.status === 'success' && extractResult.output?.records) {
        let records = extractResult.output.records;
        
        if (records.length === 0) {
          throw new Error('No valid records found in the CSV file.');
        }

        if (entityType === 'Player') {
          const teams = await base44.entities.Team.list();
          
          records = records.map(record => {
            const team = teams.find(t => t.name?.toLowerCase() === record.team_name?.toLowerCase());
            
            return {
              full_name: `${record.first_name || ''} ${record.last_name || ''}`.trim(),
              email: record.email,
              phone: record.phone,
              date_of_birth: record.date_of_birth,
              position: record.primary_position,
              team_id: team?.id,
              status: 'Active'
            };
          });
        }

        if (entityType === 'Evaluation') {
          const players = await base44.entities.Player.list();
          
          records = records.map(record => {
            const player = players.find(p => p.full_name?.toLowerCase() === record.player_name?.toLowerCase());
            
            if (!player) {
              throw new Error(`Player not found: ${record.player_name}`);
            }

            const avgRating = Math.round((
              (record.growth_mindset || 0) + (record.resilience || 0) + 
              (record.efficiency || 0) + (record.adept_mover || 0) + (record.team_focus || 0)
            ) / 5);

            return {
              player_id: player.id,
              evaluator_name: record.evaluator,
              evaluation_date: record.date,
              technical_skills: Math.round(((record.attacking_organized || 0) + (record.attacking_final_third || 0)) / 2),
              tactical_awareness: Math.round(((record.defending_organized || 0) + (record.attacking_organized || 0)) / 2),
              physical_attributes: record.adept_mover || 5,
              mental_attributes: Math.round(((record.growth_mindset || 0) + (record.resilience || 0)) / 2),
              teamwork: record.team_focus || 5,
              overall_rating: avgRating,
              strengths: record.strengths,
              areas_for_improvement: record.areas_of_growth,
              notes: `Goals: ${record.goals || 'N/A'}. Training Focus: ${record.training_focus || 'N/A'}`
            };
          });
        }

        if (entityType === 'PhysicalAssessment') {
          const players = await base44.entities.Player.list();
          
          records = records.map(record => {
            const player = players.find(p => p.full_name?.toLowerCase() === record.player_name?.toLowerCase());
            
            if (!player) {
              throw new Error(`Player not found: ${record.player_name}`);
            }

            return {
              player_id: player.id,
              assessment_date: record.assessment_date,
              speed: record.speed || 0,
              agility: record.agility || 0,
              power: record.power || 0,
              endurance: record.endurance || 0,
              sprint_time: record.sprint_time,
              vertical_jump: record.vertical_jump,
              cooper_test: record.cooper_test,
              assessor: record.team_name,
              notes: `Position: ${record.position || 'N/A'}, Age: ${record.age || 'N/A'}`
            };
          });
        }
        
        let successCount = 0;
        const errors = [];
        
        for (let i = 0; i < records.length; i++) {
          try {
            const record = records[i];
            const cleanRecord = Object.fromEntries(
              Object.entries(record).filter(([_, v]) => v !== undefined && v !== null && v !== '')
            );
            
            await base44.entities[entityType].create(cleanRecord);
            successCount++;
          } catch (err) {
            errors.push(`Row ${i + 2}: ${err.message}`);
          }
        }
        
        setResult({
          success: successCount > 0,
          message: `Successfully imported ${successCount} out of ${records.length} ${entityType.toLowerCase()}(s)`,
          count: successCount,
          errors: errors.length > 0 ? errors : null
        });
        
        if (successCount > 0 && onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(extractResult.details || 'Failed to extract data from file.');
      }
    } catch (error) {
      setResult({
        success: false,
        message: error.message || 'Import failed.'
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
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Upload your CSV with the exact columns shown below. The system will automatically match and import your data.
            </AlertDescription>
          </Alert>

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

          <div className="bg-slate-50 p-4 rounded-lg max-h-32 overflow-y-auto">
            <div className="text-sm font-medium text-slate-700 mb-2">Required Columns:</div>
            <div className="text-xs text-slate-600 font-mono bg-white p-2 rounded whitespace-pre-wrap">
              {templateData[entityType].headers.join(', ')}
            </div>
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
                onChange={handleFileChange}
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
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-2 text-xs max-h-32 overflow-y-auto">
                    <p className="font-semibold">Errors:</p>
                    {result.errors.slice(0, 5).map((err, idx) => (
                      <p key={idx} className="mt-1">• {err}</p>
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