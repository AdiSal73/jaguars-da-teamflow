import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { booking_id } = await req.json();

  const bookings = await base44.asServiceRole.entities.Booking.filter({ id: booking_id });
  const booking = bookings[0];

  if (!booking) {
    return Response.json({ error: 'Booking not found' }, { status: 404 });
  }

  const coaches = await base44.asServiceRole.entities.Coach.list();
  const players = await base44.asServiceRole.entities.Player.list();
  const locations = await base44.asServiceRole.entities.Location.list();

  const coach = coaches.find(c => c.id === booking.coach_id);
  const player = players.find(p => p.id === booking.player_id);
  const location = locations.find(l => l.id === booking.location_id);

  const notificationData = {
    date: new Date(booking.booking_date).toLocaleDateString(),
    time: `${booking.start_time} - ${booking.end_time}`,
    player: booking.player_name,
    coach: coach?.full_name || 'Coach',
    service: booking.service_name,
    location: location ? `${location.name} - ${location.address}` : 'TBD'
  };

  // Notify coach
  if (coach?.email) {
    await base44.asServiceRole.entities.Notification.create({
      user_email: coach.email,
      type: 'game',
      title: 'New Booking',
      message: `${notificationData.player} booked ${notificationData.service} on ${notificationData.date} at ${notificationData.time}`,
      priority: 'high'
    });
  }

  // Notify player/parent
  const parentEmails = [];
  if (booking.parent_email) parentEmails.push(booking.parent_email);
  if (player?.parent_emails) parentEmails.push(...player.parent_emails);

  for (const email of [...new Set(parentEmails)]) {
    await base44.asServiceRole.entities.Notification.create({
      user_email: email,
      type: 'game',
      title: 'Booking Confirmed',
      message: `Session with ${notificationData.coach} confirmed for ${notificationData.date} at ${notificationData.time}`,
      priority: 'medium'
    });
  }

  return Response.json({ success: true });
});