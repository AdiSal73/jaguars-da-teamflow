import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowRight, 
  Trophy, 
  Users, 
  TrendingUp, 
  Target, 
  Star, 
  Award,
  CheckCircle,
  Video,
  BarChart3,
  Heart,
  Zap,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Play
} from 'lucide-react';
import { toast } from 'sonner';

export default function LandingCTA() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    playerName: '',
    email: '',
    age: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Thanks for your interest! We\'ll be in touch soon!');
    setFormData({ playerName: '', email: '', age: '', message: '' });
  };

  const playerStories = [
    {
      name: "Amalia Villarreal",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Texas_vs_MSU_-_NCAA_2024_-_020.jpg/250px-Texas_vs_MSU_-_NCAA_2024_-_020.jpg",
      position: "Forward",
      achievement: "SEC Freshman of the Year 2024",
      currentTeam: "Texas Longhorns",
      quote: "Michigan Jaguars FC helped me develop the skills that led to my success at the U-17 World Cup and now at the University of Texas.",
      journey: "Started at age 9 with the Jaguars, led them to U-13 national title game, now playing D1 soccer at Texas with 20 goals in her freshman season."
    },
    {
      name: "Chloe Ricketts",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/NC_Courage_vs_Washington_Spirit_%28Nov_2024%29_007_%28Ricketts%29.jpg/250px-NC_Courage_vs_Washington_Spirit_%28Nov_2024%29_007_%28Ricketts%29.jpg",
      position: "Midfielder / Forward",
      achievement: "NWSL Professional Player",
      currentTeam: "Boston Legacy FC",
      quote: "Playing for Michigan Jaguars in the Girls Academy prepared me for the professional level. The competitive environment was incredible.",
      journey: "Trained with the Jaguars in GA soccer, became the first player to sign with NWSL at age 15 using the Under-18 Entry Mechanism. Now playing professionally in the NWSL."
    },
    {
      name: "Madison Pogarch",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Madison_Pogarch_2022-01_%28cropped%29.jpg/250px-Madison_Pogarch_2022-01_%28cropped%29.jpg",
      position: "Left Back",
      achievement: "NWSL Shield Winner",
      currentTeam: "Hammarby (Sweden)",
      quote: "The foundation I built with Michigan Jaguars gave me the confidence to compete at the highest levels of the game.",
      journey: "Developed with Michigan Jaguars before playing college soccer. Now a professional defender with multiple NWSL teams and currently playing in Sweden's top league."
    },
    {
      name: "Emerson Sargeant",
      image: "https://dxbhsrqyrr690.cloudfront.net/sidearm.nextgen.sites/msuspartans.com/images/2025/8/2/For_Web_Sargeant__Emerson_zOrHO.jpg",
      position: "Midfielder",
      achievement: "Big Ten Athlete",
      currentTeam: "Michigan State Spartans",
      quote: "The Jaguars program taught me what it takes to compete at the Division 1 level.",
      journey: "Progressed through the Jaguars system and earned a scholarship to play Division 1 soccer at Michigan State University."
    },
    {
      name: "Haley Craig",
      image: "https://gostanford.com/imgproxy/UURZtQoJ7vLbCK-2mjgVJ1WJcisQipS5b1h5InC3v4g/rs:fit:1980:0:0:0/g:ce:0:0/q:90/aHR0cHM6Ly9zdG9yYWdlLmdvb2dsZWFwaXMuY29tL3N0YW5mb3JkLXByb2QvMjAyNC8wNy8xMi84TzZsb1hMVzlyNFRoODJWUnJzdEM0WHJiT1VkbndsRUpuT01MNFo1LmpwZw.jpg",
      position: "Forward",
      achievement: "NCAA Champion",
      currentTeam: "Stanford Cardinal",
      quote: "The pathway from Michigan Jaguars to Stanford was made possible by the elite training and development I received.",
      journey: "Developed through the Jaguars academy, earned a scholarship to Stanford University, and helped lead the Cardinal to national prominence."
    }
  ];

  const benefits = [
    { icon: Trophy, title: "Elite Coaching", desc: "Learn from experienced coaches with proven track records" },
    { icon: Users, title: "Age-Specific Training", desc: "Customized programs for every developmental stage" },
    { icon: TrendingUp, title: "Progress Tracking", desc: "Advanced analytics and performance monitoring" },
    { icon: Target, title: "College Pathway", desc: "Direct pipeline to D1 scholarships and beyond" },
    { icon: Video, title: "Video Analysis", desc: "Professional-grade video breakdown and feedback" },
    { icon: Award, title: "National Recognition", desc: "Compete in top tournaments and showcases" }
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-blue-600 to-purple-700 min-h-screen flex items-center">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1920&q=80')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-slate-950"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-32 text-center">
          <div className="mb-8 flex justify-center gap-4">
            <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
              <span className="text-emerald-300 font-bold text-sm"> Over 500 D1 Players Developed</span>
            </div>
            <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
              <span className="text-blue-300 font-bold text-sm">4 NWSL Pro Players</span>
            </div>
             <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
              <span className="text-emerald-300 font-bold text-sm"> Over 2 Billion smiles generated</span>
            </div>
          </div>

          <h1 className="text-6xl md:text-8xl font-black text-white mb-6 leading-tight">
            Kickstart Your<br />
            <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Soccer Passion!
            </span>
          </h1>
          
          <p className="text-2xl md:text-3xl text-slate-200 mb-12 max-w-4xl mx-auto font-medium">
            Join the <span className="text-emerald-400 font-bold">Michigan Jaguars</span> — Where Champions Are Made
          </p>
          
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            <Button 
              size="lg"
              onClick={() => navigate(createPageUrl('Bookingpage'))}
              className="bg-white text-emerald-600 hover:bg-emerald-50 font-bold text-xl px-12 py-8 shadow-2xl group"
            >
              Start Your Journey
              <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-2 transition-transform" />
            </Button>
            <Button 
              size="lg"
              onClick={() => document.getElementById('player-stories').scrollIntoView({ behavior: 'smooth' })}
              className="bg-white/10 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white/20 font-bold text-xl px-12 py-8"
            >
              <Play className="w-5 h-5 mr-2" />
              See Success Stories
            </Button>
          </div>
        </div>
      </div>

      {/* Proven Pathway Section */}
      <div className="py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
              Your Proven <span className="text-emerald-400">Pathway to Success</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              We've created a systematic approach to player development that produces results at every level
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Foundation", desc: "Master the fundamentals with age-appropriate training", icon: Target },
              { step: "02", title: "Development", desc: "Position-specific skills and tactical understanding", icon: TrendingUp },
              { step: "03", title: "Elite Training", desc: "High-level competition and college exposure", icon: Trophy },
              { step: "04", title: "Next Level", desc: "College scholarships and professional opportunities", icon: Star }
            ].map((stage, idx) => (
              <div key={idx} className="relative">
                <div className="bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-2xl p-8 border-2 border-emerald-500/30 hover:border-emerald-400 transition-all">
                  <div className="text-6xl font-black text-emerald-400/20 mb-4">{stage.step}</div>
                  <stage.icon className="w-12 h-12 text-emerald-400 mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-3">{stage.title}</h3>
                  <p className="text-slate-300">{stage.desc}</p>
                </div>
                {idx < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-emerald-400 to-blue-400"></div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Button 
              size="lg"
              onClick={() => navigate(createPageUrl('IDPServices'))}
              className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white font-bold text-lg px-10 py-6"
            >
              Discover Your Pathway
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Player Stories Section */}
      <div id="player-stories" className="py-24 bg-gradient-to-br from-slate-950 to-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block px-6 py-2 bg-emerald-500/20 rounded-full border border-emerald-500/30 mb-6">
              <span className="text-emerald-400 font-bold">SUCCESS STORIES</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
              Become Our <span className="text-emerald-400">Next Star</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Our players have gone on to compete at the highest levels of college and professional soccer
            </p>
          </div>

          <div className="space-y-12">
            {playerStories.map((player, idx) => (
              <Card key={idx} className="bg-slate-800/50 border-slate-700 backdrop-blur-md overflow-hidden hover:shadow-2xl transition-all">
                <CardContent className="p-0">
                  <div className={`grid md:grid-cols-2 gap-8 ${idx % 2 === 1 ? 'md:grid-flow-dense' : ''}`}>
                    <div className={`relative h-96 ${idx % 2 === 1 ? 'md:col-start-2' : ''}`}>
                      <img 
                        src={player.image} 
                        alt={player.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 to-transparent"></div>
                      <div className="absolute bottom-6 left-6">
                        <div className="px-4 py-2 bg-emerald-500 rounded-full mb-2">
                          <span className="text-white font-bold text-sm">{player.position}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`p-8 flex flex-col justify-center ${idx % 2 === 1 ? 'md:col-start-1' : ''}`}>
                      <div className="mb-4">
                        <h3 className="text-3xl font-black text-white mb-2">{player.name}</h3>
                        <div className="flex items-center gap-3 mb-2">
                          <Award className="w-5 h-5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">{player.achievement}</span>
                        </div>
                        <div className="text-slate-400">{player.currentTeam}</div>
                      </div>
                      
                      <div className="bg-slate-900/50 rounded-lg p-6 mb-6 border-l-4 border-emerald-500">
                        <p className="text-slate-300 italic text-lg leading-relaxed">"{player.quote}"</p>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-emerald-400 mt-1 flex-shrink-0" />
                          <p className="text-slate-300">{player.journey}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-16">
            <Button 
              size="lg"
              onClick={() => navigate(createPageUrl('Bookingpage'))}
              className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white font-bold text-xl px-12 py-8"
            >
              <Star className="w-6 h-6 mr-2" />
              Become Our Next Star
            </Button>
          </div>
        </div>
      </div>

      {/* Program Highlights */}
      <div className="py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
              Why Choose <span className="text-emerald-400">Michigan Jaguars?</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              We provide everything you need to reach your full potential
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, idx) => (
              <div 
                key={idx}
                className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700 hover:border-emerald-500 transition-all group"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <benefit.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{benefit.title}</h3>
                <p className="text-slate-400">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sign Up Section */}
      <div className="py-24 bg-gradient-to-br from-emerald-600 via-blue-600 to-purple-700">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
              Ready to Start?
            </h2>
            <p className="text-xl text-white/90">
              Take the first step toward your soccer dreams today
            </p>
          </div>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-white font-semibold mb-2 block">Player Name *</label>
                    <Input 
                      value={formData.playerName}
                      onChange={(e) => setFormData({...formData, playerName: e.target.value})}
                      required
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label className="text-white font-semibold mb-2 block">Age *</label>
                    <Input 
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({...formData, age: e.target.value})}
                      required
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                      placeholder="Player age"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-white font-semibold mb-2 block">Email *</label>
                  <Input 
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="text-white font-semibold mb-2 block">Message</label>
                  <Textarea 
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                    placeholder="Tell us about your goals..."
                    rows={4}
                  />
                </div>
                <Button 
                  type="submit"
                  size="lg"
                  className="w-full bg-white text-emerald-600 hover:bg-slate-100 font-bold text-xl py-6"
                >
                  Join the Movement — Register Now!
                  <ArrowRight className="w-6 h-6 ml-2" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Social Media Section */}
      <div className="py-24 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-white mb-6">
              Join the <span className="text-emerald-400">#JaguarsFamily</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
              Follow our journey and share yours with the community
            </p>
            
            <div className="flex justify-center gap-6 mb-12">
              <a href="https://www.instagram.com/michiganjaguarsfc" target="_blank" rel="noopener noreferrer" className="group">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Instagram className="w-8 h-8 text-white" />
                </div>
              </a>
              <a href="https://www.facebook.com/michiganjaguarsfc" target="_blank" rel="noopener noreferrer" className="group">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Facebook className="w-8 h-8 text-white" />
                </div>
              </a>
              <a href="https://twitter.com/michiganjags" target="_blank" rel="noopener noreferrer" className="group">
                <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-sky-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Twitter className="w-8 h-8 text-white" />
                </div>
              </a>
              <a href="https://www.youtube.com/@MichiganJaguarsFC" target="_blank" rel="noopener noreferrer" className="group">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Youtube className="w-8 h-8 text-white" />
                </div>
              </a>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                <Heart className="w-12 h-12 text-pink-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">#MySoccerJourney</h3>
                <p className="text-slate-400">Share your story and inspire others</p>
              </div>
              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                <Zap className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">#FutureStars</h3>
                <p className="text-slate-400">Showcase your skills and progress</p>
              </div>
              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                <Trophy className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">#JaguarsPride</h3>
                <p className="text-slate-400">Celebrate team wins together</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-24 bg-gradient-to-r from-emerald-600 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1920&q=80')] bg-cover bg-center opacity-10"></div>
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
            Your Journey Starts Now
          </h2>
          <p className="text-2xl text-white/90 mb-12 max-w-3xl mx-auto">
            Don't wait to chase your dreams. Join hundreds of players who are already on their path to success.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <Button 
              size="lg"
              onClick={() => navigate(createPageUrl('Bookingpage'))}
              className="bg-white text-emerald-600 hover:bg-slate-100 font-bold text-xl px-12 py-8 shadow-2xl"
            >
              Start Your Journey Today!
              <ArrowRight className="w-6 h-6 ml-2" />
            </Button>
            <Button 
              size="lg"
              onClick={() => navigate(createPageUrl('Communications'))}
              className="bg-white/10 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white/20 font-bold text-xl px-12 py-8"
            >
              Contact Us
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}