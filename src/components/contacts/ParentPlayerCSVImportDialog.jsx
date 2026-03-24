import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, CheckCircle2, AlertCircle, Users, FileText, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

// ── CSV / TSV parser ──────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const isTab = lines[0].includes('\t');

  const splitLine = (line) => {
    if (isTab) return line.split('\t').map(v => v.trim().replace(/^"|"$/g, ''));
    const vals = [];
    let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
    vals.push(cur.trim());
    return vals.map(v => v.replace(/^"|"$/g, '').trim());
  };

  const headers = splitLine(lines[0]);
  return lines.slice(1).map(line => {
    const vals = splitLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = (vals[i] || '').trim(); });
    return row;
  }).filter(row => Object.values(row).some(v => v));
}

// ── Match a CSV row to a player ───────────────────────────────────────────────
function findPlayer(row, players) {
  const firstName = (row['Player First Name'] || row['First Name'] || '').trim().toLowerCase();
  const lastName  = (row['Player Last Name']  || row['Last Name']  || '').trim().toLowerCase();
  const fullName  = (row['player_name'] || row['Player Name'] || '').trim().toLowerCase();

  if (firstName && lastName) {
    const match = players.find(p => {
      const parts = p.full_name?.trim().toLowerCase().split(/\s+/) || [];
      return parts[0] === firstName && parts[parts.length - 1] === lastName;
    });
    if (match) return match;
  }
  if (fullName) {
    return players.find(p => p.full_name?.trim().toLowerCase() === fullName) || null;
  }
  return null;
}

// ── Extract up to 3 parent slots from a row ───────────────────────────────────
function extractParents(row) {
  const parents = [];
  for (let n = 1; n <= 3; n++) {
    const email = (
      row[`Parent ${n} Email`] ||
      row[`parent_${n}_email`] ||
      (n === 1 ? row['Parent Email'] || row['parent_email'] || '' : '')
    ).trim().toLowerCase();

    const name = (
      row[`Parent ${n} Name`] ||
      row[`parent_${n}_name`] ||
      (n === 1 ? row['Parent Name'] || row['parent_name'] || '' : '')
    ).trim();

    const phone = (
      row[`Parent ${n} Cell Phone`] ||
      row[`Parent ${n} Phone`] ||
      (n === 1 ? row['parent_phone'] || row['Phone'] || '' : '')
    ).trim();

    if (email) parents.push({ email, name, phone });
  }
  return parents;
}

// ─────────────────────────────────────────────────────────────────────────────

const BATCH_SIZE = 50;

