'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, RefreshCw, ArrowRight } from '@/components/icons'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { useJournalEntry } from '@/hooks/useJournalEntry'
import { dedupePrefixLines } from '@/lib/journal/dedupe-prefix-lines'
import { getLocalJournalEntry, listLocalJournalEntries } from '@/lib/journal/queries'
import {
  JOURNAL_CORRECTION_RETRY_HINT,
  JOURNAL_STATUS_COPY,
} from '@/lib/journal/status-copy'
import type { JournalEntryRecord } from '@/lib/journal/types'
import { JournalDeleteEntryButton } from './JournalDeleteEntryButton'
import { JournalFeedbackView } from './JournalFeedbackView'
import { JournalHistorySidebar } from './JournalHistorySidebar'

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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 py-2">
      {/* Link de navegación de retorno */}
      <Link
        href="/journal"
        className="focus-ring inline-flex items-center gap-2 font-body font-medium text-fg-muted transition-colors hover:text-fg"
      >
        <ArrowLeft size={18} aria-hidden />
        Volver al cuaderno
      </Link>

      {/* Grid de 2 columnas: Entrada principal (Izquierda) + Historial "TUS PÁGINAS" (Derecha) */}
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start justify-between">
        {/* Columna Principal */}
        <main className="flex-1 min-w-0 max-w-2xl lg:max-w-3xl">
          {!result?.loaded ? (
            <HistoryLoadingState />
          ) : !result.entry ? (
            <HistoryNotFoundState />
          ) : (
            <JournalHistoryEntry key={result.entry.id} entry={result.entry} entries={entries} />
          )}
        </main>

        {/* Columna Derecha: Historial sidebar "TUS PÁGINAS" */}
        <aside className="w-full shrink-0 lg:w-72">
          <JournalHistorySidebar entries={entries} selectedDate={entryDate} />
        </aside>
      </div>
    </div>
  )
}

