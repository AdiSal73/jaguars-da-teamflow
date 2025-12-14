import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Trophy, Calendar } from 'lucide-react';

export default function EventsTimeline({ events = [], onUpdate }) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    event_name: '',
    event_date: '',
    event_type: 'Training Camp',
    notes: ''
  });

  const handleAddEvent = () => {
    const event = {
      id: `event_${Date.now()}`,
      ...newEvent
    };
    onUpdate([...events, event]);
    setShowDialog(false);
    setNewEvent({ event_name: '', event_date: '', event_type: 'Training Camp', notes: '' });
  };

  const handleEditEvent = () => {
    const updated = events.map(e => e.id === editingEvent.id ? editingEvent : e);
    onUpdate(updated);
    setEditingEvent(null);
  };

  const handleDeleteEvent = (eventId) => {
    onUpdate(events.filter(e => e.id !== eventId));
  };

  const sortedEvents = [...events].sort((a, b) => new Date(a.event_date) - new Date(b.event_date));

  const getEventColor = (type) => {
    const colors = {
      'US ID Camp': 'from-blue-500 to-blue-600',
      'Girls Academy ID Event': 'from-pink-500 to-pink-600',
      'US National Team Camp': 'from-red-500 to-red-600',
      'Regional Camp': 'from-green-500 to-green-600',
      'College Showcase': 'from-purple-500 to-purple-600',
      'Training Camp': 'from-orange-500 to-orange-600',
      'Other': 'from-slate-500 to-slate-600'
    };
    return colors[type] || colors['Other'];
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-600" />
            Events & Camps
          </CardTitle>
          <Button onClick={() => setShowDialog(true)} size="sm" className="bg-amber-600 hover:bg-amber-700">
            <Plus className="w-4 h-4 mr-1" />
            Add Event
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm">No events or camps recorded yet</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline */}
            <div className="overflow-x-auto pb-4">
              <div className="flex items-center gap-4 min-w-max px-4">
                {sortedEvents.map((event, idx) => (
                  <div key={event.id} className="relative flex flex-col items-center">
                    {/* Timeline dot and line */}
                    <div className="relative">
                      {idx > 0 && (
                        <div className="absolute right-full top-1/2 w-24 h-1 bg-gradient-to-r from-slate-300 to-emerald-400" style={{ transform: 'translateY(-50%)' }} />
                      )}
                      <div 
                        className={`w-4 h-4 rounded-full bg-gradient-to-r ${getEventColor(event.event_type)} ring-4 ring-white shadow-lg cursor-pointer hover:scale-125 transition-transform`}
                        onClick={() => setEditingEvent(event)}
                      />
                    </div>
                    
                    {/* Event card */}
                    <div className="mt-4 w-48">
                      <div 
                        className={`p-3 rounded-lg bg-gradient-to-br ${getEventColor(event.event_type)} text-white shadow-lg cursor-pointer hover:shadow-xl transition-all`}
                        onClick={() => setEditingEvent(event)}
                      >
                        <div className="font-bold text-sm mb-1">{new Date(event.event_date).getFullYear()}</div>
                        <div className="text-xs opacity-90 mb-2">{new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                        <div className="font-semibold text-sm leading-tight">{event.event_name}</div>
                        <Badge className="mt-2 bg-white/30 text-white border-white/40 text-[9px]">
                          {event.event_type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* List view */}
            <div className="mt-6 space-y-2">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">All Events</h4>
              {sortedEvents.map(event => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">{event.event_name}</span>
                      <Badge className={`bg-gradient-to-r ${getEventColor(event.event_type)} text-white text-[9px]`}>
                        {event.event_type}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      {new Date(event.event_date).toLocaleDateString()}
                    </div>
                    {event.notes && <p className="text-xs text-slate-500 mt-1">{event.notes}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditingEvent(event)} className="h-7 px-2 text-xs">
                      Edit
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-50 hover:text-red-600" onClick={() => handleDeleteEvent(event.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Event/Camp</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Event Name *</Label>
              <Input value={newEvent.event_name} onChange={e => setNewEvent({...newEvent, event_name: e.target.value})} placeholder="e.g., US Youth Soccer ID Camp" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date *</Label>
                <Input type="date" value={newEvent.event_date} onChange={e => setNewEvent({...newEvent, event_date: e.target.value})} />
              </div>
              <div>
                <Label>Event Type *</Label>
                <Select value={newEvent.event_type} onValueChange={v => setNewEvent({...newEvent, event_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US ID Camp">US ID Camp</SelectItem>
                    <SelectItem value="Girls Academy ID Event">Girls Academy ID Event</SelectItem>
                    <SelectItem value="US National Team Camp">US National Team Camp</SelectItem>
                    <SelectItem value="Regional Camp">Regional Camp</SelectItem>
                    <SelectItem value="College Showcase">College Showcase</SelectItem>
                    <SelectItem value="Training Camp">Training Camp</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={newEvent.notes} onChange={e => setNewEvent({...newEvent, notes: e.target.value})} rows={2} placeholder="Additional details..." />
            </div>
            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleAddEvent} disabled={!newEvent.event_name || !newEvent.event_date} className="flex-1 bg-amber-600 hover:bg-amber-700">Add Event</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editingEvent !== null} onOpenChange={() => setEditingEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          {editingEvent && (
            <div className="space-y-4 mt-4">
              <div>
                <Label>Event Name *</Label>
                <Input value={editingEvent.event_name} onChange={e => setEditingEvent({...editingEvent, event_name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date *</Label>
                  <Input type="date" value={editingEvent.event_date} onChange={e => setEditingEvent({...editingEvent, event_date: e.target.value})} />
                </div>
                <div>
                  <Label>Event Type *</Label>
                  <Select value={editingEvent.event_type} onValueChange={v => setEditingEvent({...editingEvent, event_type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US ID Camp">US ID Camp</SelectItem>
                      <SelectItem value="Girls Academy ID Event">Girls Academy ID Event</SelectItem>
                      <SelectItem value="US National Team Camp">US National Team Camp</SelectItem>
                      <SelectItem value="Regional Camp">Regional Camp</SelectItem>
                      <SelectItem value="College Showcase">College Showcase</SelectItem>
                      <SelectItem value="Training Camp">Training Camp</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={editingEvent.notes || ''} onChange={e => setEditingEvent({...editingEvent, notes: e.target.value})} rows={2} />
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setEditingEvent(null)} className="flex-1">Cancel</Button>
                <Button onClick={handleEditEvent} className="flex-1 bg-amber-600 hover:bg-amber-700">Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}