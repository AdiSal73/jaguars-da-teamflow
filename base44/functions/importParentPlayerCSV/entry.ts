import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Process sequentially with delay to avoid rate limits
async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { updates } = await req.json();
    if (!Array.isArray(updates) || updates.length === 0) {
      return Response.json({ error: 'updates array required' }, { status: 400 });
    }

    let succeeded = 0;
    let failed = 0;
    const errors = [];

    for (const { playerId, parentEmails, parentNames, phone } of updates) {
      try {
        await base44.asServiceRole.entities.Player.update(playerId, {
          parent_emails: parentEmails,
          parent_names: parentNames,
          parent_name: parentNames?.[0] || '',
          phone: phone || ''
        });
        succeeded++;
      } catch (err) {
        failed++;
        errors.push(`${playerId}: ${err.message}`);
      }
      // Small delay between updates to avoid rate limits
      await sleep(50);
    }

    return Response.json({ success: true, succeeded, failed, errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});