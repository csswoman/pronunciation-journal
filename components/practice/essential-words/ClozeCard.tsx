'use client'

// Planned structure:
// <ClozeCard>
//   <Prompt />        — kicker + oración con hueco + pista (traducción)
//   <AnswerInput />
//   <HintButton />
//   <InlineFeedback />
//   <AnswerDiff | Reveal />
//   <ContinueButton />
// </ClozeCard>

import { useEffect, useRef, useState } from 'react'
import { speak } from '@/lib/phoneme-practice/tts'
import { PillButton } from '@/components/ui/PillButton'
import Button from '@/components/ui/Button'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { clozeFor } from '@/lib/essential-words/cloze'
import { selectProductionClozeSentence } from '@/lib/essential-words/sentence-variants'
import { buildHintLadder } from '@/lib/essential-words/hint-ladder'
import { isTypo } from '@/lib/essential-words/typo'
import { normalizeEnglishAnswer, displayEnglishText } from '@/lib/essential-words/word-display'
import { HintButton } from './HintButton'
import { AnswerDiff } from './AnswerDiff'
import { ExercisePhaseLabel } from './ExercisePhaseLabel'
import { InlineFeedback } from '@/components/practice/session/InlineFeedback'
import { ArchiveConfirmAction } from '@/components/practice/study-card/ArchiveConfirmAction'
import { useEnterToContinue } from '@/hooks/useEnterToContinue'
import type { AttemptOutcome } from '@/lib/essential-words/attempt-grade'
import type { EssentialWord } from '@/lib/essential-words/types'

interface Props {
  entry: EssentialWord
  levelLabel?: string
  onAttempt: (outcome: AttemptOutcome) => Promise<void>
  onRetry?: () => void
  /** Present once the final attempt has been graded — renders the internal
   * "Continuar" action that advances to the next exercise. */
  onContinue?: () => void
  onArchive?: () => void
  isContinuing?: boolean
  /** SM-2 repetition count — rotates which example sentence is blanked. */
  repetitions?: number
}

/** Compare ignoring case and punctuation. */
function normalize(text: string): string {
  return normalizeEnglishAnswer(text)
}

export function ClozeCard({ entry, levelLabel, onAttempt, onRetry, onContinue, onArchive, isContinuing = false, repetitions = 0 }: Props) {
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
  const selectedSentence = selectProductionClozeSentence(entry, repetitions)
  const cloze = selectedSentence ? clozeFor(entry, selectedSentence.sentence) : null
  const ladder = buildHintLadder(entry, 'cloze_sentence')

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
    if (revealed || answer.trim() === '' || !cloze) return
    const given = normalize(answer)
    const normalizedAnswer = normalize(cloze.answer)
    const isExact = given === normalizedAnswer || given === normalize(entry.word)
    const typo = !isExact && isTypo(given, normalizedAnswer)
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

  if (!cloze) return null

  return (
    <div className="flex w-full flex-col items-center gap-layout-stack rounded-lg border border-border-subtle bg-surface-raised layout-card-pad">
      <ExercisePhaseLabel label={levelLabel} />
      <div className="flex max-w-[42ch] flex-col items-center gap-2 text-center">
        <p className="m-0 w-full text-label font-semibold text-fg">Completa la oración</p>
        <p className="m-0 text-h3 font-medium leading-relaxed text-balance text-fg">{displayEnglishText(cloze.blanked)}</p>
      </div>

      {entry.translation && (
        <p className="m-0 font-kicker text-fg-muted">Pista · {entry.translation}</p>
      )}

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
        aria-label="Escribe la palabra que falta"
        placeholder="Escribe la palabra en inglés"
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
          <AnswerDiff written={answer || '(sin respuesta)'} expected={cloze.answer} isTypo={false} word={entry.word} />
          <PillButton type="button" variant="outline" size="sm" onClick={handleRepair}>
            Intentar de nuevo
          </PillButton>
        </>
      ) : revealed && outcome ? (
        <>
          <InlineFeedback isCorrect={outcome.correct} />
          {!outcome.correct || outcome.typo ? (
            <AnswerDiff written={answer || '(sin respuesta)'} expected={cloze.answer} isTypo={outcome.typo} word={entry.word} />
          ) : null}
          {onContinue && (
            <Button type="button" variant="primary" size="lg" className="w-full" onClick={onContinue} disabled={isContinuing} isLoading={isContinuing}>
              Continuar
            </Button>
          )}
        </>
      ) : (
        <div className="flex w-full flex-col items-center gap-2">
          <PillButton type="button" variant="primary" onClick={handleCheck}>
            Comprobar
          </PillButton>
          {onArchive ? (
            <ArchiveConfirmAction onArchive={onArchive} label="Pausar esta palabra" />
          ) : null}
        </div>
      )}
    </div>
  )
}
