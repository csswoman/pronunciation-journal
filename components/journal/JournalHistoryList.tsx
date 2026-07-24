'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import Link from 'next/link'
import { listLocalJournalEntries } from '@/lib/journal/queries'
import { JOURNAL_STATUS_CLASS, JOURNAL_STATUS_COPY } from '@/lib/journal/status-copy'
import { cn } from '@/lib/cn'

/** Reactive local history so past entries survive reload and appear offline. */
export function JournalHistoryList({
  userId,
  excludeDate,
}: {
  userId: string
  /** Today's entry lives in the editor — keep it out of "past" lists. */
  excludeDate?: string
}) {
  const entries = useLiveQuery(() => listLocalJournalEntries(userId), [userId])
  const past = (entries ?? []).filter((entry) => entry.entryDate !== excludeDate)

  if (past.length === 0) return null

  return (
    <section aria-labelledby="journal-history" className="flex flex-col gap-2">
      <h2 id="journal-history" className="font-h4 font-semibold text-fg">
        Tu historial
      </h2>
      <ul className="flex flex-col gap-2">
        {past.map((entry) => (
          <li
            key={entry.id}
            className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised transition-colors hover:bg-surface-sunken"
          >
            <Link
              href={`/journal/${entry.entryDate}`}
              className="focus-ring flex min-h-11 items-center gap-3 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="font-body-sm font-medium text-fg">{formatJournalDate(entry.entryDate)}</p>
                <p className="truncate font-body-sm text-fg-muted">{entry.prompt}</p>
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2.5 py-0.5 font-body-xs font-medium',
                  JOURNAL_STATUS_CLASS[entry.status],
                )}
              >
                {JOURNAL_STATUS_COPY[entry.status]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function formatJournalDate(entryDate: string): string {
  return new Intl.DateTimeFormat('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${entryDate}T12:00:00`))
}
