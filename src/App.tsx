/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Flame,
  BookOpen,
  MessageCircle,
  Bookmark,
  Compass,
  Volume2,
  CheckCircle2,
  Play,
  Search,
  Award,
  Sliders,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Gift,
  User,
  Clock,
  Zap,
  Gamepad2,
  Radio,
  Bot,
  Mail,
  Bell,
} from 'lucide-react';
import { LandingPage } from './components/LandingPage';
import { OnboardingWizard } from './components/OnboardingWizard';
import { AuthView, type AuthenticatedUser } from './components/AuthView';
import { LessonPlayer } from './components/LessonPlayer';
import { SituationSimulator } from './components/SituationSimulator';
import { SituationSceneIllustration } from './components/CulturalIllustrations';
import { ProfileAndXpView, getInitials } from './components/ProfileAndXpView';
import { KannadaArcadeGame } from './components/KannadaArcadeGame';
import { GeminiChatTutor } from './components/GeminiChatTutor';
import { GeminiLiveVoiceTutor } from './components/GeminiLiveVoiceTutor';
import { StreakTrendsCard } from './components/StreakTrendsCard';
import {
  LEARNING_UNITS,
  EVERYDAY_SITUATIONS,
  VOCABULARY_ITEMS,
  type Lesson,
  type EverydaySituation,
} from './data/kannadaData';
import {
  buildPersonalizedPlan,
  calculateDailyGoalRingMetrics,
  calculateDaysSinceActive,
  calculateLessonCompletion,
  createFreshUserStats,
  type DailyCommitmentMinutes,
  type PersonalizedPlan,
  type ProficiencyLevel,
  type UserProgressStats,
} from './utils/learningEngine';
import { speakKannadaPhrase } from './utils/speech';

type AppView = 'landing' | 'onboarding' | 'auth' | 'dashboard';
type DashboardTab =
  | 'learn'
  | 'situations'
  | 'arcade_game'
  | 'live_voice'
  | 'ai_chat'
  | 'phrasebook'
  | 'plan'
  | 'xp_store'
  | 'profile';

const STORAGE_KEYS = {
  USER: 'namma_kannada_user_v2',
  PLAN: 'namma_kannada_plan_v2',
  STATS: 'namma_kannada_stats_v2',
};

function getTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const DEFAULT_PLAN: PersonalizedPlan = buildPersonalizedPlan({
  proficiency: 'none',
  dailyMinutes: 15,
  motivation: 'work_relocation',
  scriptPreference: 'kanglish_plus_script',
});

