import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';

const LEAGUE_PRIORITY = { 'Girls Academy': 1, 'Pre-GA 1': 1, 'Aspire': 2, 'Pre-GA 2': 2, 'DPL': 3, 'Green': 4, 'White': 5, 'Black': 6 };

function getTeamLeague(team) {
  if (!team) return 'Unknown';
  const n = team.name?.toLowerCase() || '';
  if (n.includes('pre-ga 1') || team.league === 'Girls Academy') return 'Girls Academy';
  if (n.includes('pre-ga 2') || n.includes('aspire') || team.league === 'Aspire') return 'Aspire';
  if (n.includes('dpl') || team.league === 'DPL') return 'DPL';
  if (n.includes('green') || team.league === 'Green') return 'Green';
  if (n.includes('white') || team.league === 'White') return 'White';
  if (n.includes('black') || team.league === 'Black') return 'Black';
  return team.league || 'Unknown';
}

const COLUMN_COLORS = {
  'Girls Academy': { header: '#059669', light: '#d1fae5', border: '#6ee7b7' },
  'Aspire':        { header: '#2563eb', light: '#dbeafe', border: '#93c5fd' },
  'DPL':           { header: '#7c3aed', light: '#ede9fe', border: '#c4b5fd' },
  'Green':         { header: '#16a34a', light: '#dcfce7', border: '#86efac' },
  'White':         { header: '#64748b', light: '#f1f5f9', border: '#cbd5e1' },
  'Black':         { header: '#1e293b', light: '#f8fafc', border: '#94a3b8' },
  'Unknown':       { header: '#475569', light: '#f8fafc', border: '#e2e8f0' },
};

export default function PrintRankingsDialog({ open, onClose, players, teams }) {
  const allAgeGroups = useMemo(() => {
    const ags = [...new Set(
      teams.filter(t => {
        const s = t.season || (t.name?.includes('26/27') ? '26/27' : null);
        return s === '26/27';
      }).map(t => t.age_group).filter(Boolean)
    )].sort((a, b) => {
      const n = ag => { const m = ag?.match(/U-?(\d+)/i); return m ? parseInt(m[1]) : 0; };
      return n(b) - n(a);
    });
    return ags;
  }, [teams]);

  const [selectedAgeGroups, setSelectedAgeGroups] = useState([]);

  // When dialog opens, default to all age groups selected
  React.useEffect(() => {
    if (open) setSelectedAgeGroups(allAgeGroups);
  }, [open, allAgeGroups.join(',')]);

  const toggleAgeGroup = (ag) => {
    setSelectedAgeGroups(prev =>
      prev.includes(ag) ? prev.filter(x => x !== ag) : [...prev, ag]
    );
  };

  // Build print data: for each selected age group, 3 columns (GA, Aspire, DPL+)
  const printData = useMemo(() => {
    return selectedAgeGroups.map(ageGroup => {
      const agTeams = teams.filter(t => {
        const s = t.season || (t.name?.includes('26/27') ? '26/27' : null);
        return s === '26/27' && t.age_group === ageGroup;
      }).sort((a, b) => (LEAGUE_PRIORITY[getTeamLeague(a)] || 99) - (LEAGUE_PRIORITY[getTeamLeague(b)] || 99));

      const columns = [
        {
          label: 'Girls Academy',
          teams: agTeams.filter(t => {
            const league = getTeamLeague(t);
            return league === 'Girls Academy';
          })
        },
        {
          label: 'Aspire',
          teams: agTeams.filter(t => getTeamLeague(t) === 'Aspire')
        },
        {
          label: 'DPL & Other',
          teams: agTeams.filter(t => {
            const league = getTeamLeague(t);
            return league !== 'Girls Academy' && league !== 'Aspire';
          })
        }
      ];

      return { ageGroup, columns };
    });
  }, [selectedAgeGroups, teams]);

  const getTeamPlayers = (team) => {
    const season = team.season || (team.name?.includes('26/27') ? '26/27' : null);
    return players.filter(p => {
      if (p.team_assignments?.length > 0) {
        return p.team_assignments.some(a => a.team_id === team.id && a.season === season);
      }
      return p.current_26_27_team === team.id;
    }).sort((a, b) => {
      const rA = a.age_group_ranking ?? 999999;
      const rB = b.age_group_ranking ?? 999999;
      if (rA !== rB) return rA - rB;
      return (a.team_position_order ?? 999999) - (b.team_position_order ?? 999999);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Print-only styles injected globally */}
      <style>{`
        @media print {
          @page { size: landscape; margin: 0.5in; }
          body * { visibility: hidden !important; }
          #print-rankings-content, #print-rankings-content * { visibility: visible !important; }
          #print-rankings-content {
            position: fixed !important;
            top: 0; left: 0;
            width: 100%;
            background: white !important;
            z-index: 99999;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-emerald-600" />
              Print Rankings
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Select Age Groups to Print:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedAgeGroups(
                    selectedAgeGroups.length === allAgeGroups.length ? [] : [...allAgeGroups]
                  )}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border-2 border-slate-400 text-slate-600 hover:bg-slate-100 transition-all"
                >
                  {selectedAgeGroups.length === allAgeGroups.length ? 'Deselect All' : 'Select All'}
                </button>
                {allAgeGroups.map(ag => (
                  <button
                    key={ag}
                    onClick={() => toggleAgeGroup(ag)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${
                      selectedAgeGroups.includes(ag)
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow'
                        : 'border-slate-300 text-slate-500 hover:border-emerald-400'
                    }`}
                  >
                    {ag}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-xs text-slate-500">
                Will print {selectedAgeGroups.length} age group{selectedAgeGroups.length !== 1 ? 's' : ''} in landscape, 3 columns per page.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} size="sm">
                  <X className="w-4 h-4 mr-1" /> Cancel
                </Button>
                <Button
                  onClick={handlePrint}
                  disabled={selectedAgeGroups.length === 0}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Printer className="w-4 h-4 mr-1" /> Print
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden print content */}
      <div id="print-rankings-content" style={{ display: 'none' }} className="no-print">
        <style>{`
          @media print {
            #print-rankings-content { display: block !important; }
          }
        `}</style>
        <PrintContent printData={printData} getTeamPlayers={getTeamPlayers} />
      </div>
    </>
  );
}

