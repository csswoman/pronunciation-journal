'use client'

import type { ReactNode } from 'react'

interface Props {
  current: number
  total: number
  exerciseType: string
  children: ReactNode
  feedback?: { isCorrect: boolean; message?: string } | null
  onNext?: () => void
  finishLabel?: boolean
}

const TYPE_LABELS: Record<string, string> = {
  pick_word: 'Pick the Word',
  pick_sound: 'Pick the Sound',
  minimal_pair: 'Minimal Pair',
  dictation: 'Dictation',
}

export function ExerciseCard({ current, total, exerciseType, children, feedback, onNext, finishLabel }: Props) {
  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-400">
          <span>{TYPE_LABELS[exerciseType] ?? exerciseType}</span>
          <span>{current} / {total}</span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 transition-all duration-300 rounded-full"
            style={{ width: `${(current / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Exercise content */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        {children}
      </div>

      {/* Feedback + Next */}
      {feedback && (
        <div className={`rounded-xl p-4 flex items-center justify-between
          ${feedback.isCorrect
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">{feedback.isCorrect ? '✓' : '✗'}</span>
            <span className={`font-semibold text-sm ${feedback.isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
              {feedback.isCorrect ? 'Correct!' : 'Incorrect'}
            </span>
            {feedback.message && (
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">{feedback.message}</span>
            )}
          </div>
          {onNext && (
            <button
              onClick={onNext}
              className="px-4 py-1.5 rounded-lg bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              {finishLabel ? 'Finish ✓' : 'Next →'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
