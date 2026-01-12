import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Search, Filter, X, ArrowUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TryoutDashboardDialog({ open, onClose, title, data, type }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('all');
  const [filterAgeGroup, setFilterAgeGroup] = useState('all');
  const [filterLeague, setFilterLeague] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  // Get unique values for filters
  const uniqueAgeGroups = useMemo(() => {
    return [...new Set(data.map(d => d.team?.age_group || d.age_group).filter(Boolean))].sort((a, b) => {
      const extractAge = (ag) => parseInt(ag?.match(/\d+/)?.[0] || 0);
      return extractAge(b) - extractAge(a);
    });
  }, [data]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = data.filter(item => {
      const teamName = item.team?.name || item.next_year_team || '';
      const playerName = item.player?.full_name || item.player_name || '';
      
      const matchesSearch = !searchTerm || 
        playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teamName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesGender = filterGender === 'all' || 
        (item.team?.gender || item.player?.gender || item.gender) === filterGender;
      
      const matchesAge = filterAgeGroup === 'all' || 
        (item.team?.age_group || item.age_group) === filterAgeGroup;
      
      const matchesLeague = filterLeague === 'all' ||
        (filterLeague === 'Girls Academy' && teamName?.includes('Girls Academy') && !teamName?.includes('Aspire')) ||
        (filterLeague === 'Aspire' && teamName?.includes('Aspire')) ||
        (filterLeague === 'Green' && teamName?.includes('Green')) ||
        (filterLeague === 'White' && teamName?.includes('White'));
      
      return matchesSearch && matchesGender && matchesAge && matchesLeague;
    });

    // Sort data
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        const nameA = a.player?.full_name || a.player_name || a.team?.name || '';
        const nameB = b.player?.full_name || b.player_name || b.team?.name || '';
        return nameA.localeCompare(nameB);
      } else if (sortBy === 'age') {
        const extractAge = (ag) => parseInt(ag?.match(/\d+/)?.[0] || 0);
        const ageA = extractAge(a.team?.age_group || a.age_group);
        const ageB = extractAge(b.team?.age_group || b.age_group);
        return ageB - ageA;
      } else if (sortBy === 'team') {
        const teamA = a.team?.name || a.next_year_team || '';
        const teamB = b.team?.name || b.next_year_team || '';
        return teamA.localeCompare(teamB);
      }
      return 0;
    });

    return filtered;
  }, [data, searchTerm, filterGender, filterAgeGroup, filterLeague, sortBy]);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterGender('all');
    setFilterAgeGroup('all');
    setFilterLeague('all');
    setSortBy('name');
  };

  const hasActiveFilters = searchTerm || filterGender !== 'all' || filterAgeGroup !== 'all' || filterLeague !== 'all';

  const renderItem = (item) => {
    const teamName = item.team?.name || item.next_year_team || '';
    const playerName = item.player?.full_name || item.player_name || '';
    const status = item.next_season_status || item.status || '';
    const ageGroup = item.team?.age_group || item.age_group || '';

    return (
      <Card
        key={item.id}
        className="p-4 cursor-pointer hover:shadow-lg transition-all border-2 hover:border-blue-400"
        onClick={() => {
          if (item.player_id) {
            navigate(`${createPageUrl('PlayerDashboard')}?id=${item.player_id}`);
          } else if (item.team?.id) {
            navigate(`${createPageUrl('TeamDashboard')}?id=${item.team.id}`);
          }
          onClose();
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="font-semibold text-slate-900">{playerName || teamName}</div>
            <div className="flex gap-1 mt-1 flex-wrap">
              {ageGroup && <Badge className="bg-slate-100 text-slate-700 text-xs">{ageGroup}</Badge>}
              {teamName && playerName && <Badge className="bg-blue-100 text-blue-800 text-xs">{teamName}</Badge>}
              {status && (
                <Badge className={`text-xs ${
                  status === 'Accepted Offer' ? 'bg-green-500 text-white' :
                  status === 'Rejected Offer' ? 'bg-red-500 text-white' :
                  status === 'Offer Sent' ? 'bg-yellow-500 text-white' :
                  status === 'Considering Offer' ? 'bg-blue-500 text-white' :
                  status === 'Roster Finalized' ? 'bg-purple-500 text-white' :
                  'bg-slate-400 text-white'
                }`}>
                  {status}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="border-b pb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-semibold text-slate-700">Filters & Search</span>
            </div>
            {hasActiveFilters && (
              <Button
                onClick={clearFilters}
                size="sm"
                variant="ghost"
                className="h-8 text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            
            <Select value={filterGender} onValueChange={setFilterGender}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="Female">Girls</SelectItem>
                <SelectItem value="Male">Boys</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterAgeGroup} onValueChange={setFilterAgeGroup}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Age Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ages</SelectItem>
                {uniqueAgeGroups.map(ag => (
                  <SelectItem key={ag} value={ag}>{ag}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterLeague} onValueChange={setFilterLeague}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="League" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leagues</SelectItem>
                <SelectItem value="Girls Academy">Girls Academy</SelectItem>
                <SelectItem value="Aspire">Aspire</SelectItem>
                <SelectItem value="Green">Green</SelectItem>
                <SelectItem value="White">White</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-9">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="age">Age Group</SelectItem>
                <SelectItem value="team">Team</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-2 text-sm text-slate-600">
            Showing {filteredData.length} of {data.length} items
          </div>
        </div>

        {/* Data List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {filteredData.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Filter className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No items match your filters</p>
            </div>
          ) : (
            filteredData.map(renderItem)
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}