import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Plus, X, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CoachAvailabilitySettings({ coach, onSave }) {
  const [workingHours, setWorkingHours] = useState(coach?.working_hours || {
    monday: { enabled: true, start: '09:00', end: '17:00' },
    tuesday: { enabled: true, start: '09:00', end: '17:00' },
    wednesday: { enabled: true, start: '09:00', end: '17:00' },
    thursday: { enabled: true, start: '09:00', end: '17:00' },
    friday: { enabled: true, start: '09:00', end: '17:00' },
    saturday: { enabled: false, start: '09:00', end: '17:00' },
    sunday: { enabled: false, start: '09:00', end: '17:00' }
  });

  const [eventTypes, setEventTypes] = useState(coach?.event_types || [
    { name: 'Individual Training', duration: 60, color: '#22c55e', bufferBefore: 0, bufferAfter: 0 },
    { name: 'Evaluation Session', duration: 45, color: '#3b82f6', bufferBefore: 0, bufferAfter: 0 },
    { name: 'Physical Assessment', duration: 30, color: '#f59e0b', bufferBefore: 0, bufferAfter: 0 }
  ]);

  const [holidays, setHolidays] = useState(coach?.holidays || []);
  const [newHoliday, setNewHoliday] = useState('');
  const [newEventType, setNewEventType] = useState({
    name: '',
    duration: 60,
    color: '#22c55e',
    bufferBefore: 0,
    bufferAfter: 0
  });

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const durationOptions = [15, 20, 30, 45, 60, 90];
  const bufferOptions = [0, 5, 10, 15, 30];

  const handleDayToggle = (day) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day]?.enabled }
    }));
  };

  const handleTimeChange = (day, field, value) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const addHoliday = () => {
    if (newHoliday && !holidays.includes(newHoliday)) {
      setHolidays([...holidays, newHoliday]);
      setNewHoliday('');
    }
  };

  const removeHoliday = (holiday) => {
    setHolidays(holidays.filter(h => h !== holiday));
  };

  const addEventType = () => {
    if (newEventType.name) {
      setEventTypes([...eventTypes, { ...newEventType }]);
      setNewEventType({ name: '', duration: 60, color: '#22c55e', bufferBefore: 0, bufferAfter: 0 });
    }
  };

  const removeEventType = (index) => {
    setEventTypes(eventTypes.filter((_, i) => i !== index));
  };

  const updateEventType = (index, field, value) => {
    setEventTypes(eventTypes.map((evt, i) => 
      i === index ? { ...evt, [field]: value } : evt
    ));
  };

  const handleSave = () => {
    onSave({ 
      working_hours: workingHours, 
      holidays,
      event_types: eventTypes
    });
  };

  return (
    <Tabs defaultValue="hours" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="hours">Working Hours</TabsTrigger>
        <TabsTrigger value="events">Event Types</TabsTrigger>
        <TabsTrigger value="holidays">Holidays</TabsTrigger>
      </TabsList>

      <TabsContent value="hours" className="space-y-4">
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Set Your Working Hours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {days.map(day => (
              <div key={day} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                <div className="w-28">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={workingHours[day]?.enabled || false}
                      onCheckedChange={() => handleDayToggle(day)}
                    />
                    <Label className="capitalize font-medium">{day}</Label>
                  </div>
                </div>
                {workingHours[day]?.enabled && (
                  <div className="flex items-center gap-3 flex-1">
                    <Input
                      type="time"
                      value={workingHours[day]?.start || '09:00'}
                      onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
                      className="w-32"
                    />
                    <span className="text-slate-500">to</span>
                    <Input
                      type="time"
                      value={workingHours[day]?.end || '17:00'}
                      onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
                      className="w-32"
                    />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="events" className="space-y-4">
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Event Types & Durations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {eventTypes.map((evt, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: evt.color }}></div>
                      <Input
                        value={evt.name}
                        onChange={(e) => updateEventType(idx, 'name', e.target.value)}
                        className="flex-1"
                        placeholder="Event name"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEventType(idx)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Duration (min)</Label>
                      <Select 
                        value={evt.duration.toString()} 
                        onValueChange={(value) => updateEventType(idx, 'duration', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {durationOptions.map(dur => (
                            <SelectItem key={dur} value={dur.toString()}>{dur} min</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Color</Label>
                      <Input
                        type="color"
                        value={evt.color}
                        onChange={(e) => updateEventType(idx, 'color', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Buffer Before (min)</Label>
                      <Select 
                        value={evt.bufferBefore.toString()} 
                        onValueChange={(value) => updateEventType(idx, 'bufferBefore', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {bufferOptions.map(buf => (
                            <SelectItem key={buf} value={buf.toString()}>{buf} min</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Buffer After (min)</Label>
                      <Select 
                        value={evt.bufferAfter.toString()} 
                        onValueChange={(value) => updateEventType(idx, 'bufferAfter', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {bufferOptions.map(buf => (
                            <SelectItem key={buf} value={buf.toString()}>{buf} min</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <Input
                  value={newEventType.name}
                  onChange={(e) => setNewEventType({...newEventType, name: e.target.value})}
                  placeholder="New event type name"
                  className="flex-1"
                />
                <Button onClick={addEventType} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Duration (min)</Label>
                  <Select 
                    value={newEventType.duration.toString()} 
                    onValueChange={(value) => setNewEventType({...newEventType, duration: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map(dur => (
                        <SelectItem key={dur} value={dur.toString()}>{dur} min</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Color</Label>
                  <Input
                    type="color"
                    value={newEventType.color}
                    onChange={(e) => setNewEventType({...newEventType, color: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="holidays" className="space-y-4">
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Holidays & Time Off</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="date"
                value={newHoliday}
                onChange={(e) => setNewHoliday(e.target.value)}
                placeholder="Add holiday date"
              />
              <Button onClick={addHoliday} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {holidays.map(holiday => (
                <div key={holiday} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">{new Date(holiday).toLocaleDateString()}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeHoliday(holiday)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {holidays.length === 0 && (
                <p className="text-center text-slate-500 py-8">No holidays set</p>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <div className="mt-6">
        <Button onClick={handleSave} className="w-full bg-emerald-600 hover:bg-emerald-700">
          Save All Settings
        </Button>
      </div>
    </Tabs>
  );
}