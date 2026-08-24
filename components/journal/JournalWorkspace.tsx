'use client'

// Planned structure:
// <JournalWorkspace>
//   <JournalPromptHero />
//   <JournalEditor />           ← botón Revisar integrado en su footer
//   <JournalFeedbackView />     ← estado corrected
// </JournalWorkspace>

import { useEffect, useRef } from 'react'
import { useJournalEntry } from '@/hooks/useJournalEntry'
import type { JournalFeedback } from '@/lib/journal/correction'
import { JOURNAL_CORRECTION_RETRY_HINT } from '@/lib/journal/status-copy'
import type { JournalEntryRecord } from '@/lib/journal/types'
import { JournalEditor } from './JournalEditor'
import { JournalFeedbackView } from './JournalFeedbackView'

interface JournalWorkspaceProps {
  entry: JournalEntryRecord
  targetLength?: number
  hintsEnabled: boolean
  onHintsEnabledChange: (enabled: boolean) => void
  onDraftChange?: (draft: JournalDraftState) => void
  starterRequest?: string | null
  onStarterRequestHandled?: () => void
  onCorrection?: (feedback: JournalFeedback) => void
  /** Palabras de vocab objetivo para resaltado inline en el editor. */
  vocabWords?: string[]
}

export interface JournalDraftState {
  content: string
  wordCount: number
}

export function JournalWorkspace({
  entry,
  targetLength = 60,
  onDraftChange,
  starterRequest = null,
  onStarterRequestHandled,
  onCorrection,
  vocabWords = [],
}: JournalWorkspaceProps) {
  const journal = useJournalEntry(entry)
  const reportedCorrection = useRef(false)
  const handledStarterRequest = useRef<string | null>(null)
  const wordCount = journal.content.trim() ? journal.content.trim().split(/\s+/).length : 0

  useEffect(() => {
    if (!starterRequest) {
      handledStarterRequest.current = null
      return
    }
    if (starterRequest === handledStarterRequest.current) return

    handledStarterRequest.current = starterRequest
    const starter = starterRequest.replace(/\.\.\.\s*$/, '').trim()
    if (starter) {
      const separator = journal.content.length === 0 || /\s$/.test(journal.content) ? '' : ' '
      journal.updateContent(`${journal.content}${separator}${starter}`)
    }
    onStarterRequestHandled?.()
  }, [journal.content, journal.updateContent, onStarterRequestHandled, starterRequest])

  useEffect(() => {
    onDraftChange?.({ content: journal.content, wordCount })
  }, [journal.content, onDraftChange, wordCount])

  useEffect(() => {
    if (journal.status !== 'corrected') {
      reportedCorrection.current = false
      return
    }
    if (journal.feedback && onCorrection && !reportedCorrection.current) {
      reportedCorrection.current = true
      onCorrection(journal.feedback)
    }
  }, [journal.feedback, journal.status, onCorrection])

  // El botón Revisar vive en el footer del textarea.
  // Solo se muestra cuando hay contenido (canSubmit) — nunca disabled+banner.
  const canRevise =
    journal.status === 'draft' && journal.canSubmit && !journal.correcting

  // Para estado "submitted" (esperando revisión):
  const canRequestCorrection =
    journal.status === 'submitted' && journal.canCorrect && !journal.correcting

  return (
    <section className="flex w-full flex-col layout-section-gap rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised layout-card-pad">
      {/* Pregunta */}
      <section
        aria-labelledby="journal-prompt"
        className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-border-subtle bg-surface-base/80 p-4 transition-colors"
      >
        <span className="font-kicker text-primary">Pregunta de hoy</span>
        <h2
          id="journal-prompt"
          className="text-wrap font-h3 font-semibold text-fg text-balance"
        >
          {entry.prompt}
        </h2>
      </section>

      {/* Editor con botón Revisar integrado en el footer */}
      {journal.status !== 'corrected' && (
        <JournalEditor
          content={journal.content}
          onChange={journal.updateContent}
          saveState={journal.saveState}
          wordCount={wordCount}
          targetLength={targetLength}
          disabled={journal.status !== 'draft' || journal.correcting}
          onSubmitShortcut={canRevise ? () => void journal.submit() : undefined}
          onSubmit={
            canRevise
              ? () => void journal.submit()
              : canRequestCorrection
                ? () => void journal.requestCorrection()
                : undefined
          }
          submitLabel={
            journal.correcting
              ? 'Leyendo…'
              : journal.status === 'submitted'
                ? journal.correctionError
                  ? 'Reintentar'
                  : 'Pedir revisión'
                : journal.isOnline
                  ? 'Revisar'
                  : 'Guardar'
          }
          isSubmitting={journal.correcting}
          vocabWords={vocabWords}
        />
      )}

      {/* Sin conexión, texto guardado */}
      {!journal.isOnline && journal.canSubmit && journal.status === 'draft' && (
        <p role="status" className="font-body-sm text-fg-muted">
          Sin conexión: guardamos tu página aquí. Podrás pedir la revisión al recuperar la
          conexión.
        </p>
      )}

      {/* Error de corrección */}
      {journal.correctionError && (
        <p role="alert" className="font-body-sm text-error">
          {journal.correctionError} {JOURNAL_CORRECTION_RETRY_HINT}
        </p>
      )}

      {/* Seguir editando (estado submitted, antes de la revisión) */}
      {journal.status === 'submitted' && journal.canResumeDraft && (
        <button
          type="button"
          className="focus-ring self-start font-body-sm text-fg-muted underline underline-offset-2 hover:text-fg"
          onClick={() => void journal.resumeDraft()}
        >
          Seguir editando
        </button>
      )}

      {/* Feedback post-corrección */}
      {journal.status === 'corrected' && journal.correctedContent && journal.feedback && (
        <JournalFeedbackView
          originalContent={journal.content}
          correctedContent={journal.correctedContent}
          feedback={journal.feedback}
          userId={entry.userId}
          showReactive={!onCorrection}
        />
      )}

      {/* Volver a escribir (estado corrected, después de ver el feedback) */}
      {journal.status === 'corrected' && journal.canResumeDraft && (
        <button
          type="button"
          className="focus-ring self-start font-body-sm text-fg-muted underline underline-offset-2 hover:text-fg"
          onClick={() => void journal.resumeDraft()}
        >
          Escribir otra vez
        </button>
      )}
    </section>
  )
}
