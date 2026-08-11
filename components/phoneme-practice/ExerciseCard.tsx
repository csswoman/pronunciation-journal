'use client'

import type { ReactNode } from 'react'
import Button from '@/components/ui/Button'

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
            'flex flex-col items-stretch justify-between gap-3 rounded-[var(--radius-lg)] px-5 py-4 sm:flex-row sm:items-center',
            feedback.isCorrect
              ? 'border-[1.5px] border-[var(--success-border)] bg-[var(--success-soft)]'
              : 'border-[1.5px] border-[var(--error-border)] bg-[var(--error-soft)]',
          ].join(' ')}
        >
          <div className="flex items-center gap-2">
            <span className="text-body-lg" aria-hidden>
              {feedback.isCorrect ? '✓' : '✗'}
            </span>
            <span
              className={`text-body-sm font-semibold ${feedback.isCorrect ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}
            >
              {feedback.isCorrect ? '¡Correcto!' : 'Incorrecto'}
            </span>
            {feedback.message && (
              <span className="ml-1 text-caption text-[var(--text-secondary)]">
                {feedback.message}
              </span>
            )}
          </div>
          {onNext && (
            <Button
              variant={feedback.isCorrect ? 'success' : 'error'}
              size="sm"
              onClick={onNext}
              className="w-full sm:w-auto"
            >
              {finishLabel ? 'Terminar ✓' : 'Siguiente →'}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
