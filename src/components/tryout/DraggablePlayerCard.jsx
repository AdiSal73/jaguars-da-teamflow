import React, { useState, useRef } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User, Mail, CheckCircle2, Clock, XCircle, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getPositionBorderColor } from '@/components/player/positionColors';
import { isTrappedPlayer } from '@/components/utils/trappedPlayer';
import SendOfferDialog from './SendOfferDialog';
import RankingBadge from './RankingBadge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const TEAM_ROLES = [
  'Indispensable Player',
  'GA Starter',
  'GA Rotation',
  'Aspire Starter',
  'Aspire Rotation',
  'United Starter',
  'United Rotation'
];

const ROLE_COLORS = {
  'Indispensable Player': 'bg-yellow-500',
  'GA Starter': 'bg-emerald-600',
  'GA Rotation': 'bg-emerald-400',
  'Aspire Starter': 'bg-blue-600',
  'Aspire Rotation': 'bg-blue-400',
  'United Starter': 'bg-purple-600',
  'United Rotation': 'bg-purple-400',
};

const OFFER_STATUSES = ['Not Offered Yet', 'Considering Offer', 'Accepted Offer', 'Signed'];

export default function DraggablePlayerCard({ player, index, isDraggable = true, team, onManualRank }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [rankUpdating, setRankUpdating] = useState(false);
  const longPressTimer = useRef(null);

  const updateRoleMutation = useMutation({
    mutationFn: async (newRole) => {
      const tryoutData = player.tryout || {};
      if (tryoutData.id) {
        await base44.entities.PlayerTryout.update(tryoutData.id, { team_role: newRole });
      } else {
        await base44.entities.PlayerTryout.create({
          player_id: player.id,
          player_name: player.full_name,
          team_role: newRole
        });
      }
    },
    onSuccess: () => { queryClient.invalidateQueries(['tryouts']); toast.success('Role updated'); },
    onError: () => toast.error('Failed to update role')
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus) => {
      const tryoutData = player.tryout || {};
      if (tryoutData.id) {
        await base44.entities.PlayerTryout.update(tryoutData.id, { next_season_status: newStatus });
      } else {
        await base44.entities.PlayerTryout.create({ player_id: player.id, player_name: player.full_name, next_season_status: newStatus });
      }
    },
    onSuccess: () => { queryClient.invalidateQueries(['tryouts']); toast.success('Status updated'); },
    onError: () => toast.error('Failed to update status')
  });

  const sendOfferMutation = useMutation({
    mutationFn: async (message) => {
      const tryoutData = player.tryout || {};
      const offerData = {
        next_season_status: 'Considering Offer',
        offer_expiration_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
      if (tryoutData.id) {
        await base44.entities.PlayerTryout.update(tryoutData.id, offerData);
      } else {
        await base44.entities.PlayerTryout.create({ player_id: player.id, player_name: player.full_name, ...offerData });
      }
      if (player.parent_emails?.length > 0) {
        for (const email of player.parent_emails) {
          await base44.integrations.Core.SendEmail({ to: email, subject: `Team Offer for ${player.full_name}`, body: message });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tryouts']);
      queryClient.invalidateQueries(['players']);
      setShowOfferDialog(false);
      toast.success('Offer sent successfully');
    },
    onError: () => toast.error('Failed to send offer')
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Considering Offer': return 'bg-yellow-500';
      case 'Accepted Offer': return 'bg-green-500';
      case 'Signed': return 'bg-emerald-700';
      default: return 'bg-slate-400'; // Not Offered Yet or null
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Accepted Offer': return <CheckCircle2 className="w-3 h-3" />;
      case 'Signed': return <CheckCircle2 className="w-3 h-3" />;
      case 'Considering Offer': return <Clock className="w-3 h-3" />;
      default: return null;
    }
  };

  const handleNavigateToPlayer = (e) => {
    if (e.defaultPrevented) return;
    const backUrl = encodeURIComponent(window.location.pathname + window.location.search);
    navigate(`${createPageUrl('PlayerDashboard')}?id=${player.id}&back=${backUrl}`);
  };

  const ranking = player.age_group_ranking || player.tryout?.age_group_ranking;

  return (
    <>
      <Draggable
        draggableId={`player-${player.id}`}
        index={index}
        isDragDisabled={!isDraggable}
      >
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            style={{
              ...provided.draggableProps.style,
              zIndex: snapshot.isDragging ? 9999 : 'auto',
            }}
            className={`
              ${isTrappedPlayer(player.date_of_birth)
                ? 'border-red-400 bg-gradient-to-r from-red-50 to-red-100'
                : `${getPositionBorderColor(player.primary_position)} bg-white`
              }
              w-full p-2 sm:p-3 rounded-xl border-2 select-none
              transition-shadow duration-150
              ${snapshot.isDragging
                ? 'shadow-2xl ring-2 ring-emerald-500 opacity-95 rotate-[0.5deg]'
                : 'hover:shadow-md hover:border-emerald-300'
              }
            `}
            onClick={(e) => {
              if (snapshot.isDragging) return;
              e.stopPropagation();
              handleNavigateToPlayer(e);
            }}
          >
            <div className="flex items-start gap-1.5 sm:gap-2">
              {/* Drag handle — large touch target on mobile */}
              <div
                {...provided.dragHandleProps}
                className="flex-shrink-0 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing p-1.5 -ml-0.5 rounded touch-none mt-1"
                onClick={e => e.stopPropagation()}
                style={{ touchAction: 'none' }}
              >
                <GripVertical className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>

              {/* Avatar / jersey */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center text-white font-bold shadow-md flex-shrink-0 text-sm sm:text-base mt-0.5">
                {player.jersey_number || <User className="w-3 h-3 sm:w-4 sm:h-4" />}
              </div>

              {/* Main info */}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 text-sm sm:text-base truncate leading-tight">{player.full_name}</div>
                <div className="flex gap-1 items-center flex-wrap mt-0.5">
                  {player.primary_position && (
                    <span className="text-xs text-slate-600 font-medium">{player.primary_position}</span>
                  )}
                  {player.date_of_birth && (
                    <Badge className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0">{new Date(player.date_of_birth).getFullYear()}</Badge>
                  )}
                  {player.grad_year && (
                    <Badge className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0">{player.grad_year}</Badge>
                  )}
                  {isTrappedPlayer(player.date_of_birth) && (
                    <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0">TRAPPED</Badge>
                  )}
                </div>
                {player.comment && (
                  <div className="text-[10px] sm:text-xs text-slate-500 italic truncate mt-0.5">{player.comment}</div>
                )}

                {/* Controls row */}
                 <div className="flex flex-wrap gap-1 mt-1.5 items-center" onClick={e => e.stopPropagation()}>
                   <Select
                     value={player.tryout?.team_role || ''}
                     onValueChange={(val) => updateRoleMutation.mutate(val)}
                   >
                     <SelectTrigger className={`h-6 text-[10px] sm:text-xs px-2 border-0 font-semibold text-white ${ROLE_COLORS[player.tryout?.team_role] || 'bg-slate-400'} min-w-[90px] sm:min-w-[120px]`}>
                       <SelectValue placeholder="Set Role" />
                     </SelectTrigger>
                     <SelectContent>
                       {TEAM_ROLES.map(role => (
                         <SelectItem key={role} value={role} className="text-xs">{role}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>

                   {/* Offer button */}
                   <Button
                     size="sm"
                     onClick={(e) => { e.stopPropagation(); setShowOfferDialog(true); }}
                     className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white text-[10px] sm:text-xs px-2 py-0.5 h-6"
                   >
                     <Mail className="w-3 h-3 mr-0.5" />
                     Offer
                   </Button>

                   {/* Offer status badge — always shown, long press to change */}
                   <div className="relative">
                     <Badge
                       className={`${getStatusColor(player.tryout?.next_season_status)} text-white text-[10px] px-1.5 py-0 flex items-center gap-0.5 cursor-pointer select-none`}
                       onMouseDown={(e) => { e.stopPropagation(); longPressTimer.current = setTimeout(() => setShowStatusPicker(true), 600); }}
                       onMouseUp={() => clearTimeout(longPressTimer.current)}
                       onMouseLeave={() => clearTimeout(longPressTimer.current)}
                       onTouchStart={(e) => { e.stopPropagation(); longPressTimer.current = setTimeout(() => setShowStatusPicker(true), 600); }}
                       onTouchEnd={() => clearTimeout(longPressTimer.current)}
                     >
                       {getStatusIcon(player.tryout?.next_season_status)}
                       {player.tryout?.next_season_status || 'Not Offered Yet'}
                     </Badge>
                     {showStatusPicker && (
                       <div
                         className="absolute z-50 left-0 top-7 bg-white border border-slate-200 rounded-lg shadow-xl p-1 min-w-[150px]"
                         onClick={e => e.stopPropagation()}
                       >
                         <div className="text-[10px] font-semibold text-slate-500 px-2 py-1">Change Status</div>
                         {OFFER_STATUSES.map(s => (
                           <button
                             key={s}
                             className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-slate-100 text-slate-700"
                             onClick={() => { updateStatusMutation.mutate(s); setShowStatusPicker(false); }}
                           >
                             {s}
                           </button>
                         ))}
                         <button
                           className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-red-50 text-red-500 mt-1 border-t"
                           onClick={() => setShowStatusPicker(false)}
                         >
                           Cancel
                         </button>
                       </div>
                     )}
                   </div>
                 </div>
              </div>

              {/* Ranking badge — long press to manually set */}
              {ranking && onManualRank && (
                <div onClick={e => e.stopPropagation()}>
                  <RankingBadge
                    ranking={ranking}
                    isUpdating={rankUpdating}
                    onManualRank={async (newRank) => {
                      setRankUpdating(true);
                      await onManualRank(player, newRank);
                      setRankUpdating(false);
                    }}
                  />
                </div>
              )}
              {ranking && !onManualRank && (
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white text-sm sm:text-lg px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg font-black shadow-md flex-shrink-0">
                  #{ranking}
                </div>
              )}
            </div>
          </div>
        )}
      </Draggable>
      <SendOfferDialog
        open={showOfferDialog}
        onClose={() => setShowOfferDialog(false)}
        player={player}
        team={team}
        onSendOffer={(message) => sendOfferMutation.mutate(message)}
        isPending={sendOfferMutation.isPending}
      />
    </>
  );
}