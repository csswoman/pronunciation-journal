'use client'

// Planned structure:
// <SessionSummary>
//   <SummaryHeader />
//   <SessionInsight />
//   <SessionProgressMeta />
//   <FacetList />
//   <SummaryActions />

import { cn } from '@/lib/cn'
import { formatIpaDisplay } from '@/lib/practice/resolve-session-ipa'
import {
  buildPerformanceRows,
  buildSessionInsight,
  formatExerciseLabel,
  type PerformanceRow,
} from '@/lib/practice/session-summary-view'
import type { SessionResult } from '@/lib/practice/types'

export { formatExerciseLabel }

interface Props {
  result: SessionResult
  practiceIpa?: string
  onPracticeAgain: () => void
  onFinish: () => void
  progressSaveStatus?: 'idle' | 'saving' | 'saved_local' | 'synced' | 'error'
  onRetrySync?: () => void
}

function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function AccuracyDisplay({ accuracy }: { accuracy: number }) {
  const isExcellent = accuracy >= 85
  const isAcceptable = accuracy >= 60

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Precisión ${accuracy} por ciento`}
      className={cn(
        'text-h2 font-semibold tabular-nums',
        isExcellent ? 'text-success animate-accuracy-pop' : isAcceptable ? 'text-warning' : 'text-error',
      )}
    >
      {accuracy}%
    </div>
  )
}

function AccuracyLabel({ accuracy }: { accuracy: number }) {
  if (accuracy >= 85) return <span className="text-body-sm font-medium text-success">Excelente</span>
  if (accuracy >= 60) return <span className="text-body-sm font-medium text-warning">Sigue practicando</span>
  return <span className="text-body-sm font-medium text-error">Hay que reforzar</span>
}

function FacetRow({ row }: { row: PerformanceRow }) {
  return (
    <li className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-body-sm text-fg-primary">{row.label}</span>
      <span
        className={cn(
          'shrink-0 text-caption',
          row.needsReinforce ? 'font-medium text-warning' : 'text-fg-secondary',
        )}
      >
        {row.needsReinforce ? 'A reforzar' : 'Bien'}
      </span>
    </li>
  )
}

export function SessionSummary({
  result,
  practiceIpa,
  onPracticeAgain,
  onFinish,
  progressSaveStatus = 'idle',
  onRetrySync,
}: Props) {
  const correctCount = result.results.filter((r) => r.isCorrect).length
  const showProgressStatus = progressSaveStatus !== 'idle'
  const showRetry = Boolean(onRetrySync) && (progressSaveStatus === 'error' || progressSaveStatus === 'saved_local')
  const ipaLabel = practiceIpa ? formatIpaDisplay(practiceIpa) : null
  const soundMode = Boolean(practiceIpa)
  const insight = buildSessionInsight(result, { soundMode })
  const performanceRows = buildPerformanceRows(result.bySlug, { soundMode })

  return (
    <div
      role="region"
      aria-label="Resultados de la sesión"
      className="flex min-h-0 w-full flex-1 flex-col gap-5"
    >
      <div className="flex shrink-0 flex-col items-center gap-1">
        {ipaLabel && (
          <p className="font-ipa m-0 text-display-ipa font-bold text-primary">{ipaLabel}</p>
        )}
        <p className="text-caption font-semibold text-fg-secondary">Sesión completa</p>
        <AccuracyDisplay accuracy={result.accuracy} />
        <AccuracyLabel accuracy={result.accuracy} />
        <p className="mt-2 max-w-prose text-balance text-center text-body-sm text-fg-primary">
          {insight}
        </p>
        <p className="text-caption text-fg-secondary">
          {correctCount} de {result.results.length} · {formatDuration(result.totalTimeMs)}
        </p>
        {showProgressStatus && (
          <p
            role={progressSaveStatus === 'error' ? 'alert' : 'status'}
            className={cn(
              'mt-2 rounded-md px-3 py-1.5 text-caption',
              progressSaveStatus === 'error'
                ? 'bg-warning-soft text-warning'
                : 'text-fg-tertiary',
            )}
          >
            {progressSaveStatus === 'saving'
              ? 'Guardando progreso…'
              : progressSaveStatus === 'synced'
                ? 'Progreso sincronizado.'
                : progressSaveStatus === 'saved_local'
                  ? 'Progreso guardado en este dispositivo. Se sincronizará al recuperar la conexión.'
                  : 'No se pudo guardar el progreso. Se reintentará al recuperar la conexión.'}
            {showRetry && (
              <button
                type="button"
                onClick={onRetrySync}
                className="ml-2 font-semibold underline underline-offset-2 hover:no-underline"
              >
                Reintentar ahora
              </button>
            )}
          </p>
        )}
      </div>

      {performanceRows.length > 0 && (
        <ul
          className="m-0 w-full max-w-sm list-none divide-y divide-border-subtle self-center p-0"
          aria-label="Rendimiento por habilidad"
        >
          {performanceRows.map((row) => (
            <FacetRow key={row.facet} row={row} />
          ))}
        </ul>
      )}

      <div className="mt-auto flex shrink-0 items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onPracticeAgain}
          className="flex-1 rounded-xl border border-border-default bg-surface-raised px-4 py-3 text-body-sm font-semibold text-fg-primary transition-colors hover:border-border-strong hover:bg-surface-sunken"
        >
          Practicar de nuevo
        </button>
        <button
          type="button"
          onClick={onFinish}
          className="flex-1 rounded-xl bg-cta-bg px-4 py-3 text-body-sm font-semibold text-cta-fg transition-all hover:-translate-y-px hover:opacity-90"
        >
          Terminar
        </button>
      </div>
    </div>
  )
}