export default function ParentPlayerCSVImportDialog({ open, onClose, players = [], onComplete }) {
  const fileRef = useRef(null);
  const logRef  = useRef(null);

  const [phase,      setPhase]      = useState('idle');      // idle | reviewing | processing | done
  const [rows,       setRows]       = useState([]);
  const [fileName,   setFileName]   = useState('');
  const [progress,   setProgress]   = useState({ processed: 0, total: 0, success: 0, errors: 0 });
  const [logs,       setLogs]       = useState([]);
  const [failedRows, setFailedRows] = useState([]);

  const log = (type, msg) => {
    setLogs(prev => {
      const next = [...prev, { type, msg }];
      setTimeout(() => logRef.current?.scrollTo({ top: logRef.current.scrollHeight }), 30);
      return next;
    });
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = ev => {
      setRows(parseCSV(ev.target.result));
      setPhase('reviewing');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const runImport = async (rowsToRun) => {
    setPhase('processing');
    setLogs([]);
    setFailedRows([]);
    const total = rowsToRun.length;
    setProgress({ processed: 0, total, success: 0, errors: 0 });

    // ── Pre-match all rows on the client ──────────────────────────────────────
    const matched  = [];
    const unmatched = [];

    for (const row of rowsToRun) {
      const firstName = (row['Player First Name'] || row['First Name'] || '').trim();
      const lastName  = (row['Player Last Name']  || row['Last Name']  || '').trim();
      const displayName = firstName && lastName ? `${firstName} ${lastName}` : (row['player_name'] || row['Player Name'] || '?');

      const player  = findPlayer(row, players);
      const parents = extractParents(row);

      if (!player) {
        unmatched.push({ row, reason: `No player found: "${displayName}"` });
        log('error', `❌ No match: "${displayName}"`);
      } else if (parents.length === 0) {
        unmatched.push({ row, reason: `No parent email for "${displayName}"` });
        log('error', `❌ No parent email: "${displayName}"`);
      } else {
        matched.push({
          playerId:     player.id,
          parentEmails: parents.map(p => p.email),
          parentNames:  parents.map(p => p.name),
          phone:        parents[0]?.phone || ''
        });
      }
    }

    log('info', `Matched ${matched.length} / ${total} rows — sending to server…`);
    setProgress({ processed: unmatched.length, total, success: 0, errors: unmatched.length });

    let successCount = 0;
    let errorCount   = unmatched.length;
    const newFailed  = [...unmatched.map(u => u.row)];

    for (let i = 0; i < matched.length; i += BATCH_SIZE) {
      const batch = matched.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;

      try {
        const resp = await base44.functions.invoke('importParentPlayerCSV', { updates: batch });
        const data = resp.data;
        successCount += data.succeeded || 0;
        errorCount   += data.failed    || 0;
        if (data.errors?.length) data.errors.forEach(e => log('error', `❌ ${e}`));
        log('success', `✅ Batch ${batchNum}: ${data.succeeded} updated${data.failed ? `, ${data.failed} failed` : ''}`);
      } catch (err) {
        errorCount += batch.length;
        log('error', `❌ Batch ${batchNum} failed: ${err.message}`);
      }

      setProgress({ processed: Math.min(i + BATCH_SIZE, matched.length) + unmatched.length, total, success: successCount, errors: errorCount });
    }

    setFailedRows(newFailed);
    setPhase('done');
    log('info', `Done — ${successCount} succeeded, ${errorCount} failed.`);
    if (successCount > 0 && onComplete) onComplete();
  };

  const handleClose = () => {
    setPhase('idle'); setRows([]); setLogs([]); setFailedRows([]); setFileName('');
    onClose();
  };

  const cols = rows[0] ? Object.keys(rows[0]) : [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Import Parent–Player Links from CSV
          </DialogTitle>
        </DialogHeader>

        {/* ── IDLE ── */}
        {phase === 'idle' && (
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
            <div className="text-center space-y-2">
              <p className="font-semibold text-slate-800">Upload a CSV or TSV file</p>
              <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3 text-left space-y-1">
                <p className="font-semibold text-slate-600 mb-1">Expected columns:</p>
                <p><code className="bg-slate-200 px-1 rounded">Player First Name</code> <code className="bg-slate-200 px-1 rounded">Player Last Name</code></p>
                <p><code className="bg-slate-200 px-1 rounded">Parent 1 Email</code> <code className="bg-slate-200 px-1 rounded">Parent 1 Name</code> <code className="bg-slate-200 px-1 rounded">Parent 1 Cell Phone</code></p>
                <p className="text-slate-400">Repeat for Parent 2, Parent 3…</p>
              </div>
            </div>
            <Button onClick={() => fileRef.current?.click()} className="bg-blue-600 hover:bg-blue-700 gap-2">
              <Upload className="w-4 h-4" /> Choose File
            </Button>
            <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" onChange={handleFile} className="hidden" />
          </div>
        )}

        {/* ── REVIEWING ── */}
        {phase === 'reviewing' && (
          <div className="flex flex-col gap-4 overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <FileText className="w-4 h-4 text-slate-400" />
                {fileName}
                <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-100 text-xs">{rows.length} rows</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setPhase('idle'); setRows([]); }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-slate-500">Detected columns: {cols.join(', ')}</p>
            <div className="overflow-auto max-h-64 rounded-lg border border-slate-200">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>{cols.map(c => <th key={c} className="px-3 py-2 text-left font-semibold text-slate-600 whitespace-nowrap">{c}</th>)}</tr>
                </thead>
                <tbody>
                  {rows.slice(0, 15).map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      {cols.map(c => <td key={c} className="px-3 py-1.5 text-slate-700 whitespace-nowrap max-w-[160px] truncate">{row[c] || '—'}</td>)}
                    </tr>
                  ))}
                  {rows.length > 15 && (
                    <tr><td colSpan={cols.length} className="px-3 py-2 text-center text-slate-400 italic">…and {rows.length - 15} more rows</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => { setPhase('idle'); setRows([]); }} className="flex-1">Cancel</Button>
              <Button onClick={() => runImport(rows)} className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2">
                <Upload className="w-4 h-4" /> Import {rows.length} rows
              </Button>
            </div>
          </div>
        )}

        {/* ── PROCESSING / DONE ── */}
        {(phase === 'processing' || phase === 'done') && (
          <div className="flex flex-col gap-4 flex-1 overflow-hidden">
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'Total',   val: progress.total,   color: 'blue'  },
                { label: 'Success', val: progress.success, color: 'green' },
                { label: 'Errors',  val: progress.errors,  color: 'red'   },
              ].map(({ label, val, color }) => (
                <div key={label} className={`p-3 bg-${color}-50 rounded-xl border border-${color}-100`}>
                  <div className={`text-xs font-semibold text-${color}-600`}>{label}</div>
                  <div className={`text-2xl font-bold text-${color}-700`}>{val}</div>
                </div>
              ))}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>{progress.processed} / {progress.total}</span>
                <span>{progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0}%</span>
              </div>
              <Progress value={progress.total > 0 ? (progress.processed / progress.total) * 100 : 0} className="h-2" />
            </div>

            <div ref={logRef} className="flex-1 overflow-y-auto bg-slate-900 rounded-xl p-4 font-mono text-xs space-y-1 min-h-[160px] max-h-64">
              {logs.map((l, i) => (
                <div key={i} className={`flex items-start gap-2 ${l.type === 'success' ? 'text-green-400' : l.type === 'error' ? 'text-red-400' : 'text-slate-300'}`}>
                  {l.type === 'success' && <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />}
                  {l.type === 'error'   && <AlertCircle  className="w-3 h-3 mt-0.5 flex-shrink-0" />}
                  <span>{l.msg}</span>
                </div>
              ))}
              {phase === 'processing' && <div className="text-slate-400 animate-pulse">Processing…</div>}
            </div>

            {phase === 'done' && (
              <Button onClick={handleClose} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                <CheckCircle2 className="w-4 h-4" /> Done
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}