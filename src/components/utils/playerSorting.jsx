// Utility for consistent player sorting across the app

const TEAM_PRIORITY = {
  'Girls Academy': 1,
  'GA': 1,
  'Girls Academy Aspire': 2,
  'Aspire': 3,
  'Green': 4,
  'White': 5
};

const getTeamPriority = (teamName) => {
  if (!teamName) return 999;
  
  // Check if team name contains priority keywords
  for (const [keyword, priority] of Object.entries(TEAM_PRIORITY)) {
    if (teamName.includes(keyword)) {
      return priority;
    }
  }
  
  return 100; // Other teams
};

const getLastName = (fullName) => {
  if (!fullName) return '';
  const parts = fullName.trim().split(' ');
  return parts[parts.length - 1].toLowerCase();
};

export const sortPlayersByTeamAndName = (players, teams = []) => {
  return [...players].sort((a, b) => {
    // Get team names
    const teamA = teams.find(t => t.id === a.team_id)?.name || a.current_team || '';
    const teamB = teams.find(t => t.id === b.team_id)?.name || b.current_team || '';
    
    // First sort by team priority
    const priorityA = getTeamPriority(teamA);
    const priorityB = getTeamPriority(teamB);
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // Then sort by last name alphabetically
    const lastNameA = getLastName(a.full_name || a.player_name);
    const lastNameB = getLastName(b.full_name || b.player_name);
    
    return lastNameA.localeCompare(lastNameB);
  });
};