import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// Single-row update endpoint — frontend handles matching, we just persist
// Expects: { playerId, parentEmails, parentName, phone }
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { playerId, parentEmails, parentName, phone } = await req.json();

    if (!playerId || !Array.isArray(parentEmails) || parentEmails.length === 0) {
      return Response.json({ error: 'playerId and parentEmails required' }, { status: 400 });
    }

    // Get current player data
    const player = await base44.asServiceRole.entities.Player.get(playerId);

    // Merge emails
    const currentEmails = player.parent_emails || [];
    const mergedEmails = [...new Set([...currentEmails, ...parentEmails])];

    const updateData = { parent_emails: mergedEmails };
    if (parentName && !player.parent_name) updateData.parent_name = parentName;
    if (phone && !player.phone) updateData.phone = phone;

    await base44.asServiceRole.entities.Player.update(playerId, updateData);

    return Response.json({ success: true, player_name: player.full_name, emails_linked: mergedEmails.length });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});