import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPersonalizedPlan,
  calculateLessonCompletion,
  createFreshUserStats,
  evaluateSentenceBuilder,
  spendXpOnReward,
  validateEmailFormat,
  validateOtpCode,
  type UserProgressStats,
} from './learningEngine';

test('new user starts with 0 streak and 0 XP, and transitions to 1-day streak after first lesson', () => {
  const fresh = createFreshUserStats('2026-10-30');
  assert.equal(fresh.streakDays, 0);
  assert.equal(fresh.xp, 0);
  assert.equal(fresh.lastActiveDate, '');

  const afterFirstLesson = calculateLessonCompletion(fresh, 'lesson-1-1', 40, 100, '2026-10-30');
  assert.equal(afterFirstLesson.updatedStats.streakDays, 1);
  assert.equal(afterFirstLesson.streakIncremented, true);
  assert.equal(afterFirstLesson.xpAwarded, 55); // 40 + 15 accuracy bonus
  assert.equal(afterFirstLesson.updatedStats.xp, 55);
});

test('buildPersonalizedPlan calculates accurate daily XP and unit placement', () => {
  const beginnerPlan = buildPersonalizedPlan({
    proficiency: 'none',
    dailyMinutes: 15,
    motivation: 'work_relocation',
    scriptPreference: 'kanglish_plus_script',
  });

  assert.equal(beginnerPlan.dailyXpGoal, 150);
  assert.equal(beginnerPlan.dailyPhrasesTarget, 12);
  assert.equal(beginnerPlan.recommendedUnitId, 'unit-1');
  assert.equal(beginnerPlan.trackName, 'Bengaluru Living & Workplace Track');
  assert.equal(beginnerPlan.weeklyMilestones.length, 4);
});

test('evaluateSentenceBuilder normalizes punctuation and case properly', () => {
  const res1 = evaluateSentenceBuilder(
    ['Anna,', 'Indiranagar-ge', 'bartheera?'],
    ['anna', 'indiranagar ge', 'bartheera']
  );
  assert.equal(res1.isCorrect, true);

  const res2 = evaluateSentenceBuilder(
    ['Ondu', 'filter', 'coffee', 'kodi'],
    ['Coffee', 'ondu', 'kodi']
  );
  assert.equal(res2.isCorrect, false);
});

test('calculateLessonCompletion increments streak on consecutive day and supports 2x XP boost', () => {
  const initialStats: UserProgressStats = {
    xp: 120,
    todayXp: 40,
    streakDays: 1,
    lastActiveDate: '2026-10-28',
    joinedDate: '2026-10-28',
    completedLessonIds: ['lesson-1-1'],
    completedSituationIds: [],
    savedVocabIds: [],
    streakFreezeAvailable: false,
    doubleXpActive: true,
    unlockedRewardIds: [],
  };

  const result = calculateLessonCompletion(initialStats, 'lesson-1-2', 35, 95, '2026-10-29');

  assert.equal(result.xpAwarded, 100); // (35 base + 15 bonus) * 2
  assert.equal(result.streakIncremented, true);
  assert.equal(result.updatedStats.streakDays, 2);
  assert.equal(result.updatedStats.doubleXpActive, false);
});

test('spendXpOnReward deducts XP and equips rewards or unlocks packs', () => {
  const stats: UserProgressStats = {
    xp: 100,
    todayXp: 50,
    streakDays: 1,
    lastActiveDate: '2026-10-30',
    joinedDate: '2026-10-30',
    completedLessonIds: ['lesson-1-1'],
    completedSituationIds: [],
    savedVocabIds: [],
    streakFreezeAvailable: false,
    doubleXpActive: false,
    unlockedRewardIds: [],
  };

  const res1 = spendXpOnReward(stats, 'double_xp', 40);
  assert.equal(res1.success, true);
  assert.equal(res1.updatedStats.xp, 60);
  assert.equal(res1.updatedStats.doubleXpActive, true);

  const res2 = spendXpOnReward(res1.updatedStats, 'pack_darshini', 75);
  assert.equal(res2.success, false); // only 60 XP left
});

test('validateEmailFormat and validateOtpCode enforce strict formats', () => {
  assert.equal(validateEmailFormat('learner@nammakannada.in'), true);
  assert.equal(validateEmailFormat('invalid-email'), false);
  assert.equal(validateOtpCode('482910'), true);
  assert.equal(validateOtpCode('12345'), false);
});
