import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// Process a batch of rows: match players, update parent_emails, invite parent accounts
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { rows } = await req.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return Response.json({ error: 'No rows provided' }, { status: 400 });
    }

    const results = [];

    for (const row of rows) {
      const result = { row, status: 'pending', message: '' };

      try {
        // Normalize fields — support flexible CSV column names
        const playerName = (row.player_name || row['Player Name'] || row['PlayerName'] || '').trim();
        const parentName = (row.parent_name || row['Parent Name'] || row['ParentName'] || '').trim();
        const parentEmail = (row.parent_email || row['Parent Email'] || row['ParentEmail'] || row['email'] || row['Email'] || '').trim().toLowerCase();
        const parentPhone = (row.parent_phone || row['Parent Phone'] || row['ParentPhone'] || row['phone'] || row['Phone'] || '').trim();

        if (!playerName) {
          result.status = 'error';
          result.message = 'Missing player name';
          results.push(result);
          continue;
        }

        if (!parentEmail) {
          result.status = 'error';
          result.message = `No parent email for player: ${playerName}`;
          results.push(result);
          continue;
        }

        // Find matching player (case-insensitive, partial match)
        const allPlayers = await base44.asServiceRole.entities.Player.list();
        const playerNameLower = playerName.toLowerCase();
        const matchedPlayer = allPlayers.find(p =>
          p.full_name && p.full_name.toLowerCase() === playerNameLower
        ) || allPlayers.find(p =>
          p.full_name && p.full_name.toLowerCase().includes(playerNameLower)
        );

        if (!matchedPlayer) {
          result.status = 'error';
          result.message = `Player not found: "${playerName}"`;
          results.push(result);
          continue;
        }

        // Update player's parent_emails array
        const currentEmails = matchedPlayer.parent_emails || [];
        const updatedEmails = currentEmails.includes(parentEmail)
          ? currentEmails
          : [...currentEmails, parentEmail];

        const updateData = {
          parent_emails: updatedEmails,
        };
        if (parentName && !matchedPlayer.parent_name) {
          updateData.parent_name = parentName;
        }
        if (parentPhone && !matchedPlayer.phone) {
          updateData.phone = parentPhone;
        }

        await base44.asServiceRole.entities.Player.update(matchedPlayer.id, updateData);

        // Check if a user account already exists for this email
        const allUsers = await base44.asServiceRole.entities.User.list();
        const existingUser = allUsers.find(u => u.email === parentEmail);

        let accountAction = 'already exists';
        if (!existingUser) {
          // Invite parent as a user with role 'parent'
          await base44.users.inviteUser(parentEmail, 'user');
          accountAction = 'invited';
        }

        result.status = 'success';
        result.message = `Matched "${matchedPlayer.full_name}" → ${parentEmail} (account: ${accountAction})`;
        result.player_id = matchedPlayer.id;
        result.player_name = matchedPlayer.full_name;

      } catch (err) {
        result.status = 'error';
        result.message = `Error: ${err.message}`;
      }

      results.push(result);
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 150));
    }

    const success = results.filter(r => r.status === 'success').length;
    const errors = results.filter(r => r.status === 'error').length;

    return Response.json({ results, summary: { total: rows.length, success, errors } });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});