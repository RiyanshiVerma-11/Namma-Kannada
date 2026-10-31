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

export interface ArcadeWaveChallenge {
  id: string;
  englishPrompt: string;
  correctKanglish: string;
  correctScript: string;
  decoyLeft: string;
  decoyRight: string;
}

export const ARCADE_CHALLENGE_WAVES: ArcadeWaveChallenge[] = [
  {
    id: 'wave-1',
    englishPrompt: 'Hello! How are you? (Polite)',
    correctKanglish: 'Namaskara, chennagiddira?',
    correctScript: 'ನಮಸ್ಕಾರ, ಚೆನ್ನಾಗಿದ್ದೀರಾ?',
    decoyLeft: 'Meter haaki anna',
    decoyRight: 'Beda, thumba jaasthi',
  },
  {
    id: 'wave-2',
    englishPrompt: 'Will you come to Indiranagar? Put on the meter.',
    correctKanglish: 'Indiranagar-ge bartheera? Meter haaki.',
    correctScript: 'ಇಂದಿರಾನಗರಗೆ ಬರ್ತೀರಾ? ಮೀಟರ್ ಹಾಕಿ.',
    decoyLeft: 'Oota aaytha sir?',
    decoyRight: 'Nanna hesaru Rahul',
  },
  {
    id: 'wave-3',
    englishPrompt: 'Go straight, stop near the signal ahead.',
    correctKanglish: 'Seedha hogi, munde signal hathra nilisi.',
    correctScript: 'ಸೀದಾ ಹೋಗಿ, ಮುಂದೆ ಸಿಗ್ನಲ್ ಹತ್ರ ನಿಲ್ಲಿಸಿ.',
    decoyLeft: 'Kannada gothilla',
    decoyRight: 'Ondu strong coffee kodi',
  },
  {
    id: 'wave-4',
    englishPrompt: 'Please give one filter coffee without sugar.',
    correctKanglish: 'Ondu filter coffee kodi, sakkare beda.',
    correctScript: 'ಒಂದು ಫಿಲ್ಟರ್ ಕಾಫಿ ಕೊಡಿ, ಸಕ್ಕರೆ ಬೇಡ.',
    decoyLeft: 'Ellige hogabeku?',
    decoyRight: 'Naale banni anna',
  },
  {
    id: 'wave-5',
    englishPrompt: 'How much is the fare? I will pay via UPI.',
    correctKanglish: 'Eshtu aaythu? UPI maadthini.',
    correctScript: 'ಎಷ್ಟು ಆಯ್ತು? ಯುಪಿಐ ಮಾಡ್ತೀನಿ.',
    decoyLeft: 'Swalpa adjust maadi',
    decoyRight: 'Chennagiddini, dhanyavadagalu',
  },
  {
    id: 'wave-6',
    englishPrompt: 'I am learning Kannada little by little!',
    correctKanglish: 'Naanu swalpa swalpa Kannada kalithiddini!',
    correctScript: 'ನಾನು ಸ್ವಲ್ಪ ಸ್ವಲ್ಪ ಕನ್ನಡ ಕಲಿತಿದ್ದೀನಿ!',
    decoyLeft: 'Bega banni sir',
    decoyRight: 'Water bandilla amma',
  },
];

export function scoreArcadeGateHit(
  currentScore: number,
  currentCombo: number,
  currentHull: number,
  isCorrect: boolean
): {
  nextScore: number;
  nextCombo: number;
  nextHull: number;
  pointsDelta: number;
} {
  if (isCorrect) {
    const nextCombo = currentCombo + 1;
    const pointsDelta = 100 * Math.min(4, nextCombo);
    return {
      nextScore: currentScore + pointsDelta,
      nextCombo,
      nextHull: currentHull,
      pointsDelta,
    };
  }

  return {
    nextScore: Math.max(0, currentScore - 25),
    nextCombo: 0,
    nextHull: Math.max(0, currentHull - 1),
    pointsDelta: -25,
  };
}

export interface AiTutorRole {
  id: 'auto_driver' | 'darshini_host' | 'grammar_guru' | 'office_colleague';
  name: string;
  personaTitle: string;
  defaultGreetingKanglish: string;
  defaultGreetingScript: string;
  defaultGreetingEnglish: string;
  systemInstruction: string;
}

