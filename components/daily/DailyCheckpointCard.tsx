// Planned structure:
// <DailyCheckpointCard>
//   <ProgressCard>
//     <ProgressCardHeader />
//     [if ready] ReadyState (indicador 100% completado + CTA al examen)
//     [if lessons_missing] MissingLessonsState (barra de progreso + conteo de lecciones restantes)
//     [if no_evidence] NoEvidenceState (nota sobre afianzar vocabulario)
//     [if recent_attempt] RecentAttemptState (nota de espera tras intento reciente)
//   </ProgressCard>
// </DailyCheckpointCard>

import Link from "next/link";
import { ArrowRight, GraduationCap } from "@/components/icons";
import { ProgressCard, ProgressCardHeader } from "@/components/progress/ProgressCard";
import type { CheckpointReadiness } from "@/lib/home/checkpoint-readiness";

const NEXT_LEVEL_LABEL: Record<string, string> = {
  a1: "A2",
  a2: "B1",
  b1: "B2",
  b2: "C1",
  c1: "C1",
};

interface DailyCheckpointCardProps {
  readiness: CheckpointReadiness;
}

export default function DailyCheckpointCard({ readiness }: DailyCheckpointCardProps) {
  const nextLevel = NEXT_LEVEL_LABEL[readiness.level] ?? readiness.level.toUpperCase();

  if (readiness.reason === "ready") {
    return (
      <ProgressCard>
        <ProgressCardHeader
          icon={<GraduationCap size={16} />}
          eyebrow="¡Hito alcanzado!"
          title={`Listo para Checkpoint ${nextLevel}`}
        />
        <div className="flex flex-col gap-3">
          <p className="font-body-sm text-fg-muted">
            Has completado todas las lecciones requeridas ({readiness.completedRequired}/{readiness.requiredTotal}) para desbloquear la prueba de nivel.
          </p>
          <Link
            href={`/assessment?mode=checkpoint&level=${readiness.level}`}
            className="focus-ring inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 font-label text-body-sm font-semibold text-primary-contrast transition-colors hover:bg-primary-hover"
          >
            Hacer checkpoint
            <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
      </ProgressCard>
    );
  }

  if (readiness.reason === "lessons_missing") {
    const missingCount = readiness.missingSlugs.length;
    const progressPct = readiness.requiredTotal > 0
      ? Math.round((readiness.completedRequired / readiness.requiredTotal) * 100)
      : 0;

    return (
      <ProgressCard>
        <ProgressCardHeader
          icon={<GraduationCap size={16} />}
          eyebrow="Siguiente hito"
          title={`Rumbo al Checkpoint ${nextLevel}`}
        />
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-caption text-fg-muted font-medium">
            <span>Progreso de lecciones</span>
            <span className="font-semibold tabular-nums text-fg">
              {readiness.completedRequired}/{readiness.requiredTotal}
            </span>
          </div>

          <div
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progreso rumbo al checkpoint ${nextLevel}`}
            className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken"
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <p className="text-caption text-fg-muted leading-relaxed">
            {missingCount === 1
              ? "Te falta 1 lección para desbloquear el examen."
              : `Te faltan ${missingCount} lecciones para desbloquear el examen.`}
          </p>
        </div>
      </ProgressCard>
    );
  }

  if (readiness.reason === "no_evidence") {
    return (
      <ProgressCard>
        <ProgressCardHeader
          icon={<GraduationCap size={16} />}
          eyebrow="Siguiente hito"
          title={`Checkpoint ${nextLevel}`}
        />
        <p className="text-caption text-fg-muted leading-relaxed">
          Completaste las lecciones, pero necesitas afianzar más vocabulario en tus repasos antes de presentar el examen.
        </p>
      </ProgressCard>
    );
  }

  if (readiness.reason === "recent_attempt") {
    return (
      <ProgressCard>
        <ProgressCardHeader
          icon={<GraduationCap size={16} />}
          eyebrow="Siguiente hito"
          title={`Checkpoint ${nextLevel}`}
        />
        <p className="text-caption text-fg-muted leading-relaxed">
          Presentaste el checkpoint recientemente. Sigue practicando en tu plan diario antes de volver a intentarlo.
        </p>
      </ProgressCard>
    );
  }

  return null;
}
