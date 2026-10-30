import React, { useState } from 'react';
import { Volume2, ArrowRight, Flame, CheckCircle2 } from 'lucide-react';
import { HeroBengaluruScene } from './CulturalIllustrations';
import { speakKannadaPhrase } from '../utils/speech';

interface LandingPageProps {
  onStartOnboarding: () => void;
  onOpenAuth: (initialMode: 'login' | 'signup' | 'otp') => void;
}

const SAMPLE_CONTEXTS = [
  {
    id: 'commute',
    label: 'Auto & Commute',
    phrases: [
      {
        kanglish: 'Anna, Indiranagar-ge bartheera? Meter haaki.',
        script: 'ಅಣ್ಣ, ಇಂದಿರಾನಗರಗೆ ಬರ್ತೀರಾ? ಮೀಟರ್ ಹಾಕಿ.',
        english: 'Brother, will you come to Indiranagar? Please put on the meter.',
        context: 'Hailing an auto rickshaw',
      },
      {
        kanglish: 'Seedha hogi, munde signal hathra nilisi.',
        script: 'ಸೀದಾ ಹೋಗಿ, ಮುಂದೆ ಸಿಗ್ನಲ್ ಹತ್ರ ನಿಲ್ಲಿಸಿ.',
        english: 'Go straight, stop near the signal ahead.',
        context: 'Last-mile directions',
      },
    ],
  },
  {
    id: 'cafe',
    label: 'Darshini & Coffee',
    phrases: [
      {
        kanglish: 'Ondu masala dose, ondu filter coffee kodi — sakkare kammi.',
        script: 'ಒಂದು ಮಸಾಲೆ ದೋಸೆ, ಒಂದು ಫಿಲ್ಟರ್ ಕಾಫಿ ಕೊಡಿ — ಸಕ್ಕರೆ ಕಮ್ಮಿ.',
        english: 'One masala dosa and one filter coffee please — less sugar.',
        context: 'Ordering breakfast',
      },
      {
        kanglish: 'Anna, eshtu aaythu? QR code idya?',
        script: 'ಅಣ್ಣ, ಎಷ್ಟು ಆಯ್ತು? ಕ್ಯೂಆರ್ ಕೋಡ್ ಇದ್ಯಾ?',
        english: 'Brother, how much is the total? Do you have a QR code?',
        context: 'Paying the bill',
      },
    ],
  },
  {
    id: 'social',
    label: 'Office & Neighbors',
    phrases: [
      {
        kanglish: 'Namaskara! Oota aaytha? Chennagiddira?',
        script: 'ನಮಸ್ಕಾರ! ಊಟ ಆಯ್ತಾ? ಚೆನ್ನಾಗಿದ್ದೀರಾ?',
        english: 'Hello! Have you had your meal? Are you doing well?',
        context: 'Warm daily greeting',
      },
      {
        kanglish: 'Naanu swalpa Kannada kalitha iddini.',
        script: 'ನಾನು ಸ್ವಲ್ಪ ಕನ್ನಡ ಕಲಿತಾ ಇದ್ದೀನಿ.',
        english: 'I am learning a little Kannada.',
        context: 'Building instant rapport',
      },
    ],
  },
];

