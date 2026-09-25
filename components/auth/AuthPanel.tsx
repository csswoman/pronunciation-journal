"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import { useOAuthIdentityRecovery } from "@/components/auth/useOAuthIdentityRecovery";

export default function AuthPanel() {
  const auth = useAuthPanelController();
  useOAuthIdentityRecovery();
  const isSave = auth.intent === "save";
  const isAccountMode = auth.mode === "login" || auth.mode === "register";
  const showExplorePrimary = !isSave && isAccountMode;

  const [accountOpen, setAccountOpen] = useState(false);
  useEffect(() => {
    if (hasAuthedBefore()) setAccountOpen(true);
  }, []);
  const revealAccount = () => {
    setAccountOpen(true);
    auth.clearFeedback();
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[var(--bg)] dark:bg-surface-base p-3 lg:p-4 lg:gap-4">
      <AuthImagePanel />

      <div className="flex-1 flex flex-col justify-center items-center py-6 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-[400px] mx-auto flex flex-col">
          {/* Top Brand header for mobile view */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--butter)] dark:bg-amber-400 text-black font-bold text-xs border border-black/10">
              Aa
            </div>
            <span className="font-bold text-fg text-sm tracking-tight">
              English Journal
            </span>
          </div>

          <div className="flex flex-col items-center text-center mb-6">
            <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold tracking-tight text-fg text-balance leading-tight mb-2">
              {isSave
                ? "Guarda tu progreso"
                : showExplorePrimary
                  ? "Practica ahora, sin crear cuenta"
                  : "English Journal"}
            </h1>
            <p className="text-sm text-fg-muted text-pretty">
              {isSave
                ? auth.upgradingGuest
                  ? "Conserva esta sesión en tu cuenta"
                  : "Inicia sesión para no perder tu práctica"
                : showExplorePrimary
                  ? "Una sesión completa gratis, sin registrarte."
                  : "Inicia sesión en tu cuenta"}
            </p>
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
                    className="text-[var(--accent-purple)] underline-offset-2 hover:underline font-semibold"
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
                <div>
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
                        className="font-semibold text-[var(--accent-purple)] underline-offset-2 transition-colors hover:underline focus-visible:outline-none"
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
                  <div>
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

          <p className="mt-8 text-center text-xs text-fg-muted">
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
  );
}

