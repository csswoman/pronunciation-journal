'use client'

// Planned structure:
// <JournalEntryViewerModal>
//   <ModalBackdrop />
//   <ModalContainer:
//     <TopNavRow: "< Volver al historial" button + "X" close button />
//     <DateHeaderRow: Date title "Domingo, 23 de agosto" + "Borrar página" button />
//     <MintPastelCard:
//       <Badge: "✓ Guardada" or "✎ Borrador" />
//       <PromptTitle: "What conversation do you remember today?" />
//       <Kicker: "LO QUE ESCRIBISTE" />
//       <WritingBubbleContainer: "Today, I had a conversation with my boyfriend." />
//     />
//     <RevisionSection:
//       If not corrected: <DashedContainer: "Esta página todavía no tiene revisión." + "Pedir revisión" CTA + "Seguir editando" outline + explanation />
//       If corrected: <JournalFeedbackView />
//     />
//     <NavigationFooterGrid:
//       <PrevPageCard: "← Página anterior" + date / disabled state />
//       <NextPageCard: "Página siguiente →" + date / disabled state />
//     />
//   />
// </JournalEntryViewerModal>

import { useEffect } from 'react'
import Link from 'next/link'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, Check, Pencil, RefreshCw, X } from '@/components/icons'
import Button from '@/components/ui/Button'
import { useJournalEntry } from '@/hooks/useJournalEntry'
import { dedupePrefixLines } from '@/lib/journal/dedupe-prefix-lines'
import { getLocalJournalEntry, listLocalJournalEntries } from '@/lib/journal/queries'
import { JOURNAL_CORRECTION_RETRY_HINT } from '@/lib/journal/status-copy'
import type { JournalEntryRecord } from '@/lib/journal/types'
import { JournalDeleteEntryButton } from './JournalDeleteEntryButton'
import { JournalFeedbackView } from './JournalFeedbackView'

interface JournalEntryViewerModalProps {
  isOpen: boolean
  entryDate: string | null
  userId?: string
  onClose: () => void
  onBackToHistory?: () => void
  onSelectEntry?: (entryDate: string) => void
}

