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
import { hasAuthedBefore } from "@/lib/auth/returning-visitor";
import { useAuthPanelController } from "@/components/auth/useAuthPanelController";
import { useOAuthIdentityRecovery } from "@/components/auth/useOAuthIdentityRecovery";
import { ArrowRight } from "@/components/icons";

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

  const headerTitle = isSave
    ? "Guarda tu progreso"
    : showExplorePrimary && !accountOpen
      ? "Practica ahora, sin crear cuenta"
      : auth.mode === "register"
        ? "Crea tu cuenta"
        : "Bienvenido de vuelta";

  const headerSubtitle = isSave
    ? auth.upgradingGuest
      ? "Conserva esta sesión en tu cuenta"
      : "Inicia sesión para no perder tu práctica"
    : showExplorePrimary && !accountOpen
      ? "Una sesión completa gratis, sin registrarte"
      : auth.mode === "register"
        ? "Empieza a practicar pronunciación hoy mismo."
        : "Inicia sesión para seguir donde lo dejaste.";

  return (
    <div className="relative min-h-screen flex flex-col lg:flex-row bg-[var(--bg)] p-3 lg:p-4 lg:gap-4 overflow-hidden">
      <AuthImagePanel />

      <div className="flex-1 flex flex-col justify-center items-center py-6 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-[400px] mx-auto flex flex-col animate-home-in animate-home-in-d2">
          {/* Top Brand header for mobile view */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--butter)] text-slate-950 font-bold text-xs border border-black/10">
              Aa
            </div>
            <span className="font-bold text-fg text-sm tracking-tight">
              English Journal
            </span>
          </div>

          <div className="flex flex-col items-center text-center mb-6">
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-fg text-balance leading-tight mb-2">
              {headerTitle}
            </h1>
            <p className="text-sm text-fg-muted text-pretty">
              {headerSubtitle}
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
              {showExplorePrimary && !accountOpen ? (
                <div>
                  <AuthGuestButton
                    variant="primary"
                    onClick={auth.handleGuest}
                    pending={auth.pending}
                    label="Probar una sesión"
                  />
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
                </div>
              ) : null}

              {!showExplorePrimary || accountOpen ? (
                <>
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

                  {/* Account Switch Mode CTA */}
                  <p className="mt-4 text-center text-body-sm text-fg-muted">
                    {auth.mode === "login" ? (
                      <>
                        ¿No tienes cuenta?{" "}
                        <button
                          type="button"
                          onClick={() => {
                            auth.setMode("register");
                            auth.clearFeedback();
                          }}
                          className="font-bold text-[var(--accent-purple)] hover:underline focus-visible:outline-none"
                        >
                          Crear cuenta
                        </button>
                      </>
                    ) : (
                      <>
                        ¿Ya tienes cuenta?{" "}
                        <button
                          type="button"
                          onClick={() => {
                            auth.setMode("login");
                            auth.clearFeedback();
                          }}
                          className="font-bold text-[var(--accent-purple)] hover:underline focus-visible:outline-none"
                        >
                          Iniciar sesión
                        </button>
                      </>
                    )}
                  </p>

                  {/* Guest Practice Bento Card with hover interaction */}
                  <div className="rounded-2xl bg-[var(--sky)] text-slate-950 p-5 mt-6 flex items-center justify-between shadow-sm border border-black/5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group">
                    <div className="flex flex-col pr-2">
                      <span className="text-[11px] font-extrabold tracking-wider text-slate-700 uppercase block mb-1">
                        SIN REGISTRO
                      </span>
                      <h4 className="font-[family-name:var(--font-display)] text-lg font-bold text-slate-950 leading-snug">
                        Prueba una sesión gratis
                      </h4>
                      <p className="text-xs text-slate-700 font-medium mt-0.5">
                        Completa, sin crear cuenta.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={auth.handleGuest}
                      disabled={auth.pending}
                      className="bg-slate-950 hover:bg-black text-white px-4 py-2.5 rounded-full font-bold text-sm flex items-center gap-1.5 shrink-0 transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      <span>{auth.pending ? "Entrando…" : "Probar"}</span>
                      <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
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
