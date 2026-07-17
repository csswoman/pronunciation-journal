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
    <div className="mx-auto flex w-full max-w-[clamp(100%,520px,90vw)] flex-col gap-4 px-4 lg:px-0">
      {children}

      {feedback && (
        <div
          className={[
            'flex items-center justify-between rounded-[var(--radius-lg)] px-5 py-4',
            feedback.isCorrect
              ? 'border-[1.5px] border-[var(--success-border)] bg-[var(--success-soft)]'
              : 'border-[1.5px] border-[var(--error-border)] bg-[var(--error-soft)]',
          ].join(' ')}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden>
              {feedback.isCorrect ? '✓' : '✗'}
            </span>
            <span
              className={`text-sm font-semibold ${feedback.isCorrect ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}
            >
              {feedback.isCorrect ? '¡Correcto!' : 'Incorrecto'}
            </span>
            {feedback.message && (
              <span className="ml-1 text-xs text-[var(--text-secondary)]">
                {feedback.message}
              </span>
            )}
          </div>
          {onNext && (
            <button
              type="button"
              onClick={onNext}
              className="cursor-pointer rounded-[var(--radius-full)] border-none bg-[var(--gradient-primary)] px-5 py-2 text-[13px] font-semibold text-white font-inherit"
            >
              {finishLabel ? 'Terminar ✓' : 'Siguiente →'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
