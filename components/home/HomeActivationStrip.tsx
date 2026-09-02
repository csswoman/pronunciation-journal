// Planned structure:
// <HomeActivationStrip>
//   title + why-it-matters
//   secondary path → Sound Lab · quieter → courses
//   optional quiet assessment links
//   optional guest save inline
// </HomeActivationStrip>

import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import Button from "@/components/ui/Button";
import GuestSaveProgressBanner from "@/components/home/GuestSaveProgressBanner";

interface HomeActivationStripProps {
  showPlacementLink?: boolean;
  showPronunciationLink?: boolean;
  /** Soft save cue so explore stays practice-first. */
  showGuestSaveInline?: boolean;
}

/**
 * First-visit empty plan — one path to value (practice), not a dual assessment wall.
 * Assessments stay optional text links. Solid hue CTA lives on "Empieza aquí" when a plan exists.
 */
export default function HomeActivationStrip({
  showPlacementLink = false,
  showPronunciationLink = false,
  showGuestSaveInline = false,
}: HomeActivationStripProps) {
  const showAssessments = showPlacementLink || showPronunciationLink;

  return (
    <div
      className="flex flex-col gap-5 py-2 animate-in fade-in"
      aria-labelledby="home-activation-title"
    >
      <div className="min-w-0 flex flex-col gap-1.5">
        <h2
          id="home-activation-title"
          className="text-h3 font-bold text-balance text-fg"
        >
          Una práctica ahora — sin cuenta
        </h2>
        <p className="font-body-sm max-w-[60ch] text-pretty text-fg-muted">
          El plan se arma al practicar. Empieza con sonidos o un curso corto; no hace
          falta saber IPA para sentir el progreso.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Link href="/practice/sounds" className="shrink-0">
          <Button
            variant="primary"
            size="md"
            icon={<ArrowRight size={16} aria-hidden />}
            iconPosition="right"
          >
            Abrir laboratorio
          </Button>
        </Link>
        <Link
          href="/courses"
          className="focus-ring inline-flex min-h-10 items-center gap-1.5 font-body-sm font-medium text-fg-muted underline-offset-2 transition-colors hover:text-fg hover:underline"
        >
          Explorar cursos
          <ArrowRight size={16} aria-hidden />
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
    </div>
  );
}
