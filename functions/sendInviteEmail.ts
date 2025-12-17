import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, full_name, role, app_url } = await req.json();

    if (!email) {
      return Response.json({ error: 'Missing email' }, { status: 400 });
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    const roleText = role === 'coach' ? 'Coach' : role === 'parent' ? 'Parent' : 'User';

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Soccer Club <onboarding@resend.dev>',
        to: [email],
        subject: 'Welcome to Soccer Club Management System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; width: 60px; height: 60px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 12px; margin-bottom: 20px;"></div>
              <h1 style="color: #10b981; margin: 0;">Welcome to Soccer Club!</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 12px; margin-bottom: 20px;">
              <p style="font-size: 16px; color: #334155; margin-bottom: 20px;">
                Hi ${full_name || 'there'},
              </p>
              <p style="font-size: 16px; color: #334155; margin-bottom: 20px;">
                You've been invited to join our Soccer Club Management System as a ${roleText}.
              </p>
              <p style="font-size: 16px; color: #334155; margin-bottom: 30px;">
                Click the button below to set up your account and get started:
              </p>
              <div style="text-align: center;">
                <a href="${app_url || window.location.origin}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  Get Started
                </a>
              </div>
            </div>
            <p style="font-size: 12px; color: #94a3b8; text-align: center;">
              If you have any questions, please contact your administrator.
            </p>
          </div>
        `
      })
    });

    const resendResult = await resendResponse.json();

    if (!resendResponse.ok) {
      return Response.json({ error: 'Failed to send email via Resend', details: resendResult }, { status: resendResponse.status });
    }

    return Response.json({ success: true, email_id: resendResult.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});