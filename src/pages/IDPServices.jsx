import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Video, Target, Users, TrendingUp, CheckCircle, ArrowRight, Zap, BarChart3, MessageSquare, Download, FileText } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function IDPServices() {
  const navigate = useNavigate();
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [downloadingWord, setDownloadingWord] = useState(false);

  const handleDownloadBrochure = async (format = 'pdf') => {
    try {
      if (format === 'pdf') {
        setDownloadingPDF(true);
      } else {
        setDownloadingWord(true);
      }
      
      const functionName = format === 'pdf' ? 'generateIDPBrochure' : 'generateIDPBrochureWord';
      const response = await base44.functions.invoke(functionName);
      
      const mimeType = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const extension = format === 'pdf' ? 'pdf' : 'docx';
      
      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `IDP-Training-Brochure.${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      toast.success(`${format.toUpperCase()} downloaded successfully!`);
    } catch (error) {
      toast.error('Failed to download file');
      console.error(error);
    } finally {
      if (format === 'pdf') {
        setDownloadingPDF(false);
      } else {
        setDownloadingWord(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1600&q=80')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/30 to-blue-600/30"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-32 text-center">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Personalized Training Programs
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              Unlock Your Full Potential
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 max-w-4xl mx-auto mb-12 leading-relaxed">
            Reflexive skill development, position-specific training, and video analysis—designed to turn players into game-changers.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              size="lg"
              onClick={() => navigate(createPageUrl('Bookingpage'))}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold text-lg px-8 py-6 shadow-2xl"
            >
              Get Started Today
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size="lg"
              onClick={() => handleDownloadBrochure('pdf')}
              disabled={downloadingPDF}
              className="border-2 border-white/50 text-white hover:bg-white/10 font-bold text-lg px-8 py-6 backdrop-blur-md"
            >
              {downloadingPDF ? (
                <>Downloading...</>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
            <Button 
              size="lg"
              onClick={() => handleDownloadBrochure('word')}
              disabled={downloadingWord}
              variant="outline"
              className="border-2 border-white/50 text-white hover:bg-white/10 font-bold text-lg px-8 py-6 backdrop-blur-md"
            >
              {downloadingWord ? (
                <>Downloading...</>
              ) : (
                <>
                  <FileText className="w-5 h-5 mr-2" />
                  Download Word
                </>
              )}
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-6 mt-16">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-6 py-3 rounded-xl border border-white/20">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="text-white font-medium">1-on-1 Coaching</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-6 py-3 rounded-xl border border-white/20">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="text-white font-medium">Expert Video Analysis</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-6 py-3 rounded-xl border border-white/20">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="text-white font-medium">Position-Specific Training</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Reflexive Skill Development */}
      <div className="bg-slate-900/50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?w=800&q=80" 
                  alt="Reflexive skill training"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-600/60 to-transparent"></div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 backdrop-blur-md px-4 py-2 rounded-full mb-4 border border-emerald-500/30">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 text-sm font-semibold">Reflexive Skill Development</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Reflexive Skill Development
              </h2>
              <p className="text-xl text-emerald-400 mb-6">
                Enhance muscle memory and execute soccer skills with precision under pressure.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
                  <p className="text-slate-300">Focused technical drills that simulate pressure scenarios</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
                  <p className="text-slate-300">Exercises to build quick, efficient reactions</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
                  <p className="text-slate-300">Training modules to develop ball control, passing, shooting, and dribbling</p>
                </div>
              </div>
              <Button 
                size="lg"
                onClick={() => navigate(createPageUrl('Bookingpage'))}
                className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold"
              >
                Explore Reflexive Training Programs
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Position-Specific Training */}
      <div className="bg-gradient-to-br from-blue-900/30 to-slate-900/50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/20 backdrop-blur-md px-4 py-2 rounded-full mb-4 border border-blue-500/30">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 text-sm font-semibold">Position-Specific Training</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Position-Specific &<br />Functional Training
              </h2>
              <p className="text-xl text-blue-400 mb-6">
                Elevate tactical awareness and coordination in real-game scenarios.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                  <p className="text-slate-300">Small group scenario-based drills tailored to specific positions</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                  <p className="text-slate-300">Tactical exercises to improve decision-making and game awareness</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                  <p className="text-slate-300">Customized training sessions to fit team or individual needs</p>
                </div>
              </div>
              <Button 
                size="lg"
                onClick={() => navigate(createPageUrl('Bookingpage'))}
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold"
              >
                Discover Position Training
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
            <div>
              <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80" 
                  alt="Position-specific training"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-600/60 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Video Performance Analysis */}
      <div className="bg-slate-900/50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&q=80" 
                  alt="Video analysis"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-600/60 to-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-2xl">
                    <Video className="w-10 h-10 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-purple-500/20 backdrop-blur-md px-4 py-2 rounded-full mb-4 border border-purple-500/30">
                <Video className="w-4 h-4 text-purple-400" />
                <span className="text-purple-400 text-sm font-semibold">Video Analysis</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Video Analysis &<br />Performance Evaluation
              </h2>
              <p className="text-xl text-purple-400 mb-6">
                Leverage match footage to evaluate, improve, and craft a SMART development plan.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
                  <p className="text-slate-300">Upload and review training/match videos with expert annotations</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
                  <p className="text-slate-300">Detailed assessments of positional play and technical execution</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
                  <p className="text-slate-300">Data-driven recommendations for targeted improvement</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
                  <p className="text-slate-300">Customized SMART (Specific, Measurable, Achievable, Relevant, Time-bound) plans</p>
                </div>
              </div>
              <Button 
                size="lg"
                onClick={() => navigate(createPageUrl('Bookingpage'))}
                className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-bold"
              >
                Book a Video Analysis Session
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Why Choose Our System */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 py-24">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Why Choose Our System?
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-16">
            Comprehensive training covering skills, tactics, and performance
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md hover:scale-105 transition-transform">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Comprehensive Training</h3>
                <p className="text-slate-400 text-sm">
                  All-encompassing programs covering technical skills, tactical awareness, and physical performance
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md hover:scale-105 transition-transform">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Personalized Coaching</h3>
                <p className="text-slate-400 text-sm">
                  Individual attention and customized feedback from experienced coaching staff
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md hover:scale-105 transition-transform">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Data Management</h3>
                <p className="text-slate-400 text-sm">
                  Track your progress with detailed metrics, assessments, and performance analytics
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md hover:scale-105 transition-transform">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Modern Tools</h3>
                <p className="text-slate-400 text-sm">
                  Cutting-edge video analysis, performance tracking, and digital coaching platforms
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Section 5: CTA & Contact */}
      <div className="relative overflow-hidden py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-blue-600/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Ready to Elevate Your<br />
            <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              Soccer Game?
            </span>
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-12">
            Join our training system today and unlock your full potential with personalized coaching, expert analysis, and proven development pathways.
          </p>
          
          <div className="flex flex-wrap justify-center gap-6">
            <Button 
              size="lg"
              onClick={() => navigate(createPageUrl('Bookingpage'))}
              className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white font-bold text-lg px-10 py-7 shadow-2xl"
            >
              Schedule a Free Consultation
              <ArrowRight className="w-6 h-6 ml-2" />
            </Button>
            <Button 
              size="lg"
              onClick={() => navigate(createPageUrl('Communications'))}
              className="bg-white/10 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white/20 font-bold text-lg px-10 py-7"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Contact Us
            </Button>
          </div>

          <div className="mt-20 grid md:grid-cols-3 gap-8 text-left">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
              <div className="text-5xl font-bold text-emerald-400 mb-2">500+</div>
              <p className="text-slate-300 font-medium">Players Trained</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
              <div className="text-5xl font-bold text-blue-400 mb-2">15+</div>
              <p className="text-slate-300 font-medium">Expert Coaches</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
              <div className="text-5xl font-bold text-purple-400 mb-2">1000+</div>
              <p className="text-slate-300 font-medium">Training Hours</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-950 border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400">
            <a href="#" className="hover:text-emerald-400 transition-colors">FAQ</a>
            <span>•</span>
            <a href="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="#" className="hover:text-emerald-400 transition-colors">Terms of Service</a>
            <span>•</span>
            <a href="#" className="hover:text-emerald-400 transition-colors">Contact</a>
          </div>
          <p className="text-center text-slate-500 text-xs mt-4">
            © 2026 Michigan Jaguars. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}