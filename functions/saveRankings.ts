import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { updates } = await req.json();
    if (!Array.isArray(updates) || updates.length === 0) {
      return Response.json({ error: 'No updates provided' }, { status: 400 });
    }

    const results = { success: 0, failed: 0, errors: [] };

    // Run all updates in parallel - small chunk sizes are enforced by the caller
    await Promise.all(updates.map(async (u) => {
      try {
        await base44.asServiceRole.entities.Player.update(u.playerId, { age_group_ranking: u.ranking });
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push(`${u.playerId}: ${err.message}`);
      }
    }));

    return Response.json({ ok: true, ...results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});