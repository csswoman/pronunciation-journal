'use client'

interface Props {
  isCorrect: boolean
}

export function InlineFeedback({ isCorrect }: Props) {
  return (
    <div
      className={
        isCorrect
          ? 'rounded-[var(--radius-lg)] px-5 py-3 border-[1.5px] border-[var(--success-border)] bg-[var(--success-soft)] text-[var(--success)]'
          : 'rounded-[var(--radius-lg)] px-5 py-3 border-[1.5px] border-[var(--error-border)] bg-[var(--error-soft)] text-[var(--error)]'
      }
    >
      <span className="text-base font-semibold">
        {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
      </span>
    </div>
  )
}
