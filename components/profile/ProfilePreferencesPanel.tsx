"use client";

// Planned structure:
// <ProfilePreferencesPanel>
//   <StudyLevelControls footer={assessment links} />
//   <TopicsKnown />
//   <InterestsEditor />   — only when onSave provided
// </ProfilePreferencesPanel>

import Link from "next/link";
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
  hint = "Esto ajusta recomendaciones. Tu progreso se conserva; puedes seguir explorando cualquier contenido.",
}: Props) {
  return (
    <section aria-labelledby="profile-prefs-title" className="layout-stack-loose">
      <div className="layout-stack-tight px-0.5">
        <h2 id="profile-prefs-title" className="font-label text-fg m-0">
          Cómo quieres aprender
        </h2>
        <p className="font-caption text-fg-muted m-0">{hint}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="layout-stack rounded-xl border border-border-subtle bg-surface-raised p-5">
          <div className="layout-stack-tight">
            <h3 className="m-0 font-label text-fg">Nivel de estudio</h3>
            <p className="m-0 font-caption text-fg-muted">
              Ajusta la dificultad de las recomendaciones. Tu progreso no cambia.
            </p>
          </div>
          <StudyLevelControls
            className={controlClass}
            level={level}
            onChange={onLevelChange}
            footer={
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                <Link
                  href="/assessment"
                  className="font-caption font-semibold text-primary hover:text-primary-hover"
                >
                  Hacer prueba de nivel
                </Link>
                <Link
                  href={`/assessment?mode=checkpoint&level=${level.toLowerCase()}`}
                  className="font-caption text-fg-muted hover:text-fg"
                >
                  Comprobar mi nivel actual
                </Link>
              </div>
            }
          />
        </section>

        {topicsLevel && onTopicsOpen ? (
          <section className="layout-stack rounded-xl border border-border-subtle bg-surface-raised p-5">
            <div className="layout-stack-tight">
              <h3 className="m-0 font-label text-fg">Temas que ya conozco</h3>
              <p className="m-0 font-caption text-fg-muted">
                Indica qué temas de {topicsLevel.toUpperCase()} ya has trabajado para que tu ruta no los priorice.
              </p>
            </div>
            <button
              type="button"
              onClick={onTopicsOpen}
              className="focus-ring min-h-10 w-fit rounded-md border border-border-default px-3 font-label text-fg hover:bg-surface-sunken"
            >
              Revisar temas de {topicsLevel.toUpperCase()}
            </button>
          </section>
        ) : null}

        {onInterestsSave && interests != null && (
          <section className="rounded-xl border border-border-subtle bg-surface-raised p-5 md:col-span-2">
            <InterestsEditor interests={interests} onSave={onInterestsSave} bare />
          </section>
        )}
      </div>
    </section>
  );
}
