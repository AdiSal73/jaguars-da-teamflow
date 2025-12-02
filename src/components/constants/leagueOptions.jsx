export const BRANCH_OPTIONS = [
  'CW3',
  'Dearborn',
  'Downriver',
  'Genesee',
  'Huron Valley',
  'Jackson',
  'Lansing',
  'Marshall',
  'Northville',
  'Novi',
  'Rochester Romeo',
  'West Bloomfield'
];

export const FEMALE_LEAGUES = [
  'Girls Academy',
  'Aspire',
  'NLC',
  'DPL',
  'MSPSP',
  'Pre GA',
  'Directors Academy',
  'MSDSL'
];

export const MALE_LEAGUES = [
  'MLS Next Homegrown',
  'MLS Next Academy',
  'United MLS Next Academy',
  'Pre-MLS Next',
  'NLC',
  'Directors Academy',
  'MSPSP',
  'MSDSL'
];

export const getLeaguesForGender = (gender) => {
  if (gender === 'Female') return FEMALE_LEAGUES;
  if (gender === 'Male') return MALE_LEAGUES;
  return [...new Set([...FEMALE_LEAGUES, ...MALE_LEAGUES])];
};

export const getTeamBorderColor = (league) => {
  const greenLeagues = ['MLS Next Homegrown', 'Girls Academy'];
  const blueLeagues = ['MLS Next Academy', 'United MLS Next Academy', 'Aspire'];
  
  if (greenLeagues.includes(league)) return 'border-emerald-500';
  if (blueLeagues.includes(league)) return 'border-blue-500';
  return 'border-amber-500';
};

export const getTeamBorderStyle = (league) => {
  const greenLeagues = ['MLS Next Homegrown', 'Girls Academy'];
  const blueLeagues = ['MLS Next Academy', 'United MLS Next Academy', 'Aspire'];
  
  if (greenLeagues.includes(league)) return '#10b981';
  if (blueLeagues.includes(league)) return '#3b82f6';
  return '#f59e0b';
};