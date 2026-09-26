// Planned structure:
// <DailyProgressSidebar>
//   <StreakCard />              (racha actual / mejor)
//   <WeeklyConsistencyCard />   (7 días)
//   [if checkpointReadiness] <DailyCheckpointCard /> (rumbo al checkpoint)
//   <ThisWeekCard />            (ejercicios y palabras de la semana)
//   link → /progress
//
// Columna lateral de /daily: el corte semanal del progreso. Vive aquí para que
// el contenido del día no crezca hacia abajo. La vista mensual y el detalle
// completo siguen en /progress.

import Link from 'next/link'
import { ArrowRight } from '@/components/icons'
import { ThisWeekCard } from '@/components/progress/ThisWeekCard'
import PastelCard from '@/components/layout/PastelCard'
import WeeklyConsistencyCard from './WeeklyConsistencyCard'
import DailyCheckpointCard from './DailyCheckpointCard'
import type { WeeklyProgressData } from '@/lib/progress/weekly-queries'
import type { CheckpointReadiness } from '@/lib/home/checkpoint-readiness'

interface Props {
  data: WeeklyProgressData
  checkpointReadiness?: CheckpointReadiness | null
}

export default function DailyProgressSidebar({ data, checkpointReadiness }: Props) {
  return (
    <aside
      aria-label="Tu progreso semanal"
      className="flex min-w-0 flex-col gap-4 self-start lg:sticky lg:top-[calc(var(--layout-page-block)+0.5rem)]"
    >
      <WeeklyConsistencyCard
        heatmap7={data.heatmap7}
        completedDays7={data.completedDays7}
        rate7={data.rate7}
      />

      <ThisWeekCard stats={data.summary} />

      {/* Tarjeta Mañana */}
      <PastelCard tone="sky" className="flex flex-col gap-2.5 p-5 motion-reduce:shadow-none">
        <span className="font-sans text-caption font-bold uppercase tracking-wider text-ink-muted">
          Mañana
        </span>
        <div className="flex items-baseline gap-2">
          <span className="font-heading text-h1 font-extrabold text-ink tabular-nums">
            29
          </span>
          <span className="font-body-md font-bold text-ink-secondary">
            repasos
          </span>
        </div>
        <p className="font-body-sm text-ink-secondary">
          Si haces hoy la sesión completa, mañana bajan a 23.
        </p>
      </PastelCard>

      {checkpointReadiness ? (
        <DailyCheckpointCard readiness={checkpointReadiness} />
      ) : null}

      <Link
        href="/progress"
        className="focus-ring inline-flex min-h-11 items-center gap-1.5 self-start rounded-md px-1 font-label text-body-sm font-semibold text-fg transition-colors hover:text-primary"
      >
        Ver progreso completo
        <ArrowRight size={16} aria-hidden />
      </Link>
    </aside>
  )
}
