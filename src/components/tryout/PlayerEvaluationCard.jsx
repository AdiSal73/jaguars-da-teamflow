import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User, TrendingUp, Activity, Check, X, Clock } from 'lucide-react';
import { TeamRoleBadge } from '@/components/utils/teamRoleBadge';

export default function PlayerEvaluationCard({ player, team, tryout, evaluation, assessment, onSendOffer, isDragging }) {
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
    <Card 
      className={`transition-all cursor-pointer border-2 ${isTrapped ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-400' : 'bg-white'} ${isDragging ? 'shadow-2xl border-emerald-500 rotate-2 scale-105' : 'border-slate-200 hover:border-emerald-300 hover:shadow-lg'}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3" onClick={() => navigate(`${createPageUrl('PlayerDashboard')}?id=${player.id}`)}>
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-md">
            {player.jersey_number || <User className="w-6 h-6" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-base text-slate-900 mb-1">{player.full_name}</div>
            <div className="text-sm text-slate-600 font-medium">{player.primary_position}</div>
            {team?.name && <div className="text-xs text-slate-500">Current: {team.name}</div>}
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1 mb-3">
          {player.age_group && <Badge className="bg-purple-100 text-purple-800 text-xs px-2 py-1 font-bold">{player.age_group}</Badge>}
          {player.grad_year && <Badge className="bg-slate-600 text-white text-[10px] px-1.5 py-0.5 font-bold">'{player.grad_year.toString().slice(-2)}</Badge>}
          {birthYear && <Badge className="bg-slate-400 text-white text-[10px] px-1.5 py-0.5 font-bold">{birthYear}</Badge>}
          {isTrapped && <Badge className="bg-red-500 text-white text-xs px-2 py-1 font-bold">TRAPPED</Badge>}
          {tryout?.team_role && <TeamRoleBadge role={tryout.team_role} size="default" />}
          {tryout?.recommendation && (
            <Badge className={`text-xs px-2 py-1 font-bold ${
              tryout.recommendation === 'Move up' ? 'bg-emerald-500 text-white' :
              tryout.recommendation === 'Move down' ? 'bg-orange-500 text-white' :
              'bg-blue-500 text-white'
            }`}>
              {tryout.recommendation}
            </Badge>
          )}
          {player.is_tryout_player && <Badge className="bg-indigo-500 text-white text-xs px-2 py-1 font-bold">EXTERNAL</Badge>}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3 p-2 bg-slate-50 rounded-lg">
          <div className="text-center">
            <div className="text-xs text-slate-500">Eval</div>
            <div className="text-lg font-bold text-emerald-600">{evaluation?.overall_score?.toFixed(1) || 'N/A'}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500">Physical</div>
            <div className="text-lg font-bold text-blue-600">{assessment?.overall_score || 'N/A'}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500">Age Rank</div>
            <div className="text-lg font-bold text-purple-600">{tryout?.age_group_ranking || '-'}</div>
          </div>
        </div>

        {/* Offer Status & Action */}
        <div className="space-y-2">
          {tryout?.next_season_status && tryout.next_season_status !== 'N/A' ? (
            <Badge className={`w-full justify-center py-2 ${getOfferStatusColor(tryout.next_season_status)}`}>
              {tryout.next_season_status === 'Accepted Offer' && <Check className="w-3 h-3 mr-1" />}
              {tryout.next_season_status === 'Rejected Offer' && <X className="w-3 h-3 mr-1" />}
              {tryout.next_season_status === 'Considering Offer' && <Clock className="w-3 h-3 mr-1" />}
              {tryout.next_season_status}
            </Badge>
          ) : tryout?.next_year_team ? (
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                onSendOffer(player);
              }}
              size="sm"
              className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
            >
              Send Offer
            </Button>
          ) : (
            <Badge className="w-full justify-center py-2 bg-slate-200 text-slate-600">Not Assigned</Badge>
          )}
          
          {tryout?.registration_status && tryout.registration_status !== 'Not Signed' && (
            <Badge className={`w-full justify-center text-xs ${
              tryout.registration_status === 'Signed and Paid' ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
            }`}>
              {tryout.registration_status}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}