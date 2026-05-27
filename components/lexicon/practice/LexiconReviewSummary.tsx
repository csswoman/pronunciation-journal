'use client'

import type { WordRating } from '@/lib/word-bank/lexicon-review-types'

interface LexiconReviewSummaryProps {
  ratings: WordRating[]
  onStartExercises: () => void
  onFinish: () => void
}

export function LexiconReviewSummary({ ratings, onStartExercises, onFinish }: LexiconReviewSummaryProps) {
  const forgot = ratings.filter((r) => r.rating === 'forgot').length
  const normal = ratings.filter((r) => r.rating === 'normal').length
  const known = ratings.filter((r) => r.rating === 'known').length

  const hasExercises = forgot > 0

  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <div className="flex flex-col items-center gap-1">
        <p className="text-xs font-semibold uppercase tracking-[.08em] text-fg-subtle">
          Review complete
        </p>
        <p className="text-sm text-fg-muted">{ratings.length} words reviewed</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center gap-1 rounded-xl border border-error/30 bg-error-soft/40 p-3">
          <span className="text-2xl font-bold text-error tabular-nums">{forgot}</span>
          <span className="text-[10px] text-fg-subtle text-center leading-tight">I don't know it</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-xl border border-border-subtle bg-surface-raised p-3">
          <span className="text-2xl font-bold text-fg tabular-nums">{normal}</span>
          <span className="text-[10px] text-fg-subtle text-center leading-tight">Normal</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-xl border border-primary/30 bg-primary-soft/40 p-3">
          <span className="text-2xl font-bold text-primary tabular-nums">{known}</span>
          <span className="text-[10px] text-fg-subtle text-center leading-tight">I already know it</span>
        </div>
      </div>

      {hasExercises ? (
        <div className="flex flex-col gap-3">
          <p className="text-center text-sm text-fg-muted">
            {forgot} {forgot === 1 ? 'word needs' : 'words need'} practice.
          </p>
          <button
            type="button"
            onClick={onStartExercises}
            className="w-full rounded-[var(--radius-md)] bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-[var(--on-primary)] shadow-md transition-transform hover:-translate-y-[1px]"
          >
            Start exercises
          </button>
          <button
            type="button"
            onClick={onFinish}
            className="w-full rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised px-4 py-3 text-sm font-semibold text-fg transition-colors hover:border-border-strong"
          >
            Finish
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-center text-sm text-fg-muted">
            Great job — no words to practice right now.
          </p>
          <button
            type="button"
            onClick={onFinish}
            className="w-full rounded-[var(--radius-md)] bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-[var(--on-primary)] shadow-md transition-transform hover:-translate-y-[1px]"
          >
            Finish
          </button>
        </div>
      )}
    </div>
  )
}
