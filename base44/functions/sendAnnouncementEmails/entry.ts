import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { announcement_id } = await req.json();

    if (!announcement_id) {
      return Response.json({ error: 'Missing announcement_id' }, { status: 400 });
    }

    const announcements = await base44.asServiceRole.entities.Announcement.filter({ id: announcement_id });
    if (announcements.length === 0) {
      return Response.json({ error: 'Announcement not found' }, { status: 404 });
    }

    const announcement = announcements[0];
    const allUsers = await base44.asServiceRole.entities.User.list();
    const allPlayers = await base44.asServiceRole.entities.Player.list();
    const allTeams = await base44.asServiceRole.entities.Team.list();
    const preferences = await base44.asServiceRole.entities.CommunicationPreferences.list();

    let recipients = [];

    if (announcement.target_type === 'all') {
      recipients = allUsers.map(u => u.email);
    } else if (announcement.target_type === 'team' && announcement.target_team_ids) {
      const teamPlayers = allPlayers.filter(p => announcement.target_team_ids.includes(p.team_id));
      const playerEmails = teamPlayers.map(p => p.email).filter(Boolean);
      const parentEmails = allUsers.filter(u => 
        u.player_ids && u.player_ids.some(pid => teamPlayers.some(tp => tp.id === pid))
      ).map(u => u.email);
      recipients = [...new Set([...playerEmails, ...parentEmails])];
    } else if (announcement.target_type === 'players' && announcement.target_player_ids) {
      const targetPlayers = allPlayers.filter(p => announcement.target_player_ids.includes(p.id));
      const playerEmails = targetPlayers.map(p => p.email).filter(Boolean);
      const parentEmails = allUsers.filter(u => 
        u.player_ids && u.player_ids.some(pid => announcement.target_player_ids.includes(pid))
      ).map(u => u.email);
      recipients = [...new Set([...playerEmails, ...parentEmails])];
    } else if (announcement.target_type === 'coaches') {
      const coaches = await base44.asServiceRole.entities.Coach.list();
      recipients = coaches.map(c => c.email).filter(Boolean);
    } else if (announcement.target_type === 'parents') {
      recipients = allUsers.filter(u => u.player_ids && u.player_ids.length > 0).map(u => u.email);
    }

    recipients = recipients.filter(email => {
      const pref = preferences.find(p => p.user_email === email);
      if (!pref) return true;
      return pref.email_notifications_enabled && pref.notification_types?.announcements !== false;
    });

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const emailPromises = recipients.map(email => 
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Soccer Club <onboarding@resend.dev>',
          to: [email],
          subject: announcement.title,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #10b981;">${announcement.title}</h2>
              <p style="white-space: pre-wrap;">${announcement.content}</p>
              <hr style="margin: 20px 0;" />
              <p style="font-size: 12px; color: #64748b;">
                From: ${announcement.author_name}<br>
                Priority: ${announcement.priority}
              </p>
            </div>
          `
        })
      })
    );

    await Promise.all(emailPromises);

    return Response.json({ success: true, emails_sent: recipients.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});