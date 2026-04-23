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
import { AuthTrustBar } from "@/components/auth/AuthTrustBar";

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

  const clearFeedback = () => {
    setError(null);
    setMessage(null);
  };

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
      if (err) {
        setError(err.message);
        return;
      }
      setMessage("Revisa tu bandeja de entrada para confirmar tu correo.");
    } finally {
      setPending(false);
    }
  };

  const handleGuest = async () => {
    clearFeedback();
    setPending(true);
    try {
      const { error: err } = await signInAsGuest();
      if (err) {
        setError(
          `${err.message} Activa "Anonymous" en Supabase → Authentication → Providers.`
        );
      }
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
      if (err) {
        setError(err.message);
        return;
      }
      setMessage("Si el correo existe, recibirás un enlace para restablecer la contraseña.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-6"
      style={{ background: "#0d0f14", fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Ambient glow */}
      <div
        className="fixed pointer-events-none"
        style={{
          top: "-120px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "400px",
          background: "radial-gradient(ellipse, color-mix(in srgb, var(--color-accent) 9%, transparent) 0%, transparent 70%)",
        }}
      />

      <AuthCard>
        {mode !== "reset" && (
          <AuthTabs
            mode={mode}
            onModeChange={(newMode) => {
              setMode(newMode);
              clearFeedback();
            }}
          />
        )}

        <AuthFeedback error={error} message={message} />

        {mode === "reset" ? (
          <form onSubmit={handleReset} className="space-y-4">
            <AuthInput
              type="email"
              label="Correo electrónico"
              placeholder="tu@correo.com"
              value={email}
              onChange={setEmail}
              required
              autoComplete="email"
            />
            <AuthButton label="Enviar enlace" pending={pending} />
            <AuthButton
              label="Volver a entrar"
              pending={pending}
              type="button"
              variant="secondary"
              onClick={() => {
                setMode("login");
                clearFeedback();
              }}
            />
          </form>
        ) : mode === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <AuthInput
              type="email"
              label="Correo electrónico"
              placeholder="tu@correo.com"
              value={email}
              onChange={setEmail}
              required
              autoComplete="email"
            />

            <AuthInput
              type="password"
              label="Contraseña"
              placeholder="········"
              value={password}
              onChange={setPassword}
              required
              autoComplete="current-password"
              minLength={6}
            />

            <div className="flex items-center justify-between">
              <AuthCheckbox
                label="Recordarme"
                checked={rememberMe}
                onChange={setRememberMe}
              />
              <AuthButton
                label="¿Olvidaste tu contraseña?"
                pending={false}
                type="button"
                variant="secondary"
                onClick={() => {
                  setMode("reset");
                  clearFeedback();
                }}
              />
            </div>

            <AuthButton label="Entrar" pending={pending} />

            <div className="flex items-center gap-3 my-5 text-[11.5px] uppercase tracking-[0.6px]" style={{ color: "#4a5070" }}>
              <div className="flex-1 h-px" style={{ background: "#1e2330" }} />
              O continúa con
              <div className="flex-1 h-px" style={{ background: "#1e2330" }} />
            </div>

            <AuthGuestButton onClick={handleGuest} pending={pending} />

            <AuthTrustBar />
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <AuthInput
              type="text"
              label="Nombre"
              placeholder="Tu nombre"
              value={name}
              onChange={setName}
              autoComplete="name"
            />

            <AuthInput
              type="email"
              label="Correo electrónico"
              placeholder="tu@correo.com"
              value={email}
              onChange={setEmail}
              required
              autoComplete="email"
            />

            <AuthInput
              type="password"
              label="Contraseña"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={setPassword}
              required
              autoComplete="new-password"
              minLength={6}
            />

            <AuthButton label="Crear cuenta" pending={pending} />

            <div className="flex items-center gap-3 my-5 text-[11.5px] uppercase tracking-[0.6px]" style={{ color: "#4a5070" }}>
              <div className="flex-1 h-px" style={{ background: "#1e2330" }} />
              O continúa con
              <div className="flex-1 h-px" style={{ background: "#1e2330" }} />
            </div>

            <AuthGuestButton onClick={handleGuest} pending={pending} />

            <AuthTrustBar />
          </form>
        )}
      </AuthCard>
    </div>
  );
}
