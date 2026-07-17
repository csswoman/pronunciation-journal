"use client";

import Link from "next/link";
import { AuthTabs } from "@/components/auth/AuthTabs";
import { AuthFeedback } from "@/components/auth/AuthFeedback";
import { AuthMobileIdentity } from "@/components/auth/AuthMobileIdentity";
import { AuthImagePanel } from "@/components/auth/AuthImagePanel";
import { InstallBanner } from "@/components/auth/InstallBanner";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ResetForm } from "@/components/auth/ResetForm";
import { RecoveryForm } from "@/components/auth/RecoveryForm";
import { useAuthPanelController } from "@/components/auth/useAuthPanelController";

export default function AuthPanel() {
  const auth = useAuthPanelController();

  return (
    <div className="min-h-screen flex bg-surface-base">

      {/* Left — rotating image, desktop only */}
      <AuthImagePanel index={auth.imageIndex} />

      {/* Right — form panel; hue variables are runtime-driven by the image rotation. */}
      <div
        className="flex-1 flex flex-col min-h-screen bg-surface-raised"
        style={{
          "--primary-100": `oklch(0.93 0.04 ${auth.hue})`,
          "--primary-500": `oklch(0.65 0.15 ${auth.hue})`,
          "--primary-600": `oklch(0.58 0.16 ${auth.hue})`,
        } as React.CSSProperties}
      >
        <AuthMobileIdentity index={auth.imageIndex} />

        <div className="flex-1 px-6 flex flex-col items-center justify-center py-10 lg:py-16">
          <div className="w-full max-w-sm">

            {/* Desktop wordmark */}
            <div className="hidden lg:flex items-start justify-between mb-10">
              <div>
                <p className="text-h3 text-fg font-bold leading-none tracking-tight">
                  English Journal
                </p>
                <p className="mt-1.5 text-sm text-fg-muted italic">
                  Practice with intention.
                </p>
              </div>
              <InstallBanner />
            </div>

            {(auth.error || auth.message) && (
              <div className="mb-6">
                <AuthFeedback error={auth.error} message={auth.message} compact={auth.mode === "login"} />
                {auth.error && auth.mode === "login" && (
                  <p className="mt-2 text-sm text-fg-muted text-center">
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      className="text-primary underline-offset-2 hover:underline font-medium"
                      onClick={() => { auth.setMode("register"); auth.clearFeedback(); }}
                    >
                      Create one
                    </button>
                  </p>
                )}
              </div>
            )}

            {auth.mode === "reset" ? (
              <ResetForm
                email={auth.email} setEmail={auth.setEmail}
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
                <AuthTabs
                  mode={auth.mode === "register" ? "register" : "login"}
                  onModeChange={(mode) => { auth.setMode(mode); auth.clearFeedback(); }}
                />
                {auth.mode === "login" ? (
                <LoginForm
                    email={auth.email} setEmail={auth.setEmail}
                    password={auth.password} setPassword={auth.setPassword}
                    rememberMe={auth.rememberMe} setRememberMe={auth.setRememberMe}
                    pending={auth.pending}
                    onSubmit={auth.handleLogin}
                    onForgot={auth.goToReset}
                    onGoogle={auth.handleGoogle}
                    onGuest={auth.handleGuest}
                  />
                ) : (
                  <RegisterForm
                    name={auth.name} setName={auth.setName}
                    email={auth.email} setEmail={auth.setEmail}
                    password={auth.password} setPassword={auth.setPassword}
                    pending={auth.pending}
                    onSubmit={auth.handleRegister}
                    onGoogle={auth.handleGoogle}
                    onGuest={auth.handleGuest}
                  />
                )}
              </>
            )}

            <p className="mt-8 text-center text-xs text-fg-muted">
              <Link href="/privacy" className="transition-colors hover:text-fg">
                Privacy Policy
              </Link>
              <span aria-hidden="true"> · </span>
              <Link href="/terms" className="transition-colors hover:text-fg">
                Terms of Service
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
