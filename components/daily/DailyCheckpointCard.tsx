// Planned structure:
// <DailyCheckpointCard>
//   <PastelCard tone="mint">
//     <Header> (Icon + Eyebrow Pill + Title)
//     [if ready] ReadyState (descripción + CTA al examen)
//     [if lessons_missing] MissingLessonsState (stat row + barra de progreso con borde + desc + CTA)
//     [if no_evidence] NoEvidenceState (nota sobre afianzar vocabulario + CTA)
//     [if recent_attempt] RecentAttemptState (nota de espera tras intento reciente + CTA)
//   </PastelCard>
// </DailyCheckpointCard>

import Link from "next/link";
import { ArrowRight, GraduationCap } from "@/components/icons";
import PastelCard from "@/components/layout/PastelCard";
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
      <PastelCard tone="mint" className="flex flex-col gap-4 rounded-3xl p-5 sm:p-6 shadow-md hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-fg bg-transparent text-fg shadow-xs">
            <GraduationCap size={22} strokeWidth={2} />
          </div>

          <div className="flex flex-col gap-1 min-w-0">
            <span className="inline-flex w-fit items-center rounded-full bg-ink px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-paper leading-snug shadow-xs">
              ¡Hito alcanzado!
            </span>
            <h3 className="font-display text-[20px] font-extrabold leading-tight text-fg tracking-tight">
              Listo para Checkpoint {nextLevel}
            </h3>
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          <p className="font-sans text-caption font-medium text-fg-muted leading-relaxed">
            Has completado todas las lecciones requeridas ({readiness.completedRequired}/{readiness.requiredTotal}) para desbloquear la prueba de nivel.
          </p>
          <Link
            href={`/assessment?mode=checkpoint&level=${readiness.level}`}
            className="focus-ring inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 font-display text-body-sm font-extrabold text-paper shadow-md transition-all active:scale-[0.98] hover:bg-ink/90 hover:shadow-lg"
          >
            <span>Hacer checkpoint</span>
            <ArrowRight size={16} strokeWidth={2.5} aria-hidden />
          </Link>
        </div>
      </PastelCard>
    );
  }

  if (readiness.reason === "lessons_missing") {
    const missingCount = readiness.missingSlugs.length;
    const progressPct = readiness.requiredTotal > 0
      ? Math.round((readiness.completedRequired / readiness.requiredTotal) * 100)
      : 0;

    const nextLessonHref = readiness.missingSlugs.length > 0
      ? `/lessons/${readiness.missingSlugs[0]}`
      : "/daily";

    return (
      <PastelCard tone="mint" className="flex flex-col gap-4.5 rounded-3xl p-5 sm:p-6 shadow-md hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-fg bg-transparent text-fg shadow-xs">
            <GraduationCap size={22} strokeWidth={2} />
          </div>

          <div className="flex flex-col gap-1 min-w-0">
            <span className="inline-flex w-fit items-center rounded-full bg-ink px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-paper leading-snug shadow-xs">
              Siguiente hito
            </span>
            <h3 className="font-display text-[20px] font-extrabold leading-tight text-fg tracking-tight">
              Rumbo al Checkpoint {nextLevel}
            </h3>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-body-sm text-fg">
            <span className="font-sans text-caption font-semibold text-fg-muted">
              Progreso de lecciones
            </span>
            <span className="font-display text-[20px] font-extrabold text-fg tabular-nums">
              {readiness.completedRequired}/{readiness.requiredTotal}
            </span>
          </div>

          <div
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progreso rumbo al checkpoint ${nextLevel}`}
            className="h-3.5 w-full overflow-hidden rounded-full border-2 border-fg bg-transparent p-0.5 shadow-inner"
          >
            <div
              className="h-full rounded-full bg-fg transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <p className="font-sans text-caption font-medium text-fg-muted leading-relaxed">
            {missingCount === 1
              ? "Te falta 1 lección para desbloquear el examen."
              : `Te faltan ${missingCount} lecciones para desbloquear el examen.`}
          </p>
        </div>

        <Link
          href={nextLessonHref}
          className="focus-ring mt-0.5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 font-display text-body-sm font-extrabold text-paper shadow-md transition-all active:scale-[0.98] hover:bg-ink/90 hover:shadow-lg"
        >
          <span>Seguir con la lección</span>
          <ArrowRight size={16} strokeWidth={2.5} aria-hidden />
        </Link>
      </PastelCard>
    );
  }

  if (readiness.reason === "no_evidence") {
    return (
      <PastelCard tone="mint" className="flex flex-col gap-4 rounded-3xl p-5 sm:p-6 shadow-md hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-fg bg-transparent text-fg shadow-xs">
            <GraduationCap size={22} strokeWidth={2} />
          </div>

          <div className="flex flex-col gap-1 min-w-0">
            <span className="inline-flex w-fit items-center rounded-full bg-ink px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-paper leading-snug shadow-xs">
              Siguiente hito
            </span>
            <h3 className="font-display text-[20px] font-extrabold leading-tight text-fg tracking-tight">
              Checkpoint {nextLevel}
            </h3>
          </div>
        </div>

        <p className="font-sans text-caption font-medium text-fg-muted leading-relaxed">
          Completaste las lecciones, pero necesitas afianzar más vocabulario en tus repasos antes de presentar el examen.
        </p>

        <Link
          href="/practice"
          className="focus-ring mt-0.5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 font-display text-body-sm font-extrabold text-paper shadow-md transition-all active:scale-[0.98] hover:bg-ink/90 hover:shadow-lg"
        >
          <span>Ir a repasar</span>
          <ArrowRight size={16} strokeWidth={2.5} aria-hidden />
        </Link>
      </PastelCard>
    );
  }

  if (readiness.reason === "recent_attempt") {
    return (
      <PastelCard tone="mint" className="flex flex-col gap-4 rounded-3xl p-5 sm:p-6 shadow-md hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-fg bg-transparent text-fg shadow-xs">
            <GraduationCap size={22} strokeWidth={2} />
          </div>

          <div className="flex flex-col gap-1 min-w-0">
            <span className="inline-flex w-fit items-center rounded-full bg-ink px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-paper leading-snug shadow-xs">
              Siguiente hito
            </span>
            <h3 className="font-display text-[20px] font-extrabold leading-tight text-fg tracking-tight">
              Checkpoint {nextLevel}
            </h3>
          </div>
        </div>

        <p className="font-sans text-caption font-medium text-fg-muted leading-relaxed">
          Presentaste el checkpoint recientemente. Sigue practicando en tu plan diario antes de volver a intentarlo.
        </p>

        <Link
          href="/daily"
          className="focus-ring mt-0.5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 font-display text-body-sm font-extrabold text-paper shadow-md transition-all active:scale-[0.98] hover:bg-ink/90 hover:shadow-lg"
        >
          <span>Ir al plan diario</span>
          <ArrowRight size={16} strokeWidth={2.5} aria-hidden />
        </Link>
      </PastelCard>
    );
  }

  return null;
}

