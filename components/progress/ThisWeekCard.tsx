import { TrendingUp } from "@/components/icons"

import type { WeeklySummaryStats } from '@/lib/progress/queries'

import { ProgressCard, ProgressCardHeader } from './ProgressCard'

interface Props {
  stats: WeeklySummaryStats
}

export function ThisWeekCard({ stats }: Props) {
  const hasData = stats.exercises7 > 0 || stats.newWords7 > 0

  return (
    <ProgressCard>
      <ProgressCardHeader icon={<TrendingUp size={16} />} title="Esta semana" />

      {hasData ? (
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          <WeekStat value={stats.exercises7} label="Ejercicios" />
          <WeekStat value={stats.newWords7} label="Palabras nuevas" />
          <WeekStat
            value={stats.exercises7 > 0 ? Math.round(stats.exercises7 / 7) : 0}
            label="Promedio / día"
            className="col-span-2"
          />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1.5 py-4 text-center">
          <p className="text-body-sm font-semibold text-fg">Sin actividad esta semana</p>
          <p className="text-caption text-fg-muted max-w-[220px]">
            Realiza una sesión para ver tu volumen de ejercicios y palabras nuevas.
          </p>
        </div>
      )}
    </ProgressCard>
  )
}

function WeekStat({
  value,
  label,
  className,
}: {
  value: number | string
  label: string
  className?: string
}) {
  return (
    <div
      className={[
        'rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken px-3 py-2.5 text-center',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <b className="block text-h3 leading-none text-primary">{value}</b>
      <span className="mt-1 block font-kicker text-fg-subtle">
        {label}
      </span>
    </div>
  )
}
