import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, ArrowLeft, Award, Target, Users } from 'lucide-react';

export default function CoachProfile() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const coachId = urlParams.get('id');

  const { data: coach, isLoading } = useQuery({
    queryKey: ['coach', coachId],
    queryFn: async () => {
      const coaches = await base44.entities.Coach.filter({ id: coachId });
      return coaches[0];
    },
    enabled: !!coachId
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list()
  });

  const { data: timeSlots = [] } = useQuery({
    queryKey: ['timeSlots', coachId],
    queryFn: () => base44.entities.TimeSlot.filter({ coach_id: coachId }),
    enabled: !!coachId
  });

  const coachTeams = teams.filter(t => coach?.team_ids?.includes(t.id));
  const services = coach?.services || [];

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!coach) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-slate-500">Coach not found</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-emerald-600 to-blue-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-12">
          <Button 
            onClick={() => navigate(-1)} 
            variant="ghost" 
            className="text-white hover:bg-white/20 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="flex flex-col md:flex-row items-start gap-6">
            {coach.photo_url ? (
              <img 
                src={coach.photo_url} 
                alt={coach.full_name}
                className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-white/20 flex items-center justify-center text-4xl font-bold">
                {coach.full_name?.charAt(0)}
              </div>
            )}
            
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{coach.full_name}</h1>
              {coach.branch && (
                <Badge className="bg-white/20 text-white border-white/30 mb-4">
                  {coach.branch}
                </Badge>
              )}
              <p className="text-white/90 text-lg max-w-2xl">
                {coach.bio || 'Experienced coach dedicated to player development'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Teams */}
          {coachTeams.length > 0 && (
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  Teams
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {coachTeams.map(team => (
                    <div key={team.id} className="p-3 bg-slate-700/50 rounded-lg">
                      <div className="font-semibold text-white">{team.name}</div>
                      <div className="text-sm text-slate-300">{team.age_group} • {team.league}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Services */}
          {services.length > 0 && (
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-400" />
                  Services Offered
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {services.map((service, idx) => (
                    <div key={idx} className="p-3 bg-slate-700/50 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: service.color }}></div>
                        <span className="text-white font-medium">{service.name}</span>
                      </div>
                      <span className="text-sm text-slate-300">{service.duration} min</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Availability */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                Availability
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timeSlots.length > 0 ? (
                <div className="space-y-2">
                  {timeSlots.slice(0, 5).map((slot, idx) => {
                    const location = locations.find(l => l.id === slot.location_id);
                    return (
                      <div key={idx} className="p-3 bg-slate-700/50 rounded-lg">
                        <div className="flex items-center gap-2 text-white font-medium mb-1">
                          <Clock className="w-4 h-4 text-emerald-400" />
                          {slot.date} • {slot.start_time}-{slot.end_time}
                        </div>
                        {location && (
                          <div className="flex items-center gap-1 text-sm text-slate-300">
                            <MapPin className="w-3 h-3" />
                            {location.name}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {timeSlots.length > 5 && (
                    <p className="text-sm text-slate-400 text-center">+{timeSlots.length - 5} more slots</p>
                  )}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">No upcoming availability</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Book Now */}
        <div className="mt-8">
          <Card className="bg-gradient-to-br from-emerald-600 to-blue-600 border-none shadow-2xl">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Ready to Train?</h2>
              <p className="text-white/90 mb-6">Book a session with {coach.first_name || coach.full_name}</p>
              <Button 
                size="lg"
                onClick={() => navigate(`${createPageUrl('PublicCoachBooking')}?coach=${coach.id}`)}
                className="bg-white text-emerald-600 hover:bg-slate-100 font-bold"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Book a Session
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}