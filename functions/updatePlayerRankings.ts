import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all players, teams, and tryouts
    const [players, teams, tryouts] = await Promise.all([
      base44.asServiceRole.entities.Player.list(),
      base44.asServiceRole.entities.Team.list(),
      base44.asServiceRole.entities.PlayerTryout.list()
    ]);

    // Get all evaluations to determine rankings
    const evaluations = await base44.asServiceRole.entities.Evaluation.list();

    // Calculate overall score for each player
    const playerScores = players.map(player => {
      const playerEvals = evaluations.filter(e => e.player_id === player.id);
      if (playerEvals.length === 0) return { player, score: 0 };

      const latestEval = playerEvals.sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      )[0];

      const score = latestEval.overall_score || 0;
      const team = teams.find(t => t.id === player.team_id);

      return {
        player,
        score,
        team,
        isGirlsAcademy: team?.league === 'Girls Academy'
      };
    }).filter(p => p.player && p.team);

    // Sort: Girls Academy first (by score), then everyone else (by score)
    playerScores.sort((a, b) => {
      if (a.isGirlsAcademy && !b.isGirlsAcademy) return -1;
      if (!a.isGirlsAcademy && b.isGirlsAcademy) return 1;
      return b.score - a.score;
    });

    // Assign rankings
    const updates = [];
    for (let i = 0; i < playerScores.length; i++) {
      const { player } = playerScores[i];
      const ranking = i + 1;

      // Find or create tryout record
      let tryout = tryouts.find(t => t.player_id === player.id);
      
      if (tryout) {
        if (tryout.age_group_ranking !== ranking) {
          updates.push(
            base44.asServiceRole.entities.PlayerTryout.update(tryout.id, {
              age_group_ranking: ranking,
              player_name: player.full_name
            })
          );
        }
      } else {
        updates.push(
          base44.asServiceRole.entities.PlayerTryout.create({
            player_id: player.id,
            player_name: player.full_name,
            age_group_ranking: ranking
          })
        );
      }
    }

    await Promise.all(updates);

    return Response.json({ 
      success: true, 
      updated: updates.length,
      message: `Updated rankings for ${updates.length} players`
    });

  } catch (error) {
    console.error('Error updating rankings:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});