"use client";

// Planned structure:
// <ProfilePreferencesPanel>
//   <StudyLevelControls footer={assessment links} />
//   <TopicsKnown />
//   <InterestsEditor />   — only when onSave provided
// </ProfilePreferencesPanel>

import Link from "next/link";
import Button from "@/components/ui/Button";
import { StudyLevelControls } from "@/components/layout/QuickSettingsControls";
import InterestsEditor from "@/components/profile/InterestsEditor";
import type { CefrLevel } from "@/lib/essential-words/types";
import type { Interest } from "@/lib/users/interests";
import type { FocusLevel } from "@/lib/learning-focus/types";

const controlClass = "border-0 p-0";

interface Props {
  level: CefrLevel;
  onLevelChange: (next: CefrLevel) => void;
  interests?: readonly Interest[];
  onInterestsSave?: (interests: Interest[]) => Promise<void>;
  topicsLevel?: FocusLevel;
  onTopicsOpen?: () => void;
  hint?: string;
}

export default function ProfilePreferencesPanel({
  level,
  onLevelChange,
  interests,
  onInterestsSave,
  topicsLevel,
  onTopicsOpen,
  hint = "Ajusta tus recomendaciones. Tu progreso se conserva independientemente de estas opciones.",
}: Props) {
  return (
    <section aria-labelledby="profile-prefs-title" className="layout-stack-loose">
      <div className="layout-stack-tight px-0.5">
        <h2 id="profile-prefs-title" className="m-0 font-label text-fg">
          Cómo quieres aprender
        </h2>
        <p className="m-0 font-caption text-fg-muted">{hint}</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="layout-stack rounded-xl border border-border-subtle bg-surface-raised p-6 shadow-xs">
          <div className="layout-stack-tight">
            <h3 className="m-0 font-label text-fg">Nivel de estudio</h3>
            <p className="m-0 font-caption text-fg-muted">
              Define la dificultad de tus prácticas sugeridas.
            </p>
          </div>
          <StudyLevelControls
            className={controlClass}
            level={level}
            onChange={onLevelChange}
            footer={
              <div className="mt-3.5">
                <Link
                  href="/assessment"
                  className="font-caption font-semibold text-primary transition-colors hover:text-primary-hover hover:underline"
                >
                  Hacer prueba de nivel →
                </Link>
              </div>
            }
          />
        </section>

        {topicsLevel && onTopicsOpen ? (
          <section className="layout-stack justify-between rounded-xl border border-border-subtle bg-surface-raised p-6 shadow-xs">
            <div className="layout-stack-tight">
              <h3 className="m-0 font-label text-fg">Temas que ya conozco</h3>
              <p className="m-0 font-caption text-fg-muted">
                Marca contenidos de {topicsLevel.toUpperCase()} dominados para optimizar tu ruta diaria.
              </p>
            </div>
            <div className="pt-2">
              <Button type="button" variant="secondary" size="md" onClick={onTopicsOpen}>
                Revisar temas de {topicsLevel.toUpperCase()}
              </Button>
            </div>
          </section>
        ) : null}

        {onInterestsSave && interests != null && (
          <section className="rounded-xl border border-border-subtle bg-surface-raised p-6 shadow-xs md:col-span-2">
            <InterestsEditor interests={interests} onSave={onInterestsSave} bare />
          </section>
        )}
      </div>
    </section>
  );
}
