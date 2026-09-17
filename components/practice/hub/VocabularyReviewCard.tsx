'use client'

// Planned structure:
// <VocabularyReviewCard> — "Las 1000 esenciales" bento card in PastelCard tone="lilac"
//   Header: REPASO kicker + "{dueCount} pendientes" badge
//   Title: Las 1000 esenciales
//   Segmented progress bar + learned/ahead counts
//   CTA: "Seguir · 4 min" button (tinta sólida)
//   Watermark: "1000" big text outline

import Link from 'next/link'
import { setLastPracticeMode } from '@/lib/practice/last-practice-mode'
import { ArrowRight } from '@/components/icons'
import { cn } from '@/lib/cn'

const TOTAL_SEGMENTS = 12

interface Props {
  dueCount: number | null
  learnedCount: number | null
  totalCount: number | null
}

export default function VocabularyReviewCard({ dueCount, learnedCount, totalCount }: Props) {
  const hasDueReviews = dueCount !== null && dueCount > 0
  const countText = hasDueReviews ? `${dueCount} pendientes` : 'Al día'

  const hasCounts = learnedCount !== null && totalCount !== null && totalCount > 0
  const learned = hasCounts ? Math.min(learnedCount!, totalCount!) : 0
  const ahead = hasCounts ? Math.max(totalCount! - learned, 0) : 0
  const progressRatio = hasCounts ? learned / totalCount! : 0
  const progressPct = Math.round(progressRatio * 100)
  const isFresh = hasCounts && learned === 0
  const activeSegments = learned > 0 ? Math.max(1, Math.round(progressRatio * TOTAL_SEGMENTS)) : 1

  return (
    <Link
      href="/practice/essential-words"
      onClick={() => void setLastPracticeMode('essential-words')}
      data-tone="lilac"
      className="pastel-card focus-ring group relative flex flex-col justify-between gap-5 rounded-3xl p-5 transition-transform hover:-translate-y-px overflow-hidden select-none"
    >
      <div className="flex flex-col gap-3 z-10">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-tiny font-bold uppercase tracking-wider text-ink select-none">
            REPASO
          </span>
          <span className="inline-flex items-center rounded-full bg-ink/12 px-2.5 py-0.5 font-sans text-caption font-bold text-ink">
            {countText}
          </span>
        </div>

        <h2 className="font-heading text-h3 font-extrabold text-ink leading-tight">
          Las 1000 esenciales
        </h2>
      </div>

      {hasCounts && (
        <div className="flex flex-col gap-3.5 z-10">
          <div
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progreso de las 1000 esenciales: ${progressPct}% (${learned} de ${totalCount})`}
            className="flex w-full items-center gap-1.5 py-0.5"
          >
            {Array.from({ length: TOTAL_SEGMENTS }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-2 flex-1 rounded-full transition-colors duration-300',
                  i < activeSegments ? 'bg-ink' : 'bg-ink/15',
                )}
              />
            ))}
          </div>

          <div className="flex items-center justify-between font-sans text-caption text-ink-secondary">
            <span>{isFresh ? 'Comenzar' : `${learned} aprendida${learned === 1 ? '' : 's'}`}</span>
            <span>{ahead} por delante</span>
          </div>

          <div className="pt-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 font-label text-body-sm font-semibold text-paper transition-all group-hover:bg-ink-secondary shrink-0">
              <span>Seguir · 4 min</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
          </div>
        </div>
      )}

      {/* Marca de agua grande de 1000 en contorno (stroke) */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-3 bottom-0.5 font-heading text-6xl sm:text-7xl font-black text-transparent select-none transition-opacity opacity-20 group-hover:opacity-35 [-webkit-text-stroke:1.5px_var(--ink)]"
      >
        1000
      </span>
    </Link>
  )
}
