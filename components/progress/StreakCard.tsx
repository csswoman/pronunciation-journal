import { Flame } from 'lucide-react'

import type { DailyStreakResult } from '@/lib/daily/streak'

interface Props {
  streak: DailyStreakResult
}

function StreakNumber({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-5xl font-black tracking-tight text-fg">{value}</span>
      <span className="text-tiny font-semibold uppercase tracking-[0.18em] text-fg-muted">{label}</span>
    </div>
  )
}

export function StreakCard({ streak }: Props) {
  const { currentStreak, maxStreak, completedToday } = streak
  const hasStreak = currentStreak > 0

  return (
    <div
      className="flex flex-col gap-5 rounded-3xl p-6"
      style={{
        background: hasStreak
          ? 'linear-gradient(145deg, color-mix(in oklch, var(--primary) 14%, var(--card-bg)), var(--card-bg))'
          : 'var(--card-bg)',
        border: '1px solid var(--line-divider)',
        boxShadow: '0 1px 3px var(--line-divider), 0 4px 14px var(--line-divider)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{
              background: 'color-mix(in oklch, var(--primary) 13%, transparent)',
              color: 'var(--primary)',
            }}
          >
            <Flame size={18} />
          </div>
          <span className="text-sm font-semibold text-fg">Daily Streak</span>
        </div>
        {completedToday && (
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              background: 'color-mix(in oklch, var(--primary) 15%, transparent)',
              color: 'var(--primary)',
            }}
          >
            Done today
          </span>
        )}
      </div>

      {/* Numbers */}
      <div className="flex items-center justify-around">
        <StreakNumber value={currentStreak} label="Current" />
        <div className="h-12 w-px" style={{ background: 'var(--line-divider)' }} />
        <StreakNumber value={maxStreak} label="Best" />
      </div>

      {/* Footer message */}
      <p className="text-center text-xs leading-5 text-fg-muted">
        {currentStreak === 0
          ? 'Complete today\'s daily to start your streak.'
          : completedToday
          ? `${currentStreak} day${currentStreak !== 1 ? 's' : ''} and counting — keep it up!`
          : 'Practice today to keep your streak alive.'}
      </p>
    </div>
  )
}
