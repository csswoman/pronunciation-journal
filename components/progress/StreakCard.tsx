import { Flame } from 'lucide-react'

import type { DailyStreakResult } from '@/lib/daily/streak'

import { ProgressCard, ProgressCardHeader } from './ProgressCard'

interface Props {
  streak: DailyStreakResult
}

function WeekDots({
  streakDays,
  completedToday,
}: {
  streakDays: number
  completedToday: boolean
}) {
  const filled = Math.min(6, Math.max(0, streakDays - (completedToday ? 1 : 0)))

  return (
    <div className="mt-4 flex justify-center gap-1.5" aria-hidden>
      {Array.from({ length: 7 }).map((_, i) => {
        const isToday = i === 6
        const isOn = !isToday && i < filled
        return (
          <span
            key={i}
            className={[
              'h-3 w-3 rounded-xs',
              isToday
                ? completedToday
                  ? 'bg-[var(--stage-pairs)]'
                  : 'bg-primary shadow-[0_0_0_3px_var(--accent-dim)]'
                : isOn
                  ? 'bg-[var(--stage-pairs)]'
                  : 'bg-surface-sunken',
            ].join(' ')}
          />
        )
      })}
    </div>
  )
}

function StreakValue({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <div className="text-center">
      <div
        className={[
          'font-display text-h1 leading-none',
          accent ? 'text-[var(--stage-pairs)]' : 'text-fg',
        ].join(' ')}
      >
        {value}
      </div>
      <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-fg-subtle">
        {label}
      </div>
    </div>
  )
}

export function StreakCard({ streak }: Props) {
  const { currentStreak, maxStreak, completedToday } = streak

  return (
    <ProgressCard>
      <ProgressCardHeader icon={<Flame size={16} />} title="Daily streak" />

      <div className="mt-1 flex items-center justify-around">
        <StreakValue value={currentStreak} label="Current" accent />
        <div className="h-[46px] w-px bg-border-subtle" />
        <StreakValue value={maxStreak} label="Best" />
      </div>

      <WeekDots streakDays={currentStreak} completedToday={completedToday} />
    </ProgressCard>
  )
}
