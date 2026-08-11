// Planned structure:
// <HomeActivationStrip>
//   title + why-it-matters
//   primary → Sound Lab · secondary → courses
//   optional quiet assessment links
//   optional guest save inline
// </HomeActivationStrip>

import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import GuestSaveProgressBanner from "@/components/home/GuestSaveProgressBanner";

interface HomeActivationStripProps {
  showPlacementLink?: boolean;
  showPronunciationLink?: boolean;
  /** Soft save cue so explore stays practice-first. */
  showGuestSaveInline?: boolean;
}

/**
 * First-visit empty plan — one path to value (practice), not a dual assessment wall.
 * Assessments stay optional text links.
 */
export default function HomeActivationStrip({
  showPlacementLink = false,
  showPronunciationLink = false,
  showGuestSaveInline = false,
}: HomeActivationStripProps) {
  const showAssessments = showPlacementLink || showPronunciationLink;

  return (
    <section
      className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface-raised px-4 py-4 sm:px-5"
      aria-labelledby="home-activation-title"
    >
      <div className="min-w-0 flex flex-col gap-1">
        <h2
          id="home-activation-title"
          className="font-label font-semibold text-balance text-fg"
        >
          Una práctica ahora — sin cuenta
        </h2>
        <p className="font-body-sm max-w-[60ch] text-pretty text-fg-muted">
          El plan se arma al practicar. Empieza con sonidos o un curso corto; no hace
          falta saber IPA para sentir el progreso.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Link
          href="/practice/sounds"
          className="focus-ring inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-md bg-primary px-4 font-label text-on-primary transition-colors hover:bg-primary-hover"
        >
          Abrir laboratorio
          <ArrowRight size={16} aria-hidden />
        </Link>
        <Link
          href="/courses"
          className="focus-ring inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-md border border-border-default bg-transparent px-4 font-label text-fg transition-colors hover:bg-surface-sunken"
        >
          Explorar cursos
        </Link>
      </div>

      {showAssessments ? (
        <p className="font-body-sm text-fg-muted">
          Si quieres afinar la ruta primero:{" "}
          {showPlacementLink ? (
            <Link
              href="/assessment"
              className="focus-ring font-medium text-fg underline-offset-2 hover:underline"
            >
              prueba de nivel
            </Link>
          ) : null}
          {showPlacementLink && showPronunciationLink ? (
            <span aria-hidden> · </span>
          ) : null}
          {showPronunciationLink ? (
            <Link
              href="/assessment/pronunciation"
              className="focus-ring font-medium text-fg underline-offset-2 hover:underline"
            >
              diagnóstico oral
            </Link>
          ) : null}
          .
        </p>
      ) : null}

      {showGuestSaveInline ? <GuestSaveProgressBanner variant="inline" /> : null}
    </section>
  );
}
