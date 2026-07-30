"use client";

import { Play } from "@/components/icons";
import type { Lesson } from "@/lib/types";
import { ipaFromLessonTitle } from "@/lib/sound-lab/display";

interface Props {
  totalCount: number;
  inProgressCount: number;
  heroLesson: Lesson | null;
  onResume?: () => void;
}

function headerStatsLine(inProgressCount: number, totalCount: number): string {
  if (inProgressCount > 0) {
    return `${inProgressCount} de ${totalCount} sonidos en curso`;
  }
  if (totalCount === 1) {
    return "1 sonido listo para practicar";
  }
  return `${totalCount} sonidos listos para practicar`;
}

function continueCtaLabel(lesson: Lesson | null): string {
  const ipa = lesson ? ipaFromLessonTitle(lesson.title) : null;
  if (ipa) return `Continuar ${ipa}`;
  return "Continuar lección";
}

export function SoundLabHeader({
  totalCount,
  inProgressCount,
  heroLesson,
  onResume,
}: Props) {
  const showResume = Boolean(heroLesson && onResume);
  const statsLine = headerStatsLine(inProgressCount, totalCount);

  return (
    <div className="sound-lab__utility-bar">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="font-kicker text-fg-subtle">Práctica</span>
        <h1 className="truncate font-h3 text-fg">Laboratorio de sonidos</h1>
        <span className="truncate font-body-sm text-fg-muted">{statsLine}</span>
      </div>
      {showResume ? (
        <button type="button" className="sound-lab__resume-button" onClick={onResume}>
          <Play className="h-3.5 w-3.5 fill-current" aria-hidden />
          {continueCtaLabel(heroLesson)}
        </button>
      ) : null}
    </div>
  );
}
