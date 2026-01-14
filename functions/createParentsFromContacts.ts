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

    console.log('=== Creating Parent Accounts from Contacts ===');
    
    const players = await base44.asServiceRole.entities.Player.list();
    const existingUsers = await base44.asServiceRole.entities.User.list();
    
    console.log(`Fetched ${players.length} players`);
    console.log(`Fetched ${existingUsers.length} existing users`);
    
    // Build map of all parent emails from players
    const parentEmailsMap = new Map();
    
    players.forEach(player => {
      const emailsToProcess = [];
      
      if (player.parent_emails && Array.isArray(player.parent_emails)) {
        emailsToProcess.push(...player.parent_emails);
      }
      
      if (player.email) {
        emailsToProcess.push(player.email);
      }

      emailsToProcess.forEach(parentEmail => {
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
    });

    console.log(`Found ${parentEmailsMap.size} unique parent emails`);

    const results = {
      created: [],
      merged: [],
      errors: [],
      skipped: []
    };

    let processedCount = 0;
    
    for (const [email, data] of parentEmailsMap.entries()) {
      processedCount++;
      console.log(`[${processedCount}/${parentEmailsMap.size}] Processing: ${email}`);
      
      try {
        const existingUser = existingUsers.find(u => u.email?.toLowerCase() === email);
        
        if (existingUser) {
          console.log(`  - User exists (${existingUser.role})`);
          
          // Skip admin and director
          if (['admin', 'director'].includes(existingUser.role)) {
            console.log(`  - Skipping: admin/director`);
            results.skipped.push({
              email,
              reason: `Has ${existingUser.role} role`,
              userName: existingUser.full_name || existingUser.display_name
            });
            continue;
          }
          
          // Merge: update player_ids
          const currentPlayerIds = existingUser.player_ids || [];
          const mergedPlayerIds = [...new Set([...currentPlayerIds, ...data.playerIds])];
          
          await base44.asServiceRole.entities.User.update(existingUser.id, {
            player_ids: mergedPlayerIds
          });
          
          console.log(`  - Merged with ${mergedPlayerIds.length} players`);
          results.merged.push({
            email,
            userName: existingUser.full_name || existingUser.display_name,
            role: existingUser.role,
            playerCount: mergedPlayerIds.length,
            players: data.playerNames
          });
          
        } else {
          // Create new parent account
          console.log(`  - Creating new parent account...`);
          
          try {
            await base44.asServiceRole.users.inviteUser(email, 'parent');
            console.log(`  - Invited successfully`);
            
            // Wait for user creation
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Link players
            const freshUsers = await base44.asServiceRole.entities.User.list();
            const newUser = freshUsers.find(u => u.email?.toLowerCase() === email);
            
            if (newUser) {
              await base44.asServiceRole.entities.User.update(newUser.id, {
                player_ids: data.playerIds
              });
              console.log(`  - Linked ${data.playerIds.length} players`);
            }
            
            results.created.push({
              email,
              parentName: data.parentName,
              playerCount: data.playerIds.length,
              players: data.playerNames
            });
          } catch (inviteError) {
            console.error(`  - Creation error: ${inviteError.message}`);
            results.errors.push({
              email,
              error: inviteError.message,
              playerCount: data.playerIds.length
            });
          }
        }
        
      } catch (error) {
        console.error(`  - Error: ${error.message}`);
        results.errors.push({
          email,
          error: error.message,
          playerCount: data.playerIds.length
        });
      }
    }

    console.log('=== Complete ===');
    console.log(`Created: ${results.created.length}`);
    console.log(`Merged: ${results.merged.length}`);
    console.log(`Skipped: ${results.skipped.length}`);
    console.log(`Errors: ${results.errors.length}`);

    return Response.json({
      success: true,
      totalContacts: parentEmailsMap.size,
      summary: {
        created: results.created.length,
        merged: results.merged.length,
        skipped: results.skipped.length,
        errors: results.errors.length
      },
      details: results
    });

  } catch (error) {
    console.error('=== Failed ===', error);
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});