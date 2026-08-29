'use client'

// Planned structure:
// <StepThreadHints>
//   ul list of compact thread word chips
// </StepThreadHints>

import { formatIpaDisplay } from '@/lib/lexicon/format-ipa'
import type { StepThreadHint } from '@/lib/practice/daily-plan/step-thread'

const KIND_LABEL: Partial<Record<StepThreadHint['fromStepKind'], string>> = {
  word_intro: 'Intro',
  word_review: 'Repaso',
  context_practice: 'Contexto',
  reader: 'Lectura',
}

interface StepThreadHintsProps {
  hints: StepThreadHint[]
  className?: string
}

/**
 * Compact chip list for thread words.
 * Prefer `DailyThreadStrip` in daily surfaces (checklist, intro, reader).
 * Kept for tests / ad-hoc callers: do not mount beside PhonemeFocusShell.
 */
export function StepThreadHints({ hints, className }: StepThreadHintsProps) {
  if (hints.length === 0) return null

  return (
    <ul
      className={
        className
          ? `flex flex-wrap gap-2 ${className}`
          : 'flex flex-wrap gap-2'
      }
      aria-label="Palabras de pasos anteriores"
    >
      {hints.map((hint) => {
        const ipa = formatIpaDisplay(hint.ipa)
        const source = KIND_LABEL[hint.fromStepKind] ?? hint.fromStepTitle
        return (
          <li
            key={hint.word}
            className="inline-flex max-w-full items-center gap-2 rounded-lg border border-border-subtle bg-surface-sunken px-2.5 py-1.5"
          >
            <span className="dot-info" aria-hidden />
            <span className="font-body-sm font-medium capitalize text-fg">{hint.word}</span>
            {ipa ? (
              <span className="font-ipa shrink-0 text-caption">{ipa}</span>
            ) : null}
            <span className="font-caption shrink-0 text-fg-muted">de {source}</span>
          </li>
        )
      })}
    </ul>
  )
}
