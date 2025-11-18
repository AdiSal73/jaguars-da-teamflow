import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, TrendingUp, Target, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

export default function PlayerAssessmentAnalytics() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const playerId = urlParams.get('playerId');
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const { data: player } = useQuery({
    queryKey: ['player', playerId],
    queryFn: async () => {
      const players = await base44.entities.Player.list();
      return players.find(p => p.id === playerId);
    }
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments', playerId],
    queryFn: () => base44.entities.PhysicalAssessment.filter({ player_id: playerId }, 'assessment_date')
  });

  const generateAIInsights = async () => {
    if (assessments.length === 0) return;
    setLoadingInsights(true);
    
    const data = assessments.map(a => ({
      date: a.assessment_date,
      sprint: a.sprint,
      vertical: a.vertical,
      yirt: a.yirt,
      shuttle: a.shuttle,
      speed_score: a.speed_score,
      power_score: a.power_score,
      endurance_score: a.endurance_score,
      agility_score: a.agility_score,
      overall_score: a.overall_score
    }));

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this athlete's physical performance data over time and provide actionable insights:

${JSON.stringify(data, null, 2)}

Player: ${player.full_name}
Position: ${player.position}

Provide a concise analysis covering:
1. Key strengths (2-3 bullet points)
2. Areas for improvement (2-3 bullet points)
3. Trend analysis (are they improving, plateauing, or declining?)
4. Specific training recommendations

Be specific and reference actual numbers from the data.`,
      response_json_schema: {
        type: "object",
        properties: {
          strengths: { type: "array", items: { type: "string" } },
          improvements: { type: "array", items: { type: "string" } },
          trend_analysis: { type: "string" },
          recommendations: { type: "array", items: { type: "string" } }
        }
      }
    });

    setAiInsights(result);
    setLoadingInsights(false);
  };

  const chartData = assessments.map(a => ({
    date: new Date(a.assessment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Sprint: parseFloat(a.sprint?.toFixed(2)),
    Vertical: a.vertical,
    YIRT: a.yirt,
    Shuttle: parseFloat(a.shuttle?.toFixed(2))
  }));

  const scoreData = assessments.map(a => ({
    date: new Date(a.assessment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Speed: a.speed_score,
    Power: a.power_score,
    Endurance: a.endurance_score,
    Agility: a.agility_score
  }));

  const latest = assessments[assessments.length - 1];
  const previous = assessments[assessments.length - 2];

  const calculateChange = (current, prev) => {
    if (!prev) return null;
    return ((current - prev) / prev * 100).toFixed(1);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">{player?.full_name}</h1>
        <p className="text-slate-600 mt-1">Physical Performance Analytics</p>
      </div>

      {assessments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-slate-500">No assessment data available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Performance Summary */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-600" />
                Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-red-50 rounded-xl">
                  <div className="text-sm text-red-600 mb-1">Speed Score</div>
                  <div className="text-3xl font-bold text-red-700">{latest?.speed_score || 0}</div>
                  {previous && (
                    <div className={`text-xs mt-1 ${calculateChange(latest.speed_score, previous.speed_score) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {calculateChange(latest.speed_score, previous.speed_score) > 0 ? '↑' : '↓'} {Math.abs(calculateChange(latest.speed_score, previous.speed_score))}%
                    </div>
                  )}
                </div>
                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="text-sm text-blue-600 mb-1">Power Score</div>
                  <div className="text-3xl font-bold text-blue-700">{latest?.power_score || 0}</div>
                  {previous && (
                    <div className={`text-xs mt-1 ${calculateChange(latest.power_score, previous.power_score) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {calculateChange(latest.power_score, previous.power_score) > 0 ? '↑' : '↓'} {Math.abs(calculateChange(latest.power_score, previous.power_score))}%
                    </div>
                  )}
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl">
                  <div className="text-sm text-emerald-600 mb-1">Endurance Score</div>
                  <div className="text-3xl font-bold text-emerald-700">{latest?.endurance_score || 0}</div>
                  {previous && (
                    <div className={`text-xs mt-1 ${calculateChange(latest.endurance_score, previous.endurance_score) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {calculateChange(latest.endurance_score, previous.endurance_score) > 0 ? '↑' : '↓'} {Math.abs(calculateChange(latest.endurance_score, previous.endurance_score))}%
                    </div>
                  )}
                </div>
                <div className="p-4 bg-pink-50 rounded-xl">
                  <div className="text-sm text-pink-600 mb-1">Agility Score</div>
                  <div className="text-3xl font-bold text-pink-700">{latest?.agility_score || 0}</div>
                  {previous && (
                    <div className={`text-xs mt-1 ${calculateChange(latest.agility_score, previous.agility_score) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {calculateChange(latest.agility_score, previous.agility_score) > 0 ? '↑' : '↓'} {Math.abs(calculateChange(latest.agility_score, previous.agility_score))}%
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Trends */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Sprint" stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="Vertical" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="YIRT" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="Shuttle" stroke="#ec4899" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Score Breakdown */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Score Breakdown Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scoreData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Speed" fill="#ef4444" />
                  <Bar dataKey="Power" fill="#3b82f6" />
                  <Bar dataKey="Endurance" fill="#10b981" />
                  <Bar dataKey="Agility" fill="#ec4899" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-blue-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  AI-Powered Insights
                </CardTitle>
                <Button 
                  onClick={generateAIInsights} 
                  disabled={loadingInsights}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {loadingInsights ? 'Analyzing...' : aiInsights ? 'Refresh Insights' : 'Generate Insights'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {aiInsights ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-emerald-700 mb-2">💪 Key Strengths</h3>
                    <ul className="space-y-1">
                      {aiInsights.strengths?.map((s, i) => (
                        <li key={i} className="text-sm text-slate-700">• {s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-orange-700 mb-2">🎯 Areas for Improvement</h3>
                    <ul className="space-y-1">
                      {aiInsights.improvements?.map((s, i) => (
                        <li key={i} className="text-sm text-slate-700">• {s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-700 mb-2">📈 Trend Analysis</h3>
                    <p className="text-sm text-slate-700">{aiInsights.trend_analysis}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-700 mb-2">🏋️ Training Recommendations</h3>
                    <ul className="space-y-1">
                      {aiInsights.recommendations?.map((s, i) => (
                        <li key={i} className="text-sm text-slate-700">• {s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-slate-600 text-center py-8">Click "Generate Insights" to get AI-powered analysis</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}