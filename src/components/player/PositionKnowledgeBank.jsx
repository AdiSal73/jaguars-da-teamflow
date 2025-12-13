import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { POSITION_KNOWLEDGE } from '../constants/positionKnowledgeBank';

export default function PositionKnowledgeBank({ position }) {
  const knowledge = POSITION_KNOWLEDGE[position];

  if (!knowledge) {
    return null;
  }

  const categoryColors = {
    attacking_organized: 'from-emerald-500 to-green-600',
    attacking_final_third: 'from-blue-500 to-cyan-600',
    attacking_transition: 'from-purple-500 to-pink-600',
    defending_organized: 'from-orange-500 to-red-600',
    defending_final_third: 'from-red-500 to-rose-600',
    defending_transition: 'from-yellow-500 to-orange-600'
  };

  const categoryIcons = {
    attacking_organized: '🎯',
    attacking_final_third: '⚽',
    attacking_transition: '⚡',
    defending_organized: '🛡️',
    defending_final_third: '🚫',
    defending_transition: '🔄'
  };

  return (
    <Card className="border-none shadow-lg bg-gradient-to-br from-slate-50 to-white">
      <CardHeader className="border-b bg-gradient-to-r from-emerald-50 via-blue-50 to-purple-50">
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-600" />
          {knowledge.name} Knowledge Bank
        </CardTitle>
        <p className="text-xs text-slate-600 mt-1">Position-specific tactical responsibilities and key skills</p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(knowledge.categories).map(([key, category]) => (
            <div key={key} className={`rounded-xl overflow-hidden shadow-md border-2 ${key.includes('attacking') ? 'border-emerald-200' : 'border-red-200'}`}>
              <div className={`bg-gradient-to-r ${categoryColors[key]} p-4 text-white`}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{categoryIcons[key]}</span>
                  <h3 className="font-bold text-base">{category.title}</h3>
                </div>
              </div>
              <div className="bg-white p-4">
                <ul className="space-y-2">
                  {category.points.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-emerald-600 font-bold mt-0.5">•</span>
                      <span className="text-slate-700 leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <p className="text-sm text-slate-700 font-medium mb-1">💡 Training Focus Areas</p>
          <p className="text-sm text-slate-600">
            These skills represent the core competencies for the {knowledge.name} position. 
            Focus training sessions on improving weaknesses and maintaining strengths across all six tactical phases.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}