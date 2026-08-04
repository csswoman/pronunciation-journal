"use client";

// Planned structure:
// <ProfileSettings>
//   <PageLayout>
//     <PageHeader />
//     <Toast />
//     <IdentityBlock />          — open canvas (auth only)
//     <ProfilePreferencesPanel />
//     <AccountPanel />           — password + email (auth only)
//     <GuestSignInCard />        — guest only
//   </PageLayout>
// </ProfileSettings>

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useAuth } from "@/components/auth/AuthProvider";
import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import ProfileAvatarCard from "@/components/profile/ProfileAvatarCard";
import ProfileNameCard from "@/components/profile/ProfileNameCard";
import ProfilePasswordCard from "@/components/profile/ProfilePasswordCard";
import ProfilePreferencesPanel from "@/components/profile/ProfilePreferencesPanel";
import { readGuestStudyLevel, saveGuestStudyLevel } from "@/lib/preferences/guest-study-level";
import type { CefrLevel } from "@/lib/essential-words/types";
import { cn } from "@/lib/cn";

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-2 rounded-md border px-4 py-3 font-caption font-medium shadow-md",
        type === "success"
          ? "border-[var(--success)] bg-success text-success"
          : "border-[var(--error)] bg-error text-error",
      )}
    >
      {message}
    </div>
  );
}

export default function ProfileSettings() {
  const { user } = useAuth();
  const {
    preferences,
    loading,
    updateFullName,
    updateAvatar,
    updatePassword,
    updateCefrLevel,
    updateInterests,
  } = useUserPreferences();

  const isGuest = !user || (user as { is_anonymous?: boolean }).is_anonymous;
  const [guestLevel, setGuestLevel] = useState<CefrLevel>("A1");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (isGuest) setGuestLevel(readGuestStudyLevel());
  }, [isGuest]);

  const displayName =
    preferences?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Invitado";

  const initials =
    displayName === "Invitado"
      ? "·"
      : displayName
          .split(" ")
          .slice(0, 2)
          .map((word: string) => word[0])
          .join("")
          .toUpperCase();

  const level = isGuest ? guestLevel : preferences?.cefr_level ?? "A1";

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3000);
  };

  const handleLevelChange = async (next: CefrLevel) => {
    if (isGuest) {
      saveGuestStudyLevel(next);
      setGuestLevel(next);
      showToast("Nivel actualizado en este dispositivo");
      return;
    }
    await updateCefrLevel(next);
    showToast("Nivel de estudio actualizado");
  };

  const header = (
    <PageHeader
      kicker="Cuenta"
      title="Perfil"
      subtitle="Tu identidad y las preferencias que usas cada día."
    />
  );

  if (loading) {
    return (
      <PageLayout archetype="catalog">
        <div className="flex w-full max-w-xl flex-col gap-8">
          {header}
          <div className="flex items-center gap-3 text-fg-muted">
            <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span className="font-caption">Cargando perfil…</span>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (isGuest) {
    return (
      <PageLayout archetype="catalog">
        <div className="flex w-full max-w-xl flex-col gap-8">
          {header}
          {toast && <Toast message={toast.message} type={toast.type} />}

          <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface-raised px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="layout-stack-tight min-w-0">
              <p className="font-label text-fg m-0">Aún no has iniciado sesión</p>
              <p className="font-caption text-fg-muted m-0">
                Puedes ajustar tema, sonidos y nivel aquí. Inicia sesión para guardar tu perfil.
              </p>
            </div>
            <Link
              href="/login"
              className="focus-ring btn-primary inline-flex shrink-0 items-center justify-center rounded-md px-5 py-2.5 font-label"
            >
              Iniciar sesión
            </Link>
          </div>

          <ProfilePreferencesPanel
            level={level}
            onLevelChange={(next) => void handleLevelChange(next)}
            hint="Se guardan en este dispositivo hasta que inicies sesión."
          />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout archetype="catalog">
      <div className="flex w-full max-w-xl flex-col gap-10">
        {header}
        {toast && <Toast message={toast.message} type={toast.type} />}

        <section aria-labelledby="profile-identity-title" className="layout-stack-loose">
          <h2 id="profile-identity-title" className="sr-only">
            Identidad
          </h2>
          <div className="layout-stack rounded-xl border border-border-subtle bg-surface-raised p-5">
            <ProfileAvatarCard
              avatarUrl={preferences?.avatar_url}
              initials={initials}
              displayName={displayName}
              email={user?.email}
              onAvatarUpdate={async (file) => {
                await updateAvatar(file);
                showToast("Foto de perfil actualizada");
              }}
            />
            <div className="border-t border-border-subtle pt-4">
              <ProfileNameCard
                currentName={preferences?.full_name || ""}
                onSave={async (name) => {
                  await updateFullName(name);
                  showToast("Nombre actualizado");
                }}
              />
            </div>
          </div>
        </section>

        <ProfilePreferencesPanel
          level={level}
          onLevelChange={(next) => void handleLevelChange(next)}
          interests={preferences?.interests ?? []}
          onInterestsSave={async (next) => {
            await updateInterests(next);
            showToast("Intereses guardados");
          }}
        />

        <section aria-labelledby="profile-account-title" className="layout-stack-loose">
          <div className="layout-stack-tight px-0.5">
            <h2 id="profile-account-title" className="font-label text-fg m-0">
              Cuenta
            </h2>
            <p className="font-caption text-fg-muted m-0">Datos de acceso y seguridad.</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface-raised divide-y divide-border-subtle">
            <div className="px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-caption text-fg-muted">Correo</span>
                <span className="truncate font-caption font-medium text-fg">{user?.email}</span>
              </div>
            </div>
            <div className="px-5 py-4">
              <ProfilePasswordCard
                onSave={async (password) => {
                  await updatePassword(password);
                  showToast("Contraseña actualizada");
                }}
              />
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
