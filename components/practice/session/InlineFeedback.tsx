'use client'

interface Props {
  isCorrect: boolean
}

export function InlineFeedback({ isCorrect }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={
        isCorrect
          ? 'flex items-center justify-center gap-2 rounded-[var(--radius-lg)] border-[1.5px] border-success-border bg-success-soft px-5 py-3 text-success animate-fadeIn'
          : 'flex items-center justify-center gap-2 rounded-[var(--radius-lg)] border-[1.5px] border-error-border bg-error-soft px-5 py-3 text-error animate-fadeIn'
      }
    >
      <span
        className={
          isCorrect
            ? 'inline-flex h-6 w-6 items-center justify-center rounded-full bg-success text-on-primary text-sm font-bold'
            : 'inline-flex h-6 w-6 items-center justify-center rounded-full bg-error text-on-primary text-sm font-bold'
        }
        aria-hidden
      >
        {isCorrect ? '✓' : '✗'}
      </span>
      <span className="text-base font-semibold">
        {isCorrect ? 'Correct!' : 'Incorrect'}
      </span>
    </div>
  )
}
