// Planned structure:
// <HomeCheckpointCard>
//   [if ready]    ready state: title + progreso + CTA al checkpoint
//   [if lessons_missing] missing state: N lecciones restantes + CTA a la primera
//   [otherwise]   no renderiza nada
// </HomeCheckpointCard>

import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import PastelCard from "@/components/layout/PastelCard";
import type { CheckpointReadiness } from "@/lib/home/checkpoint-readiness";

const NEXT_LEVEL_LABEL: Record<string, string> = {
  a1: "A2",
  a2: "B1",
  b1: "B2",
  b2: "C1",
  c1: "C1",
};

interface HomeCheckpointCardProps {
  readiness: CheckpointReadiness;
}

export default function HomeCheckpointCard({ readiness }: HomeCheckpointCardProps) {
  if (readiness.reason === "ready") {
    const nextLevelLabel = NEXT_LEVEL_LABEL[readiness.level] ?? readiness.level.toUpperCase();
    return (
      <PastelCard tone="butter" className="flex flex-col gap-3 rounded-2xl p-5" aria-labelledby="checkpoint-ready-title">
        <h3 id="checkpoint-ready-title" className="font-label font-semibold text-fg">
          Listo para el checkpoint {nextLevelLabel}
        </h3>
        <p className="font-body-sm text-fg-muted">
          {readiness.completedRequired}/{readiness.requiredTotal} lecciones completadas
        </p>
        <Link
          href={`/assessment?mode=checkpoint&level=${readiness.level}`}
          className="focus-ring inline-flex min-h-10 w-fit items-center gap-1.5 rounded-full bg-neutral-900 px-5 py-2.5 font-label font-bold text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
        >
          Ir al checkpoint
          <ArrowRight size={16} aria-hidden />
        </Link>
      </PastelCard>
    );
  }

  if (readiness.reason === "lessons_missing") {
    const nextSlug = readiness.missingSlugs[0];
    return (
      <PastelCard tone="lilac" className="flex flex-col gap-3 rounded-2xl p-5" aria-labelledby="checkpoint-missing-title">
        <h3 id="checkpoint-missing-title" className="font-label font-semibold text-fg">
          Te faltan {readiness.missingSlugs.length} lecciones para el checkpoint
        </h3>
        {nextSlug ? (
          <Link
            href={`/courses/study/${nextSlug}`}
            className="focus-ring inline-flex min-h-10 w-fit items-center gap-1.5 font-body-sm text-fg-muted underline-offset-2 transition-colors hover:text-fg hover:underline"
          >
            Continuar lección
            <ArrowRight size={16} aria-hidden />
          </Link>
        ) : null}
      </PastelCard>
    );
  }

  return null;
}
