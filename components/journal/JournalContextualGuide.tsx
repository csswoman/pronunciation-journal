'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from '@/components/icons'
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
import { JournalNudgePanel } from './JournalNudgePanel'
import { JournalRailSection } from './JournalRailSection'
import { JournalStarterList } from './JournalStarterList'
import { JournalVocabularyList } from './JournalVocabularyList'

// Planned structure:
// <JournalContextualGuide>
//   <vocabulary section />
//   <JournalRailSection starters + JournalNudgePanel />
//   <JournalRailSection structure />
//   <JournalRailSection grammar note />
// </JournalContextualGuide>

export interface JournalContextualGuideProps {
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
}

export function JournalContextualGuide({
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
}: JournalContextualGuideProps) {
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
      {resolvedVocabulary.length > 0 ? (
        <section className="rounded-[var(--radius-md)] bg-surface-base px-3 py-4">
          <h3 className="font-body-sm font-semibold text-fg">Vocabulario para usar</h3>
          {ownedCount > 0 ? (
            <p className="mt-1 font-body-sm text-fg-muted">
              {ownedCount} de estas ya son tuyas — úsalas hoy.
            </p>
          ) : null}
          <JournalVocabularyList words={resolvedVocabulary} usedKeys={usedKeys} />
        </section>
      ) : null}

      <JournalRailSection heading="Empieza así" collapsible>
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
      </JournalRailSection>

      {hintsEnabled && wordCount > 0 ? (
        <JournalRailSection heading="Cómo organizarlo">
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
        </JournalRailSection>
      ) : null}

      {selectedGrammarNote ? (
        <JournalRailSection
          collapsible
          heading={
            selectedGrammarNote.dueState === 'due'
              ? 'Te toca repasar esto'
              : selectedGrammarNote.dueState === 'scheduled'
                ? 'Ya lo has visto'
                : 'Ojo con esto'
          }
        >
          <p className="font-body-sm text-fg-muted">{selectedGrammarNote.rule}</p>
          <p className="mt-2 font-body-sm text-fg">
            <span className="font-semibold text-success">✓</span> {selectedGrammarNote.exampleCorrect}
          </p>
          <p className="font-body-sm text-fg-muted">
            <span className="font-semibold text-error">✕</span> {selectedGrammarNote.exampleWrong}
          </p>
        </JournalRailSection>
      ) : null}
    </div>
  )
}
