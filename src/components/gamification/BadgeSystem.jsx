export const BADGE_DEFINITIONS = {
  first_goal: {
    name: 'First Steps',
    description: 'Completed your first development goal',
    icon: '🎯',
    points: 50,
    category: 'goals'
  },
  five_goals: {
    name: 'Goal Crusher',
    description: 'Completed 5 development goals',
    icon: '🏆',
    points: 100,
    category: 'goals'
  },
  ten_goals: {
    name: 'Elite Achiever',
    description: 'Completed 10 development goals',
    icon: '👑',
    points: 200,
    category: 'goals'
  },
  first_module: {
    name: 'Training Starter',
    description: 'Completed your first training module',
    icon: '📚',
    points: 50,
    category: 'training'
  },
  five_modules: {
    name: 'Dedicated Trainer',
    description: 'Completed 5 training modules',
    icon: '💪',
    points: 100,
    category: 'training'
  },
  streak_7: {
    name: 'Week Warrior',
    description: '7-day activity streak',
    icon: '🔥',
    points: 75,
    category: 'consistency'
  },
  streak_30: {
    name: 'Month Master',
    description: '30-day activity streak',
    icon: '⚡',
    points: 150,
    category: 'consistency'
  },
  physical_improvement: {
    name: 'Getting Stronger',
    description: 'Improved physical assessment scores',
    icon: '💯',
    points: 100,
    category: 'improvement'
  },
  evaluation_excellence: {
    name: 'Rising Star',
    description: 'Achieved 8+ overall evaluation score',
    icon: '⭐',
    points: 150,
    category: 'achievement'
  },
  perfect_score: {
    name: 'Peak Performance',
    description: 'Achieved 9+ overall evaluation score',
    icon: '🌟',
    points: 250,
    category: 'achievement'
  }
};

export const calculatePoints = (action, data) => {
  const pointsMap = {
    goal_completed: 25,
    goal_progress_25: 10,
    goal_progress_50: 15,
    goal_progress_75: 20,
    module_completed: 30,
    assessment_taken: 20,
    evaluation_received: 15,
    daily_login: 5
  };

  return pointsMap[action] || 0;
};

export const checkBadgeEarned = (progress, action) => {
  const achievements = progress?.achievements || {};
  const earnedBadges = [];

  if (action === 'goal_completed') {
    if (achievements.goals_completed === 1 && !progress.badges?.find(b => b.id === 'first_goal')) {
      earnedBadges.push({ id: 'first_goal', ...BADGE_DEFINITIONS.first_goal });
    }
    if (achievements.goals_completed === 5 && !progress.badges?.find(b => b.id === 'five_goals')) {
      earnedBadges.push({ id: 'five_goals', ...BADGE_DEFINITIONS.five_goals });
    }
    if (achievements.goals_completed === 10 && !progress.badges?.find(b => b.id === 'ten_goals')) {
      earnedBadges.push({ id: 'ten_goals', ...BADGE_DEFINITIONS.ten_goals });
    }
  }

  if (action === 'module_completed') {
    if (achievements.modules_completed === 1 && !progress.badges?.find(b => b.id === 'first_module')) {
      earnedBadges.push({ id: 'first_module', ...BADGE_DEFINITIONS.first_module });
    }
    if (achievements.modules_completed === 5 && !progress.badges?.find(b => b.id === 'five_modules')) {
      earnedBadges.push({ id: 'five_modules', ...BADGE_DEFINITIONS.five_modules });
    }
  }

  if (action === 'streak_update') {
    const streakDays = achievements.streak_days || 0;
    if (streakDays === 7 && !progress.badges?.find(b => b.id === 'streak_7')) {
      earnedBadges.push({ id: 'streak_7', ...BADGE_DEFINITIONS.streak_7 });
    }
    if (streakDays === 30 && !progress.badges?.find(b => b.id === 'streak_30')) {
      earnedBadges.push({ id: 'streak_30', ...BADGE_DEFINITIONS.streak_30 });
    }
  }

  return earnedBadges;
};