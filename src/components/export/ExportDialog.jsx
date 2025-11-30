import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FileDown, FileText, Loader2 } from 'lucide-react';

export default function ExportDialog({ 
  open, 
  onClose, 
  title = "Export Data",
  options = [],
  onExport,
  isLoading = false
}) {
  const [selectedOptions, setSelectedOptions] = useState(options.map(o => o.id));
  const [format, setFormat] = useState('csv');

  const toggleOption = (optionId) => {
    if (selectedOptions.includes(optionId)) {
      setSelectedOptions(selectedOptions.filter(id => id !== optionId));
    } else {
      setSelectedOptions([...selectedOptions, optionId]);
    }
  };

  const handleExport = () => {
    onExport(format, selectedOptions);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="w-5 h-5 text-emerald-600" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="mb-2 block font-semibold">Export Format</Label>
            <div className="flex gap-3">
              <Button
                variant={format === 'csv' ? 'default' : 'outline'}
                onClick={() => setFormat('csv')}
                className={format === 'csv' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              >
                <FileText className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button
                variant={format === 'pdf' ? 'default' : 'outline'}
                onClick={() => setFormat('pdf')}
                className={format === 'pdf' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              >
                <FileDown className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>

          {options.length > 0 && (
            <div>
              <Label className="mb-2 block font-semibold">Include Data</Label>
              <div className="space-y-2">
                {options.map(option => (
                  <div key={option.id} className="flex items-center gap-2">
                    <Checkbox
                      id={option.id}
                      checked={selectedOptions.includes(option.id)}
                      onCheckedChange={() => toggleOption(option.id)}
                    />
                    <Label htmlFor={option.id} className="text-sm cursor-pointer">{option.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleExport} 
            disabled={isLoading || selectedOptions.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 mr-2" />
                Export {format.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to generate CSV
export function generateCSV(headers, rows) {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      const cellStr = String(cell ?? '');
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(','))
  ].join('\n');
  return csvContent;
}

// Helper function to download file
export function downloadFile(content, filename, mimeType = 'text/csv') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Helper to generate simple PDF (HTML-based)
export function generatePDFContent(title, sections) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
        h2 { color: #334155; margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
        th { background: #f1f5f9; font-weight: bold; }
        .section { margin-bottom: 30px; }
        .label { color: #64748b; font-size: 12px; }
        .value { font-weight: bold; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      ${sections.map(section => `
        <div class="section">
          ${section.title ? `<h2>${section.title}</h2>` : ''}
          ${section.content}
        </div>
      `).join('')}
    </body>
    </html>
  `;
  return html;
}

export function printPDF(htmlContent) {
  const printWindow = window.open('', '_blank');
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
}