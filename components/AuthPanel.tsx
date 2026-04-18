"use client";
import Button from "@/components/ui/Button";

import { useState } from "react";
import {
  signInWithEmail,
  signUpWithEmail,
  signInAsGuest,
  resetPasswordForEmail,
} from "@/lib/supabase/auth-actions";

type Mode = "login" | "register" | "reset";

export default function AuthPanel() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      setMessage(
        "Si tu proyecto exige confirmar el correo, revisa tu bandeja de entrada."
      );
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Pronunciation Journal
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Inicia sesión para sincronizar tus palabras con la nube.
          </p>
        </div>

        {mode !== "reset" && (
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
            <Button
              type="button"
              onClick={() => {
                setMode("login");
                clearFeedback();
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === "login"
                  ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              Entrar
            </Button>
            <Button
              type="button"
              onClick={() => {
                setMode("register");
                clearFeedback();
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === "register"
                  ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              Registrarse
            </Button>
          </div>
        )}

        {error && (
          <div
            className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-700 dark:text-red-300"
            role="alert"
          >
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-3 py-2 text-sm text-green-700 dark:text-green-300">
            {message}
          </div>
        )}

        {mode === "reset" ? (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label
                htmlFor="auth-email-reset"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Correo
              </label>
              <input
                id="auth-email-reset"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>
            <Button
              type="submit"
              disabled={pending}
              className="w-full py-2.5 rounded-lg font-medium accent-button disabled:opacity-50"
            >
              {pending ? "Enviando…" : "Enviar enlace"}
            </Button>
            <Button
              type="button"
              onClick={() => {
                setMode("login");
                clearFeedback();
              }}
              className="w-full text-sm text-accent hover:underline"
            >
              Volver a entrar
            </Button>
          </form>
        ) : (
          <form
            onSubmit={mode === "login" ? handleLogin : handleRegister}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="auth-email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Correo
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>
            <div>
              <label
                htmlFor="auth-password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Contraseña
              </label>
              <input
                id="auth-password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>
            {mode === "login" && (
              <Button
                type="button"
                onClick={() => {
                  setMode("reset");
                  clearFeedback();
                }}
                className="text-sm text-accent hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Button>
            )}
            <Button
              type="submit"
              disabled={pending}
              className="w-full py-2.5 rounded-lg font-medium accent-button disabled:opacity-50"
            >
              {pending
                ? "Espera…"
                : mode === "login"
                  ? "Entrar"
                  : "Crear cuenta"}
            </Button>
          </form>
        )}

        {mode !== "reset" && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-800 px-2 text-gray-500">
                  o
                </span>
              </div>
            </div>
            <Button
              type="button"
              onClick={handleGuest}
              disabled={pending}
              className="w-full py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Continuar como invitado
            </Button>
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              La cuenta de invitado guarda datos en la nube en este navegador; para recuperar
              sesión en otro dispositivo, usa correo y contraseña.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