export function LandingPage({ onStartOnboarding, onOpenAuth }: LandingPageProps) {
  const [selectedContext, setSelectedContext] = useState<string>('commute');
  const activeSample = SAMPLE_CONTEXTS.find((c) => c.id === selectedContext) || SAMPLE_CONTEXTS[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-stone-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            className="font-display text-xl font-bold tracking-tight text-stone-900 whitespace-nowrap shrink-0"
          >
            Namma Kannada
          </a>

          {/* Zone 2: 4-5 concise single-line navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600">
            <a
              href="#curriculum"
              className="hover:text-stone-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Curriculum
            </a>
            <a
              href="#situations"
              className="hover:text-stone-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Situations
            </a>
            <a
              href="#methodology"
              className="hover:text-stone-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Methodology
            </a>
            <a
              href="#stories"
              className="hover:text-stone-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Stories
            </a>
            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="hover:text-stone-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign In
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onStartOnboarding}
              className="min-h-[44px] px-5 py-2.5 text-sm font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Start Learning Free
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 pt-10 pb-14 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            {/* Left Column: Proposition & Action */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div>
                <p className="text-xs font-medium text-amber-800 mb-3">
                  Practical Spoken Kannada · Designed for Non-Kannada Speakers in Karnataka
                </p>
                <h1
                  className="font-display font-bold tracking-tight text-stone-900 leading-[1.1]"
                  style={{ fontSize: 'clamp(2.25rem, 4vw, 3.65rem)', textWrap: 'balance' }}
                >
                  Speak confident everyday Kannada from your very first commute.
                </h1>
                <p className="mt-5 text-base sm:text-lg text-stone-600 leading-relaxed max-w-2xl">
                  Skip dry textbook grammar rules. Tell us how much Kannada you know and how many minutes you have each
                  day—we build a custom study plan packed with real Bengaluru conversations, audio pronunciation, and
                  daily streak habits.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-stone-200/80">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <button
                    type="button"
                    onClick={() => onOpenAuth('login')}
                    className="min-h-[48px] px-6 py-3.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-sm inline-flex items-center justify-center gap-2.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Sign In / Register to Start</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenAuth('otp')}
                    className="min-h-[48px] px-4 py-3 text-sm font-medium text-stone-700 hover:text-stone-900 underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer text-left sm:text-center"
                  >
                    Forgot password? Login with 6-Digit Email OTP
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-stone-500">
                  <span>1. Login via Email or SMTP OTP</span>
                  <span aria-hidden="true">·</span>
                  <span>2. Prioritize Your Daily Plan</span>
                  <span aria-hidden="true">·</span>
                  <span>3. Start Interactive Kannada Practice</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Hero Scene */}
            <div className="lg:col-span-5 flex">
              <HeroBengaluruScene
                onPlaySample={(kanglish, script) => speakKannadaPhrase(kanglish, script)}
              />
            </div>
          </div>

          {/* Full-width 4-column quantitative proof strip below Hero */}
          <div className="mt-12 pt-8 border-t border-stone-200 grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-stone-900 font-mono-tabular">5–25 min</p>
              <p className="text-xs text-stone-600 mt-1">Adaptive daily time goals tailored to your schedule</p>
            </div>
            <div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-stone-900 font-mono-tabular">4 Units</p>
              <p className="text-xs text-stone-600 mt-1">Structured from first Namaskara to landlord &amp; office chats</p>
            </div>
            <div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-stone-900 font-mono-tabular">100% Spoken</p>
              <p className="text-xs text-stone-600 mt-1">Learn in natural Kanglish phonetics alongside ಕನ್ನಡ script</p>
            </div>
            <div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-stone-900 font-mono-tabular">89% Retention</p>
              <p className="text-xs text-stone-600 mt-1">Learners maintaining a 7-day streak speak daily in week 2</p>
            </div>
          </div>
        </section>

        {/* Interactive Phrase Sampler Section (#situations) */}
        <section id="situations" className="bg-white border-y border-stone-200 py-14 sm:py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <p className="text-xs font-medium text-amber-800">Everyday Situations</p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
                  Try real phrases you will use in Bengaluru today
                </h2>
              </div>

              {/* Interactive Filter Controls */}
              <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl self-start">
                {SAMPLE_CONTEXTS.map((ctx) => (
                  <button
                    key={ctx.id}
                    type="button"
                    onClick={() => setSelectedContext(ctx.id)}
                    className={`min-h-[40px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      selectedContext === ctx.id
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {ctx.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeSample.phrases.map((item) => (
                <div
                  key={item.kanglish}
                  className="p-6 rounded-2xl bg-[#FAF8F5] border border-stone-200 flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-4 text-xs text-stone-500 mb-2">
                      <span>{item.context}</span>
                      <button
                        type="button"
                        onClick={() => speakKannadaPhrase(item.kanglish, item.script)}
                        aria-label={`Pronounce ${item.kanglish}`}
                        className="min-h-[40px] px-3 py-1.5 rounded-lg bg-amber-100/80 hover:bg-amber-200/80 text-amber-900 font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>Hear Audio</span>
                      </button>
                    </div>
                    <p className="font-display text-xl font-bold text-stone-900">{item.kanglish}</p>
                    <p className="text-sm text-amber-800 font-medium mt-1">{item.script}</p>
                  </div>
                  <p className="text-sm text-stone-600 pt-3 border-t border-stone-200/70">
                    Meaning: <strong className="text-stone-900 font-medium">{item.english}</strong>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Asymmetric Bento-Grid Methodology Section (#methodology & #curriculum) */}
        <section id="methodology" className="max-w-7xl mx-auto px-6 py-14 sm:py-16">
          <div id="curriculum" className="max-w-2xl mb-10">
            <p className="text-xs font-medium text-amber-800">How Namma Kannada Works</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
              Designed like a habit-forming coach, grounded in street-level conversations
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Marquee Span-2 Card */}
            <div className="lg:col-span-2 p-7 rounded-2xl bg-white border border-stone-200 flex flex-col justify-between">
              <div>
                <h3 className="font-display text-xl font-bold text-stone-900">
                  01. Personalized Diagnostic &amp; Daily Time Plan
                </h3>
                <p className="text-sm text-stone-600 mt-2.5 leading-relaxed max-w-xl">
                  Just like Duolingo, you start by telling us your current familiarity with Kannada and whether you can
                  spare 5, 10, 15, or 25 minutes a day. We immediately assemble a custom 4-week roadmap and place you in
                  the exact unit that matches your comfort level.
                </p>
              </div>
              <div className="mt-6 pt-5 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="font-semibold text-stone-900">Casual · 5 min/day</p>
                  <p className="text-stone-500 mt-0.5">4 survival phrases daily · 50 XP target</p>
                </div>
                <div>
                  <p className="font-semibold text-stone-900">Regular · 15 min/day</p>
                  <p className="text-stone-500 mt-0.5">12 phrases + roleplay · 150 XP target</p>
                </div>
                <div>
                  <p className="font-semibold text-stone-900">Immersion · 25 min/day</p>
                  <p className="text-stone-500 mt-0.5">20 phrases + script mastery · 250 XP target</p>
                </div>
              </div>
            </div>

            {/* Span-1 Streak & Gamification Card */}
            <div className="p-7 rounded-2xl bg-stone-900 text-stone-100 border border-stone-800 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-semibold mb-2">
                  <Flame className="w-4 h-4" />
                  <span>Streaks &amp; XP Progression</span>
                </div>
                <h3 className="font-display text-xl font-bold text-white">
                  02. Daily Streaks That Keep You Coming Back
                </h3>
                <p className="text-sm text-stone-300 mt-2.5 leading-relaxed">
                  Earn XP for every interactive sentence builder, audio drill, and situation dialogue. Protect your
                  daily flame streak and watch your fluency ring fill up on mobile or desktop.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-800 flex items-center justify-between text-xs text-stone-300">
                <span>Streak Freeze included</span>
                <span className="font-mono-tabular text-amber-400 font-semibold">+40 XP / Lesson</span>
              </div>
            </div>

            {/* Span-1 Kanglish + Script Card */}
            <div className="p-7 rounded-2xl bg-white border border-stone-200 flex flex-col justify-between">
              <div>
                <h3 className="font-display text-xl font-bold text-stone-900">
                  03. Phonetic Kanglish First, Script Optional
                </h3>
                <p className="text-sm text-stone-600 mt-2.5 leading-relaxed">
                  Every single phrase includes crystal-clear English phonetics (&ldquo;Chennagiddira?&rdquo;), literal
                  word-by-word meaning, and native ಕನ್ನಡ script so you never feel intimidated.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-100 text-xs text-stone-500">
                Toggle script hints anytime inside lessons
              </div>
            </div>

            {/* Span-2 Real Scenarios & Mobile Ergonomics */}
            <div className="lg:col-span-2 p-7 rounded-2xl bg-white border border-stone-200 flex flex-col justify-between">
              <div>
                <h3 className="font-display text-xl font-bold text-stone-900">
                  04. Built for One-Handed Mobile Commutes &amp; Desktop Study
                </h3>
                <p className="text-sm text-stone-600 mt-2.5 leading-relaxed max-w-xl">
                  Practice for 5 minutes in a cab or metro with thumb-friendly tap tiles, instant audio synthesis, and
                  passwordless 6-digit SMTP email OTP sign-in so you never lose your streak across devices.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-100 flex flex-wrap items-center gap-4 text-xs text-stone-600">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  Tap-to-build word tiles
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  Interactive auto &amp; cafe roleplays
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  Searchable 6-category phrasebook
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Proof of Impact / Learner Stories (#stories) */}
        <section id="stories" className="bg-white border-t border-stone-200 py-14 sm:py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-2xl mb-10">
              <p className="text-xs font-medium text-amber-800">Learner Outcomes</p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
                How newcomers to Bengaluru went from silent commutes to warm conversations
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <article className="p-6 rounded-2xl bg-[#FAF8F5] border border-stone-200 flex flex-col justify-between">
                <div>
                  <p className="text-xs text-stone-500 mb-3">14-Day Streak · 15 min/day Plan</p>
                  <p className="text-sm text-stone-700 leading-relaxed">
                    &ldquo;Before Namma Kannada, I relied on English and struggled to explain my apartment gate to
                    delivery drivers. After 10 days on the Commute Track, I guide every cab and auto in Kannada from
                    start to finish.&rdquo;
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-stone-200/80">
                  <p className="text-sm font-semibold text-stone-900">Rohan Deshmukh</p>
                  <p className="text-xs text-stone-500">Product Designer · Relocated to HSR Layout</p>
                </div>
              </article>

              <article className="p-6 rounded-2xl bg-[#FAF8F5] border border-stone-200 flex flex-col justify-between">
                <div>
                  <p className="text-xs text-stone-500 mb-3">21-Day Streak · 10 min/day Plan</p>
                  <p className="text-sm text-stone-700 leading-relaxed">
                    &ldquo;The word-by-word breakdown of respectful suffixes like -ri and -avare changed everything. My
                    neighbors in Malleshwaram were thrilled when I greeted them with Oota aaytha and chatted in
                    Kannada.&rdquo;
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-stone-200/80">
                  <p className="text-sm font-semibold text-stone-900">Shreya Chatterjee</p>
                  <p className="text-xs text-stone-500">Biotech Researcher · Lives in Malleshwaram</p>
                </div>
              </article>

              <article className="p-6 rounded-2xl bg-[#FAF8F5] border border-stone-200 flex flex-col justify-between">
                <div>
                  <p className="text-xs text-stone-500 mb-3">30-Day Streak · 25 min/day Plan</p>
                  <p className="text-sm text-stone-700 leading-relaxed">
                    &ldquo;I used to forget my password on learning apps and lose my streak. The instant 6-digit email
                    OTP login and 5-minute mobile roleplays made it effortless to keep my 30-day streak alive.&rdquo;
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-stone-200/80">
                  <p className="text-sm font-semibold text-stone-900">Vikramaditya Nair</p>
                  <p className="text-xs text-stone-500">Engineering Manager · Whitefield</p>
                </div>
              </article>
            </div>

            {/* Final Conversion Block */}
            <div className="mt-12 p-8 sm:p-10 rounded-2xl bg-stone-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="font-display text-2xl font-bold">Ready to build your daily Kannada habit?</h3>
                <p className="text-sm text-stone-300 mt-1">
                  Sign in or register with your email first, then prioritize your daily study plan to start learning.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="min-h-[48px] px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm whitespace-nowrap shrink-0 cursor-pointer transition-colors"
              >
                Sign In &amp; Prioritize My Plan
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="bg-[#FAF8F5] border-t border-stone-200 py-8 px-6 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-semibold text-stone-800">Namma Kannada — Practical Kannada for Everyone</p>
          <div className="flex items-center gap-6">
            <a href="#curriculum" className="hover:text-stone-900">
              Curriculum
            </a>
            <a href="#situations" className="hover:text-stone-900">
              Situations
            </a>
            <button
              type="button"
              onClick={() => onOpenAuth('otp')}
              className="hover:text-stone-900 cursor-pointer"
            >
              Login via OTP
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