export default function App() {
  const isAutostart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const [user, setUser] = useState<AuthenticatedUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    if (isAutostart) {
      return {
        id: 'usr-demo-1',
        name: 'Arjun Mehta',
        email: 'arjun@nammakannada.in',
      };
    }
    return null;
  });

  const [plan, setPlan] = useState<PersonalizedPlan>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PLAN);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_PLAN;
  });

  const [stats, setStats] = useState<UserProgressStats>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STATS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return createFreshUserStats(getTodayIso());
  });

  const [appView, setAppView] = useState<AppView>(() => {
    if (isAutostart || user) return 'dashboard';
    return 'landing';
  });

  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup' | 'otp'>('login');
  const [activeTab, setActiveTab] = useState<DashboardTab>('learn');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeSituation, setActiveSituation] = useState<EverydaySituation | null>(null);
  const [showScript, setShowScript] = useState<boolean>(
    plan.scriptPreference === 'kanglish_plus_script'
  );

  // Phrasebook filters
  const [vocabSearch, setVocabSearch] = useState('');
  const [vocabCategory, setVocabCategory] = useState<string>('All');
  const [toastBanner, setToastBanner] = useState<string | null>(null);

  // Opt-In Daily Email Notification state
  const [reminderAgreed, setReminderAgreed] = useState<boolean>(false);
  const [reminderTime, setReminderTime] = useState<string>('07:30 PM');
  const [reminderEmail, setReminderEmail] = useState<string>(user?.email || '');
  const [reminderSaving, setReminderSaving] = useState<boolean>(false);
  const [reminderFeedback, setReminderFeedback] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (user?.email && !reminderEmail) {
      setReminderEmail(user.email);
    }
  }, [user?.email, reminderEmail]);

  useEffect(() => {
    try {
      if (user) localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      else localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.setItem(STORAGE_KEYS.PLAN, JSON.stringify(plan));
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    } catch {
      // ignore storage errors
    }

    if (user?.email) {
      fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, plan, stats }),
      }).catch(() => {});
    }
  }, [user, plan, stats]);

  const showNotification = (msg: string) => {
    setToastBanner(msg);
    setTimeout(() => {
      setToastBanner((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const selectDashboardTab = (tab: DashboardTab) => {
    if (tab !== 'situations') setActiveSituation(null);
    setActiveTab(tab);
    setIsMobileDrawerOpen(false);
  };

  const handleStartNextLesson = () => {
    const recUnit =
      LEARNING_UNITS.find((u) => u.id === plan.recommendedUnitId) || LEARNING_UNITS[0];
    const nextLesson =
      recUnit.lessons.find((l) => !stats.completedLessonIds.includes(l.id)) ||
      LEARNING_UNITS.flatMap((u) => u.lessons).find(
        (l) => !stats.completedLessonIds.includes(l.id)
      ) ||
      recUnit.lessons[0];
    setActiveLesson(nextLesson);
  };

  const handleLessonCompleted = (lessonId: string, baseXp: number, accuracyPercent: number) => {
    const result = calculateLessonCompletion(
      stats,
      lessonId,
      baseXp,
      accuracyPercent,
      getTodayIso()
    );
    setStats(result.updatedStats);
    setActiveLesson(null);
    showNotification(
      `Shabhaash! Earned +${result.xpAwarded} XP · Your Streak is now ${result.updatedStats.streakDays} ${
        result.updatedStats.streakDays === 1 ? 'day' : 'days'
      }!`
    );
  };

  const handleSituationCompleted = (situationId: string, xpReward: number) => {
    const result = calculateLessonCompletion(stats, situationId, xpReward, 95, getTodayIso());
    const completedSituationIds = stats.completedSituationIds.includes(situationId)
      ? stats.completedSituationIds
      : [...stats.completedSituationIds, situationId];

    setStats({
      ...result.updatedStats,
      completedSituationIds,
    });
    setActiveSituation(null);
    showNotification(`Completed real-life situation! +${result.xpAwarded} XP added to your balance.`);
  };

  const toggleSavedVocab = (vocabId: string) => {
    setStats((prev) => {
      const exists = prev.savedVocabIds.includes(vocabId);
      const savedVocabIds = exists
        ? prev.savedVocabIds.filter((id) => id !== vocabId)
        : [...prev.savedVocabIds, vocabId];
      return { ...prev, savedVocabIds };
    });
  };

  const handleUpdateDailyCommitment = (minutes: DailyCommitmentMinutes, proficiency: ProficiencyLevel) => {
    const updated = buildPersonalizedPlan({
      proficiency,
      dailyMinutes: minutes,
      motivation: plan.motivation,
      scriptPreference: showScript ? 'kanglish_plus_script' : 'kanglish_only',
    });
    setPlan(updated);
    showNotification(
      `Updated study plan: ${minutes} mins/day (${updated.dailyXpGoal} XP daily goal).`
    );
  };

  if (appView === 'landing') {
    return (
      <LandingPage
        onStartOnboarding={() => {
          setAuthInitialMode('login');
          setAppView('auth');
        }}
        onOpenAuth={(mode) => {
          setAuthInitialMode(mode);
          setAppView('auth');
        }}
      />
    );
  }

  if (appView === 'auth') {
    return (
      <AuthView
        initialMode={authInitialMode}
        pendingPlan={plan}
        currentStats={stats}
        onSuccess={(authedUser, serverPlan, serverStats) => {
          setUser(authedUser);
          if (serverPlan) setPlan(serverPlan);
          if (serverStats) {
            setStats(serverStats);
          } else {
            setStats(createFreshUserStats(getTodayIso()));
          }
          setAppView('onboarding');
        }}
        onBack={() => setAppView('landing')}
      />
    );
  }

  if (appView === 'onboarding') {
    return (
      <OnboardingWizard
        userName={user?.name}
        initialInput={{
          proficiency: plan.proficiency,
          dailyMinutes: plan.dailyMinutes,
          motivation: plan.motivation,
          scriptPreference: showScript ? 'kanglish_plus_script' : 'kanglish_only',
        }}
        onCompletePlan={(newPlan) => {
          setPlan(newPlan);
          setShowScript(newPlan.scriptPreference === 'kanglish_plus_script');
          setAppView('dashboard');
          showNotification(
            `Namaskara${user ? `, ${user.name}` : ''}! Your prioritized ${newPlan.dailyMinutes} min/day Kannada plan is ready. Complete Lesson 1 to start your Day 1 streak!`
          );
        }}
        onBackToLanding={() => setAppView(user ? 'dashboard' : 'auth')}
      />
    );
  }

  const dailyGoalPercent = Math.min(100, Math.round((stats.todayXp / plan.dailyXpGoal) * 100));
  const dailyRingMetrics = calculateDailyGoalRingMetrics(stats.todayXp, plan.dailyXpGoal, 32);
  const timelineAttendance = calculateDaysSinceActive(stats.lastActiveDate, getTodayIso());
  const allLessons = LEARNING_UNITS.flatMap((u) => u.lessons);
  const completedLessonsCount = stats.completedLessonIds.length;

  const handleSaveDailyReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    setReminderFeedback(null);
    const targetEmail = (reminderEmail || user?.email || '').trim();
    if (!targetEmail) {
      setReminderFeedback({
        type: 'error',
        text: 'Please enter a valid email address to receive daily reminders.',
      });
      return;
    }

    setReminderSaving(true);
    try {
      const response = await fetch('/api/user/daily-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          name: user?.name || 'Kannada Learner',
          enabled: reminderAgreed,
          preferredTime: reminderTime,
          dailyXpGoal: plan.dailyXpGoal,
          todayXp: stats.todayXp,
          streakDays: stats.streakDays,
          trackName: plan.trackName,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setReminderFeedback({
          type: 'error',
          text: data.error || 'Could not update daily email notification preference.',
        });
      } else {
        setReminderFeedback({
          type: reminderAgreed ? 'success' : 'info',
          text: data.message,
        });
      }
    } catch {
      setReminderFeedback({
        type: reminderAgreed ? 'success' : 'info',
        text: reminderAgreed
          ? `Daily email reminder scheduled for ${reminderTime} (${targetEmail}).`
          : 'Daily email notifications paused.',
      });
    } finally {
      setReminderSaving(false);
    }
  };

  const filteredVocab = VOCABULARY_ITEMS.filter((item) => {
    const matchesCat =
      vocabCategory === 'All'
        ? true
        : vocabCategory === 'Saved'
          ? stats.savedVocabIds.includes(item.id)
          : item.category === vocabCategory;

    const q = vocabSearch.trim().toLowerCase();
    const matchesQuery =
      !q ||
      item.kanglish.toLowerCase().includes(q) ||
      item.english.toLowerCase().includes(q) ||
      item.kannadaScript.includes(q) ||
      item.usageContext.toLowerCase().includes(q);

    return matchesCat && matchesQuery;
  });

  const handleAwardActivityXp = (xpAmount: number, reason: string) => {
    const todayIso = getTodayIso();
    setStats((prev) => {
      const nextStreak = prev.streakDays === 0 ? 1 : prev.streakDays;
      return {
        ...prev,
        xp: prev.xp + xpAmount,
        todayXp: prev.todayXp + xpAmount,
        streakDays: nextStreak,
        lastActiveDate: todayIso,
      };
    });
    setToastBanner(`+${xpAmount} XP earned! ${reason}`);
  };

  const navItems: {
    id: DashboardTab;
    label: string;
    badge?: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'learn', label: 'Learn Path', badge: `${completedLessonsCount}/${allLessons.length}`, icon: BookOpen },
    { id: 'situations', label: 'Everyday Situations', badge: `${EVERYDAY_SITUATIONS.length}`, icon: Compass },
    { id: 'arcade_game', label: 'Auto Phrase Dash Game', badge: '+60 XP', icon: Gamepad2 },
    { id: 'live_voice', label: 'Live Voice Tutor', badge: 'LIVE', icon: Radio },
    { id: 'ai_chat', label: 'Gemini AI Chatbot', badge: 'AI', icon: Bot },
    { id: 'phrasebook', label: 'Phrasebook', badge: `${VOCABULARY_ITEMS.length}`, icon: Bookmark },
    { id: 'plan', label: 'Streak & Study Plan', badge: `${stats.streakDays}d`, icon: Flame },
    { id: 'xp_store', label: 'XP Rewards Store', badge: `${stats.xp} XP`, icon: Gift },
    { id: 'profile', label: 'My Profile & Security', icon: User },
  ];

  // Full-Viewport 2D Arcade Game Shell (Never renders website navbars or footers while active)
  if (activeTab === 'arcade_game') {
    return (
      <KannadaArcadeGame
        showScript={showScript}
        onCompleteGame={(xpEarned, finalScore) => {
          handleAwardActivityXp(
            xpEarned,
            `Completed Indiranagar Auto Phrase Dash (Score: ${finalScore})!`
          );
          setActiveTab('learn');
        }}
        onExitGame={() => setActiveTab('learn')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col">
      {/* Lesson Player Full-Screen Modal */}
      {activeLesson && (
        <LessonPlayer
          lesson={activeLesson}
          showScript={showScript}
          onToggleScript={() => setShowScript((s) => !s)}
          onCompleteLesson={handleLessonCompleted}
          onClose={() => setActiveLesson(null)}
        />
      )}

      {/* Clean Sticky Top Bar with Left Hamburger / Sidebar Toggle & Right Circular Profile */}
      <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-md border-b border-stone-200 px-4 sm:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Mobile 3-Line Menu Trigger */}
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            aria-label="Open navigation menu"
            className="lg:hidden min-h-[40px] min-w-[40px] rounded-xl hover:bg-stone-100 flex items-center justify-center text-stone-800 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop Hide/Show Sidebar Toggle */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label={isSidebarOpen ? 'Hide sidebar navigation' : 'Show sidebar navigation'}
            className="hidden lg:flex min-h-[40px] px-2.5 py-1.5 rounded-xl hover:bg-stone-100 items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 cursor-pointer transition-colors"
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
            <span>{isSidebarOpen ? 'Hide Menu' : 'Menu'}</span>
          </button>

          <button
            type="button"
            onClick={() => selectDashboardTab('learn')}
            className="font-display text-lg font-bold tracking-tight text-stone-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Namma Kannada
          </button>
        </div>

        {/* Right Zone: Honest Streak, Spendable XP Pill, and Dedicated Circular Profile Avatar */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          {stats.doubleXpActive && (
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-amber-800">
              <Zap className="w-3.5 h-3.5" />
              <span>2x XP Active</span>
            </span>
          )}

          <button
            type="button"
            onClick={() => selectDashboardTab('plan')}
            aria-label={`Current streak: ${stats.streakDays} days`}
            className={`min-h-[38px] px-2.5 py-1 rounded-xl border text-xs font-mono-tabular font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
              stats.streakDays > 0
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-stone-100 border-stone-200 text-stone-600'
            }`}
          >
            <Flame
              className={`w-4 h-4 ${
                stats.streakDays > 0 ? 'text-amber-600 fill-amber-500' : 'text-stone-400'
              }`}
            />
            <span>{stats.streakDays}d</span>
          </button>

          <button
            type="button"
            onClick={() => selectDashboardTab('xp_store')}
            aria-label={`Spendable XP: ${stats.xp} XP. Click to open XP Store`}
            className="min-h-[38px] px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-stone-900 text-xs font-mono-tabular font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Award className="w-4 h-4 text-amber-700" />
            <span>{stats.xp} XP</span>
          </button>

          {/* Dedicated Circular Profile Button */}
          <button
            type="button"
            onClick={() => selectDashboardTab('profile')}
            aria-label="Open My Profile and Account Settings"
            className={`w-9 h-9 rounded-full font-display text-xs font-bold flex items-center justify-center transition-transform active:scale-95 cursor-pointer border-2 ${
              activeTab === 'profile'
                ? 'bg-stone-900 text-white border-amber-600'
                : 'bg-amber-700 hover:bg-amber-800 text-white border-amber-100'
            }`}
          >
            {getInitials(user?.name)}
          </button>
        </div>
      </header>

      {/* Mobile Slide-Over Navigation Drawer (Three-Line Menu) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setIsMobileDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside
            aria-label="Mobile sidebar navigation"
            className="relative z-10 w-72 max-w-[82vw] bg-white h-full border-r border-stone-200 flex flex-col justify-between p-5 overflow-y-auto"
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <span className="font-display text-lg font-bold text-stone-900">Namma Kannada</span>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  aria-label="Close navigation menu"
                  className="min-h-[40px] min-w-[40px] rounded-xl hover:bg-stone-100 flex items-center justify-center text-stone-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Mini Summary inside Drawer */}
              <button
                type="button"
                onClick={() => selectDashboardTab('profile')}
                className="w-full mt-4 p-3.5 rounded-2xl bg-[#FAF8F5] border border-stone-200 flex items-center gap-3 text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-amber-700 text-white font-display text-sm font-bold flex items-center justify-center shrink-0">
                  {getInitials(user?.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-stone-900 truncate">
                    {user?.name || 'Kannada Learner'}
                  </p>
                  <p className="text-xs text-stone-500 truncate">
                    {stats.streakDays}d Streak · {stats.xp} XP
                  </p>
                </div>
              </button>

              <nav className="mt-5 space-y-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectDashboardTab(item.id)}
                      className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                        active
                          ? 'bg-stone-900 text-white'
                          : 'text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <span className="inline-flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </span>
                      {item.badge && (
                        <span
                          className={`font-mono-tabular text-[11px] ${
                            active ? 'text-amber-300' : 'text-stone-400'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
              <span>Show ಕನ್ನಡ Script</span>
              <button
                type="button"
                onClick={() => setShowScript((s) => !s)}
                className="min-h-[36px] px-3 py-1 rounded-lg bg-stone-100 font-semibold text-stone-800 cursor-pointer"
              >
                {showScript ? 'ON' : 'OFF'}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Body with Hideable Desktop Sidebar + Clean Center Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Hideable Sidebar */}
        {isSidebarOpen && (
          <aside
            aria-label="Desktop sidebar navigation"
            className="hidden lg:flex w-64 shrink-0 border-r border-stone-200/80 bg-[#FAF8F5] p-5 flex-col justify-between sticky top-14 h-[calc(100vh-3.5rem)]"
          >
            <div className="space-y-6">
              {/* Circular Profile Trigger Card inside Sidebar */}
              <button
                type="button"
                onClick={() => selectDashboardTab('profile')}
                className="w-full p-3.5 rounded-2xl bg-white border border-stone-200 hover:border-amber-600 transition-colors flex items-center gap-3 text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-amber-700 text-white font-display text-sm font-bold flex items-center justify-center shrink-0">
                  {getInitials(user?.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-stone-900 truncate">
                    {user?.name || 'Kannada Learner'}
                  </p>
                  <p className="text-[11px] text-stone-500 truncate">
                    View Profile &amp; Security
                  </p>
                </div>
              </button>

              {/* Navigation Links */}
              <nav className="space-y-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectDashboardTab(item.id)}
                      className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                        active
                          ? 'bg-stone-900 text-white'
                          : 'text-stone-700 hover:bg-stone-200/60'
                      }`}
                    >
                      <span className="inline-flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </span>
                      {item.badge && (
                        <span
                          className={`font-mono-tabular text-[11px] ${
                            active ? 'text-amber-300' : 'text-stone-500'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Script Toggle inside Sidebar */}
            <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-700">ಕನ್ನಡ Script Hints</span>
                <button
                  type="button"
                  onClick={() => setShowScript((s) => !s)}
                  className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                    showScript ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-700'
                  }`}
                >
                  {showScript ? 'ON' : 'OFF'}
                </button>
              </div>
              <p className="text-[11px] text-stone-500">
                Daily Target: {stats.todayXp} / {plan.dailyXpGoal} XP ({dailyGoalPercent}%)
              </p>
            </div>
          </aside>
        )}

        {/* Clean Focused Main Content Stage */}
        <main className="flex-1 min-w-0 px-4 sm:px-8 py-6 sm:py-8 max-w-4xl mx-auto">
          {/* Toast Notification */}
          {toastBanner && (
            <div
              role="status"
              className="mb-6 p-3.5 rounded-xl bg-emerald-900 text-white text-xs font-medium flex items-center justify-between gap-4"
            >
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>{toastBanner}</span>
              </span>
              <button
                type="button"
                onClick={() => setToastBanner(null)}
                className="text-emerald-200 hover:text-white font-semibold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* TAB 1: CLEAN LEARN PATH & JOURNEY TIMELINE */}
          {activeTab === 'learn' && (
            <div className="space-y-8">
              {/* Journey Timeline & Activity Status Card */}
              <section className="bg-white border border-stone-200 rounded-2xl p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-800">
                      <Clock className="w-4 h-4" />
                      <span>{timelineAttendance.statusLabel}</span>
                    </div>
                    <h1 className="font-display text-2xl font-bold text-stone-900 mt-1">
                      {plan.trackName}
                    </h1>
                    <p className="text-xs text-stone-600 mt-0.5">
                      {stats.streakDays === 0
                        ? 'You registered today—complete your first 4-minute lesson below to earn your Day 1 streak!'
                        : `You are on a ${stats.streakDays}-day streak · Today's progress: ${stats.todayXp} / ${plan.dailyXpGoal} XP`}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleStartNextLesson}
                    className="min-h-[48px] px-5 py-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>
                      {stats.completedLessonIds.length === 0
                        ? 'Start First Lesson (Day 1)'
                        : 'Continue Next Lesson'}
                    </span>
                  </button>
                </div>

                {/* Horizontal Journey Milestone Timeline */}
                <div className="pt-4 border-t border-stone-100">
                  <div className="flex items-center justify-between text-xs text-stone-500 mb-3">
                    <span>Your Progression Timeline</span>
                    <span className="font-mono-tabular">
                      {completedLessonsCount} of {allLessons.length} lessons completed
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      {
                        stage: 'Day 1',
                        title: 'First Words',
                        done: stats.streakDays >= 1 || completedLessonsCount >= 1,
                        current: stats.streakDays === 0 && completedLessonsCount === 0,
                      },
                      {
                        stage: 'Week 1',
                        title: 'Polite Greetings',
                        done: completedLessonsCount >= 3,
                        current: completedLessonsCount > 0 && completedLessonsCount < 3,
                      },
                      {
                        stage: 'Week 2',
                        title: 'Auto & Commute',
                        done: completedLessonsCount >= 5,
                        current: completedLessonsCount >= 3 && completedLessonsCount < 5,
                      },
                      {
                        stage: 'Week 4',
                        title: 'Bengaluru Fluency',
                        done: completedLessonsCount >= allLessons.length,
                        current:
                          completedLessonsCount >= 5 &&
                          completedLessonsCount < allLessons.length,
                      },
                    ].map((node) => (
                      <div
                        key={node.stage}
                        className={`p-3 rounded-xl border text-xs ${
                          node.done
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                            : node.current
                              ? 'bg-amber-50 border-amber-500 text-stone-900'
                              : 'bg-[#FAF8F5] border-stone-200 text-stone-500'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono-tabular font-bold">
                          <span>{node.stage}</span>
                          {node.done && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />}
                          {node.current && <span className="text-[10px] text-amber-800">NOW</span>}
                        </div>
                        <p className="font-semibold mt-0.5">{node.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Interactive Game, Live Voice & Gemini AI Practice Hub */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => selectDashboardTab('arcade_game')}
                  className="p-5 rounded-2xl bg-stone-900 text-white border border-stone-800 hover:border-amber-500 text-left flex flex-col justify-between gap-3 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between text-xs text-amber-400 font-semibold">
                    <span className="inline-flex items-center gap-1.5">
                      <Gamepad2 className="w-4 h-4" />
                      <span>60fps Arcade Game</span>
                    </span>
                    <span className="font-mono-tabular">+60 XP</span>
                  </div>
                  <div>
                    <p className="font-display text-base font-bold">Auto Phrase Dash</p>
                    <p className="text-xs text-stone-300 mt-1">
                      Steer your Bengaluru auto rickshaw into spoken Kannada phrase gates on 100ft Road.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => selectDashboardTab('live_voice')}
                  className="p-5 rounded-2xl bg-white border border-stone-200 hover:border-amber-600 text-left flex flex-col justify-between gap-3 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between text-xs text-amber-800 font-semibold">
                    <span className="inline-flex items-center gap-1.5">
                      <Radio className="w-4 h-4" />
                      <span>Gemini 3.8 Live Voice</span>
                    </span>
                    <span className="font-mono-tabular">+25 XP</span>
                  </div>
                  <div>
                    <p className="font-display text-base font-bold text-stone-900">
                      Real-Time Voice Tutor
                    </p>
                    <p className="text-xs text-stone-600 mt-1">
                      Have a low-latency spoken Kannada conversation with Ramesh Anna or Shankaraiah.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => selectDashboardTab('ai_chat')}
                  className="p-5 rounded-2xl bg-white border border-stone-200 hover:border-amber-600 text-left flex flex-col justify-between gap-3 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between text-xs text-amber-800 font-semibold">
                    <span className="inline-flex items-center gap-1.5">
                      <Bot className="w-4 h-4" />
                      <span>Multi-Model AI Coach</span>
                    </span>
                    <span className="font-mono-tabular">+15 XP</span>
                  </div>
                  <div>
                    <p className="font-display text-base font-bold text-stone-900">
                      Gemini Kannada Chatbot
                    </p>
                    <p className="text-xs text-stone-600 mt-1">
                      Practice multi-turn dialogues &amp; suffix breakdowns with Flash, Lite, or Argon.
                    </p>
                  </div>
                </button>
              </section>

              {/* Vertical Connected Learning Path Timeline */}
              <div className="space-y-8">
                {LEARNING_UNITS.map((unit) => {
                  const isRecommended = unit.id === plan.recommendedUnitId;
                  return (
                    <section
                      key={unit.id}
                      className="bg-white border border-stone-200 rounded-2xl p-6"
                    >
                      <div className="pb-4 border-b border-stone-100">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-amber-800 font-semibold">
                          <span>Unit {unit.number}</span>
                          <span aria-hidden="true">·</span>
                          <span>{unit.badgeLabel}</span>
                          {isRecommended && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-emerald-800">Prioritized for Your Plan</span>
                            </>
                          )}
                        </div>
                        <h2 className="font-display text-xl font-bold text-stone-900 mt-1">
                          {unit.title}
                        </h2>
                        <p className="text-xs text-stone-600 mt-1">{unit.description}</p>
                      </div>

                      {/* Timeline Nodes for Lessons */}
                      <div className="mt-5 relative pl-6 sm:pl-8 space-y-4 before:content-[''] before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-stone-200">
                        {unit.lessons.map((lesson) => {
                          const completed = stats.completedLessonIds.includes(lesson.id);
                          return (
                            <div key={lesson.id} className="relative">
                              {/* Timeline Node Circle */}
                              <div
                                className={`absolute -left-6 sm:-left-8 top-4 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  completed
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'bg-white border-amber-600'
                                }`}
                              >
                                {completed && <CheckCircle2 className="w-3 h-3" />}
                              </div>

                              <div
                                className={`p-4 sm:p-5 rounded-2xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                                  completed
                                    ? 'bg-emerald-50/40 border-emerald-200'
                                    : 'bg-[#FAF8F5] border-stone-200 hover:border-amber-600'
                                }`}
                              >
                                <div>
                                  <div className="flex items-center gap-2 text-xs text-stone-500 font-mono-tabular">
                                    <span className="font-bold text-stone-800">
                                      Lesson {lesson.number}
                                    </span>
                                    <span aria-hidden="true">·</span>
                                    <span>{lesson.durationMinutes} mins</span>
                                    <span aria-hidden="true">·</span>
                                    <span className="text-amber-800 font-semibold">
                                      +{lesson.xpReward} XP
                                    </span>
                                  </div>
                                  <h3 className="font-display text-base font-bold text-stone-900 mt-0.5">
                                    {lesson.title}
                                  </h3>
                                  <p className="text-xs text-stone-600 mt-0.5">{lesson.subtitle}</p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setActiveLesson(lesson)}
                                  className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                                    completed
                                      ? 'bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-50'
                                      : 'bg-stone-900 hover:bg-stone-800 text-white'
                                  }`}
                                >
                                  <Play className="w-3.5 h-3.5" />
                                  <span>{completed ? 'Practice Again' : 'Start Lesson'}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: EVERYDAY SITUATIONS */}
          {activeTab === 'situations' && (
            <div>
              {activeSituation ? (
                <SituationSimulator
                  situation={activeSituation}
                  showScript={showScript}
                  onCompleteSituation={handleSituationCompleted}
                  onBack={() => setActiveSituation(null)}
                />
              ) : (
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-semibold text-amber-800">
                      Interactive Roleplay Scenarios
                    </p>
                    <h1 className="font-display text-2xl font-bold text-stone-900 mt-0.5">
                      Real-Life Bengaluru Situations
                    </h1>
                    <p className="text-xs text-stone-600 mt-1">
                      Step into everyday conversations with auto drivers, Darshini cashiers, delivery partners, and
                      market vendors.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {EVERYDAY_SITUATIONS.map((sit) => {
                      const isDone = stats.completedSituationIds.includes(sit.id);
                      return (
                        <div
                          key={sit.id}
                          className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col justify-between gap-4"
                        >
                          <div>
                            <SituationSceneIllustration type={sit.illustrationType} />
                            <div className="mt-4 flex items-center justify-between text-xs text-stone-500">
                              <span>{sit.difficulty}</span>
                              <span className="font-mono-tabular text-amber-800 font-semibold">
                                +{sit.xpReward} XP
                              </span>
                            </div>
                            <h2 className="font-display text-lg font-bold text-stone-900 mt-1">
                              {sit.title}
                            </h2>
                            <p className="text-xs text-stone-500 mt-0.5">{sit.locationTag}</p>
                            <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                              {sit.summary}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => setActiveSituation(sit)}
                            className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>{isDone ? 'Replay Roleplay' : 'Practice Conversation'}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PHRASEBOOK & VOCABULARY */}
          {activeTab === 'phrasebook' && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-amber-800">
                  Audio Dictionary &amp; Pocket Reference
                </p>
                <h1 className="font-display text-2xl font-bold text-stone-900 mt-0.5">
                  Everyday Kannada Phrasebook
                </h1>
                <p className="text-xs text-stone-600 mt-1">
                  Tap any phrase to hear the pronunciation or bookmark it to your personal review deck.
                </p>
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-4">
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="search"
                    value={vocabSearch}
                    onChange={(e) => setVocabSearch(e.target.value)}
                    placeholder="Search in English, Kanglish (e.g., meter, coffee, oota)..."
                    aria-label="Search phrasebook"
                    className="w-full min-h-[44px] pl-10 pr-4 py-2 text-sm bg-[#FAF8F5] border border-stone-200 rounded-xl focus:outline-none focus:border-amber-700"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {[
                    'All',
                    'Saved',
                    'Greetings',
                    'Commute',
                    'Food & Cafe',
                    'Shopping & Numbers',
                    'Work & Social',
                    'Emergency',
                  ].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setVocabCategory(cat)}
                      className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                        vocabCategory === cat
                          ? 'bg-stone-900 text-white'
                          : 'bg-stone-100 text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {cat === 'Saved' ? `Saved (${stats.savedVocabIds.length})` : cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {filteredVocab.map((item) => {
                  const isSaved = stats.savedVocabIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl bg-white border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
                          <span>{item.category}</span>
                          <span aria-hidden="true">·</span>
                          <span>Literal: &ldquo;{item.literalMeaning}&rdquo;</span>
                        </div>
                        <p className="font-display text-lg font-bold text-stone-900">
                          {item.kanglish}
                        </p>
                        {showScript && (
                          <p className="text-sm text-amber-800 font-medium mt-0.5">
                            {item.kannadaScript}
                          </p>
                        )}
                        <p className="text-sm font-medium text-stone-700 mt-1">{item.english}</p>
                        <p className="text-xs text-stone-500 mt-1">{item.usageContext}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => speakKannadaPhrase(item.kanglish, item.kannadaScript)}
                          aria-label={`Pronounce ${item.kanglish}`}
                          className="min-h-[44px] px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Volume2 className="w-4 h-4" />
                          <span>Audio</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSavedVocab(item.id)}
                          aria-label={isSaved ? 'Remove bookmark' : 'Bookmark phrase'}
                          className={`min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl border text-xs font-semibold inline-flex items-center justify-center gap-1 cursor-pointer ${
                            isSaved
                              ? 'bg-stone-900 text-white border-stone-900'
                              : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                          }`}
                        >
                          <Bookmark className="w-4 h-4" />
                          <span>{isSaved ? 'Saved' : 'Save'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: STREAK & STUDY PLAN */}
          {activeTab === 'plan' && (
            <div className="space-y-6">
              {/* Honest Streak Status, Small Circular Daily XP Progress Ring & 7-Day Tracker */}
              <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  <div>
                    <p className="text-xs font-semibold text-amber-800">
                      Transparent Daily Habit Tracker
                    </p>
                    <h2 className="font-display text-2xl font-bold text-stone-900 font-mono-tabular mt-0.5">
                      {stats.streakDays} {stats.streakDays === 1 ? 'Day' : 'Days'} Streak
                    </h2>
                    <p className="text-xs text-stone-600 mt-1">
                      {stats.streakDays === 0
                        ? 'You registered today! Complete 1 lesson to ignite your Day 1 streak.'
                        : `Active since ${stats.joinedDate || 'today'} · Last practiced ${stats.lastActiveDate}.`}
                    </p>
                  </div>

                  {/* Right Cluster: Circular Daily XP Progress Ring + Streak Flame */}
                  <div className="flex items-center gap-4 self-start sm:self-center">
                    {/* Small Circular Daily XP Goal Progress Ring */}
                    <div
                      className="flex items-center gap-3.5 px-4 py-2.5 rounded-2xl bg-[#FAF8F5] border border-stone-200"
                      aria-label={`Daily XP Goal Progress: ${dailyRingMetrics.percentage}%`}
                    >
                      <div className="relative w-18 h-18 flex items-center justify-center shrink-0">
                        <svg className="w-18 h-18 -rotate-90" viewBox="0 0 80 80">
                          <circle
                            cx="40"
                            cy="40"
                            r={dailyRingMetrics.radius}
                            fill="transparent"
                            stroke="#E7E5E4"
                            strokeWidth="7"
                          />
                          <circle
                            cx="40"
                            cy="40"
                            r={dailyRingMetrics.radius}
                            fill="transparent"
                            stroke={dailyRingMetrics.isGoalComplete ? '#059669' : '#D97706'}
                            strokeWidth="7"
                            strokeLinecap="round"
                            strokeDasharray={dailyRingMetrics.circumference}
                            strokeDashoffset={dailyRingMetrics.strokeDashoffset}
                            className="transition-all duration-500"
                          />
                        </svg>
                        <span className="absolute font-mono-tabular text-xs font-bold text-stone-900">
                          {dailyRingMetrics.percentage}%
                        </span>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-stone-900">Daily XP Goal</p>
                        <p className="font-mono-tabular text-xs font-semibold text-amber-800 mt-0.5">
                          {dailyRingMetrics.todayXp} / {dailyRingMetrics.dailyXpGoal} XP
                        </p>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          {dailyRingMetrics.isGoalComplete
                            ? 'Daily goal achieved!'
                            : `${dailyRingMetrics.remainingXp} XP left today`}
                        </p>
                      </div>
                    </div>

                    <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Flame
                        className={`w-7 h-7 ${
                          stats.streakDays > 0 ? 'fill-amber-500 text-amber-600' : 'text-stone-400'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 text-center">
                  {['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'].map(
                    (label, idx) => {
                      const active = idx < stats.streakDays;
                      return (
                        <div
                          key={label}
                          className={`py-2.5 rounded-xl text-xs font-bold font-mono-tabular ${
                            active
                              ? 'bg-amber-600 text-white'
                              : 'bg-stone-100 text-stone-400'
                          }`}
                        >
                          {label}
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Streak Trends Recharts Bar Chart Card (7-Day Activity Completion & Consistency) */}
              <StreakTrendsCard
                stats={stats}
                dailyXpGoal={plan.dailyXpGoal}
                todayIso={getTodayIso()}
              />

              {/* Prioritized Plan Settings */}
              <div className="bg-white border border-stone-200 rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-100">
                  <div>
                    <p className="text-xs font-semibold text-amber-800">
                      Prioritized Learning Schedule
                    </p>
                    <h2 className="font-display text-xl font-bold text-stone-900 mt-0.5">
                      {plan.trackName}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAppView('onboarding')}
                    className="min-h-[44px] px-4 py-2 rounded-xl border border-stone-300 hover:bg-stone-100 text-xs font-semibold text-stone-800 inline-flex items-center gap-2 self-start cursor-pointer"
                  >
                    <Sliders className="w-4 h-4" />
                    <span>Re-Prioritize Plan</span>
                  </button>
                </div>

                <div className="mt-5">
                  <p className="text-xs font-semibold text-stone-700 mb-3">
                    Adjust Daily Time Commitment
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {([5, 10, 15, 25] as DailyCommitmentMinutes[]).map((mins) => {
                      const active = plan.dailyMinutes === mins;
                      return (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => handleUpdateDailyCommitment(mins, plan.proficiency)}
                          className={`min-h-[48px] p-3 rounded-xl border text-left cursor-pointer transition-colors ${
                            active
                              ? 'bg-amber-50 border-amber-700 text-stone-900'
                              : 'bg-[#FAF8F5] border-stone-200 text-stone-700 hover:border-stone-300'
                          }`}
                        >
                          <p className="font-display text-sm font-bold font-mono-tabular">
                            {mins} mins/day
                          </p>
                          <p className="text-xs text-stone-500 font-mono-tabular">
                            {mins * 10} XP goal
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Opt-In Daily Email Notification Card (SMTP Study & Streak Reminder) */}
              <form
                onSubmit={handleSaveDailyReminder}
                className="bg-white border border-stone-200 rounded-2xl p-6 space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                      <Bell className="w-4 h-4" />
                      <span>SMTP Daily Study &amp; Streak Reminder</span>
                    </div>
                    <h2 className="font-display text-xl font-bold text-stone-900 mt-0.5">
                      Daily Email Notification
                    </h2>
                    <p className="text-xs text-stone-600 mt-0.5">
                      Opt in to receive a daily email with your streak status, daily XP goal progress, and a spoken Kannada phrase of the day.
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-semibold self-start sm:self-center ${
                      reminderAgreed
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {reminderAgreed ? `Active · ${reminderTime}` : 'Opt-In Required'}
                  </span>
                </div>

                {/* User Consent / Agreement Checkbox */}
                <label className="flex items-start gap-3 p-4 rounded-xl bg-[#FAF8F5] border border-stone-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reminderAgreed}
                    onChange={(e) => setReminderAgreed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-amber-700 rounded cursor-pointer"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-stone-900 block">
                      I agree to receive a daily Kannada study &amp; streak reminder email
                    </span>
                    <span className="text-xs text-stone-500 block mt-0.5">
                      We will only send one reminder per day at your chosen time via our SMTP relay, and you can uncheck this anytime.
                    </span>
                  </div>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="daily-reminder-email"
                      className="block text-xs font-semibold text-stone-700 mb-1.5"
                    >
                      Delivery Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      <input
                        id="daily-reminder-email"
                        type="email"
                        value={reminderEmail}
                        onChange={(e) => setReminderEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full min-h-[44px] pl-10 pr-4 py-2 text-sm bg-[#FAF8F5] border border-stone-300 rounded-xl focus:outline-none focus:border-amber-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="daily-reminder-time"
                      className="block text-xs font-semibold text-stone-700 mb-1.5"
                    >
                      Preferred Daily Reminder Time
                    </label>
                    <select
                      id="daily-reminder-time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-[#FAF8F5] border border-stone-300 rounded-xl focus:outline-none focus:border-amber-700"
                    >
                      <option value="08:00 AM">08:00 AM — Morning Commute Prep</option>
                      <option value="01:00 PM">01:00 PM — Lunchtime Practice</option>
                      <option value="07:30 PM">07:30 PM — Evening Streak Check</option>
                      <option value="09:30 PM">09:30 PM — Late Streak Saver Alert</option>
                    </select>
                  </div>
                </div>

                {reminderFeedback && (
                  <div
                    role="status"
                    className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
                      reminderFeedback.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : reminderFeedback.type === 'error'
                          ? 'bg-red-50 border-red-200 text-red-900'
                          : 'bg-stone-100 border-stone-200 text-stone-700'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{reminderFeedback.text}</span>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={reminderSaving}
                    className="min-h-[44px] px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    <span>
                      {reminderSaving
                        ? 'Saving & Dispatching SMTP...'
                        : reminderAgreed
                          ? 'Save & Send Daily Reminder Confirmation'
                          : 'Save Notification Preference'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: GEMINI LIVE VOICE CONVERSATIONS (gemini-3.8-live) */}
          {activeTab === 'live_voice' && (
            <GeminiLiveVoiceTutor
              showScript={showScript}
              onAwardXp={handleAwardActivityXp}
            />
          )}

          {/* TAB: MULTI-TURN GEMINI CHATBOT (gemini-3.8-flash / gemini-3.1-flash-lite / gemini-4-argon) */}
          {activeTab === 'ai_chat' && (
            <GeminiChatTutor
              showScript={showScript}
              onAwardXp={handleAwardActivityXp}
            />
          )}

          {/* TAB 5 & 6: XP REWARDS STORE OR DEDICATED PROFILE & SECURITY */}
          {(activeTab === 'xp_store' || activeTab === 'profile') && (
            <ProfileAndXpView
              key={activeTab}
              user={user}
              stats={stats}
              plan={plan}
              showScript={showScript}
              initialSection={activeTab === 'xp_store' ? 'xp_store' : 'profile'}
              onUpdateUser={(updatedUser) => setUser(updatedUser)}
              onUpdateStats={(updatedStats) => setStats(updatedStats)}
              onSignOut={() => {
                setUser(null);
                setAppView('landing');
              }}
              onStartLessonClick={handleStartNextLesson}
            />
          )}
        </main>
      </div>
    </div>
  );
}
