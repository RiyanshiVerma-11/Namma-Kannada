import React, { useState } from 'react';
import {
  Flame,
  Award,
  ShieldCheck,
  Zap,
  Lock,
  Unlock,
  Volume2,
  Mail,
  KeyRound,
  User,
  CheckCircle2,
  AlertCircle,
  LogOut,
} from 'lucide-react';
import type { AuthenticatedUser } from './AuthView';
import {
  spendXpOnReward,
  validateEmailFormat,
  type PersonalizedPlan,
  type UserProgressStats,
} from '../utils/learningEngine';
import { speakKannadaPhrase } from '../utils/speech';

interface ProfileAndXpViewProps {
  user: AuthenticatedUser | null;
  stats: UserProgressStats;
  plan: PersonalizedPlan;
  showScript: boolean;
  initialSection?: 'profile' | 'xp_store';
  onUpdateUser: (updated: AuthenticatedUser) => void;
  onUpdateStats: (updated: UserProgressStats) => void;
  onSignOut: () => void;
  onStartLessonClick: () => void;
}

export interface XpRewardItem {
  id: string;
  title: string;
  cost: number;
  category: 'Power-Up' | 'Cultural Phrase Pack';
  description: string;
  unlockedPhrases?: {
    kanglish: string;
    kannadaScript: string;
    english: string;
  }[];
}

export const XP_REWARDS_CATALOG: XpRewardItem[] = [
  {
    id: 'double_xp',
    title: '2x XP Boost (Next Lesson)',
    cost: 40,
    category: 'Power-Up',
    description:
      'Activate before starting a lesson to earn double XP points on completion and hit your daily goal twice as fast.',
  },
  {
    id: 'streak_freeze',
    title: 'Streak Freeze Shield',
    cost: 50,
    category: 'Power-Up',
    description:
      'Equips a protective shield that keeps your consecutive day streak intact if you miss a busy day of practice.',
  },
  {
    id: 'pack_auto_pro',
    title: 'Bengaluru Auto & Cab Insider Pack',
    cost: 50,
    category: 'Cultural Phrase Pack',
    description:
      'Unlock 3 street-smart negotiation & rain-traffic phrases used by lifelong Bengaluru locals.',
    unlockedPhrases: [
      {
        kanglish: 'Anna, meter meley iruvathu rupayi kodthini, banni.',
        kannadaScript: 'ಅಣ್ಣ, ಮೀಟರ್ ಮೇಲೆ ಇಪ್ಪತ್ತು ರೂಪಾಯಿ ಕೊಡ್ತೀನಿ, ಬನ್ನಿ.',
        english: 'Brother, I will give 20 rupees above the meter, please come.',
      },
      {
        kanglish: 'One-way ide, main road indha hogi.',
        kannadaScript: 'ಒನ್-ವೇ ಇದೆ, ಮೇನ್ ರೋಡ್ ಇಂದ ಹೋಗಿ.',
        english: 'It is a one-way street, go via the main road.',
      },
      {
        kanglish: 'Chillar illa anna, PhonePe maadthini.',
        kannadaScript: 'ಚಿಲ್ಲರೆ ಇಲ್ಲ ಅಣ್ಣ, ಫೋನ್‌ಪೇ ಮಾಡ್ತೀನಿ.',
        english: 'I do not have loose change brother, I will pay via UPI/PhonePe.',
      },
    ],
  },
  {
    id: 'pack_darshini',
    title: 'Darshini Secret Menu & By-Two Coffee Pack',
    cost: 75,
    category: 'Cultural Phrase Pack',
    description:
      'Unlock authentic Old Bengaluru cafe lingo—from ordering a "By-Two" shared filter coffee to crispy Benne Dose.',
    unlockedPhrases: [
      {
        kanglish: 'Anna, ondu strong by-two coffee kodi!',
        kannadaScript: 'ಅಣ್ಣ, ಒಂದು ಸ್ಟ್ರಾಂಗ್ ಬೈ-ಟು ಕಾಫಿ ಕೊಡಿ!',
        english: 'Brother, give one strong filter coffee split into two tumblers!',
      },
      {
        kanglish: 'Ondu Benne Masala Dose, chennagi roast maadi.',
        kannadaScript: 'ಒಂದು ಬೆಣ್ಣೆ ಮಸಾಲೆ ದೋಸೆ, ಚೆನ್ನಾಗಿ ರೋಸ್ಟ್ ಮಾಡಿ.',
        english: 'One Butter Masala Dosa, roast it nice and crispy.',
      },
      {
        kanglish: 'Gatti chutney matthu sambar swalpa haaki.',
        kannadaScript: 'ಗಟ್ಟಿ ಚಟ್ನಿ ಮತ್ತು ಸಾಂಬಾರ್ ಸ್ವಲ್ಪ ಹಾಕಿ.',
        english: 'Please serve a little thick coconut chutney and sambar.',
      },
    ],
  },
];

