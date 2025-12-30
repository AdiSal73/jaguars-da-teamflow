import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Get all confirmed bookings for tomorrow
    const bookings = await base44.asServiceRole.entities.Booking.filter({
      booking_date: tomorrowStr,
      status: 'confirmed'
    });

    const [coaches, locations] = await Promise.all([
      base44.asServiceRole.entities.Coach.list(),
      base44.asServiceRole.entities.Location.list()
    ]);

    let sent = 0;
    let failed = 0;

    for (const booking of bookings) {
      try {
        const coach = coaches.find(c => c.id === booking.coach_id);
        const location = locations.find(l => l.id === booking.location_id);
        const locationInfo = location ? `${location.name} - ${location.address}` : 'Location TBD';

        if (!booking.parent_email) continue;

        const formatTimeDisplay = (timeStr) => {
          const [hours, minutes] = timeStr.split(':').map(Number);
          const period = hours >= 12 ? 'PM' : 'AM';
          const displayHours = hours % 12 || 12;
          return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
        };

        const [year, month, day] = booking.booking_date.split('-').map(Number);
        const bookingDate = new Date(Date.UTC(year, month - 1, day));
        const formattedDate = bookingDate.toLocaleDateString('en-US', { 
          timeZone: 'UTC',
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });

        const html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">⏰</div>
              <h1 style="color: white; margin: 0; font-size: 28px;">Session Reminder</h1>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <p style="font-size: 18px; color: #1e293b; margin-top: 0;">Hi ${booking.player_name},</p>
              <p style="color: #475569;">This is a friendly reminder about your upcoming session tomorrow:</p>
              
              <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Coach:</td>
                    <td style="padding: 8px 0; color: #1e293b; font-weight: 600; text-align: right;">${coach?.full_name || booking.coach_name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Service:</td>
                    <td style="padding: 8px 0; color: #1e293b; font-weight: 600; text-align: right;">${booking.service_name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Date:</td>
                    <td style="padding: 8px 0; color: #1e293b; font-weight: 600; text-align: right;">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Time:</td>
                    <td style="padding: 8px 0; color: #1e293b; font-weight: 600; text-align: right;">${formatTimeDisplay(booking.start_time)} - ${formatTimeDisplay(booking.end_time)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Location:</td>
                    <td style="padding: 8px 0; color: #1e293b; font-weight: 600; text-align: right;">${locationInfo}</td>
                  </tr>
                </table>
              </div>
              
              <p style="color: #475569;">We look forward to seeing you!</p>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <p style="color: #64748b; font-size: 14px; margin: 0;">Michigan Jaguars Player Development</p>
              </div>
            </div>
          </div>
        `;

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Michigan Jaguars Academy <academy@jaguarsidp.com>',
            to: [booking.parent_email],
            subject: `Reminder: ${booking.service_name} Session Tomorrow`,
            html
          })
        });

        if (response.ok) {
          // Create in-app notification
          await base44.asServiceRole.entities.Notification.create({
            user_email: booking.parent_email,
            type: 'training',
            title: 'Session Reminder',
            message: `Your session with ${coach?.full_name || booking.coach_name} is tomorrow at ${formatTimeDisplay(booking.start_time)}`,
            priority: 'high'
          });
          sent++;
        } else {
          failed++;
          console.error('Failed to send reminder:', await response.text());
        }
      } catch (error) {
        failed++;
        console.error('Error sending reminder:', error);
      }
    }

    return Response.json({ 
      success: true, 
      sent, 
      failed,
      totalBookings: bookings.length
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});