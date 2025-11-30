import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';

function SliderBar({ label, value, color, max = 10 }) {
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-slate-600">{label}</span>
        <span className="text-xs font-bold" style={{ color }}>{value || 0}</span>
      </div>
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${((value || 0) / max) * 100}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// Hover tooltip component
export function PlayerHoverTooltip({ children, player, tryout, evaluation, assessment }) {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef(null);
  const containerRef = useRef(null);

  const handleMouseEnter = (e) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setPosition({
          x: rect.left + rect.width / 2,
          y: rect.top
        });
      }
      setShow(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShow(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!player) return children;

  const birthYear = player.date_of_birth ? new Date(player.date_of_birth).getFullYear() : null;

  return (
    <div 
      ref={containerRef}
      onMouseEnter={handleMouseEnter} 
      onMouseLeave={handleMouseLeave}
      className="relative"
    >
      {children}
      {show && (
        <div 
          className="fixed z-[9999] bg-white rounded-xl shadow-2xl border border-slate-200 p-3 w-72 pointer-events-none"
          style={{
            left: Math.min(position.x - 144, window.innerWidth - 300),
            top: Math.max(position.y - 320, 10),
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-2 pb-2 border-b">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {player.jersey_number || <User className="w-4 h-4" />}
            </div>
            <div>
              <div className="font-semibold text-sm">{player.full_name}</div>
              <div className="text-[10px] text-slate-500">{player.primary_position} {birthYear && `• ${birthYear}`}</div>
            </div>
          </div>

          {/* Tryout */}
          {tryout && (tryout.team_role || tryout.recommendation) && (
            <div className="mb-2 p-2 bg-purple-50 rounded-lg">
              <div className="text-[9px] font-semibold text-purple-800 mb-1">Tryout</div>
              <div className="flex flex-wrap gap-1">
                {tryout.team_role && <Badge className="text-[8px] bg-purple-200 text-purple-800">{tryout.team_role}</Badge>}
                {tryout.recommendation && <Badge className={`text-[8px] ${tryout.recommendation === 'Move up' ? 'bg-emerald-200 text-emerald-800' : tryout.recommendation === 'Move down' ? 'bg-orange-200 text-orange-800' : 'bg-blue-200 text-blue-800'}`}>{tryout.recommendation}</Badge>}
              </div>
            </div>
          )}

          {/* Assessment */}
          {assessment && (
            <div className="mb-2 p-2 bg-blue-50 rounded-lg">
              <div className="text-[9px] font-semibold text-blue-800 mb-1">Physical</div>
              <div className="grid grid-cols-5 gap-1 text-center">
                {[
                  { label: 'Spd', value: assessment.speed_score },
                  { label: 'Pwr', value: assessment.power_score },
                  { label: 'End', value: assessment.endurance_score },
                  { label: 'Agi', value: assessment.agility_score },
                  { label: 'OVR', value: assessment.overall_score }
                ].map(({ label, value }) => (
                  <div key={label} className="p-1 bg-white rounded">
                    <div className="text-[10px] font-bold text-blue-600">{value || '-'}</div>
                    <div className="text-[7px] text-slate-500">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evaluation */}
          {evaluation && (
            <div className="p-2 bg-emerald-50 rounded-lg">
              <div className="text-[9px] font-semibold text-emerald-800 mb-1">Evaluation</div>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { label: 'Mental', value: Math.round(((evaluation.growth_mindset || 0) + (evaluation.resilience || 0) + (evaluation.team_focus || 0)) / 3 * 10) / 10 },
                  { label: 'Def', value: Math.round(((evaluation.defending_organized || 0) + (evaluation.defending_final_third || 0) + (evaluation.defending_transition || 0)) / 3 * 10) / 10 },
                  { label: 'Att', value: Math.round(((evaluation.attacking_organized || 0) + (evaluation.attacking_final_third || 0) + (evaluation.attacking_in_transition || 0)) / 3 * 10) / 10 }
                ].map(({ label, value }) => (
                  <div key={label} className="text-center p-1 bg-white rounded">
                    <div className="text-[10px] font-bold text-emerald-600">{value || '-'}</div>
                    <div className="text-[7px] text-slate-500">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!tryout && !assessment && !evaluation && (
            <div className="text-center text-[10px] text-slate-400 py-2">No data available</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PlayerInfoTooltip({ open, onClose, player, tryout, evaluation, assessment }) {
  if (!player) return null;

  const birthYear = player.date_of_birth ? new Date(player.date_of_birth).getFullYear() : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
              {player.jersey_number || <User className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-lg">{player.full_name}</div>
              <div className="text-sm font-normal text-slate-500">{player.primary_position}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Basic Info */}
          <div className="flex flex-wrap gap-2">
            {birthYear && <Badge variant="outline">Born {birthYear}</Badge>}
            <Badge className={player.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>{player.status}</Badge>
          </div>

          {/* Tryout Info */}
          {tryout && (
            <div className="bg-purple-50 p-3 rounded-lg space-y-2">
              <h4 className="font-semibold text-sm text-purple-900">Tryout Info</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {tryout.team_role && (
                  <div>
                    <span className="text-slate-500">Role: </span>
                    <Badge className="text-[9px] bg-purple-200 text-purple-800">{tryout.team_role}</Badge>
                  </div>
                )}
                {tryout.recommendation && (
                  <div>
                    <span className="text-slate-500">Rec: </span>
                    <Badge className={`text-[9px] ${
                      tryout.recommendation === 'Move up' ? 'bg-emerald-200 text-emerald-800' :
                      tryout.recommendation === 'Move down' ? 'bg-orange-200 text-orange-800' :
                      'bg-blue-200 text-blue-800'
                    }`}>{tryout.recommendation}</Badge>
                  </div>
                )}
                {tryout.next_year_team && <div><span className="text-slate-500">Next Team: </span><span className="font-medium">{tryout.next_year_team}</span></div>}
                {tryout.registration_status && <div><span className="text-slate-500">Reg: </span><span className="font-medium">{tryout.registration_status}</span></div>}
              </div>
              {tryout.notes && <p className="text-xs text-slate-600 mt-1">{tryout.notes}</p>}
            </div>
          )}

          {/* Physical Assessment */}
          {assessment && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-semibold text-sm text-blue-900 mb-2">Physical Assessment</h4>
              <div className="grid grid-cols-4 gap-2 text-center mb-2">
                <div className="p-1.5 bg-white rounded">
                  <div className="text-[10px] text-slate-500">Sprint</div>
                  <div className="text-sm font-bold text-blue-600">{assessment.sprint?.toFixed(2)}s</div>
                </div>
                <div className="p-1.5 bg-white rounded">
                  <div className="text-[10px] text-slate-500">Vertical</div>
                  <div className="text-sm font-bold text-blue-600">{assessment.vertical}"</div>
                </div>
                <div className="p-1.5 bg-white rounded">
                  <div className="text-[10px] text-slate-500">YIRT</div>
                  <div className="text-sm font-bold text-blue-600">{assessment.yirt}</div>
                </div>
                <div className="p-1.5 bg-white rounded">
                  <div className="text-[10px] text-slate-500">Shuttle</div>
                  <div className="text-sm font-bold text-blue-600">{assessment.shuttle?.toFixed(2)}s</div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: 'Speed', score: assessment.speed_score, color: '#ef4444' },
                  { label: 'Power', score: assessment.power_score, color: '#3b82f6' },
                  { label: 'Endurance', score: assessment.endurance_score, color: '#10b981' },
                  { label: 'Agility', score: assessment.agility_score, color: '#ec4899' }
                ].map(({ label, score, color }) => (
                  <div key={label} className="p-1.5 bg-white rounded">
                    <div className="text-[10px] text-slate-500">{label}</div>
                    <div className="text-sm font-bold" style={{ color }}>{score || 0}</div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-2 p-2 bg-slate-800 rounded text-white">
                <span className="text-xs">Overall: </span>
                <span className="font-bold text-lg">{assessment.overall_score || 0}</span>
              </div>
            </div>
          )}

          {/* Evaluation */}
          {evaluation && (
            <div className="bg-emerald-50 p-3 rounded-lg">
              <h4 className="font-semibold text-sm text-emerald-900 mb-2">Evaluation</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <SliderBar label="Growth Mindset" value={evaluation.growth_mindset} color="#8b5cf6" />
                <SliderBar label="Resilience" value={evaluation.resilience} color="#ec4899" />
                <SliderBar label="Athleticism" value={evaluation.athleticism} color="#10b981" />
                <SliderBar label="Team Focus" value={evaluation.team_focus} color="#3b82f6" />
                <SliderBar label="Def. Organized" value={evaluation.defending_organized} color="#ef4444" />
                <SliderBar label="Att. Organized" value={evaluation.attacking_organized} color="#f59e0b" />
              </div>
              {(evaluation.player_strengths || evaluation.areas_of_growth) && (
                <div className="mt-2 space-y-1 text-xs">
                  {evaluation.player_strengths && (
                    <div className="p-1.5 bg-green-100 rounded">
                      <span className="font-medium text-green-800">Strengths: </span>
                      <span className="text-green-700">{evaluation.player_strengths}</span>
                    </div>
                  )}
                  {evaluation.areas_of_growth && (
                    <div className="p-1.5 bg-orange-100 rounded">
                      <span className="font-medium text-orange-800">Growth: </span>
                      <span className="text-orange-700">{evaluation.areas_of_growth}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}