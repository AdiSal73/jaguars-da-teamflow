import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all players and users
    const players = await base44.asServiceRole.entities.Player.list();
    const users = await base44.asServiceRole.entities.User.list();

    let updatedPlayers = 0;
    let updatedUsers = 0;

    // First pass: Ensure all players have parent_emails from their User records
    for (const player of players) {
      const parentEmails = new Set(player.parent_emails || []);
      let needsUpdate = false;

      // Find users who have this player in their player_ids
      for (const user of users) {
        if (user.player_ids && user.player_ids.includes(player.id)) {
          if (!parentEmails.has(user.email)) {
            parentEmails.add(user.email);
            needsUpdate = true;
          }
        }
      }

      // Also check if player.email matches a user
      if (player.email) {
        const matchingUser = users.find(u => u.email === player.email);
        if (matchingUser && matchingUser.player_ids && !matchingUser.player_ids.includes(player.id)) {
          // This user should be linked to this player
          const updatedPlayerIds = [...(matchingUser.player_ids || []), player.id];
          await base44.asServiceRole.entities.User.update(matchingUser.id, {
            player_ids: updatedPlayerIds
          });
          updatedUsers++;
          
          if (!parentEmails.has(matchingUser.email)) {
            parentEmails.add(matchingUser.email);
            needsUpdate = true;
          }
        }
      }

      if (needsUpdate) {
        await base44.asServiceRole.entities.Player.update(player.id, {
          parent_emails: Array.from(parentEmails)
        });
        updatedPlayers++;
      }
    }

    // Second pass: Ensure all users have player_ids for players with their email in parent_emails
    for (const user of users) {
      const playerIds = new Set(user.player_ids || []);
      let needsUpdate = false;

      for (const player of players) {
        if (player.parent_emails && player.parent_emails.includes(user.email)) {
          if (!playerIds.has(player.id)) {
            playerIds.add(player.id);
            needsUpdate = true;
          }
        }
      }

      if (needsUpdate) {
        await base44.asServiceRole.entities.User.update(user.id, {
          player_ids: Array.from(playerIds)
        });
        updatedUsers++;
      }
    }

    return Response.json({ 
      success: true,
      message: 'Parent-player relationships synchronized',
      updatedPlayers,
      updatedUsers
    });
  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});