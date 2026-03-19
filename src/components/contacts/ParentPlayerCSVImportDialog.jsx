import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, CheckCircle2, AlertCircle, RefreshCw, Users, FileText, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

function parseCSV(text) {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const firstLine = lines[0];
  const delimiter = firstLine.includes('\t') ? '\t' : ',';

  const splitLine = (line) => {
    if (delimiter === '\t') return line.split('\t').map(v => v.trim().replace(/^"|"$/g, ''));
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
      else { current += char; }
    }
    values.push(current.trim());
    return values.map(v => v.replace(/^"|"$/g, '').trim());
  };

  const headers = splitLine(firstLine);
  return lines.slice(1).map(line => {
    const values = splitLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = (values[i] || '').trim(); });
    return row;
  }).filter(row => Object.values(row).some(v => v));
}

function matchRowToPlayer(row, allPlayers) {
  const lastName = (row['Player Last Name'] || row['Last Name'] || '').trim();
  const firstName = (row['Player First Name'] || row['First Name'] || '').trim();
  const fullName = (firstName && lastName) ? `${firstName} ${lastName}` : (row['player_name'] || row['Player Name'] || '').trim();

  if (!fullName || fullName.length < 2) return { fullName, player: null, error: 'Missing player name' };

  const nameLower = fullName.toLowerCase();
  let player = allPlayers.find(p => p.full_name?.toLowerCase().trim() === nameLower);

  if (!player && firstName && lastName) {
    player = allPlayers.find(p => {
      const parts = p.full_name?.toLowerCase().trim().split(/\s+/) || [];
      return parts[0] === firstName.toLowerCase() && parts[parts.length - 1] === lastName.toLowerCase();
    });
  }

  return { fullName, player, error: player ? null : `Player not found: "${fullName}"` };
}

function extractParents(row) {
  const parents = [];
  for (let n = 1; n <= 3; n++) {
    const email = (row[`Parent ${n} Email`] || row[`parent_${n}_email`] || (n === 1 ? row['parent_email'] || row['Parent Email'] || '' : '')).trim().toLowerCase();
    const name = (row[`Parent ${n} Name`] || row[`parent_${n}_name`] || (n === 1 ? row['parent_name'] || row['Parent Name'] || '' : '')).trim();
    const phone = (row[`Parent ${n} Cell Phone`] || row[`Parent ${n} Phone`] || (n === 1 ? row['parent_phone'] || '' : '')).trim();
    if (email) parents.push({ email, name, phone });
  }
  return parents;
}

async function callWithRetry(fn, retries = 3, delayMs = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, delayMs * (i + 1)));
    }
  }
}

