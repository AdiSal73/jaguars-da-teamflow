import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Activity, User, Search, SlidersHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export default function Assessments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [seasonFilter, setSeasonFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => base44.entities.PhysicalAssessment.list('-assessment_date')
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const calculateOverallScore = (assessment) => {
    const speed = assessment.speed || 0;
    const agility = assessment.agility || 0;
    const power = assessment.power || 0;
    const endurance = assessment.endurance || 0;
    return Math.round(((5 * speed) + agility + (3 * power) + (6 * endurance)) / 60);
  };

  // Get unique seasons
  const seasons = [...new Set(assessments.map(a => {
    const year = new Date(a.assessment_date).getFullYear();
    return `${year}-${(year + 1).toString().slice(2)}`;
  }))].sort();

  // Filter and sort assessments
  let filteredAssessments = assessments.filter(assessment => {
    const player = players.find(p => p.id === assessment.player_id);
    const playerName = player?.full_name?.toLowerCase() || '';
    const matchesSearch = playerName.includes(searchTerm.toLowerCase());
    
    const matchesTeam = teamFilter === 'all' || player?.team_id === teamFilter;
    
    const assessmentYear = new Date(assessment.assessment_date).getFullYear();
    const assessmentSeason = `${assessmentYear}-${(assessmentYear + 1).toString().slice(2)}`;
    const matchesSeason = seasonFilter === 'all' || assessmentSeason === seasonFilter;
    
    return matchesSearch && matchesTeam && matchesSeason;
  });

  // Sort assessments
  filteredAssessments = filteredAssessments.sort((a, b) => {
    const playerA = players.find(p => p.id === a.player_id);
    const playerB = players.find(p => p.id === b.player_id);
    
    if (sortBy === 'name') {
      return (playerA?.full_name || '').localeCompare(playerB?.full_name || '');
    } else if (sortBy === 'date') {
      return new Date(b.assessment_date) - new Date(a.assessment_date);
    } else if (sortBy === 'score') {
      return calculateOverallScore(b) - calculateOverallScore(a);
    }
    return 0;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Physical Assessments</h1>
        <p className="text-slate-600 mt-1">Monitor athletic performance and fitness levels</p>
      </div>

      <Card className="border-none shadow-lg mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5" />
            Filters & Sorting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by player name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map(team => (
                  <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={seasonFilter} onValueChange={setSeasonFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by season" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Seasons</SelectItem>
                {seasons.map(season => (
                  <SelectItem key={season} value={season}>{season}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (Newest)</SelectItem>
                <SelectItem value="name">Player Name</SelectItem>
                <SelectItem value="score">Overall Score</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredAssessments.length === 0 ? (
        <Card className="border-none shadow-lg">
          <CardContent className="p-12 text-center">
            <Activity className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Assessments Found</h3>
            <p className="text-slate-600">Try adjusting your filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssessments.map(assessment => {
            const player = players.find(p => p.id === assessment.player_id);
            const team = teams.find(t => t.id === player?.team_id);
            const overallScore = calculateOverallScore(assessment);
            
            return (
              <Link key={assessment.id} to={`${createPageUrl('PlayerProfile')}?id=${assessment.player_id}`}>
                <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900">{player?.full_name || 'Player'}</h3>
                        <p className="text-xs text-slate-600">{new Date(assessment.assessment_date).toLocaleDateString()}</p>
                        {team && <p className="text-xs text-slate-500">{team.name}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="p-3 bg-red-50 rounded-lg">
                        <div className="text-xs text-red-600 mb-1">20m Linear</div>
                        <div className="text-lg font-bold text-red-700">{assessment.sprint_time?.toFixed(2) || 'N/A'}s</div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-xs text-blue-600 mb-1">Vertical</div>
                        <div className="text-lg font-bold text-blue-700">{assessment.vertical_jump?.toFixed(1) || 'N/A'}"</div>
                      </div>
                      <div className="p-3 bg-pink-50 rounded-lg">
                        <div className="text-xs text-pink-600 mb-1">YIRT</div>
                        <div className="text-lg font-bold text-pink-700">{assessment.cooper_test || 'N/A'}</div>
                      </div>
                      <div className="p-3 bg-emerald-50 rounded-lg">
                        <div className="text-xs text-emerald-600 mb-1">5-10-5</div>
                        <div className="text-lg font-bold text-emerald-700">{assessment.agility || 'N/A'}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <span className="text-sm text-slate-600">Overall Score</span>
                      <span className="text-2xl font-bold text-slate-900">{overallScore}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}