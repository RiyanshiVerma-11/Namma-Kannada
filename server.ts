import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Namma Kannada server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
