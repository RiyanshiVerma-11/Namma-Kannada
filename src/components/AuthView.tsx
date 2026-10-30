import React, { useState } from 'react';
import { ArrowLeft, Mail, Lock, User, KeyRound, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import {
  validateEmailFormat,
  validateOtpCode,
  type PersonalizedPlan,
  type UserProgressStats,
} from '../utils/learningEngine';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
}

interface AuthViewProps {
  initialMode: 'login' | 'signup' | 'otp';
  pendingPlan: PersonalizedPlan | null;
  currentStats: UserProgressStats;
  onSuccess: (user: AuthenticatedUser, serverPlan?: PersonalizedPlan, serverStats?: UserProgressStats) => void;
  onBack: () => void;
}

export function AuthView({
  initialMode,
  pendingPlan,
  currentStats,
  onSuccess,
  onBack,
}: AuthViewProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'otp'>(initialMode);
  const [otpPurpose, setOtpPurpose] = useState<'login_otp' | 'reset_password'>('login_otp');
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [smtpPreviewInfo, setSmtpPreviewInfo] = useState<{
    otpCodeForPreview?: string;
    smtpLabel?: string;
    previewUrl?: string | false;
  } | null>(null);

  const switchMode = (nextMode: 'login' | 'signup' | 'otp', purpose: 'login_otp' | 'reset_password' = 'login_otp') => {
    setMode(nextMode);
    setOtpPurpose(purpose);
    setOtpStep('request');
    setErrorMessage(null);
    setInfoMessage(null);
    setSmtpPreviewInfo(null);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (!validateEmailFormat(email)) {
      setErrorMessage('Please enter a valid email address (for example, name@example.com).');
      return;
    }

    if (mode === 'signup' && name.trim().length < 2) {
      setErrorMessage('Please enter your full name (at least 2 characters).');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const endpoint = mode === 'signup' ? '/api/auth/register' : '/api/auth/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          plan: pendingPlan,
          stats: currentStats,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.error || 'Authentication failed. Please check your credentials.');
        setLoading(false);
        return;
      }

      onSuccess(data.user, data.user.plan, data.user.stats);
    } catch {
      setErrorMessage('Unable to reach authentication server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (!validateEmailFormat(email)) {
      setErrorMessage('Please enter a valid email address to receive your 6-digit OTP via SMTP.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          purpose: otpPurpose,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.error || 'Could not send OTP email.');
        setLoading(false);
        return;
      }

      setOtpStep('verify');
      setInfoMessage(`6-digit OTP dispatched to ${data.email} via ${data.smtp?.smtpLabel || 'SMTP'}.`);
      setSmtpPreviewInfo({
        otpCodeForPreview: data.otpCodeForPreview,
        smtpLabel: data.smtp?.smtpLabel,
        previewUrl: data.smtp?.previewUrl,
      });
    } catch {
      setErrorMessage('Network error while sending SMTP OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateOtpCode(otpCode)) {
      setErrorMessage('Please enter the 6-digit numeric OTP code.');
      return;
    }

    if (otpPurpose === 'reset_password' && newPassword.trim().length > 0 && newPassword.trim().length < 6) {
      setErrorMessage('Your new password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: otpCode.trim(),
          newPassword: otpPurpose === 'reset_password' ? newPassword.trim() : undefined,
          name: name.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.error || 'Invalid OTP code.');
        setLoading(false);
        return;
      }

      onSuccess(data.user, data.user.plan, data.user.stats);
    } catch {
      setErrorMessage('Unable to verify OTP right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col">
      <header className="border-b border-stone-200 px-6 py-4 bg-[#FAF8F5]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[44px] px-3 py-2 rounded-xl text-sm font-medium text-stone-700 hover:bg-stone-200/60 inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <span className="font-display text-lg font-bold text-stone-900">Namma Kannada</span>
        </div>
      </header>

      <main className="flex-1 max-w-md w-full mx-auto px-6 py-10 flex flex-col justify-center">
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8">
          {/* Mode Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-stone-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`min-h-[40px] py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                mode === 'signup' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`min-h-[40px] py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                mode === 'login' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('otp', 'login_otp')}
              className={`min-h-[40px] py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                mode === 'otp' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Email OTP
            </button>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold text-stone-900">
              {mode === 'signup' && 'Create your learner account'}
              {mode === 'login' && 'Welcome back to Namma Kannada'}
              {mode === 'otp' &&
                (otpPurpose === 'reset_password'
                  ? 'Reset Password / Login with OTP'
                  : 'Instant Email OTP Login')}
            </h1>
            <p className="text-xs text-stone-600 mt-1">
              {mode === 'signup' &&
                'Register with your email via SMTP to sync your daily Kannada study plan and streak.'}
              {mode === 'login' &&
                'Sign in with your email and password, or switch to a 6-digit OTP if you forgot your password.'}
              {mode === 'otp' &&
                'We will send a 6-digit one-time passcode to your email via SMTP so you can log in or reset your password immediately.'}
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {infoMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* Sign Up / Password Login Form */}
          {(mode === 'signup' || mode === 'login') && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4" noValidate>
              {mode === 'signup' && (
                <div>
                  <label htmlFor="auth-name" className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      id="auth-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Priya Sharma"
                      className="w-full min-h-[44px] pl-10 pr-4 py-2.5 text-sm bg-[#FAF8F5] border border-stone-300 rounded-xl focus:outline-none focus:border-amber-700"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="auth-email" className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full min-h-[44px] pl-10 pr-4 py-2.5 text-sm bg-[#FAF8F5] border border-stone-300 rounded-xl focus:outline-none focus:border-amber-700"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="auth-password" className="block text-xs font-semibold text-stone-700">
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => switchMode('otp', 'reset_password')}
                      className="text-xs font-semibold text-amber-800 hover:underline cursor-pointer"
                    >
                      Forgot password? Use Login OTP
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    id="auth-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full min-h-[44px] pl-10 pr-4 py-2.5 text-sm bg-[#FAF8F5] border border-stone-300 rounded-xl focus:outline-none focus:border-amber-700"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] py-3 rounded-xl bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white font-semibold text-sm transition-colors cursor-pointer"
              >
                {loading
                  ? 'Connecting via SMTP...'
                  : mode === 'signup'
                    ? 'Create Account & Prioritize Plan'
                    : 'Sign In & Prioritize Plan'}
              </button>

              {mode === 'login' && (
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                  <span>Demo account ready:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('arjun@nammakannada.in');
                      setPassword('kannada123');
                      setErrorMessage(null);
                    }}
                    className="font-semibold text-stone-800 hover:underline cursor-pointer"
                  >
                    Fill Demo Credentials
                  </button>
                </div>
              )}
            </form>
          )}

          {/* SMTP Email OTP Flow (Request & Verify) */}
          {mode === 'otp' && otpStep === 'request' && (
            <form onSubmit={handleSendOtp} className="space-y-4" noValidate>
              <div>
                <label htmlFor="otp-email" className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Registered or New Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    id="otp-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full min-h-[44px] pl-10 pr-4 py-2.5 text-sm bg-[#FAF8F5] border border-stone-300 rounded-xl focus:outline-none focus:border-amber-700"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-stone-600">
                <button
                  type="button"
                  onClick={() =>
                    setOtpPurpose(otpPurpose === 'login_otp' ? 'reset_password' : 'login_otp')
                  }
                  className="text-amber-800 font-semibold hover:underline cursor-pointer"
                >
                  {otpPurpose === 'login_otp'
                    ? 'Want to set a new password too? Switch to Reset Password mode'
                    : 'Just want to log in directly with OTP? Switch to Instant OTP mode'}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] py-3 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white font-semibold text-sm transition-colors cursor-pointer"
              >
                {loading ? 'Dispatching SMTP Email...' : 'Send 6-Digit OTP via SMTP'}
              </button>
            </form>
          )}

          {mode === 'otp' && otpStep === 'verify' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4" noValidate>
              {smtpPreviewInfo?.otpCodeForPreview && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-stone-800 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-amber-900">SMTP Dispatch Receipt</span>
                    <button
                      type="button"
                      onClick={() => setOtpCode(smtpPreviewInfo.otpCodeForPreview || '')}
                      className="px-2.5 py-1 rounded-lg bg-amber-700 text-white font-semibold text-xs cursor-pointer"
                    >
                      Auto-Fill OTP ({smtpPreviewInfo.otpCodeForPreview})
                    </button>
                  </div>
                  <p className="text-stone-600">
                    Code:{' '}
                    <strong className="font-mono-tabular text-stone-900">
                      {smtpPreviewInfo.otpCodeForPreview}
                    </strong>{' '}
                    {smtpPreviewInfo.previewUrl && (
                      <>
                        ·{' '}
                        <a
                          href={smtpPreviewInfo.previewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-amber-800 underline"
                        >
                          <span>View SMTP Email</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </>
                    )}
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="otp-code-input" className="block text-xs font-semibold text-stone-700 mb-1.5">
                  6-Digit OTP Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    id="otp-code-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full min-h-[44px] pl-10 pr-4 py-2.5 text-sm font-mono-tabular tracking-widest bg-[#FAF8F5] border border-stone-300 rounded-xl focus:outline-none focus:border-amber-700"
                  />
                </div>
              </div>

              {otpPurpose === 'reset_password' && (
                <div>
                  <label htmlFor="otp-new-password" className="block text-xs font-semibold text-stone-700 mb-1.5">
                    New Password (Optional — leave blank for one-time login)
                  </label>
                  <input
                    id="otp-new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (min 6 characters)"
                    className="w-full min-h-[44px] px-4 py-2.5 text-sm bg-[#FAF8F5] border border-stone-300 rounded-xl focus:outline-none focus:border-amber-700"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] py-3 rounded-xl bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white font-semibold text-sm transition-colors cursor-pointer"
              >
                {loading ? 'Verifying OTP...' : 'Verify OTP & Prioritize Plan'}
              </button>

              <button
                type="button"
                onClick={() => setOtpStep('request')}
                className="w-full text-center text-xs text-stone-500 hover:text-stone-900 py-1 cursor-pointer"
              >
                Use a different email or resend code
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
