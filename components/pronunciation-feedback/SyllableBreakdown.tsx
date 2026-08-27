'use client'

// Planned structure:
// <SyllableBreakdown>
//   <SyllableChip />   (uno por sílaba)

import { cn } from '@/lib/cn'
import type { SyllableResult, SyllableStatus } from '@/lib/pronunciation/syllable-scoring'

interface Props {
  syllables: SyllableResult[]
  onSelect?: (index: number) => void
  selectedIndex?: number | null
}

const STATUS_CLASS: Record<SyllableStatus, string> = {
  correct: 'border-transparent text-fg-muted',
  warning: 'border-[var(--admonitions-color-warning)] text-fg',
  error: 'border-[var(--error)] text-fg font-semibold',
}

const STATUS_LABEL: Record<SyllableStatus, string> = {
  correct: 'bien',
  warning: 'casi',
  error: 'mal',
}

export function SyllableBreakdown({ syllables, onSelect, selectedIndex }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {syllables.map((syllable, index) => {
        const interactive = syllable.status !== 'correct' && Boolean(onSelect)
        const label = `${syllable.text}: ${STATUS_LABEL[syllable.status]}`

        if (!interactive) {
          return (
            <span
              key={index}
              aria-label={label}
              className={cn('rounded-md border-b-2 px-1 py-0.5 text-body', STATUS_CLASS[syllable.status])}
            >
              {syllable.text}
            </span>
          )
        }

        return (
          <button
            key={index}
            type="button"
            aria-label={label}
            aria-pressed={selectedIndex === index}
            onClick={() => onSelect?.(index)}
            className={cn(
              'rounded-md border-b-2 px-1 py-0.5 text-body transition-colors hover:bg-surface-raised',
              STATUS_CLASS[syllable.status],
            )}
          >
            {syllable.text}
          </button>
        )
      })}
    </div>
  )
}
