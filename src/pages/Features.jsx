import React from 'react';
import { Users, BarChart3, Calendar, Target, TrendingUp, MessageSquare, Shield, Activity, Trophy, Star, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Features() {
  const features = [
    {
      icon: Users,
      title: 'Complete Player Profiles',
      description: 'Digital profiles with performance data, injury tracking, development goals, and parent communication.',
      color: 'emerald',
      image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691b4f505049805bdf639ffd/dce41a79e_Giada-M.jpeg'
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Physical assessments, technical evaluations, and AI-powered insights for data-driven development.',
      color: 'blue',
      image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691b4f505049805bdf639ffd/f70bcf1df_d05ee993-bdd5-40a8-b6f6-d83e6e8e794e-04-23-2025-06-31-32-436.jpg'
    },
    {
      icon: Target,
      title: 'Formation Builder',
      description: 'Interactive formation tools with depth charts, tryout management, and strategic planning.',
      color: 'purple',
      image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691b4f505049805bdf639ffd/c57a202f6_Jags-GA-2.jpg'
    },
    {
      icon: Calendar,
      title: 'Training Management',
      description: 'Schedule sessions, track attendance, and manage coach availability with integrated booking.',
      color: 'orange',
      image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691b4f505049805bdf639ffd/fd6c058de_Small-group-training.jpg'
    },
    {
      icon: TrendingUp,
      title: 'Development Pathways',
      description: 'Personalized training plans, skill matrices, and progress tracking for every player.',
      color: 'green',
      image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691b4f505049805bdf639ffd/bf69f6fda_camps-classes.jpg'
    },
    {
      icon: MessageSquare,
      title: 'Parent Portal',
      description: 'Keep parents informed with real-time updates, performance reports, and direct messaging.',
      color: 'pink',
      image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691b4f505049805bdf639ffd/1c4c46ec6_jags-GA-1.jpg'
    }
  ];

  const colorMap = {
    emerald: 'from-emerald-600 to-green-600',
    blue: 'from-blue-600 to-cyan-600',
    purple: 'from-purple-600 to-pink-600',
    orange: 'from-orange-600 to-red-600',
    green: 'from-green-600 to-emerald-600',
    pink: 'from-pink-600 to-purple-600'
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Hero */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-green-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Platform Features</h1>
          <p className="text-xl md:text-2xl text-emerald-100 max-w-3xl mx-auto">
            Everything you need to manage, develop, and track your soccer club's success
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-24">
            {features.map((feature, index) => (
              <div key={feature.title} className={`grid md:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                <div className={index % 2 === 1 ? 'md:order-2' : ''}>
                  <div className={`w-16 h-16 bg-gradient-to-br ${colorMap[feature.color]} rounded-2xl flex items-center justify-center mb-6 shadow-2xl hover:scale-110 transition-transform`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-4xl font-bold text-slate-900 mb-4">{feature.title}</h2>
                  <p className="text-lg text-slate-700 mb-6 leading-relaxed">{feature.description}</p>
                  
                  <div className="space-y-3">
                    {feature.title === 'Complete Player Profiles' && (
                      <>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                          <span className="text-slate-700">Track performance metrics over time</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                          <span className="text-slate-700">Manage injury history and recovery</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                          <span className="text-slate-700">Set and monitor development goals</span>
                        </div>
                      </>
                    )}
                    {feature.title === 'Advanced Analytics' && (
                      <>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                          <span className="text-slate-700">Physical testing benchmarks</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                          <span className="text-slate-700">Technical skill evaluations</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                          <span className="text-slate-700">Coach-generated recommendations</span>
                        </div>
                      </>
                    )}
                    {feature.title === 'Formation Builder' && (
                      <>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-purple-600" />
                          <span className="text-slate-700">Drag-and-drop formation editor</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-purple-600" />
                          <span className="text-slate-700">Position-based depth charts</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-purple-600" />
                          <span className="text-slate-700">Tryout and team assignment tools</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className={index % 2 === 1 ? 'md:order-1' : ''}>
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl h-96 group">
                    <img 
                      src={feature.image} 
                      alt={feature.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features List */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-slate-900 mb-12">More Powerful Features</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: 'Role-Based Access', desc: 'Secure permissions for admins, coaches, parents, and players' },
              { icon: Activity, title: 'Injury Tracking', desc: 'Monitor injuries, treatment plans, and recovery protocols' },
              { icon: Star, title: 'Player Comparison', desc: 'Compare players side-by-side with detailed metrics' },
              { icon: Trophy, title: 'Team Evaluations', desc: 'Comprehensive team performance assessments' },
              { icon: Target, title: 'Goal Setting', desc: 'AI-assisted goal creation and progress monitoring' },
              { icon: MessageSquare, title: 'Communications Hub', desc: 'Centralized messaging and announcements' }
            ].map(item => (
              <Card key={item.title} className="border-none shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all bg-white group">
                <CardHeader>
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}