export default function ParentPlayerCSVImportDialog({ open, onClose, players = [], onComplete }) {
  const fileRef = useRef(null);
  const [phase, setPhase] = useState('idle');
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [progress, setProgress] = useState({ processed: 0, total: 0, success: 0, errors: 0 });
  const [logs, setLogs] = useState([]);
  const [failedItems, setFailedItems] = useState([]);
  const logRef = useRef(null);

  const addLog = (type, message) => {
    setLogs(prev => {
      const next = [...prev, { type, message }];
      setTimeout(() => logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' }), 50);
      return next;
    });
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCSV(ev.target.result);
      setRows(parsed);
      setPhase('reviewing');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const runImport = async (itemsToProcess) => {
    setPhase('processing');
    setLogs([]);
    setFailedItems([]);
    const total = itemsToProcess.length;
    setProgress({ processed: 0, total, success: 0, errors: 0 });
    addLog('info', `Matching ${total} rows against ${players.length} players...`);

    // Pre-match all rows on the frontend — no DB calls needed
    const matched = [];
    const preErrors = [];
    for (const row of itemsToProcess) {
      const { fullName, player, error } = matchRowToPlayer(row, players);
      const parents = extractParents(row);
      if (error) {
        preErrors.push({ row, error });
        addLog('error', error);
      } else if (parents.length === 0) {
        const msg = `No parent email for "${fullName}"`;
        preErrors.push({ row, error: msg });
        addLog('error', msg);
      } else {
        matched.push({ row, player, parents, fullName });
      }
    }

    addLog('info', `Matched ${matched.length} players. ${preErrors.length} unmatched. Starting updates...`);

    let successCount = 0;
    let errorCount = preErrors.length;
    const newFailedItems = [...preErrors];

    for (let i = 0; i < matched.length; i++) {
      const { player, parents, fullName } = matched[i];
      const parentEmails = parents.map(p => p.email);
      const parentName = parents[0]?.name || '';
      const phone = parents[0]?.phone || '';

      try {
        await callWithRetry(async () => {
          const resp = await base44.functions.invoke('importParentPlayerCSV', {
            playerId: player.id,
            parentEmails,
            parentName,
            phone
          });
          if (!resp.data?.success) throw new Error(resp.data?.error || 'Update failed');
        }, 3, 800);

        successCount++;
        addLog('success', `✅ "${fullName}" → ${parentEmails.join(', ')}`);
      } catch (err) {
        errorCount++;
        newFailedItems.push({ row: matched[i].row, error: err.message });
        addLog('error', `❌ "${fullName}": ${err.message}`);
      }

      setProgress({ processed: i + 1 + preErrors.length, total, success: successCount, errors: errorCount });

      // 200ms gap between each update to stay well under rate limits
      if (i < matched.length - 1) await new Promise(r => setTimeout(r, 200));
    }

    setFailedItems(newFailedItems);
    setPhase('done');
    addLog('info', `Done! ${successCount} succeeded, ${errorCount} failed.`);
    if (successCount > 0 && onComplete) onComplete();
  };

  const handleClose = () => {
    setPhase('idle');
    setRows([]);
    setLogs([]);
    setFailedItems([]);
    setFileName('');
    onClose();
  };

  const sampleColumns = rows[0] ? Object.keys(rows[0]) : [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-blue-600" />
            Import Parent–Player Links from CSV
          </DialogTitle>
        </DialogHeader>

        {phase === 'idle' && (
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-800 mb-2">Upload a CSV or TSV file</p>
              <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3 text-left space-y-1">
                <p className="font-semibold text-slate-600 mb-1">Expected columns:</p>
                <p><code className="bg-slate-200 px-1 rounded">Player Last Name</code> <code className="bg-slate-200 px-1 rounded">Player First Name</code></p>
                <p><code className="bg-slate-200 px-1 rounded">Parent 1 Email</code> <code className="bg-slate-200 px-1 rounded">Parent 1 Name</code> <code className="bg-slate-200 px-1 rounded">Parent 1 Cell Phone</code></p>
                <p className="text-slate-400">Up to 3 parents per row (Parent 2, Parent 3…)</p>
              </div>
            </div>
            <Button onClick={() => fileRef.current?.click()} className="bg-blue-600 hover:bg-blue-700 gap-2">
              <Upload className="w-4 h-4" />
              Choose File
            </Button>
            <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" onChange={handleFile} className="hidden" />
          </div>
        )}

        {phase === 'reviewing' && (
          <div className="flex flex-col gap-4 overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">{fileName}</span>
                <Badge variant="secondary">{rows.length} rows</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setPhase('idle'); setRows([]); }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-xs text-slate-500">Detected columns: {sampleColumns.join(', ')}</div>
            <div className="overflow-auto max-h-64 rounded-lg border border-slate-200">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>{sampleColumns.map(col => <th key={col} className="px-3 py-2 text-left font-semibold text-slate-600 whitespace-nowrap">{col}</th>)}</tr>
                </thead>
                <tbody>
                  {rows.slice(0, 15).map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      {sampleColumns.map(col => <td key={col} className="px-3 py-1.5 text-slate-700 whitespace-nowrap max-w-[160px] truncate">{row[col] || '—'}</td>)}
                    </tr>
                  ))}
                  {rows.length > 15 && <tr><td colSpan={sampleColumns.length} className="px-3 py-2 text-center text-slate-400 italic">…and {rows.length - 15} more rows</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => { setPhase('idle'); setRows([]); }} className="flex-1">Cancel</Button>
              <Button onClick={() => runImport(rows)} className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2">
                <Upload className="w-4 h-4" />
                Start Import ({rows.length} rows)
              </Button>
            </div>
          </div>
        )}

        {(phase === 'processing' || phase === 'done') && (
          <div className="flex flex-col gap-4 flex-1 overflow-hidden">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-center">
                <div className="text-xs font-semibold text-blue-600">Total</div>
                <div className="text-2xl font-bold text-blue-700">{progress.total}</div>
              </div>
              <div className="p-3 bg-green-50 rounded-xl border border-green-100 text-center">
                <div className="text-xs font-semibold text-green-600">Success</div>
                <div className="text-2xl font-bold text-green-700">{progress.success}</div>
              </div>
              <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-center">
                <div className="text-xs font-semibold text-red-600">Errors</div>
                <div className="text-2xl font-bold text-red-700">{progress.errors}</div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>{progress.processed} / {progress.total} processed</span>
                <span>{progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0}%</span>
              </div>
              <Progress value={progress.total > 0 ? (progress.processed / progress.total) * 100 : 0} className="h-2" />
            </div>

            <div ref={logRef} className="flex-1 overflow-y-auto bg-slate-900 rounded-xl p-4 font-mono text-xs space-y-1 min-h-[160px] max-h-64">
              {logs.map((log, idx) => (
                <div key={idx} className={`flex items-start gap-2 ${log.type === 'success' ? 'text-green-400' : log.type === 'error' ? 'text-red-400' : 'text-slate-300'}`}>
                  {log.type === 'success' && <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />}
                  {log.type === 'error' && <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />}
                  <span>{log.message}</span>
                </div>
              ))}
              {phase === 'processing' && <div className="text-slate-400 animate-pulse">Processing...</div>}
            </div>

            {phase === 'done' && (
              <div className="flex gap-2">
                {failedItems.length > 0 && (
                  <Button onClick={() => runImport(failedItems.map(f => f.row))} className="flex-1 bg-orange-500 hover:bg-orange-600 gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Retry {failedItems.length} Failed
                  </Button>
                )}
                <Button onClick={handleClose} className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {failedItems.length === 0 ? 'Done' : 'Close'}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}