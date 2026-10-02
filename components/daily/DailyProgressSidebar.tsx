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

import { ThisWeekCard } from '@/components/progress/ThisWeekCard'
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

      {checkpointReadiness ? (
        <DailyCheckpointCard readiness={checkpointReadiness} />
      ) : null}
    </aside>
  )
}

