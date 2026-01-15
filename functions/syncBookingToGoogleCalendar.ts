import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId, action } = await req.json();
    
    if (!bookingId) {
      return Response.json({ error: 'Booking ID required' }, { status: 400 });
    }

    // Get coach's Google Calendar access token
    const coaches = await base44.asServiceRole.entities.Coach.filter({ id: booking.coach_id });
    const coach = coaches[0];

    if (!coach) {
      return Response.json({ error: 'Coach not found for this booking' }, { status: 404 });
    }

    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlecalendar', coach.email);
    
    if (!accessToken) {
      return Response.json({ error: 'Google Calendar not connected. Please connect your calendar first.' }, { status: 400 });
    }

    // Fetch booking details
    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
    const booking = bookings[0];
    
    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    const startDateTime = `${booking.booking_date}T${booking.start_time}:00`;
    const endDateTime = `${booking.booking_date}T${booking.end_time}:00`;

    if (action === 'delete' && booking.google_calendar_event_id) {
      // Delete event from Google Calendar
      const deleteResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${booking.google_calendar_event_id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!deleteResponse.ok) {
        throw new Error('Failed to delete calendar event');
      }

      // Remove event ID from booking
      await base44.asServiceRole.entities.Booking.update(bookingId, {
        google_calendar_event_id: null
      });

      return Response.json({ success: true, message: 'Event removed from calendar' });
    }

    // Create or update event in Google Calendar
    const event = {
      summary: `${booking.service_name} Session${booking.player_name ? ` - ${booking.player_name}` : ''}`,
      description: booking.notes || `Coaching session with ${booking.coach_name}`,
      start: {
        dateTime: startDateTime,
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'America/New_York',
      },
      location: booking.location_id ? 'Training Location' : '',
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
          { method: 'email', minutes: 1440 },
        ],
      },
    };

    let eventId = booking.google_calendar_event_id;
    let method = 'POST';
    let url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

    if (eventId) {
      // Update existing event
      method = 'PUT';
      url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`;
    } else {
      // Check if an event already exists for this booking by searching for it
      const searchUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?q=${encodeURIComponent(booking.service_name)}&timeMin=${startDateTime}Z&timeMax=${endDateTime}Z`;
      const searchResponse = await fetch(searchUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        // Check if we find an existing event that matches this booking
        const existingEvent = searchData.items?.find(item => {
          const isSameTime = item.start?.dateTime?.includes(startDateTime) && item.end?.dateTime?.includes(endDateTime);
          const isSameTitle = item.summary?.includes(booking.service_name);
          return isSameTime && isSameTitle;
        });

        if (existingEvent) {
          // Update the existing event instead of creating a duplicate
          eventId = existingEvent.id;
          method = 'PUT';
          url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`;
          
          // Store the event ID in the booking
          await base44.asServiceRole.entities.Booking.update(bookingId, {
            google_calendar_event_id: eventId
          });
        }
      }
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Google Calendar API error: ${errorData}`);
    }

    const calendarEvent = await response.json();

    // Store Google Calendar event ID in booking
    await base44.asServiceRole.entities.Booking.update(bookingId, {
      google_calendar_event_id: calendarEvent.id
    });

    return Response.json({ 
      success: true, 
      eventId: calendarEvent.id,
      message: eventId ? 'Calendar event updated' : 'Event added to calendar'
    });
  } catch (error) {
    console.error('Calendar sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});