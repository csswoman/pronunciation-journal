'use client'

import type { ReactNode } from 'react'

interface Props {
  exerciseType: string
  children: ReactNode
  feedback?: { isCorrect: boolean; message?: string } | null
  onNext?: () => void
  finishLabel?: boolean
}

export function ExerciseCard({ children, feedback, onNext, finishLabel }: Props) {
  return (
    <div className="w-full max-w-[520px] mx-auto flex flex-col gap-4">
      {children}

      {feedback && (
        <div
          className={[
            'rounded-[var(--radius-lg)] px-5 py-4 flex items-center justify-between',
            feedback.isCorrect
              ? 'border-[1.5px] border-[var(--success-border)] bg-[var(--success-soft)]'
              : 'border-[1.5px] border-[var(--error-border)] bg-[var(--error-soft)]',
          ].join(' ')}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{feedback.isCorrect ? '✓' : '✗'}</span>
            <span
              className={`font-semibold text-sm ${feedback.isCorrect ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}
            >
              {feedback.isCorrect ? 'Correct!' : 'Incorrect'}
            </span>
            {feedback.message && (
              <span className="text-xs text-[var(--text-secondary)] ml-1">
                {feedback.message}
              </span>
            )}
          </div>
          {onNext && (
            <button
              type="button"
              onClick={onNext}
              className="bg-[var(--gradient-primary)] text-white border-none rounded-[var(--radius-full)] px-5 py-2 text-[13px] font-semibold cursor-pointer font-inherit"
            >
              {finishLabel ? 'Finish ✓' : 'Next →'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
