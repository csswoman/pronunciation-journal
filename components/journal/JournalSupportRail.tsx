'use client'

import { useState } from 'react'
import type { JournalFeedback } from '@/lib/journal/correction'
import type { ResolvedSeedWord, SelectedGrammarNote } from '@/lib/journal/scaffold-resolver'
import type { JournalNudgeCefr } from '@/lib/journal/nudge'
import { JournalReactiveSummary } from './JournalFeedbackView'
import { JournalContextualGuide } from './JournalContextualGuide'
import { JournalRailTab } from './JournalRailTab'
import { WritingGuidePanel } from './WritingGuidePanel'

type RailTab = 'contextual' | 'reference'

interface JournalSupportRailProps {
  promptId: string
  promptText?: string
  cefrLevel?: JournalNudgeCefr
  resolvedVocabulary: ResolvedSeedWord[]
  selectedGrammarNote: SelectedGrammarNote | null
  feedback: JournalFeedback | null
  content?: string
  wordCount?: number
  targetLength?: number
  lastTypedAt?: number | null
  hintsEnabled?: boolean
  onStarterSelect?: (starter: string) => void
}

/** Dedicated support rail: contextual help first, stable reference second. */
export function JournalSupportRail({
  promptId,
  promptText = '',
  cefrLevel = 'A1',
  resolvedVocabulary,
  selectedGrammarNote,
  feedback,
  content = '',
  wordCount = 0,
  targetLength = 60,
  lastTypedAt = null,
  hintsEnabled = true,
  onStarterSelect,
}: JournalSupportRailProps) {
  const [activeTab, setActiveTab] = useState<RailTab>('contextual')

  return (
    <section
      aria-labelledby="journal-support-title"
      className="rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised layout-card-pad"
    >
      <header className="flex flex-col gap-1">
        <p className="font-kicker text-fg-subtle">Mientras escribes</p>
        <h2 id="journal-support-title" className="font-h4 font-semibold text-fg">
          Guía de escritura
        </h2>
      </header>

      <div
        role="tablist"
        aria-label="Capas de la guía del diario"
        className="mt-5 flex rounded-[var(--radius-md)] bg-surface-sunken p-1"
      >
        <JournalRailTab
          active={activeTab === 'contextual'}
          onClick={() => setActiveTab('contextual')}
          controls="journal-support-contextual"
        >
          Para esta entrada
        </JournalRailTab>
        <JournalRailTab
          active={activeTab === 'reference'}
          onClick={() => setActiveTab('reference')}
          controls="journal-support-reference"
        >
          Referencia
        </JournalRailTab>
      </div>

      <div className="mt-5">
        <div
          id="journal-support-contextual"
          role="tabpanel"
          aria-label="Guía para esta entrada"
          hidden={activeTab !== 'contextual'}
        >
          <JournalContextualGuide
            promptId={promptId}
            promptText={promptText}
            cefrLevel={cefrLevel}
            resolvedVocabulary={resolvedVocabulary}
            selectedGrammarNote={selectedGrammarNote}
            content={content}
            wordCount={wordCount}
            targetLength={targetLength}
            lastTypedAt={lastTypedAt}
            hintsEnabled={hintsEnabled}
            onStarterSelect={onStarterSelect}
          />
          {feedback && ((feedback.scheduledTopics?.length ?? 0) > 0 || feedback.newWords.length > 0) ? (
            <div className="mt-6 border-t border-border-subtle pt-5">
              <JournalReactiveSummary feedback={feedback} />
            </div>
          ) : null}
        </div>
        <div
          id="journal-support-reference"
          role="tabpanel"
          aria-label="Referencia de escritura"
          hidden={activeTab !== 'reference'}
        >
          <WritingGuidePanel />
        </div>
      </div>
    </section>
  )
}