export const AI_TUTOR_ROLES: AiTutorRole[] = [
  {
    id: 'auto_driver',
    name: 'Ramesh Anna',
    personaTitle: 'Indiranagar Auto Rickshaw Driver',
    defaultGreetingKanglish: 'Namaskara sir! Ellige hogabeku? Kannada-dalli heli, naanu help maadthini!',
    defaultGreetingScript: 'ನಮಸ್ಕಾರ ಸರ್! ಎಲ್ಲಿಗೆ ಹೋಗಬೇಕು? ಕನ್ನಡದಲ್ಲಿ ಹೇಳಿ, ನಾನು ಹೆಲ್ಪ್ ಮಾಡ್ತೀನಿ!',
    defaultGreetingEnglish: 'Hello! Where do you need to go? Tell me in Kannada, I will help you practice!',
    systemInstruction:
      'You are Ramesh Anna, a warm, witty, and encouraging Bengaluru auto-rickshaw driver helping a newcomer practice spoken everyday Kannada. In every reply: (1) Respond naturally to the conversation as Ramesh Anna, (2) Always provide spoken Kanglish phonetics first, followed by ಕನ್ನಡ script in parentheses, and a clear English translation, and (3) Gently correct or suggest 1 practical street-smart Kannada phrase the user can try next. Keep responses concise (under 110 words).',
  },
  {
    id: 'darshini_host',
    name: 'Shankaraiah',
    personaTitle: 'MTR & Darshini Filter Coffee Host',
    defaultGreetingKanglish: 'Banni namaskara! Bisi bisi Benne Dose matthu Filter Coffee ready ide. Enu thagolthira?',
    defaultGreetingScript: 'ಬನ್ನಿ ನಮಸ್ಕಾರ! ಬಿಸಿ ಬಿಸಿ ಬೆಣ್ಣೆ ದೋಸೆ ಮತ್ತು ಫಿಲ್ಟರ್ ಕಾಫಿ ರೆಡಿ ಇದೆ. ಏನು ತಗೊಳ್ತೀರಾ?',
    defaultGreetingEnglish: 'Welcome! Piping hot butter dosa and filter coffee are ready. What would you like to have?',
    systemInstruction:
      'You are Shankaraiah, a hospitable Old Bengaluru Darshini cafe owner helping a learner order food, coffee, and groceries in spoken Kannada. Always include: (1) Spoken Kanglish phonetics, (2) Native ಕನ್ನಡ script, (3) English meaning, and (4) A short tip on food/dining vocabulary like "kodi" (please give), "sakkare beda" (no sugar), or "by-two coffee". Keep responses warm and under 110 words.',
  },
  {
    id: 'grammar_guru',
    name: 'Prof. Nandini',
    personaTitle: 'Spoken Kannada Grammar & Suffix Coach',
    defaultGreetingKanglish: 'Namaskara! Ask me any sentence or suffix (-ge, -alli, -ri, -avare) and I will break it down word by word.',
    defaultGreetingScript: 'ನಮಸ್ಕಾರ! ಯಾವುದೇ ವಾಕ್ಯವನ್ನು ಕೇಳಿ, ಪದದಿಂದ ಪದಕ್ಕೆ ವಿವರಿಸುತ್ತೇನೆ.',
    defaultGreetingEnglish: 'Hello! Ask me any sentence or suffix and I will break it down word by word.',
    systemInstruction:
      'You are Prof. Nandini, a friendly linguist specializing in teaching spoken Bengaluru Kannada to non-Kannada speakers without overwhelming them. Whenever the user asks how to say something or asks a grammar question, provide: (1) Spoken Kanglish phrase, (2) ಕನ್ನಡ script, (3) Literal word-by-word morphology breakdown (explaining suffixes like -ge = to, -alli = in/at, -inda = from, -ri/-avare = polite respect), and (4) One memory hook. Keep answers clear and structured.',
  },
  {
    id: 'office_colleague',
    name: 'Karthik Gowda',
    personaTitle: 'Bengaluru Tech Park Teammate & Neighbor',
    defaultGreetingKanglish: 'Hey Namaskara! Coffee aaytha? Let us practice casual office and apartment Kannada!',
    defaultGreetingScript: 'ಹೇ ನಮಸ್ಕಾರ! ಕಾಫಿ ಆಯ್ತಾ? ಆಫೀಸ್ ಮತ್ತು ನೆರೆಹೊರೆಯ ಕನ್ನಡ ಪ್ರಾಕ್ಟೀಸ್ ಮಾಡೋಣ!',
    defaultGreetingEnglish: 'Hey hello! Had coffee? Let us practice casual office and apartment Kannada!',
    systemInstruction:
      'You are Karthik Gowda, a supportive colleague and neighbor in Bengaluru. Help the user practice workplace small talk ("Oota aaytha?", "Coffee aaytha?"), speaking with apartment security/landlords, and making friends in Karnataka. Always include spoken Kanglish, ಕನ್ನಡ script, and English meaning in every reply. Keep responses natural and under 110 words.',
  },
];

