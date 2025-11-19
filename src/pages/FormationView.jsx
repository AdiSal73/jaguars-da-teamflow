import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';

const formations = {
  '4-3-3': {
    name: '4-3-3',
    positions: [
      { id: 1, x: 50, y: 95, label: 'GK' },
      { id: 2, x: 80, y: 75, label: 'RB' },
      { id: 5, x: 62, y: 75, label: 'CB' },
      { id: 4, x: 38, y: 75, label: 'CB' },
      { id: 3, x: 20, y: 75, label: 'LB' },
      { id: 8, x: 62, y: 50, label: 'CM' },
      { id: 6, x: 50, y: 50, label: 'CDM' },
      { id: 10, x: 38, y: 50, label: 'CM' },
      { id: 7, x: 75, y: 20, label: 'RW' },
      { id: 9, x: 50, y: 15, label: 'ST' },
      { id: 11, x: 25, y: 20, label: 'LW' }
    ]
  },
  '4-2-3-1': {
    name: '4-2-3-1',
    positions: [
      { id: 1, x: 50, y: 95, label: 'GK' },
      { id: 2, x: 80, y: 75, label: 'RB' },
      { id: 5, x: 62, y: 75, label: 'CB' },
      { id: 4, x: 38, y: 75, label: 'CB' },
      { id: 3, x: 20, y: 75, label: 'LB' },
      { id: 6, x: 60, y: 55, label: 'CDM' },
      { id: 8, x: 40, y: 55, label: 'CDM' },
      { id: 7, x: 75, y: 35, label: 'RM' },
      { id: 10, x: 50, y: 35, label: 'CAM' },
      { id: 11, x: 25, y: 35, label: 'LM' },
      { id: 9, x: 50, y: 15, label: 'ST' }
    ]
  },
  '4-4-2': {
    name: '4-4-2',
    positions: [
      { id: 1, x: 50, y: 95, label: 'GK' },
      { id: 2, x: 80, y: 75, label: 'RB' },
      { id: 5, x: 62, y: 75, label: 'CB' },
      { id: 4, x: 38, y: 75, label: 'CB' },
      { id: 3, x: 20, y: 75, label: 'LB' },
      { id: 7, x: 80, y: 45, label: 'RM' },
      { id: 8, x: 60, y: 45, label: 'CM' },
      { id: 6, x: 40, y: 45, label: 'CM' },
      { id: 11, x: 20, y: 45, label: 'LM' },
      { id: 9, x: 60, y: 15, label: 'ST' },
      { id: 10, x: 40, y: 15, label: 'ST' }
    ]
  },
  '3-4-2-1': {
    name: '3-4-2-1',
    positions: [
      { id: 1, x: 50, y: 95, label: 'GK' },
      { id: 5, x: 65, y: 75, label: 'CB' },
      { id: 4, x: 50, y: 75, label: 'CB' },
      { id: 3, x: 35, y: 75, label: 'CB' },
      { id: 2, x: 80, y: 50, label: 'RM' },
      { id: 8, x: 60, y: 50, label: 'CM' },
      { id: 6, x: 40, y: 50, label: 'CM' },
      { id: 11, x: 20, y: 50, label: 'LM' },
      { id: 10, x: 60, y: 28, label: 'CAM' },
      { id: 7, x: 40, y: 28, label: 'CAM' },
      { id: 9, x: 50, y: 15, label: 'ST' }
    ]
  },
  '3-5-2': {
    name: '3-5-2',
    positions: [
      { id: 1, x: 50, y: 95, label: 'GK' },
      { id: 5, x: 65, y: 75, label: 'CB' },
      { id: 4, x: 50, y: 75, label: 'CB' },
      { id: 3, x: 35, y: 75, label: 'CB' },
      { id: 2, x: 80, y: 50, label: 'RWB' },
      { id: 8, x: 62, y: 50, label: 'CM' },
      { id: 6, x: 50, y: 50, label: 'CDM' },
      { id: 10, x: 38, y: 50, label: 'CM' },
      { id: 11, x: 20, y: 50, label: 'LWB' },
      { id: 9, x: 60, y: 15, label: 'ST' },
      { id: 7, x: 40, y: 15, label: 'ST' }
    ]
  },
  '3-4-1-2': {
    name: '3-4-1-2',
    positions: [
      { id: 1, x: 50, y: 95, label: 'GK' },
      { id: 5, x: 65, y: 75, label: 'CB' },
      { id: 4, x: 50, y: 75, label: 'CB' },
      { id: 3, x: 35, y: 75, label: 'CB' },
      { id: 2, x: 80, y: 50, label: 'RM' },
      { id: 8, x: 60, y: 50, label: 'CM' },
      { id: 6, x: 40, y: 50, label: 'CM' },
      { id: 11, x: 20, y: 50, label: 'LM' },
      { id: 10, x: 50, y: 32, label: 'CAM' },
      { id: 9, x: 60, y: 15, label: 'ST' },
      { id: 7, x: 40, y: 15, label: 'ST' }
    ]
  }
};

