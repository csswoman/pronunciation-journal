'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from '@/components/icons'
import PageHeader from '@/components/layout/PageHeader'
import PageLayout from '@/components/layout/PageLayout'
import { useWritingHintsPreference } from '@/hooks/useWritingHintsPreference'
import type { JournalFeedback } from '@/lib/journal/correction'
import type { ResolvedSeedWord, SelectedGrammarNote } from '@/lib/journal/scaffold-resolver'
import type { JournalEntryRecord } from '@/lib/journal/types'
import { JournalSupportRail } from './JournalSupportRail'
import { JournalRecentDaysBar } from './JournalRecentDaysBar'
import { JournalWorkspace } from './JournalWorkspace'

interface JournalPageClientProps {
  entry: JournalEntryRecord
  promptId: string
  promptText: string
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  targetLength: number
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
  subtitle,
  resolvedVocabulary,
  selectedGrammarNote,
}: JournalPageClientProps) {
  const [feedback, setFeedback] = useState<JournalFeedback | null>(null)
  const { enabled: hintsEnabled, setEnabled: setHintsEnabled } = useWritingHintsPreference()
  const initialWordCount = entry.content.trim() ? entry.content.trim().split(/\s+/).length : 0
  const [draft, setDraft] = useState({ content: entry.content, wordCount: initialWordCount })
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
      <Link
        href="/journal"
        className="focus-ring inline-flex min-h-11 w-fit items-center gap-2 font-body-sm font-medium text-fg-muted transition-colors hover:text-fg"
      >
        <ArrowLeft size={16} aria-hidden />
        Volver al cuaderno
      </Link>
      <PageHeader title="Diario" subtitle={subtitle} />
      <div className="layout-stack-loose">
        <JournalRecentDaysBar userId={entry.userId} todayDate={entry.entryDate} />
        <JournalWorkspace
          entry={entry}
          targetLength={targetLength}
          hintsEnabled={hintsEnabled}
          onHintsEnabledChange={setHintsEnabled}
          onDraftChange={handleDraftChange}
          starterRequest={starterRequest}
          onStarterRequestHandled={clearStarterRequest}
          onCorrection={handleCorrection}
          vocabWords={resolvedVocabulary.map((w) => w.text)}
        />
      </div>
    </PageLayout>
  )
}
