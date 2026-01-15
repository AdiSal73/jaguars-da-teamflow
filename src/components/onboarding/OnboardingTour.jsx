import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, X, Check, Calendar, Users, MessageSquare, Activity, BookOpen } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const tourSteps = {
  parent: [
    {
      title: "Welcome to Michigan Jaguars!",
      description: "Let's take a quick tour to help you get started with managing your athlete's development journey.",
      icon: Users,
      image: "🏆"
    },
    {
      title: "Your Athletes",
      description: "View your children's profiles, track their progress, assessments, and development goals. Click on any player card to see detailed information.",
      icon: Users,
      path: "ParentPortal"
    },
    {
      title: "Book Sessions",
      description: "Schedule 1-on-1 training sessions with coaches. Choose from various services including IDP meetings, skill building, and position-specific training.",
      icon: Calendar,
      path: "Bookingpage"
    },
    {
      title: "View Bookings",
      description: "See all your upcoming and past training sessions. Manage your bookings and review session feedback.",
      icon: Calendar,
      path: "MyBookings"
    },
    {
      title: "Communications",
      description: "Stay connected with coaches and receive important updates about your athlete's progress and team activities.",
      icon: MessageSquare,
      path: "Communications"
    },
    {
      title: "Family Management",
      description: "Manage all your children's profiles in one place. Add new players, update contact information, and track multiple athletes.",
      icon: Users,
      path: "FamilyManagement"
    }
  ],
  coach: [
    {
      title: "Welcome, Coach!",
      description: "Let's explore the tools that will help you manage your team and player development effectively.",
      icon: Activity,
      image: "⚽"
    },
    {
      title: "Coach Dashboard",
      description: "Your central hub for team management, upcoming sessions, and quick access to player information.",
      icon: Activity,
      path: "coachdashboard"
    },
    {
      title: "Manage Availability",
      description: "Set your available times for player bookings. Create recurring or one-time slots, manage locations and services.",
      icon: Calendar,
      path: "coachAvailability"
    },
    {
      title: "Player Evaluations",
      description: "Conduct comprehensive player evaluations covering technical, tactical, physical, and mental attributes.",
      icon: BookOpen,
      path: "EvaluationsNew"
    },
    {
      title: "Physical Assessments",
      description: "Track player physical development with standardized assessments including sprint times, vertical jump, YIRT, and agility tests.",
      icon: Activity,
      path: "Assessments"
    },
    {
      title: "Team Management",
      description: "View all your teams, manage rosters, track team performance, and access formation tools.",
      icon: Users,
      path: "Teams"
    },
    {
      title: "Communications",
      description: "Message players, parents, and staff. Send team announcements and individual feedback.",
      icon: MessageSquare,
      path: "Communications"
    }
  ]
};

export default function OnboardingTour({ userRole, onComplete }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  const steps = tourSteps[userRole] || [];

  useEffect(() => {
    // Check if user has completed onboarding
    const checkOnboarding = async () => {
      try {
        const user = await base44.auth.me();
        const completed = user.onboarding_completed || false;
        setHasCompletedOnboarding(completed);
        
        if (!completed && steps.length > 0) {
          // Small delay to let the page load
          setTimeout(() => setIsOpen(true), 1000);
        }
      } catch (error) {
        console.error('Error checking onboarding:', error);
      }
    };

    if (userRole) {
      checkOnboarding();
    }
  }, [userRole]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      await base44.auth.updateMe({ onboarding_completed: true });
      setIsOpen(false);
      setHasCompletedOnboarding(true);
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const currentStepData = steps[currentStep];
  const Icon = currentStepData?.icon;

  if (!userRole || steps.length === 0) return null;

  return (
    <>
      {/* Reopen Tour Button */}
      {hasCompletedOnboarding && (
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          size="sm"
          className="fixed bottom-4 right-4 z-40 shadow-lg"
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Tour Guide
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                {currentStepData?.title}
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkip}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Visual */}
            <div className="flex justify-center py-8">
              {currentStepData?.image ? (
                <div className="text-8xl">{currentStepData.image}</div>
              ) : Icon ? (
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Icon className="w-12 h-12 text-white" />
                </div>
              ) : null}
            </div>

            {/* Content */}
            <DialogDescription className="text-center text-lg text-slate-700">
              {currentStepData?.description}
            </DialogDescription>

            {/* Progress Indicator */}
            <div className="flex justify-center gap-2 py-4">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentStep
                      ? 'w-8 bg-gradient-to-r from-emerald-500 to-blue-500'
                      : idx < currentStep
                      ? 'w-2 bg-emerald-300'
                      : 'w-2 bg-slate-200'
                  }`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex-1"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              {currentStep === steps.length - 1 ? (
                <Button
                  onClick={handleComplete}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Get Started
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>

            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-slate-500 hover:text-slate-700"
              >
                Skip tour
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}