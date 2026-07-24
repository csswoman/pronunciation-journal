'use client'

import Link from 'next/link'
import { cn } from '@/lib/cn'
import type { JournalEntryRecord } from '@/lib/journal/types'
import { JOURNAL_STATUS_COPY } from '@/lib/journal/status-copy'

interface JournalHistoryTimelineProps {
  entries: JournalEntryRecord[]
  selectedDate: string
}

/** Nearby-entry navigation for the focused history view. */
export function JournalHistoryTimeline({ entries, selectedDate }: JournalHistoryTimelineProps) {
  if (entries.length === 0) return null

  return (
    <nav aria-label="Historial de páginas" className="flex min-w-0 flex-col gap-2">
      <p className="font-body-sm text-fg-muted">Otras páginas</p>
      <div className="-mx-1 flex min-w-0 gap-2 overflow-x-auto px-1 pb-2">
        {entries.map((entry) => {
          const selected = entry.entryDate === selectedDate
          return (
            <Link
              key={entry.id}
              href={`/journal/${entry.entryDate}`}
              aria-current={selected ? 'page' : undefined}
              className={cn(
                'flex min-h-11 min-w-[8.5rem] shrink-0 flex-col justify-center rounded-[var(--radius-md)] border px-3 py-2 transition-colors',
                'focus-ring hover:bg-surface-sunken',
                selected
                  ? 'border-primary bg-primary-soft text-fg'
                  : 'border-border-subtle bg-surface-raised text-fg',
              )}
            >
              <span className="font-body-sm font-semibold">{formatShortDate(entry.entryDate)}</span>
              <span className="mt-0.5 flex items-center gap-1.5 font-body-xs text-fg-muted">
                <span
                  className={cn(
                    'inline-block h-1.5 w-1.5 rounded-full',
                    entry.status === 'corrected' && 'bg-success',
                    entry.status === 'submitted' && 'bg-warning',
                    entry.status === 'draft' && 'bg-fg-subtle',
                  )}
                  aria-hidden
                />
                {JOURNAL_STATUS_COPY[entry.status]}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

function formatShortDate(entryDate: string): string {
  return new Intl.DateTimeFormat('es-PE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${entryDate}T12:00:00`))
}
