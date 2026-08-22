"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { getBrowserSession, signInWithGoogle } from "@/lib/supabase/auth-actions";
import { isAnonymousUser } from "@/lib/auth/is-anonymous";
import {
  GOOGLE_OAUTH_RESUME_PARAM,
  GOOGLE_OAUTH_RESUME_VALUE,
} from "@/lib/auth/oauth-identity";
import { publicAuthErrorMessage } from "@/lib/auth/password-policy";
import { createAuthPanelHandlers } from "@/components/auth/auth-panel-handlers";
import {
  resolveInitialMode,
  type AuthPanelIntent,
  type AuthPanelMode,
} from "@/components/auth/auth-panel-types";

export type { AuthPanelMode, AuthPanelIntent };

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
  const googleResumeStarted = useRef(false);

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

  // After guest→Google link fails because the identity already belongs to a
  // permanent account, the callback sends us here to finish as a normal sign-in.
  useEffect(() => {
    if (searchParams.get(GOOGLE_OAUTH_RESUME_PARAM) !== GOOGLE_OAUTH_RESUME_VALUE) {
      return;
    }
    if (googleResumeStarted.current) return;
    googleResumeStarted.current = true;

    router.replace(intent === "save" ? "/login?intent=save" : "/login");
    setError(null);
    setMessage(null);
    setPending(true);

    void (async () => {
      const { error: err } = await signInWithGoogle();
      if (err) {
        console.error("[auth] google resume sign in failed", err);
        setError(publicAuthErrorMessage());
        setPending(false);
      }
      // On success the browser navigates to Google; leave pending true.
    })();
  }, [intent, router, searchParams]);

  const clearFeedback = () => {
    setError(null);
    setMessage(null);
  };

  const finishSignedIn = () => {
    router.replace("/");
    router.refresh();
  };

  const {
    handleRecovery,
    handleLogin,
    handleRegister,
    handleGoogle,
    handleGuest,
    handleReset,
  } = createAuthPanelHandlers({
    email,
    password,
    confirmPassword,
    upgradingGuest,
    intent,
    clearFeedback,
    finishSignedIn,
    setError,
    setMessage,
    setPending,
    setPassword,
    setConfirmPassword,
    setMode,
    router,
  });

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
