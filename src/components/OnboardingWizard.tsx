import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Flame, Clock, Sparkles, Compass } from 'lucide-react';
import {
  buildPersonalizedPlan,
  type DailyCommitmentMinutes,
  type LearningMotivation,
  type OnboardingInput,
  type PersonalizedPlan,
  type ProficiencyLevel,
} from '../utils/learningEngine';

interface OnboardingWizardProps {
  userName?: string;
  initialInput?: OnboardingInput;
  onCompletePlan: (plan: PersonalizedPlan) => void;
  onBackToLanding: () => void;
}

const PROFICIENCY_OPTIONS: {
  id: ProficiencyLevel;
  title: string;
  subtitle: string;
  sample: string;
}[] = [
  {
    id: 'none',
    title: 'I am new to Kannada',
    subtitle: 'Start from zero with Namaskara, polite greetings, and essential survival words.',
    sample: 'Starts at Unit 1 · Foundation',
  },
  {
    id: 'basic_words',
    title: 'I know a few words (Swalpa, Haudu, Illa)',
    subtitle: 'Jump straight into building sentences for auto commutes, directions, and shopping.',
    sample: 'Recommended focus: Unit 2 · Street Smart',
  },
  {
    id: 'conversational',
    title: 'I can manage basic errands',
    subtitle: 'Expand into Darshini ordering, workplace small talk, and polite grammar connectors.',
    sample: 'Recommended focus: Unit 3 · Food & Social',
  },
  {
    id: 'script_reader',
    title: 'I want full conversational nuance & script',
    subtitle: 'Master deeper conversations with neighbors, landlords, and ಕನ್ನಡ script reading.',
    sample: 'Recommended focus: Unit 4 · Conversational',
  },
];

const MOTIVATION_OPTIONS: {
  id: LearningMotivation;
  title: string;
  subtitle: string;
}[] = [
  {
    id: 'work_relocation',
    title: 'Living & Working in Bengaluru',
    subtitle: 'Connect with colleagues, security staff, neighbors, and feel at home in the city.',
  },
  {
    id: 'daily_commute',
    title: 'Autos, Cabs, Markets & Cafes',
    subtitle: 'Navigate daily commutes, negotiate fares politely, and order food like a local.',
  },
  {
    id: 'family_friends',
    title: 'Friends, Partner or Family',
    subtitle: 'Have warm, affectionate conversations over meals and family gatherings.',
  },
  {
    id: 'culture_travel',
    title: 'Exploring Karnataka & Culture',
    subtitle: 'Travel across Mysuru, Coorg, Hampi, and coastal Karnataka with confidence.',
  },
];

const TIME_OPTIONS: {
  minutes: DailyCommitmentMinutes;
  label: string;
  paceTag: string;
  xpText: string;
  phrasesText: string;
}[] = [
  {
    minutes: 5,
    label: '5 mins / day',
    paceTag: 'Casual',
    xpText: '50 XP daily goal',
    phrasesText: '4 practical phrases / day',
  },
  {
    minutes: 10,
    label: '10 mins / day',
    paceTag: 'Steady',
    xpText: '100 XP daily goal',
    phrasesText: '8 practical phrases / day',
  },
  {
    minutes: 15,
    label: '15 mins / day',
    paceTag: 'Recommended',
    xpText: '150 XP daily goal',
    phrasesText: '12 practical phrases / day',
  },
  {
    minutes: 25,
    label: '25 mins / day',
    paceTag: 'Accelerated',
    xpText: '250 XP daily goal',
    phrasesText: '20 practical phrases / day',
  },
];

