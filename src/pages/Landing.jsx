import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Shield, Users, TrendingUp, BarChart3, Target, Trophy, Star, CheckCircle, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';

export default function Landing() {
  const navigate = useNavigate();

  const handleGetStarted = async () => {
    const isAuth = await base44.auth.isAuthenticated();
    if (isAuth) {
      navigate(createPageUrl('Analytics'));
    } else {
      base44.auth.redirectToLogin();
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-white" />
              <span className="text-white font-bold text-lg">Michigan Jaguars</span>
            </div>
            <div className="flex items-center gap-6">
              <button onClick={() => navigate(createPageUrl('About'))} className="text-white hover:text-emerald-200 transition-colors">About</button>
              <button onClick={() => navigate(createPageUrl('Features'))} className="text-white hover:text-emerald-200 transition-colors">Features</button>
              <button onClick={() => navigate(createPageUrl('FAQ'))} className="text-white hover:text-emerald-200 transition-colors">FAQ</button>
              <Button onClick={handleGetStarted} className="bg-white text-emerald-600 hover:bg-emerald-50">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691b4f505049805bdf639ffd/bf69f6fda_camps-classes.jpg"
            alt="Michigan Jaguars Training"
            className="w-full h-full object-cover animate-ken-burns" />

          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/95 via-emerald-800/85 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.3)_100%)]" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-12 h-12" />
              <h1 className="text-2xl font-bold">Michigan Jaguars</h1>
            </div>
            <h2 className="text-5xl md:text-7xl font-bold mb-6 leading-tight animate-fade-in-up">
              Develop Champions<br />
              <span className="text-emerald-300">Through Data</span>
            </h2>
            <p className="text-xl md:text-2xl mb-8 text-emerald-100 max-w-2xl animate-fade-in-up-delay">
              Complete player development platform for elite soccer clubs. Track progress, analyze performance, and build championship teams.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-white text-emerald-900 hover:bg-emerald-50 text-lg px-8 py-6"
                onClick={handleGetStarted}>

                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline" className="bg-gray-950 text-white px-8 py-6 text-lg font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow-sm hover:text-accent-foreground h-10 border-2 border-white hover:bg-white/10"

                onClick={() => navigate(createPageUrl('Features'))}>

                Explore Features
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform">500+</div>
              <div className="text-slate-400 text-lg">Active Players</div>
            </div>
            <div className="text-center group">
              <div className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform">50+</div>
              <div className="text-slate-400 text-lg">Competitive Teams</div>
            </div>
            <div className="text-center group">
              <div className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform">30+</div>
              <div className="text-slate-400 text-lg">Expert Coaches</div>
            </div>
            <div className="text-center group">
              <div className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform">12</div>
              <div className="text-slate-400 text-lg">Michigan Branches</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Comprehensive Development Platform
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Everything you need to track player growth and build winning teams
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="border-none shadow-xl hover:shadow-2xl transition-all overflow-hidden group">
              <div className="h-48 overflow-hidden">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691b4f505049805bdf639ffd/dce41a79e_Giada-M.jpeg"
                  alt="Player Development"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />

              </div>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 -mt-12 relative z-10 shadow-lg">
                  <Users className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Player Management</h3>
                <p className="text-slate-600 mb-4">
                  Complete digital profiles with performance tracking, injury monitoring, and personalized development pathways.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-slate-600">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mr-2" />
                    Digital player profiles
                  </li>
                  <li className="flex items-center text-sm text-slate-600">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mr-2" />
                    Performance analytics
                  </li>
                  <li className="flex items-center text-sm text-slate-600">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mr-2" />
                    Parent portal access
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl hover:shadow-2xl transition-all overflow-hidden group">
              <div className="h-48 overflow-hidden">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691b4f505049805bdf639ffd/f70bcf1df_d05ee993-bdd5-40a8-b6f6-d83e6e8e794e-04-23-2025-06-31-32-436.jpg"
                  alt="Analytics"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />

              </div>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 -mt-12 relative z-10 shadow-lg">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Advanced Analytics</h3>
                <p className="text-slate-600 mb-4">
                  Data-driven insights for physical assessments, technical evaluations, and AI-powered recommendations.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-slate-600">
                    <CheckCircle className="w-4 h-4 text-blue-600 mr-2" />
                    Physical testing metrics
                  </li>
                  <li className="flex items-center text-sm text-slate-600">
                    <CheckCircle className="w-4 h-4 text-blue-600 mr-2" />
                    Technical skill evaluations
                  </li>
                  <li className="flex items-center text-sm text-slate-600">
                    <CheckCircle className="w-4 h-4 text-blue-600 mr-2" />
                    AI development plans
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl hover:shadow-2xl transition-all overflow-hidden group">
              <div className="h-48 overflow-hidden">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691b4f505049805bdf639ffd/c57a202f6_Jags-GA-2.jpg"
                  alt="Team Development"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />

              </div>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 -mt-12 relative z-10 shadow-lg">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Team Development</h3>
                <p className="text-slate-600 mb-4">
                  Formation builders, depth charts, and tryout management for optimal team composition.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-slate-600">
                    <CheckCircle className="w-4 h-4 text-purple-600 mr-2" />
                    Interactive formations
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
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Image Showcase */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691b4f505049805bdf639ffd/1c4c46ec6_jags-GA-1.jpg"
                alt="Michigan Jaguars Team"
                className="w-full h-full object-cover" />

            </div>
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">Elite Training Programs</h2>
              <p className="text-lg text-slate-700 mb-6">
                Our comprehensive training programs are designed to develop technical skills, tactical awareness, 
                and mental resilience. Players train in a competitive environment that pushes them to reach 
                their full potential.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Competitive Excellence</h4>
                    <p className="text-slate-600 text-sm">Girls Academy, Aspire, and United league competition</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Star className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Expert Coaching</h4>
                    <p className="text-slate-600 text-sm">Licensed coaches with professional playing and coaching experience</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Year-Round Development</h4>
                    <p className="text-slate-600 text-sm">Training camps, individual sessions, and competitive matches</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Small Group Training */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <h2 className="text-4xl font-bold text-slate-900 mb-6">Personalized Development</h2>
              <p className="text-lg text-slate-700 mb-6">
                Every player receives a personalized development pathway with AI-assisted goal setting, 
                custom training modules, and progress tracking. Our platform ensures no player is left behind.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-emerald-100">
                  <div className="text-3xl font-bold text-emerald-600 mb-1">1:1</div>
                  <div className="text-sm text-slate-600">Coach Ratio</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-blue-100">
                  <div className="text-3xl font-bold text-blue-600 mb-1">24/7</div>
                  <div className="text-sm text-slate-600">Portal Access</div>
                </div>
              </div>
            </div>
            <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl order-1 md:order-2">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691b4f505049805bdf639ffd/fd6c058de_Small-group-training.jpg"
                alt="Small Group Training"
                className="w-full h-full object-cover" />

            </div>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Built for Modern Soccer Development
            </h2>
            <p className="text-xl text-slate-600">
              Cutting-edge tools designed specifically for youth soccer clubs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
            { icon: Users, title: 'Player Profiles', desc: 'Complete digital records' },
            { icon: BarChart3, title: 'Analytics', desc: 'Performance insights' },
            { icon: Target, title: 'Formation Tools', desc: 'Tactical planning' },
            { icon: TrendingUp, title: 'Progress Tracking', desc: 'Development metrics' },
            { icon: Calendar, title: 'Session Booking', desc: 'Coach availability' },
            { icon: Shield, title: 'Injury Tracking', desc: 'Medical records' },
            { icon: Trophy, title: 'Evaluations', desc: 'Skills assessment' },
            { icon: Star, title: 'AI Insights', desc: 'Smart recommendations' }].
            map((item, i) =>
            <div key={i} className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-xl shadow-lg border-2 border-slate-100 hover:border-emerald-300 hover:shadow-xl transition-all">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-bold text-slate-900 mb-2">{item.title}</h4>
                <p className="text-sm text-slate-600">{item.desc}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-emerald-600 to-green-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Elevate Your Game?
          </h2>
          <p className="text-xl mb-8 text-emerald-100">
            Join Michigan Jaguars and experience the future of soccer development
          </p>
          <Button
            size="lg"
            className="bg-white text-emerald-900 hover:bg-emerald-50 text-lg px-8 py-6"
            onClick={handleGetStarted}>

            Get Started Today
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-emerald-500" />
              <span className="text-white font-bold text-lg">Michigan Jaguars</span>
            </div>
            <div className="flex gap-6">
              <button onClick={() => navigate(createPageUrl('About'))} className="hover:text-white transition-colors">About</button>
              <button onClick={() => navigate(createPageUrl('Features'))} className="hover:text-white transition-colors">Features</button>
              <button onClick={() => navigate(createPageUrl('FAQ'))} className="hover:text-white transition-colors">FAQ</button>
            </div>
            <p className="text-sm">© 2025 Michigan Jaguars. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>);

}