import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    
    // Try to match email with existing player or parent
    let matchedPlayerId = null;
    let matchedParentId = null;
    
    if (body.parent_email) {
      // Check if email matches a registered user
      const users = await base44.asServiceRole.entities.User.filter({ email: body.parent_email });
      if (users.length > 0) {
        matchedParentId = users[0].id;
        // If user has player_ids, use the first one
        if (users[0].player_ids && users[0].player_ids.length > 0) {
          matchedPlayerId = users[0].player_ids[0];
        }
      }
      
      // Check if email matches a player directly
      const players = await base44.asServiceRole.entities.Player.list();
      const matchingPlayer = players.find(p => 
        p.player_email === body.parent_email || 
        (p.parent_emails && p.parent_emails.includes(body.parent_email)) ||
        p.email === body.parent_email
      );
      
      if (matchingPlayer && !matchedPlayerId) {
        matchedPlayerId = matchingPlayer.id;
      }
    }
    
    // Create the booking with matched IDs
    const bookingData = {
      ...body,
      player_id: matchedPlayerId || body.player_id,
      parent_id: matchedParentId || body.parent_id
    };
    
    const booking = await base44.asServiceRole.entities.Booking.create(bookingData);
    
    // Get location for email
    const locations = await base44.asServiceRole.entities.Location.list();
    const location = locations.find(l => l.id === booking.location_id);
    const locationInfo = location ? `${location.name} - ${location.address}` : 'Location TBD';
    
    // Get coach
    const coaches = await base44.asServiceRole.entities.Coach.filter({ id: booking.coach_id });
    const coach = coaches[0];
    
    try {
      // Send email to client
      await base44.asServiceRole.functions.invoke('sendBookingEmail', {
        to: booking.parent_email,
        subject: `Booking Confirmed - ${booking.service_name}`,
        booking: { 
          ...booking, 
          location_info: locationInfo, 
          booked_by_name: 'Guest' 
        },
        type: 'confirmation_client'
      });

      // Send email to coach
      if (coach?.email) {
        await base44.asServiceRole.functions.invoke('sendBookingEmail', {
          to: coach.email,
          subject: `New Booking - ${booking.player_name}`,
          booking: { 
            ...booking, 
            location_info: locationInfo, 
            booked_by_name: booking.parent_email 
          },
          type: 'confirmation_coach'
        });
      }
    } catch (emailError) {
      console.error('Email error:', emailError);
    }
    
    return Response.json(booking);
  } catch (error) {
    console.error('Error creating public booking:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});