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

    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Get all confirmed/completed bookings from yesterday
    const bookings = await base44.asServiceRole.entities.Booking.filter({
      booking_date: yesterdayStr
    });

    const confirmedBookings = bookings.filter(b => 
      b.status === 'confirmed' || b.status === 'completed'
    );

    const coaches = await base44.asServiceRole.entities.Coach.list();

    let sent = 0;
    let failed = 0;

    for (const booking of confirmedBookings) {
      try {
        const coach = coaches.find(c => c.id === booking.coach_id);
        if (!booking.parent_email) continue;

        const html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">💭</div>
              <h1 style="color: white; margin: 0; font-size: 28px;">How Was Your Session?</h1>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <p style="font-size: 18px; color: #1e293b; margin-top: 0;">Hi ${booking.player_name},</p>
              <p style="color: #475569;">We hope you enjoyed your recent session with ${coach?.full_name || booking.coach_name}!</p>
              
              <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                <p style="margin: 0; color: #1e40af; font-weight: 600;">Session: ${booking.service_name}</p>
                <p style="margin: 8px 0 0 0; color: #1e40af;">Date: ${new Date(booking.booking_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              </div>
              
              <p style="color: #475569;">Your feedback helps us improve! Please take a moment to share your thoughts about the session.</p>
              
              <p style="color: #475569; font-size: 14px; margin-top: 20px;">You can reply to this email or contact your coach directly through the app.</p>
              
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
            subject: 'How was your session? We\'d love your feedback!',
            html
          })
        });

        if (response.ok) {
          sent++;
        } else {
          failed++;
          console.error('Failed to send feedback request:', await response.text());
        }
      } catch (error) {
        failed++;
        console.error('Error sending feedback request:', error);
      }
    }

    return Response.json({ 
      success: true, 
      sent, 
      failed,
      totalBookings: confirmedBookings.length
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});