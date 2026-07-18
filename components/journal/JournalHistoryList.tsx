'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { listLocalJournalEntries } from '@/lib/journal/queries'
import type { JournalStatus } from '@/lib/journal/types'
import { cn } from '@/lib/cn'

const STATUS_COPY: Record<JournalStatus, string> = {
  draft: 'Borrador',
  submitted: 'Enviado',
  corrected: 'Corregido',
}

const STATUS_CLASS: Record<JournalStatus, string> = {
  draft: 'bg-surface-sunken text-fg-muted',
  submitted: 'bg-warning-soft text-warning',
  corrected: 'bg-success-soft text-success',
}

/** Reactive local history so past entries survive reload and appear offline. */
export function JournalHistoryList({ userId }: { userId: string }) {
  const entries = useLiveQuery(() => listLocalJournalEntries(userId), [userId])

  if (!entries || entries.length === 0) return null

  return (
    <section aria-labelledby="journal-history" className="flex flex-col gap-2">
      <h2 id="journal-history" className="font-h4 font-semibold text-fg">
        Entradas anteriores
      </h2>
      <ul className="flex flex-col gap-2">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="font-body-sm font-medium text-fg">{entry.entryDate}</p>
              <p className="truncate font-body-sm text-fg-muted">{entry.prompt}</p>
            </div>
            <span
              className={cn(
                'shrink-0 rounded-full px-2.5 py-0.5 font-body-xs font-medium',
                STATUS_CLASS[entry.status],
              )}
            >
              {STATUS_COPY[entry.status]}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
