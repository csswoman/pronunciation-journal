'use client'

// Planned structure:
// <ReviewHubActions>
//   <ReviewCompleteBanner /> | loading | start CTA | daily link | error retry
// </ReviewHubActions>

import Link from 'next/link'
import { ArrowRight } from '@/components/icons'
import Button from '@/components/ui/Button'
import { ReviewCompleteBanner } from '@/components/practice/review/ReviewCompleteBanner'
import { cn } from '@/lib/cn'
import type { ReviewSessionPhase } from '@/hooks/useReviewSession'

interface Props {
  phase: ReviewSessionPhase['phase']
  canStart: boolean
  hadReviewableItems: boolean
  reviewableCount: number
  onStartReview: () => void
  onRetry: () => void
}

export function ReviewHubActions({
  phase,
  canStart,
  hadReviewableItems,
  reviewableCount,
  onStartReview,
  onRetry,
}: Props) {
  if (phase === 'done') {
    return (
      <div className="flex flex-col gap-3">
        <ReviewCompleteBanner hadReviewableItems={hadReviewableItems} />
        {canStart ? (
          <Button
            type="button"
            variant="secondary"
            size="md"
            fullWidth
            onClick={onStartReview}
            data-cuelume-press="press"
            data-cuelume-release="release"
          >
            Repasar otra vez
          </Button>
        ) : null}
      </div>
    )
  }

  if (phase === 'loading') {
    return (
      <Button type="button" variant="primary" size="md" fullWidth disabled isLoading>
        Preparando repaso…
      </Button>
    )
  }

  if (phase === 'error') {
    return (
      <div className="flex flex-col gap-2 animate-message-in">
        <p className="m-0 font-body-sm text-center text-error" role="alert">
          No pudimos cargar el repaso. ¿Lo intentamos de nuevo?
        </p>
        <Button
          type="button"
          variant="primary"
          size="md"
          fullWidth
          onClick={onRetry}
          data-cuelume-press="press"
          data-cuelume-release="release"
        >
          Reintentar
        </Button>
      </div>
    )
  }

  if (canStart) {
    const label =
      reviewableCount > 0
        ? `Repaso completo · ${reviewableCount} ${reviewableCount === 1 ? 'pendiente' : 'pendientes'}`
        : 'Repaso completo'

    return (
      <Button
        type="button"
        variant="primary"
        size="md"
        fullWidth
        icon={<ArrowRight size={15} />}
        iconPosition="right"
        onClick={onStartReview}
        data-cuelume-press="press"
        data-cuelume-release="release"
      >
        {label}
      </Button>
    )
  }

  if (phase === 'idle') {
    return (
      <Link
        href="/daily"
        className={cn(
          'inline-flex w-full items-center justify-center gap-2 rounded-md px-5 py-3',
          'text-body-sm font-semibold transition-all duration-150 ease-out-quart focus-ring',
          'bg-[var(--cta-bg)] text-[var(--cta-fg)] hover:bg-[var(--cta-bg-hover)]',
        )}
        data-cuelume-hover="tick"
        data-cuelume-press="press"
      >
        Ir al plan diario
        <ArrowRight size={15} aria-hidden />
      </Link>
    )
  }

  return null
}
