import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Calculate graduation year based on birth date
// Assumes Aug 1 cutoff - if born Aug 1 or later, they're in the younger grade
function calculateGradYear(dateOfBirth) {
  if (!dateOfBirth) return null;
  
  const dob = new Date(dateOfBirth);
  const birthYear = dob.getFullYear();
  const birthMonth = dob.getMonth(); // 0-indexed
  const birthDay = dob.getDate();
  
  // If born on or after August 1, they start kindergarten the following year
  let kindergartenYear = birthYear + 5; // Age 5 for kindergarten
  if (birthMonth >= 7 || (birthMonth === 6 && birthDay >= 1)) { // July is month 6 (0-indexed)
    kindergartenYear += 1;
  }
  
  // 13 years from kindergarten to graduate 12th grade
  const gradYear = kindergartenYear + 13;
  
  return gradYear;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    console.log('Starting graduation year calculation...');

    // Fetch all players
    const players = await base44.asServiceRole.entities.Player.list();
    console.log(`Found ${players.length} players`);

    let updated = 0;
    let skipped = 0;

    // Update each player's grad year
    for (const player of players) {
      if (!player.date_of_birth) {
        skipped++;
        continue;
      }

      const gradYear = calculateGradYear(player.date_of_birth);
      
      if (gradYear && gradYear !== player.grad_year) {
        await base44.asServiceRole.entities.Player.update(player.id, {
          grad_year: gradYear
        });
        updated++;
        console.log(`Updated ${player.full_name}: ${gradYear}`);
      }
    }

    console.log(`Completed: ${updated} updated, ${skipped} skipped`);

    return Response.json({
      success: true,
      updated,
      skipped,
      total: players.length
    });

  } catch (error) {
    console.error('Error calculating grad years:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});