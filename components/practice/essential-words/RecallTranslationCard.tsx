'use client'

// Planned structure:
// <RecallTranslationCard>
//   <SpanishPrompt />
//   <AnswerInput />
//   <HintButton />
//   <InlineFeedback />
//   <AnswerDiff | Reveal />
//   <ContinueButton />
// </RecallTranslationCard>

import { useEffect, useRef, useState } from 'react'
import { speak } from '@/lib/phoneme-practice/tts'
import { PillButton } from '@/components/ui/PillButton'
import Button from '@/components/ui/Button'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { selectSentence } from '@/lib/essential-words/sentence-variants'
import { buildHintLadder } from '@/lib/essential-words/hint-ladder'
import { isTypo } from '@/lib/essential-words/typo'
import { normalizeEnglishAnswer, displayEnglishWord, displayEnglishText } from '@/lib/essential-words/word-display'
import { HintButton } from './HintButton'
import { AnswerDiff } from './AnswerDiff'
import { ExercisePhaseLabel } from './ExercisePhaseLabel'
import { InlineFeedback } from '@/components/practice/session/InlineFeedback'
import { useEnterToContinue } from '@/hooks/useEnterToContinue'
import type { AttemptOutcome } from '@/lib/essential-words/attempt-grade'
import type { EssentialWord } from '@/lib/essential-words/types'

interface Props {
  entry: EssentialWord
  levelLabel?: string
  /** SM-2 repetition count — rotates which example sentence is revealed as context. */
  repetitions?: number
  onAttempt: (outcome: AttemptOutcome) => Promise<void>
  onRetry?: () => void
  /** Present once the final attempt has been graded — renders the internal
   * "Continuar" action that advances to the next exercise. */
  onContinue?: () => void
  onArchive?: () => void
  isContinuing?: boolean
}

/** Compare ignoring case, surrounding space, and punctuation. */
function normalize(text: string): string {
  return normalizeEnglishAnswer(text)
}

export function RecallTranslationCard({ entry, levelLabel, repetitions = 0, onAttempt, onRetry, onContinue, onArchive, isContinuing = false }: Props) {
  const [answer, setAnswer] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [outcome, setOutcome] = useState<{ correct: boolean; typo: boolean } | null>(null)
  // Distinct from `revealed`: the first failed attempt also reveals the
  // "Intentar de nuevo" prompt without having graded anything yet. Only a
  // resolved attempt (onAttempt fired) should show the feedback banner and
  // the "Continuar" action.
  const [resolved, setResolved] = useState(false)
  const hintsUsedRef = useRef(0)
  const firstTryFailedRef = useRef(false)
  const startedAtRef = useRef(Date.now())
  const answerInputRef = useRef<HTMLInputElement>(null)
  const { sentence } = selectSentence(entry, repetitions)
  const ladder = buildHintLadder(entry, 'recall_translation')

  useEffect(() => {
    answerInputRef.current?.focus()
  }, [])

  useEnterToContinue(Boolean(onContinue && resolved && outcome && !isContinuing), onContinue)

  const submitOutcome = (finalOutcome: AttemptOutcome) => {
    setOutcome({ correct: finalOutcome.correct, typo: finalOutcome.typo })
    setResolved(true)
    void onAttempt(finalOutcome)
  }

  const handleCheck = () => {
    if (revealed || answer.trim() === '') return
    const given = normalize(answer)
    const expected = normalize(entry.word)
    const isExact = given === expected
    const typo = !isExact && isTypo(given, expected)
    const correct = isExact || typo

    if (!correct && !firstTryFailedRef.current) {
      firstTryFailedRef.current = true
      setOutcome({ correct: false, typo: false })
      setRevealed(true)
      playUiCue('wrong')
      return
    }

    setRevealed(true)
    playUiCue(correct ? 'correct' : 'wrong')
    submitOutcome({
      correct,
      hintsUsed: hintsUsedRef.current,
      rescued: false,
      typo,
      firstTryFailed: firstTryFailedRef.current && correct,
      latencyMs: Date.now() - startedAtRef.current,
    })
  }

  const handleRepair = () => {
    onRetry?.()
    setRevealed(false)
    setOutcome(null)
    setResolved(false)
    setAnswer('')
  }

  const handleHintAdvance = (rung: (typeof ladder)[number]) => {
    if (rung.priced) hintsUsedRef.current += 1
    if (rung.kind === 'audio') speak(entry.word, { rate: 0.9 })
    if (rung.isGiveUp) {
      setRevealed(true)
      setOutcome({ correct: false, typo: false })
      playUiCue('wrong')
      submitOutcome({
        correct: false,
        hintsUsed: hintsUsedRef.current,
        rescued: false,
        typo: false,
        firstTryFailed: true,
        latencyMs: Date.now() - startedAtRef.current,
      })
    }
  }

  // selectMode only picks this mode when `translation` is present.
  if (!entry.translation) return null

  return (
    <div className="flex w-full flex-col items-center gap-(--space-5) rounded-lg border border-border-subtle bg-surface-raised layout-card-pad">
      <ExercisePhaseLabel label={levelLabel} onArchive={onArchive} />
      <div className="flex max-w-[42ch] flex-col items-center gap-1 text-center">
        <p className="m-0 w-full text-body text-fg">Escribe la palabra en inglés</p>
        <p className="m-0 text-body-lg font-medium leading-relaxed text-balance text-fg">
          {entry.translation}
        </p>
      </div>

      <input
        ref={answerInputRef}
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            handleCheck()
          }
        }}
        disabled={revealed}
        aria-label="Escribe la palabra en inglés"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className="w-full max-w-sm rounded-md border border-border-subtle bg-surface px-3 py-2 text-body text-fg focus-ring"
      />

      {!revealed && (
        <HintButton
          ladder={ladder}
          hasFailedOnce={firstTryFailedRef.current}
          idleMs={0}
          onAdvance={handleHintAdvance}
        />
      )}

      {revealed && outcome && !resolved ? (
        <>
          <AnswerDiff written={answer || '(sin respuesta)'} expected={entry.word} isTypo={false} word={entry.word} />
          <PillButton type="button" variant="outline" size="sm" onClick={handleRepair}>
            Intentar de nuevo
          </PillButton>
        </>
      ) : revealed && outcome ? (
        <>
          <InlineFeedback isCorrect={outcome.correct} />
          {outcome.correct && !outcome.typo ? (
            <div className="flex max-w-[42ch] flex-col items-center gap-1 text-center">
              <p className="m-0 text-body-lg font-medium text-fg">
                {displayEnglishWord(entry.word, { pos: entry.pos })}
              </p>
              <p className="m-0 text-body text-fg-muted">{displayEnglishText(sentence)}</p>
            </div>
          ) : (
            <AnswerDiff written={answer || '(sin respuesta)'} expected={entry.word} isTypo={outcome.typo} word={entry.word} />
          )}
          {onContinue && (
            <Button type="button" variant="primary" size="lg" className="w-full" onClick={onContinue} disabled={isContinuing} isLoading={isContinuing}>
              Continuar
            </Button>
          )}
        </>
      ) : (
        <PillButton type="button" variant="primary" onClick={handleCheck}>
          Comprobar
        </PillButton>
      )}
    </div>
  )
}
