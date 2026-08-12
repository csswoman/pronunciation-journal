"use client";

// Planned structure:
// <ProfilePreferencesPanel>
//   <ThemeControls />
//   <SoundControls />
//   <StudyLevelControls footer={assessment links} />
//   <InterestsEditor />   — only when onSave provided
// </ProfilePreferencesPanel>

import Link from "next/link";
import {
  SoundControls,
  StudyLevelControls,
  ThemeControls,
} from "@/components/layout/QuickSettingsControls";
import InterestsEditor from "@/components/profile/InterestsEditor";
import type { CefrLevel } from "@/lib/essential-words/types";
import type { Interest } from "@/lib/users/interests";

const controlClass = "border-t-0 px-5 py-4";

interface Props {
  level: CefrLevel;
  onLevelChange: (next: CefrLevel) => void;
  interests?: readonly Interest[];
  onInterestsSave?: (interests: Interest[]) => Promise<void>;
  hint?: string;
}

export default function ProfilePreferencesPanel({
  level,
  onLevelChange,
  interests,
  onInterestsSave,
  hint = "Esto ajusta recomendaciones. Tu progreso se conserva; puedes seguir explorando cualquier contenido.",
}: Props) {
  return (
    <section aria-labelledby="profile-prefs-title" className="layout-stack-loose">
      <div className="layout-stack-tight px-0.5">
        <h2 id="profile-prefs-title" className="font-label text-fg m-0">
          Preferencias
        </h2>
        <p className="font-caption text-fg-muted m-0">{hint}</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface-raised divide-y divide-border-subtle">
        <ThemeControls className={controlClass} />
        <SoundControls className={controlClass} />
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
        {onInterestsSave && interests != null && (
          <div className="px-5 py-4">
            <InterestsEditor interests={interests} onSave={onInterestsSave} bare />
          </div>
        )}
      </div>
    </section>
  );
}
