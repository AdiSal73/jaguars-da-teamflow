import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getPositionBorderColor } from '@/components/player/positionColors';
import { isTrappedPlayer } from '@/components/utils/trappedPlayer';
import { TeamRoleBadge } from '@/components/utils/teamRoleBadge';

export default function DraggablePlayerCard({ player, index, isDraggable = true }) {
  const navigate = useNavigate();

  return (
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
          style={{
            ...provided.draggableProps.style,
            transform: snapshot.isDragging 
              ? provided.draggableProps.style?.transform 
              : 'translate(0px, 0px)',
          }}
          className={`
            ${isTrappedPlayer(player.date_of_birth)
              ? 'border-red-400 bg-gradient-to-r from-red-50 to-red-100' 
              : `${getPositionBorderColor(player.primary_position)} bg-white hover:border-emerald-400`
            }
            w-full p-3 rounded-xl border-2 cursor-grab active:cursor-grabbing
            transition-all duration-200
            ${snapshot.isDragging ? 'shadow-2xl scale-105 ring-4 ring-emerald-400 opacity-90' : 'hover:shadow-md'}
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
                <div className="text-sm text-slate-600 flex gap-1 items-center flex-wrap mt-1">
                  <span className="font-medium">{player.primary_position}</span>
                  {player.age_group && (
                    <Badge className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5">{player.age_group}</Badge>
                  )}
                  {player.grad_year && (
                    <Badge className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5">{player.grad_year}</Badge>
                  )}
                  {player.tryout?.age_group_ranking && (
                    <Badge className="bg-amber-500 text-white text-xs px-2 py-0.5 font-bold">
                      #{player.tryout.age_group_ranking}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1 items-end flex-shrink-0">
              {isTrappedPlayer(player.date_of_birth) && (
                <Badge className="bg-red-500 text-white text-xs px-2 py-1 font-bold">TRAPPED</Badge>
              )}
              {player.tryout?.team_role && (
                <TeamRoleBadge role={player.tryout.team_role} size="default" />
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}