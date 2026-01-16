import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Save, Trash2, Mail } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function EditBookingDialog({ open, onClose, booking, onSave, onDelete, locations, coaches }) {
  const [form, setForm] = useState({
    booking_date: booking?.booking_date || '',
    start_time: booking?.start_time || '',
    end_time: booking?.end_time || '',
    service_name: booking?.service_name || '',
    location_id: booking?.location_id || '',
    notes: booking?.notes || '',
    status: booking?.status || 'confirmed',
    video_consultation_link: booking?.video_consultation_link || ''
  });
  const [sendingReminder, setSendingReminder] = useState(false);

  React.useEffect(() => {
    if (booking) {
      setForm({
        booking_date: booking.booking_date || '',
        start_time: booking.start_time || '',
        end_time: booking.end_time || '',
        service_name: booking.service_name || '',
        location_id: booking.location_id || '',
        notes: booking.notes || '',
        status: booking.status || 'confirmed',
        video_consultation_link: booking.video_consultation_link || ''
      });
    }
  }, [booking]);

  const handleSubmit = () => {
    onSave(booking.id, form);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this booking?')) {
      onDelete(booking.id);
    }
  };

  const handleSendReminder = async () => {
    setSendingReminder(true);
    try {
      const location = (locations || []).find(l => l.id === booking.location_id);
      const locationInfo = location ? `${location.name} - ${location.address}` : 'Location TBD';
      
      const recipients = [];
      if (booking.parent_email) recipients.push({ email: booking.parent_email, role: 'parent' });
      
      const coach = (coaches || []).find(c => c.id === booking.coach_id);
      if (coach?.email) recipients.push({ email: coach.email, role: 'coach' });

      for (const recipient of recipients) {
        await base44.functions.invoke('sendBookingEmail', {
          to: recipient.email,
          subject: `Reminder: Upcoming Session - ${booking.service_name}`,
          booking: {
            ...booking,
            location_info: locationInfo
          },
          type: recipient.role === 'coach' ? 'confirmation_coach' : 'confirmation_client'
        });
      }
      
      toast.success('Reminders sent successfully');
    } catch (error) {
      toast.error('Failed to send reminders');
    } finally {
      setSendingReminder(false);
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit Booking</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-slate-600">Coach:</span>
                <span className="ml-2 font-semibold">{booking.coach_name}</span>
              </div>
              <div>
                <span className="text-slate-600">Player:</span>
                <span className="ml-2 font-semibold">{booking.player_name || 'Guest'}</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={form.booking_date}
                onChange={(e) => setForm({...form, booking_date: e.target.value})}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({...form, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Start Time</Label>
              <Input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({...form, start_time: e.target.value})}
              />
            </div>
            <div>
              <Label>End Time</Label>
              <Input
                type="time"
                value={form.end_time}
                onChange={(e) => setForm({...form, end_time: e.target.value})}
              />
            </div>
          </div>

          <div>
            <Label>Service</Label>
            <Input
              value={form.service_name}
              onChange={(e) => setForm({...form, service_name: e.target.value})}
              placeholder="e.g., Individual Training"
            />
          </div>

          <div>
            <Label>Location</Label>
            <Select value={form.location_id} onValueChange={(v) => setForm({...form, location_id: v})}>
              <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
              <SelectContent>
                {(locations || []).map(loc => (
                  <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({...form, notes: e.target.value})}
              rows={3}
              placeholder="Additional notes..."
            />
          </div>

          <div>
            <Label>Video Consultation Link</Label>
            <Input
              value={form.video_consultation_link}
              onChange={(e) => setForm({...form, video_consultation_link: e.target.value})}
              placeholder="e.g., Zoom, Google Meet link"
            />
          </div>

          <div className="pt-4 border-t">
            <Button 
              onClick={handleSendReminder} 
              disabled={sendingReminder}
              variant="outline"
              className="w-full mb-3 border-blue-300 hover:bg-blue-50"
            >
              <Mail className="w-4 h-4 mr-2" />
              {sendingReminder ? 'Sending...' : 'Send Reminder to Parent & Coach'}
            </Button>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} className="flex-1">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <Button onClick={handleSubmit} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}