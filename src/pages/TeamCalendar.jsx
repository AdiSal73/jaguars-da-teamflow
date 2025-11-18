import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TeamCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [eventForm, setEventForm] = useState({
    team_id: '',
    title: '',
    description: '',
    event_type: 'training',
    date: '',
    start_time: '09:00',
    end_time: '10:00',
    location: ''
  });

  const queryClient = useQueryClient();

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const { data: events = [] } = useQuery({
    queryKey: ['teamEvents'],
    queryFn: () => base44.entities.TeamEvent.list()
  });

  const createEventMutation = useMutation({
    mutationFn: (data) => base44.entities.TeamEvent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['teamEvents']);
      setShowEventDialog(false);
      setEventForm({
        team_id: '',
        title: '',
        description: '',
        event_type: 'training',
        date: '',
        start_time: '09:00',
        end_time: '10:00',
        location: ''
      });
    }
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDay = (day) => {
    return events.filter(e => isSameDay(new Date(e.date), day));
  };

  const eventColors = {
    training: 'bg-blue-100 text-blue-700',
    assessment: 'bg-emerald-100 text-emerald-700',
    game: 'bg-purple-100 text-purple-700',
    meeting: 'bg-orange-100 text-orange-700',
    other: 'bg-slate-100 text-slate-700'
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Team Calendar</h1>
          <p className="text-slate-600 mt-1">Schedule and view team events</p>
        </div>
        <Button onClick={() => setShowEventDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Event
        </Button>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>{format(currentMonth, 'MMMM yyyy')}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={() => setCurrentMonth(new Date())}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-semibold text-slate-600 py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, idx) => {
              const dayEvents = getEventsForDay(day);
              return (
                <div
                  key={idx}
                  className={`min-h-24 p-2 border rounded-lg ${isToday(day) ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}
                >
                  <div className="text-sm font-medium text-slate-900 mb-1">
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map(event => (
                      <div
                        key={event.id}
                        className={`text-xs p-1 rounded ${eventColors[event.event_type]}`}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-slate-500">+{dayEvents.length - 2} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Team Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Team *</Label>
              <Select value={eventForm.team_id} onValueChange={(value) => setEventForm({...eventForm, team_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Title *</Label>
              <Input value={eventForm.title} onChange={(e) => setEventForm({...eventForm, title: e.target.value})} />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={eventForm.event_type} onValueChange={(value) => setEventForm({...eventForm, event_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="assessment">Assessment</SelectItem>
                  <SelectItem value="game">Game</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date *</Label>
              <Input type="date" value={eventForm.date} onChange={(e) => setEventForm({...eventForm, date: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time</Label>
                <Input type="time" value={eventForm.start_time} onChange={(e) => setEventForm({...eventForm, start_time: e.target.value})} />
              </div>
              <div>
                <Label>End Time</Label>
                <Input type="time" value={eventForm.end_time} onChange={(e) => setEventForm({...eventForm, end_time: e.target.value})} />
              </div>
            </div>
            <div>
              <Label>Location</Label>
              <Input value={eventForm.location} onChange={(e) => setEventForm({...eventForm, location: e.target.value})} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={eventForm.description} onChange={(e) => setEventForm({...eventForm, description: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowEventDialog(false)}>Cancel</Button>
            <Button 
              onClick={() => createEventMutation.mutate(eventForm)}
              disabled={!eventForm.team_id || !eventForm.title || !eventForm.date}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Create Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}