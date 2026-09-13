'use client'

// Planned structure:
// <DailyOverviewSummary>
//   <FocusHighlight> (IPA badge/topic destacando el foco del día)
//   <MetricsRow> (progreso, minutos restantes, mañana)
//   <EssentialWordsProgressBar> (si learned > 0)
// </DailyOverviewSummary>
//
// Integra el encuadre pedagógico (sonido/foco del día) y las métricas
// ejecutivas de la sesión en una sola tarjeta con clara jerarquía visual.

import { formatIpaDisplay } from '@/lib/lexicon/format-ipa'
import type { SessionArc } from '@/lib/practice/types'
import type { DailyStep, DailyStepStatus } from '@/hooks/useDailyPlan'

const ESSENTIAL_WORD_TARGET = 1000

interface Props {
  steps: DailyStep[]
  getStepStatus: (stepId: string) => DailyStepStatus
  completedCount: number
  arc: SessionArc | undefined
  /** Repasos programados para mañana. null mientras carga o si falla. */
  dueTomorrow: number | null
  /** Palabras esenciales aprendidas (Core 1000). */
  learned?: number
}

function SummaryStat({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string | null
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="font-caption text-fg-muted">{label}</span>
      <span className="font-label text-body-sm font-semibold tabular-nums text-fg">{value}</span>
      {hint ? <span className="font-caption truncate text-fg-muted">{hint}</span> : null}
    </div>
  )
}

export default function DailyOverviewSummary({
  steps,
  getStepStatus,
  completedCount,
  arc,
  dueTomorrow,
  learned = 0,
}: Props) {
  if (steps.length === 0) return null

  const remainingMinutes = steps.reduce((sum, s) => {
    const st = getStepStatus(s.id)
    if (st === 'done' || st === 'resolved') return sum
    return sum + (s.estMinutes || 0)
  }, 0)

  const soundIpa = formatIpaDisplay(arc?.soundIpa)
  const topicLabel = arc?.topicLabel
  const progressPct = Math.min(100, (learned / ESSENTIAL_WORD_TARGET) * 100)

  return (
    <section
      aria-label="Resumen del día"
      className="flex flex-col gap-3.5 rounded-xl border border-border-subtle bg-surface-raised p-4 shadow-xs sm:p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Foco de hoy / Sonido del día destacado */}
        <div className="flex min-w-0 items-center gap-3.5">
          {soundIpa ? (
            <div
              className="flex h-12 min-w-12 shrink-0 items-center justify-center rounded-lg bg-primary-soft px-2.5 font-ipa text-display-ipa font-bold leading-none text-primary"
              aria-label={`Sonido del día ${soundIpa}`}
            >
              {soundIpa}
            </div>
          ) : null}
          <div className="min-w-0">
            <span className="font-kicker block text-tiny uppercase tracking-wider text-fg-muted">
              {soundIpa ? 'Sonido del día' : 'Foco de hoy'}
            </span>
            <p className="font-label truncate text-body-sm font-semibold text-fg">
              {topicLabel ?? (soundIpa ? `Sonido ${soundIpa}` : 'Repaso general')}
            </p>
            {topicLabel && soundIpa ? (
              <p className="font-caption truncate text-fg-muted">Sonido {soundIpa}</p>
            ) : null}
          </div>
        </div>

        {/* Divisor responsive */}
        <div className="h-px w-full bg-border-subtle/60 sm:h-9 sm:w-px sm:shrink-0" />

        {/* Métricas de sesión */}
        <div className="grid min-w-0 grid-cols-3 gap-3 sm:shrink-0 sm:gap-6">
          <SummaryStat
            label="Progreso"
            value={`${completedCount} / ${steps.length}`}
            hint={completedCount >= steps.length ? 'Plan completo' : 'actividades'}
          />
          <SummaryStat
            label="Te queda"
            value={remainingMinutes > 0 ? `${remainingMinutes} min` : '0 min'}
            hint={remainingMinutes > 0 ? 'aprox.' : 'nada pendiente'}
          />
          <SummaryStat
            label="Mañana"
            value={dueTomorrow == null ? '—' : String(dueTomorrow)}
            hint={dueTomorrow == null ? 'sin datos' : dueTomorrow === 1 ? 'repaso' : 'repasos'}
          />
        </div>
      </div>

      {learned > 0 ? (
        <div
          role="group"
          aria-label={`Palabras esenciales, ${learned} de ${ESSENTIAL_WORD_TARGET}`}
          className="border-t border-border-subtle/60 pt-2.5"
        >
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <span className="font-caption text-fg-muted">Palabras esenciales</span>
            <span className="font-caption tabular-nums text-fg">
              <span className="font-semibold">{learned}</span>
              <span className="text-fg-muted"> / {ESSENTIAL_WORD_TARGET}</span>
            </span>
          </div>
          <div
            className="h-1 w-full overflow-hidden rounded-full bg-surface-sunken"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={ESSENTIAL_WORD_TARGET}
            aria-valuenow={learned}
            aria-label="Progreso de palabras esenciales"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500 motion-reduce:transition-none"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      ) : null}
    </section>
  )
}
