import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all bookings, players, and users
    const bookings = await base44.asServiceRole.entities.Booking.list();
    const players = await base44.asServiceRole.entities.Player.list();
    const users = await base44.asServiceRole.entities.User.list();

    let matchedCount = 0;
    const updates = [];

    for (const booking of bookings) {
      // Skip if already has player_id and parent_id
      if (booking.player_id && booking.parent_id) continue;
      
      if (booking.parent_email) {
        let matchedPlayerId = booking.player_id;
        let matchedParentId = booking.parent_id;
        
        // Try to match with registered user
        if (!matchedParentId) {
          const matchingUser = users.find(u => u.email === booking.parent_email);
          if (matchingUser) {
            matchedParentId = matchingUser.id;
            // If user has player_ids, use the first one
            if (!matchedPlayerId && matchingUser.player_ids && matchingUser.player_ids.length > 0) {
              matchedPlayerId = matchingUser.player_ids[0];
            }
          }
        }
        
        // Try to match with player
        if (!matchedPlayerId) {
          const matchingPlayer = players.find(p => 
            p.player_email === booking.parent_email || 
            (p.parent_emails && p.parent_emails.includes(booking.parent_email)) ||
            p.email === booking.parent_email
          );
          
          if (matchingPlayer) {
            matchedPlayerId = matchingPlayer.id;
          }
        }
        
        // Update booking if we found matches
        if ((matchedPlayerId && matchedPlayerId !== booking.player_id) || 
            (matchedParentId && matchedParentId !== booking.parent_id)) {
          const updateData = {};
          if (matchedPlayerId) updateData.player_id = matchedPlayerId;
          if (matchedParentId) updateData.parent_id = matchedParentId;
          
          await base44.asServiceRole.entities.Booking.update(booking.id, updateData);
          matchedCount++;
          updates.push({
            bookingId: booking.id,
            email: booking.parent_email,
            matched: updateData
          });
        }
      }
    }

    return Response.json({
      success: true,
      matchedCount,
      updates
    });
  } catch (error) {
    console.error('Error matching bookings:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});