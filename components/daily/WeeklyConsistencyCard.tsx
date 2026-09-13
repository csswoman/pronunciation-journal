// Planned structure:
// <WeeklyConsistencyCard>
//   <ProgressCardHeader />
//   <DayCell /> × 7
//   resumen "x de 7 días"

import { CalendarCheck } from '@/components/icons'
import { cn } from '@/lib/cn'
import { ProgressCard, ProgressCardHeader } from '@/components/progress/ProgressCard'
import type { ConsistencyHeatLevel } from '@/lib/progress/queries'

interface Props {
  /** Últimos 7 días, del más antiguo a hoy. */
  heatmap7: ConsistencyHeatLevel[]
  completedDays7: number
  rate7: number
}

const HEAT_CLASS: Record<ConsistencyHeatLevel, string> = {
  0: 'bg-surface-sunken',
  1: 'bg-[color-mix(in_oklch,var(--primary)_35%,var(--surface-sunken))]',
  2: 'bg-[color-mix(in_oklch,var(--primary)_65%,var(--surface-sunken))]',
  3: 'bg-primary',
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
  const hasData = heatmap7.some((level) => level > 0)

  return (
    <ProgressCard>
      <ProgressCardHeader icon={<CalendarCheck size={16} />} title="Tu semana" />

      <div
        className="grid grid-cols-7 gap-1.5"
        role="img"
        aria-label={`Últimos 7 días: ${completedDays7} días practicados, ${rate7}% de la semana.`}
      >
        {heatmap7.map((level, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span
              className={cn('aspect-square w-full rounded-xs', HEAT_CLASS[level])}
              aria-hidden
            />
            <span className="font-caption text-fg-subtle" aria-hidden>
              {initials[i]}
            </span>
          </div>
        ))}
      </div>

      <p className="text-body-sm text-fg-muted">
        {hasData ? (
          <>
            <b className="font-semibold text-fg">{completedDays7}</b> de 7 días · {rate7}% de la
            semana
          </>
        ) : (
          'Aún no hay práctica esta semana. Empieza hoy y verás la fila llenarse.'
        )}
      </p>
    </ProgressCard>
  )
}
