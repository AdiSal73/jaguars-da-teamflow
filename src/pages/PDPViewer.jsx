import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, ExternalLink, Target, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PDPViewer() {
  const pdfUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691b4f505049805bdf639ffd/dd7cffbe4_PDP2025.pdf';

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-2">
            Player Development Program 2025
          </h1>
          <p className="text-slate-600">Complete guide to the Michigan Jaguars Player Development Program</p>
        </div>

        <Card className="border-none shadow-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-600 text-white border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <FileText className="w-6 h-6" />
                PDP 2025 Document
              </CardTitle>
              <div className="flex gap-2">
                <a href={pdfUrl} download target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </a>
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in New Tab
                  </Button>
                </a>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative w-full bg-white" style={{ height: 'calc(100vh - 240px)', minHeight: '600px' }}>
              <iframe
                src={`${pdfUrl}#view=FitH`}
                className="w-full h-full border-0"
                title="PDP 2025 PDF Viewer"
              />
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-50 to-green-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Development Focus</h3>
                  <p className="text-sm text-slate-600">Comprehensive player development framework</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Training Modules</h3>
                  <p className="text-sm text-slate-600">Structured training plans and exercises</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Position-Specific</h3>
                  <p className="text-sm text-slate-600">Tailored development for each position</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}