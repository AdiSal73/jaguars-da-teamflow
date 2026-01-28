import React, { useState, useMemo } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Search, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import DraggablePlayerCard from './DraggablePlayerCard';

export default function PlayerSearchPanel({ players, teams, getPlayerTryoutData }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [searchPosition, setSearchPosition] = useState('all');
  const [searchTeam, setSearchTeam] = useState('all');
  const [searchAgeGroup, setSearchAgeGroup] = useState('all');
  const [searchBirthYear, setSearchBirthYear] = useState('all');
  const [search2526Team, setSearch2526Team] = useState('all');

  const searchedPlayers = useMemo(() => {
    let filtered = players.filter(p => p.id);
    
    if (searchName) {
      filtered = filtered.filter(p => 
        p.full_name?.toLowerCase().includes(searchName.toLowerCase())
      );
    }
    
    if (searchPosition !== 'all') {
      filtered = filtered.filter(p => p.primary_position === searchPosition);
    }
    
    if (searchTeam !== 'all') {
      filtered = filtered.filter(p => p.team_id === searchTeam);
    }

    if (searchAgeGroup !== 'all') {
      filtered = filtered.filter(p => p.age_group === searchAgeGroup);
    }

    if (searchBirthYear !== 'all') {
      filtered = filtered.filter(p => {
        const birthYear = p.date_of_birth ? new Date(p.date_of_birth).getFullYear() : null;
        return birthYear === parseInt(searchBirthYear);
      });
    }

    if (search2526Team !== 'all') {
      filtered = filtered.filter(p => p.current_2526_team === search2526Team);
    }
    
    return filtered.map(p => getPlayerTryoutData(p)).sort((a, b) => {
      const lastNameA = a.full_name?.split(' ').pop() || '';
      const lastNameB = b.full_name?.split(' ').pop() || '';
      return lastNameA.localeCompare(lastNameB);
    });
  }, [players, searchName, searchPosition, searchTeam, searchAgeGroup, searchBirthYear, search2526Team, getPlayerTryoutData]);

  const availableAgeGroups = useMemo(() => {
    return [...new Set(players.map(p => p.age_group).filter(Boolean))].sort((a, b) => {
      const extractAge = (ag) => {
        const match = ag?.match(/U-?(\d+)/i);
        return match ? parseInt(match[1]) : 0;
      };
      return extractAge(b) - extractAge(a);
    });
  }, [players]);

  const availableBirthYears = useMemo(() => {
    const years = players
      .map(p => p.date_of_birth ? new Date(p.date_of_birth).getFullYear() : null)
      .filter(Boolean);
    return [...new Set(years)].sort((a, b) => b - a);
  }, [players]);

  const available2526Teams = useMemo(() => {
    return [...new Set(players.map(p => p.current_2526_team).filter(Boolean))].sort();
  }, [players]);

  return (
    <Collapsible open={searchOpen} onOpenChange={setSearchOpen}>
      <Card className="border-none shadow-lg bg-gradient-to-br from-white to-blue-50">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-blue-50/50 transition-colors p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-600" />
                <CardTitle className="text-base font-semibold">Player Search</CardTitle>
                {searchedPlayers.length > 0 && (
                  <Badge className="bg-blue-600 text-white text-xs">{searchedPlayers.length}</Badge>
                )}
              </div>
              {searchOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="p-3 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-2">
              <Input
                placeholder="Search by name..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="border-2 h-9 text-sm"
              />
              <Select value={searchPosition} onValueChange={setSearchPosition}>
                <SelectTrigger className="border-2 h-9 text-sm">
                  <SelectValue placeholder="All Positions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Positions</SelectItem>
                  {[...new Set(players.map(p => p.primary_position).filter(Boolean))].sort().map(pos => (
                    <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={searchTeam} onValueChange={setSearchTeam}>
                <SelectTrigger className="border-2 h-9 text-sm">
                  <SelectValue placeholder="Current Team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Current Teams</SelectItem>
                  {teams.filter(t => t.name).map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={searchAgeGroup} onValueChange={setSearchAgeGroup}>
                <SelectTrigger className="border-2 h-9 text-sm">
                  <SelectValue placeholder="Age Group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Age Groups</SelectItem>
                  {availableAgeGroups.map(ag => (
                    <SelectItem key={ag} value={ag}>{ag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={searchBirthYear} onValueChange={setSearchBirthYear}>
                <SelectTrigger className="border-2 h-9 text-sm">
                  <SelectValue placeholder="Birth Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {availableBirthYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={search2526Team} onValueChange={setSearch2526Team}>
                <SelectTrigger className="border-2 h-9 text-sm">
                  <SelectValue placeholder="25/26 Team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All 25/26 Teams</SelectItem>
                  {available2526Teams.map(team => (
                    <SelectItem key={team} value={team}>{team}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchName('');
                  setSearchPosition('all');
                  setSearchTeam('all');
                  setSearchAgeGroup('all');
                  setSearchBirthYear('all');
                  setSearch2526Team('all');
                }}
                className="h-9 text-sm"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </Button>
            </div>

            {searchedPlayers.length > 0 && (
              <Droppable droppableId="search-results" isDropDisabled={true}>
                {(provided) => (
                  <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto p-1"
                  >
                    {searchedPlayers.map((player, index) => (
                      <DraggablePlayerCard key={player.id} player={player} index={index} />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}