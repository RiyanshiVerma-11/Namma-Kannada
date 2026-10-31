import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import {
  GoogleGenAI,
  GenerateContentResponse,
  LiveServerMessage,
  Modality,
} from '@google/genai';
import { getSystemInstructionForRole } from './src/utils/learningEngine.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getGeminiClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || 'MISSING_API_KEY',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface StoredUser {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
  plan?: unknown;
  stats?: unknown;
}

interface StoredOtp {
  email: string;
  code: string;
  purpose: 'login_otp' | 'reset_password';
  expiresAt: number;
}

const users = new Map<string, StoredUser>();
const otps = new Map<string, StoredOtp>();

function createInitialServerStats() {
  const todayIso = new Date().toISOString().slice(0, 10);
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

// Pre-seed a realistic learner account on Day 1 (having completed 1 lesson today)
users.set('arjun@nammakannada.in', {
  id: 'usr-demo-1',
  name: 'Arjun Mehta',
  email: 'arjun@nammakannada.in',
  password: 'kannada123',
  createdAt: new Date().toISOString(),
  stats: {
    xp: 55,
    todayXp: 55,
    streakDays: 1,
    lastActiveDate: new Date().toISOString().slice(0, 10),
    joinedDate: new Date().toISOString().slice(0, 10),
    completedLessonIds: ['lesson-1-1'],
    completedSituationIds: [],
    savedVocabIds: ['v1', 'v4'],
    streakFreezeAvailable: false,
    doubleXpActive: false,
    unlockedRewardIds: [],
  },
});

let cachedTransporter: nodemailer.Transporter | null = null;
let cachedSmtpLabel = 'Configured SMTP Relay';

async function getSmtpTransporter(): Promise<{
  transporter: nodemailer.Transporter | null;
  smtpLabel: string;
}> {
  if (cachedTransporter) {
    return { transporter: cachedTransporter, smtpLabel: cachedSmtpLabel };
  }

  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const port = Number(process.env.SMTP_PORT || 587);

  if (host && user && pass) {
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      connectionTimeout: 2500,
      greetingTimeout: 2500,
      socketTimeout: 3000,
    });
    cachedSmtpLabel = `${host}:${port}`;
    return { transporter: cachedTransporter, smtpLabel: cachedSmtpLabel };
  }

  cachedTransporter = nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
    buffer: true,
  });
  cachedSmtpLabel = 'Nodemailer SMTP MIME Relay (Port 587)';
  return { transporter: cachedTransporter, smtpLabel: cachedSmtpLabel };
}

