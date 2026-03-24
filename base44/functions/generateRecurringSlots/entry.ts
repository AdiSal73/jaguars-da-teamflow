import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generates TimeSlot instances for a recurrence pattern up to a certain date
 * Run this periodically (e.g., weekly) or trigger when viewing calendar
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate admin/coach
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pattern_id, generate_until_date } = await req.json();
    
    if (!pattern_id || !generate_until_date) {
      return Response.json({ error: 'pattern_id and generate_until_date required' }, { status: 400 });
    }

    // Get the recurrence pattern
    const patterns = await base44.asServiceRole.entities.RecurrencePattern.filter({ id: pattern_id });
    if (patterns.length === 0) {
      return Response.json({ error: 'Pattern not found' }, { status: 404 });
    }
    
    const pattern = patterns[0];
    
    if (!pattern.is_active) {
      return Response.json({ message: 'Pattern is inactive', generated: 0 });
    }

    // Get existing slots for this recurrence
    const existingSlots = await base44.asServiceRole.entities.TimeSlot.filter({
      recurrence_id: pattern_id
    });
    
    const existingDates = new Set(existingSlots.map(s => s.date));
    
    const startDate = new Date(pattern.recurrence_start_date);
    const endDate = pattern.recurrence_end_date 
      ? new Date(Math.min(new Date(pattern.recurrence_end_date), new Date(generate_until_date)))
      : new Date(generate_until_date);
    
    const slotsToCreate = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      
      if (dayOfWeek === pattern.day_of_week) {
        const dateStr = currentDate.toISOString().split('T')[0];
        
        if (!existingDates.has(dateStr)) {
          slotsToCreate.push({
            coach_id: pattern.coach_id,
            date: dateStr,
            start_time: pattern.start_time,
            end_time: pattern.end_time,
            location_id: pattern.location_id,
            service_names: pattern.service_names || [],
            buffer_before: pattern.buffer_before || 0,
            buffer_after: pattern.buffer_after || 0,
            is_available: true,
            recurrence_id: pattern_id,
            is_recurring_instance: true
          });
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (slotsToCreate.length > 0) {
      await base44.asServiceRole.entities.TimeSlot.bulkCreate(slotsToCreate);
    }

    return Response.json({
      success: true,
      pattern_id,
      generated: slotsToCreate.length,
      message: `Generated ${slotsToCreate.length} time slots`
    });
  } catch (error) {
    console.error('Error generating slots:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});