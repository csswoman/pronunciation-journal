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
  size?: 'sm' | 'md'
}

const STATUS_CLASS: Record<SyllableStatus, string> = {
  correct: 'border-[var(--success)] text-[var(--success)]',
  warning: 'border-[var(--warning)] text-[var(--warning)]',
  error: 'border-[var(--error)] text-[var(--error)] font-semibold',
}

const STATUS_LABEL: Record<SyllableStatus, string> = {
  correct: 'bien',
  warning: 'casi',
  error: 'mal',
}

export function SyllableBreakdown({
  syllables,
  onSelect,
  selectedIndex,
  size = 'sm',
}: Props) {
  const sizeClass = size === 'sm' ? 'px-1 py-0 text-caption' : 'px-1 py-0.5 text-body'

  return (
    <div className="inline-flex flex-wrap items-center gap-1">
      {syllables.map((syllable, index) => {
        const interactive = syllable.status !== 'correct' && Boolean(onSelect)
        const label = `${syllable.text}: ${STATUS_LABEL[syllable.status]}`

        if (!interactive) {
          return (
            <span
              key={index}
              aria-label={label}
              className={cn('rounded-md border-b-2', sizeClass, STATUS_CLASS[syllable.status])}
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
            onClick={(e) => {
              e.stopPropagation()
              onSelect?.(index)
            }}
            className={cn(
              'rounded-md border-b-2 transition-colors hover:bg-surface-raised cursor-pointer focus-ring',
              sizeClass,
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
