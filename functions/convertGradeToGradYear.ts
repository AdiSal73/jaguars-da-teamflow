import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Convert grade (e.g., 12) to grad_year (e.g., 2026)
// Current date is December 2025, so:
// Grade 12 = graduating in 2026
// Grade 11 = graduating in 2027
// Grade 10 = graduating in 2028, etc.
function calculateGradYear(grade) {
  const currentYear = 2025;
  const currentMonth = 12; // December
  
  // If we're past June, grade 12 graduates next year, otherwise this year
  const baseYear = currentMonth >= 6 ? currentYear + 1 : currentYear;
  
  // grade 12 graduates in baseYear, grade 11 in baseYear+1, etc.
  return baseYear + (12 - grade);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all players
    const players = await base44.asServiceRole.entities.Player.list();
    
    let updated = 0;
    let skipped = 0;
    
    for (const player of players) {
      // Skip if player already has grad_year or doesn't have grade
      if (player.grad_year || !player.grade) {
        skipped++;
        continue;
      }
      
      const gradYear = calculateGradYear(player.grade);
      await base44.asServiceRole.entities.Player.update(player.id, {
        grad_year: gradYear
      });
      updated++;
    }
    
    return Response.json({
      success: true,
      message: `Updated ${updated} players, skipped ${skipped}`,
      updated,
      skipped
    });
    
  } catch (error) {
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});