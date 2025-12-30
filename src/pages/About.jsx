import React from 'react';
import { Shield, Target, Users, Heart, Trophy, MapPin, TrendingUp, Award, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691b4f505049805bdf639ffd/1c4c46ec6_jags-GA-1.jpg"
            alt="Michigan Jaguars Team"
            className="w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/95 via-emerald-800/85 to-green-900/90" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center text-white">
          <div className="flex items-center justify-center gap-3 mb-6">
            <img 
              src="https://jaguarsidp.com/wp-content/uploads/2024/03/Jaguars-logo.png" 
              alt="Michigan Jaguars" 
              className="w-24 h-24 animate-bounce-slow"
            />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">Michigan Jaguars</h1>
          <p className="text-2xl md:text-3xl text-emerald-200 font-light">
            Player Development Program 2025
          </p>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-6">Our Mission</h2>
            <p className="text-xl text-slate-700 leading-relaxed max-w-4xl mx-auto">
              Founded in 2005, Michigan Jaguars is a Michigan-based youth soccer club dedicated to player development. 
              We strive to provide unique and inclusive soccer experiences while building meaningful relationships 
              and community across our 12 branches statewide.
            </p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-emerald-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-slate-900 mb-4">Core Values</h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            The foundation of everything we do at Michigan Jaguars
          </p>
          
          <div className="grid md:grid-cols-5 gap-6">
            <Card className="border-none shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Respect</h3>
                <p className="text-sm text-slate-600">For self, teammates, opponents, and the game</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Unity</h3>
                <p className="text-sm text-slate-600">Emphasizing teamwork and collaboration</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Development/Growth</h3>
                <p className="text-sm text-slate-600">Continuous improvement on and off the field</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Competitiveness</h3>
                <p className="text-sm text-slate-600">Striving for excellence in every match</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Enjoyment</h3>
                <p className="text-sm text-slate-600">Fostering love and passion for soccer</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Game Model & Philosophy */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-slate-900 mb-4">Game Model & Philosophy</h2>
          <p className="text-center text-slate-600 mb-12 max-w-3xl mx-auto">
            Our playing style is defined by six key tenets that guide how we train and compete
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Aggressive Defending', desc: 'High-pressure, proactive defense that wins the ball back quickly' },
              { title: 'Possession-Based Attack', desc: 'Patient build-up play with purpose and creativity' },
              { title: 'Quick Transitions', desc: 'Rapid counter-attacks and immediate defensive organization' },
              { title: 'Vertical Play', desc: 'Moving the ball forward efficiently when opportunities arise' },
              { title: 'Technical Excellence', desc: 'Strong individual skills in all aspects of the game' },
              { title: 'Tactical Intelligence', desc: 'Understanding roles, responsibilities, and decision-making' }
            ].map((tenet, idx) => (
              <Card key={idx} className="border-emerald-200 hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <span className="text-emerald-700 font-bold">{idx + 1}</span>
                    </div>
                    <h3 className="font-bold text-slate-900">{tenet.title}</h3>
                  </div>
                  <p className="text-sm text-slate-600">{tenet.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Development Stages */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-slate-900 mb-4">Development Stages</h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            Age-appropriate training tailored to each player's developmental needs
          </p>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-none shadow-xl bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardContent className="p-8">
                <div className="text-blue-600 font-bold mb-2">U7-U10</div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Discovery</h3>
                <p className="text-slate-700">Focus on fun, exploration, and developing a love for the game through play-based learning.</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-gradient-to-br from-emerald-50 to-green-50">
              <CardContent className="p-8">
                <div className="text-emerald-600 font-bold mb-2">U11-U13</div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Foundation</h3>
                <p className="text-slate-700">Building technical skills, tactical awareness, and understanding of positional roles.</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-gradient-to-br from-purple-50 to-pink-50">
              <CardContent className="p-8">
                <div className="text-purple-600 font-bold mb-2">U14-U15</div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Development</h3>
                <p className="text-slate-700">Refining skills, tactical complexity, and physical conditioning as players mature.</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-gradient-to-br from-orange-50 to-red-50">
              <CardContent className="p-8">
                <div className="text-orange-600 font-bold mb-2">U16-U19</div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Learning to Win</h3>
                <p className="text-slate-700">Preparing players for competitive excellence and next-level opportunities.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Training Methodology */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-slate-900 mb-4">Training Methodology</h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            Tactical Periodization: A holistic approach to player development
          </p>

          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-8 mb-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Key Principles</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Specificity</h4>
                  <p className="text-sm text-slate-700">Training mimics game situations and our playing style</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Progression</h4>
                  <p className="text-sm text-slate-700">Gradual increase in complexity and intensity</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Alternation</h4>
                  <p className="text-sm text-slate-700">Varied training loads for optimal recovery</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Integration</h4>
                  <p className="text-sm text-slate-700">Technical, tactical, physical, and mental aspects combined</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Individual Development Plan */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">Individual Development Plan (IDP)</h2>
              <p className="text-lg text-slate-700 mb-6">
                Every player receives a personalized development roadmap through our comprehensive IDP process:
              </p>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">1</div>
                  <div>
                    <h4 className="font-bold text-slate-900">Assessment</h4>
                    <p className="text-sm text-slate-600">Regular evaluations of technical, tactical, physical, and mental attributes</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">2</div>
                  <div>
                    <h4 className="font-bold text-slate-900">Goal Setting</h4>
                    <p className="text-sm text-slate-600">Collaborative creation of specific, measurable objectives</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">3</div>
                  <div>
                    <h4 className="font-bold text-slate-900">Action Planning</h4>
                    <p className="text-sm text-slate-600">Customized training plans and recommendations</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">4</div>
                  <div>
                    <h4 className="font-bold text-slate-900">Progress Tracking</h4>
                    <p className="text-sm text-slate-600">Ongoing monitoring and adjustment of development plans</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691b4f505049805bdf639ffd/c57a202f6_Jags-GA-2.jpg"
                alt="Training Session"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Branches */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Our Locations</h2>
            <p className="text-xl text-slate-600">12 branches serving communities across Michigan</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {['CW3', 'Dearborn', 'Downriver', 'Genesee', 'Huron Valley', 'Jackson', 'Lansing', 'Marshall', 'Northville', 'Novi', 'Rochester Romeo', 'West Bloomfield'].map((branch) => (
              <div key={branch} className="bg-white p-4 rounded-xl shadow-lg border-2 border-emerald-100 hover:border-emerald-300 transition-all text-center">
                <MapPin className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
                <div className="font-semibold text-slate-900">{branch}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Culture & Environment */}
      <section className="py-20 bg-gradient-to-b from-emerald-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Environment & Culture</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              We are committed to providing a safe, respectful, and enjoyable environment where every player 
              can develop their love for soccer and reach their full potential.
            </p>
          </div>

          <div className="bg-gradient-to-br from-white to-emerald-50 rounded-2xl p-8 shadow-xl">
            <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">Leadership Through Service</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-bold text-slate-900 mb-2">Character Building</h4>
                <p className="text-sm text-slate-600">Developing integrity, discipline, and sportsmanship</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-bold text-slate-900 mb-2">Community Impact</h4>
                <p className="text-sm text-slate-600">Giving back and making a positive difference</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-bold text-slate-900 mb-2">Lifelong Success</h4>
                <p className="text-sm text-slate-600">Skills that extend beyond the soccer field</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}