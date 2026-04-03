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
        <div className="flex justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <span>{TYPE_LABELS[exerciseType] ?? exerciseType}</span>
          <span>{current} / {total}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--btn-regular-bg)' }}>
          <div
            className="h-full transition-all duration-300 rounded-full"
            style={{
              width: `${(current / total) * 100}%`,
              backgroundColor: 'var(--primary)',
            }}
          />
        </div>
      </div>

      {/* Exercise content */}
      <div className="rounded-2xl shadow-sm border p-6" style={{
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--line-divider)',
      }}>
        {children}
      </div>

      {/* Feedback + Next */}
      {feedback && (
        <div
          className="rounded-xl p-4 flex items-center justify-between border"
          style={{
            backgroundColor: feedback.isCorrect ? 'oklch(.9 .06 180)' : 'oklch(.93 .06 25)',
            borderColor: feedback.isCorrect ? 'var(--admonitions-color-tip)' : 'var(--admonitions-color-caution)',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">{feedback.isCorrect ? '✓' : '✗'}</span>
            <span className={`font-semibold text-sm ${feedback.isCorrect ? 'text-success' : 'text-error'}`}>
              {feedback.isCorrect ? 'Correct!' : 'Incorrect'}
            </span>
            {feedback.message && (
              <span className="text-xs ml-1" style={{ color: 'var(--text-secondary)' }}>{feedback.message}</span>
            )}
          </div>
          {onNext && (
            <button
              onClick={onNext}
              className="btn-primary px-4 py-1.5 rounded-lg text-sm font-semibold"
            >
              {finishLabel ? 'Finish ✓' : 'Next →'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
