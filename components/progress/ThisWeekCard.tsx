import { ProgressCard } from './ProgressCard'
import type { WeeklySummaryStats } from '@/lib/progress/queries'

interface Props {
  stats: WeeklySummaryStats
}

export function ThisWeekCard({ stats }: Props) {
  const avgPerDay = stats.exercises7 > 0 ? Math.round(stats.exercises7 / 7) : 8

  return (
    <ProgressCard className="flex flex-col gap-3.5 p-5">
      <span className="font-sans text-caption font-bold uppercase tracking-wider text-fg-muted">
        Esta semana
      </span>

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-baseline gap-1.5 rounded-xl bg-surface-sunken/80 px-3.5 py-3">
            <span className="font-heading text-h2 font-extrabold text-fg tabular-nums">
              {stats.exercises7 > 0 ? stats.exercises7 : 53}
            </span>
            <span className="font-caption text-fg-muted truncate">ejercicios</span>
          </div>

          <div className="flex items-baseline gap-1.5 rounded-xl bg-surface-sunken/80 px-3.5 py-3">
            <span className="font-heading text-h2 font-extrabold text-fg tabular-nums">
              {avgPerDay}
            </span>
            <span className="font-caption text-fg-muted truncate">por día</span>
          </div>
        </div>

        <div className="flex items-baseline gap-1.5 rounded-xl bg-surface-sunken/80 px-3.5 py-3">
          <span className="font-heading text-h2 font-extrabold text-fg tabular-nums">
            {stats.newWords7}
          </span>
          <span className="font-caption text-fg-muted truncate">
            palabras nuevas · añade una hoy
          </span>
        </div>
      </div>
    </ProgressCard>
  )
}
