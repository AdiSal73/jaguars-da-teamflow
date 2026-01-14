import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    console.log('Sync Parents - Auth user:', user?.email, 'Role:', user?.role);

    if (!user || user.role !== 'admin') {
      console.error('Unauthorized access attempt');
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    console.log('Fetching players...');
    const players = await base44.asServiceRole.entities.Player.list();
    console.log('Found players:', players.length);
    
    console.log('Fetching existing users...');
    const existingUsers = await base44.asServiceRole.entities.User.list();
    console.log('Found existing users:', existingUsers.length);
    
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

    console.log('Unique parent emails found:', parentEmailsMap.size);

    const updates = [];
    const invitations = [];
    const errors = [];

    // Process each unique parent email
    for (const [email, data] of parentEmailsMap.entries()) {
      console.log(`Processing parent: ${email}`);
      const existingUser = existingUsers.find(u => u.email?.toLowerCase() === email);
      
      if (existingUser) {
        console.log(`User exists: ${email}, updating...`);
        try {
          const currentPlayerIds = existingUser.player_ids || [];
          const mergedPlayerIds = [...new Set([...currentPlayerIds, ...data.playerIds])];
          
          await base44.asServiceRole.entities.User.update(existingUser.id, {
            player_ids: mergedPlayerIds,
            role: 'parent'
          });
          
          console.log(`Updated user ${email} with ${mergedPlayerIds.length} players`);
          updates.push({ email, status: 'updated', playerCount: mergedPlayerIds.length });
        } catch (updateError) {
          console.error(`Failed to update ${email}:`, updateError);
          errors.push({ email, error: updateError.message, action: 'update' });
        }
      } else {
        console.log(`User doesn't exist: ${email}, inviting...`);
        try {
          await base44.asServiceRole.users.inviteUser(email, 'parent', { 
            full_name: data.parentName,
            player_ids: data.playerIds 
          });
          console.log(`Invited ${email}`);
          invitations.push({ email, status: 'invited', playerCount: data.playerIds.length });
        } catch (inviteError) {
          console.error(`Failed to invite ${email}:`, inviteError);
          errors.push({ email, error: inviteError.message, action: 'invite' });
        }
      }
    }

    console.log('Sync complete. Updates:', updates.length, 'Invitations:', invitations.length, 'Errors:', errors.length);

    return Response.json({
      success: true,
      totalParents: parentEmailsMap.size,
      updated: updates.length,
      invited: invitations.length,
      errors: errors.length,
      details: {
        updates,
        invitations,
        errors
      }
    });

  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});