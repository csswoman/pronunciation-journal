// Planned structure:
// <AccumulatedPracticeCard>
//   <CardHeader kicker="PRÁCTICA ACUMULADA" />
//   <MetricsGrid2x2>
//     <MetricBox value={exercises} label="ejercicios" />
//     <MetricBox value={minutes} label="minutos" />
//     <MetricBox value={evidencedPatterns} label="patrones logrados" />
//     <MetricBox value={reviewPatterns} label="por afianzar" />
//   </MetricsGrid2x2>
//   <CardFooter sessions={sessions} activeDays={activeDays} lessons={completedLessons} />
// </AccumulatedPracticeCard>

import type { ProgressProjections } from "@/lib/progress/projections";

interface Props {
  data: ProgressProjections;
}

export function AccumulatedPracticeCard({ data }: Props) {
  const minutes = Math.round(data.activity.durationMs / 60_000);
  const { exercises, sessions, activeDays } = data.activity;
  const evidenced = data.learning.evidencedTargets;
  const review = data.learning.reviewTargets;
  const completedLessons = data.coverage.completed;

  const hasData = sessions > 0 || exercises > 0;

  if (!hasData) {
    return (
      <div className="flex flex-col justify-between rounded-3xl border border-border-subtle bg-surface-raised p-6">
        <span className="font-kicker font-bold text-xs uppercase tracking-wider text-fg-subtle">
          PRÁCTICA ACUMULADA
        </span>
        <p className="py-6 text-center text-xs text-fg-muted">
          Aún no hay práctica registrada. Empieza una sesión para ver tus totales aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between rounded-3xl border border-border-subtle bg-surface-raised p-6">
      {/* Header */}
      <div>
        <span className="font-kicker font-bold text-xs uppercase tracking-wider text-fg-subtle">
          PRÁCTICA ACUMULADA
        </span>

        {/* 2x2 Grid */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border-subtle/50 bg-surface-sunken p-4 flex flex-col justify-center">
            <span className="font-display text-2xl sm:text-3xl font-extrabold text-fg leading-none">
              {exercises}
            </span>
            <span className="text-xs text-fg-muted font-medium mt-1">
              ejercicios
            </span>
          </div>

          <div className="rounded-2xl border border-border-subtle/50 bg-surface-sunken p-4 flex flex-col justify-center">
            <span className="font-display text-2xl sm:text-3xl font-extrabold text-fg leading-none">
              {minutes}
            </span>
            <span className="text-xs text-fg-muted font-medium mt-1">
              minutos
            </span>
          </div>

          <div className="rounded-2xl border border-border-subtle/50 bg-surface-sunken p-4 flex flex-col justify-center">
            <span className="font-display text-2xl sm:text-3xl font-extrabold text-fg leading-none">
              {evidenced}
            </span>
            <span className="text-xs text-fg-muted font-medium mt-1">
              patrones logrados
            </span>
          </div>

          <div className="rounded-2xl border border-border-subtle/50 bg-surface-sunken p-4 flex flex-col justify-center">
            <span className="font-display text-2xl sm:text-3xl font-extrabold text-fg leading-none">
              {review}
            </span>
            <span className="text-xs text-fg-muted font-medium mt-1">
              por afianzar
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-4 text-xs text-fg-subtle font-medium">
        {sessions} sesiones · {activeDays} días activos · {completedLessons} lecciones completadas
      </p>
    </div>
  );
}
