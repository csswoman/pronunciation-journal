'use client'

// Planned structure:
// <ReviewCompleteBanner>
//   <SuccessIcon />
//   <CompletionCopy />
// </ReviewCompleteBanner>

import { useEffect, useRef } from 'react'
import { CheckCircle2 } from '@/components/icons'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { cn } from '@/lib/cn'

interface Props {
  hadReviewableItems: boolean
  className?: string
}

export function ReviewCompleteBanner({ hadReviewableItems, className }: Props) {
  const cuePlayed = useRef(false)

  useEffect(() => {
    if (cuePlayed.current) return
    cuePlayed.current = true
    playUiCue(hadReviewableItems ? 'correct' : 'soft')
  }, [hadReviewableItems])

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center gap-2 rounded-[var(--radius-lg)]',
        'border border-success-border bg-success-soft px-4 py-4 text-center',
        'animate-message-in',
        className,
      )}
    >
      <span
        className="animate-step-done inline-flex h-10 w-10 items-center justify-center rounded-full bg-success text-white"
        aria-hidden
      >
        <CheckCircle2 size={22} />
      </span>
      <p className="m-0 font-body-sm font-semibold text-success">¡Repaso hecho!</p>
      <p className="m-0 max-w-[36ch] font-body-sm text-fg-secondary">
        {hadReviewableItems
          ? 'Buen trabajo. Mañana habrá más; mientras tanto, sigue con tu plan diario.'
          : 'Nada pendiente por hoy — buen momento para explorar el plan diario.'}
      </p>
    </div>
  )
}
