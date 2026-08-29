import { Flame } from "@/components/icons"

import type { DailyStreakResult } from '@/lib/daily/streak-core'

import { ProgressCard, ProgressCardHeader } from './ProgressCard'

interface Props {
  streak: DailyStreakResult
}

function StreakValue({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <div className="text-center">
      <div
        className={[
          'text-h1 leading-none',
          accent ? 'text-[var(--accent-2)]' : 'text-fg',
        ].join(' ')}
      >
        {value}
      </div>
      <div className="mt-1.5 font-kicker font-semibold text-fg-subtle">
        {label}
      </div>
    </div>
  )
}

export function StreakCard({ streak }: Props) {
  const { currentStreak, maxStreak, completedToday } = streak

  return (
    <ProgressCard>
      <ProgressCardHeader icon={<Flame size={16} />} title="Racha diaria" />

      <div className="mt-1 flex items-center justify-around gap-2 px-2">
        <StreakValue value={currentStreak} label="Actual" accent />
        <div className="h-[46px] w-px bg-border-subtle" />
        <StreakValue value={maxStreak} label="Mejor" />
      </div>

      <p className="mt-1 text-center text-caption text-fg-muted">
        {completedToday
          ? 'Hoy ya cuenta. Vuelve mañana para sumar.'
          : currentStreak > 0
            ? 'Practica hoy para no perder la racha.'
            : 'Completa el plan de hoy para empezar una racha.'}
      </p>
    </ProgressCard>
  )
}