function PrintContent({ printData, getTeamPlayers }) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: 'white', color: '#1e293b' }}>
      {printData.map(({ ageGroup, columns }, pageIdx) => (
        <div
          key={ageGroup}
          style={{
            pageBreakAfter: pageIdx < printData.length - 1 ? 'always' : 'auto',
            padding: '0',
            minHeight: '100vh',
          }}
        >
          {/* Page header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '3px solid #059669',
            paddingBottom: '8px',
            marginBottom: '12px',
          }}>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#059669' }}>
                Michigan Jaguars — 2026/27 Season Rankings
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                Age Group: <strong style={{ color: '#1e293b' }}>{ageGroup}</strong>
                &nbsp;·&nbsp; Printed {new Date().toLocaleDateString()}
              </div>
            </div>
            <div style={{
              background: '#059669',
              color: 'white',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '14px',
              fontWeight: '700',
            }}>
              {ageGroup}
            </div>
          </div>

          {/* 3-column layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', alignItems: 'start' }}>
            {columns.map(col => {
              const colColor = COLUMN_COLORS[col.label] || COLUMN_COLORS['Unknown'];
              return (
                <div key={col.label} style={{ border: `2px solid ${colColor.border}`, borderRadius: '8px', overflow: 'hidden' }}>
                  {/* Column header */}
                  <div style={{
                    background: colColor.header,
                    color: 'white',
                    padding: '8px 12px',
                    fontWeight: '700',
                    fontSize: '13px',
                    letterSpacing: '0.5px',
                  }}>
                    {col.label}
                  </div>

                  {col.teams.length === 0 ? (
                    <div style={{ padding: '12px', color: '#94a3b8', fontSize: '11px', fontStyle: 'italic', textAlign: 'center' }}>
                      No teams
                    </div>
                  ) : (
                    col.teams.map(team => {
                      const teamPlayers = getTeamPlayers(team);
                      return (
                        <div key={team.id} style={{ borderBottom: `1px solid ${colColor.border}` }}>
                          {/* Team sub-header */}
                          <div style={{
                            background: colColor.light,
                            padding: '5px 10px',
                            fontWeight: '700',
                            fontSize: '11px',
                            color: colColor.header,
                            borderBottom: `1px solid ${colColor.border}`,
                          }}>
                            {team.name}
                            <span style={{ fontWeight: '400', color: '#64748b', marginLeft: '6px' }}>
                              ({teamPlayers.length} players)
                            </span>
                          </div>

                          {/* Player rows */}
                          {teamPlayers.length === 0 ? (
                            <div style={{ padding: '6px 10px', color: '#94a3b8', fontSize: '10px', fontStyle: 'italic' }}>
                              No players
                            </div>
                          ) : (
                            teamPlayers.map((player, idx) => (
                              <div
                                key={player.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  padding: '4px 10px',
                                  background: idx % 2 === 0 ? 'white' : '#f8fafc',
                                  borderBottom: '1px solid #f1f5f9',
                                }}
                              >
                                {/* Age group rank badge */}
                                <span style={{
                                  minWidth: '24px',
                                  height: '20px',
                                  background: colColor.header,
                                  color: 'white',
                                  borderRadius: '4px',
                                  fontSize: '9px',
                                  fontWeight: '800',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}>
                                  #{player.age_group_ranking ?? '—'}
                                </span>

                                {/* Player name */}
                                <span style={{ fontSize: '11px', fontWeight: '500', flex: 1, color: '#1e293b' }}>
                                  {player.full_name}
                                </span>

                                {/* Position */}
                                {player.primary_position && (
                                  <span style={{
                                    fontSize: '9px',
                                    color: '#64748b',
                                    background: '#f1f5f9',
                                    borderRadius: '3px',
                                    padding: '1px 4px',
                                    whiteSpace: 'nowrap',
                                  }}>
                                    {player.primary_position}
                                  </span>
                                )}

                                {/* Grad year */}
                                {player.grad_year && (
                                  <span style={{ fontSize: '9px', color: '#94a3b8' }}>
                                    '{String(player.grad_year).slice(-2)}
                                  </span>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>

          {/* Page footer */}
          <div style={{
            marginTop: '12px',
            borderTop: '1px solid #e2e8f0',
            paddingTop: '6px',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '9px',
            color: '#94a3b8',
          }}>
            <span>Michigan Jaguars — Confidential</span>
            <span>2026/27 Tryout Rankings — {ageGroup}</span>
            <span>Page {pageIdx + 1} of {printData.length}</span>
          </div>
        </div>
      ))}
    </div>
  );
}