export function getInitials(name?: string): string {
  if (!name) return 'NK';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProfileAndXpView({
  user,
  stats,
  plan,
  showScript,
  initialSection = 'profile',
  onUpdateUser,
  onUpdateStats,
  onSignOut,
  onStartLessonClick,
}: ProfileAndXpViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'xp_store'>(initialSection);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleSpendReward = (reward: XpRewardItem) => {
    setStatusMsg(null);
    const result = spendXpOnReward(stats, reward.id, reward.cost);
    if (!result.success) {
      setStatusMsg({ type: 'error', text: result.error || 'Could not unlock reward.' });
      return;
    }
    onUpdateStats(result.updatedStats);
    setStatusMsg({
      type: 'success',
      text: `Unlocked "${reward.title}" for ${reward.cost} XP! Remaining balance: ${result.updatedStats.xp} XP.`,
    });
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (editName.trim().length < 2) {
      setStatusMsg({ type: 'error', text: 'Please enter a valid full name (at least 2 characters).' });
      return;
    }
    if (!validateEmailFormat(editEmail)) {
      setStatusMsg({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    setSavingProfile(true);
    try {
      const response = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentEmail: user?.email,
          newEmail: editEmail.trim().toLowerCase(),
          newName: editName.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setStatusMsg({ type: 'error', text: data.error || 'Could not update profile.' });
      } else {
        onUpdateUser(data.user);
        setStatusMsg({
          type: 'success',
          text: data.message || 'Your name and email address have been updated!',
        });
      }
    } catch {
      // Update locally if guest
      onUpdateUser({
        id: user?.id || 'usr-local',
        name: editName.trim(),
        email: editEmail.trim().toLowerCase(),
      });
      setStatusMsg({ type: 'success', text: 'Profile updated successfully.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (newPassword.trim().length < 6) {
      setStatusMsg({
        type: 'error',
        text: 'Your new password must be at least 6 characters long.',
      });
      return;
    }

    setSavingPassword(true);
    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user?.email,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setStatusMsg({ type: 'error', text: data.error || 'Could not update password.' });
      } else {
        setCurrentPassword('');
        setNewPassword('');
        setStatusMsg({
          type: 'success',
          text: 'Your account password has been changed successfully.',
        });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Network error while updating password.' });
    } finally {
      setSavingPassword(false);
    }
  };

  const unlockedIds = stats.unlockedRewardIds || [];

  return (
    <div className="space-y-6">
      {/* Circular Profile Hero Card */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Large Circular Avatar */}
            <div className="w-20 h-20 rounded-full bg-amber-700 text-white font-display text-2xl font-bold flex items-center justify-center shrink-0 border-4 border-amber-100 shadow-xs">
              {getInitials(user?.name)}
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-800">
                Verified Learner Profile · Joined {stats.joinedDate || 'Today'}
              </p>
              <h1 className="font-display text-2xl font-bold text-stone-900 mt-0.5">
                {user?.name || 'Kannada Learner'}
              </h1>
              <p className="text-xs text-stone-500 mt-0.5">{user?.email || 'Not signed in'}</p>
              <p className="text-xs text-stone-600 mt-1.5">
                Active Track: <strong className="text-stone-900">{plan.trackName}</strong> (
                {plan.dailyMinutes} mins/day)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onSignOut}
            className="min-h-[44px] px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-xs font-semibold text-stone-700 inline-flex items-center gap-2 self-start sm:self-center cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Transparent Streak & Spendable XP Metrics */}
        <div className="mt-6 pt-6 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-stone-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-500">Current Honest Streak</span>
              <Flame
                className={`w-4 h-4 ${
                  stats.streakDays > 0 ? 'text-amber-600 fill-amber-500' : 'text-stone-400'
                }`}
              />
            </div>
            <p className="font-display text-2xl font-bold text-stone-900 font-mono-tabular mt-1">
              {stats.streakDays} {stats.streakDays === 1 ? 'Day' : 'Days'}
            </p>
            <p className="text-xs text-stone-500 mt-1">
              {stats.streakDays === 0
                ? 'New account! Complete 1 lesson today to start Day 1.'
                : `Practiced on ${stats.lastActiveDate} · Keep going!`}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-stone-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-500">Spendable XP Balance</span>
              <Award className="w-4 h-4 text-amber-700" />
            </div>
            <p className="font-display text-2xl font-bold text-amber-800 font-mono-tabular mt-1">
              {stats.xp} XP
            </p>
            <p className="text-xs text-stone-500 mt-1">
              {stats.doubleXpActive
                ? '2x XP Boost Active for your next lesson!'
                : 'Spend XP below on Streak Freezes & Phrase Packs.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-stone-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-500">Streak Protection</span>
              <ShieldCheck
                className={`w-4 h-4 ${
                  stats.streakFreezeAvailable ? 'text-emerald-700' : 'text-stone-400'
                }`}
              />
            </div>
            <p className="font-display text-lg font-bold text-stone-900 mt-1">
              {stats.streakFreezeAvailable ? 'Shield Equipped' : 'No Shield Active'}
            </p>
            <p className="text-xs text-stone-500 mt-1">
              {stats.streakFreezeAvailable
                ? 'Your streak is safe for 1 missed day.'
                : 'Unlock a Streak Freeze in the XP Store for 50 XP.'}
            </p>
          </div>
        </div>
      </div>

      {/* Sub-navigation between Account Settings and XP Rewards Store */}
      <div className="flex items-center gap-2 p-1 bg-stone-200/70 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => {
            setActiveSubTab('xp_store');
            setStatusMsg(null);
          }}
          className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeSubTab === 'xp_store'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Spend XP · Rewards Store ({stats.xp} XP)
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveSubTab('profile');
            setStatusMsg(null);
          }}
          className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeSubTab === 'profile'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Email &amp; Password Settings
        </button>
      </div>

      {statusMsg && (
        <div
          role="alert"
          className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* SUB-TAB 1: XP REWARDS STORE */}
      {activeSubTab === 'xp_store' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-stone-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-amber-400 font-semibold">Make Every XP Point Count</p>
              <h2 className="font-display text-xl font-bold mt-0.5">
                Put Your Earned XP to Work
              </h2>
              <p className="text-xs text-stone-300 mt-1 max-w-xl">
                Complete lessons and everyday situations to earn XP, then spend your points here on Streak Freezes,
                2x XP Boosters, and insider Bengaluru conversation packs.
              </p>
            </div>
            <button
              type="button"
              onClick={onStartLessonClick}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs whitespace-nowrap shrink-0 cursor-pointer"
            >
              Earn +55 XP in Next Lesson
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {XP_REWARDS_CATALOG.map((item) => {
              const isEquippedPowerUp =
                (item.id === 'streak_freeze' && stats.streakFreezeAvailable) ||
                (item.id === 'double_xp' && stats.doubleXpActive);
              const isUnlockedPack =
                item.category === 'Cultural Phrase Pack' && unlockedIds.includes(item.id);
              const alreadyOwned = isEquippedPowerUp || isUnlockedPack;

              return (
                <div
                  key={item.id}
                  className="bg-white border border-stone-200 rounded-2xl p-6 flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                      <span>{item.category}</span>
                      <span className="font-mono-tabular font-bold text-amber-800">
                        {item.cost} XP
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-stone-900 flex items-center gap-2">
                      {item.id === 'double_xp' && <Zap className="w-4 h-4 text-amber-600" />}
                      {item.id === 'streak_freeze' && (
                        <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      )}
                      {item.category === 'Cultural Phrase Pack' &&
                        (isUnlockedPack ? (
                          <Unlock className="w-4 h-4 text-emerald-700" />
                        ) : (
                          <Lock className="w-4 h-4 text-stone-400" />
                        ))}
                      <span>{item.title}</span>
                    </h3>
                    <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                      {item.description}
                    </p>

                    {/* If Cultural Phrase Pack is unlocked, render the interactive audio phrases */}
                    {isUnlockedPack && item.unlockedPhrases && (
                      <div className="mt-4 pt-3 border-t border-stone-100 space-y-2.5">
                        <p className="text-xs font-semibold text-emerald-800">
                          Unlocked Bonus Phrases (Tap to Listen):
                        </p>
                        {item.unlockedPhrases.map((p) => (
                          <div
                            key={p.kanglish}
                            className="p-3 rounded-xl bg-[#FAF8F5] border border-stone-200/80 flex items-start justify-between gap-2"
                          >
                            <div>
                              <p className="text-xs font-bold text-stone-900">{p.kanglish}</p>
                              {showScript && (
                                <p className="text-[11px] text-amber-800">{p.kannadaScript}</p>
                              )}
                              <p className="text-[11px] text-stone-600 mt-0.5">{p.english}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => speakKannadaPhrase(p.kanglish, p.kannadaScript)}
                              aria-label={`Listen to ${p.kanglish}`}
                              className="min-h-[34px] px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 text-xs font-semibold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={alreadyOwned}
                    onClick={() => handleSpendReward(item)}
                    className={`w-full min-h-[44px] py-2.5 px-4 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      alreadyOwned
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-900 cursor-default'
                        : 'bg-stone-900 hover:bg-stone-800 text-white'
                    }`}
                  >
                    {alreadyOwned
                      ? isEquippedPowerUp
                        ? 'Active & Equipped'
                        : 'Unlocked in Your Library'
                      : `Redeem for ${item.cost} XP`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: EMAIL & PASSWORD SETTINGS */}
      {activeSubTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Update Name & Email Card */}
          <form
            onSubmit={handleUpdateProfile}
            className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4"
            noValidate
          >
            <div>
              <h2 className="font-display text-lg font-bold text-stone-900">
                Update Profile &amp; Email Address
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Changes sync immediately with your SMTP-verified learner account.
              </p>
            </div>

            <div>
              <label htmlFor="prof-name" className="block text-xs font-semibold text-stone-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="prof-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full min-h-[44px] pl-10 pr-4 py-2 text-sm bg-[#FAF8F5] border border-stone-300 rounded-xl focus:outline-none focus:border-amber-700"
                />
              </div>
            </div>

            <div>
              <label htmlFor="prof-email" className="block text-xs font-semibold text-stone-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="prof-email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full min-h-[44px] pl-10 pr-4 py-2 text-sm bg-[#FAF8F5] border border-stone-300 rounded-xl focus:outline-none focus:border-amber-700"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              {savingProfile ? 'Saving Changes...' : 'Save Name & Email'}
            </button>
          </form>

          {/* Change Password Card */}
          <form
            onSubmit={handleChangePassword}
            className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4"
            noValidate
          >
            <div>
              <h2 className="font-display text-lg font-bold text-stone-900">Change Password</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Update your account password anytime. You can also log in via 6-digit SMTP OTP.
              </p>
            </div>

            <div>
              <label
                htmlFor="prof-curr-pass"
                className="block text-xs font-semibold text-stone-700 mb-1.5"
              >
                Current Password (leave blank if signed in via OTP)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="prof-curr-pass"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  className="w-full min-h-[44px] pl-10 pr-4 py-2 text-sm bg-[#FAF8F5] border border-stone-300 rounded-xl focus:outline-none focus:border-amber-700"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="prof-new-pass"
                className="block text-xs font-semibold text-stone-700 mb-1.5"
              >
                New Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="prof-new-pass"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full min-h-[44px] pl-10 pr-4 py-2 text-sm bg-[#FAF8F5] border border-stone-300 rounded-xl focus:outline-none focus:border-amber-700"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              {savingPassword ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
