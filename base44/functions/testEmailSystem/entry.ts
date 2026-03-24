import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    const { test_email } = await req.json();

    if (!test_email) {
      return Response.json({ error: 'test_email required' }, { status: 400 });
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    
    if (!RESEND_API_KEY) {
      return Response.json({ 
        error: 'RESEND_API_KEY not configured',
        details: 'Please set the RESEND_API_KEY environment variable'
      }, { status: 500 });
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Soccer Club <onboarding@resend.dev>',
        to: [test_email],
        subject: 'Email System Test - Soccer Club',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; width: 60px; height: 60px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 12px; margin-bottom: 20px;"></div>
              <h1 style="color: #10b981; margin: 0;">✅ Email System Working!</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 12px; margin-bottom: 20px;">
              <p style="font-size: 16px; color: #334155; margin-bottom: 20px;">
                This is a test email to verify that the email system is working correctly.
              </p>
              <p style="font-size: 14px; color: #64748b;">
                <strong>Sent at:</strong> ${new Date().toLocaleString()}<br>
                <strong>API:</strong> Resend<br>
                <strong>Status:</strong> Success ✓
              </p>
            </div>
            <p style="font-size: 12px; color: #94a3b8; text-align: center;">
              Soccer Club Management System - Email Test
            </p>
          </div>
        `
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json({ 
        success: false,
        error: 'Failed to send test email', 
        status: response.status,
        details: data,
        api_key_present: !!RESEND_API_KEY,
        api_key_length: RESEND_API_KEY?.length
      }, { status: 200 });
    }

    return Response.json({ 
      success: true,
      message: 'Test email sent successfully',
      email_id: data.id,
      sent_to: test_email,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 200 });
  }
});