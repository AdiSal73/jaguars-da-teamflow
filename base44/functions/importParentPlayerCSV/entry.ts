import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Accepts a batch of updates: { updates: [{ playerId, parentEmails, parentNames, parentName, phone }] }
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { updates } = await req.json();
    if (!Array.isArray(updates) || updates.length === 0) {
      return Response.json({ error: 'updates array required' }, { status: 400 });
    }

    const results = await Promise.allSettled(updates.map(async ({ playerId, parentEmails, parentNames, parentName, phone }) => {
      const updateData = {
        parent_emails: parentEmails,
        parent_names: parentNames || parentEmails.map(() => ''),
        parent_name: parentName || parentNames?.[0] || '',
        phone: phone || ''
      };

      await base44.asServiceRole.entities.Player.update(playerId, updateData);
      return { playerId, emails_linked: parentEmails.length };
    }));

    const succeeded = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    const failed = results.filter(r => r.status === 'rejected').map(r => r.reason?.message || 'Unknown error');

    return Response.json({ success: true, succeeded: succeeded.length, failed: failed.length, errors: failed });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});