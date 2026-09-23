'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import Link from 'next/link'
import { Check, ChevronRight, Notebook, Pencil } from '@/components/icons'
import { listLocalJournalEntries } from '@/lib/journal/queries'

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

  if (entries === undefined) return null

  if (past.length === 0) {
    return (
      <section aria-labelledby="journal-history" className="flex flex-col gap-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <span id="journal-history" className="font-kicker text-fg-muted select-none">
            TU HISTORIAL
          </span>
          <span className="inline-flex rounded-full border border-border-default bg-surface-sunken px-3.5 py-1 font-sans text-caption font-semibold text-fg select-none">
            0 páginas
          </span>
        </div>
        <p className="font-sans text-body-sm text-fg-muted">
          Todavía no tienes páginas guardadas. Escribe hoy para empezar tu historial.
        </p>
      </section>
    )
  }

  return (
    <section aria-labelledby="journal-history" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <span id="journal-history" className="font-kicker text-fg-muted select-none">
          TU HISTORIAL
        </span>
        <span className="inline-flex rounded-full border border-border-default bg-surface-sunken px-3.5 py-1 font-sans text-caption font-semibold text-fg select-none">
          {past.length} {past.length === 1 ? 'página' : 'páginas'}
        </span>
      </div>

      <ul className="flex flex-col gap-3" role="list">
        {past.map((entry) => {
          const isReviewed = entry.status === 'corrected' || entry.status === 'submitted'
          const dateLabel = formatJournalDate(entry.entryDate)
          const firstLine = entry.content.trim().split('\n')[0] || entry.prompt

          return (
            <li key={entry.id}>
              <Link
                href={`/journal/${entry.entryDate}`}
                className="focus-ring group flex items-center justify-between gap-4 rounded-2xl bg-mint-soft p-4 sm:p-5 transition-all hover:bg-mint-soft/90 hover:scale-[1.005] shadow-2xs"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {/* Icono de libreta en círculo verde */}
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-mint-deep/60 text-ink shadow-2xs">
                    <Notebook size={22} className="text-ink" aria-hidden />
                  </div>

                  {/* Fecha + Frase/Título principal */}
                  <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                    <span className="font-sans text-caption font-medium text-ink-secondary">
                      {dateLabel}
                    </span>
                    <h3 className="font-heading text-body-md sm:text-body-lg font-bold text-ink truncate leading-snug">
                      {firstLine}
                    </h3>
                  </div>
                </div>

                {/* Badge Guardada / Borrador + Chevron */}
                <div className="flex items-center gap-3 shrink-0">
                  {isReviewed ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-mint-deep px-3.5 py-1 font-sans text-caption font-bold text-ink select-none shadow-2xs">
                      <Check size={14} aria-hidden /> Guardada
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/40 bg-transparent px-3.5 py-1 font-sans text-caption font-bold text-ink select-none">
                      <Pencil size={14} aria-hidden /> Borrador
                    </span>
                  )}
                  <ChevronRight
                    size={18}
                    className="text-ink-secondary transition-transform group-hover:translate-x-0.5 group-hover:text-ink"
                    aria-hidden
                  />
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function formatJournalDate(entryDate: string): string {
  try {
    const d = new Date(`${entryDate}T12:00:00`)
    return new Intl.DateTimeFormat('es-PE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d)
  } catch {
    return entryDate
  }
}
