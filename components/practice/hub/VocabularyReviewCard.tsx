'use client'

// Planned structure:
// <VocabularyReviewCard> — "Las 1000 esenciales" bento card (progress bar, 620 learned / 380 ahead)

import Link from 'next/link'
import { setLastPracticeMode } from '@/lib/db'

interface Props {
  dueCount: number | null
}

export default function VocabularyReviewCard({ dueCount }: Props) {
  const hasDueReviews = dueCount !== null && dueCount > 0
  const countText = hasDueReviews ? `${dueCount} pendientes` : 'Al día'
  const progressPct = 62

  return (
    <Link
      href="/practice/essential-words"
      onClick={() => void setLastPracticeMode('essential-words')}
      className="group flex flex-col justify-between gap-5 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-5 shadow-xs transition-all duration-200 hover:border-border-strong hover:shadow-sm active:scale-[0.99] focus-ring h-full"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-kicker text-tiny uppercase tracking-wider text-fg-subtle">vocabulario</span>
          <span className="inline-flex items-center rounded-full border border-border-subtle bg-surface-sunken px-2.5 py-0.5 font-caption text-tiny font-medium text-fg-muted">
            {countText}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="text-h3 font-bold text-fg group-hover:text-primary transition-colors">
            Las 1000 esenciales
          </h2>
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        {/* Progress bar with full ARIA semantics */}
        <div
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progreso de las 1000 esenciales: ${progressPct}% (620 de 1000 aprendidas)`}
          className="h-2 w-full overflow-hidden rounded-full bg-primary-soft/40"
        >
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>

        <div className="flex items-center justify-between font-caption text-tiny text-fg-subtle">
          <span>620 aprendidas</span>
          <span>380 por delante</span>
        </div>
      </div>
    </Link>
  )
}

