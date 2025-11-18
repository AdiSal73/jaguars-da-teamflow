import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Activity, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function Assessments() {
  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => base44.entities.PhysicalAssessment.list('-assessment_date')
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const calculateOverallScore = (assessment) => {
    const speed = assessment.speed || 0;
    const agility = assessment.agility || 0;
    const power = assessment.power || 0;
    const endurance = assessment.endurance || 0;
    return Math.round(((5 * speed) + agility + (3 * power) + (6 * endurance)) / 60);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Physical Assessments</h1>
        <p className="text-slate-600 mt-1">Monitor athletic performance and fitness levels</p>
      </div>

      {assessments.length === 0 ? (
        <Card className="border-none shadow-lg">
          <CardContent className="p-12 text-center">
            <Activity className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Assessments Yet</h3>
            <p className="text-slate-600">Start tracking physical performance from player profiles</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assessments.map(assessment => {
            const player = players.find(p => p.id === assessment.player_id);
            const overallScore = calculateOverallScore(assessment);
            
            return (
              <Link key={assessment.id} to={`${createPageUrl('PlayerProfile')}?id=${assessment.player_id}`}>
                <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{player?.full_name || 'Player'}</h3>
                        <p className="text-xs text-slate-600">{new Date(assessment.assessment_date).toLocaleDateString()}</p>
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