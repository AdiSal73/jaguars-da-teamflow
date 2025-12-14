import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp, Users, Award, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

export default function TeamPerformanceAnalytics({ teamId, teamName }) {
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const { data: players = [] } = useQuery({
    queryKey: ['players', teamId],
    queryFn: async () => {
      const allPlayers = await base44.entities.Player.list();
      return allPlayers.filter((p) => p.team_id === teamId);
    }
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['teamAssessments', teamId],
    queryFn: async () => {
      const allAssessments = await base44.entities.PhysicalAssessment.list();
      return allAssessments.filter((a) => a.team_id === teamId);
    }
  });

  const calculateAverages = () => {
    if (assessments.length === 0) return null;

    const totals = assessments.reduce((acc, a) => ({
      speed: acc.speed + (a.speed_score || 0),
      power: acc.power + (a.power_score || 0),
      endurance: acc.endurance + (a.endurance_score || 0),
      agility: acc.agility + (a.agility_score || 0),
      overall: acc.overall + (a.overall_score || 0)
    }), { speed: 0, power: 0, endurance: 0, agility: 0, overall: 0 });

    return {
      speed: Math.round(totals.speed / assessments.length),
      power: Math.round(totals.power / assessments.length),
      endurance: Math.round(totals.endurance / assessments.length),
      agility: Math.round(totals.agility / assessments.length),
      overall: Math.round(totals.overall / assessments.length)
    };
  };

  const getTopPerformers = () => {
    const latestAssessments = new Map();

    assessments.forEach((a) => {
      const existing = latestAssessments.get(a.player_id);
      if (!existing || new Date(a.assessment_date) > new Date(existing.assessment_date)) {
        latestAssessments.set(a.player_id, a);
      }
    });

    const assessmentArray = Array.from(latestAssessments.values());

    return {
      speed: assessmentArray.sort((a, b) => (b.speed_score || 0) - (a.speed_score || 0))[0],
      power: assessmentArray.sort((a, b) => (b.power_score || 0) - (a.power_score || 0))[0],
      endurance: assessmentArray.sort((a, b) => (b.endurance_score || 0) - (a.endurance_score || 0))[0],
      agility: assessmentArray.sort((a, b) => (b.agility_score || 0) - (a.agility_score || 0))[0],
      overall: assessmentArray.sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0))[0]
    };
  };

  const generateAIInsights = async () => {
    if (assessments.length === 0) return;
    setLoadingInsights(true);

    const averages = calculateAverages();
    const topPerformers = getTopPerformers();

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this soccer team's physical performance data and provide coaching insights:

Team: ${teamName}
Number of Players: ${players.length}
Total Assessments: ${assessments.length}

Team Average Scores:
- Speed: ${averages.speed}/100
- Power: ${averages.power}/100
- Endurance: ${averages.endurance}/100
- Agility: ${averages.agility}/100
- Overall: ${averages.overall}/100

Provide a concise analysis covering:
1. Team strengths (2-3 bullet points)
2. Team weaknesses (2-3 bullet points)
3. Strategic recommendations for coaches
4. Position-specific insights if relevant

Be specific and actionable.`,
      response_json_schema: {
        type: "object",
        properties: {
          strengths: { type: "array", items: { type: "string" } },
          weaknesses: { type: "array", items: { type: "string" } },
          recommendations: { type: "array", items: { type: "string" } },
          position_insights: { type: "string" }
        }
      }
    });

    setAiInsights(result);
    setLoadingInsights(false);
  };

  const averages = calculateAverages();
  const topPerformers = getTopPerformers();

  const radarData = averages ? [
  { metric: 'Speed', value: averages.speed },
  { metric: 'Power', value: averages.power },
  { metric: 'Endurance', value: averages.endurance },
  { metric: 'Agility', value: averages.agility }] :
  [];

  const comparisonData = [
  { name: 'Speed', teamAvg: averages?.speed || 0, leagueAvg: 65 },
  { name: 'Power', teamAvg: averages?.power || 0, leagueAvg: 60 },
  { name: 'Endurance', teamAvg: averages?.endurance || 0, leagueAvg: 70 },
  { name: 'Agility', teamAvg: averages?.agility || 0, leagueAvg: 55 }];


  if (!averages) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-slate-500">No assessment data available for this team</p>
        </CardContent>
      </Card>);

  }

  return (
    <div className="space-y-6">
      {/* Team Averages */}
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Team Average Scores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            <div className="p-4 bg-red-50 rounded-xl text-center">
              <div className="text-sm text-red-600 mb-1">Speed</div>
              <div className="text-3xl font-bold text-red-700">{averages.speed}</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl text-center">
              <div className="text-sm text-blue-600 mb-1">Power</div>
              <div className="text-3xl font-bold text-blue-700">{averages.power}</div>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl text-center">
              <div className="text-sm text-emerald-600 mb-1">Endurance</div>
              <div className="text-3xl font-bold text-emerald-700">{averages.endurance}</div>
            </div>
            <div className="p-4 bg-pink-50 rounded-xl text-center">
              <div className="text-sm text-pink-600 mb-1">Agility</div>
              <div className="text-3xl font-bold text-pink-700">{averages.agility}</div>
            </div>
            <div className="p-4 bg-slate-900 rounded-xl text-center">
              <div className="text-sm text-white mb-1">Overall</div>
              <div className="text-3xl font-bold text-white">{averages.overall}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Radar Chart */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Performance Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis domain={[0, 100]} />
                <Radar name="Team Average" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Team vs League Average</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="teamAvg" fill="#10b981" name="Team" />
                <Bar dataKey="leagueAvg" fill="#94a3b8" name="League Avg" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-600" />
            Top Performers by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(topPerformers).filter(([key]) => key !== 'overall').map(([category, assessment]) =>
            <div key={category} className="p-4 bg-slate-50 rounded-xl">
                <div className="text-sm font-semibold text-slate-600 capitalize mb-2">{category}</div>
                <div className="font-bold text-slate-900">{assessment?.player_name || 'N/A'}</div>
                <div className="text-2xl font-bold text-emerald-600 mt-1">
                  {assessment?.[`${category}_score`] || 0}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Adil's Insight
            </CardTitle>
            <Button
              onClick={generateAIInsights}
              disabled={loadingInsights}
              className="bg-purple-600 hover:bg-purple-700">
              
              {loadingInsights ? 'Analyzing...' : aiInsights ? 'Refresh' : 'Generate'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {aiInsights ?
          <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-emerald-700 mb-2">💪 Team Strengths</h3>
                <ul className="space-y-1">
                  {aiInsights.strengths?.map((s, i) =>
                <li key={i} className="text-sm text-slate-700">• {s}</li>
                )}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-orange-700 mb-2">🎯 Areas to Address</h3>
                <ul className="space-y-1">
                  {aiInsights.weaknesses?.map((s, i) =>
                <li key={i} className="text-sm text-slate-700">• {s}</li>
                )}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-purple-700 mb-2">🏋️ Coaching Recommendations</h3>
                <ul className="space-y-1">
                  {aiInsights.recommendations?.map((s, i) =>
                <li key={i} className="text-sm text-slate-700">• {s}</li>
                )}
                </ul>
              </div>
              {aiInsights.position_insights &&
            <div>
                  <h3 className="font-semibold text-blue-700 mb-2">⚽ Position Insights</h3>
                  <p className="text-sm text-slate-700">{aiInsights.position_insights}</p>
                </div>
            }
            </div> :

          <p className="text-slate-600 text-center py-8">Click "Generate" for Adil's analysis</p>
          }
        </CardContent>
      </Card>
    </div>);

}