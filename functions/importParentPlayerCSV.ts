import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// Process a batch of rows from the club CSV format:
// Player Last Name | Player First Name | Date of Birth | Gender | Grade | Team Name
// | Parent 1 Name | Parent 1 Email | Parent 1 Cell Phone
// | Parent 2 Name | Parent 2 Email | Parent 2 Cell Phone
// | Parent 3 Name | Parent 3 Email | Parent 3 Cell Phone
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { rows } = await req.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return Response.json({ error: 'No rows provided' }, { status: 400 });
    }

    // Fetch all players once for the batch to avoid repeated list() calls
    const allPlayers = await base44.asServiceRole.entities.Player.list();

    const results = [];

    for (const row of rows) {
      const result = { row, status: 'pending', message: '' };

      try {
        // Support both the new column names AND legacy fallbacks
        const lastName = (row['Player Last Name'] || row['player_last_name'] || row['Last Name'] || '').trim();
        const firstName = (row['Player First Name'] || row['player_first_name'] || row['First Name'] || '').trim();
        const playerName = (firstName && lastName)
          ? `${firstName} ${lastName}`
          : (row['player_name'] || row['Player Name'] || row['PlayerName'] || `${firstName}${lastName}`).trim();

        if (!playerName || playerName.length < 2) {
          result.status = 'error';
          result.message = `Row missing player name (firstName="${firstName}", lastName="${lastName}")`;
          results.push(result);
          continue;
        }

        // Collect up to 3 parents from columns
        const parents = [];
        for (let n = 1; n <= 3; n++) {
          const email = (
            row[`Parent ${n} Email`] ||
            row[`parent_${n}_email`] ||
            (n === 1 ? row['parent_email'] || row['Parent Email'] : '')
          ).trim().toLowerCase();
          const name = (
            row[`Parent ${n} Name`] ||
            row[`parent_${n}_name`] ||
            (n === 1 ? row['parent_name'] || row['Parent Name'] : '')
          ).trim();
          const phone = (
            row[`Parent ${n} Cell Phone`] ||
            row[`Parent ${n} Phone`] ||
            row[`parent_${n}_phone`] ||
            (n === 1 ? row['parent_phone'] || row['Parent Phone'] : '')
          ).trim();

          if (email) parents.push({ email, name, phone });
        }

        if (parents.length === 0) {
          result.status = 'error';
          result.message = `No parent email found for player: "${playerName}"`;
          results.push(result);
          continue;
        }

        // Find matching player (exact full name match, then first+last separately)
        const playerNameLower = playerName.toLowerCase();
        let matchedPlayer = allPlayers.find(p =>
          p.full_name?.toLowerCase().trim() === playerNameLower
        );
        // Fallback: match by first+last name parts if first/last provided separately
        if (!matchedPlayer && firstName && lastName) {
          matchedPlayer = allPlayers.find(p => {
            const parts = p.full_name?.toLowerCase().trim().split(/\s+/) || [];
            return parts[0] === firstName.toLowerCase() && parts[parts.length - 1] === lastName.toLowerCase();
          });
        }

        if (!matchedPlayer) {
          result.status = 'error';
          result.message = `Player not found: "${playerName}"`;
          results.push(result);
          continue;
        }

        // Merge parent emails into player record
        const currentEmails = matchedPlayer.parent_emails || [];
        const newEmails = [...new Set([...currentEmails, ...parents.map(p => p.email)])];

        const updateData = { parent_emails: newEmails };

        // Set parent_name from first parent if not already set
        if (parents[0]?.name && !matchedPlayer.parent_name) {
          updateData.parent_name = parents[0].name;
        }
        // Set phone from first parent if not already set
        if (parents[0]?.phone && !matchedPlayer.phone) {
          updateData.phone = parents[0].phone;
        }

        await base44.asServiceRole.entities.Player.update(matchedPlayer.id, updateData);
        // Update local cache so subsequent rows in same batch see updated data
        const idx = allPlayers.findIndex(p => p.id === matchedPlayer.id);
        if (idx !== -1) allPlayers[idx] = { ...matchedPlayer, ...updateData };

        // Invite any parent accounts that don't exist yet
        const inviteActions = [];
        for (const parent of parents) {
          const allUsers = await base44.asServiceRole.entities.User.list();
          const existingUser = allUsers.find(u => u.email === parent.email);
          if (!existingUser) {
            await base44.users.inviteUser(parent.email, 'user');
            inviteActions.push(`invited ${parent.email}`);
          } else {
            inviteActions.push(`${parent.email} exists`);
          }
          await new Promise(r => setTimeout(r, 100));
        }

        result.status = 'success';
        result.message = `✅ "${matchedPlayer.full_name}" → ${parents.length} parent(s) linked [${inviteActions.join(', ')}]`;
        result.player_id = matchedPlayer.id;
        result.player_name = matchedPlayer.full_name;

      } catch (err) {
        result.status = 'error';
        result.message = `Error: ${err.message}`;
      }

      results.push(result);
      await new Promise(r => setTimeout(r, 150));
    }

    const success = results.filter(r => r.status === 'success').length;
    const errors = results.filter(r => r.status === 'error').length;

    return Response.json({ results, summary: { total: rows.length, success, errors } });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});