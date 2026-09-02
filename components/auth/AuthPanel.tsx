"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/illustrations/Logo";
import { AuthTabs } from "@/components/auth/AuthTabs";
import { AuthFeedback } from "@/components/auth/AuthFeedback";
import { AuthImagePanel } from "@/components/auth/AuthImagePanel";
import { AuthGuestButton } from "@/components/auth/AuthGuestButton";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ResetForm } from "@/components/auth/ResetForm";
import { RecoveryForm } from "@/components/auth/RecoveryForm";
import { SocialDivider } from "@/components/auth/SocialDivider";
import { hasAuthedBefore } from "@/lib/auth/returning-visitor";
import { useAuthPanelController } from "@/components/auth/useAuthPanelController";

export default function AuthPanel() {
  const auth = useAuthPanelController();
  const isSave = auth.intent === "save";
  const isAccountMode = auth.mode === "login" || auth.mode === "register";
  const showExplorePrimary = !isSave && isAccountMode;

  // First-time visitors get the guest-first pitch with the account block folded
  // away; anyone who has signed in here before lands straight on the form.
  // Starts folded so SSR and the new-visitor case agree; the effect opens it.
  const [accountOpen, setAccountOpen] = useState(false);
  useEffect(() => {
    if (hasAuthedBefore()) setAccountOpen(true);
  }, []);
  const revealAccount = () => {
    setAccountOpen(true);
    auth.clearFeedback();
  };

  return (
    <div className="min-h-screen flex bg-surface-base">
      <AuthImagePanel />

      <div className="flex-1 flex flex-col min-h-screen bg-surface-raised">
        <div className="flex-1 px-[var(--layout-page-inline)] flex flex-col items-center justify-center py-[var(--layout-page-block)] lg:py-[var(--layout-page-block-end)]">
          <div className="w-full max-w-md">
            <div className="flex flex-col items-center text-center mb-8">
              <Logo className="size-9 text-fg mb-4" />
              <h1 className="text-h3 font-bold tracking-tight text-balance leading-tight">
                <span className="block text-fg">
                  {isSave
                    ? "Guarda tu progreso"
                    : showExplorePrimary
                      ? "Practica ahora, sin crear cuenta"
                      : "English Journal"}
                </span>
                <span className="block text-fg-muted text-pretty">
                  {isSave
                    ? auth.upgradingGuest
                      ? "Conserva esta sesión en tu cuenta"
                      : "Inicia sesión para no perder tu práctica"
                    : showExplorePrimary
                      ? "Una sesión completa gratis, sin registrarte"
                      : "Inicia sesión en tu cuenta"}
                </span>
              </h1>
            </div>

            {(auth.error || auth.message) && (
              <div className="mb-6">
                <AuthFeedback
                  error={auth.error}
                  message={auth.message}
                  compact={auth.mode === "login"}
                />
                {auth.error && auth.mode === "login" && (
                  <p className="mt-2 text-body-sm text-fg-muted text-center">
                    ¿No tienes cuenta?{" "}
                    <button
                      type="button"
                      className="text-primary underline-offset-2 hover:underline font-medium"
                      onClick={() => {
                        auth.setMode("register");
                        auth.clearFeedback();
                      }}
                    >
                      Crear una
                    </button>
                  </p>
                )}
              </div>
            )}

            {auth.mode === "reset" ? (
              <ResetForm
                email={auth.email}
                setEmail={auth.setEmail}
                pending={auth.pending}
                onSubmit={auth.handleReset}
                onBack={auth.goToLogin}
              />
            ) : auth.mode === "recovery" ? (
              <RecoveryForm
                password={auth.password}
                setPassword={auth.setPassword}
                confirmPassword={auth.confirmPassword}
                setConfirmPassword={auth.setConfirmPassword}
                pending={auth.pending}
                onSubmit={auth.handleRecovery}
                onBack={auth.goToLogin}
              />
            ) : (
              <>
                {showExplorePrimary ? (
                  <div className="mb-8">
                    <AuthGuestButton
                      variant="primary"
                      onClick={auth.handleGuest}
                      pending={auth.pending}
                    />
                    {!accountOpen ? (
                      <p className="mt-4 text-center text-body-sm text-fg-muted">
                        ¿Ya tienes cuenta?{" "}
                        <button
                          type="button"
                          onClick={revealAccount}
                          className="font-medium text-primary underline-offset-2 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                        >
                          Inicia sesión
                        </button>
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {!showExplorePrimary || accountOpen ? (
                  <>
                    {showExplorePrimary ? <SocialDivider /> : null}
                    <div className={showExplorePrimary ? "mt-6" : undefined}>
                      <AuthTabs
                        mode={auth.mode === "register" ? "register" : "login"}
                        onModeChange={(next) => {
                          auth.setMode(next);
                          auth.clearFeedback();
                        }}
                      />
                      {auth.mode === "login" ? (
                  <LoginForm
                    email={auth.email}
                    setEmail={auth.setEmail}
                    password={auth.password}
                    setPassword={auth.setPassword}
                    rememberMe={auth.rememberMe}
                    setRememberMe={auth.setRememberMe}
                    pending={auth.pending}
                    onSubmit={auth.handleLogin}
                    onForgot={auth.goToReset}
                    onGoogle={auth.handleGoogle}
                    onGuest={auth.handleGuest}
                    showGuest={false}
                    submitLabel="Iniciar sesión"
                    googleLabel={
                      auth.upgradingGuest
                        ? "Iniciar sesión con Google"
                        : "Continuar con Google"
                    }
                  />
                ) : (
                  <RegisterForm
                    name={auth.name}
                    setName={auth.setName}
                    email={auth.email}
                    setEmail={auth.setEmail}
                    password={auth.password}
                    setPassword={auth.setPassword}
                    pending={auth.pending}
                    onSubmit={auth.handleRegister}
                    onGoogle={auth.handleGoogle}
                    onGuest={auth.handleGuest}
                    showGuest={false}
                    submitLabel={
                      auth.upgradingGuest ? "Guardar con esta cuenta" : "Crear cuenta"
                    }
                    googleLabel={
                      auth.upgradingGuest
                        ? "Guardar mi progreso con Google"
                        : "Continuar con Google"
                    }
                  />
                      )}
                    </div>
                  </>
                ) : null}
              </>
            )}

            <p className="mt-8 text-center text-caption text-fg-muted">
              <Link href="/privacy" className="transition-colors hover:text-fg">
                Privacidad
              </Link>
              <span aria-hidden="true"> · </span>
              <Link href="/terms" className="transition-colors hover:text-fg">
                Términos
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
