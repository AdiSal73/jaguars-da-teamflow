import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, CheckCircle2, AlertCircle, Users, FileText, X, Eye, RefreshCw } from 'lucide-react';
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
      const parts = (p.full_name || '').trim().toLowerCase().split(/\s+/);
      return parts[0] === firstName && parts[parts.length - 1] === lastName;
    });
    if (match) return match;
  }
  if (fullName) {
    return players.find(p => (p.full_name || '').trim().toLowerCase() === fullName) || null;
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

// ── Sleep helper ──────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ─────────────────────────────────────────────────────────────────────────────

export default function ParentPlayerCSVImportDialog({ open, onClose, players = [], onComplete }) {
  const fileRef = useRef(null);
  const logRef  = useRef(null);

  const [phase,    setPhase]    = useState('idle');     // idle | reviewing | confirming | processing | done
  const [rows,     setRows]     = useState([]);
  const [fileName, setFileName] = useState('');
  const [preview,  setPreview]  = useState([]);         // matched + unmatched rows
  const [progress, setProgress] = useState({ processed: 0, total: 0, success: 0, errors: 0 });
  const [logs,     setLogs]     = useState([]);

  const addLog = (type, msg) => {
    setLogs(prev => {
      const next = [...prev, { type, msg }];
      setTimeout(() => {
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
      }, 30);
      return next;
    });
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = ev => {
      const parsed = parseCSV(ev.target.result);
      setRows(parsed);
      buildPreview(parsed);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const buildPreview = (rawRows) => {
    const results = rawRows.map(row => {
      const firstName   = (row['Player First Name'] || row['First Name'] || '').trim();
      const lastName    = (row['Player Last Name']  || row['Last Name']  || '').trim();
      const displayName = firstName && lastName ? `${firstName} ${lastName}` : (row['player_name'] || row['Player Name'] || '?');
      const player      = findPlayer(row, players);
      const parents     = extractParents(row);

      const hasExisting = player && (
        (player.parent_emails?.length > 0) ||
        (player.parent_names?.length > 0) ||
        player.parent_name || player.phone
      );

      return {
        displayName,
        player,
        parents,
        hasExisting,
        existingEmails: player?.parent_emails || [],
        existingNames:  player?.parent_names  || [],
        existingPhone:  player?.phone         || '',
        newEmails:      parents.map(p => p.email),
        newNames:       parents.map(p => p.name),
        newPhone:       parents[0]?.phone || '',
        error: !player
          ? `No player match for "${displayName}"`
          : parents.length === 0
          ? `No parent email for "${displayName}"`
          : null
      };
    });
    setPreview(results);
    setPhase('reviewing');
  };

  const matched    = preview.filter(r => !r.error);
  const unmatched  = preview.filter(r => !!r.error);
  const overwrites = matched.filter(r => r.hasExisting);
  const fresh      = matched.filter(r => !r.hasExisting);

  const runImport = async () => {
    setPhase('processing');
    setLogs([]);
    const total = matched.length;
    setProgress({ processed: 0, total, success: 0, errors: 0 });
    let success = 0, errors = 0;

    for (let i = 0; i < matched.length; i++) {
      const { player, parents, displayName, newEmails, newNames, newPhone } = matched[i];
      try {
        await base44.entities.Player.update(player.id, {
          parent_emails: newEmails,
          parent_names:  newNames,
          parent_name:   newNames[0] || '',
          phone:         newPhone
        });
        success++;
        addLog('success', `✅ ${displayName}`);
      } catch (err) {
        errors++;
        addLog('error', `❌ ${displayName}: ${err.message}`);
      }
      setProgress({ processed: i + 1, total, success, errors });
      await sleep(120); // prevent rate limiting
    }

    setPhase('done');
    addLog('info', `Done — ${success} updated, ${errors} failed, ${unmatched.length} unmatched.`);
    if (success > 0 && onComplete) onComplete();
  };

  const handleClose = () => {
    setPhase('idle'); setRows([]); setPreview([]); setLogs([]); setFileName('');
    onClose();
  };

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
                <p className="text-slate-400">Repeat for Parent 2, Parent 3… Also works with TSV (tab-separated).</p>
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
          <div className="flex flex-col gap-4 overflow-hidden flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" /> {fileName}
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-xs">{rows.length} rows</span>
              </span>
              <Button variant="ghost" size="sm" onClick={() => { setPhase('idle'); setRows([]); setPreview([]); }}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                <div className="text-xs font-semibold text-green-600">New / No Conflict</div>
                <div className="text-2xl font-bold text-green-700">{fresh.length}</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                <div className="text-xs font-semibold text-amber-600">Will Overwrite</div>
                <div className="text-2xl font-bold text-amber-700">{overwrites.length}</div>
              </div>
              <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                <div className="text-xs font-semibold text-red-600">No Match</div>
                <div className="text-2xl font-bold text-red-700">{unmatched.length}</div>
              </div>
            </div>

            {/* Overwrite warning */}
            {overwrites.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <strong>⚠️ Overwrite Warning:</strong> {overwrites.length} player(s) already have parent data. Importing will <strong>replace</strong> their existing contacts with the new CSV data.
              </div>
            )}

            {/* Preview table */}
            <div className="overflow-auto max-h-48 rounded-lg border border-slate-200 text-xs flex-1">
              <table className="w-full">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Player</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">New Emails</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-3 py-1.5 font-medium text-slate-800">{row.displayName}</td>
                      <td className="px-3 py-1.5 text-slate-600">{row.newEmails.join(', ') || '—'}</td>
                      <td className="px-3 py-1.5">
                        {row.error
                          ? <span className="text-red-500">{row.error}</span>
                          : row.hasExisting
                          ? <span className="text-amber-600 font-semibold">Overwrite</span>
                          : <span className="text-green-600">New</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => { setPhase('idle'); setRows([]); setPreview([]); }} className="flex-1">Cancel</Button>
              {matched.length > 0 && (
                <Button onClick={() => setPhase('confirming')} className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2">
                  <Eye className="w-4 h-4" /> Review & Confirm ({matched.length})
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ── CONFIRMING ── */}
        {phase === 'confirming' && (
          <div className="flex flex-col gap-4">
            <div className="bg-slate-900 text-white rounded-xl p-5 space-y-3">
              <p className="font-bold text-lg">Confirm Import</p>
              <ul className="space-y-1 text-sm text-slate-300">
                <li>✅ <strong className="text-white">{fresh.length}</strong> players will get parent contacts added</li>
                {overwrites.length > 0 && (
                  <li>⚠️ <strong className="text-amber-400">{overwrites.length}</strong> players will have their existing parent data <strong className="text-amber-400">overwritten</strong></li>
                )}
                {unmatched.length > 0 && (
                  <li>❌ <strong className="text-red-400">{unmatched.length}</strong> rows will be skipped (no player match)</li>
                )}
              </ul>
              {overwrites.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-700 text-xs text-amber-300">
                  This action cannot be undone. The following players' existing contacts will be replaced:<br />
                  <span className="text-slate-400">{overwrites.map(r => r.displayName).join(', ')}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPhase('reviewing')} className="flex-1">Go Back</Button>
              <Button onClick={runImport} className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2">
                <RefreshCw className="w-4 h-4" /> Yes, Import Now
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