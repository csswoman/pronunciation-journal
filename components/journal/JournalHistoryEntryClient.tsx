'use client'

import Link from 'next/link'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, RefreshCw } from '@/components/icons'
import PageHeader from '@/components/layout/PageHeader'
import { PillButton } from '@/components/ui/PillButton'
import { useJournalEntry } from '@/hooks/useJournalEntry'
import { getLocalJournalEntry, listLocalJournalEntries } from '@/lib/journal/queries'
import type { JournalEntryRecord } from '@/lib/journal/types'
import { JournalFeedbackView } from './JournalFeedbackView'
import { JournalHistoryTimeline } from './JournalHistoryTimeline'

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
    <div className="flex flex-col gap-6">
      <Link
        href="/journal"
        className="focus-ring inline-flex min-h-11 w-fit items-center gap-2 font-body-sm font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeft size={16} aria-hidden />
        Volver al Journal
      </Link>

      <PageHeader
        kicker="HISTORIAL"
        title="Journal"
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
  const isSubmitted = journal.status === 'submitted'
  const correctedContent = journal.correctedContent
  const feedback = journal.feedback

  return (
    <article className="flex flex-col gap-6">
      <section aria-labelledby="history-prompt" className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-kicker text-fg-muted">{formatLongDate(entry.entryDate)}</p>
          <StatusBadge status={journal.status} />
        </div>
        <h2 id="history-prompt" className="font-h4 font-semibold text-fg">{entry.prompt}</h2>
      </section>

      <section aria-labelledby="history-original" className="flex flex-col gap-2">
        <h3 id="history-original" className="font-body-sm font-semibold text-fg">Tu entrada</h3>
        <p className="whitespace-pre-wrap break-words rounded-[var(--radius-lg)] border border-border-subtle bg-surface-raised p-4 text-base text-fg">
          {entry.content || 'Esta entrada no contiene texto.'}
        </p>
      </section>

      {isSubmitted && (
        <div className="flex flex-col gap-3 rounded-[var(--radius-md)] bg-surface-sunken p-4">
          <p role="status" className="font-body-sm text-fg-muted">
            Esta entrada está guardada y todavía no tiene corrección.
            {journal.isOnline ? ' Puedes pedirla ahora.' : ' Recupera la conexión para pedirla.'}
          </p>
          <PillButton
            variant="primary"
            size="md"
            className="min-h-11 w-full sm:w-fit"
            icon={<RefreshCw size={16} aria-hidden />}
            disabled={!journal.canCorrect || journal.correcting}
            isLoading={journal.correcting}
            onClick={() => void journal.requestCorrection()}
          >
            {journal.correcting ? 'Corrigiendo…' : 'Corregir ahora'}
          </PillButton>
        </div>
      )}

      {journal.correctionError && (
        <p role="alert" className="font-body-sm text-error">
          {journal.correctionError} Puedes intentarlo de nuevo.
        </p>
      )}

      {journal.status === 'corrected' && correctedContent && feedback && (
        <JournalFeedbackView
          correctedContent={correctedContent}
          feedback={feedback}
        />
      )}
    </article>
  )
}

function StatusBadge({ status }: { status: JournalEntryRecord['status'] }) {
  const copy = status === 'corrected' ? 'Corregida' : status === 'submitted' ? 'Enviada' : 'Borrador'
  const className = status === 'corrected'
    ? 'bg-success-soft text-success'
    : status === 'submitted'
      ? 'bg-warning-soft text-warning'
      : 'bg-surface-sunken text-fg-muted'

  return <span className={`rounded-full px-2.5 py-1 font-body-xs font-medium ${className}`}>{copy}</span>
}

function HistoryLoadingState() {
  return (
    <div role="status" className="flex flex-col gap-3" aria-label="Cargando entrada">
      <div className="h-4 w-32 animate-pulse rounded bg-surface-sunken" />
      <div className="h-32 animate-pulse rounded-[var(--radius-lg)] bg-surface-sunken" />
    </div>
  )
}

function HistoryNotFoundState() {
  return (
    <section className="flex flex-col gap-3 rounded-[var(--radius-lg)] bg-surface-sunken p-6">
      <h2 className="font-h4 font-semibold text-fg">No encontramos esa entrada</h2>
      <p className="font-body-sm text-fg-muted">
        Puede que todavía no se haya guardado en este dispositivo.
      </p>
      <Link href="/journal" className="focus-ring inline-flex min-h-11 w-fit items-center rounded-md bg-primary px-4 py-2 font-body-sm font-medium text-on-primary hover:bg-primary-hover">
        Volver al Journal
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
