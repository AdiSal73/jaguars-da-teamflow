import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { to, subject, booking, type } = body;

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    const formatTimeDisplay = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    // Parse date correctly to avoid timezone issues - force UTC
    const [year, month, day] = booking.booking_date.split('-').map(Number);
    const bookingDate = new Date(Date.UTC(year, month - 1, day));
    const formattedDate = bookingDate.toLocaleDateString('en-US', { 
      timeZone: 'UTC',
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    let html, text;

    if (type === 'confirmation_coach') {
      html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">New Session Booked</h1>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #059669; margin-top: 0; margin-bottom: 20px; font-size: 20px; font-weight: 600;">Session Details</h2>
            
            <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Player:</td>
                  <td style="padding: 8px 0; color: #1e293b; font-weight: 600; text-align: right;">${booking.player_name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Booked by:</td>
                  <td style="padding: 8px 0; color: #1e293b; font-weight: 600; text-align: right;">${booking.booked_by_name}</td>
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
                  <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Duration:</td>
                  <td style="padding: 8px 0; color: #1e293b; font-weight: 600; text-align: right;">${booking.duration} minutes</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Location:</td>
                  <td style="padding: 8px 0; color: #1e293b; font-weight: 600; text-align: right;">${booking.location_info}</td>
                </tr>
              </table>
            </div>
            
            ${booking.notes ? `
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                <p style="margin: 0; color: #92400e; font-size: 14px;"><strong>Client Notes:</strong></p>
                <p style="margin: 8px 0 0 0; color: #92400e; font-size: 14px;">${booking.notes}</p>
              </div>
            ` : ''}
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 14px; margin: 0;">Michigan Jaguars Player Development</p>
            </div>
          </div>
        </div>
      `;
      text = `New Session Booked\n\nPlayer: ${booking.player_name}\nBooked by: ${booking.booked_by_name}\nService: ${booking.service_name}\nDate: ${formattedDate}\nTime: ${formatTimeDisplay(booking.start_time)} - ${formatTimeDisplay(booking.end_time)}\nDuration: ${booking.duration} minutes\nLocation: ${booking.location_info}${booking.notes ? '\n\nClient Notes: ' + booking.notes : ''}`;
    } else if (type === 'confirmation_client') {
      html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 10px;">✓</div>
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Booking Confirmed!</h1>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #059669; margin-top: 0; margin-bottom: 20px; font-size: 20px; font-weight: 600;">Session Details</h2>
            
            <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Coach:</td>
                  <td style="padding: 8px 0; color: #1e293b; font-weight: 600; text-align: right;">${booking.coach_name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Player:</td>
                  <td style="padding: 8px 0; color: #1e293b; font-weight: 600; text-align: right;">${booking.player_name}</td>
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
                  <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Duration:</td>
                  <td style="padding: 8px 0; color: #1e293b; font-weight: 600; text-align: right;">${booking.duration} minutes</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Location:</td>
                  <td style="padding: 8px 0; color: #1e293b; font-weight: 600; text-align: right;">${booking.location_info}</td>
                </tr>
              </table>
            </div>
            
            ${booking.notes ? `
              <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                <p style="margin: 0; color: #1e3a8a; font-size: 14px;"><strong>Your Notes:</strong></p>
                <p style="margin: 8px 0 0 0; color: #1e3a8a; font-size: 14px;">${booking.notes}</p>
              </div>
            ` : ''}
            
            <div style="background: #fef9c3; border-left: 4px solid #eab308; padding: 15px; border-radius: 6px; margin-top: 20px;">
              <p style="margin: 0; color: #713f12; font-size: 14px;">If you need to reschedule or cancel, please contact your coach directly as soon as possible.</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 14px; margin: 0;">Michigan Jaguars Player Development</p>
            </div>
          </div>
        </div>
      `;
      text = `Booking Confirmed!\n\nCoach: ${booking.coach_name}\nPlayer: ${booking.player_name}\nService: ${booking.service_name}\nDate: ${formattedDate}\nTime: ${formatTimeDisplay(booking.start_time)} - ${formatTimeDisplay(booking.end_time)}\nDuration: ${booking.duration} minutes\nLocation: ${booking.location_info}${booking.notes ? '\n\nYour Notes: ' + booking.notes : ''}\n\nIf you need to reschedule or cancel, please contact your coach directly.`;
    } else if (type === 'cancellation') {
      html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 10px;">✗</div>
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Booking Cancelled</h1>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="color: #1e293b; font-size: 16px; margin-top: 0;">The following session has been cancelled:</p>
            
            <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Coach:</td>
                  <td style="padding: 8px 0; color: #1e293b; font-weight: 600; text-align: right;">${booking.coach_name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Player:</td>
                  <td style="padding: 8px 0; color: #1e293b; font-weight: 600; text-align: right;">${booking.player_name}</td>
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
              </table>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 14px; margin: 0;">Michigan Jaguars Player Development</p>
            </div>
          </div>
        </div>
      `;
      text = `Booking Cancelled\n\nThe following session has been cancelled:\n\nCoach: ${booking.coach_name}\nPlayer: ${booking.player_name}\nService: ${booking.service_name}\nDate: ${formattedDate}\nTime: ${formatTimeDisplay(booking.start_time)} - ${formatTimeDisplay(booking.end_time)}`;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Michigan Jaguars <onboarding@resend.dev>',
        to: [to],
        subject,
        html,
        text
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        booking: booking,
        recipient: to
      });
      return Response.json({ 
        error: `Resend API error (${response.status}): ${errorText}`,
        details: { status: response.status, body: errorText }
      }, { status: 500 });
    }

    const result = await response.json();
    console.log('Email sent successfully:', { to, type, emailId: result.id });
    return Response.json({ success: true, id: result.id });

  } catch (error) {
    console.error('sendBookingEmail function error:', {
      message: error.message,
      stack: error.stack,
      booking
    });
    return Response.json({ 
      error: error.message,
      stack: error.stack,
      context: 'sendBookingEmail function'
    }, { status: 500 });
  }
});