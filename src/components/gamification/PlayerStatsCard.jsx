import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, BookOpen, TrendingUp, Flame } from 'lucide-react';

export default function PlayerStatsCard({ progress, player }) {
  const level = progress?.level || 1;
  const totalPoints = progress?.total_points || 0;
  const achievements = progress?.achievements || {};
  const badges = progress?.badges || [];

  const pointsToNextLevel = level * 100;
  const currentLevelPoints = totalPoints % 100;
  const progressPercentage = (currentLevelPoints / pointsToNextLevel) * 100;

  const recentBadges = badges.slice(0, 3);

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs text-purple-600 font-semibold">Player Level</div>
            <div className="text-3xl font-bold text-purple-900">{level}</div>
          </div>
          <Trophy className="w-10 h-10 text-purple-500" />
        </div>

        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-600">Progress to Level {level + 1}</span>
            <span className="font-bold text-purple-600">{currentLevelPoints}/{pointsToNextLevel}</span>
          </div>
          <div className="w-full h-2 bg-purple-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-white/60 rounded-lg p-2 flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-600" />
            <div>
              <div className="text-xs text-slate-600">Goals Done</div>
              <div className="font-bold text-emerald-900">{achievements.goals_completed || 0}</div>
            </div>
          </div>
          <div className="bg-white/60 rounded-lg p-2 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <div>
              <div className="text-xs text-slate-600">Modules</div>
              <div className="font-bold text-blue-900">{achievements.modules_completed || 0}</div>
            </div>
          </div>
          <div className="bg-white/60 rounded-lg p-2 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-600" />
            <div>
              <div className="text-xs text-slate-600">Streak</div>
              <div className="font-bold text-orange-900">{achievements.streak_days || 0} days</div>
            </div>
          </div>
          <div className="bg-white/60 rounded-lg p-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <div>
              <div className="text-xs text-slate-600">Total Points</div>
              <div className="font-bold text-purple-900">{totalPoints}</div>
            </div>
          </div>
        </div>

        {recentBadges.length > 0 && (
          <div>
            <div className="text-xs text-purple-600 font-semibold mb-2">Recent Badges</div>
            <div className="flex gap-2">
              {recentBadges.map((badge, idx) => (
                <div 
                  key={idx} 
                  className="bg-white/80 rounded-lg p-2 text-center flex-1"
                  title={badge.description}
                >
                  <div className="text-2xl mb-1">{badge.icon}</div>
                  <div className="text-[9px] font-semibold text-slate-700 line-clamp-1">{badge.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}