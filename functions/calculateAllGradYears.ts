import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Calculate grad_year based on date of birth
// Born before September (month 8) = birthYear + 18
// Born September or later = birthYear + 19
function calculateGradYear(dateOfBirth) {
  if (!dateOfBirth) return null;
  const birthDate = new Date(dateOfBirth);
  const birthYear = birthDate.getFullYear();
  const birthMonth = birthDate.getMonth();
  
  return birthMonth < 8 ? birthYear + 18 : birthYear + 19;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const players = await base44.asServiceRole.entities.Player.list();
    
    let updated = 0;
    let skipped = 0;
    const errors = [];
    
    for (const player of players) {
      if (!player.date_of_birth) {
        skipped++;
        continue;
      }
      
      try {
        const gradYear = calculateGradYear(player.date_of_birth);
        await base44.asServiceRole.entities.Player.update(player.id, {
          grad_year: gradYear
        });
        updated++;
      } catch (error) {
        errors.push({ player: player.full_name, error: error.message });
      }
    }
    
    return Response.json({
      success: true,
      message: `Updated ${updated} players, skipped ${skipped} (no DOB)`,
      updated,
      skipped,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});