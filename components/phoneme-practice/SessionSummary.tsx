'use client'

import Link from 'next/link'
import type { SessionAnswer } from '@/lib/phoneme-practice/types'

interface Props {
  answers: SessionAnswer[]
  soundIpa: string
  nextReview: Date | null
  onPracticeAgain: () => void
}

export function SessionSummary({ answers, soundIpa, nextReview, onPracticeAgain }: Props) {
  const correct = answers.filter(a => a.isCorrect).length
  const total = answers.length
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0

  const nextReviewLabel = nextReview
    ? new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).format(nextReview)
    : null

  const accuracyColor =
    accuracy >= 80 ? 'var(--admonitions-color-tip)' :
    accuracy >= 50 ? 'var(--admonitions-color-warning)' :
    'var(--admonitions-color-caution)'

  return (
    <div className="w-full max-w-md mx-auto space-y-6 text-center">
      <div className="rounded-2xl shadow-sm border p-8 space-y-4" style={{
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--line-divider)',
      }}>
        <div className="text-6xl font-bold font-mono" style={{ color: 'var(--primary)' }}>
          {soundIpa}
        </div>

        <div className="text-5xl font-bold" style={{ color: accuracyColor }}>
          {accuracy}%
        </div>

        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {correct} of {total} correct
        </p>

        {nextReviewLabel && (
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Next review: <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{nextReviewLabel}</span>
          </p>
        )}
      </div>

      <div className="space-y-2">
        <button
          onClick={onPracticeAgain}
          className="btn-primary w-full py-3 rounded-xl font-semibold"
        >
          Practice again
        </button>
        <Link
          href="/practice"
          className="block w-full py-3 rounded-xl border font-semibold transition-colors hover:bg-btn-plain-hover"
          style={{
            borderColor: 'var(--line-divider)',
            color: 'var(--text-secondary)',
          }}
        >
          Back to practice
        </Link>
      </div>
    </div>
  )
}
