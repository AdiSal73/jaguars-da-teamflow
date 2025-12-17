import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Missing email' }, { status: 400 });
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Soccer Club <onboarding@resend.dev>',
        to: [email],
        subject: '✅ Test Email from Soccer Club Management System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 16px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">✅</span>
              </div>
              <h1 style="color: #10b981; margin: 0; font-size: 28px;">Email System Test</h1>
            </div>
            <div style="background: linear-gradient(135deg, #f0fdf4, #dcfce7); padding: 30px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #10b981;">
              <p style="font-size: 18px; color: #166534; margin-bottom: 20px; font-weight: bold;">
                ✅ Email System is Working!
              </p>
              <p style="font-size: 16px; color: #334155; margin-bottom: 15px;">
                This is a test email from your Soccer Club Management System.
              </p>
              <p style="font-size: 14px; color: #64748b; margin-bottom: 10px;">
                <strong>Sent:</strong> ${new Date().toLocaleString()}
              </p>
              <p style="font-size: 14px; color: #64748b; margin-bottom: 10px;">
                <strong>To:</strong> ${email}
              </p>
              <p style="font-size: 14px; color: #64748b;">
                <strong>System:</strong> Resend API
              </p>
            </div>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <p style="font-size: 14px; color: #475569; margin: 0;">
                <strong>✅ Features Verified:</strong>
              </p>
              <ul style="font-size: 14px; color: #64748b; margin-top: 10px;">
                <li>Email delivery system active</li>
                <li>HTML formatting working</li>
                <li>User invitations ready to send</li>
                <li>Notification system operational</li>
              </ul>
            </div>
            <p style="font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px;">
              This is an automated test email from Soccer Club Management System
            </p>
          </div>
        `
      })
    });

    const resendResult = await resendResponse.json();

    if (!resendResponse.ok) {
      return Response.json({ 
        error: 'Failed to send email via Resend', 
        details: resendResult,
        status_code: resendResponse.status 
      }, { status: resendResponse.status });
    }

    return Response.json({ 
      success: true, 
      email_id: resendResult.id,
      message: `Test email sent successfully to ${email}` 
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});