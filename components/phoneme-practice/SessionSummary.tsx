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

  return (
    <div className="w-full max-w-md mx-auto space-y-6 text-center">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 space-y-4">
        <div className="text-6xl font-bold font-mono text-purple-600 dark:text-purple-400">
          {soundIpa}
        </div>

        <div
          className={`text-5xl font-bold ${
            accuracy >= 80
              ? 'text-green-600 dark:text-green-400'
              : accuracy >= 50
              ? 'text-amber-500 dark:text-amber-400'
              : 'text-red-500 dark:text-red-400'
          }`}
        >
          {accuracy}%
        </div>

        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {correct} of {total} correct
        </p>

        {nextReviewLabel && (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Next review: <span className="font-medium text-gray-600 dark:text-gray-300">{nextReviewLabel}</span>
          </p>
        )}
      </div>

      <div className="space-y-2">
        <button
          onClick={onPracticeAgain}
          className="w-full py-3 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors"
        >
          Practice again
        </button>
        <Link
          href="/dashboard"
          className="block w-full py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
