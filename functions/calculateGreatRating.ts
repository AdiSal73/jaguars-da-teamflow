import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

function calculateGreatRating(evaluation) {
  // Mental & Character (out of 10)
  const mental = (
    2 * (evaluation.growth_mindset || 0) +
    2 * (evaluation.resilience || 0) +
    (evaluation.efficiency_in_execution || 0) +
    4 * (evaluation.athleticism || 0) +
    (evaluation.team_focus || 0)
  ) / 10;

  // Defending (out of 8)
  const defending = (
    2 * (evaluation.defending_organized || 0) +
    2 * (evaluation.defending_transition || 0) +
    3 * (evaluation.defending_final_third || 0) +
    (evaluation.defending_set_pieces || 0)
  ) / 8;

  // Attacking (out of 8)
  const attacking = (
    2 * (evaluation.attacking_organized || 0) +
    2 * (evaluation.attacking_in_transition || 0) +
    3 * (evaluation.attacking_final_third || 0) +
    (evaluation.attacking_set_pieces || 0)
  ) / 8;

  // Position Roles (out of 4)
  const positionRoles = (
    (evaluation.position_role_1 || 0) +
    (evaluation.position_role_2 || 0) +
    (evaluation.position_role_3 || 0) +
    (evaluation.position_role_4 || 0)
  ) / 4;

  // G.R.E.A.T(R) = 2*Mental + 2*Defending + 2*Attacking + 4*PositionRoles
  const greatRating = 2 * mental + 2 * defending + 2 * attacking + 4 * positionRoles;

  return Math.round(greatRating * 10) / 10; // Round to 1 decimal place
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const evaluations = await base44.asServiceRole.entities.Evaluation.list();
    
    let updated = 0;
    const errors = [];
    
    for (const evaluation of evaluations) {
      try {
        const greatRating = calculateGreatRating(evaluation);
        
        await base44.asServiceRole.entities.Evaluation.update(evaluation.id, {
          overall_score: greatRating
        });
        
        updated++;
      } catch (error) {
        errors.push({ 
          player: evaluation.player_name, 
          error: error.message 
        });
      }
    }
    
    return Response.json({
      success: true,
      message: `Updated ${updated} evaluations with G.R.E.A.T ratings`,
      updated,
      totalEvaluations: evaluations.length,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});