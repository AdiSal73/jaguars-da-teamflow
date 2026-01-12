import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TryoutPoolManager from '@/components/tryout/TryoutPoolManager';

// Calculate next year's age group based on date of birth
const calculateNextYearAgeGroup = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  
  const dob = new Date(dateOfBirth);
  const cutoffDate = new Date('2027-08-01');
  
  let age = cutoffDate.getFullYear() - dob.getFullYear();
  const monthDiff = cutoffDate.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && cutoffDate.getDate() < dob.getDate())) {
    age--;
  }
  
  return `U${age}`;
};

export default function TryoutPoolsByAge() {
  const { data: poolPlayers = [] } = useQuery({
    queryKey: ['tryoutPool'],
    queryFn: () => base44.entities.TryoutPool.list()
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  // Calculate next year age groups
  const poolPlayersWithAge = useMemo(() => {
    return poolPlayers.map(p => {
      const playerData = p.player_id ? players.find(pl => pl.id === p.player_id) : null;
      return {
        ...p,
        next_year_age_group: calculateNextYearAgeGroup(p.date_of_birth),
        grad_year: playerData?.grad_year || p.grad_year
      };
    });
  }, [poolPlayers, players]);

  // Group by age groups
  const ageGroups = useMemo(() => {
    const groups = {};
    poolPlayersWithAge.forEach(p => {
      const age = p.next_year_age_group || 'Unknown';
      if (!groups[age]) {
        groups[age] = [];
      }
      groups[age].push(p);
    });
    return groups;
  }, [poolPlayersWithAge]);

  // Sort age groups
  const sortedAgeGroups = useMemo(() => {
    return Object.keys(ageGroups).sort((a, b) => {
      if (a === 'Unknown') return 1;
      if (b === 'Unknown') return -1;
      const extractAge = (ag) => parseInt(ag?.match(/\d+/)?.[0] || 0);
      return extractAge(b) - extractAge(a);
    });
  }, [ageGroups]);

  return (
    <div className="p-4 md:p-6 max-w-[1800px] mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
          Tryout Pools by Age Group
        </h1>
        <p className="text-slate-600 mt-2">Manage tryout pools organized by 2026/2027 age groups</p>
      </div>

      <Tabs defaultValue={sortedAgeGroups[0]} className="w-full">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${sortedAgeGroups.length}, minmax(0, 1fr))` }}>
          {sortedAgeGroups.map(age => (
            <TabsTrigger key={age} value={age} className="relative">
              {age}
              <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-blue-500 text-white">
                {ageGroups[age].length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {sortedAgeGroups.map(age => (
          <TabsContent key={age} value={age} className="mt-6">
            <Card className="border-2 border-blue-400 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
                <CardTitle className="flex items-center justify-between">
                  <span>{age} Pool (2026/2027 Season)</span>
                  <span className="text-sm font-normal">{ageGroups[age].length} players</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <TryoutPoolManager />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}