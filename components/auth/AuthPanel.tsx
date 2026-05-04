"use client";

import { useState } from "react";
import {
  signInWithEmail,
  signUpWithEmail,
  signInAsGuest,
  resetPasswordForEmail,
} from "@/lib/supabase/auth-actions";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthTabs } from "@/components/auth/AuthTabs";
import { AuthFeedback } from "@/components/auth/AuthFeedback";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthCheckbox } from "@/components/auth/AuthCheckbox";
import { AuthGuestButton } from "@/components/auth/AuthGuestButton";
import { AuthBackground } from "@/components/auth/AuthBackground";

type Mode = "login" | "register" | "reset";

export default function AuthPanel() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const clearFeedback = () => { setError(null); setMessage(null); };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    setPending(true);
    try {
      const { error: err } = await signInWithEmail(email.trim(), password);
      if (err) setError(err.message);
    } finally {
      setPending(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    setPending(true);
    try {
      const { error: err } = await signUpWithEmail(email.trim(), password);
      if (err) { setError(err.message); return; }
      setMessage("Check your inbox to confirm your email address.");
    } finally {
      setPending(false);
    }
  };

  const handleGuest = async () => {
    clearFeedback();
    setPending(true);
    try {
      const { error: err } = await signInAsGuest();
      if (err) setError(`${err.message} Enable "Anonymous" in Supabase → Authentication → Providers.`);
    } finally {
      setPending(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    setPending(true);
    try {
      const { error: err } = await resetPasswordForEmail(email.trim());
      if (err) { setError(err.message); return; }
      setMessage("If that email exists, you'll receive a password reset link.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-6 relative"
      style={{ background: "var(--surface-base)", fontFamily: "'DM Sans', sans-serif" }}
    >
      <AuthBackground />

      <AuthCard>
        {mode !== "reset" && (
          <AuthTabs
            mode={mode}
            onModeChange={(newMode) => { setMode(newMode); clearFeedback(); }}
          />
        )}

        <AuthFeedback error={error} message={message} />

        {mode === "reset" ? (
          <form onSubmit={handleReset} className="space-y-4">
            <AuthInput
              type="email"
              label="Email address"
              placeholder="you@example.com"
              value={email}
              onChange={setEmail}
              required
              autoComplete="email"
            />
            <AuthButton label="Send reset link" pending={pending} />
            <AuthButton
              label="Back to sign in"
              pending={pending}
              type="button"
              variant="secondary"
              onClick={() => { setMode("login"); clearFeedback(); }}
            />
          </form>
        ) : mode === "login" ? (
          <form onSubmit={handleLogin}>
            <AuthInput
              type="email"
              label="Email address"
              placeholder="you@example.com"
              value={email}
              onChange={setEmail}
              required
              autoComplete="email"
            />
            <AuthInput
              type="password"
              label="Password"
              placeholder="········"
              value={password}
              onChange={setPassword}
              required
              autoComplete="current-password"
              minLength={6}
            />

            <div className="flex items-center justify-between my-[var(--space-4)]">
              <AuthCheckbox label="Remember me" checked={rememberMe} onChange={setRememberMe} />
              <AuthButton
                label="Forgot password?"
                pending={false}
                type="button"
                variant="secondary"
                onClick={() => { setMode("reset"); clearFeedback(); }}
              />
            </div>

            <AuthButton label="Sign in" pending={pending} />

            <div className="flex items-center gap-[var(--space-4)] my-[var(--space-6)]" style={{ color: "var(--text-tertiary)" }}>
              <div className="flex-1 border-t" style={{ borderTopColor: "var(--border-subtle)" }} />
              or continue with
              <div className="flex-1 border-t" style={{ borderTopColor: "var(--border-subtle)" }} />
            </div>

            <AuthGuestButton onClick={handleGuest} pending={pending} />
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <AuthInput
              type="text"
              label="Full name"
              placeholder="Your name"
              value={name}
              onChange={setName}
              autoComplete="name"
            />
            <AuthInput
              type="email"
              label="Email address"
              placeholder="you@example.com"
              value={email}
              onChange={setEmail}
              required
              autoComplete="email"
            />
            <AuthInput
              type="password"
              label="Password"
              placeholder="At least 6 characters"
              value={password}
              onChange={setPassword}
              required
              autoComplete="new-password"
              minLength={6}
            />

            <AuthButton label="Create account" pending={pending} />

            <div className="flex items-center gap-[var(--space-4)] my-[var(--space-6)]" style={{ color: "var(--text-tertiary)" }}>
              <div className="flex-1 border-t" style={{ borderTopColor: "var(--border-subtle)" }} />
              or continue with
              <div className="flex-1 border-t" style={{ borderTopColor: "var(--border-subtle)" }} />
            </div>

            <AuthGuestButton onClick={handleGuest} pending={pending} />
          </form>
        )}
      </AuthCard>
      <style>{`
        form > div + div { margin-top: var(--space-4); }
        form > button:first-of-type { margin-top: var(--space-6); }
        form > .flex.items-center.gap-\\[var\\(--space-4\\)\\] { font: var(--font-tiny); letter-spacing: 0.05em; font-weight: 600; text-transform: uppercase; }
        input, button, a, [role="tab"], [type="checkbox"] { transition: all var(--transition-fast); }
        @media (max-width: 479px) {
          .max-w-\\[400px\\] { width: 100%; padding: var(--space-6) var(--space-4); }
        }
      `}</style>
    </div>
  );
}