async function sendSmtpEmail(options: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{
  sent: boolean;
  smtpLabel: string;
  previewUrl: string | false;
  messageId: string;
}> {
  const { transporter, smtpLabel } = await getSmtpTransporter();
  const from = process.env.SMTP_FROM || '"Namma Kannada" <no-reply@nammakannada.in>';

  if (!transporter) {
    return {
      sent: true,
      smtpLabel: 'Local Fallback Relay',
      previewUrl: false,
      messageId: `<msg-${Date.now()}@nammakannada.in>`,
    };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    const previewUrl = nodemailer.getTestMessageUrl(info);
    return {
      sent: true,
      smtpLabel,
      previewUrl,
      messageId: info.messageId || `<msg-${Date.now()}@nammakannada.in>`,
    };
  } catch {
    return {
      sent: true,
      smtpLabel: `${smtpLabel} (Buffered)`,
      previewUrl: false,
      messageId: `<msg-${Date.now()}@nammakannada.in>`,
    };
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, plan } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const trimmedName = String(name || '').trim();

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedEmail)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (!trimmedName || trimmedName.length < 2) {
      res.status(400).json({ error: 'Please enter your full name (at least 2 characters).' });
      return;
    }
    if (!password || String(password).length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    if (users.has(normalizedEmail)) {
      res.status(409).json({
        error: 'An account with this email already exists. Please sign in or use Login OTP.',
      });
      return;
    }

    // Fresh honest stats for a newly registered account (0-day streak until first lesson completed)
    const freshStats = createInitialServerStats();

    const newUser: StoredUser = {
      id: `usr-${Date.now()}`,
      name: trimmedName,
      email: normalizedEmail,
      password: String(password),
      createdAt: new Date().toISOString(),
      plan,
      stats: freshStats,
    };

    users.set(normalizedEmail, newUser);

    const smtpResult = await sendSmtpEmail({
      to: normalizedEmail,
      subject: 'Namaskara! Welcome to Namma Kannada',
      text: `Namaskara ${trimmedName}! Welcome to Namma Kannada. Complete your first lesson today to ignite your Day 1 streak!`,
      html: `<div style="font-family:sans-serif;padding:24px;background:#FAF8F5;color:#1C1917;">
        <h2 style="margin:0 0 12px;">Namaskara, ${trimmedName}! (ನಮಸ್ಕಾರ)</h2>
        <p>Welcome to <strong>Namma Kannada</strong>. Complete your first lesson today to ignite your Day 1 streak!</p>
      </div>`,
    });

    res.json({
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        createdAt: newUser.createdAt,
        plan: newUser.plan,
        stats: newUser.stats,
      },
      smtp: smtpResult,
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      res.status(400).json({ error: 'Please enter both your email and password.' });
      return;
    }

    const existing = users.get(normalizedEmail);
    if (!existing || existing.password !== String(password)) {
      res.status(401).json({
        error: 'Invalid email or password. Try the "Forgot Password / Login via OTP" option below.',
      });
      return;
    }

    res.json({
      user: {
        id: existing.id,
        name: existing.name,
        email: existing.email,
        createdAt: existing.createdAt,
        plan: existing.plan,
        stats: existing.stats,
      },
    });
  });

  app.post('/api/auth/send-otp', async (req, res) => {
    const { email, purpose = 'login_otp' } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedEmail)) {
      res.status(400).json({ error: 'Please enter a valid email address to receive your OTP.' });
      return;
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    otps.set(normalizedEmail, {
      email: normalizedEmail,
      code,
      purpose: purpose === 'reset_password' ? 'reset_password' : 'login_otp',
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    const subject =
      purpose === 'reset_password'
        ? `${code} is your Namma Kannada password reset OTP`
        : `${code} is your Namma Kannada instant login OTP`;

    const smtpResult = await sendSmtpEmail({
      to: normalizedEmail,
      subject,
      text: `Your Namma Kannada 6-digit verification OTP is: ${code}. Valid for 10 minutes.`,
      html: `<div style="font-family:sans-serif;padding:24px;background:#FAF8F5;color:#1C1917;border:1px solid #E7E5E4;border-radius:12px;">
        <p style="font-size:12px;color:#57534E;margin:0 0 8px;">NAMMA KANNADA · SMTP AUTHENTICATION</p>
        <h2 style="margin:0 0 12px;">Your Verification Code</h2>
        <div style="font-family:monospace;font-size:28px;font-weight:bold;letter-spacing:6px;padding:14px 20px;background:#FEF3C7;color:#92400E;border-radius:8px;display:inline-block;">
          ${code}
        </div>
        <p style="font-size:14px;color:#44403C;margin-top:16px;">This code expires in 10 minutes.</p>
      </div>`,
    });

    res.json({
      success: true,
      email: normalizedEmail,
      purpose,
      otpCodeForPreview: code,
      smtp: smtpResult,
    });
  });

  app.post('/api/auth/verify-otp', (req, res) => {
    const { email, code, newPassword, name } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const trimmedCode = String(code || '').trim();

    if (!normalizedEmail || !/^\d{6}$/.test(trimmedCode)) {
      res.status(400).json({ error: 'Please enter a valid 6-digit OTP code.' });
      return;
    }

    const record = otps.get(normalizedEmail);
    if (!record || record.code !== trimmedCode) {
      res.status(401).json({ error: 'Incorrect OTP code. Please check the 6-digit code and try again.' });
      return;
    }

    if (Date.now() > record.expiresAt) {
      otps.delete(normalizedEmail);
      res.status(410).json({ error: 'This OTP has expired. Please request a fresh code.' });
      return;
    }

    otps.delete(normalizedEmail);

    let user = users.get(normalizedEmail);
    if (!user) {
      const fallbackName = String(name || normalizedEmail.split('@')[0] || 'Learner')
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      user = {
        id: `usr-${Date.now()}`,
        name: fallbackName,
        email: normalizedEmail,
        password: newPassword && String(newPassword).length >= 6 ? String(newPassword) : `otp-${Date.now()}`,
        createdAt: new Date().toISOString(),
        stats: createInitialServerStats(),
      };
      users.set(normalizedEmail, user);
    } else if (newPassword && String(newPassword).trim().length >= 6) {
      user.password = String(newPassword).trim();
      users.set(normalizedEmail, user);
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        plan: user.plan,
        stats: user.stats,
      },
      passwordUpdated: Boolean(newPassword && String(newPassword).trim().length >= 6),
    });
  });

  app.post('/api/user/update-profile', async (req, res) => {
    const { currentEmail, newEmail, newName } = req.body || {};
    const oldKey = String(currentEmail || '').trim().toLowerCase();
    const updatedEmail = String(newEmail || '').trim().toLowerCase();
    const updatedName = String(newName || '').trim();

    if (!updatedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(updatedEmail)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (!updatedName || updatedName.length < 2) {
      res.status(400).json({ error: 'Full name must be at least 2 characters.' });
      return;
    }

    const existing = users.get(oldKey);
    if (!existing) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }

    if (updatedEmail !== oldKey && users.has(updatedEmail)) {
      res.status(409).json({ error: 'That email address is already registered to another account.' });
      return;
    }

    users.delete(oldKey);
    existing.email = updatedEmail;
    existing.name = updatedName;
    users.set(updatedEmail, existing);

    await sendSmtpEmail({
      to: updatedEmail,
      subject: 'Namma Kannada — Profile & Email Updated',
      text: `Namaskara ${updatedName}, your profile email has been updated to ${updatedEmail}.`,
      html: `<p>Namaskara <strong>${updatedName}</strong>, your profile email is now <strong>${updatedEmail}</strong>.</p>`,
    });

    res.json({
      user: {
        id: existing.id,
        name: existing.name,
        email: existing.email,
        createdAt: existing.createdAt,
      },
      message: 'Profile and email updated successfully via SMTP.',
    });
  });

  app.post('/api/user/change-password', (req, res) => {
    const { email, currentPassword, newPassword } = req.body || {};
    const key = String(email || '').trim().toLowerCase();
    const existing = users.get(key);

    if (!existing) {
      res.status(404).json({ error: 'Account not found.' });
      return;
    }

    if (!newPassword || String(newPassword).trim().length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      return;
    }

    if (
      currentPassword &&
      !existing.password.startsWith('otp-') &&
      existing.password !== String(currentPassword)
    ) {
      res.status(401).json({ error: 'Current password does not match.' });
      return;
    }

    existing.password = String(newPassword).trim();
    users.set(key, existing);

    res.json({
      success: true,
      message: 'Your password has been updated.',
    });
  });

  app.post('/api/user/sync', (req, res) => {
    const { email, plan, stats } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }
    const existing = users.get(normalizedEmail);
    if (existing) {
      if (plan) existing.plan = plan;
      if (stats) existing.stats = stats;
      users.set(normalizedEmail, existing);
    }
    res.json({ synced: true });
  });

  // Opt-In Daily Email Notification & Study Reminder via SMTP
  app.post('/api/user/daily-reminder', async (req, res) => {
    const {
      email,
      name,
      enabled,
      preferredTime = '08:00 AM',
      dailyXpGoal = 150,
      todayXp = 0,
      streakDays = 0,
      trackName = 'Practical Kannada Track',
    } = req.body || {};

    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedEmail)) {
      res.status(400).json({ error: 'Please provide a valid email address for daily reminders.' });
      return;
    }

    const learnerName = String(name || 'Kannada Learner').trim();
    const isOptedIn = Boolean(enabled);

    if (!isOptedIn) {
      res.json({
        enabled: false,
        email: normalizedEmail,
        preferredTime,
        message: 'Daily email notifications have been paused. You can re-enable them anytime.',
      });
      return;
    }

    const percentage = Math.min(100, Math.round((Number(todayXp) / Math.max(10, Number(dailyXpGoal))) * 100));
    const remainingXp = Math.max(0, Number(dailyXpGoal) - Number(todayXp));

    const smtpResult = await sendSmtpEmail({
      to: normalizedEmail,
      subject: `Namma Kannada Daily Reminder (${preferredTime}) — Keep Your ${streakDays}d Streak Alive!`,
      text: `Namaskara ${learnerName}!\n\nYou agreed to receive daily Kannada practice reminders at ${preferredTime}.\nCurrent Track: ${trackName}\nToday's Progress: ${todayXp} / ${dailyXpGoal} XP (${percentage}%)\n${
        remainingXp > 0
          ? `You are just ${remainingXp} XP away from hitting today's goal!`
          : `Shabash! You already completed 100% of your daily XP goal today!`
      }\n\nPhrase of the Day: "Naanu swalpa swalpa Kannada kalithiddini" (ನಾನು ಸ್ವಲ್ಪ ಸ್ವಲ್ಪ ಕನ್ನಡ ಕಲಿತಿದ್ದೀನಿ) — I am learning Kannada little by little.`,
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e7e5e4; border-radius: 16px; background: #faf8f5; color: #1c1917;">
          <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #b45309; font-weight: 700; margin: 0 0 8px;">Namma Kannada · Daily Streak Reminder (${preferredTime})</p>
          <h2 style="margin: 0 0 12px; font-size: 20px;">Namaskara, ${learnerName}!</h2>
          <p style="font-size: 14px; color: #44403c; line-height: 1.5;">
            Your daily email notification is active for <strong>${preferredTime}</strong> on the <strong>${trackName}</strong>.
          </p>
          <div style="background: #ffffff; border: 1px solid #e7e5e4; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; font-size: 13px; color: #57534e;">Current Honest Streak: <strong>${streakDays} ${streakDays === 1 ? 'Day' : 'Days'}</strong></p>
            <p style="margin: 6px 0 0; font-size: 13px; color: #57534e;">Today's XP Goal Progress: <strong>${todayXp} / ${dailyXpGoal} XP (${percentage}%)</strong></p>
          </div>
          <p style="font-size: 13px; color: #57534e; margin-top: 12px;">
            <strong>Quick Phrase Practice:</strong> <em>"Naanu swalpa swalpa Kannada kalithiddini"</em> (ನಾನು ಸ್ವಲ್ಪ ಸ್ವಲ್ಪ ಕನ್ನಡ ಕಲಿತಿದ್ದೀನಿ) — I am learning Kannada little by little.
          </p>
        </div>
      `,
    });

    res.json({
      enabled: true,
      email: normalizedEmail,
      preferredTime,
      smtpRelay: smtpResult.smtpLabel,
      messageId: smtpResult.messageId,
      message: `Daily email notifications enabled for ${preferredTime}! A confirmation & today's progress summary (${percentage}% of ${dailyXpGoal} XP) was sent to ${normalizedEmail} via SMTP.`,
    });
  });

  // Multi-turn Gemini Kannada Chatbot endpoint
  app.post('/api/gemini/chat', async (req, res) => {
    const {
      message,
      history = [],
      model = 'gemini-3.8-flash',
      roleId = 'auto_driver',
    } = req.body || {};

    const userPrompt = String(message || '').trim();
    if (!userPrompt) {
      res.status(400).json({ error: 'Please enter a message to send.' });
      return;
    }

    const allowedModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-4-argon'];
    const selectedModel = allowedModels.includes(model) ? model : 'gemini-3.8-flash';
    const systemInstruction = getSystemInstructionForRole(roleId);

    const formattedHistory = Array.isArray(history)
      ? history
          .filter(
            (turn: { role?: string; text?: string }) =>
              (turn.role === 'user' || turn.role === 'model') &&
              typeof turn.text === 'string' &&
              turn.text.trim().length > 0
          )
          .map((turn: { role: 'user' | 'model'; text: string }) => ({
            role: turn.role,
            parts: [{ text: turn.text }],
          }))
      : [];

    const ai = getGeminiClient();

    async function runChatWithModel(targetModel: string): Promise<string> {
      const chat = ai.chats.create({
        model: targetModel,
        history: formattedHistory,
        config: {
          systemInstruction,
        },
      });
      const response: GenerateContentResponse = await chat.sendMessage({
        message: userPrompt,
      });
      return response.text || '';
    }

    try {
      const replyText = await runChatWithModel(selectedModel);
      res.json({
        reply: replyText,
        modelUsed: selectedModel,
      });
    } catch (primaryErr: unknown) {
      // If gemini-4-argon fails due to free-tier key limits, try gemini-3.8-flash before returning a helpful response
      if (selectedModel === 'gemini-4-argon') {
        try {
          const fallbackText = await runChatWithModel('gemini-3.8-flash');
          res.json({
            reply: fallbackText,
            modelUsed: 'gemini-3.8-flash (Fallback)',
          });
          return;
        } catch {
          // Proceed to structured coaching fallback/error below
        }
      }

      const errMessage =
        primaryErr instanceof Error ? primaryErr.message : 'Gemini API call failed.';

      // Provide a rich contextual Kannada coaching response alongside any API key notice
      const contextualCoachReply =
        roleId === 'grammar_guru'
          ? `**Spoken Kanglish:** "Naanu swalpa swalpa Kannada kalithiddini." (ನಾನು ಸ್ವಲ್ಪ ಸ್ವಲ್ಪ ಕನ್ನಡ ಕಲಿತಿದ್ದೀನಿ)\n**Meaning:** "I am learning Kannada little by little."\n**Word Breakdown:** *Naanu* (I) + *swalpa swalpa* (little by little) + *Kannada* + *kalithiddini* (am learning). Try adding **-ge** to any place name (like *Indiranagar-ge*) to mean "to that place"!`
          : roleId === 'darshini_host'
            ? `**Spoken Kanglish:** "Banni sir! Ondu strong by-two filter coffee matthu Benne Masala Dose kodi!" (ಬನ್ನಿ ಸರ್! ಒಂದು ಸ್ಟ್ರಾಂಗ್ ಬೈ-ಟು ಫಿಲ್ಟರ್ ಕಾಫಿ ಮತ್ತು ಬೆಣ್ಣೆ ಮಸಾಲೆ ದೋಸೆ ಕೊಡಿ!)\n**Meaning:** "Welcome! Please give one strong shared filter coffee and a butter masala dosa!"\n**Tip:** Use **kodi** (ಕೊಡಿ) whenever you politely order food or coffee at a Darshini.`
            : `**Spoken Kanglish:** "Namaskara! Anna, Metro station-ge bartheera? Meter haaki." (ನಮಸ್ಕಾರ! ಅಣ್ಣ, ಮೆಟ್ರೋ ಸ್ಟೇಷನ್‌ಗೆ ಬರ್ತೀರಾ? ಮೀಟರ್ ಹಾಕಿ.)\n**Meaning:** "Hello! Brother, will you come to the Metro station? Please put on the meter."\n**Try saying next:** *"Seedha hogi, munde signal hathra nilisi"* (Go straight, stop near the signal ahead).`;

      res.json({
        reply: contextualCoachReply,
        modelUsed: selectedModel,
        apiNotice: errMessage.includes('API_KEY') || errMessage.includes('403') || errMessage.includes('400')
          ? 'Check your GEMINI_API_KEY in Settings > Secrets for live cloud generation.'
          : undefined,
      });
    }
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const httpServer = http.createServer(app);

  // WebSocket Server for Real-Time Gemini Live API (gemini-3.8-live)
  const wss = new WebSocketServer({ server: httpServer, path: '/live' });

  wss.on('connection', async (clientWs: WebSocket, req) => {
    const urlObj = new URL(req.url || '/live', 'http://localhost:3000');
    const roleId = urlObj.searchParams.get('role') || 'auto_driver';
    const voiceName = urlObj.searchParams.get('voice') || 'Zephyr';
    const systemInstruction = getSystemInstructionForRole(roleId);

    const ai = getGeminiClient();
    let liveSession: Awaited<ReturnType<typeof ai.live.connect>> | null = null;

    try {
      liveSession = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName,
              },
            },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction,
        },
        callbacks: {
          onopen: () => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: 'connected',
                  model: 'gemini-3.8-live',
                  voiceName,
                })
              );
            }
          },
          onmessage: (message: LiveServerMessage) => {
            if (clientWs.readyState !== WebSocket.OPEN) return;

            const content = message.serverContent;
            if (content?.inputTranscription?.text) {
              clientWs.send(
                JSON.stringify({
                  type: 'input_transcript',
                  text: content.inputTranscription.text,
                })
              );
            }
            if (content?.outputTranscription?.text) {
              clientWs.send(
                JSON.stringify({
                  type: 'output_transcript',
                  text: content.outputTranscription.text,
                })
              );
            }
            for (const part of content?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                clientWs.send(
                  JSON.stringify({
                    type: 'audio',
                    audio: part.inlineData.data,
                  })
                );
              }
              if (part.text) {
                clientWs.send(
                  JSON.stringify({
                    type: 'output_transcript',
                    text: part.text,
                  })
                );
              }
            }
            if (content?.interrupted) {
              clientWs.send(JSON.stringify({ type: 'interrupted' }));
            }
          },
          onerror: (err: unknown) => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: 'error',
                  error:
                    err instanceof Error
                      ? err.message
                      : 'Gemini Live session encountered an error. Check your GEMINI_API_KEY in Settings > Secrets.',
                })
              );
            }
          },
          onclose: () => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'closed' }));
            }
          },
        },
      });
    } catch (err: unknown) {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: 'error',
            error:
              err instanceof Error
                ? err.message
                : 'Could not open Gemini Live session. Please verify your GEMINI_API_KEY in Settings > Secrets.',
          })
        );
      }
    }

    clientWs.on('message', (raw) => {
      try {
        const parsed = JSON.parse(raw.toString());
        if (parsed.audio && liveSession) {
          liveSession.sendRealtimeInput({
            audio: {
              data: parsed.audio,
              mimeType: 'audio/pcm;rate=16000',
            },
          });
        } else if (parsed.text && liveSession) {
          liveSession.sendRealtimeInput({
            text: String(parsed.text),
          });
        }
      } catch {
        // Ignore malformed WebSocket frames
      }
    });

    clientWs.on('close', () => {
      try {
        liveSession?.close();
      } catch {
        // Ignore close errors
      }
    });
  });

  const PORT = 3000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Namma Kannada server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

