import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const calculateAgeGroup = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  
  const dob = new Date(dateOfBirth);
  const year = dob.getFullYear();
  const month = dob.getMonth() + 1; // 1-indexed
  
  // 26/27 Season Age Group Matrix
  // U6: Aug 1, 2020 – July 31, 2021
  // U7: Aug 1, 2019 – July 31, 2020
  // U8: Aug 1, 2018 – July 31, 2019
  // U9: Aug 1, 2017 – July 31, 2018
  // U10: Aug 1, 2016 – July 31, 2017
  // U11: Aug 1, 2015 – July 31, 2016
  // U12: Aug 1, 2014 – July 31, 2015
  // U13: Aug 1, 2013 – July 31, 2014
  // U14: Aug 1, 2012 – July 31, 2013
  // U15: Aug 1, 2011 – July 31, 2012
  // U16: Aug 1, 2010 – July 31, 2011
  // U17: Aug 1, 2009 – July 31, 2010
  // U19: Aug 1, 2007 – July 31, 2009
  
  const birthDate = new Date(year, month - 1, dob.getDate());
  
  if (birthDate >= new Date(2020, 7, 1) && birthDate <= new Date(2021, 6, 31)) return 'U6';
  if (birthDate >= new Date(2019, 7, 1) && birthDate <= new Date(2020, 6, 31)) return 'U7';
  if (birthDate >= new Date(2018, 7, 1) && birthDate <= new Date(2019, 6, 31)) return 'U8';
  if (birthDate >= new Date(2017, 7, 1) && birthDate <= new Date(2018, 6, 31)) return 'U9';
  if (birthDate >= new Date(2016, 7, 1) && birthDate <= new Date(2017, 6, 31)) return 'U10';
  if (birthDate >= new Date(2015, 7, 1) && birthDate <= new Date(2016, 6, 31)) return 'U11';
  if (birthDate >= new Date(2014, 7, 1) && birthDate <= new Date(2015, 6, 31)) return 'U12';
  if (birthDate >= new Date(2013, 7, 1) && birthDate <= new Date(2014, 6, 31)) return 'U13';
  if (birthDate >= new Date(2012, 7, 1) && birthDate <= new Date(2013, 6, 31)) return 'U14';
  if (birthDate >= new Date(2011, 7, 1) && birthDate <= new Date(2012, 6, 31)) return 'U15';
  if (birthDate >= new Date(2010, 7, 1) && birthDate <= new Date(2011, 6, 31)) return 'U16';
  if (birthDate >= new Date(2009, 7, 1) && birthDate <= new Date(2010, 6, 31)) return 'U17';
  if (birthDate >= new Date(2007, 7, 1) && birthDate <= new Date(2009, 6, 31)) return 'U19';
  
  return null;
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
    const BATCH_SIZE = 10;
    const BATCH_DELAY = 500; // 500ms between batches
    
    // Group players into batches
    const batches = [];
    for (let i = 0; i < players.length; i += BATCH_SIZE) {
      batches.push(players.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`Processing ${batches.length} batches of ${BATCH_SIZE} players each`);
    
    // Process each batch
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`Processing batch ${batchIndex + 1}/${batches.length}`);
      
      // Process all players in the batch in parallel
      const batchUpdates = batch.map(async (player) => {
        if (!player.date_of_birth) {
          console.log(`Skipping ${player.full_name} - no date of birth`);
          return { type: 'skipped' };
        }
        
        const ageGroup = calculateAgeGroup(player.date_of_birth);
        
        if (ageGroup !== player.age_group) {
          try {
            await base44.asServiceRole.entities.Player.update(player.id, { age_group: ageGroup });
            console.log(`Updated ${player.full_name}: ${player.age_group || 'none'} → ${ageGroup}`);
            return { type: 'updated' };
          } catch (error) {
            console.error(`Error updating ${player.full_name}:`, error);
            return { type: 'error', error: error.message };
          }
        } else {
          return { type: 'skipped' };
        }
      });
      
      // Wait for all updates in this batch to complete
      const results = await Promise.all(batchUpdates);
      
      // Count results
      results.forEach(result => {
        if (result.type === 'updated') updated++;
        else if (result.type === 'skipped') skipped++;
      });
      
      // Add delay between batches (except after the last batch)
      if (batchIndex < batches.length - 1) {
        console.log(`Waiting ${BATCH_DELAY}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
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