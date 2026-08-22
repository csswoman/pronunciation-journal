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
import { cn } from "@/lib/cn";

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-2 rounded-md border px-4 py-3 font-caption font-medium shadow-sm transition-all",
        type === "success"
          ? "border-border-subtle bg-success-soft text-success"
          : "border-border-subtle bg-error-soft text-error",
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
        <div className="flex w-full max-w-3xl flex-col gap-8 pb-24 md:pb-0">
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
        <div className="flex w-full max-w-3xl flex-col gap-8 pb-24 md:pb-0">
          {header}
          {toast && <Toast message={toast.message} type={toast.type} />}

          <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface-raised px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="layout-stack-tight min-w-0">
              <p className="m-0 font-label text-fg">Estás explorando sin cuenta</p>
              <p className="m-0 font-caption text-fg-muted">
                Puedes ajustar tu nivel y preferencias de aprendizaje. Crea una cuenta para conservar el progreso.
              </p>
            </div>
            <Link
              href="/login?intent=save&mode=register"
              className="focus-ring inline-flex shrink-0 items-center justify-center rounded-md bg-cta-bg px-5 py-2.5 font-label text-cta-fg transition-colors hover:bg-cta-bg-hover"
            >
              Guardar progreso
            </Link>
          </div>

          <ProfilePreferencesPanel
            level={level}
            onLevelChange={(next) => void handleLevelChange(next)}
            topicsLevel={topicsLevel}
            onTopicsOpen={() => setTopicsOpen(true)}
            hint="Tu nivel y temas conocidos se guardan en este dispositivo. Crea una cuenta para no perder el progreso de práctica."
          />
          <LearningFocusTopicsSheet
            open={topicsOpen}
            level={topicsLevel}
            claimedSlugs={claimedSlugs}
            onClose={() => setTopicsOpen(false)}
            onClaim={handleTopicsClaim}
          />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout archetype="catalog">
      <div className="flex w-full max-w-5xl flex-col gap-10 pb-24 md:pb-0">
        {header}
        {toast && <Toast message={toast.message} type={toast.type} />}

        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="layout-stack-loose min-w-0">
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
              topicsLevel={topicsLevel}
              onTopicsOpen={() => setTopicsOpen(true)}
              interests={preferences?.interests ?? []}
              onInterestsSave={async (next) => {
                await updateInterests(next);
                showToast("Intereses guardados");
              }}
              hint="Personaliza tu experiencia y las recomendaciones. Tu progreso se conserva aunque cambies estas opciones."
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
            className="layout-stack-loose lg:sticky lg:top-6"
          >
            <div className="layout-stack-tight px-0.5">
              <h2 id="profile-account-title" className="m-0 font-label text-fg">
                Cuenta y seguridad
              </h2>
              <p className="m-0 font-caption text-fg-muted">
                Cambios poco frecuentes de acceso e identidad.
              </p>
            </div>
            <div className="divide-y divide-border-subtle border-y border-border-subtle">
              <div className="flex items-center justify-between gap-3 py-4">
                <span className="font-caption text-fg-muted">Correo</span>
                <span className="truncate font-caption font-medium text-fg">{user?.email}</span>
              </div>
              <div className="py-4">
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
      </div>
    </PageLayout>
  );
}
