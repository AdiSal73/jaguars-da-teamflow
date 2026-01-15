import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { timeSlotId, segmentDate, segmentStartTime, segmentEndTime } = await req.json();

    if (!timeSlotId || !segmentDate || !segmentStartTime || !segmentEndTime) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const timeSlots = await base44.asServiceRole.entities.TimeSlot.filter({ id: timeSlotId });
    const originalSlot = timeSlots[0];

    if (!originalSlot) {
      return Response.json({ error: 'Time slot not found' }, { status: 404 });
    }

    if (originalSlot.date !== segmentDate) {
        return Response.json({ error: 'Time slot date mismatch' }, { status: 400 });
    }

    const toMinutes = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    const originalStartMin = toMinutes(originalSlot.start_time);
    const originalEndMin = toMinutes(originalSlot.end_time);
    const segmentStartMin = toMinutes(segmentStartTime);
    const segmentEndMin = toMinutes(segmentEndTime);

    if (segmentStartMin < originalStartMin || segmentEndMin > originalEndMin || segmentStartMin >= segmentEndMin) {
        return Response.json({ error: 'Invalid segment times relative to original slot' }, { status: 400 });
    }

    const commonProps = {
      location_id: originalSlot.location_id,
      service_names: originalSlot.service_names,
      buffer_before: originalSlot.buffer_before,
      buffer_after: originalSlot.buffer_after,
      coach_id: originalSlot.coach_id,
      date: originalSlot.date,
      is_available: originalSlot.is_available,
      is_recurring_instance: false,
      recurrence_id: null,
    };

    if (originalStartMin === segmentStartMin && originalEndMin === segmentEndMin) {
      await base44.asServiceRole.entities.TimeSlot.delete(originalSlot.id);
      return Response.json({ success: true, message: 'Time slot deleted' });
    }

    if (originalStartMin === segmentStartMin) {
      await base44.asServiceRole.entities.TimeSlot.update(originalSlot.id, {
        start_time: segmentEndTime,
        ...commonProps,
      });
      return Response.json({ success: true, message: 'Time slot start adjusted' });
    }

    if (originalEndMin === segmentEndMin) {
      await base44.asServiceRole.entities.TimeSlot.update(originalSlot.id, {
        end_time: segmentStartTime,
        ...commonProps,
      });
      return Response.json({ success: true, message: 'Time slot end adjusted' });
    }

    if (originalStartMin < segmentStartMin && originalEndMin > segmentEndMin) {
      await base44.asServiceRole.entities.TimeSlot.update(originalSlot.id, {
        end_time: segmentStartTime,
        ...commonProps,
      });

      await base44.asServiceRole.entities.TimeSlot.create({
        ...commonProps,
        start_time: segmentEndTime,
        end_time: originalSlot.end_time,
      });
      return Response.json({ success: true, message: 'Time slot split and segment removed' });
    }

    return Response.json({ error: 'Segment could not be removed' }, { status: 400 });

  } catch (error) {
    console.error('Error removing availability segment:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});