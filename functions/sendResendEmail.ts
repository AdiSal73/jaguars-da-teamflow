import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { to, template_name, variables } = await req.json();

    if (!to || !template_name) {
      return Response.json({ error: 'Missing required fields: to, template_name' }, { status: 400 });
    }

    // Fetch template
    const templates = await base44.asServiceRole.entities.EmailTemplate.filter({ 
      template_name, 
      is_active: true 
    });

    if (templates.length === 0) {
      return Response.json({ error: 'Template not found or inactive' }, { status: 404 });
    }

    const template = templates[0];

    // Replace variables in template
    let subject = template.subject;
    let htmlContent = template.html_content;
    let textContent = template.text_content || '';

    if (variables) {
      Object.keys(variables).forEach(key => {
        const value = variables[key];
        subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value);
        htmlContent = htmlContent.replace(new RegExp(`{{${key}}}`, 'g'), value);
        textContent = textContent.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });
    }

    // Send email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Soccer Club <onboarding@resend.dev>',
        to: [to],
        subject: subject,
        html: htmlContent,
        text: textContent
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return Response.json({ error: 'Failed to send email', details: result }, { status: response.status });
    }

    return Response.json({ success: true, email_id: result.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});