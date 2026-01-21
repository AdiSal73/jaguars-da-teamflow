import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import DraggablePlayerCard from './DraggablePlayerCard';

export default function TeamColumn({ team, players }) {
  if (!team.id) return null;

  return (
    <Droppable droppableId={`team-${team.id}`}>
      {(provided, snapshot) => (
        <Card 
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`
            border-2 border-slate-200 transition-all duration-200 shadow-lg hover:shadow-xl
            ${snapshot.isDraggingOver ? 'ring-4 ring-emerald-400 shadow-2xl scale-[1.02] bg-emerald-50' : ''}
          `}
        >
          <CardHeader className="pb-3 bg-gradient-to-r from-slate-50 to-white border-b-2 border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {team.age_group || (team.name && typeof team.name === 'string' ? team.name.charAt(0) : '?')}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-lg">
                    {team.name && typeof team.name === 'string' ? team.name : 'Unknown'}
                  </div>
                  <div className="text-xs text-slate-600 font-medium flex items-center gap-2">
                    <span>{team.age_group}</span>
                    <span>•</span>
                    <span>{players.length} players</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 space-y-2 min-h-[100px]">
            {players.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-8 italic">Drop players here</p>
            ) : (
              players.map((player, index) => (
                <DraggablePlayerCard key={player.id} player={player} index={index} />
              ))
            )}
            {provided.placeholder}
          </CardContent>
        </Card>
      )}
    </Droppable>
  );
}