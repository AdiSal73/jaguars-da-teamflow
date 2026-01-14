import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ 
        success: false,
        error: 'Unauthorized: Admin access required' 
      }, { status: 403 });
    }

    console.log('=== Starting Parent Sync ===');
    
    const players = await base44.asServiceRole.entities.Player.list();
    console.log(`Fetched ${players.length} players`);
    
    const existingUsers = await base44.asServiceRole.entities.User.list();
    console.log(`Fetched ${existingUsers.length} existing users`);
    
    const parentEmailsMap = new Map();
    
    // Build map of parent emails to player data
    players.forEach(player => {
      if (player.parent_emails && Array.isArray(player.parent_emails)) {
        player.parent_emails.forEach(parentEmail => {
          if (parentEmail && parentEmail.trim()) {
            const normalizedEmail = parentEmail.toLowerCase().trim();
            if (!parentEmailsMap.has(normalizedEmail)) {
              parentEmailsMap.set(normalizedEmail, {
                email: normalizedEmail,
                playerIds: [],
                playerNames: [],
                parentName: player.parent_name || 'Parent'
              });
            }
            const data = parentEmailsMap.get(normalizedEmail);
            data.playerIds.push(player.id);
            data.playerNames.push(player.full_name);
          }
        });
      }
    });

    console.log(`Found ${parentEmailsMap.size} unique parent emails`);

    const results = {
      updated: [],
      invited: [],
      errors: [],
      skipped: []
    };

    for (const [email, data] of parentEmailsMap.entries()) {
      console.log(`Processing: ${email}`);
      
      try {
        const existingUser = existingUsers.find(u => u.email?.toLowerCase() === email);
        
        if (existingUser) {
          console.log(`  - User exists (${existingUser.role})`);
          
          // Only skip admin and director roles
          if (['admin', 'director'].includes(existingUser.role)) {
            console.log(`  - Skipping: admin/director role`);
            results.skipped.push({
              email,
              reason: `User has ${existingUser.role} role`,
              userName: existingUser.full_name || existingUser.display_name,
              playerCount: data.playerIds.length,
              players: data.playerNames
            });
            continue;
          }
          
          // Update all other users (parent, coach, player) with player_ids
          const currentPlayerIds = existingUser.player_ids || [];
          const mergedPlayerIds = [...new Set([...currentPlayerIds, ...data.playerIds])];
          
          await base44.asServiceRole.entities.User.update(existingUser.id, {
            player_ids: mergedPlayerIds
          });
          
          console.log(`  - Updated with ${mergedPlayerIds.length} players`);
          results.updated.push({
            email,
            userName: existingUser.full_name || existingUser.display_name,
            previousRole: existingUser.role,
            newRole: existingUser.role,
            playerCount: mergedPlayerIds.length,
            players: data.playerNames
          });
          
        } else {
          console.log(`  - User doesn't exist, inviting...`);
          
          await base44.asServiceRole.users.inviteUser(email, 'parent');
          
          // Try to update the newly invited user with player_ids
          // Note: The invite creates a pending user, we need to update it
          const newUsers = await base44.asServiceRole.entities.User.list();
          const newUser = newUsers.find(u => u.email?.toLowerCase() === email);
          
          if (newUser) {
            await base44.asServiceRole.entities.User.update(newUser.id, {
              player_ids: data.playerIds,
              display_name: data.parentName
            });
          }
          
          console.log(`  - Invited successfully`);
          results.invited.push({
            email,
            parentName: data.parentName,
            playerCount: data.playerIds.length,
            players: data.playerNames
          });
        }
        
      } catch (error) {
        console.error(`  - Error processing ${email}:`, error.message);
        results.errors.push({
          email,
          error: error.message,
          playerCount: data.playerIds.length,
          players: data.playerNames
        });
      }
    }

    console.log('=== Sync Complete ===');
    console.log(`Updated: ${results.updated.length}`);
    console.log(`Invited: ${results.invited.length}`);
    console.log(`Skipped: ${results.skipped.length}`);
    console.log(`Errors: ${results.errors.length}`);

    return Response.json({
      success: true,
      totalParents: parentEmailsMap.size,
      summary: {
        updated: results.updated.length,
        invited: results.invited.length,
        skipped: results.skipped.length,
        errors: results.errors.length
      },
      details: results
    });

  } catch (error) {
    console.error('=== Sync Failed ===', error);
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});