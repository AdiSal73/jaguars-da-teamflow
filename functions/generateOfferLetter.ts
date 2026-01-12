import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { player_id, team_name, team_details } = await req.json();

    // Fetch player data
    const player = await base44.entities.Player.filter({ id: player_id });
    if (!player || player.length === 0) {
      return Response.json({ error: 'Player not found' }, { status: 404 });
    }

    const playerData = player[0];

    // Fetch evaluation
    const evaluations = await base44.entities.Evaluation.filter({ player_id });
    const evaluation = evaluations?.[0];

    // Fetch assessment
    const assessments = await base44.entities.PhysicalAssessment.filter({ player_id });
    const assessment = assessments?.[0];

    // Fetch tryout
    const tryouts = await base44.entities.PlayerTryout.filter({ player_id });
    const tryout = tryouts?.[0];

    // Generate personalized offer letter using AI
    const prompt = `Generate a professional and personalized soccer team offer letter with the following details:

Player Information:
- Name: ${playerData.full_name}
- Age Group: ${playerData.age_group || 'N/A'}
- Primary Position: ${playerData.primary_position || 'N/A'}
- Current Team: ${tryout?.current_team || 'External Player'}

Team Offering:
- Team Name: ${team_name}
- League: ${team_details?.league || 'N/A'}
- Branch: ${team_details?.branch || 'N/A'}

Performance Metrics:
${evaluation ? `- Overall Evaluation Score: ${evaluation.overall_score?.toFixed(1) || 'N/A'}/10
- Growth Mindset: ${evaluation.growth_mindset}/10
- Athleticism: ${evaluation.athleticism}/10
- Team Focus: ${evaluation.team_focus}/10` : '- No evaluation data available'}

${assessment ? `- Physical Assessment Score: ${assessment.overall_score}
- Speed: ${assessment.speed_score}, Power: ${assessment.power_score}
- Endurance: ${assessment.endurance_score}, Agility: ${assessment.agility_score}` : '- No physical assessment data available'}

${tryout?.team_role ? `- Recommended Team Role: ${tryout.team_role}` : ''}
${tryout?.recommendation ? `- Coach Recommendation: ${tryout.recommendation}` : ''}

Generate a compelling offer letter that:
1. Opens with a warm congratulations
2. Highlights the player's specific strengths based on the data
3. Explains why they're a great fit for ${team_name}
4. Mentions the team's goals and how the player can contribute
5. Includes next steps (accept/decline within 7 days)
6. Closes professionally

Keep it concise (300-400 words), professional yet encouraging, and personalized to this specific player's performance data.`;

    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt: prompt
    });

    return Response.json({
      offer_letter: aiResponse,
      player_name: playerData.full_name,
      team_name: team_name,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating offer letter:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});