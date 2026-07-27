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

import { ChevronDown } from '@/components/icons'
import { PillButton } from '@/components/ui/PillButton'
import { useJournalEntry } from '@/hooks/useJournalEntry'
import type { JournalEntryRecord } from '@/lib/journal/types'
import { JournalEditor } from './JournalEditor'
import { JournalFeedbackView } from './JournalFeedbackView'
import { JournalHistoryList } from './JournalHistoryList'
import { WritingGuidePanel } from './WritingGuidePanel'

interface JournalWorkspaceProps {
  entry: JournalEntryRecord
}

export function JournalWorkspace({ entry }: JournalWorkspaceProps) {
  const journal = useJournalEntry(entry)
  const showEmptyHints = journal.status === 'draft' && !journal.canSubmit && !journal.correcting

  return (
    <div className="flex flex-col layout-section-gap">
      <section aria-labelledby="journal-prompt" className="flex flex-col gap-2">
        <p className="font-body-sm text-fg-muted">Pregunta de hoy</p>
        <h2
          id="journal-prompt"
          className="text-wrap font-h3 font-semibold text-fg text-balance"
        >
          {entry.prompt}
        </h2>
      </section>

      {journal.status === 'draft' && <WritingGuidePanel />}

      {journal.status !== 'corrected' && (
        <JournalEditor
          content={journal.content}
          onChange={journal.updateContent}
          saveState={journal.saveState}
          disabled={journal.status !== 'draft' || journal.correcting}
          onSubmitShortcut={
            journal.status === 'draft' && journal.canSubmit && !journal.correcting
              ? () => void journal.submit()
              : undefined
          }
        />
      )}

      {journal.status === 'draft' && (
        <div className="flex flex-col gap-2">
          <PillButton
            variant="primary"
            size="md"
            className="min-h-11 w-full"
            disabled={!journal.canSubmit || journal.correcting}
            isLoading={journal.correcting}
            onClick={() => void journal.submit()}
          >
            {journal.correcting
              ? 'Leyendo tu texto…'
              : journal.isOnline
                ? 'Revisar mi texto'
                : 'Guardar sin conexión'}
          </PillButton>
          {showEmptyHints && (
            <>
              <p className="font-body-sm text-fg-muted">
                Escribe al menos una frase. Luego puedes pedir una revisión cuando quieras.
              </p>
              <details className="group rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken">
                <summary className="focus-ring flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 font-body-sm font-medium text-fg">
                  <ChevronDown
                    size={14}
                    className="shrink-0 text-fg-subtle transition-transform duration-150 group-open:rotate-180"
                    aria-hidden
                  />
                  ¿Qué pasa después?
                </summary>
                <p className="border-t border-border-subtle px-3 py-2.5 font-body-sm text-fg-muted">
                  Te devolvemos una versión más natural de tu texto y unos pocos detalles para
                  notar — sin tachones en rojo. Tú eliges qué palabras guardar.
                </p>
              </details>
            </>
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
            Página guardada.{' '}
            {journal.isOnline
              ? 'Puedes pedir la revisión cuando quieras.'
              : 'Recupera la conexión para pedir la revisión.'}
          </p>
          <PillButton
            variant="primary"
            size="md"
            className="min-h-11 w-full"
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
              className="w-full"
              onClick={() => void journal.resumeDraft()}
            >
              Seguir editando
            </PillButton>
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
        />
      )}

      <JournalHistoryList userId={entry.userId} excludeDate={entry.entryDate} />
    </div>
  )
}
