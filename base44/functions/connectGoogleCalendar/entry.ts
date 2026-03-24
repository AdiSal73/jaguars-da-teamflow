import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has Google Calendar connected
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlecalendar', user.email);
    
    return Response.json({ 
      connected: !!accessToken,
      email: user.email
    });
  } catch (error) {
    console.error('Check connection error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});