'use client'

import Link from 'next/link'

interface Props {
  soundIpa: string
  scoreableCorrect: number
  originalTotal: number
  nextReview: Date | null
  onPracticeAgain: () => void
}

function getResult(accuracy: number) {
  if (accuracy === 100) return { emoji: '🎉', title: 'Perfect!',        subtitle: 'You nailed every single one.' }
  if (accuracy >= 80)  return { emoji: '🌟', title: 'Great job!',       subtitle: 'Almost perfect — keep it up.' }
  if (accuracy >= 50)  return { emoji: '💪', title: 'Good effort!',     subtitle: 'Practice a bit more to master this.' }
  return               { emoji: '📚', title: 'Keep practicing!', subtitle: 'This sound needs more attention.' }
}

export function SessionSummary({ soundIpa, scoreableCorrect, originalTotal, nextReview, onPracticeAgain }: Props) {
  const accuracy = originalTotal > 0 ? Math.round((scoreableCorrect / originalTotal) * 100) : 0
  const { emoji, title, subtitle } = getResult(accuracy)

  const accuracyClass =
    accuracy >= 80 ? 'text-[var(--success)]' :
    accuracy >= 50 ? 'text-[var(--warning)]' :
    'text-[var(--error)]'

  const nextReviewLabel = nextReview
    ? new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).format(nextReview)
    : null

  return (
    <div className="w-full max-w-[480px] mx-auto flex flex-col gap-3">

      {/* Main card */}
      <div className="bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-[var(--radius-2xl)] pt-10 px-8 pb-8 flex flex-col items-center gap-3 text-center">

        {/* IPA */}
        <div className="font-ipa text-display-ipa font-bold text-primary">
          {soundIpa}
        </div>

        {/* Emoji + title + subtitle */}
        <div className="mt-1 text-h1 leading-none">{emoji}</div>
        <div className="text-h3 text-balance text-fg">
          {title}
        </div>
        <p className="m-0 text-caption text-fg-muted">
          {subtitle}
        </p>

        {/* Divider */}
        <div className="w-full h-px bg-[var(--border-subtle)] my-2" />

        {/* Accuracy % */}
        <div className={`text-h1 font-bold tabular-nums ${accuracyClass}`}>
          {accuracy}%
        </div>
        <p className="text-sm text-[var(--text-tertiary)] m-0">
          {scoreableCorrect} of {originalTotal} correct
        </p>

        {/* Next review chip */}
        {nextReviewLabel && (
          <div className="mt-1 py-3 px-5 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-sunken)] text-[13px] text-[var(--text-secondary)]">
            Next review: <strong className="text-[var(--text-primary)]">{nextReviewLabel}</strong>
          </div>
        )}
      </div>

      {/* Buttons */}
      <button
        type="button"
        onClick={onPracticeAgain}
        className="w-full p-5 rounded-[var(--radius-xl)] border-none [font-family:inherit] text-base font-bold cursor-pointer bg-[var(--gradient-primary)] text-white shadow-[0_4px_20px_color-mix(in_oklch,var(--primary)_30%,transparent)]"
      >
        Practice again
      </button>

      <Link
        href="/practice/sounds"
        className="block w-full p-5 rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-raised)] [font-family:inherit] text-base font-semibold text-[var(--text-secondary)] text-center no-underline"
      >
        Back to practice
      </Link>
    </div>
  )
}