export default function FormationView() {
  const urlParams = new URLSearchParams(window.location.search);
  const teamId = urlParams.get('teamId');
  
  const [selectedFormation, setSelectedFormation] = useState('4-3-3');

  const { data: team } = useQuery({
    queryKey: ['team', teamId],
    queryFn: async () => {
      const teams = await base44.entities.Team.list();
      return teams.find(t => t.id === teamId);
    },
    enabled: !!teamId
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players', teamId],
    queryFn: async () => {
      const allPlayers = await base44.entities.Player.list();
      return allPlayers.filter(p => p.team_id === teamId);
    },
    enabled: !!teamId
  });

  const { data: tryouts = [] } = useQuery({
    queryKey: ['tryouts'],
    queryFn: () => base44.entities.PlayerTryout.list()
  });

  const getPlayersForPosition = (positionId) => {
    return players.filter(player => {
      const tryout = tryouts.find(t => t.player_id === player.id);
      return tryout?.primary_position === positionId;
    });
  };

  const formation = formations[selectedFormation];

  if (!team) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{team.name} - Formation View</h1>
          <p className="text-slate-600">View all players organized by their positions</p>
        </div>

        <div className="mb-6">
          <Label className="mb-2 block text-lg font-semibold">Select Formation</Label>
          <Select value={selectedFormation} onValueChange={setSelectedFormation}>
            <SelectTrigger className="w-64 h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(formations).map(key => (
                <SelectItem key={key} value={key}>{formations[key].name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card className="border-none shadow-2xl overflow-hidden">
          <CardContent className="p-0">
            <div 
              className="relative w-full"
              style={{ 
                paddingBottom: '140%',
                background: 'linear-gradient(180deg, #166534 0%, #15803d 50%, #166534 100%)'
              }}
            >
              <div className="absolute inset-0">
                {/* Field markings overlay */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 140" preserveAspectRatio="none">
                  {/* Outer boundary */}
                  <rect x="2" y="2" width="96" height="136" fill="none" stroke="white" strokeWidth="0.3" opacity="0.6" />
                  
                  {/* Center line */}
                  <line x1="2" y1="70" x2="98" y2="70" stroke="white" strokeWidth="0.3" opacity="0.6" />
                  
                  {/* Center circle */}
                  <circle cx="50" cy="70" r="8" fill="none" stroke="white" strokeWidth="0.3" opacity="0.6" />
                  <circle cx="50" cy="70" r="0.5" fill="white" opacity="0.6" />
                  
                  {/* Penalty areas */}
                  <rect x="20" y="2" width="60" height="15" fill="none" stroke="white" strokeWidth="0.3" opacity="0.6" />
                  <rect x="20" y="123" width="60" height="15" fill="none" stroke="white" strokeWidth="0.3" opacity="0.6" />
                  
                  {/* Goal areas */}
                  <rect x="35" y="2" width="30" height="6" fill="none" stroke="white" strokeWidth="0.3" opacity="0.6" />
                  <rect x="35" y="132" width="30" height="6" fill="none" stroke="white" strokeWidth="0.3" opacity="0.6" />
                  
                  {/* Goals */}
                  <rect x="42" y="0" width="16" height="2" fill="none" stroke="white" strokeWidth="0.3" opacity="0.6" />
                  <rect x="42" y="138" width="16" height="2" fill="none" stroke="white" strokeWidth="0.3" opacity="0.6" />
                </svg>

                {/* Player positions */}
                {formation.positions.map(position => {
                  const positionPlayers = getPlayersForPosition(position.id);
                  
                  return (
                    <div
                      key={position.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: `${position.x}%`,
                        top: `${position.y}%`,
                        width: '100px',
                        maxHeight: '140px'
                      }}
                    >
                      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border-2 border-white p-2 overflow-y-auto max-h-[140px]">
                        <div className="text-center text-[10px] font-bold text-emerald-700 mb-1 sticky top-0 bg-white/95 pb-1 border-b border-slate-200">
                          {position.label}
                        </div>
                        <div className="space-y-1">
                          {positionPlayers.length > 0 ? (
                            positionPlayers.map(player => (
                              <div key={player.id} className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-1.5 border border-emerald-200">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0">
                                    {player.jersey_number || position.id}
                                  </div>
                                  <div className="text-[9px] font-semibold text-slate-900 leading-tight flex-1 min-w-0">
                                    <div className="truncate">{player.full_name?.split(' ').pop()}</div>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-2">
                              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-1">
                                <span className="text-slate-400 font-bold text-xs">{position.id}</span>
                              </div>
                              <div className="text-[8px] text-slate-400">No players</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Players without assigned positions */}
        {players.filter(player => {
          const tryout = tryouts.find(t => t.player_id === player.id);
          return !tryout?.primary_position || tryout.primary_position < 1 || tryout.primary_position > 11;
        }).length > 0 && (
          <Card className="mt-6 border-none shadow-lg">
            <CardHeader>
              <CardTitle>Players Without Position Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {players
                  .filter(player => {
                    const tryout = tryouts.find(t => t.player_id === player.id);
                    return !tryout?.primary_position || tryout.primary_position < 1 || tryout.primary_position > 11;
                  })
                  .map(player => (
                    <div key={player.id} className="bg-slate-50 rounded-xl p-3 border-2 border-slate-200">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md mb-2">
                          {player.jersey_number || <User className="w-6 h-6" />}
                        </div>
                        <div className="text-xs font-semibold text-slate-900 text-center">
                          {player.full_name}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
  );
}