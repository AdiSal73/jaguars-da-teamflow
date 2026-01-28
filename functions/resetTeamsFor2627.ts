import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { operation } = await req.json();

    const logs = [];

    if (operation === 'reset_25_26_teams') {
      // Reset all 25/26 season teams - remove all players
      const teams = await base44.asServiceRole.entities.Team.list();
      const teams2526 = teams.filter(t => {
        const season = t.season || (t.name?.includes('25/26') ? '25/26' : null);
        return season === '25/26';
      });

      logs.push({ type: 'info', message: `Found ${teams2526.length} teams in 25/26 season` });

      for (const team of teams2526) {
        const players = await base44.asServiceRole.entities.Player.filter({ team_id: team.id });
        
        for (const player of players) {
          await base44.asServiceRole.entities.Player.update(player.id, { team_id: null });
          await delay(150);
        }

        logs.push({ type: 'success', message: `Reset ${team.name}: removed ${players.length} players` });
        await delay(300);
      }

      return Response.json({ 
        success: true, 
        message: `Reset ${teams2526.length} teams in 25/26 season`,
        logs 
      });
    }

    if (operation === 'remove_players_26_27') {
      // Remove all players from 26/27 teams
      const teams = await base44.asServiceRole.entities.Team.list();
      const teams2627 = teams.filter(t => {
        const season = t.season || (t.name?.includes('26/27') ? '26/27' : null);
        return season === '26/27';
      });

      logs.push({ type: 'info', message: `Found ${teams2627.length} teams in 26/27 season` });

      let totalRemoved = 0;
      for (const team of teams2627) {
        const players = await base44.asServiceRole.entities.Player.filter({ team_id: team.id });
        
        for (const player of players) {
          await base44.asServiceRole.entities.Player.update(player.id, { team_id: null });
          totalRemoved++;
          await delay(150);
        }

        logs.push({ type: 'success', message: `Removed ${players.length} players from ${team.name}` });
        await delay(300);
      }

      return Response.json({ 
        success: true, 
        message: `Removed ${totalRemoved} players from ${teams2627.length} teams`,
        logs 
      });
    }

    if (operation === 'delete_26_27_teams') {
      // Delete all 26/27 teams
      const teams = await base44.asServiceRole.entities.Team.list();
      const teams2627 = teams.filter(t => {
        const season = t.season || (t.name?.includes('26/27') ? '26/27' : null);
        return season === '26/27';
      });

      logs.push({ type: 'info', message: `Found ${teams2627.length} teams to delete in 26/27 season` });

      for (const team of teams2627) {
        await base44.asServiceRole.entities.Team.delete(team.id);
        logs.push({ type: 'success', message: `Deleted team: ${team.name}` });
        await delay(200);
      }

      return Response.json({ 
        success: true, 
        message: `Deleted ${teams2627.length} teams from 26/27 season`,
        logs 
      });
    }

    return Response.json({ error: 'Invalid operation' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});