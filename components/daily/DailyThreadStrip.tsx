'use client'

// Planned structure:
// <DailyThreadStrip>
//   label + list of thread hint chips (compact horizontal strip)
// </DailyThreadStrip>

import { formatIpaDisplay } from '@/lib/lexicon/format-ipa'
import type { StepThreadHint } from '@/lib/practice/daily-plan/step-thread'
import { cn } from '@/lib/cn'

const MAX_VISIBLE = 2

interface DailyThreadStripProps {
  hints: StepThreadHint[]
  /** When true, renders as inline sub-content (no orphan grey card). */
  embedded?: boolean
}

/** Words that reappear across today's plan: under Word review when embedded. */
export function DailyThreadStrip({ hints, embedded = false }: DailyThreadStripProps) {
  if (hints.length === 0) return null

  const visible = hints.slice(0, MAX_VISIBLE)
  const overflow = hints.length - visible.length

  return (
    <div
      className={cn(
        'rounded-xl border border-border-default bg-surface-raised px-3.5 py-2.5 shadow-xs flex flex-wrap items-center gap-2.5 transition-colors',
        embedded && 'border-border-subtle bg-surface-sunken px-3 py-2 shadow-none',
      )}
    >
      <span className="font-label text-caption text-fg shrink-0 flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
        Te tocan hoy
      </span>
      <ul className="flex flex-wrap items-center gap-1.5" aria-label="Palabras de pasos anteriores">
        {visible.map((hint) => {
          const ipa = formatIpaDisplay(hint.ipa)
          return (
            <li
              key={hint.word}
              className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-border-subtle bg-surface-sunken px-2.5 py-1 transition-colors"
            >
              <span className="font-body-sm font-medium capitalize text-fg">{hint.word}</span>
              {ipa ? (
                <span className="font-ipa shrink-0 text-caption text-primary">{ipa}</span>
              ) : null}
            </li>
          )
        })}
        {overflow > 0 ? (
          <li className="inline-flex items-center rounded-md border border-border-subtle bg-surface-sunken px-2 py-0.5 font-caption font-mono text-fg-muted">
            +{overflow}
          </li>
        ) : null}
      </ul>
    </div>
  )
}
