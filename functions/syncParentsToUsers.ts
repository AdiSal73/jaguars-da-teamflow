import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    // Fetch all players with parent emails
    const players = await base44.asServiceRole.entities.Player.list();
    
    // Fetch all existing users
    const existingUsers = await base44.asServiceRole.entities.User.list();
    
    const parentEmailsMap = new Map();
    
    // Build a map of parent emails to player IDs
    players.forEach(player => {
      if (player.parent_emails && Array.isArray(player.parent_emails)) {
        player.parent_emails.forEach(parentEmail => {
          if (parentEmail && parentEmail.trim()) {
            const normalizedEmail = parentEmail.toLowerCase().trim();
            if (!parentEmailsMap.has(normalizedEmail)) {
              parentEmailsMap.set(normalizedEmail, {
                email: normalizedEmail,
                playerIds: [],
                parentName: player.parent_name || 'Parent'
              });
            }
            parentEmailsMap.get(normalizedEmail).playerIds.push(player.id);
          }
        });
      }
    });

    const updates = [];
    const invitations = [];

    // Process each unique parent email
    for (const [email, data] of parentEmailsMap.entries()) {
      const existingUser = existingUsers.find(u => u.email?.toLowerCase() === email);
      
      if (existingUser) {
        // Update existing user - merge player_ids
        const currentPlayerIds = existingUser.player_ids || [];
        const mergedPlayerIds = [...new Set([...currentPlayerIds, ...data.playerIds])];
        
        await base44.asServiceRole.entities.User.update(existingUser.id, {
          player_ids: mergedPlayerIds,
          role: 'parent'
        });
        
        updates.push({ email, status: 'updated', playerCount: mergedPlayerIds.length });
      } else {
        // Send invitation for new parent
        try {
          await base44.auth.inviteUser(email, 'parent', { 
            full_name: data.parentName,
            player_ids: data.playerIds 
          });
          invitations.push({ email, status: 'invited', playerCount: data.playerIds.length });
        } catch (inviteError) {
          invitations.push({ email, status: 'failed', error: inviteError.message });
        }
      }
    }

    return Response.json({
      success: true,
      totalParents: parentEmailsMap.size,
      updated: updates.length,
      invited: invitations.length,
      details: {
        updates,
        invitations
      }
    });

  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});