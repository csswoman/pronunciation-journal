"use client";

// Planned structure:
// <ProfileSettings>
//   <PageLayout>
//     <PageHeader />
//     <ProfileToast />
//     <GuestBanner />           — guest only
//     <ProfileGrid>
//       <MainColumn>
//         <IdentityCard />
//         <ProfilePreferencesPanel />
//       </MainColumn>
//       <SecurityColumn />
//     </ProfileGrid>
//   </PageLayout>
// </ProfileSettings>

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useAuth } from "@/components/auth/AuthProvider";
import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import ProfileAvatarCard from "@/components/profile/ProfileAvatarCard";
import ProfileNameCard from "@/components/profile/ProfileNameCard";
import ProfilePasswordCard from "@/components/profile/ProfilePasswordCard";
import ProfilePreferencesPanel from "@/components/profile/ProfilePreferencesPanel";
import ProfilePageSkeleton from "@/components/profile/ProfilePageSkeleton";
import ProfileToast from "@/components/profile/ProfileToast";
import { isAnonymousUser } from "@/lib/auth/is-anonymous";
import { readGuestStudyLevel, saveGuestStudyLevel } from "@/lib/preferences/guest-study-level";
import type { CefrLevel } from "@/lib/essential-words/types";
import type { AssessmentConcept } from "@/lib/courses/concept-profile";
import type { FocusLevel } from "@/lib/learning-focus/types";
import LearningFocusTopicsSheet from "@/components/home/LearningFocusTopicsSheet";
import {
  claimTheoryTopics,
  listClaimedTheoryTopics,
} from "@/lib/learning-focus/queries";

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

  const isGuest = isAnonymousUser(user);
  const [guestLevel, setGuestLevel] = useState<CefrLevel>("A1");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [topicsOpen, setTopicsOpen] = useState(false);
  const [claimedSlugs, setClaimedSlugs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isGuest) setGuestLevel(readGuestStudyLevel());
  }, [isGuest]);

  useEffect(() => {
    if (!user?.id) return;
    void listClaimedTheoryTopics(user.id).then((claimed) => {
      setClaimedSlugs(new Set(claimed.map((item) => item.lessonSlug)));
    });
  }, [user?.id]);

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

  const handleTopicsClaim = useCallback(
    async (concepts: AssessmentConcept[]) => {
      if (!user?.id) return;
      await claimTheoryTopics(user.id, concepts);
      const claimed = await listClaimedTheoryTopics(user.id);
      setClaimedSlugs(new Set(claimed.map((item) => item.lessonSlug)));
    },
    [user?.id],
  );

  const topicsLevel = level.toLowerCase() as FocusLevel;

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
          <div className="layout-stack-loose min-w-0">
            <section aria-labelledby="profile-identity-title" className="layout-stack-loose">
              <h2 id="profile-identity-title" className="sr-only">
                Identidad
              </h2>
              <div className="layout-stack rounded-xl border border-border-subtle bg-surface-raised p-6 shadow-xs">
                <ProfileAvatarCard
                  avatarUrl={preferences?.avatar_url}
                  initials={initials}
                  displayName={displayName}
                  email={emailDisplay}
                  onAvatarUpdate={async (file) => {
                    await updateAvatar(file);
                    showToast("Foto de perfil actualizada");
                  }}
                />
                <div className="border-t border-border-subtle pt-4">
                  <ProfileNameCard
                    currentName={displayName === "Invitado" ? "" : displayName}
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
              topicsLevel={topicsLevel}
              onTopicsOpen={() => setTopicsOpen(true)}
              interests={preferences?.interests ?? []}
              onInterestsSave={async (next) => {
                await updateInterests(next);
                showToast("Intereses guardados");
              }}
              hint={
                isGuest
                  ? "Tus preferencias se guardan en este dispositivo. Crea una cuenta para sincronizarlas."
                  : "Ajusta tus recomendaciones. Tu progreso se conserva independientemente de estas opciones."
              }
            />

            <LearningFocusTopicsSheet
              open={topicsOpen}
              level={topicsLevel}
              claimedSlugs={claimedSlugs}
              onClose={() => setTopicsOpen(false)}
              onClaim={handleTopicsClaim}
            />
          </div>

          <section
            aria-labelledby="profile-account-title"
            className="layout-stack rounded-xl border border-border-subtle bg-surface-raised p-6 shadow-xs lg:sticky lg:top-6"
          >
            <div className="layout-stack-tight">
              <h2 id="profile-account-title" className="m-0 font-label text-fg">
                Cuenta y seguridad
              </h2>
              <p className="m-0 font-caption text-fg-muted">
                Gestión de acceso y credenciales.
              </p>
            </div>
            <div className="divide-y divide-border-subtle pt-2">
              <div className="flex flex-col gap-1 py-3.5">
                <span className="font-caption text-fg-muted">Correo electrónico</span>
                <span className="truncate font-caption font-semibold text-fg">
                  {isGuest ? "Invitado (Dispositivo local)" : user?.email}
                </span>
              </div>
              <div className="py-3.5">
                {isGuest ? (
                  <div className="layout-stack-tight">
                    <span className="font-caption font-medium text-fg-muted">Contraseña</span>
                    <p className="mt-1 font-caption text-fg-muted">
                      Sin contraseña registrada. Registra tu cuenta para proteger tu progreso.
                    </p>
                    <div className="pt-2">
                      <Link
                        href="/login?intent=save&mode=register"
                        className="focus-ring inline-flex w-full items-center justify-center rounded-md bg-cta-bg px-4 py-2 font-label text-body-sm font-semibold text-cta-fg transition-colors hover:bg-cta-bg-hover"
                      >
                        Crear cuenta
                      </Link>
                    </div>
                  </div>
                ) : (
                  <ProfilePasswordCard
                    onSave={async (password) => {
                      await updatePassword(password);
                      showToast("Contraseña actualizada");
                    }}
                  />
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
