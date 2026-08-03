'use client'

import { useCallback, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import PageLayout from '@/components/layout/PageLayout'
import { useWritingHintsPreference } from '@/hooks/useWritingHintsPreference'
import type { JournalFeedback } from '@/lib/journal/correction'
import type { ResolvedSeedWord, SelectedGrammarNote } from '@/lib/journal/scaffold-resolver'
import type { JournalEntryRecord } from '@/lib/journal/types'
import type { WritingScaffold } from '@/lib/journal/writing-scaffold'
import { JournalSupportRail } from './JournalSupportRail'
import { JournalHistoryList } from './JournalHistoryList'
import { JournalWorkspace } from './JournalWorkspace'

interface JournalPageClientProps {
  entry: JournalEntryRecord
  promptId: string
  promptText: string
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  targetLength: number
  structure: WritingScaffold['structure']
  subtitle: string
  resolvedVocabulary: ResolvedSeedWord[]
  selectedGrammarNote: SelectedGrammarNote | null
}

/** Shares correction state between the drafting column and the support rail. */
export function JournalPageClient({
  entry,
  promptId,
  promptText,
  cefrLevel,
  targetLength,
  structure,
  subtitle,
  resolvedVocabulary,
  selectedGrammarNote,
}: JournalPageClientProps) {
  const [feedback, setFeedback] = useState<JournalFeedback | null>(null)
  const { enabled: hintsEnabled, setEnabled: setHintsEnabled } = useWritingHintsPreference()
  const [draft, setDraft] = useState({ content: entry.content, wordCount: 0 })
  const [lastTypedAt, setLastTypedAt] = useState<number | null>(null)
  const [starterRequest, setStarterRequest] = useState<string | null>(null)
  const handleDraftChange = useCallback((next: { content: string; wordCount: number }) => {
    setDraft((current) => {
      if (current.content === next.content && current.wordCount === next.wordCount) return current
      return next
    })
    setLastTypedAt(next.content.trim() ? Date.now() : null)
  }, [])
  const handleCorrection = useCallback((next: JournalFeedback) => setFeedback(next), [])
  const handleStarterSelect = useCallback((starter: string) => setStarterRequest(starter), [])
  const clearStarterRequest = useCallback(() => setStarterRequest(null), [])

  return (
    <PageLayout
      archetype="dashboard"
      rail={
        <JournalSupportRail
          promptId={promptId}
          promptText={promptText}
          cefrLevel={cefrLevel}
          resolvedVocabulary={resolvedVocabulary}
          selectedGrammarNote={selectedGrammarNote}
          feedback={feedback}
          content={draft.content}
          wordCount={draft.wordCount}
          targetLength={targetLength}
          lastTypedAt={lastTypedAt}
          hintsEnabled={hintsEnabled}
          onStarterSelect={handleStarterSelect}
        />
      }
      railLabel="Guía de escritura"
    >
      <PageHeader title="Diario" subtitle={subtitle} />
      <div className="layout-stack-loose">
        <JournalWorkspace
          entry={entry}
          targetLength={targetLength}
          structure={structure}
          hintsEnabled={hintsEnabled}
          onHintsEnabledChange={setHintsEnabled}
          onDraftChange={handleDraftChange}
          starterRequest={starterRequest}
          onStarterRequestHandled={clearStarterRequest}
          onCorrection={handleCorrection}
        />
        <JournalHistoryList userId={entry.userId} excludeDate={entry.entryDate} />
      </div>
    </PageLayout>
  )
}
