import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2 } from 'lucide-react';
import BlackoutDateRangePicker from './BlackoutDateRangePicker';

export default function CoachAvailabilitySettings({ coach, onSave }) {
  const [workingHours, setWorkingHours] = useState(
    coach.working_hours || {
      monday: { enabled: false, slots: [{ start: '09:00', end: '17:00' }] },
      tuesday: { enabled: false, slots: [{ start: '09:00', end: '17:00' }] },
      wednesday: { enabled: false, slots: [{ start: '09:00', end: '17:00' }] },
      thursday: { enabled: false, slots: [{ start: '09:00', end: '17:00' }] },
      friday: { enabled: false, slots: [{ start: '09:00', end: '17:00' }] },
      saturday: { enabled: false, slots: [{ start: '09:00', end: '17:00' }] },
      sunday: { enabled: false, slots: [{ start: '09:00', end: '17:00' }] }
    }
  );

  const [eventTypes, setEventTypes] = useState(
    coach.event_types || [
      { name: 'Individual Training', duration: 60, color: '#22c55e', bufferBefore: 0, bufferAfter: 0 },
      { name: 'Evaluation Session', duration: 45, color: '#3b82f6', bufferBefore: 0, bufferAfter: 15 },
      { name: 'Physical Assessment', duration: 30, color: '#f59e0b', bufferBefore: 0, bufferAfter: 0 }
    ]
  );

  const [blackoutDates, setBlackoutDates] = useState(coach.holidays || []);

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  const addTimeSlot = (day) => {
    setWorkingHours({
      ...workingHours,
      [day]: {
        ...workingHours[day],
        slots: [...workingHours[day].slots, { start: '09:00', end: '17:00' }]
      }
    });
  };

  const removeTimeSlot = (day, index) => {
    const newSlots = workingHours[day].slots.filter((_, i) => i !== index);
    setWorkingHours({
      ...workingHours,
      [day]: {
        ...workingHours[day],
        slots: newSlots
      }
    });
  };

  const updateTimeSlot = (day, index, field, value) => {
    const newSlots = [...workingHours[day].slots];
    newSlots[index][field] = value;
    setWorkingHours({
      ...workingHours,
      [day]: {
        ...workingHours[day],
        slots: newSlots
      }
    });
  };

  const addEventType = () => {
    setEventTypes([...eventTypes, { name: 'New Event', duration: 60, color: '#6366f1', bufferBefore: 0, bufferAfter: 0 }]);
  };

  const removeEventType = (index) => {
    setEventTypes(eventTypes.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave({
      working_hours: workingHours,
      event_types: eventTypes,
      holidays: blackoutDates
    });
  };

  return (
    <Tabs defaultValue="hours" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="hours">Working Hours</TabsTrigger>
        <TabsTrigger value="events">Event Types</TabsTrigger>
        <TabsTrigger value="blackout">Blackout Dates</TabsTrigger>
      </TabsList>

      <TabsContent value="hours" className="space-y-4">
        {daysOfWeek.map(day => (
          <Card key={day}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base capitalize">{day}</CardTitle>
                <Switch
                  checked={workingHours[day].enabled}
                  onCheckedChange={(checked) =>
                    setWorkingHours({
                      ...workingHours,
                      [day]: { ...workingHours[day], enabled: checked }
                    })
                  }
                />
              </div>
            </CardHeader>
            {workingHours[day].enabled && (
              <CardContent className="space-y-3">
                {workingHours[day].slots.map((slot, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Input
                      type="time"
                      value={slot.start}
                      onChange={(e) => updateTimeSlot(day, index, 'start', e.target.value)}
                      className="flex-1"
                    />
                    <span className="text-slate-600">to</span>
                    <Input
                      type="time"
                      value={slot.end}
                      onChange={(e) => updateTimeSlot(day, index, 'end', e.target.value)}
                      className="flex-1"
                    />
                    {workingHours[day].slots.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTimeSlot(day, index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addTimeSlot(day)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Time Slot
                </Button>
              </CardContent>
            )}
          </Card>
        ))}
      </TabsContent>

      <TabsContent value="events" className="space-y-4">
        {eventTypes.map((event, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Event Name</Label>
                  <Input
                    value={event.name}
                    onChange={(e) => {
                      const newEvents = [...eventTypes];
                      newEvents[index].name = e.target.value;
                      setEventTypes(newEvents);
                    }}
                  />
                </div>
                <div>
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    min="15"
                    max="180"
                    step="15"
                    value={event.duration}
                    onChange={(e) => {
                      const newEvents = [...eventTypes];
                      newEvents[index].duration = parseInt(e.target.value);
                      setEventTypes(newEvents);
                    }}
                  />
                </div>
                <div>
                  <Label>Buffer Before (min)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="60"
                    step="5"
                    value={event.bufferBefore}
                    onChange={(e) => {
                      const newEvents = [...eventTypes];
                      newEvents[index].bufferBefore = parseInt(e.target.value);
                      setEventTypes(newEvents);
                    }}
                  />
                </div>
                <div>
                  <Label>Buffer After (min)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="60"
                    step="5"
                    value={event.bufferAfter}
                    onChange={(e) => {
                      const newEvents = [...eventTypes];
                      newEvents[index].bufferAfter = parseInt(e.target.value);
                      setEventTypes(newEvents);
                    }}
                  />
                </div>
                <div>
                  <Label>Color</Label>
                  <Input
                    type="color"
                    value={event.color}
                    onChange={(e) => {
                      const newEvents = [...eventTypes];
                      newEvents[index].color = e.target.value;
                      setEventTypes(newEvents);
                    }}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="destructive"
                    onClick={() => removeEventType(index)}
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        <Button onClick={addEventType} variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Event Type
        </Button>
      </TabsContent>

      <TabsContent value="blackout" className="space-y-4">
        <BlackoutDateRangePicker
          blackoutDates={blackoutDates}
          onBlackoutDatesChange={setBlackoutDates}
        />
      </TabsContent>

      <div className="flex justify-end mt-6">
        <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
          Save Settings
        </Button>
      </div>
    </Tabs>
  );
}