'use client'

// Planned structure:
// <JournalWorkspace>
//   <JournalPromptHero />
//   <WritingGuidePanel />
//   <JournalEditor />
//   <SubmitBar />
//   <OutcomeHint />         (empty draft)
//   <JournalFeedbackView />
//   <JournalHistoryList />
// </JournalWorkspace>

import Button from '@/components/ui/Button'
import { useEffect, useRef } from 'react'
import { useJournalEntry } from '@/hooks/useJournalEntry'
import type { JournalFeedback } from '@/lib/journal/correction'
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
}

export interface JournalDraftState {
  content: string
  wordCount: number
}

export function JournalWorkspace({
  entry,
  targetLength = 60,
  hintsEnabled,
  onHintsEnabledChange,
  onDraftChange,
  starterRequest = null,
  onStarterRequestHandled,
  onCorrection,
}: JournalWorkspaceProps) {
  const journal = useJournalEntry(entry)
  const reportedCorrection = useRef(false)
  const handledStarterRequest = useRef<string | null>(null)
  const showEmptyHints = journal.status === 'draft' && !journal.canSubmit && !journal.correcting
  const wordCount = journal.content.trim() ? journal.content.trim().split(/\s+/).length : 0
  const meetsTarget = wordCount >= targetLength

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

  return (
    <section className="flex w-full flex-col layout-section-gap rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised layout-card-pad">
      <section
        aria-labelledby="journal-prompt"
        className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-border-subtle bg-surface-base/80 p-4 transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className="font-kicker text-primary">Pregunta de hoy</span>
          <span className="font-body-xs text-fg-muted">
            Meta: {targetLength} palabras
          </span>
        </div>
        <h2
          id="journal-prompt"
          className="text-wrap font-h3 font-semibold text-fg text-balance"
        >
          {entry.prompt}
        </h2>
      </section>

      {journal.status !== 'corrected' && (
        <JournalEditor
          content={journal.content}
          onChange={journal.updateContent}
          saveState={journal.saveState}
          wordCount={wordCount}
          targetLength={targetLength}
          hintsEnabled={hintsEnabled}
          onHintsEnabledChange={onHintsEnabledChange}
          disabled={journal.status !== 'draft' || journal.correcting}
          onSubmitShortcut={
            journal.status === 'draft' && journal.canSubmit && !journal.correcting
              ? () => void journal.submit()
              : undefined
          }
        />
      )}

      {journal.status === 'draft' && (
        <div className="flex flex-col gap-2" aria-live="polite">
          <Button
            variant={journal.canSubmit ? (meetsTarget ? 'primary' : 'secondary') : 'secondary'}
            size="md"
            fullWidth
            className="min-h-11 disabled:border-border-subtle disabled:bg-surface-sunken disabled:text-fg-subtle disabled:opacity-70 disabled:shadow-none"
            disabled={!journal.canSubmit || journal.correcting}
            isLoading={journal.correcting}
            onClick={() => void journal.submit()}
          >
            {journal.correcting
              ? 'Leyendo tu texto…'
              : journal.isOnline
                ? 'Revisar mi texto'
                : 'Guardar sin conexión'}
          </Button>
          {showEmptyHints && (
            <p className="rounded-[var(--radius-sm)] bg-surface-sunken px-3 py-2 font-body-sm text-fg-muted">
              Escribe al menos una frase para activar la revisión.
            </p>
          )}
          {!journal.isOnline && journal.canSubmit && (
            <p role="status" className="font-body-sm text-fg-muted">
              Sin conexión: guardamos tu página aquí. Podrás pedir la revisión al recuperar la
              conexión.
            </p>
          )}
        </div>
      )}

      {journal.status === 'submitted' && (
        <div className="flex flex-col gap-2">
          <p role="status" className="font-body-sm text-fg-muted">
            {journal.correctionError
              ? 'No pudimos revisar tu texto. Tu página sigue guardada.'
              : journal.isOnline
                ? 'Tu página está lista para revisar.'
                : 'Tu página se guardó aquí. Recupera la conexión para pedir la revisión.'}
          </p>
          <Button
            variant="primary"
            size="md"
            fullWidth
            className="min-h-11"
            disabled={!journal.canCorrect || journal.correcting}
            isLoading={journal.correcting}
            onClick={() => void journal.requestCorrection()}
          >
            {journal.correcting
              ? 'Leyendo tu texto…'
              : journal.correctionError
                ? 'Reintentar revisión'
                : 'Pedir revisión'}
          </Button>
          {journal.canResumeDraft && (
            <Button
              variant="ghost"
              size="md"
              fullWidth
              onClick={() => void journal.resumeDraft()}
            >
              Seguir editando
            </Button>
          )}
        </div>
      )}

      {journal.correctionError && (
        <p role="alert" className="font-body-sm text-error">
          {journal.correctionError}
        </p>
      )}

      {journal.status === 'corrected' && journal.correctedContent && journal.feedback && (
        <JournalFeedbackView
          originalContent={journal.content}
          correctedContent={journal.correctedContent}
          feedback={journal.feedback}
          userId={entry.userId}
          showReactive={!onCorrection}
        />
      )}
    </section>
  )
}
