import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { X, Search, GitCompare, Users } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899'];

export default function PlayerComparison() {
  const [selectedPlayers, setSelectedPlayers] = useState([null, null, null, null]);
  const [searchTerms, setSearchTerms] = useState(['', '', '', '']);
  const [filters, setFilters] = useState([
    { ageGroup: 'all', league: 'all', coach: 'all' },
    { ageGroup: 'all', league: 'all', coach: 'all' },
    { ageGroup: 'all', league: 'all', coach: 'all' },
    { ageGroup: 'all', league: 'all', coach: 'all' }
  ]);

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => base44.entities.PhysicalAssessment.list()
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations'],
    queryFn: () => base44.entities.Evaluation.list()
  });

  const { data: tryouts = [] } = useQuery({
    queryKey: ['tryouts'],
    queryFn: () => base44.entities.PlayerTryout.list()
  });

  const uniqueAgeGroups = [...new Set(teams?.map(t => t.age_group).filter(Boolean) || [])].sort((a, b) => {
    const extractAge = (ag) => {
      const match = ag?.match(/U-?(\d+)/i);
      return match ? parseInt(match[1]) : 0;
    };
    return extractAge(b) - extractAge(a);
  });

  const uniqueLeagues = [...new Set(teams?.map(t => t.league).filter(Boolean) || [])];

  const getFilteredPlayers = (index) => {
    let filtered = [...players];
    const filter = filters[index];
    const search = searchTerms[index].toLowerCase();

    if (filter.ageGroup !== 'all') {
      const teamIds = teams.filter(t => t.age_group === filter.ageGroup).map(t => t.id);
      filtered = filtered.filter(p => teamIds.includes(p.team_id));
    }

    if (filter.league !== 'all') {
      const teamIds = teams.filter(t => t.league === filter.league).map(t => t.id);
      filtered = filtered.filter(p => teamIds.includes(p.team_id));
    }

    if (filter.coach !== 'all') {
      const teamIds = teams.filter(t => t.coach_ids?.includes(filter.coach)).map(t => t.id);
      filtered = filtered.filter(p => teamIds.includes(p.team_id));
    }

    if (search) {
      filtered = filtered.filter(p => p.full_name?.toLowerCase().includes(search));
    }

    return filtered.sort((a, b) => {
      const lastNameA = a.full_name?.split(' ').pop() || '';
      const lastNameB = b.full_name?.split(' ').pop() || '';
      return lastNameA.localeCompare(lastNameB);
    });
  };

  const selectPlayer = (index, player) => {
    const newSelected = [...selectedPlayers];
    newSelected[index] = player;
    setSelectedPlayers(newSelected);
    const newSearchTerms = [...searchTerms];
    newSearchTerms[index] = '';
    setSearchTerms(newSearchTerms);
  };

  const removePlayer = (index) => {
    const newSelected = [...selectedPlayers];
    newSelected[index] = null;
    setSelectedPlayers(newSelected);
  };

  const updateFilter = (index, key, value) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], [key]: value };
    setFilters(newFilters);
  };

  const selectedPlayersData = useMemo(() => {
    return selectedPlayers.filter(Boolean).map(player => {
      const playerAssessments = assessments.filter(a => a.player_id === player.id);
      const latestAssessment = playerAssessments.sort((a, b) => new Date(b.assessment_date) - new Date(a.assessment_date))[0];
      const playerEvaluations = evaluations.filter(e => e.player_id === player.id);
      const latestEvaluation = playerEvaluations.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
      const tryout = tryouts.find(t => t.player_id === player.id);
      const team = teams.find(t => t.id === player.team_id);
      const birthYear = player.date_of_birth ? new Date(player.date_of_birth).getFullYear() : null;
      return { player, latestAssessment, latestEvaluation, tryout, team, birthYear };
    });
  }, [selectedPlayers, assessments, evaluations, tryouts, teams]);

  const hasEnoughPlayers = selectedPlayersData.length >= 2;

  // Chart data
  const physicalData = [
    { metric: 'Speed', ...Object.fromEntries(selectedPlayersData.map((pd, i) => [`player${i}`, pd.latestAssessment?.speed_score || 0])) },
    { metric: 'Power', ...Object.fromEntries(selectedPlayersData.map((pd, i) => [`player${i}`, pd.latestAssessment?.power_score || 0])) },
    { metric: 'Endurance', ...Object.fromEntries(selectedPlayersData.map((pd, i) => [`player${i}`, pd.latestAssessment?.endurance_score || 0])) },
    { metric: 'Agility', ...Object.fromEntries(selectedPlayersData.map((pd, i) => [`player${i}`, pd.latestAssessment?.agility_score || 0])) },
    { metric: 'Overall', ...Object.fromEntries(selectedPlayersData.map((pd, i) => [`player${i}`, pd.latestAssessment?.overall_score || 0])) },
  ];

  const mentalData = [
    { metric: 'Growth', ...Object.fromEntries(selectedPlayersData.map((pd, i) => [`player${i}`, pd.latestEvaluation?.growth_mindset || 0])) },
    { metric: 'Resilience', ...Object.fromEntries(selectedPlayersData.map((pd, i) => [`player${i}`, pd.latestEvaluation?.resilience || 0])) },
    { metric: 'Efficiency', ...Object.fromEntries(selectedPlayersData.map((pd, i) => [`player${i}`, pd.latestEvaluation?.efficiency_in_execution || 0])) },
    { metric: 'Athleticism', ...Object.fromEntries(selectedPlayersData.map((pd, i) => [`player${i}`, pd.latestEvaluation?.athleticism || 0])) },
    { metric: 'Team Focus', ...Object.fromEntries(selectedPlayersData.map((pd, i) => [`player${i}`, pd.latestEvaluation?.team_focus || 0])) },
  ];

  const defendingData = [
    { metric: 'Organized', ...Object.fromEntries(selectedPlayersData.map((pd, i) => [`player${i}`, pd.latestEvaluation?.defending_organized || 0])) },
    { metric: 'Final Third', ...Object.fromEntries(selectedPlayersData.map((pd, i) => [`player${i}`, pd.latestEvaluation?.defending_final_third || 0])) },
    { metric: 'Transition', ...Object.fromEntries(selectedPlayersData.map((pd, i) => [`player${i}`, pd.latestEvaluation?.defending_transition || 0])) },
  ];

  const attackingData = [
    { metric: 'Organized', ...Object.fromEntries(selectedPlayersData.map((pd, i) => [`player${i}`, pd.latestEvaluation?.attacking_organized || 0])) },
    { metric: 'Final Third', ...Object.fromEntries(selectedPlayersData.map((pd, i) => [`player${i}`, pd.latestEvaluation?.attacking_final_third || 0])) },
    { metric: 'In Transition', ...Object.fromEntries(selectedPlayersData.map((pd, i) => [`player${i}`, pd.latestEvaluation?.attacking_in_transition || 0])) },
  ];

  const radarData = ['Speed', 'Power', 'Endurance', 'Agility'].map(attr => ({
    attribute: attr,
    ...Object.fromEntries(selectedPlayersData.map((pd, i) => [
      `player${i}`,
      attr === 'Speed' ? pd.latestAssessment?.speed_score || 0 :
      attr === 'Power' ? pd.latestAssessment?.power_score || 0 :
      attr === 'Endurance' ? pd.latestAssessment?.endurance_score || 0 :
      pd.latestAssessment?.agility_score || 0
    ]))
  }));

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
          <GitCompare className="w-8 h-8 text-emerald-600" />
          Player Comparison
        </h1>
        <p className="text-slate-600 mt-1">Compare up to 4 players side by side</p>
      </div>

      {/* Player Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[0, 1, 2, 3]?.map(index => (
          <Card key={index} className="border-2" style={{ borderColor: selectedPlayers[index] ? COLORS[index] : '#e2e8f0' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span style={{ color: COLORS[index] }}>Player {index + 1}</span>
                {selectedPlayers[index] && (
                  <Button variant="ghost" size="sm" onClick={() => removePlayer(index)} className="h-6 w-6 p-0">
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {selectedPlayers[index] ? (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: COLORS[index] }}>
                      {selectedPlayers[index].jersey_number || selectedPlayers[index].full_name?.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{selectedPlayers[index].full_name}</div>
                      <div className="text-xs text-slate-500">{selectedPlayers[index].primary_position}</div>
                    </div>
                  </div>
                  {(() => {
                    const team = teams.find(t => t.id === selectedPlayers[index].team_id);
                    const tryout = tryouts.find(t => t.player_id === selectedPlayers[index].id);
                    return (
                      <div className="flex flex-wrap gap-1">
                        {team && <Badge variant="outline" className="text-[9px]">{team.name}</Badge>}
                        {tryout?.team_role && <Badge className="text-[9px] bg-purple-100 text-purple-800">{tryout.team_role}</Badge>}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-1">
                    <Select value={filters[index].ageGroup} onValueChange={v => updateFilter(index, 'ageGroup', v)}>
                      <SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder="Age" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Ages</SelectItem>
                        {uniqueAgeGroups?.map(ag => <SelectItem key={ag} value={ag}>{ag}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={filters[index].league} onValueChange={v => updateFilter(index, 'league', v)}>
                      <SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder="League" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Leagues</SelectItem>
                        {uniqueLeagues?.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Select value={filters[index].coach} onValueChange={v => updateFilter(index, 'coach', v)}>
                    <SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder="Coach" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Coaches</SelectItem>
                      {coaches.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Search player..."
                      value={searchTerms[index]}
                      onChange={e => {
                        const newTerms = [...searchTerms];
                        newTerms[index] = e.target.value;
                        setSearchTerms(newTerms);
                      }}
                      className="h-7 text-xs pl-7"
                    />
                  </div>
                  {searchTerms[index] && (
                    <div className="max-h-32 overflow-y-auto border rounded-lg">
                      {getFilteredPlayers(index)?.slice(0, 10)?.map(player => (
                        <button
                          key={player.id}
                          onClick={() => selectPlayer(index, player)}
                          className="w-full text-left p-2 hover:bg-slate-100 text-xs border-b last:border-b-0"
                        >
                          {player.full_name}
                        </button>
                      ))}
                    </div>
                  )}
                  {!searchTerms[index] && (
                    <div className="max-h-32 overflow-y-auto border rounded-lg">
                      {getFilteredPlayers(index)?.slice(0, 8)?.map(player => (
                        <button
                          key={player.id}
                          onClick={() => selectPlayer(index, player)}
                          className="w-full text-left p-2 hover:bg-slate-100 text-xs border-b last:border-b-0"
                        >
                          {player.full_name}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comparison Results */}
      {hasEnoughPlayers ? (
        <div className="space-y-6">
          {/* Physical Assessment */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-none shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Physical Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={physicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    {selectedPlayersData?.map((pd, idx) => (
                      <Bar key={idx} dataKey={`player${idx}`} name={pd.player.full_name} fill={COLORS[idx]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Physical Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="attribute" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 8 }} />
                    {selectedPlayersData?.map((pd, idx) => (
                      <Radar key={idx} name={pd.player.full_name} dataKey={`player${idx}`} stroke={COLORS[idx]} fill={COLORS[idx]} fillOpacity={0.2} />
                    ))}
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Mental & Physical */}
          <Card className="border-none shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Mental & Physical</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={mentalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  {selectedPlayersData.map((pd, idx) => (
                    <Bar key={idx} dataKey={`player${idx}`} name={pd.player.full_name} fill={COLORS[idx]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Defending & Attacking */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-none shadow-lg bg-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Defending</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={defendingData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    {selectedPlayersData?.map((pd, idx) => (
                      <Bar key={idx} dataKey={`player${idx}`} name={pd.player.full_name} fill={COLORS[idx]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-green-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Attacking</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={attackingData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    {selectedPlayersData?.map((pd, idx) => (
                      <Bar key={idx} dataKey={`player${idx}`} name={pd.player.full_name} fill={COLORS[idx]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Table */}
          <Card className="border-none shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Detailed Comparison</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-2 text-left">Metric</th>
                    {selectedPlayersData?.map((pd, idx) => (
                      <th key={idx} className="p-2 text-center" style={{ color: COLORS[idx] }}>{pd.player.full_name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-slate-200"><td colSpan={selectedPlayersData.length + 1} className="p-2 font-bold">Physical</td></tr>
                  <tr className="border-b"><td className="p-2">Overall</td>{selectedPlayersData.map((pd, i) => <td key={i} className="p-2 text-center font-bold">{pd.latestAssessment?.overall_score || '-'}</td>)}</tr>
                  <tr className="border-b bg-slate-50"><td className="p-2">Speed</td>{selectedPlayersData.map((pd, i) => <td key={i} className="p-2 text-center">{pd.latestAssessment?.speed_score || '-'}</td>)}</tr>
                  <tr className="border-b"><td className="p-2">Power</td>{selectedPlayersData.map((pd, i) => <td key={i} className="p-2 text-center">{pd.latestAssessment?.power_score || '-'}</td>)}</tr>
                  <tr className="border-b bg-slate-50"><td className="p-2">Endurance</td>{selectedPlayersData.map((pd, i) => <td key={i} className="p-2 text-center">{pd.latestAssessment?.endurance_score || '-'}</td>)}</tr>
                  <tr className="border-b"><td className="p-2">Agility</td>{selectedPlayersData.map((pd, i) => <td key={i} className="p-2 text-center">{pd.latestAssessment?.agility_score || '-'}</td>)}</tr>
                  
                  <tr className="bg-purple-100"><td colSpan={selectedPlayersData.length + 1} className="p-2 font-bold">Mental & Physical</td></tr>
                  <tr className="border-b bg-purple-50"><td className="p-2">Growth Mindset</td>{selectedPlayersData.map((pd, i) => <td key={i} className="p-2 text-center">{pd.latestEvaluation?.growth_mindset || '-'}</td>)}</tr>
                  <tr className="border-b"><td className="p-2">Resilience</td>{selectedPlayersData.map((pd, i) => <td key={i} className="p-2 text-center">{pd.latestEvaluation?.resilience || '-'}</td>)}</tr>
                  <tr className="border-b bg-purple-50"><td className="p-2">Athleticism</td>{selectedPlayersData.map((pd, i) => <td key={i} className="p-2 text-center">{pd.latestEvaluation?.athleticism || '-'}</td>)}</tr>
                  <tr className="border-b"><td className="p-2">Team Focus</td>{selectedPlayersData.map((pd, i) => <td key={i} className="p-2 text-center">{pd.latestEvaluation?.team_focus || '-'}</td>)}</tr>
                  
                  <tr className="bg-red-100"><td colSpan={selectedPlayersData.length + 1} className="p-2 font-bold">Defending</td></tr>
                  <tr className="border-b bg-red-50"><td className="p-2">Organized</td>{selectedPlayersData.map((pd, i) => <td key={i} className="p-2 text-center">{pd.latestEvaluation?.defending_organized || '-'}</td>)}</tr>
                  <tr className="border-b"><td className="p-2">Final Third</td>{selectedPlayersData.map((pd, i) => <td key={i} className="p-2 text-center">{pd.latestEvaluation?.defending_final_third || '-'}</td>)}</tr>
                  <tr className="border-b bg-red-50"><td className="p-2">Transition</td>{selectedPlayersData.map((pd, i) => <td key={i} className="p-2 text-center">{pd.latestEvaluation?.defending_transition || '-'}</td>)}</tr>
                  
                  <tr className="bg-green-100"><td colSpan={selectedPlayersData.length + 1} className="p-2 font-bold">Attacking</td></tr>
                  <tr className="border-b bg-green-50"><td className="p-2">Organized</td>{selectedPlayersData.map((pd, i) => <td key={i} className="p-2 text-center">{pd.latestEvaluation?.attacking_organized || '-'}</td>)}</tr>
                  <tr className="border-b"><td className="p-2">Final Third</td>{selectedPlayersData.map((pd, i) => <td key={i} className="p-2 text-center">{pd.latestEvaluation?.attacking_final_third || '-'}</td>)}</tr>
                  <tr className="border-b bg-green-50"><td className="p-2">In Transition</td>{selectedPlayersData.map((pd, i) => <td key={i} className="p-2 text-center">{pd.latestEvaluation?.attacking_in_transition || '-'}</td>)}</tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="border-none shadow-lg">
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">Select at least 2 players to compare</h3>
            <p className="text-sm text-slate-500">Use the filters and search above to find and select players</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}