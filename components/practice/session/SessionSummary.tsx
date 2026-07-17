'use client'

import { cn } from '@/lib/cn'
import { formatIpaDisplay } from '@/lib/practice/resolve-session-ipa'
import type { SessionResult } from '@/lib/practice/types'

interface Props {
  result: SessionResult
  practiceIpa?: string
  onPracticeAgain: () => void
  onFinish: () => void
  progressSaveStatus?: 'idle' | 'saving' | 'saved' | 'error'
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
        'text-3xl font-semibold tabular-nums',
        isExcellent
          ? 'text-success animate-accuracy-pop'
          : isAcceptable
            ? 'text-warning'
            : 'text-error',
      )}
    >
      {accuracy}%
    </div>
  )
}

function AccuracyLabel({ accuracy }: { accuracy: number }) {
  if (accuracy >= 85) return <span className="text-sm font-medium text-success">Excelente</span>
  if (accuracy >= 60) return <span className="text-sm font-medium text-warning">Sigue practicando</span>
  return <span className="text-sm font-medium text-error">Hay que reforzar</span>
}

export function formatExerciseLabel(slug: string, exercisePayload: unknown): string {
  if (exercisePayload && typeof exercisePayload === 'object') {
    const targetWord = (exercisePayload as { targetWord?: unknown }).targetWord
    if (typeof targetWord === 'string' && targetWord.trim().length > 0) return targetWord.trim()
  }

  return slug.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function ResultRow({
  slug,
  isCorrect,
  exercisePayload,
}: {
  slug: string
  isCorrect: boolean
  exercisePayload: unknown
}) {
  return (
    <li className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-raised px-3 py-2">
      <span className="text-sm text-fg-primary">
        {formatExerciseLabel(slug, exercisePayload)}
      </span>
      <span
        className={cn(
          'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
          isCorrect ? 'bg-success-soft text-success' : 'bg-error-soft text-error',
        )}
        aria-label={isCorrect ? 'Correcto' : 'Incorrecto'}
      >
        {isCorrect ? '✓' : '✗'}
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
}: Props) {
  const correctCount = result.results.filter((r) => r.isCorrect).length
  const showProgressStatus = progressSaveStatus !== 'idle'
  const ipaLabel = practiceIpa ? formatIpaDisplay(practiceIpa) : null

  return (
    <div role="region" aria-label="Resultados de la sesión" className="flex w-full flex-col gap-6">
      <div className="flex flex-col items-center gap-1.5">
        {ipaLabel && (
          <p className="font-ipa m-0 text-3xl font-bold leading-none text-primary">{ipaLabel}</p>
        )}
        <p className="text-sm font-semibold text-fg-secondary">Sesión completa</p>
        <AccuracyDisplay accuracy={result.accuracy} />
        <AccuracyLabel accuracy={result.accuracy} />
        <p className="mt-1 text-sm text-fg-secondary">
          {correctCount} de {result.results.length} correctas · {formatDuration(result.totalTimeMs)}
        </p>
        {showProgressStatus && (
          <p
            role={progressSaveStatus === 'error' ? 'alert' : 'status'}
            className={cn(
              'mt-2 rounded-md px-3 py-2 text-sm',
              progressSaveStatus === 'error'
                ? 'bg-warning-soft text-warning'
                : 'bg-surface-sunken text-fg-secondary',
            )}
          >
            {progressSaveStatus === 'saving'
              ? 'Guardando progreso…'
              : progressSaveStatus === 'saved'
                ? 'Progreso guardado.'
                : 'No se pudo guardar el progreso. Se reintentará al recuperar la conexión.'}
          </p>
        )}
      </div>

      <ul className="flex max-h-64 flex-col gap-1.5 overflow-y-auto">
        {result.results.map((r, i) => (
          <ResultRow
            key={`${r.exerciseId}-${i}`}
            slug={r.slug}
            isCorrect={r.isCorrect}
            exercisePayload={r.exercisePayload}
          />
        ))}
      </ul>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onPracticeAgain}
          className="flex-1 rounded-xl border border-border-default bg-surface-raised px-4 py-3 text-sm font-semibold text-fg-primary transition-colors hover:border-border-strong hover:bg-surface-sunken"
        >
          Practicar de nuevo
        </button>
        <button
          type="button"
          onClick={onFinish}
          className="flex-1 rounded-xl bg-cta-bg px-4 py-3 text-sm font-semibold text-cta-fg transition-all hover:-translate-y-px hover:opacity-90"
        >
          Terminar
        </button>
      </div>
    </div>
  )
}
