'use client'

// Planned structure:
// <JournalSupportRail>
//   <header: "Guía de escritura" />
//   <JournalContextualGuide />
//   <JournalReactiveSummary /> (solo post-corrección)
// </JournalSupportRail>

import type { JournalFeedback } from '@/lib/journal/correction'
import type { ResolvedSeedWord, SelectedGrammarNote } from '@/lib/journal/scaffold-resolver'
import type { JournalNudgeCefr } from '@/lib/journal/nudge'
import { JournalReactiveSummary } from './JournalFeedbackView'
import { JournalContextualGuide } from './JournalContextualGuide'

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

/** Dedicated support rail — single column, no tabs. */
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
  return (
    <section
      aria-labelledby="journal-support-title"
      className="rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised layout-card-pad"
    >
      <h2
        id="journal-support-title"
        className="font-h4 font-semibold text-fg"
      >
        Guía de escritura
      </h2>

      <div className="mt-5">
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
        {feedback &&
        ((feedback.scheduledTopics?.length ?? 0) > 0 || feedback.newWords.length > 0) ? (
          <div className="mt-6 border-t border-border-subtle pt-5">
            <JournalReactiveSummary feedback={feedback} />
          </div>
        ) : null}
      </div>
    </section>
  )
}
