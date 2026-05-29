'use client'

import { cn } from '@/lib/cn'

interface Props {
  isCorrect: boolean
}

export function InlineFeedback({ isCorrect }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center justify-center gap-3 rounded-xl border px-5 py-3 animate-fadeIn',
        isCorrect
          ? 'border-success/30 bg-success-soft text-success'
          : 'border-error/30 bg-error-soft text-error',
      )}
    >
      <span
        className={cn(
          'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold',
          isCorrect ? 'bg-success text-white' : 'bg-error text-white',
        )}
        aria-hidden
      >
        {isCorrect ? '✓' : '✗'}
      </span>
      <span className="text-sm font-semibold">
        {isCorrect ? 'Correct!' : 'Not quite — keep going'}
      </span>
    </div>
  )
}
