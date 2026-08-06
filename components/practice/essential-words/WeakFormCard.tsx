'use client'

// Planned structure:
// <WeakFormCard>
//   <FormContrast />   strong vs weak IPA
//   <ListenButton />
//   <SelfGradeBar />
//   <InlineFeedback />
//   <ContinueButton />
// </WeakFormCard>

import { useRef, useState } from 'react'
import { speak } from '@/lib/phoneme-practice/tts'
import { ListenButton } from '@/components/ui/ListenButton'
import { PillButton } from '@/components/ui/PillButton'
import Button from '@/components/ui/Button'
import { weakFormPhrase } from '@/lib/practice/study-card/model'
import { selectSentence } from '@/lib/essential-words/sentence-variants'
import type { AttemptOutcome } from '@/lib/essential-words/attempt-grade'
import type { EssentialWord } from '@/lib/essential-words/types'
import { displayEnglishWord, displayEnglishText } from '@/lib/essential-words/word-display'
import { ExercisePhaseLabel } from './ExercisePhaseLabel'
import { InlineFeedback } from '@/components/practice/session/InlineFeedback'

interface Props {
  /** Caller guarantees `ipa_weak` is present (selectMode checks it). */
  entry: EssentialWord
  levelLabel?: string
  /** SM-2 repetition count — rotates which example sentence frames the weak form. */
  repetitions?: number
  onAttempt: (outcome: AttemptOutcome) => Promise<void>
  /** Present once the self-grade has been recorded — renders the internal
   * "Continuar" action that advances to the next exercise. */
  onContinue?: () => void
  isContinuing?: boolean
}

export function WeakFormCard({ entry, levelLabel, repetitions = 0, onAttempt, onContinue, isContinuing = false }: Props) {
  const startedAtRef = useRef(Date.now())
  const [graded, setGraded] = useState(false)
  const [correct, setCorrect] = useState<boolean | null>(null)
  const { sentence } = selectSentence(entry, repetitions)
  // weakFormPhrase returns the bare word when it cannot locate it in the
  // sentence, which would strip the card of the phrase context that is the
  // whole point. Fall back to the base sentence, which the dataset gate
  // guarantees contains the word.
  const rotated = weakFormPhrase(sentence, entry.word)
  const phrase =
    rotated === entry.word
      ? weakFormPhrase(entry.example_sentence, entry.word)
      : rotated

  const handleSelfGrade = (isCorrect: boolean) => {
    if (graded) return
    setGraded(true)
    setCorrect(isCorrect)
    void onAttempt({
      correct: isCorrect,
      hintsUsed: 0,
      rescued: false,
      typo: false,
      firstTryFailed: false,
      latencyMs: Date.now() - startedAtRef.current,
    })
  }

  return (
    <div className="flex w-full flex-col items-center gap-space-5 rounded-lg border border-border-subtle bg-surface-raised layout-card-pad">
      <ExercisePhaseLabel label={levelLabel} />
      <div className="flex max-w-[42ch] flex-col items-center gap-1 text-center">
        <p className="m-0 w-full text-body text-fg">Escucha la forma débil en contexto</p>
        <p className="m-0 text-body-lg font-medium text-fg">
          {displayEnglishWord(entry.word, { pos: entry.pos })}
        </p>
        <p className="ipa m-0 text-body text-fg-muted">
          fuerte /{entry.ipa_strong}/ · débil /{entry.ipa_weak}/
        </p>
      </div>

      <p className="m-0 max-w-[42ch] text-center text-body-lg text-fg">{displayEnglishText(phrase)}</p>

      <ListenButton
        onPlay={() => speak(phrase, { rate: 0.95 })}
        label="Escuchar la forma débil"
      />

      <div className="flex gap-2">
        <PillButton variant="outline" size="sm" onClick={() => handleSelfGrade(false)} disabled={graded}>
          Me costó
        </PillButton>
        <PillButton variant="primary" size="sm" onClick={() => handleSelfGrade(true)} disabled={graded}>
          Lo dije bien
        </PillButton>
      </div>

      {graded && correct !== null && <InlineFeedback isCorrect={correct} />}

      {graded && onContinue && (
        <Button type="button" variant="primary" size="lg" className="w-full" onClick={onContinue} disabled={isContinuing} isLoading={isContinuing}>
          Continuar
        </Button>
      )}
    </div>
  )
}
