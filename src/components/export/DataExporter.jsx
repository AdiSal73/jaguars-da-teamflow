import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Download, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function DataExporter({ players = [], teams = [], tryouts = [], assessments = [], evaluations = [] }) {
  const [selectedData, setSelectedData] = useState({
    players: true,
    teams: true,
    tryouts: true,
    assessments: true,
    evaluations: true
  });

  const [selectedFields, setSelectedFields] = useState({
    player_name: true,
    player_email: true,
    player_position: true,
    player_team: true,
    player_dob: true,
    tryout_role: true,
    tryout_recommendation: true,
    tryout_ranking: true,
    tryout_status: true,
    assessment_scores: true,
    evaluation_scores: true
  });

  const toggleDataType = (type) => {
    setSelectedData(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const toggleField = (field) => {
    setSelectedFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const exportToCSV = () => {
    const rows = [];
    const headers = [];

    // Build headers
    if (selectedFields.player_name) headers.push('Player Name');
    if (selectedFields.player_email) headers.push('Email');
    if (selectedFields.player_position) headers.push('Position');
    if (selectedFields.player_team) headers.push('Team');
    if (selectedFields.player_dob) headers.push('Date of Birth');
    if (selectedFields.tryout_role) headers.push('Team Role');
    if (selectedFields.tryout_recommendation) headers.push('Recommendation');
    if (selectedFields.tryout_ranking) headers.push('Ranking');
    if (selectedFields.tryout_status) headers.push('Next Season Status');
    if (selectedFields.assessment_scores) headers.push('Latest Assessment Score');
    if (selectedFields.evaluation_scores) headers.push('Latest Evaluation Score');

    rows.push(headers);

    // Build data rows
    players.forEach(player => {
      const row = [];
      const playerTryout = tryouts.find(t => t.player_id === player.id);
      const playerTeam = teams.find(t => t.id === player.team_id);
      const playerAssessments = assessments.filter(a => a.player_id === player.id).sort((a, b) => 
        new Date(b.assessment_date) - new Date(a.assessment_date)
      );
      const playerEvaluations = evaluations.filter(e => e.player_id === player.id).sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      );

      if (selectedFields.player_name) row.push(player.full_name || '');
      if (selectedFields.player_email) row.push(player.email || '');
      if (selectedFields.player_position) row.push(player.primary_position || '');
      if (selectedFields.player_team) row.push(playerTeam?.name || '');
      if (selectedFields.player_dob) row.push(player.date_of_birth || '');
      if (selectedFields.tryout_role) row.push(playerTryout?.team_role || '');
      if (selectedFields.tryout_recommendation) row.push(playerTryout?.recommendation || '');
      if (selectedFields.tryout_ranking) row.push(playerTryout?.team_ranking || '');
      if (selectedFields.tryout_status) row.push(playerTryout?.next_season_status || '');
      if (selectedFields.assessment_scores) row.push(playerAssessments[0]?.overall_score || '');
      if (selectedFields.evaluation_scores) row.push(playerEvaluations[0]?.overall_rating || '');

      rows.push(row);
    });

    const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `player_data_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Data exported as CSV!');
  };

  const exportToPDF = async () => {
    try {
      // Create HTML table
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #1e293b; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-size: 12px; }
              th { background-color: #10b981; color: white; font-weight: bold; }
              tr:nth-child(even) { background-color: #f8fafc; }
            </style>
          </head>
          <body>
            <h1>Player Data Export</h1>
            <p>Export Date: ${new Date().toLocaleDateString()}</p>
            <table>
              <thead>
                <tr>
                  ${selectedFields.player_name ? '<th>Player Name</th>' : ''}
                  ${selectedFields.player_email ? '<th>Email</th>' : ''}
                  ${selectedFields.player_position ? '<th>Position</th>' : ''}
                  ${selectedFields.player_team ? '<th>Team</th>' : ''}
                  ${selectedFields.player_dob ? '<th>DOB</th>' : ''}
                  ${selectedFields.tryout_role ? '<th>Team Role</th>' : ''}
                  ${selectedFields.tryout_recommendation ? '<th>Recommendation</th>' : ''}
                  ${selectedFields.tryout_ranking ? '<th>Ranking</th>' : ''}
                  ${selectedFields.tryout_status ? '<th>Next Season</th>' : ''}
                  ${selectedFields.assessment_scores ? '<th>Assessment</th>' : ''}
                  ${selectedFields.evaluation_scores ? '<th>Evaluation</th>' : ''}
                </tr>
              </thead>
              <tbody>
                ${players.map(player => {
                  const playerTryout = tryouts.find(t => t.player_id === player.id);
                  const playerTeam = teams.find(t => t.id === player.team_id);
                  const playerAssessments = assessments.filter(a => a.player_id === player.id).sort((a, b) => 
                    new Date(b.assessment_date) - new Date(a.assessment_date)
                  );
                  const playerEvaluations = evaluations.filter(e => e.player_id === player.id).sort((a, b) => 
                    new Date(b.created_date) - new Date(a.created_date)
                  );

                  return `
                    <tr>
                      ${selectedFields.player_name ? `<td>${player.full_name || ''}</td>` : ''}
                      ${selectedFields.player_email ? `<td>${player.email || ''}</td>` : ''}
                      ${selectedFields.player_position ? `<td>${player.primary_position || ''}</td>` : ''}
                      ${selectedFields.player_team ? `<td>${playerTeam?.name || ''}</td>` : ''}
                      ${selectedFields.player_dob ? `<td>${player.date_of_birth || ''}</td>` : ''}
                      ${selectedFields.tryout_role ? `<td>${playerTryout?.team_role || ''}</td>` : ''}
                      ${selectedFields.tryout_recommendation ? `<td>${playerTryout?.recommendation || ''}</td>` : ''}
                      ${selectedFields.tryout_ranking ? `<td>${playerTryout?.team_ranking || ''}</td>` : ''}
                      ${selectedFields.tryout_status ? `<td>${playerTryout?.next_season_status || ''}</td>` : ''}
                      ${selectedFields.assessment_scores ? `<td>${playerAssessments[0]?.overall_score || ''}</td>` : ''}
                      ${selectedFields.evaluation_scores ? `<td>${playerEvaluations[0]?.overall_rating || ''}</td>` : ''}
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      // Create a hidden iframe to print
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(htmlContent);
      doc.close();

      // Wait for content to load then print
      iframe.onload = () => {
        iframe.contentWindow.print();
        setTimeout(() => document.body.removeChild(iframe), 100);
      };

      toast.success('PDF export initiated - check your browser print dialog');
    } catch (error) {
      toast.error('Failed to export PDF');
    }
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-600" />
          Export Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold text-slate-900 mb-3">Select Data Types</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.keys(selectedData).map(type => (
              <div key={type} className="flex items-center gap-2">
                <Checkbox
                  checked={selectedData[type]}
                  onCheckedChange={() => toggleDataType(type)}
                  id={`type-${type}`}
                />
                <Label htmlFor={`type-${type}`} className="capitalize cursor-pointer">
                  {type}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-slate-900 mb-3">Select Fields</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.keys(selectedFields).map(field => (
              <div key={field} className="flex items-center gap-2">
                <Checkbox
                  checked={selectedFields[field]}
                  onCheckedChange={() => toggleField(field)}
                  id={`field-${field}`}
                />
                <Label htmlFor={`field-${field}`} className="capitalize cursor-pointer text-sm">
                  {field.replace(/_/g, ' ')}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button onClick={exportToCSV} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
            <Download className="w-4 h-4 mr-2" />
            Export as CSV
          </Button>
          <Button onClick={exportToPDF} variant="outline" className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Export as PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}