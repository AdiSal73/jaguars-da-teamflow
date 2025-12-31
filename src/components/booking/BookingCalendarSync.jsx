import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Download } from 'lucide-react';

export default function BookingCalendarSync({ booking, coach, location }) {
  const generateICS = () => {
    // Parse date correctly to avoid timezone issues
    const [year, month, day] = booking.booking_date.split('-').map(Number);
    const [startHour, startMin] = booking.start_time.split(':').map(Number);
    const [endHour, endMin] = booking.end_time.split(':').map(Number);
    
    const startDate = new Date(year, month - 1, day, startHour, startMin);
    const endDate = new Date(year, month - 1, day, endHour, endMin);
    
    const formatICSDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const locationText = location ? `${location.name}, ${location.address}` : 'Location TBD';
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Soccer Club//Booking//EN',
      'BEGIN:VEVENT',
      `UID:booking-${booking.id}@soccerclub.com`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${booking.service_name} - ${coach?.full_name || 'Coach'}`,
      `DESCRIPTION:Coaching session with ${coach?.full_name || 'Coach'}\\nService: ${booking.service_name}\\nPlayer: ${booking.player_name || ''}${booking.notes ? '\\n\\nNotes: ' + booking.notes : ''}`,
      `LOCATION:${locationText}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT30M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Reminder: Coaching session in 30 minutes',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `coaching-session-${booking.booking_date}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={generateICS}
      className="text-emerald-600 hover:bg-emerald-50"
    >
      <Calendar className="w-4 h-4 mr-2" />
      Add to Calendar
    </Button>
  );
}