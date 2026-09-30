'use client'

import { cn } from '@/lib/cn'
import PastelCard from '@/components/layout/PastelCard'
import type { ConsistencyHeatLevel } from '@/lib/progress/queries'

interface Props {
  /** Últimos 7 días, del más antiguo a hoy. */
  heatmap7: ConsistencyHeatLevel[]
  completedDays7: number
  rate7: number
}

const HEAT_CLASS: Record<ConsistencyHeatLevel, string> = {
  0: 'border-2 border-dashed border-ink/20 bg-transparent',
  1: 'bg-ink/30 border border-transparent',
  2: 'bg-ink/65 border border-transparent',
  3: 'bg-ink border border-transparent',
}

/** Etiqueta de cada columna: hoy es la última, hacia atrás los 6 anteriores. */
const DAY_INITIALS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'] as const

function weekdayInitials(): string[] {
  const todayIndex = new Date().getDay()
  return Array.from({ length: 7 }, (_, i) => {
    const offset = (todayIndex - (6 - i) + 7 * 2) % 7
    return DAY_INITIALS[offset]
  })
}

export default function WeeklyConsistencyCard({ heatmap7, completedDays7, rate7 }: Props) {
  const initials = weekdayInitials()

  return (
    <PastelCard tone="lilac" className="flex flex-col gap-4 p-5 sm:p-6 motion-reduce:shadow-none">
      <div className="flex items-center justify-between gap-2">
        <span className="font-sans text-caption font-bold uppercase tracking-wider text-ink-muted">
          Tu semana
        </span>
        <span className="inline-flex items-center rounded-full border border-ink/15 bg-ink/10 px-3 py-1 font-sans text-caption font-bold tabular-nums text-ink">
          {completedDays7} de 7 días
        </span>
      </div>

      <div
        className="grid grid-cols-7 gap-2"
        role="img"
        aria-label={`Últimos 7 días: ${completedDays7} días practicados, ${rate7}% de la semana.`}
      >
        {heatmap7.map((level, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <span
              className={cn('aspect-square w-full rounded-full transition-colors', HEAT_CLASS[level])}
              aria-hidden
            />
            <span className="font-sans text-caption font-bold text-ink-secondary" aria-hidden>
              {initials[i]}
            </span>
          </div>
        ))}
      </div>

      <p className="font-body-sm text-ink-secondary">
        El tono indica cuánto practicaste ese día.
      </p>
    </PastelCard>
  )
}
