import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    console.log('Starting scheduled sync of all bookings to Google Calendar...');

    // Fetch all active bookings (confirmed/pending, not cancelled)
    const allBookings = await base44.asServiceRole.entities.Booking.filter({
      status: { $in: ['confirmed', 'pending'] }
    });

    console.log(`Found ${allBookings.length} active bookings`);

    // Fetch all users with their emails
    const allUsers = await base44.asServiceRole.entities.User.list();
    const coaches = await base44.asServiceRole.entities.Coach.list();
    
    // Group bookings by user (coach or parent)
    const bookingsByUser = new Map();
    
    for (const booking of allBookings) {
      // Add coach
      const coach = coaches.find(c => c.id === booking.coach_id);
      if (coach?.email) {
        if (!bookingsByUser.has(coach.email)) {
          bookingsByUser.set(coach.email, []);
        }
        bookingsByUser.get(coach.email).push(booking);
      }
      
      // Add parent/booker
      if (booking.parent_email) {
        if (!bookingsByUser.has(booking.parent_email)) {
          bookingsByUser.set(booking.parent_email, []);
        }
        bookingsByUser.get(booking.parent_email).push(booking);
      }
      
      // Add user who created booking
      if (booking.created_by) {
        if (!bookingsByUser.has(booking.created_by)) {
          bookingsByUser.set(booking.created_by, []);
        }
        bookingsByUser.get(booking.created_by).push(booking);
      }
    }

    console.log(`Processing bookings for ${bookingsByUser.size} users`);

    const results = {
      total_users: bookingsByUser.size,
      synced: 0,
      skipped: 0,
      failed: 0,
      errors: []
    };

    // Sync bookings for each user
    for (const [userEmail, bookings] of bookingsByUser.entries()) {
      try {
        console.log(`Processing ${bookings.length} bookings for ${userEmail}`);
        
        // Get user's Google Calendar access token
        const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlecalendar', userEmail);
        
        if (!accessToken) {
          console.log(`Skipping ${userEmail} - Google Calendar not connected`);
          results.skipped++;
          continue;
        }

        // Process each booking for this user
        for (const booking of bookings) {
          try {
            const startDateTime = `${booking.booking_date}T${booking.start_time}:00`;
            const endDateTime = `${booking.booking_date}T${booking.end_time}:00`;

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
              reminders: {
                useDefault: false,
                overrides: [
                  { method: 'popup', minutes: 30 },
                  { method: 'email', minutes: 1440 },
                ],
              },
            };

            let method = 'POST';
            let url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

            // If event already exists, update it
            if (booking.google_calendar_event_id) {
              method = 'PUT';
              url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${booking.google_calendar_event_id}`;
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
              const errorText = await response.text();
              console.error(`Failed to sync booking ${booking.id} for ${userEmail}: ${errorText}`);
              results.failed++;
              results.errors.push({
                userEmail,
                bookingId: booking.id,
                error: errorText
              });
              continue;
            }

            const calendarEvent = await response.json();

            // Update booking with event ID if it's new
            if (!booking.google_calendar_event_id) {
              await base44.asServiceRole.entities.Booking.update(booking.id, {
                google_calendar_event_id: calendarEvent.id
              });
            }

            console.log(`Synced booking ${booking.id} for ${userEmail}`);
          } catch (bookingError) {
            console.error(`Error syncing booking ${booking.id}:`, bookingError);
            results.failed++;
            results.errors.push({
              userEmail,
              bookingId: booking.id,
              error: bookingError.message
            });
          }
        }

        results.synced++;
      } catch (userError) {
        console.error(`Error processing user ${userEmail}:`, userError);
        results.failed++;
        results.errors.push({
          userEmail,
          error: userError.message
        });
      }
    }

    console.log('Sync completed:', results);

    return Response.json({
      success: true,
      message: 'Calendar sync completed',
      results
    });
  } catch (error) {
    console.error('Scheduled sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});