// Planned structure:
// <DailyProgressSidebar>
//   <StreakCard />              (racha actual / mejor)
//   <WeeklyConsistencyCard />   (7 días)
//   <ThisWeekCard />            (ejercicios y palabras de la semana)
//   link → /progress
//
// Columna lateral de /daily: el corte semanal del progreso. Vive aquí para que
// el contenido del día no crezca hacia abajo. La vista mensual y el detalle
// completo siguen en /progress.

import Link from 'next/link'
import { ArrowRight } from '@/components/icons'
import { StreakCard } from '@/components/progress/StreakCard'
import { ThisWeekCard } from '@/components/progress/ThisWeekCard'
import WeeklyConsistencyCard from './WeeklyConsistencyCard'
import type { WeeklyProgressData } from '@/lib/progress/weekly-queries'

interface Props {
  data: WeeklyProgressData
}

export default function DailyProgressSidebar({ data }: Props) {
  return (
    <aside
      aria-label="Tu progreso semanal"
      className="flex min-w-0 flex-col gap-4 self-start lg:sticky lg:top-[calc(var(--layout-page-block)+0.5rem)]"
    >
      <StreakCard streak={data.streak} />
      <WeeklyConsistencyCard
        heatmap7={data.heatmap7}
        completedDays7={data.completedDays7}
        rate7={data.rate7}
      />
      <ThisWeekCard stats={data.summary} />

      <Link
        href="/progress"
        className="focus-ring inline-flex min-h-11 items-center gap-1.5 self-start rounded-md px-1 font-label text-body-sm text-fg-muted transition-colors hover:text-primary"
      >
        Ver progreso completo
        <ArrowRight size={16} aria-hidden />
      </Link>
    </aside>
  )
}
