export type ProficiencyLevel = 'none' | 'basic_words' | 'conversational' | 'script_reader';
export type DailyCommitmentMinutes = 5 | 10 | 15 | 25;
export type LearningMotivation = 'work_relocation' | 'daily_commute' | 'family_friends' | 'culture_travel';

export interface OnboardingInput {
  proficiency: ProficiencyLevel;
  dailyMinutes: DailyCommitmentMinutes;
  motivation: LearningMotivation;
  scriptPreference: 'kanglish_only' | 'kanglish_plus_script';
}

export interface PersonalizedPlan {
  proficiency: ProficiencyLevel;
  dailyMinutes: DailyCommitmentMinutes;
  motivation: LearningMotivation;
  scriptPreference: 'kanglish_only' | 'kanglish_plus_script';
  dailyXpGoal: number;
  dailyPhrasesTarget: number;
  recommendedUnitId: string;
  trackName: string;
  estimatedWeeksToFluency: number;
  weeklyMilestones: {
    week: number;
    title: string;
    outcome: string;
  }[];
}

export interface UserProgressStats {
  xp: number;
  todayXp: number;
  streakDays: number;
  lastActiveDate: string; // YYYY-MM-DD or '' for brand-new user
  joinedDate: string; // YYYY-MM-DD
  completedLessonIds: string[];
  completedSituationIds: string[];
  savedVocabIds: string[];
  streakFreezeAvailable: boolean;
  doubleXpActive?: boolean;
  unlockedRewardIds?: string[];
}

export function createFreshUserStats(todayIso: string): UserProgressStats {
  return {
    xp: 0,
    todayXp: 0,
    streakDays: 0,
    lastActiveDate: '',
    joinedDate: todayIso,
    completedLessonIds: [],
    completedSituationIds: [],
    savedVocabIds: ['v1'],
    streakFreezeAvailable: false,
    doubleXpActive: false,
    unlockedRewardIds: [],
  };
}

export function buildPersonalizedPlan(input: OnboardingInput): PersonalizedPlan {
  const xpMap: Record<DailyCommitmentMinutes, number> = {
    5: 50,
    10: 100,
    15: 150,
    25: 250,
  };

  const phrasesMap: Record<DailyCommitmentMinutes, number> = {
    5: 4,
    10: 8,
    15: 12,
    25: 20,
  };

  const baseWeeksMap: Record<ProficiencyLevel, number> = {
    none: 8,
    basic_words: 6,
    conversational: 4,
    script_reader: 3,
  };

  const speedFactor: Record<DailyCommitmentMinutes, number> = {
    5: 1.25,
    10: 1.0,
    15: 0.8,
    25: 0.6,
  };

  const estimatedWeeksToFluency = Math.max(
    2,
    Math.round(baseWeeksMap[input.proficiency] * speedFactor[input.dailyMinutes])
  );

  const recommendedUnitMap: Record<ProficiencyLevel, string> = {
    none: 'unit-1',
    basic_words: 'unit-2',
    conversational: 'unit-3',
    script_reader: 'unit-4',
  };

  const trackTitleMap: Record<LearningMotivation, string> = {
    work_relocation: 'Bengaluru Living & Workplace Track',
    daily_commute: 'Street Smart Commute & Markets Track',
    family_friends: 'Warm Conversations & Home Track',
    culture_travel: 'Karnataka Heritage & Travel Track',
  };

  const weeklyMilestones = [
    {
      week: 1,
      title: 'Polite Greetings & Icebreakers',
      outcome: 'Greet neighbors, security guards, and colleagues warmly with Namaskara and Oota Aaytha.',
    },
    {
      week: 2,
      title: 'Auto, Cab & Metro Navigation',
      outcome: 'Give clear directions, negotiate fares respectfully, and guide delivery partners by phone.',
    },
    {
      week: 3,
      title: 'Darshini Cafes & Local Markets',
      outcome: 'Order filter coffee, specify spice levels, and buy fresh produce using Kannada numbers.',
    },
    {
      week: 4,
      title: 'Confident Everyday Flow',
      outcome: 'Hold 3-minute natural conversations with locals using polite plural (-ri) forms.',
    },
  ];

  return {
    ...input,
    dailyXpGoal: xpMap[input.dailyMinutes],
    dailyPhrasesTarget: phrasesMap[input.dailyMinutes],
    recommendedUnitId: recommendedUnitMap[input.proficiency],
    trackName: trackTitleMap[input.motivation],
    estimatedWeeksToFluency,
    weeklyMilestones,
  };
}

export function normalizeKanglish(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,?!'"\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function evaluateSentenceBuilder(targetTokens: string[], selectedTokens: string[]): {
  isCorrect: boolean;
  expectedNormalized: string;
  actualNormalized: string;
} {
  const expectedNormalized = normalizeKanglish(targetTokens.join(' '));
  const actualNormalized = normalizeKanglish(selectedTokens.join(' '));
  return {
    isCorrect: expectedNormalized === actualNormalized,
    expectedNormalized,
    actualNormalized,
  };
}

