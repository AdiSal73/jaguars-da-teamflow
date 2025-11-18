import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CoachAvailabilitySettings from '../components/booking/CoachAvailabilitySettings';

export default function Availability() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const updateCoachMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Coach.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['coaches']);
    }
  });

  if (!user) return null;

  // Find coach record for current user
  const currentCoach = coaches.find(c => c.email === user.email) || {
    id: null,
    full_name: user.full_name,
    email: user.email,
    working_hours: null,
    holidays: null,
    event_types: null
  };

  const handleSave = async (availabilityData) => {
    if (currentCoach.id) {
      // Update existing coach
      await updateCoachMutation.mutateAsync({
        id: currentCoach.id,
        data: availabilityData
      });
    } else {
      // Create new coach record for admin
      await base44.entities.Coach.create({
        full_name: user.full_name,
        email: user.email,
        specialization: 'General Coaching',
        is_admin: user.role === 'admin',
        booking_enabled: true,
        ...availabilityData
      });
      queryClient.invalidateQueries(['coaches']);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Clock className="w-8 h-8 text-emerald-600" />
          My Availability
        </h1>
        <p className="text-slate-600 mt-1">Set your working hours, event types, and time off</p>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle>{currentCoach.full_name}</CardTitle>
        </CardHeader>
        <CardContent>
          <CoachAvailabilitySettings
            coach={currentCoach}
            onSave={handleSave}
          />
        </CardContent>
      </Card>
    </div>
  );
}