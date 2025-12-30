import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const bookings = await base44.asServiceRole.entities.Booking.filter({ 
    booking_date: tomorrowStr,
    status: 'confirmed'
  });

  const coaches = await base44.asServiceRole.entities.Coach.list();
  const players = await base44.asServiceRole.entities.Player.list();
  const locations = await base44.asServiceRole.entities.Location.list();

  for (const booking of bookings) {
    const coach = coaches.find(c => c.id === booking.coach_id);
    const player = players.find(p => p.id === booking.player_id);
    const location = locations.find(l => l.id === booking.location_id);

    const details = {
      player: booking.player_name,
      coach: coach?.full_name || 'Coach',
      date: new Date(booking.booking_date).toLocaleDateString(),
      time: `${booking.start_time} - ${booking.end_time}`,
      service: booking.service_name,
      location: location ? `${location.name} - ${location.address}` : 'TBD'
    };

    // Notify coach
    if (coach?.email) {
      await base44.asServiceRole.entities.Notification.create({
        user_email: coach.email,
        type: 'training',
        title: 'Session Tomorrow',
        message: `${details.player} - ${details.service} at ${details.time} (${details.location})`,
        priority: 'high'
      });

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: coach.email,
        subject: `Reminder: Session Tomorrow with ${details.player}`,
        body: `Hi ${coach.full_name},\n\nReminder of your upcoming session:\n\nPlayer: ${details.player}\nService: ${details.service}\nDate: ${details.date}\nTime: ${details.time}\nLocation: ${details.location}\n\nSee you there!`
      });
    }

    // Notify player/parent
    const parentEmails = [];
    if (booking.parent_email) parentEmails.push(booking.parent_email);
    if (player?.parent_emails) parentEmails.push(...player.parent_emails);

    for (const email of [...new Set(parentEmails)]) {
      await base44.asServiceRole.entities.Notification.create({
        user_email: email,
        type: 'training',
        title: 'Session Tomorrow',
        message: `${details.player} has a session with ${details.coach} at ${details.time} - ${details.service}`,
        priority: 'high'
      });

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject: `Reminder: ${details.player}'s Session Tomorrow`,
        body: `Hi,\n\nReminder of ${details.player}'s upcoming session:\n\nCoach: ${details.coach}\nService: ${details.service}\nDate: ${details.date}\nTime: ${details.time}\nLocation: ${details.location}\n\nSee you there!`
      });
    }
  }

  return Response.json({ 
    success: true, 
    reminders_sent: bookings.length 
  });
});