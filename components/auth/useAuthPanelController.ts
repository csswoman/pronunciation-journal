"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  resetPasswordForEmail,
  signInAsGuest,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
  updatePassword,
} from "@/lib/supabase/auth-actions";
import { publicAuthErrorMessage, validatePasswordPolicy } from "@/lib/auth/password-policy";

export type AuthPanelMode = "login" | "register" | "reset" | "recovery";

export const AUTH_PANEL_HUES = [350, 145, 220, 30] as const;

export function useAuthPanelController() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode: AuthPanelMode = searchParams.get("mode") === "reset"
    ? "reset"
    : searchParams.get("mode") === "recovery"
      ? "recovery"
      : "login";

  const [mode, setMode] = useState<AuthPanelMode>(initialMode);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setImageIndex((index) => (index + 1) % AUTH_PANEL_HUES.length), 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--hue", String(AUTH_PANEL_HUES[imageIndex]));
    return () => {
      const saved = localStorage.getItem("hue");
      document.documentElement.style.setProperty("--hue", saved ?? "250");
    };
  }, [imageIndex]);

  useEffect(() => {
    if (searchParams.get("message") === "password-updated") {
      setMode("login");
      setMessage("Password updated. You can sign in now.");
      router.replace("/login");
    }
  }, [router, searchParams]);

  const clearFeedback = () => {
    setError(null);
    setMessage(null);
  };

  const handleRecovery = async (event: React.FormEvent) => {
    event.preventDefault();
    clearFeedback();
    setPending(true);
    try {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
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
        setError("Incorrect email or password. Double-check your credentials or create a new account below.");
        return;
      }
      if (data.session) {
        router.replace("/");
        return;
      }
      setMessage("Please confirm your email address before signing in.");
    } finally {
      setPending(false);
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    clearFeedback();
    setPending(true);
    try {
      const { error: err } = await signUpWithEmail(email.trim(), password);
      if (err) {
        console.error("[auth] sign up failed", err);
        setError(publicAuthErrorMessage());
        return;
      }
      setMessage("Check your inbox to confirm your email address.");
    } finally {
      setPending(false);
    }
  };

  const handleGoogle = async () => {
    clearFeedback();
    setPending(true);
    try {
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
      const { data, error: err } = await signInAsGuest();
      if (err) {
        console.error("[auth] guest sign in failed", err);
        setError(publicAuthErrorMessage());
        return;
      }
      if (data.session) {
        router.replace("/");
        router.refresh();
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
      setMessage("If that email exists, you'll receive a password reset link.");
    } finally {
      setPending(false);
    }
  };

  const goToLogin = () => {
    setMode("login");
    clearFeedback();
    router.replace("/login");
  };

  const goToReset = () => {
    setMode("reset");
    clearFeedback();
    router.replace("/login?mode=reset");
  };

  return {
    mode,
    setMode,
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
    imageIndex,
    hue: AUTH_PANEL_HUES[imageIndex],
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
