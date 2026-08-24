'use client'

// Planned structure:
// <JournalRecentDaysBar>
//   <RecentDaysHeader />
//   <RecentDaysList>
//     <TodayPill />
//     <PastDayPills />
//   </RecentDaysList>
// </JournalRecentDaysBar>

import Link from 'next/link'
import { useLiveQuery } from 'dexie-react-hooks'
import { listLocalJournalEntries } from '@/lib/journal/queries'
import { JOURNAL_STATUS_COPY } from '@/lib/journal/status-copy'
import { cn } from '@/lib/cn'

interface JournalRecentDaysBarProps {
  userId: string
  todayDate: string
}

/** Non-intrusive recent days navigation placed above the active drafting space. */
export function JournalRecentDaysBar({ userId, todayDate }: JournalRecentDaysBarProps) {
  const entries = useLiveQuery(() => listLocalJournalEntries(userId, 7), [userId])
  const pastEntries = (entries ?? []).filter((entry) => entry.entryDate !== todayDate)

  // Primera página: fila compacta sin card border
  if (pastEntries.length === 0) {
    return (
      <p
        aria-label="Páginas recientes del diario"
        className="font-body-xs text-fg-muted"
      >
        Tu primera página
      </p>
    )
  }

  return (
    <nav
      aria-label="Páginas recientes del diario"
      className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-border-subtle bg-surface-raised/60 px-4 py-3"
    >
      <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 py-0.5">
        {/* Today's active day indicator */}
        <div
          aria-current="date"
          className="flex min-h-9 shrink-0 items-center gap-2 rounded-[var(--radius-full)] border border-primary bg-primary-soft px-3.5 py-1 text-fg"
        >
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" aria-hidden />
          <span className="font-body-sm font-medium">Hoy</span>
        </div>

        {/* Past entries list */}
        {pastEntries.map((entry) => (
          <Link
            key={entry.id}
            href={`/journal/${entry.entryDate}`}
            title={`${formatFullDate(entry.entryDate)}: ${entry.prompt}`}
            className={cn(
              'focus-ring group flex min-h-9 shrink-0 items-center gap-2 rounded-[var(--radius-full)] border border-border-subtle bg-surface-base px-3.5 py-1 transition-all',
              'hover:border-border-strong hover:bg-surface-sunken',
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full shrink-0',
                entry.status === 'corrected' && 'bg-success',
                entry.status === 'submitted' && 'bg-warning',
                entry.status === 'draft' && 'bg-fg-subtle',
              )}
              aria-hidden
            />
            <span className="font-body-sm text-fg-muted group-hover:text-fg">
              {formatShortDate(entry.entryDate)}
            </span>
            <span className="sr-only">
              · {JOURNAL_STATUS_COPY[entry.status]}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  )
}

function formatShortDate(entryDate: string): string {
  const date = new Date(`${entryDate}T12:00:00`)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)

  if (entryDate === yesterday.toISOString().split('T')[0]) {
    return 'Ayer'
  }

  return new Intl.DateTimeFormat('es-PE', {
    weekday: 'short',
    day: 'numeric',
  }).format(date)
}

function formatFullDate(entryDate: string): string {
  return new Intl.DateTimeFormat('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${entryDate}T12:00:00`))
}
