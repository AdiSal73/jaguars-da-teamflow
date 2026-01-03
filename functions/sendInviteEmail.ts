export default async function handler(req) {
  const { Resend } = await import('npm:resend@4.0.0');
  const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

  const body = await req.json();
  const { email, full_name, role, app_url } = body;

  const loginUrl = `${app_url || 'https://jaguarsidp.com'}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to Michigan Jaguars!</h1>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
          Hello ${full_name || 'there'},
        </p>
        
        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
          You've been invited to join the Michigan Jaguars Player Development Platform! This platform helps you stay connected with your player's progress, training, and team activities.
        </p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">Your account email:</p>
          <p style="margin: 5px 0 0 0; color: #111827; font-size: 16px; font-weight: 600;">${email}</p>
        </div>
        
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #92400e; font-size: 16px;">📋 Getting Started - Step by Step:</h3>
          <ol style="margin: 0; padding-left: 20px; color: #78350f; font-size: 14px; line-height: 1.8;">
            <li><strong>Click the button below</strong> to access the login page</li>
            <li><strong>Sign in with Google or email</strong> using the email address above (${email})</li>
            <li><strong>If it's your first time:</strong> You'll be asked to create a password or sign in with Google</li>
            <li><strong>Once logged in:</strong> You'll have full access to your player's dashboard, schedules, and communications</li>
          </ol>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" 
             style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            🚀 Access Your Account
          </a>
        </div>
        
        <div style="background: #e0f2fe; border-left: 4px solid #0284c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #075985; font-size: 16px;">🔐 Password & Security:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #0c4a6e; font-size: 14px; line-height: 1.8;">
            <li><strong>First-time users:</strong> You'll set your password during your first login</li>
            <li><strong>Forgot password?</strong> Click "Forgot Password" on the login page and follow the instructions</li>
            <li><strong>Reset password:</strong> You'll receive an email with a secure link to create a new password</li>
            <li><strong>Google Sign-In:</strong> You can also use "Sign in with Google" for quick access</li>
          </ul>
        </div>
        
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #374151; font-size: 14px;">💡 Quick Tips:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #6b7280; font-size: 13px; line-height: 1.6;">
            <li>Bookmark the login page for easy access</li>
            <li>Enable notifications to stay updated on your player's activities</li>
            <li>Check the Communications tab regularly for important announcements</li>
            <li>Your player's dashboard shows their latest assessments, evaluations, and goals</li>
          </ul>
        </div>
        
        <div style="border-top: 2px solid #e5e7eb; margin-top: 30px; padding-top: 20px;">
          <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
            <strong>Need help?</strong> If you experience any issues logging in or have questions about the platform, please contact your coach or team administrator. We're here to help!
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; padding: 20px;">
        <p style="font-size: 12px; color: #9ca3af; margin: 0;">
          © ${new Date().getFullYear()} Michigan Jaguars. All rights reserved.
        </p>
        <p style="font-size: 12px; color: #9ca3af; margin: 5px 0 0 0;">
          This invitation was sent to ${email}
        </p>
      </div>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Michigan Jaguars <Academy@jaguarsidp.com>',
      to: [email],
      subject: '🎉 Welcome to Michigan Jaguars - Get Started in 4 Easy Steps!',
      html: htmlContent,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, messageId: data.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}