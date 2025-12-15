import React, { useState } from 'react';
import { format } from 'date-fns';
import { X, Plus, Clock, Calendar, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import LocationSelector from './LocationSelector';

export default function SlotEditor({ slot, services = [], onSave, onCancel }) {
  const [formData, setFormData] = useState(slot || {
    id: Date.now().toString(),
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00',
    services: [],
    location_id: '',
    buffer_before: 0,
    buffer_after: 0,
    is_recurring: true,
    recurring_start_date: format(new Date(), 'yyyy-MM-dd'),
    recurring_end_date: '',
    specific_dates: []
  });

  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  const toggleService = (serviceName) => {
    if (formData.services.includes(serviceName)) {
      setFormData({
        ...formData,
        services: formData.services.filter(s => s !== serviceName)
      });
    } else {
      setFormData({
        ...formData,
        services: [...formData.services, serviceName]
      });
    }
  };

  const handleSave = () => {
    if (!formData.start_time || !formData.end_time) {
      alert('Please set start and end times');
      return;
    }
    if (formData.services.length === 0) {
      alert('Please select at least one service');
      return;
    }
    if (!formData.location_id) {
      alert('Please select a location');
      return;
    }
    onSave(formData);
  };

  return (
    <Card className="border-2 border-emerald-200">
      <CardHeader className="bg-emerald-50 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {slot ? 'Edit Time Slot' : 'New Time Slot'}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Day of Week */}
        <div>
          <Label className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            Day of Week
          </Label>
          <select
            value={formData.day_of_week}
            onChange={(e) => setFormData({...formData, day_of_week: parseInt(e.target.value)})}
            className="w-full h-10 border border-slate-300 rounded-md px-3"
          >
            {daysOfWeek.map(day => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
        </div>

        {/* Time Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              Start Time
            </Label>
            <Input
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData({...formData, start_time: e.target.value})}
            />
          </div>
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              End Time
            </Label>
            <Input
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData({...formData, end_time: e.target.value})}
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <Label className="mb-2 block">Location *</Label>
          <LocationSelector
            value={formData.location_id}
            onChange={(locationId) => setFormData({...formData, location_id: locationId})}
            required
          />
        </div>

        {/* Services */}
        <div>
          <Label className="mb-3 block">Available Services</Label>
          <div className="space-y-2">
            {services.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No services defined yet. Add services first.</p>
            ) : (
              services.map(service => (
                <label key={service.name} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100">
                  <Checkbox
                    checked={formData.services.includes(service.name)}
                    onCheckedChange={() => toggleService(service.name)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: service.color }}
                      />
                      <span className="font-medium text-slate-900">{service.name}</span>
                    </div>
                    <span className="text-xs text-slate-500">{service.duration} minutes</span>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Buffers */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Buffer Before (minutes)</Label>
            <Input
              type="number"
              min="0"
              max="60"
              step="5"
              value={formData.buffer_before}
              onChange={(e) => setFormData({...formData, buffer_before: parseInt(e.target.value) || 0})}
            />
          </div>
          <div>
            <Label>Buffer After (minutes)</Label>
            <Input
              type="number"
              min="0"
              max="60"
              step="5"
              value={formData.buffer_after}
              onChange={(e) => setFormData({...formData, buffer_after: parseInt(e.target.value) || 0})}
            />
          </div>
        </div>

        {/* Recurring */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Repeat className="w-4 h-4 text-emerald-600" />
              <Label className="cursor-pointer">Recurring Weekly</Label>
            </div>
            <Switch
              checked={formData.is_recurring}
              onCheckedChange={(checked) => setFormData({...formData, is_recurring: checked})}
            />
          </div>

          {formData.is_recurring && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Recurring From</Label>
                <Input
                  type="date"
                  value={formData.recurring_start_date}
                  onChange={(e) => setFormData({...formData, recurring_start_date: e.target.value})}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
              <div>
                <Label>Recurring Until</Label>
                <Input
                  type="date"
                  value={formData.recurring_end_date}
                  onChange={(e) => setFormData({...formData, recurring_end_date: e.target.value})}
                  min={formData.recurring_start_date || format(new Date(), 'yyyy-MM-dd')}
                />
                <p className="text-xs text-slate-500 mt-1">Leave empty for indefinite</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!formData.location_id} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
            Save Slot
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}