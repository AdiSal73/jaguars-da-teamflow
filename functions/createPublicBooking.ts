import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    
    // Create the booking using service role
    const booking = await base44.asServiceRole.entities.Booking.create(body);
    
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