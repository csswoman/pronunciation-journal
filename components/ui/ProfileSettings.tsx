"use client";

// Planned structure:
// <ProfileSettings>
//   <PageLayout>
//     <PageHeader />
//     <ProfileToast />
//     <GuestBanner />           — guest only
//     <ProfileGrid>
//       <MainColumn>
//         <ProfileIdentityCard />
//         <ProfileAppearanceCard />
//         <ProfileStudyCard />
//       </MainColumn>
//       <SecurityColumn>
//         <ProfileAccountCard />
//       </SecurityColumn>
//     </ProfileGrid>
//   </PageLayout>
// </ProfileSettings>

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useAuth } from "@/components/auth/AuthProvider";
import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import ProfileIdentityCard from "@/components/profile/ProfileIdentityCard";
import ProfileAccountCard from "@/components/profile/ProfileAccountCard";
import ProfileAppearanceCard from "@/components/profile/ProfileAppearanceCard";
import ProfileStudyCard from "@/components/profile/ProfileStudyCard";
import ProfilePageSkeleton from "@/components/profile/ProfilePageSkeleton";
import ProfileToast from "@/components/profile/ProfileToast";
import { isAnonymousUser } from "@/lib/auth/is-anonymous";
import { readGuestStudyLevel, saveGuestStudyLevel } from "@/lib/preferences/guest-study-level";
import { exportUserVocabulary } from "@/lib/users/export-vocabulary";
import type { CefrLevel } from "@/lib/essential-words/types";

export default function ProfileSettings() {
  const { user } = useAuth();
  const {
    preferences,
    learnerLevel,
    loading,
    dailyGoal,
    setDailyGoal,
    updateFullName,
    updateAvatar,
    updatePassword,
    updateCefrLevel,
  } = useUserPreferences();

  const isGuest = isAnonymousUser(user);
  const [guestLevel, setGuestLevel] = useState<CefrLevel>("A1");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (isGuest) setGuestLevel(readGuestStudyLevel());
  }, [isGuest]);

  const displayName = isGuest
    ? preferences?.full_name || "Invitado"
    : preferences?.full_name ||
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

  const emailDisplay = isGuest ? "Sesión temporal en este dispositivo" : user?.email;
  const level = isGuest ? guestLevel : learnerLevel?.level === "C2" ? "C1" : learnerLevel?.level ?? "A1";

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

  const handleExportVocabulary = async () => {
    if (user?.id) {
      await exportUserVocabulary(user.id);
      showToast("Vocabulario exportado con éxito");
    } else {
      showToast("No hay datos de usuario para exportar", "error");
    }
  };

  const handleDeleteAccount = async () => {
    const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const header = (
    <PageHeader
      kicker="CUENTA"
      title="Ajustes"
      subtitle="Tu identidad, cómo se ve la app y cómo quieres estudiar."
      badge="Los cambios se guardan solos"
    />
  );

  if (loading) {
    return (
      <PageLayout archetype="catalog">
        <ProfilePageSkeleton />
      </PageLayout>
    );
  }

  return (
    <PageLayout archetype="catalog">
      <div className="flex w-full max-w-5xl flex-col gap-8 pb-24 md:pb-0">
        {header}
        {toast && <ProfileToast message={toast.message} type={toast.type} />}

        {isGuest && (
          <div className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface-raised p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
            <div className="layout-stack-tight min-w-0">
              <p className="m-0 font-label text-base font-semibold text-fg">Estás explorando sin cuenta</p>
              <p className="m-0 font-caption text-fg-muted">
                Ajusta tu nivel y preferencias. Registra tu cuenta para sincronizar tu progreso en la nube.
              </p>
            </div>
            <Link
              href="/login?intent=save&mode=register"
              className="focus-ring inline-flex shrink-0 items-center justify-center rounded-md bg-cta-bg px-5 py-2.5 font-label text-body-sm font-semibold text-cta-fg transition-colors hover:bg-cta-bg-hover"
            >
              Guardar progreso
            </Link>
          </div>
        )}

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
          {/* Main Column */}
          <div className="layout-stack-loose min-w-0">
            <ProfileIdentityCard
              avatarUrl={preferences?.avatar_url}
              initials={initials}
              displayName={displayName}
              email={emailDisplay}
              onAvatarUpdate={async (file) => {
                await updateAvatar(file);
                showToast("Foto de perfil actualizada");
              }}
              onNameSave={async (name) => {
                await updateFullName(name);
                showToast("Nombre actualizado");
              }}
            />

            <ProfileAppearanceCard />

            <ProfileStudyCard
              level={level}
              dailyGoal={dailyGoal}
              onLevelChange={(next) => void handleLevelChange(next)}
              onDailyGoalChange={(goal) => {
                setDailyGoal(goal);
                showToast("Objetivo diario actualizado");
              }}
            />
          </div>

          {/* Security Column */}
          <div className="lg:sticky lg:top-6">
            <ProfileAccountCard
              email={user?.email}
              isGuest={isGuest}
              onPasswordSave={async (password) => {
                await updatePassword(password);
                showToast("Contraseña actualizada");
              }}
              onExportVocabulary={handleExportVocabulary}
              onDeleteAccount={handleDeleteAccount}
            />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
