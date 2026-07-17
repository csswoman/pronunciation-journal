"use client";

import { Play } from "@/components/icons";
import PageHeader from "@/components/layout/PageHeader";
import type { Lesson } from "@/lib/types";
import { ipaFromLessonTitle } from "@/lib/sound-lab/display";
import { SoundLabContinuingBar } from "./SoundLabContinuingBar";

// Planned structure:
// <SoundLabHeader>
//   <PageHeader />
//   <SoundLabContinuingBar /> (when hero lesson exists)
// </SoundLabHeader>

interface Props {
  totalCount: number;
  inProgressCount: number;
  heroLesson: Lesson | null;
  heroProgress: number;
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
  heroProgress,
  onResume,
}: Props) {
  const showResume = Boolean(heroLesson && onResume);
  const statsLine = headerStatsLine(inProgressCount, totalCount);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        kicker="Practice"
        title="Sound Lab"
        subtitle={statsLine}
        primaryCta={
          showResume
            ? {
                label: continueCtaLabel(heroLesson),
                icon: <Play className="h-3.5 w-3.5 fill-current" aria-hidden />,
                onClick: onResume!,
              }
            : undefined
        }
      />
      {heroLesson && (
        <div className="sound-lab__continuing-below">
          <SoundLabContinuingBar lesson={heroLesson} progress={heroProgress} />
        </div>
      )}
    </div>
  );
}
