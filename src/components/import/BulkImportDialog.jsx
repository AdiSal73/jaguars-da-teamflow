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

  // Template data with examples
  const templateData = {
    Player: {
      headers: ['full_name', 'email', 'phone', 'date_of_birth', 'position', 'jersey_number', 'height', 'weight', 'status'],
      example: ['John Doe', 'john@example.com', '+1234567890', '2005-03-15', 'Midfielder', '10', '175', '70', 'Active']
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
      headers: ['player_id', 'evaluator_name', 'evaluation_date', 'technical_skills', 'tactical_awareness', 'physical_attributes', 'mental_attributes', 'teamwork', 'overall_rating', 'strengths', 'areas_for_improvement'],
      example: ['player_id_here', 'Coach Name', '2024-01-15', '8', '7', '9', '8', '7', '8', 'Great ball control', 'Needs to work on positioning']
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
          full_name: { type: 'string', description: 'Full name of the player' },
          email: { type: 'string', description: 'Email address' },
          phone: { type: 'string', description: 'Phone number' },
          date_of_birth: { type: 'string', description: 'Date of birth in YYYY-MM-DD format' },
          position: { type: 'string', description: 'Playing position: Goalkeeper, Defender, Midfielder, or Forward' },
          jersey_number: { type: 'number', description: 'Jersey number' },
          height: { type: 'number', description: 'Height in centimeters' },
          weight: { type: 'number', description: 'Weight in kilograms' },
          status: { type: 'string', description: 'Status: Active, Injured, Suspended, or Inactive' }
        },
        required: ['full_name', 'position']
      },
      Coach: {
        type: 'object',
        properties: {
          full_name: { type: 'string', description: 'Full name of the coach' },
          email: { type: 'string', description: 'Email address' },
          phone: { type: 'string', description: 'Phone number' },
          specialization: { type: 'string', description: 'Specialization area' },
          bio: { type: 'string', description: 'Biography' },
          session_duration: { type: 'number', description: 'Default session duration in minutes' },
          booking_enabled: { type: 'boolean', description: 'Whether booking is enabled' }
        },
        required: ['full_name', 'specialization']
      },
      Team: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Team name' },
          age_group: { type: 'string', description: 'Age group (e.g., U-12, U-15, U-18, Senior)' },
          division: { type: 'string', description: 'Division name' },
          season: { type: 'string', description: 'Season (e.g., 2024/2025)' },
          team_color: { type: 'string', description: 'Team color in hex format (e.g., #22c55e)' }
        },
        required: ['name', 'age_group']
      },
      Evaluation: {
        type: 'object',
        properties: {
          player_id: { type: 'string', description: 'The ID of the player being evaluated' },
          evaluator_name: { type: 'string', description: 'Name of the person doing the evaluation' },
          evaluation_date: { type: 'string', description: 'Date of evaluation in YYYY-MM-DD format' },
          technical_skills: { type: 'number', description: 'Technical skills rating from 1 to 10' },
          tactical_awareness: { type: 'number', description: 'Tactical awareness rating from 1 to 10' },
          physical_attributes: { type: 'number', description: 'Physical attributes rating from 1 to 10' },
          mental_attributes: { type: 'number', description: 'Mental attributes rating from 1 to 10' },
          teamwork: { type: 'number', description: 'Teamwork rating from 1 to 10' },
          overall_rating: { type: 'number', description: 'Overall rating from 1 to 10' },
          strengths: { type: 'string', description: 'Player strengths' },
          areas_for_improvement: { type: 'string', description: 'Areas that need improvement' }
        },
        required: ['player_id', 'evaluation_date']
      },
      PhysicalAssessment: {
        type: 'object',
        properties: {
          player_name: { type: 'string', description: 'Full name of the player from the Name column' },
          team_name: { type: 'string', description: 'Team name from the Team column' },
          assessment_date: { type: 'string', description: 'Date from the Date column in any standard format' },
          position: { type: 'string', description: 'Position from the Position column' },
          age: { type: 'number', description: 'Age from the Age column' },
          sprint_time: { type: 'number', description: '20m sprint time from the "20 m linear" column' },
          speed: { type: 'number', description: 'Speed score from the "Speed Score" column (0-100)' },
          vertical_jump: { type: 'number', description: 'Vertical jump from the "vertical" column in cm' },
          power: { type: 'number', description: 'Power score from the "Vertical Score" column (0-100)' },
          cooper_test: { type: 'number', description: 'YIRT distance from the "YIRT" column in meters' },
          endurance: { type: 'number', description: 'Endurance score from the "YIRT Score" column (0-100)' },
          agility_time: { type: 'number', description: '5-10-5 time from the "5-10-2005" column' },
          agility: { type: 'number', description: 'Agility score from the "5-10-5 Score" column (0-100)' }
        },
        required: ['player_name', 'assessment_date']
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
              items: schema,
              description: `Array of ${entityType} records extracted from the CSV. Map the CSV columns to the properties as described in the schema.`
            }
          },
          required: ['records']
        }
      });

      if (extractResult.status === 'success' && extractResult.output?.records) {
        let records = extractResult.output.records;
        
        if (records.length === 0) {
          throw new Error('No valid records found in the CSV file.');
        }

        // Special handling for PhysicalAssessment - need to lookup player IDs
        if (entityType === 'PhysicalAssessment') {
          const players = await base44.entities.Player.list();
          
          records = records.map(record => {
            const player = players.find(p => 
              p.full_name?.toLowerCase() === record.player_name?.toLowerCase()
            );
            
            if (!player) {
              throw new Error(`Player not found: ${record.player_name}. Please import players first.`);
            }

            return {
              player_id: player.id,
              assessment_date: record.assessment_date,
              speed: record.speed || 0,
              agility: record.agility || 0,
              power: record.power || 0,
              endurance: record.endurance || 0,
              sprint_time: record.sprint_time || null,
              vertical_jump: record.vertical_jump || null,
              cooper_test: record.cooper_test || null,
              assessor: record.team_name || null,
              notes: record.position ? `Position: ${record.position}, Age: ${record.age || 'N/A'}` : null
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
        throw new Error(extractResult.details || 'Failed to extract data from file. Please check your CSV format.');
      }
    } catch (error) {
      setResult({
        success: false,
        message: error.message || 'Import failed. Please check your CSV format and try again.'
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
              {entityType === 'PhysicalAssessment' ? (
                <div>
                  <strong>Physical Assessment Import:</strong> Upload your CSV with the exact columns shown below. Player names will be matched automatically.
                  <br /><strong>Note:</strong> Make sure to import Players first before importing assessments.
                </div>
              ) : (
                <div>
                  <strong>Important:</strong> Your CSV must use the exact column names from the template. Download the template to see the required format.
                </div>
              )}
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

          <div>
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Download CSV Template with Example
            </Button>
          </div>

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
                    <div>
                      <p className="text-sm text-slate-600">Click to upload CSV file</p>
                      <p className="text-xs text-slate-400 mt-1">Make sure to use the template format</p>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {result && (
            <Alert variant={result.success ? 'default' : 'destructive'}>
              {result.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {result.message}
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-2 text-xs max-h-32 overflow-y-auto">
                    <p className="font-semibold">Errors:</p>
                    {result.errors.slice(0, 5).map((err, idx) => (
                      <p key={idx} className="mt-1">• {err}</p>
                    ))}
                    {result.errors.length > 5 && (
                      <p className="mt-1 text-slate-500">... and {result.errors.length - 5} more errors</p>
                    )}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
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