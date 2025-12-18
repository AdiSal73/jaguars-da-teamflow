import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Users, TrendingUp, BarChart3, Target, Trophy, Star, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1920&q=80" 
            alt="Soccer Field" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/95 via-emerald-800/90 to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-12 h-12" />
              <h1 className="text-2xl font-bold">Michigan Jaguars</h1>
            </div>
            <h2 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Elevate Your Team's Performance
            </h2>
            <p className="text-xl md:text-2xl mb-8 text-emerald-100 max-w-2xl">
              Complete player development platform for soccer clubs. Track progress, analyze performance, and build championship teams.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-white text-emerald-900 hover:bg-emerald-50 text-lg px-8 py-6"
                onClick={() => navigate(createPageUrl('Players'))}
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6"
                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-emerald-600 mb-2">500+</div>
              <div className="text-slate-600">Active Players</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-emerald-600 mb-2">50+</div>
              <div className="text-slate-600">Teams</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-emerald-600 mb-2">30+</div>
              <div className="text-slate-600">Coaches</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-emerald-600 mb-2">12</div>
              <div className="text-slate-600">Branches</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Everything You Need to Develop Champions
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Comprehensive tools for player development, team management, and performance analysis
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all border-2 border-emerald-100">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Player Management</h3>
              <p className="text-slate-600 mb-6">
                Complete player profiles with performance tracking, injury history, development goals, and parent communication tools.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mr-2" />
                  Digital player profiles
                </li>
                <li className="flex items-center text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mr-2" />
                  Performance tracking
                </li>
                <li className="flex items-center text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mr-2" />
                  Parent portal access
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all border-2 border-blue-100">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Analytics & Insights</h3>
              <p className="text-slate-600 mb-6">
                Advanced analytics for physical assessments, technical evaluations, and team comparisons with AI-powered insights.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-blue-600 mr-2" />
                  Physical testing analytics
                </li>
                <li className="flex items-center text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-blue-600 mr-2" />
                  Technical evaluations
                </li>
                <li className="flex items-center text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-blue-600 mr-2" />
                  AI-powered recommendations
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all border-2 border-purple-100">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Team Development</h3>
              <p className="text-slate-600 mb-6">
                Formation builders, depth charts, tryout management, and strategic planning tools for optimal team composition.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-purple-600 mr-2" />
                  Formation builder
                </li>
                <li className="flex items-center text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-purple-600 mr-2" />
                  Tryout management
                </li>
                <li className="flex items-center text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-purple-600 mr-2" />
                  Depth chart visualization
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">
                Comprehensive Player Development
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Track every aspect of player growth with our integrated development pathways, from technical skills to physical fitness and mental resilience.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Progress Tracking</h4>
                    <p className="text-slate-600 text-sm">Monitor player development across all key performance indicators</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Star className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Personalized Goals</h4>
                    <p className="text-slate-600 text-sm">AI-generated development plans tailored to each player</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Performance Benchmarks</h4>
                    <p className="text-slate-600 text-sm">Compare against age group standards and elite benchmarks</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&q=80" 
                  alt="Player Development" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-xl border-2 border-emerald-100">
                <div className="text-3xl font-bold text-emerald-600 mb-1">95%</div>
                <div className="text-sm text-slate-600">Player Improvement Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-emerald-600 to-green-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Club?
          </h2>
          <p className="text-xl mb-8 text-emerald-100">
            Join Michigan Jaguars in building the future of soccer development
          </p>
          <Button 
            size="lg" 
            className="bg-white text-emerald-900 hover:bg-emerald-50 text-lg px-8 py-6"
            onClick={() => navigate(createPageUrl('Players'))}
          >
            Start Your Journey
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-emerald-500" />
              <span className="text-white font-bold text-lg">Michigan Jaguars</span>
            </div>
            <p className="text-sm">© 2025 Michigan Jaguars. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}