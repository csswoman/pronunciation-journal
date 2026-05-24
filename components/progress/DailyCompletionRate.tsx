import { CalendarCheck } from 'lucide-react'
import type { DailyCompletionStats } from '@/lib/progress/queries'

interface Props {
  stats: DailyCompletionStats
}

function RateRing({ rate, label, days }: { rate: number; label: string; days: number }) {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const dash = (rate / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-20 w-20">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 72 72">
          {/* Track */}
          <circle
            cx="36" cy="36" r={radius}
            fill="none"
            strokeWidth="6"
            style={{ stroke: 'var(--line-divider)' }}
          />
          {/* Fill */}
          <circle
            cx="36" cy="36" r={radius}
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            style={{ stroke: 'var(--primary)', transition: 'stroke-dasharray 0.5s ease' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-black text-fg">
          {rate}%
        </span>
      </div>
      <div className="text-center">
        <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-fg-muted">
          {label}
        </p>
        <p className="text-xs text-fg-muted">last {days} days</p>
      </div>
    </div>
  )
}

export function DailyCompletionRate({ stats }: Props) {
  const hasData = stats.completedDays30 > 0

  return (
    <div
      className="flex flex-col gap-5 rounded-3xl p-6"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--line-divider)',
        boxShadow: '0 1px 3px var(--line-divider), 0 4px 14px var(--line-divider)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{
            background: 'color-mix(in oklch, var(--primary) 13%, transparent)',
            color: 'var(--primary)',
          }}
        >
          <CalendarCheck size={18} />
        </div>
        <span className="text-sm font-semibold text-fg">Daily Completion</span>
      </div>

      {hasData ? (
        <div className="flex items-center justify-around">
          <RateRing rate={stats.rate7} label="Rate" days={7} />
          <div className="h-16 w-px" style={{ background: 'var(--line-divider)' }} />
          <RateRing rate={stats.rate30} label="Rate" days={30} />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-4">
          <p className="text-sm font-medium text-fg-muted">No daily sessions yet</p>
          <p className="text-xs text-fg-muted">Complete a daily practice to see your consistency.</p>
        </div>
      )}

      <p className="text-center text-xs text-fg-muted">
        {hasData
          ? `${stats.completedDays7} of 7 days · ${stats.completedDays30} of 30 days`
          : 'Start your first daily session'}
      </p>
    </div>
  )
}
