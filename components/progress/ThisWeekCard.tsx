import { TrendingUp } from 'lucide-react'

import type { WeeklySummaryStats } from '@/lib/progress/queries'

import { ProgressCard, ProgressCardHeader } from './ProgressCard'

interface Props {
  stats: WeeklySummaryStats
}

export function ThisWeekCard({ stats }: Props) {
  const hasData = stats.exercises7 > 0 || stats.newWords7 > 0

  return (
    <ProgressCard>
      <ProgressCardHeader icon={<TrendingUp size={16} />} title="This week" />

      {hasData ? (
        <div className="mt-2 grid grid-cols-2 gap-3.5 sm:grid-cols-3">
          <WeekStat value={stats.exercises7} label="Exercises" />
          <WeekStat value={stats.newWords7} label="New words" />
          <WeekStat
            value={stats.exercises7 > 0 ? Math.round(stats.exercises7 / 7) : 0}
            label="Avg / day"
            className="col-span-2 sm:col-span-1"
          />
        </div>
      ) : (
        <p className="py-3 text-center text-sm text-fg-muted">
          Practice this week to see your activity summary.
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
        'rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken px-4 py-4 text-center',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <b className="block font-display text-h3 leading-none text-primary">{value}</b>
      <span className="mt-1.5 block text-caption uppercase tracking-[0.06em] text-fg-subtle">
        {label}
      </span>
    </div>
  )
}
