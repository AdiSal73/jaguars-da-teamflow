import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Target, Users, Calendar, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { createPageUrl } from '@/utils';

const idpServices = [
  {
    id: 'video-analysis',
    name: 'Individual Video Analysis',
    icon: Video,
    color: 'from-purple-600 to-pink-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    duration: 60,
    description: 'Elevate your game through personalized video analysis',
    fullDescription: 'Join us for an in-depth online/Zoom session where we break down match footage and training clips together. We\'ll analyze your positioning, decision-making, and technique in real game scenarios. You\'ll learn how to self-evaluate using professional analysis methods, identify key moments for improvement, and develop a tactical understanding that translates directly to match performance.',
    benefits: [
      'One-on-one Zoom session with professional analysis',
      'Review of your match and training footage',
      'Tactical insights and positioning feedback',
      'Personalized action plan for improvement',
      'Access to recording for future reference'
    ],
    image: 'https://images.unsplash.com/photo-1461897104016-0b3b00cc81ee?w=800&q=80'
  },
  {
    id: 'functional-skills',
    name: 'Functional Skill Building',
    icon: Target,
    color: 'from-emerald-600 to-teal-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    duration: 90,
    description: 'Master specific skills for real-game scenarios',
    fullDescription: 'Build confidence and competence through focused, scenario-based training. Each session targets specific skills you need to execute successfully in match situations. We create realistic game scenarios where you\'ll practice decision-making under pressure, develop muscle memory for key techniques, and learn to apply skills in the heat of competition.',
    benefits: [
      'Scenario-based skill development',
      'High-repetition technical training',
      'Game-realistic pressure situations',
      'Progressive skill mastery approach',
      'Immediate feedback and correction'
    ],
    image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80'
  },
  {
    id: 'position-training',
    name: 'Position-Specific Training',
    icon: Users,
    color: 'from-blue-600 to-indigo-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    duration: 90,
    description: 'Tactical excellence for your position',
    fullDescription: 'Unlock the secrets of your position through tactical training and small-group sessions. Learn the nuances of playing in a team structure, recognize game patterns and visual cues, and develop the spatial awareness that separates good players from great ones. Training includes position-specific movements, communication patterns, and tactical combinations with teammates.',
    benefits: [
      'Position-specific tactical education',
      'Small-group training scenarios',
      'Pattern recognition development',
      'Team integration skills',
      'Advanced positional play concepts'
    ],
    image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80'
  }
];

export default function IDPServices() {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);

  const handleBookService = (service) => {
    navigate(`${createPageUrl('Bookingpage')}?service=${encodeURIComponent(service.name)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-blue-600/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full mb-6 border border-white/20">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-white text-sm font-medium">Individual Development Program</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Elevate Your Game
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-8">
            Personalized training programs designed to unlock your full potential on the field
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-12">
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
              <span className="text-white font-medium">Scenario Specific Training</span>
            </div>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-8">
          {idpServices.map((service, idx) => {
            const Icon = service.icon;
            const isSelected = selectedService?.id === service.id;
            
            return (
              <Card 
                key={service.id}
                className={`group relative overflow-hidden border-2 transition-all duration-500 cursor-pointer ${
                  isSelected ? service.borderColor + ' shadow-2xl scale-105' : 'border-slate-700 hover:border-slate-600'
                } bg-slate-800/50 backdrop-blur-md`}
                onClick={() => setSelectedService(isSelected ? null : service)}
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={service.image} 
                    alt={service.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${service.color} opacity-60`}></div>
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-white/90 text-slate-900 font-bold">
                      {service.duration} min
                    </Badge>
                  </div>
                  <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                    isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}>
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${service.color} flex items-center justify-center shadow-xl`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>

                <CardHeader>
                  <CardTitle className="text-white text-xl flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${service.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    {service.name}
                  </CardTitle>
                  <p className="text-slate-300 text-sm mt-2">{service.description}</p>
                </CardHeader>

                <CardContent className="space-y-4">
                  {isSelected && (
                    <>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        {service.fullDescription}
                      </p>
                      
                      <div className="space-y-2 pt-4 border-t border-slate-700">
                        <p className="text-white font-semibold text-sm">What You'll Get:</p>
                        {service.benefits.map((benefit, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-300 text-xs">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBookService(service);
                    }}
                    className={`w-full bg-gradient-to-r ${service.color} hover:opacity-90 text-white font-semibold mt-4`}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Book Now
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <Card className="bg-gradient-to-br from-emerald-600 to-blue-600 border-none shadow-2xl">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Take Your Game to the Next Level?
              </h2>
              <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
                Our IDP services are designed to give you the individual attention and specialized training you need to excel on the field.
              </p>
              <Button 
                size="lg"
                onClick={() => navigate(createPageUrl('Bookingpage'))}
                className="bg-white text-emerald-600 hover:bg-slate-100 font-bold text-lg px-8"
              >
                View All Available Sessions
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}