"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { getBrowserSession, signInWithGoogle, signOut } from "@/lib/supabase/auth-actions";
import { isAnonymousUser } from "@/lib/auth/is-anonymous";
import {
  GOOGLE_OAUTH_RESUME_PARAM,
  GOOGLE_OAUTH_RESUME_VALUE,
} from "@/lib/auth/oauth-identity";
import {
  authCallbackErrorMessage,
  oauthErrorMessage,
  oauthUnavailableMessage,
} from "@/lib/auth/password-policy";
import {
  getRememberMe,
  setRememberMe as setRememberMe_persist,
} from "@/lib/auth/remember-me";
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
  const [rememberMe, setRememberMeState] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [upgradingGuest, setUpgradingGuest] = useState(false);
  const googleResumeStarted = useRef(false);

  // Restore the stored preference on mount (client-only: avoids hydration drift).
  useEffect(() => {
    setRememberMeState(getRememberMe());
  }, []);

  // Persist immediately so the storage adapter sees it before any sign-in call.
  const setRememberMe = (value: boolean) => {
    setRememberMeState(value);
    setRememberMe_persist(value);
  };

  useEffect(() => {
    const callbackError = authCallbackErrorMessage(searchParams.get("auth_error"));
    if (callbackError) {
      setError(callbackError);
      const next = new URLSearchParams(searchParams.toString());
      next.delete("auth_error");
      const qs = next.toString();
      router.replace(qs ? `/login?${qs}` : "/login");
    }
  }, [router, searchParams]);

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
      await signOut();
      const { data, error: err } = await signInWithGoogle();
      if (err || !data?.url) {
        if (err) console.error("[auth] google resume sign in failed", err);
        setError(err ? oauthErrorMessage() : oauthUnavailableMessage());
        setPending(false);
        return;
      }
      // Leave pending true: the browser is leaving for Google.
      window.location.assign(data.url);
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
    name,
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
