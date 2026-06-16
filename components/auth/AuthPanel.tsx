"use client";

import { useState, useEffect } from "react";
import {
  signInWithEmail,
  signUpWithEmail,
  signInAsGuest,
  signInWithGoogle,
  resetPasswordForEmail,
} from "@/lib/supabase/auth-actions";
import { AuthTabs } from "@/components/auth/AuthTabs";
import { AuthFeedback } from "@/components/auth/AuthFeedback";
import { AuthMobileIdentity } from "@/components/auth/AuthMobileIdentity";
import { AuthImagePanel } from "@/components/auth/AuthImagePanel";
import { InstallBanner } from "@/components/auth/InstallBanner";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ResetForm } from "@/components/auth/ResetForm";

type Mode = "login" | "register" | "reset";

const HUE_MAP = [350, 145, 220, 30] as const;

export default function AuthPanel() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setImageIndex(i => (i + 1) % 4), 5000);
    return () => clearInterval(id);
  }, []);

  // Sync rotating image hue to the global theme token
  useEffect(() => {
    document.documentElement.style.setProperty("--hue", String(HUE_MAP[imageIndex]));
    return () => {
      // Restore user's saved hue on unmount
      const saved = localStorage.getItem("hue");
      document.documentElement.style.setProperty("--hue", saved ?? "250");
    };
  }, [imageIndex]);

  const clearFeedback = () => { setError(null); setMessage(null); };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); clearFeedback(); setPending(true);
    try {
      const { error: err } = await signInWithEmail(email.trim(), password);
      if (err) setError(err.message);
    } finally { setPending(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); clearFeedback(); setPending(true);
    try {
      const { error: err } = await signUpWithEmail(email.trim(), password);
      if (err) { setError(err.message); return; }
      setMessage("Check your inbox to confirm your email address.");
    } finally { setPending(false); }
  };

  const handleGoogle = async () => {
    clearFeedback(); setPending(true);
    try {
      const { error: err } = await signInWithGoogle();
      if (err) setError(err.message);
    } finally { setPending(false); }
  };

  const handleGuest = async () => {
    clearFeedback(); setPending(true);
    try {
      const { data, error: err } = await signInAsGuest();
      if (err) { setError(err.message); return; }
      // If Supabase returned a session but onAuthStateChange doesn't fire
      // (e.g. existing anonymous session), force a page reload to pick it up
      if (data.session) window.location.href = "/";
    } finally { setPending(false); }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault(); clearFeedback(); setPending(true);
    try {
      const { error: err } = await resetPasswordForEmail(email.trim());
      if (err) { setError(err.message); return; }
      setMessage("If that email exists, you'll receive a password reset link.");
    } finally { setPending(false); }
  };

  const hue = HUE_MAP[imageIndex];

  return (
    <div className="min-h-screen flex bg-surface-base">

      {/* Left — rotating image, desktop only */}
      <AuthImagePanel index={imageIndex} />

      {/* Right — form panel; only hue + primary scale are JS-driven */}
      <div
        className="flex-1 flex flex-col min-h-screen bg-surface-raised"
        style={{
          "--primary-100": `oklch(0.93 0.04 ${hue})`,
          "--primary-500": `oklch(0.65 0.15 ${hue})`,
          "--primary-600": `oklch(0.58 0.16 ${hue})`,
        } as React.CSSProperties}
      >
        <AuthMobileIdentity index={imageIndex} />

        <div className="flex-1 px-6 flex flex-col items-center justify-center py-10 lg:py-16">
          <div className="w-full max-w-sm">

            {/* Desktop wordmark */}
            <div className="hidden lg:flex items-start justify-between mb-10">
              <div>
                <p
                  className="text-fg font-bold leading-none"
                  style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: "clamp(1.5rem, 2vw, 1.875rem)", letterSpacing: "-0.02em" }}
                >
                  English Journal
                </p>
                <p className="mt-1.5 text-fg-muted text-sm italic" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                  Practice with intention.
                </p>
              </div>
              <InstallBanner />
            </div>

            {(error || message) && (
              <div className="mb-6">
                <AuthFeedback error={error} message={message} />
              </div>
            )}

            {mode === "reset" ? (
              <ResetForm
                email={email} setEmail={setEmail}
                pending={pending}
                onSubmit={handleReset}
                onBack={() => { setMode("login"); clearFeedback(); }}
              />
            ) : (
              <>
                <AuthTabs
                  mode={mode as "login" | "register"}
                  onModeChange={(m) => { setMode(m); clearFeedback(); }}
                />
                {mode === "login" ? (
                  <LoginForm
                    email={email} setEmail={setEmail}
                    password={password} setPassword={setPassword}
                    rememberMe={rememberMe} setRememberMe={setRememberMe}
                    pending={pending}
                    onSubmit={handleLogin}
                    onForgot={() => { setMode("reset"); clearFeedback(); }}
                    onGoogle={handleGoogle}
                    onGuest={handleGuest}
                  />
                ) : (
                  <RegisterForm
                    name={name} setName={setName}
                    email={email} setEmail={setEmail}
                    password={password} setPassword={setPassword}
                    pending={pending}
                    onSubmit={handleRegister}
                    onGoogle={handleGoogle}
                    onGuest={handleGuest}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
