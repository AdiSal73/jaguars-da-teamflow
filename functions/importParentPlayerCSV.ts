import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { rows } = await req.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return Response.json({ error: 'No rows provided' }, { status: 400 });
    }

    // Fetch ONCE for the entire batch — avoids rate limits
    const allPlayers = await base44.asServiceRole.entities.Player.list();
    const allUsers = await base44.asServiceRole.entities.User.list();
    const existingEmails = new Set(allUsers.map(u => u.email?.toLowerCase()));

    const results = [];

    for (const row of rows) {
      const result = { row, status: 'pending', message: '' };

      try {
        const lastName = (row['Player Last Name'] || row['player_last_name'] || row['Last Name'] || '').trim();
        const firstName = (row['Player First Name'] || row['player_first_name'] || row['First Name'] || '').trim();
        const playerName = (firstName && lastName)
          ? `${firstName} ${lastName}`
          : (row['player_name'] || row['Player Name'] || `${firstName}${lastName}`).trim();

        if (!playerName || playerName.length < 2) {
          result.status = 'error';
          result.message = `Missing player name (first="${firstName}", last="${lastName}")`;
          results.push(result);
          continue;
        }

        // Collect up to 3 parents
        const parents = [];
        for (let n = 1; n <= 3; n++) {
          const email = (
            row[`Parent ${n} Email`] ||
            row[`parent_${n}_email`] ||
            (n === 1 ? row['parent_email'] || row['Parent Email'] || '' : '')
          ).trim().toLowerCase();
          const name = (
            row[`Parent ${n} Name`] ||
            row[`parent_${n}_name`] ||
            (n === 1 ? row['parent_name'] || row['Parent Name'] || '' : '')
          ).trim();
          const phone = (
            row[`Parent ${n} Cell Phone`] ||
            row[`Parent ${n} Phone`] ||
            row[`parent_${n}_phone`] ||
            (n === 1 ? row['parent_phone'] || row['Parent Phone'] || '' : '')
          ).trim();

          if (email) parents.push({ email, name, phone });
        }

        if (parents.length === 0) {
          result.status = 'error';
          result.message = `No parent email for player: "${playerName}"`;
          results.push(result);
          continue;
        }

        // Match player by full name or first+last
        const nameLower = playerName.toLowerCase();
        let matchedPlayer = allPlayers.find(p => p.full_name?.toLowerCase().trim() === nameLower);
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

        // Update player's parent_emails
        const currentEmails = matchedPlayer.parent_emails || [];
        const newEmails = [...new Set([...currentEmails, ...parents.map(p => p.email)])];
        const updateData = { parent_emails: newEmails };
        if (parents[0]?.name && !matchedPlayer.parent_name) updateData.parent_name = parents[0].name;
        if (parents[0]?.phone && !matchedPlayer.phone) updateData.phone = parents[0].phone;

        await base44.asServiceRole.entities.Player.update(matchedPlayer.id, updateData);
        // Update local cache
        const idx = allPlayers.findIndex(p => p.id === matchedPlayer.id);
        if (idx !== -1) allPlayers[idx] = { ...matchedPlayer, ...updateData };

        // Invite parents who don't have accounts yet (using cached set)
        const inviteActions = [];
        for (const parent of parents) {
          if (!existingEmails.has(parent.email)) {
            await base44.users.inviteUser(parent.email, 'user');
            existingEmails.add(parent.email); // prevent duplicate invites within same batch
            inviteActions.push(`invited ${parent.email}`);
          } else {
            inviteActions.push(`${parent.email} exists`);
          }
        }

        result.status = 'success';
        result.message = `✅ "${matchedPlayer.full_name}" → ${parents.length} parent(s) [${inviteActions.join(', ')}]`;
        result.player_id = matchedPlayer.id;

      } catch (err) {
        result.status = 'error';
        result.message = `Error: ${err.message}`;
      }

      results.push(result);
    }

    const success = results.filter(r => r.status === 'success').length;
    const errors = results.filter(r => r.status === 'error').length;
    return Response.json({ results, summary: { total: rows.length, success, errors } });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});