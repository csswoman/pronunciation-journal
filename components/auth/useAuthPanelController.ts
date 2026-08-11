"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  getBrowserSession,
  linkGoogleIdentity,
  resetPasswordForEmail,
  signInAsGuest,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
  updatePassword,
  upgradeGuestWithEmail,
} from "@/lib/supabase/auth-actions";
import { isAnonymousUser } from "@/lib/auth/is-anonymous";
import { publicAuthErrorMessage, validatePasswordPolicy } from "@/lib/auth/password-policy";

export type AuthPanelMode = "login" | "register" | "reset" | "recovery";
export type AuthPanelIntent = "explore" | "save";

function resolveInitialMode(searchParams: URLSearchParams): AuthPanelMode {
  const mode = searchParams.get("mode");
  if (mode === "reset") return "reset";
  if (mode === "recovery") return "recovery";
  if (mode === "register") return "register";
  if (searchParams.get("intent") === "save" && mode !== "login") return "register";
  return "login";
}

export function useAuthPanelController() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intent: AuthPanelIntent =
    searchParams.get("intent") === "save" ? "save" : "explore";

  const [mode, setMode] = useState<AuthPanelMode>(() => resolveInitialMode(searchParams));
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [upgradingGuest, setUpgradingGuest] = useState(false);

  useEffect(() => {
    if (searchParams.get("message") === "password-updated") {
      setMode("login");
      setMessage("Contraseña actualizada. Ya puedes iniciar sesión.");
      router.replace("/login");
    }
  }, [router, searchParams]);

  useEffect(() => {
    let cancelled = false;
    void getBrowserSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setUpgradingGuest(isAnonymousUser(session?.user ?? null) && Boolean(session?.user));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const clearFeedback = () => {
    setError(null);
    setMessage(null);
  };

  const finishSignedIn = () => {
    router.replace("/");
    router.refresh();
  };

  const handleRecovery = async (event: React.FormEvent) => {
    event.preventDefault();
    clearFeedback();
    setPending(true);
    try {
      if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden.");
        return;
      }
      const policyError = validatePasswordPolicy(password);
      if (policyError) {
        setError(policyError);
        return;
      }
      const { error: err } = await updatePassword(password);
      if (err) {
        console.error("[auth] password update failed", err);
        setError(publicAuthErrorMessage());
        return;
      }
      setPassword("");
      setConfirmPassword("");
      setMode("login");
      router.replace("/login?message=password-updated");
    } finally {
      setPending(false);
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    clearFeedback();
    setPending(true);
    try {
      const { data, error: err } = await signInWithEmail(email.trim(), password);
      if (err) {
        console.error("[auth] sign in failed", err);
        setError(
          "Correo o contraseña incorrectos. Revísalos o crea una cuenta nueva.",
        );
        return;
      }
      if (data.session) {
        finishSignedIn();
        return;
      }
      setMessage("Confirma tu correo antes de iniciar sesión.");
    } finally {
      setPending(false);
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    clearFeedback();
    setPending(true);
    try {
      const policyError = validatePasswordPolicy(password);
      if (policyError) {
        setError(policyError);
        return;
      }

      if (upgradingGuest) {
        const { data, error: err } = await upgradeGuestWithEmail(email.trim(), password);
        if (err) {
          console.error("[auth] guest upgrade failed", err);
          setError(publicAuthErrorMessage());
          return;
        }
        if (data.user) {
          setMessage(
            "Revisa tu bandeja para confirmar el correo. Tu progreso de esta sesión se conserva.",
          );
          finishSignedIn();
          return;
        }
      }

      const { error: err } = await signUpWithEmail(email.trim(), password);
      if (err) {
        console.error("[auth] sign up failed", err);
        setError(publicAuthErrorMessage());
        return;
      }
      setMessage("Revisa tu bandeja para confirmar tu correo.");
    } finally {
      setPending(false);
    }
  };

  const handleGoogle = async () => {
    clearFeedback();
    setPending(true);
    try {
      if (upgradingGuest && intent === "save") {
        const { error: err } = await linkGoogleIdentity();
        if (err) {
          console.error("[auth] google link failed", err);
          setError(publicAuthErrorMessage());
          return;
        }
        router.refresh();
        return;
      }
      const { error: err } = await signInWithGoogle();
      if (err) {
        console.error("[auth] google sign in failed", err);
        setError(publicAuthErrorMessage());
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  const handleGuest = async () => {
    clearFeedback();
    setPending(true);
    try {
      const {
        data: { session: existing },
      } = await getBrowserSession();
      if (existing?.user) {
        finishSignedIn();
        return;
      }
      const { data, error: err } = await signInAsGuest();
      if (err) {
        console.error("[auth] guest sign in failed", err);
        setError(publicAuthErrorMessage());
        return;
      }
      if (data.session) {
        finishSignedIn();
      }
    } finally {
      setPending(false);
    }
  };

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();
    clearFeedback();
    setPending(true);
    try {
      const { error: err } = await resetPasswordForEmail(email.trim());
      if (err) {
        console.error("[auth] password reset request failed", err);
        setError(publicAuthErrorMessage());
        return;
      }
      setMessage("Si ese correo existe, recibirás un enlace para restablecer la contraseña.");
    } finally {
      setPending(false);
    }
  };

  const goToLogin = () => {
    setMode("login");
    clearFeedback();
    router.replace(intent === "save" ? "/login?intent=save" : "/login?intent=explore");
  };

  const goToReset = () => {
    setMode("reset");
    clearFeedback();
    router.replace("/login?mode=reset");
  };

  return {
    mode,
    setMode,
    intent,
    upgradingGuest,
    email,
    setEmail,
    name,
    setName,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    rememberMe,
    setRememberMe,
    message,
    error,
    pending,
    clearFeedback,
    handleRecovery,
    handleLogin,
    handleRegister,
    handleGoogle,
    handleGuest,
    handleReset,
    goToLogin,
    goToReset,
  };
}
