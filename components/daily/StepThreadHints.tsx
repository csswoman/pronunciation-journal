'use client'

import type { StepThreadHint } from '@/lib/practice/daily-plan/step-thread'

const KIND_LABEL: Partial<Record<StepThreadHint['fromStepKind'], string>> = {
  word_intro: 'Intro',
  word_review: 'Review',
  context_practice: 'Context',
  reader: 'Reading',
}

interface StepThreadHintsProps {
  hints: StepThreadHint[]
  className?: string
}

/** Surfaces words that already appeared in an earlier vocab/reader step. */
export function StepThreadHints({ hints, className }: StepThreadHintsProps) {
  if (hints.length === 0) return null

  return (
    <ul
      className={className ? `flex flex-col gap-1.5 ${className}` : 'flex flex-col gap-1.5'}
      aria-label="Words from earlier steps"
    >
      {hints.map((hint) => (
        <li key={hint.word} className="font-body-sm text-(--text-secondary)">
          <span className="font-medium text-(--text-primary)">{hint.word}</span>
          {' · '}from {KIND_LABEL[hint.fromStepKind] ?? hint.fromStepTitle}
        </li>
      ))}
    </ul>
  )
}
