'use client'

import Link from 'next/link'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, RefreshCw } from '@/components/icons'
import PageHeader from '@/components/layout/PageHeader'
import { PillButton } from '@/components/ui/PillButton'
import { useJournalEntry } from '@/hooks/useJournalEntry'
import { getLocalJournalEntry, listLocalJournalEntries } from '@/lib/journal/queries'
import { JOURNAL_STATUS_CLASS, JOURNAL_STATUS_COPY } from '@/lib/journal/status-copy'
import type { JournalEntryRecord } from '@/lib/journal/types'
import { cn } from '@/lib/cn'
import { JournalFeedbackView } from './JournalFeedbackView'
import { JournalHistoryTimeline } from './JournalHistoryTimeline'

const PILL_LINK =
  'focus-ring inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 py-2 text-caption font-medium text-on-primary transition-colors duration-150 hover:bg-primary-hover'

interface JournalHistoryEntryClientProps {
  userId: string
  entryDate: string
}

interface EntryQueryState {
  entry?: JournalEntryRecord
  loaded: boolean
}

export function JournalHistoryEntryClient({ userId, entryDate }: JournalHistoryEntryClientProps) {
  const result = useLiveQuery<EntryQueryState>(
    async () => ({
      entry: await getLocalJournalEntry(userId, entryDate),
      loaded: true,
    }),
    [userId, entryDate],
  )
  const entries = useLiveQuery(() => listLocalJournalEntries(userId), [userId]) ?? []

  return (
    <div className="flex flex-col layout-section-gap">
      <Link
        href="/journal"
        className="focus-ring inline-flex min-h-11 w-fit items-center gap-2 font-body-sm font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeft size={16} aria-hidden />
        Volver al diario
      </Link>

      <PageHeader
        title="Diario"
        subtitle={formatLongDate(entryDate)}
        variant="compact"
      />

      <JournalHistoryTimeline entries={entries} selectedDate={entryDate} />

      {!result?.loaded ? (
        <HistoryLoadingState />
      ) : !result.entry ? (
        <HistoryNotFoundState />
      ) : (
        <JournalHistoryEntry key={result.entry.id} entry={result.entry} />
      )}
    </div>
  )
}

function JournalHistoryEntry({ entry }: { entry: JournalEntryRecord }) {
  const journal = useJournalEntry(entry)
  const isDraft = journal.status === 'draft'
  const isSubmitted = journal.status === 'submitted'
  const correctedContent = journal.correctedContent
  const feedback = journal.feedback

  return (
    <article className="flex flex-col layout-section-gap">
      <section aria-labelledby="history-prompt" className="flex flex-col gap-2">
        <StatusBadge status={journal.status} />
        <h2 id="history-prompt" className="text-wrap font-h4 font-semibold text-fg text-balance">
          {entry.prompt}
        </h2>
      </section>

      <section aria-labelledby="history-original" className="flex flex-col gap-2">
        <h3 id="history-original" className="font-body-sm font-semibold text-fg">
          Tu texto
        </h3>
        <p className="whitespace-pre-wrap break-words rounded-[var(--radius-lg)] border border-border-subtle bg-surface-raised p-4 text-base text-fg">
          {entry.content || 'Esta página todavía está vacía.'}
        </p>
      </section>

      {isDraft && (
        <div className="flex flex-col gap-3 rounded-[var(--radius-md)] bg-surface-sunken p-4">
          <p className="font-body-sm text-fg-muted">
            Esta página sigue en borrador. Puedes retomarla y pedir una revisión cuando quieras.
          </p>
          <Link href="/journal" className={cn(PILL_LINK, 'w-full sm:w-fit')}>
            Continuar escribiendo
          </Link>
        </div>
      )}

      {isSubmitted && (
        <div className="flex flex-col gap-3 rounded-[var(--radius-md)] bg-surface-sunken p-4">
          <p role="status" className="font-body-sm text-fg-muted">
            Esta página está guardada y todavía no tiene revisión.
            {journal.isOnline ? ' Puedes pedirla ahora.' : ' Recupera la conexión para pedirla.'}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <PillButton
              variant="primary"
              size="md"
              className="min-h-11 w-full sm:w-fit"
              icon={<RefreshCw size={16} aria-hidden />}
              disabled={!journal.canCorrect || journal.correcting}
              isLoading={journal.correcting}
              onClick={() => void journal.requestCorrection()}
            >
              {journal.correcting ? 'Leyendo tu texto…' : 'Pedir revisión'}
            </PillButton>
            {journal.canResumeDraft && (
              <PillButton
                variant="quiet"
                size="md"
                className="w-full sm:w-fit"
                onClick={() => void journal.resumeDraft()}
              >
                Seguir editando
              </PillButton>
            )}
          </div>
        </div>
      )}

      {journal.correctionError && (
        <p role="alert" className="font-body-sm text-error">
          {journal.correctionError} Puedes intentarlo de nuevo.
        </p>
      )}

      {journal.status === 'corrected' && correctedContent && feedback && (
        <JournalFeedbackView
          originalContent={entry.content}
          correctedContent={correctedContent}
          feedback={feedback}
          userId={entry.userId}
        />
      )}
    </article>
  )
}

function StatusBadge({ status }: { status: JournalEntryRecord['status'] }) {
  return (
    <span
      className={cn( 'w-fit rounded-full px-2.5 py-1 font-body-xs font-medium', JOURNAL_STATUS_CLASS[status], )}
    >
      {JOURNAL_STATUS_COPY[status]}
    </span>
  )
}

function HistoryLoadingState() {
  return (
    <div role="status" className="flex flex-col gap-3" aria-label="Cargando página">
      <div className="h-4 w-32 animate-pulse rounded bg-surface-sunken" />
      <div className="h-32 animate-pulse rounded-[var(--radius-lg)] bg-surface-sunken" />
    </div>
  )
}

function HistoryNotFoundState() {
  return (
    <section className="flex flex-col gap-3 rounded-[var(--radius-lg)] bg-surface-sunken layout-card-pad">
      <h2 className="font-h4 font-semibold text-fg">No encontramos esa página</h2>
      <p className="font-body-sm text-fg-muted">
        Puede que todavía no se haya guardado en este dispositivo.
      </p>
      <Link href="/journal" className={cn(PILL_LINK, 'w-fit')}>
        Volver al diario
      </Link>
    </section>
  )
}

function formatLongDate(entryDate: string): string {
  return new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${entryDate}T12:00:00`))
}