function JournalHistoryEntry({
  entry,
  entries,
}: {
  entry: JournalEntryRecord
  entries: JournalEntryRecord[]
}) {
  const router = useRouter()
  const journal = useJournalEntry(entry)
  const isDraft = journal.status === 'draft'
  const isSubmitted = journal.status === 'submitted'
  const correctedContent = journal.correctedContent
  const feedback = journal.feedback

  // Computar páginas anterior y siguiente para tarjetas de navegación al pie
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime(),
  )
  const currentIndex = sortedEntries.findIndex((e) => e.entryDate === entry.entryDate)
  const prevEntry = currentIndex >= 0 && currentIndex < sortedEntries.length - 1 ? sortedEntries[currentIndex + 1] : null
  const nextEntry = currentIndex > 0 ? sortedEntries[currentIndex - 1] : null

  // Navegación por teclado (Flecha Izquierda / Flecha Derecha)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return
      }

      if (e.key === 'ArrowLeft' && prevEntry) {
        router.push(`/journal/${prevEntry.entryDate}`)
      } else if (e.key === 'ArrowRight' && nextEntry) {
        router.push(`/journal/${nextEntry.entryDate}`)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [prevEntry, nextEntry, router])


  const badgeVariant =
    entry.status === 'corrected' ? 'success' : entry.status === 'submitted' ? 'warning' : 'neutral'

  return (
    <article className="flex flex-col gap-6 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised layout-card-pad shadow-xs">
      {/* ── Header de entrada: Fecha + Estado + Borrar ── */}
      <header className="flex flex-col gap-2 border-b border-border-subtle pb-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-h2 font-semibold text-fg tracking-tight">
            {formatLongDate(entry.entryDate)}
          </h1>
          <JournalDeleteEntryButton entry={entry} />
        </div>
        <div className="flex items-center gap-2">
          <Badge
            label={JOURNAL_STATUS_COPY[journal.status]}
            variant={badgeVariant}
            dot
            size="sm"
          />
        </div>
      </header>

      {/* ── Pregunta en inglés + traducción ── */}
      <div className="flex flex-col gap-1">
        <h2 className="font-h3 font-semibold text-fg leading-relaxed">
          {entry.prompt}
        </h2>
      </div>

      {/* ── Sección: LO QUE ESCRIBISTE ── */}
      <div className="flex flex-col gap-2.5">
        <span className="font-tiny font-semibold uppercase tracking-wider text-fg-muted">
          LO QUE ESCRIBISTE
        </span>
        <div className="rounded-[var(--radius-md)] border border-border-subtle/70 bg-surface-sunken/60 p-5">
          <p className="font-sans text-base sm:text-lg leading-relaxed text-fg whitespace-pre-wrap break-words">
            {displayContent(entry.content) || 'Esta página todavía está vacía.'}
          </p>
        </div>
      </div>

      {/* ── Estado borrador / Sin revisar / Revisado ── */}
      {isDraft && (
        <div className="flex flex-col gap-3 border-t border-border-subtle pt-4">
          <p className="font-body text-fg-muted">
            Esta página sigue en borrador. Puedes retomarla y pedir una revisión cuando quieras.
          </p>
          <Link href="/journal">
            <Button variant="primary" size="md">
              Seguir editando
            </Button>
          </Link>
        </div>
      )}

      {isSubmitted && (
        <div className="flex flex-col gap-3.5 border-t border-border-subtle pt-4">
          <p className="font-body text-fg-muted">
            Esta página todavía no tiene revisión.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="md"
              disabled={!journal.canCorrect || journal.correcting}
              isLoading={journal.correcting}
              onClick={() => void journal.requestCorrection()}
            >
              <RefreshCw size={16} aria-hidden />
              {journal.correcting ? 'Leyendo tu texto…' : 'Pedir revisión'}
            </Button>

            {journal.canResumeDraft && (
              <Button
                variant="secondary"
                size="md"
                onClick={() => void journal.resumeDraft()}
              >
                Seguir editando
              </Button>
            )}
          </div>
          <p className="font-caption text-fg-muted">
            La IA reescribe tu texto en inglés natural y te explica cada cambio.
          </p>
        </div>
      )}

      {journal.correctionError && (
        <p role="alert" className="font-body text-error">
          {journal.correctionError} {JOURNAL_CORRECTION_RETRY_HINT}
        </p>
      )}

      {journal.status === 'corrected' && correctedContent && feedback && (
        <div className="border-t border-border-subtle pt-4">
          <JournalFeedbackView
            originalContent={entry.content}
            correctedContent={correctedContent}
            feedback={feedback}
            userId={entry.userId}
          />
        </div>
      )}

      {/* ── Tarjetas de navegación al pie: Página anterior / Página siguiente ── */}
      <div className="grid grid-cols-1 gap-3.5 pt-5 border-t border-border-subtle sm:grid-cols-2">
        {prevEntry ? (
          <Link
            href={`/journal/${prevEntry.entryDate}`}
            className="focus-ring flex flex-col gap-1.5 rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken p-4 transition-colors hover:border-border-strong hover:bg-surface-raised"
          >
            <span className="font-caption font-medium text-fg-muted">
              ← Página anterior · {formatShortDay(prevEntry.entryDate)}
            </span>
            <p className="line-clamp-1 font-sans text-sm font-medium text-fg">
              {displayContent(prevEntry.content) || prevEntry.prompt}
            </p>
          </Link>
        ) : (
          <div className="flex flex-col gap-1.5 rounded-[var(--radius-md)] border border-dashed border-border-subtle p-4 opacity-60">
            <span className="font-caption font-medium text-fg-muted">← Página anterior</span>
            <span className="font-sans text-sm text-fg-muted">Esta es tu primera página</span>
          </div>
        )}

        {nextEntry ? (
          <Link
            href={`/journal/${nextEntry.entryDate}`}
            className="focus-ring flex flex-col gap-1.5 rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken p-4 transition-colors hover:border-border-strong hover:bg-surface-raised"
          >
            <span className="font-caption font-medium text-fg-muted flex items-center justify-between">
              <span>Página siguiente · {formatShortDay(nextEntry.entryDate)}</span>
              <ArrowRight size={14} aria-hidden />
            </span>
            <p className="line-clamp-1 font-sans text-sm font-medium text-fg">
              {displayContent(nextEntry.content) || nextEntry.prompt}
            </p>
          </Link>
        ) : (
          <div className="flex flex-col items-end gap-1.5 rounded-[var(--radius-md)] border border-dashed border-border-subtle p-4 opacity-60">
            <span className="font-caption font-medium text-fg-muted">Página siguiente →</span>
            <span className="font-sans text-sm text-fg-muted">Esta es tu página más reciente</span>
          </div>
        )}
      </div>
    </article>
  )
}

function HistoryLoadingState() {
  return (
    <div role="status" className="flex flex-col gap-3" aria-label="Cargando página">
      <div className="h-4 w-32 animate-pulse rounded bg-surface-sunken" />
      <div className="h-48 animate-pulse rounded-[var(--radius-lg)] bg-surface-sunken" />
    </div>
  )
}

function HistoryNotFoundState() {
  return (
    <section className="flex flex-col gap-3 rounded-[var(--radius-lg)] bg-surface-sunken layout-card-pad">
      <h2 className="font-h4 font-semibold text-fg">Aún no escribes nada este día</h2>
      <p className="font-body-sm text-fg-muted">
        Puede que todavía no la hayas guardado en este dispositivo, o que sea un buen momento para
        empezar tu primera página.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link href="/journal" className="w-full sm:w-fit">
          <Button variant="primary" size="md" className="w-full">
            Escribir ahora
          </Button>
        </Link>
      </div>
    </section>
  )
}

function displayContent(content: string): string {
  if (!content.trim()) return content
  return dedupePrefixLines(content.split('\n')).join('\n')
}

function formatLongDate(entryDate: string): string {
  try {
    const date = new Date(`${entryDate}T12:00:00`)
    const formatted = new Intl.DateTimeFormat('es-PE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date)
    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
  } catch {
    return entryDate
  }
}

function formatShortDay(entryDate: string): string {
  try {
    const date = new Date(`${entryDate}T12:00:00`)
    return new Intl.DateTimeFormat('es-PE', {
      weekday: 'short',
      day: 'numeric',
    }).format(date)
  } catch {
    return entryDate
  }
}
