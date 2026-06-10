'use client'

import { cn } from '@/lib/cn'
import type { SessionResult } from '@/lib/practice/types'

interface Props {
  result: SessionResult
  onPracticeAgain: () => void
  onFinish: () => void
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
      aria-label={`Accuracy ${accuracy} percent`}
      className={cn(
        'text-6xl font-bold tabular-nums',
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
  if (accuracy >= 85) return <span className="text-success font-medium text-sm">Excellent</span>
  if (accuracy >= 60) return <span className="text-warning font-medium text-sm">Keep practicing</span>
  return <span className="text-error font-medium text-sm">Needs work</span>
}

function ResultRow({ slug, isCorrect, index }: { slug: string; isCorrect: boolean; index: number }) {
  return (
    <li className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-raised px-3 py-2">
      <span className="text-sm text-fg-primary capitalize">{slug.replace(/_/g, ' ')}</span>
      <span
        className={cn(
          'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
          isCorrect ? 'bg-success-soft text-success' : 'bg-error-soft text-error',
        )}
        aria-label={isCorrect ? 'Correct' : 'Incorrect'}
      >
        {isCorrect ? '✓' : '✗'}
      </span>
    </li>
  )
}

export function SessionSummary({ result, onPracticeAgain, onFinish }: Props) {
  const correctCount = result.results.filter((r) => r.isCorrect).length

  return (
    <div role="region" aria-label="Session results" className="flex w-full flex-col gap-6">
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-xs font-semibold uppercase tracking-[.08em] text-fg-tertiary">
          Session complete
        </p>
        <AccuracyDisplay accuracy={result.accuracy} />
        <AccuracyLabel accuracy={result.accuracy} />
        <p className="text-sm text-fg-secondary mt-1">
          {correctCount} of {result.results.length} correct · {formatDuration(result.totalTimeMs)}
        </p>
      </div>

      <ul className="flex max-h-64 flex-col gap-1.5 overflow-y-auto">
        {result.results.map((r, i) => (
          <ResultRow
            key={`${r.exerciseId}-${i}`}
            slug={r.slug}
            isCorrect={r.isCorrect}
            index={i}
          />
        ))}
      </ul>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onPracticeAgain}
          className="flex-1 rounded-xl border border-border-default bg-surface-raised px-4 py-3 text-sm font-semibold text-fg-primary transition-colors hover:bg-surface-sunken hover:border-border-strong"
        >
          Practice again
        </button>
        <button
          type="button"
          onClick={onFinish}
          className="flex-1 rounded-xl bg-cta-bg px-4 py-3 text-sm font-semibold text-cta-fg transition-all hover:opacity-90 hover:-translate-y-px"
        >
          Finish
        </button>
      </div>
    </div>
  )
}
