import {
  getBrowserSession,
  linkGoogleIdentity,
  resetPasswordForEmail,
  signInAsGuest,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  signUpWithEmail,
  updatePassword,
  upgradeGuestWithEmail,
} from "@/lib/supabase/auth-actions";
import {
  oauthErrorMessage,
  oauthUnavailableMessage,
  publicAuthErrorMessage,
  validatePasswordPolicy,
} from "@/lib/auth/password-policy";
import { isIdentityAlreadyExistsError } from "@/lib/auth/oauth-identity";
import { markAuthSeen } from "@/lib/auth/returning-visitor";
import type { AuthPanelIntent, AuthPanelMode } from "@/components/auth/auth-panel-types";

type AuthRouter = {
  replace: (href: string) => void;
  refresh: () => void;
};

export type AuthPanelHandlersDeps = {
  email: string;
  name: string;
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
    markAuthSeen();
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
    markAuthSeen();
    clearFeedback();
    setPending(true);
    try {
      const policyError = validatePasswordPolicy(password);
      if (policyError) {
        setError(policyError);
        return;
      }

      if (upgradingGuest) {
        const { data, error: err } = await upgradeGuestWithEmail(
          email.trim(),
          password,
          name.trim(),
        );
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

      const { error: err } = await signUpWithEmail(email.trim(), password, name.trim());
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
    markAuthSeen();
    clearFeedback();
    setPending(true);
    let leavingForProvider = false;
    // signInWithOAuth/linkIdentity return the provider URL under PKCE; nothing
    // navigates unless we send the browser there ourselves.
    const redirectToProvider = (url: string | null) => {
      if (!url) {
        // Supabase accepted the call but returned no provider URL — Google is
        // almost certainly not configured for this project.
        setError(oauthUnavailableMessage());
        return;
      }
      leavingForProvider = true;
      window.location.assign(url);
    };
    try {
      if (upgradingGuest && intent === "save") {
        const { data: linkData, error: err } = await linkGoogleIdentity();
        if (err) {
          if (
            isIdentityAlreadyExistsError({
              message: err.message,
              errorCode: "code" in err ? String(err.code) : null,
            })
          ) {
            // Google already belongs to a permanent account — sign into that
            // account instead of leaving the guest stuck on a link error.
            await signOut();
            const { data: signInData, error: signInErr } = await signInWithGoogle();
            if (signInErr) {
              console.error("[auth] google sign in after link conflict failed", signInErr);
              setError(oauthErrorMessage());
              return;
            }
            redirectToProvider(signInData?.url ?? null);
            return;
          }
          console.error("[auth] google link failed", err);
          setError(oauthErrorMessage());
          return;
        }
        redirectToProvider(linkData?.url ?? null);
        return;
      }
      const { data, error: err } = await signInWithGoogle();
      if (err) {
        console.error("[auth] google sign in failed", err);
        setError(oauthErrorMessage());
        return;
      }
      redirectToProvider(data?.url ?? null);
    } finally {
      // Keep the pending state while the browser leaves for the provider so the
      // button never flips back to idle mid-navigation.
      if (!leavingForProvider) setPending(false);
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
