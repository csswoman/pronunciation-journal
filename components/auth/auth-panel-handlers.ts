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
import { publicAuthErrorMessage, validatePasswordPolicy } from "@/lib/auth/password-policy";
import type { AuthPanelIntent, AuthPanelMode } from "@/components/auth/auth-panel-types";

type AuthRouter = {
  replace: (href: string) => void;
  refresh: () => void;
};

export type AuthPanelHandlersDeps = {
  email: string;
  password: string;
  confirmPassword: string;
  upgradingGuest: boolean;
  intent: AuthPanelIntent;
  clearFeedback: () => void;
  finishSignedIn: () => void;
  setError: (value: string | null) => void;
  setMessage: (value: string | null) => void;
  setPending: (value: boolean) => void;
  setPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
  setMode: (value: AuthPanelMode) => void;
  router: AuthRouter;
};

export function createAuthPanelHandlers(deps: AuthPanelHandlersDeps) {
  const {
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
  } = deps;

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

  return {
    handleRecovery,
    handleLogin,
    handleRegister,
    handleGoogle,
    handleGuest,
    handleReset,
  };
}
