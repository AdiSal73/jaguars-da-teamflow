import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Convert grade string (e.g., "12th Grade") to grad_year number
function calculateGradYearFromGrade(gradeString) {
  if (!gradeString) return null;
  
  const gradeMatch = gradeString.match(/(\d+)/);
  if (!gradeMatch) return null;
  
  const grade = parseInt(gradeMatch[1]);
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
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const players = await base44.asServiceRole.entities.Player.list();
    
    let updated = 0;
    let skipped = 0;
    const errors = [];
    
    for (const player of players) {
      // Skip if no grade field
      if (!player.grade) {
        skipped++;
        continue;
      }
      
      try {
        const gradYear = calculateGradYearFromGrade(player.grade);
        if (gradYear) {
          await base44.asServiceRole.entities.Player.update(player.id, {
            grad_year: gradYear
          });
          updated++;
        } else {
          skipped++;
        }
      } catch (error) {
        errors.push({ player: player.full_name, error: error.message });
      }
    }
    
    return Response.json({
      success: true,
      message: `Updated ${updated} players from grade field, skipped ${skipped}`,
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