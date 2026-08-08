"use client";

import Link from "next/link";
import { AuthTabs } from "@/components/auth/AuthTabs";
import { AuthFeedback } from "@/components/auth/AuthFeedback";
import { AuthMobileIdentity } from "@/components/auth/AuthMobileIdentity";
import { AuthImagePanel } from "@/components/auth/AuthImagePanel";
import { InstallBanner } from "@/components/auth/InstallBanner";
import { AuthGuestButton } from "@/components/auth/AuthGuestButton";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ResetForm } from "@/components/auth/ResetForm";
import { RecoveryForm } from "@/components/auth/RecoveryForm";
import { SocialDivider } from "@/components/auth/SocialDivider";
import { useAuthPanelController } from "@/components/auth/useAuthPanelController";

export default function AuthPanel() {
  const auth = useAuthPanelController();
  const isSave = auth.intent === "save";
  const showExplorePrimary =
    !isSave && (auth.mode === "login" || auth.mode === "register");

  return (
    <div className="min-h-screen flex bg-surface-base">
      <AuthImagePanel index={auth.imageIndex} />

      <div
        className="flex-1 flex flex-col min-h-screen bg-surface-raised"
        style={
          {
            "--primary-100": `oklch(0.93 0.04 ${auth.hue})`,
            "--primary-500": `oklch(0.65 0.15 ${auth.hue})`,
            "--primary-600": `oklch(0.58 0.16 ${auth.hue})`,
          } as React.CSSProperties
        }
      >
        <AuthMobileIdentity index={auth.imageIndex} />

        <div className="flex-1 px-[var(--layout-page-inline)] flex flex-col items-center justify-center py-[var(--layout-page-block)] lg:py-[var(--layout-page-block-end)]">
          <div className="w-full max-w-sm">
            <div className="hidden lg:flex items-start justify-between mb-10">
              <div>
                <p className="text-h3 text-fg font-bold leading-none tracking-tight">
                  English Journal
                </p>
                <p className="mt-1.5 text-body-sm text-fg-muted">
                  Practica con intención.
                </p>
              </div>
              <InstallBanner />
            </div>

            {showExplorePrimary || isSave ? (
              <div className="mb-8 flex flex-col gap-2">
                <h1 className="text-h3 font-bold text-balance text-fg">
                  {isSave
                    ? "Guarda tu progreso"
                    : "Empieza a practicar sin registrarte"}
                </h1>
                <p className="text-body-sm text-pretty text-fg-muted max-w-[40ch]">
                  {isSave
                    ? auth.upgradingGuest
                      ? "Convierte esta sesión en una cuenta. Conservas el mismo progreso."
                      : "Crea una cuenta o inicia sesión para no perder lo que practiques."
                    : "Entra al escritorio, prueba una sesión y crea una cuenta solo cuando quieras guardar."}
                </p>
              </div>
            ) : null}

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
                  <div className="mb-8 flex flex-col gap-4">
                    <AuthGuestButton
                      variant="primary"
                      onClick={auth.handleGuest}
                      pending={auth.pending}
                    />
                    <SocialDivider />
                    <p className="text-center text-caption text-fg-muted">
                      ¿Quieres guardar el progreso? Usa una cuenta abajo.
                    </p>
                  </div>
                ) : null}

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
                      auth.upgradingGuest && isSave
                        ? "Vincular Google"
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
                      auth.upgradingGuest && isSave
                        ? "Vincular Google"
                        : "Continuar con Google"
                    }
                  />
                )}
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
