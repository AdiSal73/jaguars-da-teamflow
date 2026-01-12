import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User, Check, X, Clock, Trash2 } from 'lucide-react';
import { TeamRoleBadge } from '@/components/utils/teamRoleBadge';

export default function PlayerEvaluationCard({ player, team, tryout, evaluation, assessment, onSendOffer, onRemove, isDragging }) {
  const navigate = useNavigate();
  const birthYear = player.date_of_birth ? new Date(player.date_of_birth).getFullYear() : null;
  const isTrapped = player.date_of_birth ? (() => {
    const dob = new Date(player.date_of_birth);
    const month = dob.getMonth();
    const day = dob.getDate();
    return (month === 7 && day >= 1) || (month >= 8 && month <= 11);
  })() : false;

  const getOfferStatusColor = (status) => {
    switch(status) {
      case 'Accepted Offer': return 'bg-green-500 text-white';
      case 'Rejected Offer': return 'bg-red-500 text-white';
      case 'Considering Offer': return 'bg-yellow-500 text-white';
      case 'Offer Sent': return 'bg-blue-500 text-white';
      default: return 'bg-slate-400 text-white';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Card 
            className={`transition-all cursor-pointer border ${isTrapped ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-300' : 'bg-white'} ${isDragging ? 'shadow-2xl border-emerald-500 rotate-1 scale-105' : 'border-slate-200 hover:border-emerald-300 hover:shadow-md'}`}
          >
            <CardContent className="p-2">
              <div className="flex items-start gap-2 mb-2">
                <div onClick={() => navigate(`${createPageUrl('PlayerDashboard')}?id=${player.id}`)} className="flex items-start gap-2 flex-1 min-w-0 cursor-pointer">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                    {player.jersey_number || <User className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-slate-900 truncate">{player.full_name}</div>
                    <div className="text-[10px] text-slate-600 truncate">{player.primary_position}</div>
                  </div>
                </div>
                {onRemove && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(player);
                    }}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-0.5 mb-2">
                {player.age_group && <Badge className="bg-purple-100 text-purple-800 text-[9px] px-1 py-0">{player.age_group}</Badge>}
                {player.grad_year && <Badge className="bg-slate-600 text-white text-[8px] px-1 py-0">'{player.grad_year.toString().slice(-2)}</Badge>}
                {isTrapped && <Badge className="bg-red-500 text-white text-[9px] px-1 py-0">TRAP</Badge>}
                {tryout?.team_role && <TeamRoleBadge role={tryout.team_role} size="small" />}
                {player.is_tryout_player && <Badge className="bg-indigo-500 text-white text-[9px] px-1 py-0">EXT</Badge>}
              </div>

              {/* Offer Status & Action */}
              <div className="space-y-1">
                {tryout?.next_season_status && tryout.next_season_status !== 'N/A' ? (
                  <Badge className={`w-full justify-center py-1 text-[10px] ${getOfferStatusColor(tryout.next_season_status)}`}>
                    {tryout.next_season_status === 'Accepted Offer' && <Check className="w-2 h-2 mr-0.5" />}
                    {tryout.next_season_status === 'Rejected Offer' && <X className="w-2 h-2 mr-0.5" />}
                    {tryout.next_season_status === 'Considering Offer' && <Clock className="w-2 h-2 mr-0.5" />}
                    {tryout.next_season_status}
                  </Badge>
                ) : tryout?.next_year_team ? (
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onSendOffer(player);
                    }}
                    size="sm"
                    className="w-full h-6 text-[10px] bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                  >
                    Send Offer
                  </Button>
                ) : null}
                
                {tryout?.registration_status && tryout.registration_status !== 'Not Signed' && (
                  <Badge className={`w-full justify-center text-[9px] py-0.5 ${
                    tryout.registration_status === 'Signed and Paid' ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
                  }`}>
                    {tryout.registration_status}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
          <div className="space-y-2 p-2">
            <div className="font-bold text-sm border-b pb-1">{player.full_name}</div>
            
            {team?.name && <div className="text-xs text-slate-600">Current: {team.name}</div>}
            
            {(evaluation || assessment) && (
              <div className="space-y-2">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-1.5 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded">
                    <div className="text-[10px] text-emerald-700 font-semibold">Eval Score</div>
                    <div className="text-lg font-bold text-emerald-700">{evaluation?.overall_score?.toFixed(1) || '-'}</div>
                  </div>
                  <div className="text-center p-1.5 bg-gradient-to-br from-blue-50 to-blue-100 rounded">
                    <div className="text-[10px] text-blue-700 font-semibold">Physical</div>
                    <div className="text-lg font-bold text-blue-700">{assessment?.overall_score || '-'}</div>
                  </div>
                </div>

                {/* Physical Breakdown */}
                {assessment && (
                  <div className="grid grid-cols-4 gap-1 text-xs">
                    <div className="text-center bg-red-50 rounded p-1">
                      <div className="text-[9px] text-red-600">SPD</div>
                      <div className="font-bold text-red-700">{assessment.speed_score}</div>
                    </div>
                    <div className="text-center bg-blue-50 rounded p-1">
                      <div className="text-[9px] text-blue-600">PWR</div>
                      <div className="font-bold text-blue-700">{assessment.power_score}</div>
                    </div>
                    <div className="text-center bg-green-50 rounded p-1">
                      <div className="text-[9px] text-green-600">END</div>
                      <div className="font-bold text-green-700">{assessment.endurance_score}</div>
                    </div>
                    <div className="text-center bg-pink-50 rounded p-1">
                      <div className="text-[9px] text-pink-600">AGI</div>
                      <div className="font-bold text-pink-700">{assessment.agility_score}</div>
                    </div>
                  </div>
                )}

                {/* Evaluation Highlights */}
                {evaluation && (
                  <div className="p-1.5 bg-slate-50 rounded space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Mindset</span>
                      <span className="font-bold text-purple-600">{evaluation.growth_mindset}/10</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Athleticism</span>
                      <span className="font-bold text-emerald-600">{evaluation.athleticism}/10</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {tryout?.recommendation && (
              <div className="text-xs">
                <span className="text-slate-600">Recommendation: </span>
                <span className="font-bold">{tryout.recommendation}</span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}