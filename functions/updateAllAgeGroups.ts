import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const calculateAgeGroup = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  
  const dob = new Date(dateOfBirth);
  const birthYear = dob.getFullYear();
  const birthMonth = dob.getMonth(); // 0-indexed (0=Jan, 7=Aug)
  
  const currentYear = new Date().getFullYear();
  
  // If born August or later, age group = current year - birth year
  // If born before August, age group = current year - birth year + 1
  let ageGroupYear;
  if (birthMonth >= 7) { // August or later
    ageGroupYear = currentYear - birthYear;
  } else { // Before August (Jan-July)
    ageGroupYear = currentYear - birthYear + 1;
  }
  
  return `U-${ageGroupYear}`;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    console.log('Starting age group calculation for all players...');
    
    const players = await base44.asServiceRole.entities.Player.list();
    console.log(`Found ${players.length} players`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const player of players) {
      if (!player.date_of_birth) {
        console.log(`Skipping ${player.full_name} - no date of birth`);
        skipped++;
        continue;
      }
      
      const ageGroup = calculateAgeGroup(player.date_of_birth);
      
      if (ageGroup !== player.age_group) {
        await base44.asServiceRole.entities.Player.update(player.id, { age_group: ageGroup });
        console.log(`Updated ${player.full_name}: ${player.age_group || 'none'} → ${ageGroup}`);
        updated++;
      } else {
        skipped++;
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
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});