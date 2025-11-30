import React from 'react';
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