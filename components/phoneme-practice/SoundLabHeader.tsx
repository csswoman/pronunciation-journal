"use client";

import Link from "next/link";
import { Play } from "@/components/icons";
import PageHeader from "@/components/layout/PageHeader";
import type { Lesson } from "@/lib/types";
import { ipaFromLessonTitle } from "@/lib/sound-lab/display";

// Planned structure:
// <SoundLabHeader>
//   <PageHeader />
//   <path link />
// </SoundLabHeader>

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
    <div className="flex min-w-0 flex-col gap-3">
      <PageHeader
        kicker="Práctica"
        title="Laboratorio de sonidos"
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
      <p className="font-body-sm text-fg-muted">
        ¿Vienes del diagnóstico?{" "}
        <Link
          href="/courses/pronunciation"
          className="font-label text-fg underline-offset-2 hover:underline"
        >
          Abre tu ruta de pronunciación
        </Link>
      </p>
    </div>
  );
}
