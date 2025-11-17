import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ClipboardList, TrendingUp, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function Evaluations() {
  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations'],
    queryFn: () => base44.entities.Evaluation.list('-evaluation_date')
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Performance Evaluations</h1>
        <p className="text-slate-600 mt-1">Track player development and progress</p>
      </div>

      {evaluations.length === 0 ? (
        <Card className="border-none shadow-lg">
          <CardContent className="p-12 text-center">
            <ClipboardList className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Evaluations Yet</h3>
            <p className="text-slate-600">Start evaluating players from their profile pages</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {evaluations.map(evaluation => {
            const player = players.find(p => p.id === evaluation.player_id);
            
            return (
              <Link key={evaluation.id} to={`${createPageUrl('PlayerProfile')}?id=${evaluation.player_id}`}>
                <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
                          <User className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-slate-900 mb-1">
                            {player?.full_name || 'Player'}
                          </h3>
                          <p className="text-sm text-slate-600 mb-3">
                            {new Date(evaluation.evaluation_date).toLocaleDateString()} • 
                            {evaluation.evaluator_name ? ` by ${evaluation.evaluator_name}` : ' Evaluation'}
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <div>
                              <div className="text-xs text-slate-500">Technical</div>
                              <div className="text-sm font-semibold text-slate-900">{evaluation.technical_skills}/10</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500">Tactical</div>
                              <div className="text-sm font-semibold text-slate-900">{evaluation.tactical_awareness}/10</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500">Physical</div>
                              <div className="text-sm font-semibold text-slate-900">{evaluation.physical_attributes}/10</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500">Mental</div>
                              <div className="text-sm font-semibold text-slate-900">{evaluation.mental_attributes}/10</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500">Teamwork</div>
                              <div className="text-sm font-semibold text-slate-900">{evaluation.teamwork}/10</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="flex items-center gap-2 text-emerald-600 mb-1">
                          <TrendingUp className="w-5 h-5" />
                          <span className="text-3xl font-bold">{evaluation.overall_rating}</span>
                        </div>
                        <div className="text-xs text-slate-500">Overall</div>
                      </div>
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