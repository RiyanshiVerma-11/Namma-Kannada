# Namma Kannada — Practical Spoken Kannada for Everyone

**Namma Kannada** is a full-stack interactive language learning platform built to help non-Kannada speakers learn practical, everyday spoken Kannada through real Bengaluru conversations, branching situational roleplays, searchable vocabulary, and habit-forming daily streaks.

Rather than starting with dense textbook grammar or intimidating script memorization, Namma Kannada teaches **spoken Kanglish phonetics** alongside optional **ಕನ್ನಡ (Kannada) script hints** and literal word-by-word grammatical breakdowns (such as respectful suffixes like `-ri`, `-avare`, and directional suffixes like `-ge`).

---

## Table of Contents

1. [Product Journey & User Flow](#1-product-journey--user-flow)
2. [System Architecture](#2-system-architecture)
3. [Key Features & Modules](#3-key-features--modules)
4. [Authentication & SMTP OTP Pipeline](#4-authentication--smtp-otp-pipeline)
5. [Transparent Streak & Spendable XP Economy](#5-transparent-streak--spendable-xp-economy)
6. [Directory Structure](#6-directory-structure)
7. [Backend REST API Reference](#7-backend-rest-api-reference)
8. [Environment Variables & Configuration](#8-environment-variables--configuration)
9. [Running Locally & Executing Unit Tests](#9-running-locally--executing-unit-tests)

---

## 1. Product Journey & User Flow

Namma Kannada enforces a structured, production-grade onboarding and learning sequence:

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ 1. Editorial Landing Page (LandingPage.tsx)                              │
│    • Interactive Bengaluru conversation preview with Web Speech audio    │
│    • Live situation sampler (Auto & Commute, Darshini & Coffee, Office)  │
│    • 4-step methodology bento grid & learner outcome stories             │
└───────────────────────────────────┬──────────────────────────────────────┘
                                    │ Click "Sign In / Register to Start"
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 2. Email & SMTP OTP Authentication (AuthView.tsx + server.ts)            │
│    • Sign Up with email & password (dispatches SMTP welcome email)       │
│    • Sign In with email & password                                       │
│    • Passwordless Login / Forgot Password via 6-digit SMTP OTP code      │
└───────────────────────────────────┬──────────────────────────────────────┘
                                    │ Authenticated User Session
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 3. Prioritizing Your Plan Wizard (OnboardingWizard.tsx)                  │
│    • Step 1: Current Kannada familiarity (Zero / Phrases / Conversational)│
│    • Step 2: Primary daily context (Commute / Workplace / Living / All)  │
│    • Step 3: Daily time commitment (5m / 10m / 15m / 25m per day)        │
│    • Step 4: Custom 4-Stage Roadmap & Recommended Unit Placement         │
└───────────────────────────────────┬──────────────────────────────────────┘
                                    │ Save Prioritized Plan
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 4. Clean Main Learning Workspace (App.tsx)                               │
│    • Hideable Left Sidebar (Desktop) & 3-Line Slide-Over Drawer (Mobile) │
│    • Attendance & Progression Timeline + Vertical Connected Lesson Path  │
│    • Interactive Lesson Player, Everyday Situations, & Phrasebook        │
│    • Dedicated Circular Profile (Email/Password update) & XP Store       │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. System Architecture

The application uses a unified **Full-Stack TypeScript** architecture served on Port `3000`:

- **Frontend Layer (`React 19 + TypeScript + Tailwind CSS v4`)**:
  - Single-page application mounted at `/src/main.tsx` and orchestrated by `/src/App.tsx`.
  - Pure, framework-agnostic domain logic isolated in `/src/utils/learningEngine.ts` so all streak calculations, XP rewards, sentence evaluations, and study plan generation are deterministic and unit-tested.
  - Native browser audio synthesis in `/src/utils/speech.ts` using the Web Speech API (`window.speechSynthesis`) tuned for Indian English / Kannada phonetic cadence (`kn-IN` / `en-IN`).
  - Custom scalable vector illustrations in `/src/components/CulturalIllustrations.tsx` depicting Bengaluru landmarks, auto rickshaws, and neighborhood scenes.

- **Backend & Middleware Layer (`Express + Nodemailer + Vite Middleware` in `/server.ts`)**:
  - Express server listening on `0.0.0.0:3000`.
  - Provides REST endpoints under `/api/auth/*` and `/api/user/*` for account registration, login, 6-digit OTP generation and verification, profile/email updates, password changes, and progress synchronization.
  - Integrates **Nodemailer** for RFC-2822 MIME email dispatch over configured SMTP relays (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) with an instant local MIME stream transport fallback when running in hermetic or offline environments.
  - Mounts Vite's development middleware in development mode (`NODE_ENV !== 'production'`) and serves compiled static assets from `/dist` in production.

---

## 3. Key Features & Modules

### A. Hideable Sidebar & Mobile-First Navigation (`src/App.tsx`)
- **Desktop View**: Features a collapsible left sidebar toggled via the top-left **Hide Menu / Menu** button (`<PanelLeftClose />` / `<PanelLeftOpen />`), keeping the main learning canvas clean and distraction-free.
- **Mobile View**: Displays a clean **three-line hamburger menu button** (`<Menu />`) in the top-left header that opens a smooth slide-over navigation drawer with quick access to all 6 sections:
  1. **Learn Path** (Progression Timeline & Unit Lessons)
  2. **Everyday Situations** (Branching Roleplay Dialogues)
  3. **Phrasebook** (Searchable 20-Phrase Audio Dictionary)
  4. **Streak & Study Plan** (Attendance Status, Daily Goal Ring, & 4-Week Roadmap)
  5. **XP Rewards Store** (Spend Earned XP on Power-Ups & Phrase Packs)
  6. **My Profile & Security** (Update Name, Email, and Password)

### B. Attendance & Progression Timeline (`src/App.tsx` + `src/utils/learningEngine.ts`)
- Displays how long the user has been away (or confirms when they joined today) using `calculateDaysSinceActive()`.
- Visualizes a 4-stage horizontal milestone bar (**Day 1: First Words** → **Week 1: Polite Greetings** → **Week 2: Auto & Commute** → **Week 4: Bengaluru Fluency**) above a connected vertical unit and lesson timeline.

### C. Interactive Guided Lesson Player (`src/components/LessonPlayer.tsx`)
Each lesson walks the learner through four interactive exercise mechanics:
1. **Phrase Discovery Cards**: Spoken Kanglish, native ಕನ್ನಡ script, English meaning, literal word-by-word breakdown, cultural usage tip, and one-tap audio playback.
2. **Multiple-Choice Comprehension (`multiple_choice`)**: Context-based questions testing real-world usage.
3. **Interactive Word-Tile Sentence Builder (`sentence_builder`)**: Tap-to-assemble word bank tiles to construct natural Kannada sentences, validated via `evaluateSentenceBuilder()`.
4. **Audio Listening Recognition (`listening`)**: Audio-first prompt where learners identify the exact meaning of a spoken Kannada phrase.

### D. Everyday Situations Simulator (`src/components/SituationSimulator.tsx`)
Interactive multi-turn roleplays with local characters across four signature scenarios:
- **Hailing an Auto to Indiranagar** (*Ramesh, Auto Rickshaw Driver*)
- **Ordering Filter Coffee & Masala Dosa** (*shankaraiah, Darshini Cashier*)
- **Coordinating with a Delivery Executive** (*Kiran, Delivery Partner*)
- **Greeting Your Landlord & Discussing Water Supply** (*Saraswathi Amma, House Owner*)

At each turn, learners choose their Kannada response and receive immediate feedback on tone, politeness, and pronunciation, earning **+35 XP** upon completion.

### E. Dedicated Circular Profile & Account Settings (`src/components/ProfileAndXpView.tsx`)
- Accessible from the **circular initials avatar button** in the top-right header (`DR`, `AM`, etc.) or the sidebar.
- Allows learners to:
  - Update their **Full Name** and **Email Address** (`POST /api/user/update-profile`) with instant SMTP confirmation.
  - Change their **Account Password** (`POST /api/user/change-password`).
  - Inspect their transparent **Current Honest Streak**, **Spendable XP Balance**, and **Streak Protection Shield** status.

### F. 60fps 2D Kannada Arcade Game: "Auto Phrase Dash — Indiranagar Run" (`src/components/KannadaArcadeGame.tsx`)
- **Full-Viewport Game Shell**: Launches in an isolated full-viewport `<canvas>` (`Title Screen` → `Playing` → `Pause / Victory / Game Over` modal) with a bespoke inline `<svg>` title lockup and single flat control-hint line (`A/D or Arrow Keys Switch Lanes · Space Horn Boost · M Mute · Esc Pause`).
- **World-Matched, Low-Occlusion HUD**: Keeps >85% of the playfield unobstructed (`pointer-events: none` wrapper, zero `backdrop-filter` over the active canvas) with `tabular-nums` score/combo counters and hull heart indicators.
- **60fps Simulation & Game Feel**: Clamps frame delta time (`Math.min(rawDt, 0.05)`), triggers procedural Web Audio synth feedback (auto horn double-beep, Mysore-gold chord arpeggio on correct Kannada phrase gate, low-frequency impact thud on decoy/pothole collision), 65ms hitstop, decaying camera shake, pooled particle bursts, and squash-and-stretch. Awards **+60 XP** upon completion.

### G. Real-Time Gemini Live Voice Tutor (`src/components/GeminiLiveVoiceTutor.tsx` + WebSocket `/live`)
- Connects browser WebSockets (`/live`) to server-side `ai.live.connect({ model: "gemini-3.8-live" })`.
- Streams 16kHz 16-bit PCM microphone audio (`audio/pcm;rate=16000`) and schedules 24kHz PCM model output audio gaplessly using `AudioBufferSourceNode.start(nextStartTime)`.
- Supports prebuilt voices (`Zephyr`, `Puck`, `Kore`), live input/output audio transcriptions, and local Bengaluru personas (*Ramesh Anna*, *Shankaraiah*, *Prof. Nandini*, *Karthik Gowda*).

### H. Multi-Turn Gemini Kannada Chatbot (`src/components/GeminiChatTutor.tsx` + `POST /api/gemini/chat`)
- Maintains full multi-turn conversation history in a scrollable thread with role-based `systemInstruction` personas.
- Lets learners switch dynamically between:
  - **`gemini-3.8-flash`** for general everyday Kannada conversation and roleplay.
  - **`gemini-3.1-flash-lite`** for fast, low-latency phrase translations and quick drills.
  - **`gemini-4-argon`** for complex suffix morphology breakdowns (`-ge`, `-alli`, `-inda`, `-ri`, `-avare`) and cultural nuance.

---

## 4. Authentication & SMTP OTP Pipeline

Authentication is handled end-to-end by `/src/components/AuthView.tsx` and `/server.ts`:

1. **Email & Password Registration (`POST /api/auth/register`)**:
   - Validates name, email format, and password length.
   - Initializes a brand-new user account with **honest zeroed stats** (`streakDays: 0`, `xp: 0`, `todayXp: 0`, `lastActiveDate: ''`, `joinedDate: todayIso`).
   - Dispatches a welcome email via Nodemailer SMTP.
2. **Email & Password Sign-In (`POST /api/auth/login`)**:
   - Verifies credentials and restores the user's saved study plan and progress stats.
3. **Passwordless / Forgot-Password 6-Digit Email OTP (`POST /api/auth/send-otp` & `POST /api/auth/verify-otp`)**:
   - Generates a cryptographically random 6-digit OTP valid for 10 minutes.
   - Sends the formatted HTML + plain-text OTP email over Nodemailer SMTP.
   - If the user is resetting a forgotten password, `verify-otp` also accepts a `newPassword` field and updates the stored credentials atomically.

---

## 5. Transparent Streak & Spendable XP Economy

### Honest Streak Rules (`calculateLessonCompletion` in `src/utils/learningEngine.ts`)
- **New Accounts Start at `0d` Streak**: Registering a new account never inflates the streak. The user starts at **`0 Days`** and **`0 XP`**.
- **Completing Lesson 1 Ignites Day 1 (`0d` → `1d`)**: When a new learner completes their first lesson or situation today, `streakDays` transitions from `0` to `1` and `lastActiveDate` is recorded as today's ISO date (`YYYY-MM-DD`).
- **Same-Day Practice**: Completing additional lessons on the same calendar day increases `xp` and `todayXp` while keeping `streakDays` accurate.
- **Consecutive-Day Practice**: Completing a lesson on the next calendar day (`diffDays === 1`) increments `streakDays` by `+1`.
- **Streak Freeze Shield Protection**: If a user misses a single day (`diffDays === 2`) and has a **Streak Freeze Shield** equipped (`streakFreezeAvailable === true`), the shield is consumed automatically and their streak increments without resetting.

### Spendable XP Rewards Store (`spendXpOnReward` in `src/utils/learningEngine.ts`)
Learners can spend their earned XP points in the **XP Rewards Store** (`ProfileAndXpView.tsx`):

| Reward Item | Cost | Category | Effect |
| :--- | :--- | :--- | :--- |
| **2x XP Boost (Next Lesson)** | `40 XP` | Power-Up | Doubles the XP earned on the user's next completed lesson (`doubleXpActive = true`). |
| **Streak Freeze Shield** | `50 XP` | Power-Up | Protects the user's consecutive-day streak for 1 missed day (`streakFreezeAvailable = true`). |
| **Bengaluru Auto & Cab Insider Pack** | `50 XP` | Cultural Phrase Pack | Permanently unlocks 3 insider auto negotiation & rain-traffic phrases with audio playback. |
| **Darshini Secret Menu & By-Two Coffee Pack** | `75 XP` | Cultural Phrase Pack | Permanently unlocks 3 authentic Old Bengaluru Darshini cafe phrases with audio playback. |

---

## 6. Directory Structure

```text
/
├── .env.example                     # Environment variable template (Gemini API & SMTP config)
├── index.html                       # HTML entry point with Google Fonts (Bricolage, Plus Jakarta, JetBrains Mono)
├── metadata.json                    # Application metadata & capabilities
├── package.json                     # Dependencies and full-stack scripts
├── server.ts                        # Express + Nodemailer SMTP backend & Vite middleware server
├── tsconfig.json                    # TypeScript compiler configuration
├── vite.config.ts                   # Vite bundler configuration
└── src/
    ├── main.tsx                     # React DOM root entry
    ├── index.css                    # Tailwind CSS v4 import, font utilities, and custom scrollbars
    ├── App.tsx                      # Main application state router, hideable sidebar, timeline, & phrasebook
    ├── components/
    │   ├── LandingPage.tsx          # Editorial landing page with interactive audio preview & situation tabs
    │   ├── AuthView.tsx             # Login, Sign-Up, and 6-digit SMTP Email OTP interface
    │   ├── OnboardingWizard.tsx     # 4-step "Prioritizing Your Plan" diagnostic & custom track builder
    │   ├── LessonPlayer.tsx         # Interactive lesson modal (discovery, MCQ, word-tile builder, audio)
    │   ├── SituationSimulator.tsx   # Multi-turn branching Bengaluru conversation roleplay engine
    │   ├── ProfileAndXpView.tsx     # Dedicated circular profile settings (email/password) & XP Rewards Store
    │   └── CulturalIllustrations.tsx# Custom scalable SVG illustrations of Bengaluru street & cafe scenes
    ├── data/
    │   └── kannadaCurriculum.ts     # Structured 4-unit curriculum, exercises, 4 roleplay situations, & 20 vocab items
    └── utils/
        ├── learningEngine.ts        # Pure domain logic (plan builder, streak/XP engine, sentence evaluator)
        ├── learningEngine.test.ts   # Node unit test suite (node:test + node:assert/strict)
        └── speech.ts                # Web Speech API Kannada/Indian-English phonetic speech synthesizer
```

---

## 7. Backend REST API Reference

All endpoints accept and return JSON:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check returning server status and current timestamp. |
| `POST` | `/api/auth/register` | Creates a new learner account with `0d` streak & `0 XP` and sends a welcome SMTP email. |
| `POST` | `/api/auth/login` | Authenticates an existing user via email & password and returns user + plan + stats. |
| `POST` | `/api/auth/send-otp` | Generates a 6-digit OTP (`login_otp` or `reset_password`) and dispatches it via SMTP. |
| `POST` | `/api/auth/verify-otp` | Verifies the 6-digit OTP code (and optionally sets `newPassword`), logging the user in. |
| `POST` | `/api/user/update-profile` | Updates the user's full name and email address and sends an SMTP confirmation notice. |
| `POST` | `/api/user/change-password` | Verifies current password (if applicable) and updates the account password. |
| `POST` | `/api/user/sync` | Persists the user's latest `plan` and `stats` (`xp`, `streakDays`, `unlockedRewardIds`, etc.). |

---

## 8. Environment Variables & Configuration

See `/.env.example` for all supported environment variables:

```ini
# Optional: SMTP configuration for real email OTP delivery via Nodemailer.
# When omitted, the server automatically uses a fast local RFC-2822 MIME stream relay.
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your_smtp_username"
SMTP_PASS="your_smtp_password"
SMTP_FROM="Namma Kannada <no-reply@nammakannada.in>"
```

---

## 9. Running Locally & Executing Unit Tests

### Start the Full-Stack Development Server
```bash
npm run dev
```
Starts `tsx server.ts` on `http://localhost:3000` with both the Express API and Vite frontend middleware.

### Run the Domain Logic Unit Test Suite
```bash
npx tsx --test src/utils/learningEngine.test.ts
```
Executes the 6-test suite verifying:
1. New user accounts start with `0` streak and `0 XP`, and transition to a `1-day` streak after completing Lesson 1.
2. `buildPersonalizedPlan()` calculates accurate daily XP goals and unit placement.
3. `evaluateSentenceBuilder()` normalizes punctuation and casing properly.
4. `calculateLessonCompletion()` increments streaks on consecutive days, applies `2x XP` boosts, and consumes `Streak Freeze` shields when a day is missed.
5. `spendXpOnReward()` deducts XP accurately and equips power-ups or unlocks cultural phrase packs.
6. `validateEmailFormat()` and `validateOtpCode()` enforce strict input validation.

### Build for Production
```bash
npm run build
```
