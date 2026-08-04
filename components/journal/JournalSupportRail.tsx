'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from '@/components/icons'
import type { JournalFeedback } from '@/lib/journal/correction'
import { writingScaffoldFor } from '@/lib/journal/writing-scaffold'
import type { ResolvedSeedWord, SelectedGrammarNote } from '@/lib/journal/scaffold-resolver'
import { requestJournalNudge } from '@/lib/journal/nudge-client'
import type { JournalNudge, JournalNudgeCefr } from '@/lib/journal/nudge'
import {
  activeStructureIndex,
  firstUnusedStarterIndex,
  normalizeHintTokens,
  seedWordIsUsed,
} from '@/lib/journal/writing-hints/seed-progress'
import { JournalReactiveSummary } from './JournalFeedbackView'
import { JournalNudgePanel } from './JournalNudgePanel'
import { JournalRailTab } from './JournalRailTab'
import { JournalStarterList } from './JournalStarterList'
import { JournalVocabularyList } from './JournalVocabularyList'
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
          <ContextualGuide
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

function ContextualGuide({
  promptId,
  promptText,
  cefrLevel,
  resolvedVocabulary,
  selectedGrammarNote,
  content,
  wordCount,
  targetLength,
  lastTypedAt,
  hintsEnabled,
  onStarterSelect,
}: {
  promptId: string
  promptText: string
  cefrLevel: JournalNudgeCefr
  resolvedVocabulary: ResolvedSeedWord[]
  selectedGrammarNote: SelectedGrammarNote | null
  content: string
  wordCount: number
  targetLength: number
  lastTypedAt: number | null
  hintsEnabled: boolean
  onStarterSelect?: (starter: string) => void
}) {
  const scaffold = writingScaffoldFor(promptId)
  const usedKeys = useMemo(
    () =>
      new Set(
        resolvedVocabulary
          .filter((word) => hintsEnabled && seedWordIsUsed(word.text, content))
          .map((word) => normalizeHintTokens(word.text).join(' ')),
      ),
    [content, hintsEnabled, resolvedVocabulary],
  )
  const [isStuck, setIsStuck] = useState(false)
  const [nudgeCalls, setNudgeCalls] = useState(0)
  const [nudges, setNudges] = useState<JournalNudge[]>([])
  const [requestingNudge, setRequestingNudge] = useState(false)
  const [nudgeError, setNudgeError] = useState<string | null>(null)
  const latestContent = useRef(content)

  useEffect(() => {
    latestContent.current = content
    setNudges([])
    setNudgeError(null)
  }, [content])

  useEffect(() => {
    setIsStuck(false)
    if (!hintsEnabled || lastTypedAt == null || wordCount >= targetLength) return

    const remaining = Math.max(0, 20_000 - (Date.now() - lastTypedAt))
    const timer = window.setTimeout(() => setIsStuck(true), remaining)
    return () => window.clearTimeout(timer)
  }, [content, hintsEnabled, lastTypedAt, targetLength, wordCount])

  const structureIndex = hintsEnabled ? activeStructureIndex(wordCount, targetLength) : -1
  const starterIndex =
    hintsEnabled && isStuck
      ? firstUnusedStarterIndex(
          scaffold.sentence_starters.map((starter) => starter.en),
          content,
        )
      : -1
  const ownedCount = resolvedVocabulary.filter((word) => word.inWordBank).length

  async function requestNudge() {
    if (
      !promptText.trim() ||
      nudgeCalls >= 3 ||
      requestingNudge ||
      starterIndex < 0 ||
      wordCount >= targetLength
    ) {
      return
    }

    const contentAtRequest = content
    setNudgeCalls((current) => current + 1)
    setRequestingNudge(true)
    setNudgeError(null)
    try {
      const result = await requestJournalNudge({
        prompt: promptText,
        partial_text: contentAtRequest,
        cefr_level: cefrLevel,
        unused_seed_words: resolvedVocabulary
          .filter((word) => !usedKeys.has(normalizeHintTokens(word.text).join(' ')))
          .map((word) => word.text),
        target_length: targetLength,
      })
      if (contentAtRequest === latestContent.current) setNudges(result.nudges)
    } catch {
      setNudges([])
      setNudgeError('No pudimos generar una idea. Prueba el inicio sugerido o vuelve a intentarlo.')
    } finally {
      setRequestingNudge(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <RailSection heading="Empieza así">
        <JournalStarterList
          starters={scaffold.sentence_starters}
          activeIndex={starterIndex}
          onSelectStarter={onStarterSelect}
        />
        {isStuck && starterIndex >= 0 && promptText.trim() ? (
          <JournalNudgePanel
            calls={nudgeCalls}
            nudges={nudges}
            requesting={requestingNudge}
            errorMessage={nudgeError}
            onRequest={() => void requestNudge()}
          />
        ) : null}
      </RailSection>

      {hintsEnabled && wordCount > 0 ? (
        <RailSection heading="Cómo organizarlo">
          {scaffold.structure[structureIndex] ? (
            <div
              data-structure-active="true"
              className="rounded-[var(--radius-sm)] bg-primary-soft px-3 py-2 font-body-sm text-fg"
            >
              <span className="font-medium">{scaffold.structure[structureIndex].label}.</span>{' '}
              {scaffold.structure[structureIndex].hint}
              <span className="mt-1 block font-body-xs font-medium text-fg-muted">
                {wordCount} / {targetLength} palabras
              </span>
            </div>
          ) : null}
          <details className="group mt-3 rounded-[var(--radius-sm)] border border-border-subtle">
            <summary className="focus-ring flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 font-body-sm font-medium text-fg">
              <ChevronDown
                size={14}
                className="shrink-0 text-fg-subtle transition-transform duration-150 group-open:rotate-180"
                aria-hidden
              />
              Ver los tres pasos
            </summary>
            <ol className="flex flex-col gap-2 border-t border-border-subtle px-3 py-3">
              {scaffold.structure.map((item) => (
                <li key={item.label} className="font-body-sm text-fg-muted">
                  <span className="font-medium text-fg">{item.label}.</span> {item.hint}
                </li>
              ))}
            </ol>
          </details>
        </RailSection>
      ) : null}

      {resolvedVocabulary.length > 0 ? (
        <RailSection heading="Vocabulario">
          {ownedCount > 0 ? (
            <p className="font-body-sm text-fg-muted">
              {ownedCount} de estas ya son tuyas — úsalas hoy.
            </p>
          ) : null}
          <JournalVocabularyList words={resolvedVocabulary} usedKeys={usedKeys} />
        </RailSection>
      ) : null}

      {selectedGrammarNote ? (
        <RailSection
          heading={
            selectedGrammarNote.dueState === 'due'
              ? 'Te toca repasar esto'
              : selectedGrammarNote.dueState === 'scheduled'
                ? 'Ya lo has visto'
                : 'Ojo con esto'
          }
        >
          <p className="font-body-sm text-fg-muted">{selectedGrammarNote.rule}</p>
          <p className="mt-2 font-body-sm text-fg">✓ {selectedGrammarNote.exampleCorrect}</p>
          <p className="font-body-sm text-fg-muted">✕ {selectedGrammarNote.exampleWrong}</p>
        </RailSection>
      ) : null}
    </div>
  )
}

function RailSection({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border-subtle pt-5 first:border-t-0 first:pt-0">
      <h3 className="font-body-sm font-semibold text-fg">{heading}</h3>
      <div className="mt-3">{children}</div>
    </section>
  )
}
