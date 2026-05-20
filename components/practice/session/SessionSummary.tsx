'use client'

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
  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-[.08em] text-fg-subtle">
          Session complete
        </p>
        <div className="text-5xl font-bold text-primary tabular-nums">
          {result.accuracy}%
        </div>
        <p className="text-sm text-fg-muted">
          {formatDuration(result.totalTimeMs)} · {result.results.length} exercises
        </p>
      </div>

      <ul className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
        {result.results.map((r, i) => (
          <li
            key={`${r.exerciseId}-${i}`}
            className="flex items-center justify-between rounded-[var(--radius-md)] px-3 py-2 bg-surface-raised"
          >
            <span className="text-sm text-fg">{r.slug}</span>
            <span
              className={
                r.isCorrect
                  ? 'text-sm font-semibold text-[var(--success)]'
                  : 'text-sm font-semibold text-[var(--error)]'
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
          className="flex-1 rounded-[var(--radius-md)] px-4 py-3 text-sm font-semibold bg-surface-raised text-fg border border-[var(--border-subtle)]"
        >
          Practicar de nuevo
        </button>
        <button
          type="button"
          onClick={onFinish}
          className="flex-1 rounded-[var(--radius-md)] px-4 py-3 text-sm font-semibold text-white"
          style={{ background: 'var(--gradient-primary)' }}
        >
          Terminar
        </button>
      </div>
    </div>
  )
}
