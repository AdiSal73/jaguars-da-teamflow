import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subMonths, isAfter, isBefore } from 'date-fns';

export default function HistoricalTrendAnalytics({ teams, assessments, players }) {
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [timeRange, setTimeRange] = useState('6months');

  const getDateRange = () => {
    const now = new Date();
    switch(timeRange) {
      case '3months': return subMonths(now, 3);
      case '6months': return subMonths(now, 6);
      case '1year': return subMonths(now, 12);
      case 'all': return new Date(0);
      default: return subMonths(now, 6);
    }
  };

  const generateTrendData = () => {
    if (!selectedTeamId) return [];
    
    const teamPlayers = players?.filter(p => p.team_id === selectedTeamId) || [];
    const playerIds = teamPlayers?.map(p => p.id) || [];
    const teamAssessments = assessments
      .filter(a => playerIds.includes(a.player_id))
      .filter(a => isAfter(new Date(a.assessment_date), getDateRange()))
      .sort((a, b) => new Date(a.assessment_date) - new Date(b.assessment_date));

    const monthlyData = {};
    
    teamAssessments.forEach(assessment => {
      const monthKey = format(new Date(assessment.assessment_date), 'MMM yyyy');
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          assessments: [],
          speed: [],
          power: [],
          endurance: [],
          agility: [],
          overall: []
        };
      }
      monthlyData[monthKey].assessments.push(assessment);
      monthlyData[monthKey].speed.push(assessment.speed_score || 0);
      monthlyData[monthKey].power.push(assessment.power_score || 0);
      monthlyData[monthKey].endurance.push(assessment.endurance_score || 0);
      monthlyData[monthKey].agility.push(assessment.agility_score || 0);
      monthlyData[monthKey].overall.push(assessment.overall_score || 0);
    });

    return Object.values(monthlyData).map(month => ({
      month: month.month,
      Speed: Math.round(month.speed.reduce((a, b) => a + b, 0) / month.speed.length),
      Power: Math.round(month.power.reduce((a, b) => a + b, 0) / month.power.length),
      Endurance: Math.round(month.endurance.reduce((a, b) => a + b, 0) / month.endurance.length),
      Agility: Math.round(month.agility.reduce((a, b) => a + b, 0) / month.agility.length),
      Overall: Math.round(month.overall.reduce((a, b) => a + b, 0) / month.overall.length),
      count: month.assessments.length
    }));
  };

  const trendData = generateTrendData();

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">Historical Performance Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Select Team</label>
            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a team" />
              </SelectTrigger>
              <SelectContent>
                {teams?.map(team => (
                  <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Time Range</label>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedTeamId && trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Speed" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Power" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Endurance" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Agility" stroke="#ec4899" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Overall" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-slate-500">
            {selectedTeamId ? 'No historical data available for this time range' : 'Select a team to view historical trends'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}