export function OnboardingWizard({
  userName,
  initialInput,
  onCompletePlan,
  onBackToLanding,
}: OnboardingWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [proficiency, setProficiency] = useState<ProficiencyLevel>(initialInput?.proficiency || 'none');
  const [motivation, setMotivation] = useState<LearningMotivation>(
    initialInput?.motivation || 'work_relocation'
  );
  const [dailyMinutes, setDailyMinutes] = useState<DailyCommitmentMinutes>(
    initialInput?.dailyMinutes || 15
  );
  const [scriptPreference, setScriptPreference] = useState<'kanglish_only' | 'kanglish_plus_script'>(
    initialInput?.scriptPreference || 'kanglish_plus_script'
  );

  const generatedPlan = buildPersonalizedPlan({
    proficiency,
    dailyMinutes,
    motivation,
    scriptPreference,
  });

  const progressPercentage = (step / 4) * 100;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col">
      {/* Top Progress Bar */}
      <header className="sticky top-0 z-20 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-stone-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => {
              if (step === 1) onBackToLanding();
              else setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
            }}
            className="min-h-[44px] px-3 py-2 rounded-xl text-sm font-medium text-stone-700 hover:bg-stone-200/60 inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex-1 max-w-xs sm:max-w-sm">
            <div className="flex items-center justify-between text-xs text-stone-600 font-semibold mb-1.5 font-mono-tabular">
              <span>Prioritizing Your Plan</span>
              <span>Step {step} of 4</span>
            </div>
            <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-600 origin-left"
                style={{ transform: `scaleX(${progressPercentage / 100})` }}
              />
            </div>
          </div>

          <span className="font-display text-sm font-bold text-stone-800 hidden sm:inline">
            {userName ? `Hi, ${userName}` : 'Namma Kannada'}
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-10 flex flex-col justify-between">
        {step === 1 && (
          <div>
            <p className="text-xs font-medium text-amber-800">
              {userName ? `Welcome, ${userName} · ` : ''}Prioritizing Your Plan (1 of 3) · Current Level
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
              How much Kannada do you know right now?
            </h1>
            <p className="text-sm text-stone-600 mt-1.5">
              Now that you are signed in, let&apos;s prioritize your starting unit and exercise difficulty.
            </p>

            <div className="mt-7 space-y-3.5" role="radiogroup" aria-label="Kannada proficiency level">
              {PROFICIENCY_OPTIONS.map((opt) => {
                const selected = proficiency === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setProficiency(opt.id)}
                    className={`w-full text-left p-5 rounded-2xl border transition-colors cursor-pointer flex items-start justify-between gap-4 ${
                      selected
                        ? 'bg-amber-50/90 border-amber-600 text-stone-900'
                        : 'bg-white border-stone-200 hover:border-stone-300 text-stone-800'
                    }`}
                  >
                    <div>
                      <p className="font-display text-base font-bold">{opt.title}</p>
                      <p className="text-sm text-stone-600 mt-1">{opt.subtitle}</p>
                      <p className="text-xs text-amber-800 font-medium mt-2">{opt.sample}</p>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                        selected ? 'border-amber-700 bg-amber-700 text-white' : 'border-stone-300'
                      }`}
                    >
                      {selected && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="text-xs font-medium text-amber-800">Prioritizing Your Plan (2 of 3) · Practical Focus</p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
              Where will you use Kannada the most?
            </h1>
            <p className="text-sm text-stone-600 mt-1.5">
              This prioritizes the everyday situations and roleplay dialogues in your curriculum.
            </p>

            <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4" role="radiogroup" aria-label="Learning motivation">
              {MOTIVATION_OPTIONS.map((opt) => {
                const selected = motivation === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setMotivation(opt.id)}
                    className={`p-5 rounded-2xl border text-left transition-colors cursor-pointer flex flex-col justify-between ${
                      selected
                        ? 'bg-amber-50/90 border-amber-600 text-stone-900'
                        : 'bg-white border-stone-200 hover:border-stone-300 text-stone-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <Compass className={`w-5 h-5 ${selected ? 'text-amber-700' : 'text-stone-400'}`} />
                        {selected && <span className="text-xs font-semibold text-amber-800">Selected</span>}
                      </div>
                      <p className="font-display text-base font-bold mt-3">{opt.title}</p>
                      <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">{opt.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-7 p-5 rounded-2xl bg-white border border-stone-200">
              <p className="text-xs font-semibold text-stone-700 mb-3">
                Script Display Preference (you can toggle this anytime)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setScriptPreference('kanglish_plus_script')}
                  className={`min-h-[44px] px-4 py-2.5 rounded-xl border text-xs font-semibold text-left cursor-pointer ${
                    scriptPreference === 'kanglish_plus_script'
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-stone-50 text-stone-700 border-stone-200'
                  }`}
                >
                  Spoken Kanglish + ಕನ್ನಡ Script (Recommended)
                </button>
                <button
                  type="button"
                  onClick={() => setScriptPreference('kanglish_only')}
                  className={`min-h-[44px] px-4 py-2.5 rounded-xl border text-xs font-semibold text-left cursor-pointer ${
                    scriptPreference === 'kanglish_only'
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-stone-50 text-stone-700 border-stone-200'
                  }`}
                >
                  Spoken Kanglish Phonetics Only
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <p className="text-xs font-medium text-amber-800">Prioritizing Your Plan (3 of 3) · Daily Streak Goal</p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
              How much time can you contribute each day?
            </h1>
            <p className="text-sm text-stone-600 mt-1.5">
              Consistency beats intensity. Hitting your daily XP goal keeps your streak flame alive!
            </p>

            <div className="mt-7 space-y-3.5" role="radiogroup" aria-label="Daily time commitment">
              {TIME_OPTIONS.map((item) => {
                const selected = dailyMinutes === item.minutes;
                return (
                  <button
                    key={item.minutes}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setDailyMinutes(item.minutes)}
                    className={`w-full p-5 rounded-2xl border text-left transition-colors cursor-pointer flex items-center justify-between gap-4 ${
                      selected
                        ? 'bg-amber-50/90 border-amber-600 text-stone-900'
                        : 'bg-white border-stone-200 hover:border-stone-300 text-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center font-mono-tabular font-bold text-sm ${
                          selected ? 'bg-amber-700 text-white' : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {item.minutes}m
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display text-base font-bold">{item.label}</span>
                          <span className="text-xs text-stone-500">· {item.paceTag}</span>
                        </div>
                        <p className="text-xs text-stone-600 mt-1">
                          {item.phrasesText} · <span className="font-mono-tabular">{item.xpText}</span>
                        </p>
                      </div>
                    </div>
                    <Flame className={`w-5 h-5 ${selected ? 'text-amber-600' : 'text-stone-300'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Prioritizing Your Plan Complete · Ready to Start</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900">
              {generatedPlan.trackName}
            </h1>
            <p className="text-sm text-stone-600 mt-1.5">
              Based on your priorities, here is how we will get you speaking practical Kannada in{' '}
              <strong className="text-stone-900">{generatedPlan.estimatedWeeksToFluency} weeks</strong>.
            </p>

            {/* Summary KPI Cards */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-stone-200">
                <div className="flex items-center gap-1.5 text-xs text-stone-500">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  <span>Daily Habit</span>
                </div>
                <p className="font-display text-xl font-bold text-stone-900 mt-1 font-mono-tabular">
                  {generatedPlan.dailyMinutes} mins/day
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-stone-200">
                <div className="flex items-center gap-1.5 text-xs text-stone-500">
                  <Flame className="w-3.5 h-3.5 text-amber-700" />
                  <span>Daily Target</span>
                </div>
                <p className="font-display text-xl font-bold text-stone-900 mt-1 font-mono-tabular">
                  {generatedPlan.dailyXpGoal} XP
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-stone-200">
                <div className="flex items-center gap-1.5 text-xs text-stone-500">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Pace</span>
                </div>
                <p className="font-display text-xl font-bold text-stone-900 mt-1 font-mono-tabular">
                  {generatedPlan.dailyPhrasesTarget} phrases/day
                </p>
              </div>
            </div>

            {/* 4-Week Progression Roadmap */}
            <div className="mt-6 p-6 rounded-2xl bg-white border border-stone-200 space-y-4">
              <h2 className="font-display text-base font-bold text-stone-900">
                Your 4-Stage Practical Milestones
              </h2>
              <div className="space-y-3.5">
                {generatedPlan.weeklyMilestones.map((m) => (
                  <div key={m.week} className="flex items-start gap-3.5 pb-3.5 border-b border-stone-100 last:border-none last:pb-0">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 font-mono-tabular text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      W{m.week}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-900">{m.title}</p>
                      <p className="text-xs text-stone-600 mt-0.5">{m.outcome}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer Action Button */}
        <div className="mt-8 pt-5 border-t border-stone-200 flex items-center justify-between gap-4">
          <p className="text-xs text-stone-500">
            {step < 4
              ? 'You can adjust your daily commitment anytime in settings.'
              : 'Your prioritized plan is ready—launch your interactive dashboard now.'}
          </p>
          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => (prev + 1) as 1 | 2 | 3 | 4)}
              className="min-h-[48px] px-6 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onCompletePlan(generatedPlan)}
              className="min-h-[48px] px-6 py-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-sm inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Save Plan &amp; Start Learning</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
