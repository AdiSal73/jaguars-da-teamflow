import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Target, Users, Trophy, TrendingUp, Zap } from 'lucide-react';

export default function PDPViewer() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-600 to-green-600 rounded-full mb-4">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-2">
            Michigan Jaguars
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">Player Development Program</h2>
          <p className="text-slate-600">A comprehensive framework for soccer excellence</p>
        </div>

        {/* Mission Statement */}
        <Card className="mb-6 border-none shadow-xl bg-white/80 backdrop-blur">
          <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Mission Statement
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-slate-700 leading-relaxed">
              Michigan Jaguars FC was founded in 1989 in Southeast Michigan. We focus on training our players to become quality players while gaining lifelong lessons and experiences. We are committed to developing strong relationships with our players, families, and community businesses and organizations. Our mission is to create the best possible soccer experience for every player, regardless of skill level.
            </p>
          </CardContent>
        </Card>

        {/* Core Values */}
        <Card className="mb-6 border-none shadow-xl bg-white/80 backdrop-blur">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Core Values
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg">
                <h3 className="font-bold text-emerald-900 mb-2">🤝 Respect</h3>
                <p className="text-sm text-slate-700">Encompasses every aspect of what we do. Respect toward our players, opposition, referees and the environment that we are in. A core portion of leadership through service.</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
                <h3 className="font-bold text-blue-900 mb-2">🎯 Unity</h3>
                <p className="text-sm text-slate-700">Unity within our club creates a supportive and inclusive environment. This value emphasizes teamwork, cooperation and building relationships both on and off the field.</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                <h3 className="font-bold text-purple-900 mb-2">📈 Development/Growth</h3>
                <p className="text-sm text-slate-700">Focus on the holistic improvement of players. We want to help them develop as people along with their individual and team development.</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg">
                <h3 className="font-bold text-orange-900 mb-2">⚡ Competitiveness</h3>
                <p className="text-sm text-slate-700">Creating an environment that strives for excellence and is always looking to be at their best. We cannot guarantee results, but the attitude and approach is something that is under our control.</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg col-span-full">
                <h3 className="font-bold text-yellow-900 mb-2">😊 Enjoyment</h3>
                <p className="text-sm text-slate-700">Soccer is a game and games at their core should be fun. We all became involved in the sport because we had fun doing it and hopefully that is still the case.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Game Model Philosophy */}
        <Card className="mb-6 border-none shadow-xl bg-white/80 backdrop-blur">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Game Model & Philosophy
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg">
                <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">1</div>
                <div>
                  <h4 className="font-bold text-emerald-900">Win the challenge</h4>
                  <p className="text-sm text-slate-700">(tackle, header, game, league)</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">2</div>
                <div>
                  <h4 className="font-bold text-blue-900">Be aggressive and always on the front foot</h4>
                  <p className="text-sm text-slate-700">Proactive, not reactive approach to the game</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">3</div>
                <div>
                  <h4 className="font-bold text-purple-900">Possession that is meaningful</h4>
                  <p className="text-sm text-slate-700">Quality over quantity in ball retention</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-pink-50 rounded-lg">
                <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">4</div>
                <div>
                  <h4 className="font-bold text-pink-900">Play confident and creative soccer</h4>
                  <p className="text-sm text-slate-700">Take risks, failure is valuable</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">5</div>
                <div>
                  <h4 className="font-bold text-orange-900">Be positive in transition</h4>
                  <p className="text-sm text-slate-700">Quick, decisive actions when transitioning</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">6</div>
                <div>
                  <h4 className="font-bold text-red-900">Defend zonally but aggressively</h4>
                  <p className="text-sm text-slate-700">Can we find moments to press</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Age-Appropriate Training */}
        <Card className="mb-6 border-none shadow-xl bg-white/80 backdrop-blur">
          <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Age-Appropriate Development Stages
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border-l-4 border-blue-600">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-blue-600">Stage 1</Badge>
                  <h3 className="font-bold text-blue-900">Discovery (U7-U10)</h3>
                </div>
                <p className="text-sm text-slate-700">Players develop the most important basic movement skills, which constitute the foundation of future development. Training should be fun, and the focus should be on developing the very basic (fundamental) skills.</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg border-l-4 border-emerald-600">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-emerald-600">Stage 2</Badge>
                  <h3 className="font-bold text-emerald-900">Learning to Train (U11-U12)</h3>
                </div>
                <p className="text-sm text-slate-700">Players learn to train at this stage, and to find motivation from learning new things. The physical work on the body begins together with an understanding of what training is and how to approach it.</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-l-4 border-purple-600">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-purple-600">Stage 3</Badge>
                  <h3 className="font-bold text-purple-900">Development (U13-U15)</h3>
                </div>
                <p className="text-sm text-slate-700">In addition to the general development of the soccer player, the ability to meet the demands of competition (winning) starts to become more important. Training is directed towards competition, and is more specific than previously.</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border-l-4 border-orange-600">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-orange-600">Stage 4</Badge>
                  <h3 className="font-bold text-orange-900">Learning to Win (U16-U19)</h3>
                </div>
                <p className="text-sm text-slate-700">The ability to win competitions is prioritized in addition to the player's development. Training should be optimized using periodization so that overtraining is avoided.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Training Methodology */}
        <Card className="mb-6 border-none shadow-xl bg-white/80 backdrop-blur">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Training Methodology & Periodization
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <p className="text-slate-700 leading-relaxed">
                Our training methodology is built on <strong>Tactical Periodization</strong>, which integrates physical, technical, tactical, and psychological aspects of the game into a cohesive training structure.
              </p>
              
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg">
                <h4 className="font-bold text-indigo-900 mb-2">Key Principles:</h4>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span><strong>Specificity:</strong> Training exercises directly relate to our game model</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span><strong>Progression:</strong> Systematic increase in complexity and intensity</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span><strong>Alternation:</strong> Balance between work and recovery</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span><strong>Integration:</strong> Physical conditioning happens through tactical work</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Individual Development Plan */}
        <Card className="mb-6 border-none shadow-xl bg-white/80 backdrop-blur">
          <CardHeader className="bg-gradient-to-r from-pink-600 to-rose-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Individual Development Plan (IDP)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-slate-700 leading-relaxed mb-4">
              Every player has unique strengths, weaknesses, and development needs. Our Individual Development Plan approach ensures personalized attention and targeted growth for each player.
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg">
                <h4 className="font-bold text-pink-900 mb-2">Assessment</h4>
                <p className="text-sm text-slate-700">Regular evaluations to identify current level and areas for improvement</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg">
                <h4 className="font-bold text-rose-900 mb-2">Goal Setting</h4>
                <p className="text-sm text-slate-700">Collaborative setting of short-term and long-term development goals</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg">
                <h4 className="font-bold text-pink-900 mb-2">Action Plan</h4>
                <p className="text-sm text-slate-700">Specific training modules and exercises tailored to individual needs</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg">
                <h4 className="font-bold text-rose-900 mb-2">Progress Tracking</h4>
                <p className="text-sm text-slate-700">Continuous monitoring and adjustment of the development pathway</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Environment and Culture */}
        <Card className="mb-6 border-none shadow-xl bg-white/80 backdrop-blur">
          <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
            <CardTitle>Environment and Culture</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-slate-700 leading-relaxed mb-4">
              A quality soccer environment is critical for the development of both the player and person. Our environment is headed by <strong>Leadership Through Service</strong>, where our players feel safe and enjoy their experience.
            </p>
            
            <div className="grid md:grid-cols-3 gap-3">
              {['Safety', 'Standards', 'Humility', 'Humor', 'Belief', 'Planning'].map((item, idx) => (
                <div key={idx} className="p-3 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg text-center">
                  <div className="font-bold text-emerald-900">{item}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-slate-600 text-sm mt-8 pb-8">
          <p>Michigan Jaguars FC Player Development Program © 2025</p>
          <p className="mt-1">Building excellence through comprehensive player development</p>
        </div>
      </div>
    </div>
  );
}