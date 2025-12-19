import React from 'react';
import { Shield, Target, Users, Heart, Trophy, MapPin } from 'lucide-react';
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
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse at top, rgba(16, 185, 129, 0.2) 0%, transparent 60%)'
          }} />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center text-white">
          <div className="flex items-center justify-center gap-3 mb-6 animate-bounce-slow">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-2xl">
              <Shield className="w-12 h-12" />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">About Michigan Jaguars</h1>
          <p className="text-2xl md:text-3xl text-emerald-200 font-light">
            Building Champions On and Off the Field
          </p>
          <div className="mt-8 flex items-center justify-center gap-4 text-emerald-300">
            <div className="h-px w-16 bg-emerald-300"></div>
            <Trophy className="w-6 h-6" />
            <div className="h-px w-16 bg-emerald-300"></div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <Card className="border-none shadow-2xl bg-gradient-to-br from-emerald-50 to-green-50">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Our Mission</h3>
                <p className="text-slate-700 leading-relaxed">
                  To provide elite soccer training and development opportunities for young athletes across Michigan, 
                  fostering both athletic excellence and personal growth through dedication, teamwork, and passion for the game.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-2xl bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Our Vision</h3>
                <p className="text-slate-700 leading-relaxed">
                  To be the premier youth soccer development organization in Michigan, known for producing 
                  skilled players, successful teams, and well-rounded individuals prepared for the next level.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">Our Story</h2>
              <div className="space-y-4 text-slate-700 leading-relaxed">
                <p>
                  Michigan Jaguars was founded with a vision to provide world-class soccer development 
                  opportunities for young athletes throughout Michigan. What started as a single team 
                  has grown into a comprehensive club spanning 12 branches across the state.
                </p>
                <p>
                  Our club is built on the foundation of player-first development, emphasizing technical 
                  excellence, tactical understanding, and mental resilience. We believe in nurturing not 
                  just great soccer players, but exceptional individuals.
                </p>
                <p>
                  Today, Michigan Jaguars is home to over 500 players, 30+ coaches, and 50+ teams 
                  competing at various levels including Girls Academy, Aspire, and United leagues.
                </p>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691b4f505049805bdf639ffd/c57a202f6_Jags-GA-2.jpg" 
                alt="Team Celebration" 
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-gradient-to-b from-emerald-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-slate-900 mb-12">Our Core Values</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Passion</h3>
              <p className="text-slate-600">
                We instill a love for the game that drives players to continuously improve and excel.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Teamwork</h3>
              <p className="text-slate-600">
                Success comes from working together, supporting teammates, and building strong bonds.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Excellence</h3>
              <p className="text-slate-600">
                We strive for the highest standards in training, competition, and personal development.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Branches */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Our Locations</h2>
            <p className="text-xl text-slate-600">Serving communities across Michigan</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {['CW3', 'Dearborn', 'Downriver', 'Genesee', 'Huron Valley', 'Jackson', 'Lansing', 'Marshall', 'Northville', 'Novi', 'Rochester Romeo', 'West Bloomfield'].map(branch => (
              <div key={branch} className="bg-white p-4 rounded-xl shadow-lg border-2 border-emerald-100 hover:border-emerald-300 transition-all text-center">
                <MapPin className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
                <div className="font-semibold text-slate-900">{branch}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Screenshots */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Technology-Driven Development</h2>
            <p className="text-xl text-slate-600">Our platform helps coaches and parents track every aspect of player growth</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="relative rounded-xl overflow-hidden shadow-xl border-2 border-emerald-200 hover:scale-105 transition-transform">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691b4f505049805bdf639ffd/dce41a79e_Giada-M.jpeg" 
                alt="Player Dashboard" 
                className="w-full aspect-video object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-900/90 to-transparent p-4">
                <p className="text-white font-bold">Player Profiles & Analytics</p>
              </div>
            </div>
            <div className="relative rounded-xl overflow-hidden shadow-xl border-2 border-purple-200 hover:scale-105 transition-transform">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691b4f505049805bdf639ffd/f5b12cc94_Screenshot2025-12-19101555.png" 
                alt="Formation Builder" 
                className="w-full aspect-video object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-900/90 to-transparent p-4">
                <p className="text-white font-bold">Formation Builder</p>
              </div>
            </div>
            <div className="relative rounded-xl overflow-hidden shadow-xl border-2 border-blue-200 hover:scale-105 transition-transform">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691b4f505049805bdf639ffd/c57a202f6_Jags-GA-2.jpg" 
                alt="Team Management" 
                className="w-full aspect-video object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-900/90 to-transparent p-4">
                <p className="text-white font-bold">Team Assignments</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Photo */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691b4f505049805bdf639ffd/f70bcf1df_d05ee993-bdd5-40a8-b6f6-d83e6e8e794e-04-23-2025-06-31-32-436.jpg" 
                alt="Training Session" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">Professional Development</h2>
              <p className="text-lg text-slate-700 mb-4">
                Our coaches are dedicated professionals committed to developing each player's potential. 
                We combine technical training, tactical awareness, and physical conditioning with character development.
              </p>
              <p className="text-lg text-slate-700">
                From recreational players to elite academy athletes, we provide the right environment 
                and resources for every player to thrive.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}