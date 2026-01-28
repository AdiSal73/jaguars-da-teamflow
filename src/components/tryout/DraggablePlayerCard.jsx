import React, { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User, Mail, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getPositionBorderColor } from '@/components/player/positionColors';
import { isTrappedPlayer } from '@/components/utils/trappedPlayer';
import { TeamRoleBadge } from '@/components/utils/teamRoleBadge';
import SendOfferDialog from './SendOfferDialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function DraggablePlayerCard({ player, index, isDraggable = true, team }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showOfferDialog, setShowOfferDialog] = useState(false);

  const sendOfferMutation = useMutation({
    mutationFn: async (message) => {
      const tryoutData = player.tryout || {};
      if (tryoutData.id) {
        await base44.entities.PlayerTryout.update(tryoutData.id, {
          next_season_status: 'Offer Sent',
          offer_expiration_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
      } else {
        await base44.entities.PlayerTryout.create({
          player_id: player.id,
          player_name: player.full_name,
          next_season_status: 'Offer Sent',
          offer_expiration_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
      }

      if (player.parent_emails?.length > 0) {
        for (const email of player.parent_emails) {
          await base44.integrations.Core.SendEmail({
            to: email,
            subject: `Team Offer for ${player.full_name}`,
            body: message
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tryouts']);
      queryClient.invalidateQueries(['players']);
      setShowOfferDialog(false);
      toast.success('Offer sent successfully');
    },
    onError: () => {
      toast.error('Failed to send offer');
    }
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Offer Sent': return <Clock className="w-3 h-3" />;
      case 'Accepted Offer': return <CheckCircle2 className="w-3 h-3" />;
      case 'Rejected Offer': return <XCircle className="w-3 h-3" />;
      case 'Considering Offer': return <Clock className="w-3 h-3" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Offer Sent': return 'bg-blue-500';
      case 'Accepted Offer': return 'bg-green-500';
      case 'Rejected Offer': return 'bg-red-500';
      case 'Considering Offer': return 'bg-yellow-500';
      default: return 'bg-slate-500';
    }
  };

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
          {...provided.dragHandleProps}
          style={provided.draggableProps.style}
          className={`
            ${isTrappedPlayer(player.date_of_birth)
              ? 'border-red-400 bg-gradient-to-r from-red-50 to-red-100' 
              : `${getPositionBorderColor(player.primary_position)} bg-white hover:border-emerald-400`
            }
            w-full p-3 rounded-xl border-2 cursor-grab active:cursor-grabbing
            transition-all duration-150
            ${snapshot.isDragging ? 'shadow-2xl scale-105 ring-4 ring-emerald-500/50 opacity-90 z-[9999]' : 'hover:shadow-md'}
          `}
          onClick={(e) => {
            if (!snapshot.isDragging) {
              e.stopPropagation();
              navigate(`${createPageUrl('PlayerDashboard')}?id=${player.id}`);
            }
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                {player.jersey_number || <User className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 truncate">{player.full_name}</div>
                <div className="text-sm text-slate-600 space-y-1 mt-1">
                  <div className="flex gap-1 items-center flex-wrap">
                    {player.current_2526_team && (
                      <Badge className="bg-slate-100 text-slate-800 text-xs px-2 py-0.5">{player.current_2526_team}</Badge>
                    )}
                    <span className="font-medium">{player.primary_position}</span>
                    {player.date_of_birth && (
                      <Badge className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5">{new Date(player.date_of_birth).getFullYear()}</Badge>
                    )}
                    {player.grad_year && (
                      <Badge className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5">{player.grad_year}</Badge>
                    )}
                  </div>
                  {player.comment && (
                    <div className="text-xs text-slate-500 italic truncate">{player.comment}</div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1 items-end flex-shrink-0">
              {player.tryout?.age_group_ranking && (
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white text-lg px-3 py-1 rounded-lg font-black shadow-md">
                  #{player.tryout.age_group_ranking}
                </div>
              )}
              {player.tryout?.next_season_status && (
                <Badge className={`${getStatusColor(player.tryout.next_season_status)} text-white text-xs px-2 py-1 font-bold flex items-center gap-1`}>
                  {getStatusIcon(player.tryout.next_season_status)}
                  {player.tryout.next_season_status}
                </Badge>
              )}
              {isTrappedPlayer(player.date_of_birth) && (
                <Badge className="bg-red-500 text-white text-xs px-2 py-1 font-bold">TRAPPED</Badge>
              )}
              {player.tryout?.team_role && (
                <TeamRoleBadge role={player.tryout.team_role} size="default" />
              )}
              {!player.tryout?.next_season_status || player.tryout?.next_season_status === 'N/A' ? (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOfferDialog(true);
                  }}
                  className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white text-xs px-2 py-1 h-auto"
                >
                  <Mail className="w-3 h-3 mr-1" />
                  Send Offer
                </Button>
              ) : null}
            </div>
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