import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const coachId = url.searchParams.get('coach_id');
    
    if (!coachId) {
      return Response.json({ error: 'coach_id parameter is required' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    
    // Use service role to fetch public data
    const coach = await base44.asServiceRole.entities.Coach.filter({ id: coachId });
    
    if (!coach || coach.length === 0) {
      return Response.json({ error: 'Coach not found' }, { status: 404 });
    }
    
    const timeSlots = await base44.asServiceRole.entities.TimeSlot.filter({ coach_id: coachId });
    const bookings = await base44.asServiceRole.entities.Booking.filter({ coach_id: coachId });
    const locations = await base44.asServiceRole.entities.Location.list();
    
    return Response.json({
      coach: coach[0],
      timeSlots,
      bookings,
      locations
    });
  } catch (error) {
    console.error('Error fetching public coach data:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});