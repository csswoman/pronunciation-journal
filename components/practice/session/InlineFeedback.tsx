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
      className={cn( 'flex animate-fadeIn items-center justify-center gap-3 rounded-xl border px-5 py-3', isCorrect ? 'border-success/30 bg-success-soft text-success' : 'border-error/30 bg-error-soft text-error', )}
    >
      <span
        className={cn( 'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-body-sm font-bold', isCorrect ? 'bg-success text-white' : 'bg-error text-white', )}
        aria-hidden
      >
        {isCorrect ? '✓' : '✗'}
      </span>
      <span className="text-body-sm font-semibold">
        {isCorrect ? '¡Correcto!' : 'No exactamente — sigue'}
      </span>
    </div>
  )
}
