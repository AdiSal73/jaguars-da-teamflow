import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, CheckCircle, XCircle, Clock, UserCheck, FileCheck, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function TryoutDashboard() {
  const navigate = useNavigate();
  const [isCalculating, setIsCalculating] = React.useState(false);

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: tryouts = [] } = useQuery({
    queryKey: ['tryouts'],
    queryFn: () => base44.entities.PlayerTryout.list()
  });

  const { data: poolPlayers = [] } = useQuery({
    queryKey: ['tryoutPool'],
    queryFn: () => base44.entities.TryoutPool.list()
  });

  const handleCalculateGradYears = async () => {
    setIsCalculating(true);
    try {
      const response = await base44.functions.invoke('calculateAllGradYears', {});
      toast.success(`Updated ${response.data.updated} graduation years`);
    } catch (error) {
      toast.error('Failed to calculate graduation years');
    } finally {
      setIsCalculating(false);
    }
  };

  // Filter for 26/27 teams only
  const nextSeasonTeams = useMemo(() => {
    return teams.filter(t => t.season === '26/27' || t.name?.includes('26/27'));
  }, [teams]);

  // Calculate team statistics
  const teamStats = useMemo(() => {
    return nextSeasonTeams.map(team => {
      // Get all players assigned to this team
      const assignedTryouts = tryouts.filter(t => t.next_year_team === team.name);
      const assignedPoolPlayers = poolPlayers.filter(pp => pp.next_year_team === team.name);
      
      const totalAssigned = assignedTryouts.length + assignedPoolPlayers.length;
      
      // Count by status
      const offered = assignedTryouts.filter(t => t.next_season_status === 'Offer Sent').length;
      const accepted = assignedTryouts.filter(t => t.next_season_status === 'Accepted Offer').length;
      const rejected = assignedTryouts.filter(t => t.next_season_status === 'Rejected Offer').length;
      const considering = assignedTryouts.filter(t => t.next_season_status === 'Considering Offer').length;
      const finalized = assignedTryouts.filter(t => t.next_season_status === 'Roster Finalized').length;
      
      // Count registered
      const signedAndPaid = assignedTryouts.filter(t => t.registration_status === 'Signed and Paid').length;
      const signed = assignedTryouts.filter(t => t.registration_status === 'Signed').length;
      
      return {
        team,
        totalAssigned,
        offered,
        accepted,
        rejected,
        considering,
        finalized,
        signedAndPaid,
        signed,
        pending: totalAssigned - offered - accepted - rejected - considering - finalized
      };
    });
  }, [nextSeasonTeams, tryouts, poolPlayers]);

  // Overall statistics
  const overallStats = useMemo(() => {
    const totalPlayers = teamStats.reduce((sum, t) => sum + t.totalAssigned, 0);
    const totalOffered = teamStats.reduce((sum, t) => sum + t.offered, 0);
    const totalAccepted = teamStats.reduce((sum, t) => sum + t.accepted, 0);
    const totalRejected = teamStats.reduce((sum, t) => sum + t.rejected, 0);
    const totalFinalized = teamStats.reduce((sum, t) => sum + t.finalized, 0);
    const totalRegistered = teamStats.reduce((sum, t) => sum + t.signedAndPaid + t.signed, 0);
    const totalInPool = poolPlayers.filter(pp => !pp.next_year_team).length;

    return {
      totalPlayers,
      totalOffered,
      totalAccepted,
      totalRejected,
      totalFinalized,
      totalRegistered,
      totalInPool
    };
  }, [teamStats, poolPlayers]);

  const getLeagueBadgeColor = (teamName) => {
    if (teamName?.includes('Girls Academy')) return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
    if (teamName?.includes('Aspire')) return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
    if (teamName?.includes('Green')) return 'bg-green-500 text-white';
    if (teamName?.includes('White')) return 'bg-slate-400 text-white';
    return 'bg-slate-500 text-white';
  };

  return (
    <div className="p-4 md:p-6 max-w-[1800px] mx-auto">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
            Tryout Dashboard 2026/2027
          </h1>
          <p className="text-slate-600 mt-2">Overview of team formation and player assignments</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleCalculateGradYears}
            disabled={isCalculating}
            variant="outline"
            className="shadow-lg"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isCalculating ? 'Calculating...' : 'Calculate Grad Years'}
          </Button>
          <Button
            onClick={() => navigate(createPageUrl('TeamTryout'))}
            className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 shadow-lg"
          >
            <Users className="w-4 h-4 mr-2" />
            Manage Assignments
          </Button>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        <Card className="border-2 border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-slate-600">Total Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{overallStats.totalPlayers}</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-yellow-700">Offers Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{overallStats.totalOffered}</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-green-700">Accepted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{overallStats.totalAccepted}</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-red-700">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overallStats.totalRejected}</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-purple-700">Finalized</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{overallStats.totalFinalized}</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-blue-700">Registered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{overallStats.totalRegistered}</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-indigo-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-indigo-700">In Pool</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{overallStats.totalInPool}</div>
          </CardContent>
        </Card>
      </div>

      {/* Team Breakdown */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Team Rosters</h2>
        {teamStats
          .sort((a, b) => {
            const extractAge = (ag) => parseInt(ag?.match(/\d+/)?.[0] || 0);
            const ageA = extractAge(a.team.age_group);
            const ageB = extractAge(b.team.age_group);
            if (ageA !== ageB) return ageB - ageA;
            
            const priority = { 
              'Girls Academy': 1, 
              'Girls Academy Aspire': 2,
              'Aspire': 3, 
              'Green': 4, 
              'White': 5 
            };
            const getName = (name) => {
              for (const key of Object.keys(priority)) {
                if (name?.includes(key)) return key;
              }
              return name;
            };
            return (priority[getName(a.team.name)] || 99) - (priority[getName(b.team.name)] || 99);
          })
          .map(stat => (
            <Card 
              key={stat.team.id} 
              className="border-2 hover:shadow-lg transition-all cursor-pointer"
              onClick={() => navigate(createPageUrl('TeamTryout'))}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-lg font-bold text-sm ${getLeagueBadgeColor(stat.team.name)}`}>
                      {stat.team.name}
                    </div>
                    <Badge className="bg-slate-100 text-slate-700">{stat.team.age_group}</Badge>
                    {stat.team.gender && <Badge variant="outline">{stat.team.gender}</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-slate-900 text-white text-lg px-3 py-1">
                      {stat.totalAssigned}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-xs text-slate-600">Pending</div>
                      <div className="text-sm font-semibold">{stat.pending}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-yellow-500" />
                    <div>
                      <div className="text-xs text-slate-600">Offered</div>
                      <div className="text-sm font-semibold">{stat.offered}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <div>
                      <div className="text-xs text-slate-600">Accepted</div>
                      <div className="text-sm font-semibold text-green-600">{stat.accepted}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <div>
                      <div className="text-xs text-slate-600">Rejected</div>
                      <div className="text-sm font-semibold text-red-600">{stat.rejected}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <div>
                      <div className="text-xs text-slate-600">Considering</div>
                      <div className="text-sm font-semibold">{stat.considering}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    <div>
                      <div className="text-xs text-slate-600">Finalized</div>
                      <div className="text-sm font-semibold text-purple-600">{stat.finalized}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-blue-500" />
                    <div>
                      <div className="text-xs text-slate-600">Signed</div>
                      <div className="text-sm font-semibold">{stat.signed}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <div>
                      <div className="text-xs text-slate-600">Paid</div>
                      <div className="text-sm font-semibold text-emerald-600">{stat.signedAndPaid}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}