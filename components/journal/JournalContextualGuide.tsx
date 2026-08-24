'use client'

// Planned structure:
// <JournalContextualGuide>
//   <JournalVocabularyList />         — siempre visible, chips
//   <section "Sigue con" />           — starters + nudge + pista de estructura inline
//   <details "Modelos de frase" />    — colapsado, VerbTensesGuide + UsefulPhrasesGuide
//   <details "Ojo con esto" />        — colapsado, badge cuando hay nota
// </JournalContextualGuide>

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
import { JournalStarterList } from './JournalStarterList'
import { JournalVocabularyList } from './JournalVocabularyList'
import { VerbTensesGuide } from './VerbTensesGuide'
import { UsefulPhrasesGuide } from './UsefulPhrasesGuide'

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

  const starterLabel = content.trim().length > 0 ? 'Sigue con' : 'Empieza así'

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
      {/* ── Palabras de hoy ─ chips con estado ── */}
      {resolvedVocabulary.length > 0 && (
        <JournalVocabularyList words={resolvedVocabulary} usedKeys={usedKeys} />
      )}

      {/* ── Sigue con / Empieza así ── */}
      <section className="border-t border-border-subtle pt-5 first:border-t-0 first:pt-0">
        <h3 className="font-body-sm font-semibold text-fg">{starterLabel}</h3>

        {/* Pista de estructura inline cuando ya hay texto */}
        {hintsEnabled && wordCount > 0 && scaffold.structure[structureIndex] && (
          <p className="mb-2 mt-1.5 font-body-xs text-fg-muted">
            <span className="font-medium text-fg">
              {scaffold.structure[structureIndex].label}.
            </span>{' '}
            {scaffold.structure[structureIndex].hint}
          </p>
        )}

        <div className="mt-3">
          <JournalStarterList
            starters={scaffold.sentence_starters}
            activeIndex={starterIndex}
            onSelectStarter={onStarterSelect}
            vocabWords={resolvedVocabulary.map((w) => w.text)}
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
        </div>
      </section>

      {/* ── Modelos de frase ─ colapsado ── */}
      <details className="group border-t border-border-subtle pt-4">
        <summary className="focus-ring flex cursor-pointer list-none items-center gap-2 font-body-sm font-semibold text-fg">
          <ChevronDown
            size={14}
            className="shrink-0 text-fg-subtle transition-transform duration-150 group-open:rotate-180"
            aria-hidden
          />
          Modelos de frase
        </summary>
        <div className="mt-4 flex flex-col gap-6 pb-1">
          <VerbTensesGuide />
          <UsefulPhrasesGuide onSelectPhrase={onStarterSelect} />
        </div>
      </details>

      {/* ── Ojo con esto ─ colapsado con badge ── */}
      {selectedGrammarNote && (
        <details className="group border-t border-border-subtle pt-4">
          <summary className="focus-ring flex cursor-pointer list-none items-center gap-2 font-body-sm font-semibold text-fg">
            <ChevronDown
              size={14}
              className="shrink-0 text-fg-subtle transition-transform duration-150 group-open:rotate-180"
              aria-hidden
            />
            {selectedGrammarNote.dueState === 'due'
              ? 'Te toca repasar esto'
              : selectedGrammarNote.dueState === 'scheduled'
                ? 'Ya lo has visto'
                : 'Ojo con esto'}
            {/* badge numérico */}
            <span
              className="ml-auto flex size-5 items-center justify-center rounded-full bg-warning text-caption font-semibold text-on-primary"
              aria-label="1 nota gramatical"
            >
              1
            </span>
          </summary>
          <div className="mt-3 flex flex-col gap-2 pb-1">
            <p className="font-body-sm text-fg-muted">{selectedGrammarNote.rule}</p>
            <p className="font-body-sm text-fg">
              <span className="font-semibold text-success">✓</span>{' '}
              {selectedGrammarNote.exampleCorrect}
            </p>
            <p className="font-body-sm text-fg-muted">
              <span className="font-semibold text-error">✕</span>{' '}
              {selectedGrammarNote.exampleWrong}
            </p>
          </div>
        </details>
      )}
    </div>
  )
}