export function getSystemInstructionForRole(roleId?: string): string {
  const found = AI_TUTOR_ROLES.find((r) => r.id === roleId);
  return (
    found?.systemInstruction ||
    AI_TUTOR_ROLES[0].systemInstruction
  );
}

export interface WeeklyStreakTrendPoint {
  dateIso: string;
  dayLabel: string;
  shortDate: string;
  xpEarned: number;
  dailyGoal: number;
  completionPercent: number;
  isActiveDay: boolean;
  goalMet: boolean;
}

export interface WeeklyStreakTrendsSummary {
  days: WeeklyStreakTrendPoint[];
  activeDaysCount: number;
  consistencyPercent: number;
  totalWeeklyXp: number;
  goalMetDaysCount: number;
}

const SHORT_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function buildWeeklyStreakTrends(
  stats: UserProgressStats,
  dailyXpGoal: number,
  todayIso: string = new Date().toISOString().slice(0, 10)
): WeeklyStreakTrendsSummary {
  const safeGoal = Math.max(10, dailyXpGoal || 100);
  const [yr, mo, dy] = todayIso.split('-').map(Number);
  const baseUtc = Date.UTC(yr || 2026, (mo || 1) - 1, dy || 1);

  const days: WeeklyStreakTrendPoint[] = [];

  // Determine how many consecutive days leading up to lastActiveDate were active
  const practicedToday = stats.lastActiveDate === todayIso && (stats.todayXp > 0 || stats.streakDays > 0);
  const priorStreakCount = practicedToday
    ? Math.max(0, stats.streakDays - 1)
    : stats.streakDays;

  for (let i = 6; i >= 0; i--) {
    const dayUtc = new Date(baseUtc - i * 86400000);
    const dateIso = dayUtc.toISOString().slice(0, 10);
    const weekdayName = SHORT_WEEKDAYS[dayUtc.getUTCDay()];
    const dayLabel = i === 0 ? 'Today' : weekdayName;
    const shortDate = `${SHORT_MONTHS[dayUtc.getUTCMonth()]} ${dayUtc.getUTCDate()}`;

    let xpEarned = 0;
    if (i === 0) {
      xpEarned = practicedToday ? Math.max(0, stats.todayXp) : 0;
    } else if (i <= priorStreakCount) {
      // Honest representation of prior active streak days
      xpEarned = safeGoal;
    }

    const completionPercent = Math.min(100, Math.round((xpEarned / safeGoal) * 100));
    const isActiveDay = xpEarned > 0;
    const goalMet = xpEarned >= safeGoal;

    days.push({
      dateIso,
      dayLabel,
      shortDate,
      xpEarned,
      dailyGoal: safeGoal,
      completionPercent,
      isActiveDay,
      goalMet,
    });
  }

  const activeDaysCount = days.filter((d) => d.isActiveDay).length;
  const goalMetDaysCount = days.filter((d) => d.goalMet).length;
  const consistencyPercent = Math.round((activeDaysCount / 7) * 100);
  const totalWeeklyXp = days.reduce((sum, d) => sum + d.xpEarned, 0);

  return {
    days,
    activeDaysCount,
    consistencyPercent,
    totalWeeklyXp,
    goalMetDaysCount,
  };
}

export interface DailyGoalRingMetrics {
  todayXp: number;
  dailyXpGoal: number;
  percentage: number;
  radius: number;
  circumference: number;
  strokeDashoffset: number;
  remainingXp: number;
  isGoalComplete: boolean;
}

export function calculateDailyGoalRingMetrics(
  todayXp: number,
  dailyXpGoal: number,
  radius: number = 34
): DailyGoalRingMetrics {
  const safeGoal = Math.max(10, dailyXpGoal || 100);
  const safeTodayXp = Math.max(0, todayXp || 0);
  const percentage = Math.min(100, Math.round((safeTodayXp / safeGoal) * 100));
  const circumference = Number((2 * Math.PI * radius).toFixed(2));
  const strokeDashoffset = Number((circumference * (1 - percentage / 100)).toFixed(2));
  const remainingXp = Math.max(0, safeGoal - safeTodayXp);
  const isGoalComplete = safeTodayXp >= safeGoal;

  return {
    todayXp: safeTodayXp,
    dailyXpGoal: safeGoal,
    percentage,
    radius,
    circumference,
    strokeDashoffset,
    remainingXp,
    isGoalComplete,
  };
}