export function getPreviousDayIso(isoDate: string): string {
  const parts = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

export function calculateDaysSinceActive(lastActiveDate: string, todayIso: string): {
  statusLabel: string;
  daysGone: number;
} {
  if (!lastActiveDate) {
    return {
      statusLabel: 'Day 1 of Your Journey · Complete your first lesson today to ignite your streak!',
      daysGone: 0,
    };
  }
  if (lastActiveDate === todayIso) {
    return {
      statusLabel: 'Practiced Today · Your daily streak is active and protected!',
      daysGone: 0,
    };
  }
  const p1 = lastActiveDate.split('-').map(Number);
  const p2 = todayIso.split('-').map(Number);
  const d1 = Date.UTC(p1[0], p1[1] - 1, p1[2]);
  const d2 = Date.UTC(p2[0], p2[1] - 1, p2[2]);
  const diffDays = Math.max(0, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));

  if (diffDays === 1) {
    return {
      statusLabel: 'Last practiced yesterday · Complete 1 lesson today to extend your streak!',
      daysGone: 1,
    };
  }
  return {
    statusLabel: `You have been away for ${diffDays} days · Jump back in today to restart your Day 1 streak!`,
    daysGone: diffDays,
  };
}

export function calculateLessonCompletion(
  stats: UserProgressStats,
  lessonId: string,
  baseXp: number,
  accuracyPercent: number,
  todayIso: string
): {
  updatedStats: UserProgressStats;
  xpAwarded: number;
  streakIncremented: boolean;
  isFirstCompletion: boolean;
} {
  const accuracyBonus = accuracyPercent >= 90 ? 15 : accuracyPercent >= 75 ? 5 : 0;
  const isFirstCompletion = !stats.completedLessonIds.includes(lessonId);
  const rawXp = baseXp + accuracyBonus;
  const xpAwarded = stats.doubleXpActive ? rawXp * 2 : rawXp;

  let streakDays = stats.streakDays;
  let streakIncremented = false;
  let todayXp = stats.todayXp;

  if (stats.lastActiveDate === todayIso) {
    todayXp += xpAwarded;
    if (streakDays === 0) {
      streakDays = 1;
      streakIncremented = true;
    }
  } else {
    const yesterdayIso = getPreviousDayIso(todayIso);
    if (stats.lastActiveDate && stats.lastActiveDate === yesterdayIso) {
      streakDays = stats.streakDays + 1;
      streakIncremented = true;
    } else if (stats.lastActiveDate && stats.streakFreezeAvailable) {
      // Streak freeze protects the existing streak across a missed day
      streakDays = Math.max(1, stats.streakDays);
      streakIncremented = false;
    } else {
      streakDays = 1;
      streakIncremented = true;
    }
    todayXp = xpAwarded;
  }

  const completedLessonIds = isFirstCompletion
    ? [...stats.completedLessonIds, lessonId]
    : stats.completedLessonIds;

  return {
    updatedStats: {
      ...stats,
      xp: stats.xp + xpAwarded,
      todayXp,
      streakDays,
      lastActiveDate: todayIso,
      completedLessonIds,
      doubleXpActive: false,
    },
    xpAwarded,
    streakIncremented,
    isFirstCompletion,
  };
}

export function spendXpOnReward(
  stats: UserProgressStats,
  rewardId: string,
  cost: number
): {
  success: boolean;
  error?: string;
  updatedStats: UserProgressStats;
} {
  const unlocked = stats.unlockedRewardIds || [];
  if (rewardId === 'streak_freeze' && stats.streakFreezeAvailable) {
    return {
      success: false,
      error: 'You already have an active Streak Freeze Shield equipped.',
      updatedStats: stats,
    };
  }
  if (rewardId === 'double_xp' && stats.doubleXpActive) {
    return {
      success: false,
      error: '2x XP Boost is already active for your next lesson!',
      updatedStats: stats,
    };
  }
  if (
    rewardId !== 'streak_freeze' &&
    rewardId !== 'double_xp' &&
    unlocked.includes(rewardId)
  ) {
    return {
      success: false,
      error: 'You have already unlocked this reward.',
      updatedStats: stats,
    };
  }
  if (stats.xp < cost) {
    return {
      success: false,
      error: `You need ${cost - stats.xp} more XP to unlock this reward. Complete a lesson or roleplay to earn XP!`,
      updatedStats: stats,
    };
  }

  const updatedStats: UserProgressStats = {
    ...stats,
    xp: stats.xp - cost,
    streakFreezeAvailable:
      rewardId === 'streak_freeze' ? true : stats.streakFreezeAvailable,
    doubleXpActive: rewardId === 'double_xp' ? true : stats.doubleXpActive,
    unlockedRewardIds: unlocked.includes(rewardId)
      ? unlocked
      : [...unlocked, rewardId],
  };

  return {
    success: true,
    updatedStats,
  };
}

export function validateEmailFormat(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed || trimmed.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
}

export function validateOtpCode(otp: string): boolean {
  return /^\d{6}$/.test(otp.trim());
}
