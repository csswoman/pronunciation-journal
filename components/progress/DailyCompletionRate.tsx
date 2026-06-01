import { CalendarCheck } from 'lucide-react'

import type { ConsistencyHeatLevel, DailyCompletionStats } from '@/lib/progress/queries'
import { cn } from '@/lib/cn'

import { ProgressCard, ProgressCardHeader } from './ProgressCard'

interface Props {
  stats: DailyCompletionStats
}

const HEAT_CLASS: Record<ConsistencyHeatLevel, string> = {
  0: 'bg-surface-sunken',
  1: 'bg-[color-mix(in_oklch,var(--primary)_35%,var(--surface-sunken))]',
  2: 'bg-[color-mix(in_oklch,var(--primary)_65%,var(--surface-sunken))]',
  3: 'bg-primary',
}

export function DailyCompletionRate({ stats }: Props) {
  const hasData = stats.completedDays30 > 0 || stats.heatmap30.some((l) => l > 0)

  return (
    <ProgressCard>
      <ProgressCardHeader
        icon={<CalendarCheck size={16} />}
        title="Consistency · this month"
      />

      {hasData ? (
        <>
          <div
            className="mt-1 grid grid-cols-[repeat(15,minmax(0,1fr))] gap-1"
            aria-label="Daily practice heatmap for the last 30 days"
          >
            {stats.heatmap30.map((level, i) => (
              <span
                key={i}
                className={cn('aspect-square rounded-xs', HEAT_CLASS[level])}
              />
            ))}
          </div>
          <div className="mt-3 flex justify-between text-body-sm text-fg-muted">
            <span>
              <b className="font-display font-normal text-fg">{stats.completedDays30}</b> of 30 days
            </span>
            <span>{stats.rate30}% of the month</span>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <p className="text-sm font-medium text-fg-muted">No daily sessions yet</p>
          <p className="text-xs text-fg-muted">
            Complete a daily practice to see your consistency.
          </p>
        </div>
      )}
    </ProgressCard>
  )
}
