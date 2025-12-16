// Team hierarchy for sorting
const TEAM_HIERARCHY = {
  // Girls Academy variations
  'Girls Academy': 1,
  'GA': 1,
  'Pre GA 1': 1,
  'Pre GA1': 1,
  'Pre GA 2': 2,
  'Pre GA2': 2,
  
  // Aspire
  'Aspire': 3,
  
  // Green
  'Green': 4,
  
  // White
  'White': 5,
  
  // Black
  'Black': 6
};

const getTeamRank = (teamName) => {
  if (!teamName) return 999;
  
  const normalizedName = teamName.trim();
  
  // Check exact matches first
  if (TEAM_HIERARCHY[normalizedName] !== undefined) {
    return TEAM_HIERARCHY[normalizedName];
  }
  
  // Check partial matches
  const lowerName = normalizedName.toLowerCase();
  
  if (lowerName.includes('girls academy') || lowerName.includes('ga')) {
    if (lowerName.includes('pre') && (lowerName.includes('2') || lowerName.includes('two'))) {
      return 2; // Pre GA 2
    }
    if (lowerName.includes('pre') && (lowerName.includes('1') || lowerName.includes('one'))) {
      return 1; // Pre GA 1
    }
    return 1; // Default GA
  }
  
  if (lowerName.includes('aspire')) return 3;
  if (lowerName.includes('green')) return 4;
  if (lowerName.includes('white')) return 5;
  if (lowerName.includes('black')) return 6;
  
  return 999; // Unknown teams go last
};

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return 0;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export const sortPlayers = (players, teams = []) => {
  return [...players].sort((a, b) => {
    const teamA = teams.find(t => t.id === a.team_id);
    const teamB = teams.find(t => t.id === b.team_id);
    
    const rankA = getTeamRank(teamA?.name);
    const rankB = getTeamRank(teamB?.name);
    
    // Sort by team hierarchy first
    if (rankA !== rankB) {
      return rankA - rankB;
    }
    
    // Within same team, sort by age (oldest to youngest)
    const ageA = calculateAge(a.date_of_birth);
    const ageB = calculateAge(b.date_of_birth);
    
    if (ageA !== ageB) {
      return ageB - ageA; // Descending (oldest first)
    }
    
    // If same age, sort by name
    const nameA = a.full_name?.split(' ').pop() || '';
    const nameB = b.full_name?.split(' ').pop() || '';
    return nameA.localeCompare(nameB);
  });
};

export const getBirthYear = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  return new Date(dateOfBirth).getFullYear();
};