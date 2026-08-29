import { CalendarCheck } from "@/components/icons"
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ProgressCardHeader
          icon={<CalendarCheck size={16} />}
          title="Consistencia"
        />
        <span className="shrink-0 font-kicker text-[11px] font-semibold text-fg-subtle">
          ÚLTIMOS 30 DÍAS
        </span>
      </div>

      {hasData ? (
        <>
          <div
            className="mt-1 grid grid-cols-[repeat(15,minmax(0,1fr))] gap-1"
            role="img"
            aria-label="Mapa de calor de práctica diaria de 30 días"
          >
            {stats.heatmap30.map((level, i) => (
              <span
                key={i}
                title={`Día ${i + 1}: actividad nivel ${level}`}
                aria-label={`Día ${i + 1}: actividad nivel ${level}`}
                className={cn('aspect-square rounded-xs', HEAT_CLASS[level])}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-body-sm text-fg-muted">
            <span>
              <b className="font-normal text-fg">{stats.completedDays30}</b> de 30 días
            </span>
            <span>{stats.rate30}% del mes</span>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <p className="text-body-sm font-medium text-fg-muted">Sin sesiones diarias aún</p>
          <p className="text-caption text-fg-muted">
            Completa una práctica diaria para ver tu consistencia.
          </p>
        </div>
      )}
    </ProgressCard>
  )
}
