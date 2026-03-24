import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    console.log('Creating IDP meetings from completed bookings...');
    
    // Get all completed bookings
    const bookings = await base44.asServiceRole.entities.Booking.list();
    const completedBookings = bookings.filter(b => b.status === 'completed');
    
    console.log(`Found ${completedBookings.length} completed bookings`);
    
    // Get existing IDP meetings to avoid duplicates
    const existingMeetings = await base44.asServiceRole.entities.IDPMeeting.list();
    
    let created = 0;
    let skipped = 0;
    
    for (const booking of completedBookings) {
      // Check if IDP meeting already exists for this booking
      const existingMeeting = existingMeetings.find(m => 
        m.player_id === booking.player_id &&
        m.coach_id === booking.coach_id &&
        m.meeting_date === booking.booking_date &&
        m.meeting_time === booking.start_time
      );
      
      if (existingMeeting) {
        console.log(`Skipping - IDP meeting already exists for ${booking.player_name}`);
        skipped++;
        continue;
      }
      
      // Create IDP meeting record
      await base44.asServiceRole.entities.IDPMeeting.create({
        player_id: booking.player_id,
        player_name: booking.player_name,
        coach_id: booking.coach_id,
        coach_name: booking.coach_name,
        meeting_date: booking.booking_date,
        meeting_time: booking.start_time,
        location: booking.location_id ? (await base44.asServiceRole.entities.Location.filter({ id: booking.location_id }))[0]?.name : 'N/A',
        notes: `IDP Session: ${booking.service_name}${booking.notes ? '\n\nBooking Notes: ' + booking.notes : ''}`
      });
      
      console.log(`Created IDP meeting for ${booking.player_name} with ${booking.coach_name}`);
      created++;
    }
    
    console.log(`Completed: ${created} created, ${skipped} skipped`);
    
    return Response.json({ 
      success: true,
      created,
      skipped,
      total: completedBookings.length
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});