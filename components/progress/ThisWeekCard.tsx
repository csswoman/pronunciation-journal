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
        <p className="py-2 text-center text-body-sm text-fg-muted">
          Practica esta semana para ver el resumen de tu actividad.
        </p>
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
