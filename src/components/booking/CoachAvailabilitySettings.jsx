import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Plus, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

  const [holidays, setHolidays] = useState(coach?.holidays || []);
  const [newHoliday, setNewHoliday] = useState('');

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

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

  const handleSave = () => {
    onSave({ working_hours: workingHours, holidays });
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Working Hours</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {days.map(day => (
            <div key={day} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="w-32">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={workingHours[day]?.enabled || false}
                    onCheckedChange={() => handleDayToggle(day)}
                  />
                  <Label className="capitalize">{day}</Label>
                </div>
              </div>
              {workingHours[day]?.enabled && (
                <div className="flex items-center gap-3">
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

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Holidays & Time Off</CardTitle>
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
                <span className="font-medium">{new Date(holiday).toLocaleDateString()}</span>
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
              <p className="text-center text-slate-500 py-4">No holidays set</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full bg-emerald-600 hover:bg-emerald-700">
        Save Availability Settings
      </Button>
    </div>
  );
}