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

  // Template headers for each entity type
  const templateHeaders = {
    Player: 'full_name,email,phone,date_of_birth,position,team_id,jersey_number,height,weight,status',
    Coach: 'full_name,email,phone,specialization,bio,session_duration,booking_enabled',
    Team: 'name,age_group,division,head_coach_id,season,team_color',
    Evaluation: 'player_id,evaluator_name,evaluation_date,technical_skills,tactical_awareness,physical_attributes,mental_attributes,teamwork,overall_rating,strengths,areas_for_improvement,notes',
    PhysicalAssessment: 'player_id,assessment_date,speed,agility,power,endurance,sprint_time,vertical_jump,cooper_test,assessor,notes'
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const downloadTemplate = () => {
    const headers = templateHeaders[entityType];
    const csvContent = headers + '\n';
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
          full_name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          date_of_birth: { type: 'string' },
          position: { type: 'string' },
          team_id: { type: 'string' },
          jersey_number: { type: 'number' },
          height: { type: 'number' },
          weight: { type: 'number' },
          status: { type: 'string' }
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
          head_coach_id: { type: 'string' },
          season: { type: 'string' },
          team_color: { type: 'string' }
        }
      },
      Evaluation: {
        type: 'object',
        properties: {
          player_id: { type: 'string' },
          evaluator_name: { type: 'string' },
          evaluation_date: { type: 'string' },
          technical_skills: { type: 'number' },
          tactical_awareness: { type: 'number' },
          physical_attributes: { type: 'number' },
          mental_attributes: { type: 'number' },
          teamwork: { type: 'number' },
          overall_rating: { type: 'number' },
          strengths: { type: 'string' },
          areas_for_improvement: { type: 'string' },
          notes: { type: 'string' }
        }
      },
      PhysicalAssessment: {
        type: 'object',
        properties: {
          player_id: { type: 'string' },
          assessment_date: { type: 'string' },
          speed: { type: 'number' },
          agility: { type: 'number' },
          power: { type: 'number' },
          endurance: { type: 'number' },
          sprint_time: { type: 'number' },
          vertical_jump: { type: 'number' },
          cooper_test: { type: 'number' },
          assessor: { type: 'string' },
          notes: { type: 'string' }
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
        const records = extractResult.output.records;
        
        // Create records one by one to handle any issues
        let successCount = 0;
        const errors = [];
        
        for (const record of records) {
          try {
            await base44.entities[entityType].create(record);
            successCount++;
          } catch (err) {
            errors.push(err.message);
          }
        }
        
        setResult({
          success: true,
          message: `Successfully imported ${successCount} out of ${records.length} ${entityType.toLowerCase()}(s)`,
          count: successCount,
          errors: errors.length > 0 ? errors : null
        });
        
        if (onSuccess) onSuccess();
      } else {
        throw new Error(extractResult.details || 'Failed to extract data from file');
      }
    } catch (error) {
      setResult({
        success: false,
        message: error.message || 'Import failed. Please check your CSV format.'
      });
    }

    setImporting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Import Data</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div>
            <Label>Entity Type</Label>
            <Select value={entityType} onValueChange={setEntityType}>
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

          <div>
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Download CSV Template
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
                    <p className="text-sm text-slate-600">Click to upload CSV file</p>
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
                {result.errors && (
                  <div className="mt-2 text-xs">
                    <p className="font-semibold">Some records failed:</p>
                    {result.errors.slice(0, 3).map((err, idx) => (
                      <p key={idx}>• {err}</p>
                    ))}
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