export function JournalEntryViewerModal({
  isOpen,
  entryDate,
  userId = 'anonymous',
  onClose,
  onBackToHistory,
  onSelectEntry,
}: JournalEntryViewerModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const entry = useLiveQuery(
    async () => (entryDate ? getLocalJournalEntry(userId, entryDate) : undefined),
    [userId, entryDate],
  )
  const entries = useLiveQuery(() => listLocalJournalEntries(userId), [userId]) ?? []

  if (!isOpen || !entryDate) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="journal-entry-viewer-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in-0 duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-2xl flex-col gap-6 rounded-3xl border border-border-default bg-surface-raised text-fg p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 my-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Top Navigation Row ── */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBackToHistory || onClose}
            className="focus-ring inline-flex items-center gap-2 rounded-full border border-border-default bg-surface-sunken px-4 py-2 font-sans text-body-sm font-semibold text-fg hover:bg-surface transition-colors cursor-pointer select-none"
          >
            <ArrowLeft size={16} aria-hidden />
            <span>Volver al historial</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="focus-ring inline-flex size-10 items-center justify-center rounded-full border border-border-default bg-surface-sunken text-fg hover:bg-surface transition-colors cursor-pointer select-none shrink-0"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        {entry ? (
          <ModalEntryContent
            entry={entry}
            entries={entries}
            onClose={onClose}
            onSelectEntry={onSelectEntry}
          />
        ) : (
          <div className="flex flex-col gap-3 py-8 text-center">
            <p className="font-sans text-body-md text-fg-muted">Cargando entrada...</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ModalEntryContent({
  entry,
  entries,
  onClose,
  onSelectEntry,
}: {
  entry: JournalEntryRecord
  entries: JournalEntryRecord[]
  onClose: () => void
  onSelectEntry?: (entryDate: string) => void
}) {
  const journal = useJournalEntry(entry)
  const isReviewed = journal.status === 'corrected' || journal.status === 'submitted'
  const correctedContent = journal.correctedContent
  const feedback = journal.feedback

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime(),
  )
  const currentIndex = sortedEntries.findIndex((e) => e.entryDate === entry.entryDate)
  const prevEntry =
    currentIndex >= 0 && currentIndex < sortedEntries.length - 1 ? sortedEntries[currentIndex + 1] : null
  const nextEntry = currentIndex > 0 ? sortedEntries[currentIndex - 1] : null

  return (
    <div className="flex flex-col gap-6">
      {/* ── Date Title + Delete Button ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2
          id="journal-entry-viewer-modal-title"
          className="font-heading text-h1 sm:text-display font-extrabold text-fg tracking-tight leading-tight"
        >
          {formatLongDate(entry.entryDate)}
        </h2>

        <JournalDeleteEntryButton entry={entry} onDeleteSuccess={onClose} />
      </div>

      {/* ── Mint Pastel Card Container ── */}
      <div className="flex flex-col gap-3 rounded-3xl bg-mint p-6 text-ink shadow-2xs">
        <div>
          {isReviewed ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-mint-deep px-3.5 py-1 font-sans text-caption font-bold text-ink select-none shadow-2xs">
              <Check size={14} aria-hidden /> Guardada
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/40 bg-transparent px-3.5 py-1 font-sans text-caption font-bold text-ink select-none">
              <Pencil size={14} aria-hidden /> Borrador
            </span>
          )}
        </div>

        <h3 className="font-heading text-body-lg sm:text-h2 font-bold text-ink leading-snug my-1">
          {entry.prompt}
        </h3>

        <div className="flex flex-col gap-1.5">
          <span className="font-kicker text-ink-secondary select-none">LO QUE ESCRIBISTE</span>
          <div className="rounded-2xl bg-surface-raised p-4 font-sans text-body-md text-ink leading-relaxed whitespace-pre-wrap shadow-2xs">
            {displayContent(entry.content) || 'Esta página todavía está vacía.'}
          </div>
        </div>
      </div>

      {/* ── Revision / AI Section ── */}
      {journal.status === 'corrected' && correctedContent && feedback ? (
        <div className="rounded-2xl border border-border-subtle bg-surface-sunken/50 p-6 text-fg">
          <JournalFeedbackView
            originalContent={entry.content}
            correctedContent={correctedContent}
            feedback={feedback}
            userId={entry.userId}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-border-default bg-surface-sunken p-6">
          <h4 className="font-heading text-h3 font-bold text-fg">
            Esta página todavía no tiene revisión.
          </h4>

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

            <Link href="/journal">
              <Button variant="secondary" size="md">
                Seguir editando
              </Button>
            </Link>
          </div>

          {journal.correctionError && (
            <p role="alert" className="font-body text-error">
              {journal.correctionError} {JOURNAL_CORRECTION_RETRY_HINT}
            </p>
          )}

          <p className="font-sans text-caption text-fg-muted">
            La IA reescribe tu texto en inglés natural y te explica cada cambio.
          </p>
        </div>
      )}

      {/* ── Footer Navigation Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
        {prevEntry ? (
          <button
            type="button"
            onClick={() => onSelectEntry?.(prevEntry.entryDate)}
            className="focus-ring flex flex-col gap-1 rounded-2xl border border-border-default bg-surface-sunken p-4 text-left transition-colors hover:border-border-strong hover:bg-surface-raised cursor-pointer"
          >
            <span className="font-sans text-body-sm font-bold text-fg flex items-center gap-1.5">
              ← Página anterior
            </span>
            <span className="font-sans text-caption text-fg-muted">
              {formatShortDay(prevEntry.entryDate)}
            </span>
          </button>
        ) : (
          <div className="flex flex-col gap-1 rounded-2xl border border-dashed border-border-default bg-surface-sunken/40 p-4 text-left opacity-60 select-none">
            <span className="font-sans text-body-sm font-bold text-fg-muted">← Página anterior</span>
            <span className="font-sans text-caption text-fg-muted">Esta es tu primera página</span>
          </div>
        )}

        {nextEntry ? (
          <button
            type="button"
            onClick={() => onSelectEntry?.(nextEntry.entryDate)}
            className="focus-ring flex flex-col gap-1 rounded-2xl border border-border-default bg-surface-sunken p-4 text-right items-end transition-colors hover:border-border-strong hover:bg-surface-raised cursor-pointer"
          >
            <span className="font-sans text-body-sm font-bold text-fg flex items-center gap-1.5">
              Página siguiente →
            </span>
            <span className="font-sans text-caption text-fg-muted">
              {formatShortDay(nextEntry.entryDate)}
            </span>
          </button>
        ) : (
          <div className="flex flex-col gap-1 rounded-2xl border border-dashed border-border-default bg-surface-sunken/40 p-4 text-right items-end opacity-60 select-none">
            <span className="font-sans text-body-sm font-bold text-fg-muted">Página siguiente →</span>
            <span className="font-sans text-caption text-fg-muted">Esta es tu página más reciente</span>
          </div>
        )}
      </div>
    </div>
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
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date)
  } catch {
    return entryDate
  }
}
