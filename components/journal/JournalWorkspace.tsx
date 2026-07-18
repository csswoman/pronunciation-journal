'use client'

// Planned structure:
// <JournalWorkspace>
//   <JournalPromptCard />
//   <JournalEditor />        (draft)
//   <SubmitBar />            (draft / submitted)
//   <JournalFeedbackView />  (corrected)
//   <JournalHistoryList />
// </JournalWorkspace>

import { PillButton } from '@/components/ui/PillButton'
import { useJournalEntry } from '@/hooks/useJournalEntry'
import type { JournalEntryRecord } from '@/lib/journal/types'
import { JournalEditor } from './JournalEditor'
import { JournalFeedbackView } from './JournalFeedbackView'
import { JournalHistoryList } from './JournalHistoryList'

interface JournalWorkspaceProps {
  entry: JournalEntryRecord
}

export function JournalWorkspace({ entry }: JournalWorkspaceProps) {
  const journal = useJournalEntry(entry)

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="journal-prompt" className="flex flex-col gap-1">
        <h1 id="journal-prompt" className="font-h2 font-bold text-fg">
          Journal
        </h1>
        <p className="text-fg-muted">{entry.prompt}</p>
      </section>

      {journal.status !== 'corrected' && (
        <JournalEditor
          content={journal.content}
          onChange={journal.updateContent}
          saveState={journal.saveState}
          disabled={journal.status !== 'draft' || journal.correcting}
        />
      )}

      {journal.status === 'draft' && (
        <div className="flex flex-col gap-2">
          <PillButton
            variant="primary"
            size="md"
            className="min-h-11 w-full"
            disabled={!journal.canSubmit || journal.correcting}
            onClick={() => void journal.submit()}
          >
            {journal.correcting ? 'Corrigiendo…' : 'Enviar para corrección'}
          </PillButton>
          {!journal.isOnline && (
            <p role="status" className="font-body-sm text-fg-muted">
              Sin conexión: guardaremos tu entrada y podrás corregirla al reconectar.
            </p>
          )}
        </div>
      )}

      {journal.status === 'submitted' && (
        <div className="flex flex-col gap-2">
          <p role="status" className="font-body-sm text-fg-muted">
            Entrada enviada. {journal.isOnline ? 'Pide la corrección cuando quieras.' : 'Se corregirá al reconectar.'}
          </p>
          <PillButton
            variant="primary"
            size="md"
            className="min-h-11 w-full"
            disabled={!journal.canCorrect || journal.correcting}
            onClick={() => void journal.requestCorrection()}
          >
            {journal.correcting ? 'Corrigiendo…' : 'Corregir ahora'}
          </PillButton>
        </div>
      )}

      {journal.correctionError && (
        <p role="alert" className="font-body-sm text-error">
          {journal.correctionError}
        </p>
      )}

      {journal.status === 'corrected' && journal.correctedContent && journal.feedback && (
        <JournalFeedbackView
          correctedContent={journal.correctedContent}
          feedback={journal.feedback}
        />
      )}

      <JournalHistoryList userId={entry.userId} />
    </div>
  )
}
