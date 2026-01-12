import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const { gender, age_groups, league_preference } = await req.json();

    // Fetch all relevant data
    const [players, teams, tryouts, evaluations, assessments] = await Promise.all([
      base44.asServiceRole.entities.Player.list(),
      base44.asServiceRole.entities.Team.list(),
      base44.asServiceRole.entities.PlayerTryout.list(),
      base44.asServiceRole.entities.Evaluation.list(),
      base44.asServiceRole.entities.PhysicalAssessment.list()
    ]);

    // Filter players by gender and age groups
    const eligiblePlayers = players.filter(p => {
      if (gender && p.gender !== gender) return false;
      if (age_groups && age_groups.length > 0 && !age_groups.includes(p.age_group)) return false;
      // Only include players without next year team assignment
      const playerTryout = tryouts.find(t => t.player_id === p.id);
      return !playerTryout?.next_year_team;
    });

    // Build player data with evaluations and assessments
    const playerData = eligiblePlayers.map(p => {
      const tryout = tryouts.find(t => t.player_id === p.id);
      const evaluation = evaluations.find(e => e.player_id === p.id);
      const assessment = assessments.find(a => a.player_id === p.id);

      return {
        id: p.id,
        name: p.full_name,
        age_group: p.age_group,
        gender: p.gender,
        primary_position: p.primary_position,
        team_role: tryout?.team_role,
        recommendation: tryout?.recommendation,
        current_team: tryout?.current_team,
        evaluation_score: evaluation?.overall_score || 0,
        physical_score: assessment?.overall_score || 0,
        growth_mindset: evaluation?.growth_mindset || 0,
        athleticism: evaluation?.athleticism || 0,
        team_focus: evaluation?.team_focus || 0
      };
    });

    // Get available teams for this gender/age
    const availableTeams = teams.filter(t => {
      if (gender && t.gender !== gender) return false;
      if (age_groups && age_groups.length > 0 && !age_groups.includes(t.age_group)) return false;
      if (league_preference && t.league !== league_preference) return false;
      return true;
    });

    // Create AI prompt for team formation
    const prompt = `You are an expert youth soccer team formation specialist. Analyze the following data and suggest optimal team assignments for the 2026/2027 season.

Available Teams:
${availableTeams.map(t => `- ${t.name} (${t.league}, ${t.age_group})`).join('\n')}

Players to Assign (${playerData.length} total):
${playerData.map(p => `
- ${p.name}
  Position: ${p.primary_position}
  Age Group: ${p.age_group}
  Current Team: ${p.current_team || 'External'}
  Team Role: ${p.team_role || 'N/A'}
  Recommendation: ${p.recommendation || 'N/A'}
  Evaluation Score: ${p.evaluation_score.toFixed(1)}/10
  Physical Score: ${p.physical_score}
  Growth Mindset: ${p.growth_mindset}/10
  Athleticism: ${p.athleticism}/10
  Team Focus: ${p.team_focus}/10
`).join('\n')}

Formation Criteria:
1. Balance teams by skill level (evaluation scores)
2. Ensure positional coverage (need GK, defenders, midfielders, forwards)
3. Consider coach recommendations (Move up, Keep, Move down)
4. Respect team roles (Indispensable Player, GA Starter, etc.)
5. Keep "Indispensable Players" and "GA Starters" in top teams
6. Balance athleticism and physical attributes across teams
7. Consider team chemistry and growth potential
8. Aim for 16-20 players per team

Please provide team assignments in this JSON format:
{
  "assignments": [
    {
      "player_id": "player_id_here",
      "team_name": "team_name_here",
      "reasoning": "Brief explanation"
    }
  ],
  "summary": {
    "total_assigned": number,
    "unassigned": number,
    "team_sizes": {
      "team_name": player_count
    }
  }
}`;

    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: "object",
        properties: {
          assignments: {
            type: "array",
            items: {
              type: "object",
              properties: {
                player_id: { type: "string" },
                team_name: { type: "string" },
                reasoning: { type: "string" }
              }
            }
          },
          summary: {
            type: "object",
            properties: {
              total_assigned: { type: "number" },
              unassigned: { type: "number" },
              team_sizes: { type: "object" }
            }
          }
        }
      }
    });

    return Response.json({
      success: true,
      ...aiResponse,
      eligible_players: playerData.length,
      available_teams: availableTeams.length
    });

  } catch (error) {
    console.error('Error auto-forming teams:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});