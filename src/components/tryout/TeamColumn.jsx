import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import DraggablePlayerCard from './DraggablePlayerCard';

export default function TeamColumn({ team, players, onManualRank }) {
  const navigate = useNavigate();

  if (!team.id) return null;

  return (
    <Droppable droppableId={`team-${team.id}`}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`
            border-2 transition-all duration-300 shadow-lg hover:shadow-xl
            ${snapshot.isDraggingOver
              ? 'ring-4 ring-emerald-500 shadow-2xl scale-[1.01] bg-emerald-50 border-emerald-500'
              : 'border-slate-200 bg-white'
            }
          `}
        >
          <CardHeader className="pb-2 sm:pb-3 bg-gradient-to-r from-slate-50 to-white border-b-2 border-slate-200 p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-sm sm:text-lg shadow-md flex-shrink-0">
                {team.age_group || (team.name && typeof team.name === 'string' ? team.name.charAt(0) : '?')}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="font-bold text-slate-900 text-sm sm:text-lg cursor-pointer hover:text-emerald-600 transition-colors truncate"
                  onClick={() => navigate(`${createPageUrl('TeamDashboard')}?teamId=${team.id}`)}
                >
                  {team.name && typeof team.name === 'string' ? team.name : 'Unknown'}
                </div>
                <div className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                  <span>{team.age_group}</span>
                  <span>•</span>
                  <span>{players.length} players</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className={`p-2 sm:p-3 space-y-2 min-h-[100px] transition-colors duration-300 ${snapshot.isDraggingOver ? 'bg-emerald-100/50' : ''}`}>
            {players.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-8 italic font-semibold">Drop players here</p>
            ) : (
              players.map((player, index) => (
                <DraggablePlayerCard key={player.id} player={player} index={index} team={team} onManualRank={onManualRank} />
              ))
            )}
            {provided.placeholder}
          </CardContent>
        </Card>
      )}
    </Droppable>
  );
}