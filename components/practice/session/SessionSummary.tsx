'use client'

import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
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

export function SessionSummary({ result, onPracticeAgain, onFinish }: Props) {
  const correctCount = result.results.filter((r) => r.isCorrect).length
  const firedRef = useRef(false)

  useEffect(() => {
    if (firedRef.current || result.accuracy < 50) return
    firedRef.current = true

    const colors = ['#a855f7', '#6366f1', '#38bdf8', '#34d399', '#fbbf24']
    const burst = (delay: number) => {
      setTimeout(() => {
        confetti({
          particleCount: result.accuracy >= 80 ? 140 : 90,
          spread: 90,
          startVelocity: 38,
          origin: { x: 0.5, y: 0.45 },
          colors,
          scalar: 1.05,
        })
      }, delay)
    }
    burst(0)
    if (result.accuracy >= 80) {
      burst(220)
      burst(440)
    }
  }, [result.accuracy])

  return (
    <div role="region" aria-label="Session results" className="flex w-full flex-col gap-6">
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-[.08em] text-fg-subtle">
          Session complete
        </p>
        <div
          role="status"
          aria-live="polite"
          aria-label={`Accuracy ${result.accuracy} percent`}
          className="bg-clip-text text-6xl font-bold tabular-nums text-transparent"
          style={{ backgroundImage: 'var(--gradient-primary)' }}
        >
          {result.accuracy}%
        </div>
        <p className="text-sm text-fg-muted">
          {correctCount} / {result.results.length} correct · {formatDuration(result.totalTimeMs)}
        </p>
      </div>

      <ul className="flex max-h-64 flex-col gap-1.5 overflow-y-auto">
        {result.results.map((r, i) => (
          <li
            key={`${r.exerciseId}-${i}`}
            className="flex items-center justify-between rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised px-3 py-2"
          >
            <span className="text-sm text-fg">{r.slug.replace(/_/g, ' ')}</span>
            <span
              className={
                r.isCorrect
                  ? 'inline-flex h-6 w-6 items-center justify-center rounded-full bg-success-soft text-sm font-semibold text-success'
                  : 'inline-flex h-6 w-6 items-center justify-center rounded-full bg-error-soft text-sm font-semibold text-error'
              }
            >
              {r.isCorrect ? '✓' : '✗'}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPracticeAgain}
          className="flex-1 rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised px-4 py-3 text-sm font-semibold text-fg transition-colors hover:border-border-strong"
        >
          Practicar de nuevo
        </button>
        <button
          type="button"
          onClick={onFinish}
          className="flex-1 rounded-[var(--radius-md)] px-4 py-3 text-sm font-semibold text-on-primary shadow-md transition-transform hover:-translate-y-[1px]"
          style={{ backgroundImage: 'var(--gradient-primary)' }}
        >
          Terminar
        </button>
      </div>
    </div>
  )
}
