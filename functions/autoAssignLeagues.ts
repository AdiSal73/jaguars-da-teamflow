import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all teams for 26/27 season
    const teams = await base44.asServiceRole.entities.Team.list();
    const season2627Teams = teams.filter(t => 
      t.season === '26/27' || t.name?.includes('26/27')
    );

    const updates = [];
    
    for (const team of season2627Teams) {
      const ageGroupMatch = team.age_group?.match(/U-?(\d+)/i);
      if (!ageGroupMatch) continue;
      
      const age = parseInt(ageGroupMatch[1]);
      let league = null;

      // Determine league based on age group
      if (age >= 13 && age <= 19) {
        // U13-U19
        if (team.name?.includes('Girls Academy') && !team.name?.includes('Aspire')) {
          league = 'Girls Academy';
        } else if (team.name?.includes('Aspire')) {
          league = 'Aspire';
        } else if (team.name?.includes('Green')) {
          league = 'DPL';
        } else if (team.name?.includes('White')) {
          league = 'MSPSP';
        } else if (team.name?.includes('Black')) {
          league = 'MSPSP';
        }
      } else if (age >= 11 && age <= 12) {
        // U11-U12
        league = "Director's Academy";
      } else if (age <= 10) {
        // U10 and younger
        league = 'MSPSP';
      }

      if (league && team.league !== league) {
        updates.push({
          teamId: team.id,
          teamName: team.name,
          oldLeague: team.league,
          newLeague: league
        });
        
        await base44.asServiceRole.entities.Team.update(team.id, { league });
      }
    }

    return Response.json({
      success: true,
      updated: updates.length,
      details: updates
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});