'use client'

// Planned structure:
// <WeakFormCard>
//   <FormContrast />   strong vs weak IPA
//   <ListenButton />
//   <SelfGradeBar />
// </WeakFormCard>

import { useRef } from 'react'
import { speak } from '@/lib/phoneme-practice/tts'
import { ListenButton } from '@/components/ui/ListenButton'
import { PillButton } from '@/components/ui/PillButton'
import { weakFormPhrase } from '@/lib/practice/study-card/model'
import { selectSentence } from '@/lib/essential-words/sentence-variants'
import type { AttemptOutcome } from '@/lib/essential-words/attempt-grade'
import type { EssentialWord } from '@/lib/essential-words/types'

interface Props {
  /** Caller guarantees `ipa_weak` is present (selectMode checks it). */
  entry: EssentialWord
  /** SM-2 repetition count — rotates which example sentence frames the weak form. */
  repetitions?: number
  onAttempt: (outcome: AttemptOutcome) => Promise<void>
}

export function WeakFormCard({ entry, repetitions = 0, onAttempt }: Props) {
  const startedAtRef = useRef(Date.now())
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

  const handleSelfGrade = (correct: boolean) => {
    void onAttempt({
      correct,
      hintsUsed: 0,
      rescued: false,
      typo: false,
      firstTryFailed: false,
      latencyMs: Date.now() - startedAtRef.current,
    })
  }

  return (
    <div className="flex w-full flex-col items-center gap-space-5 rounded-lg border border-border-subtle bg-surface-raised layout-card-pad">
      <div className="flex max-w-[42ch] flex-col items-center gap-1 text-center">
        <p className="font-kicker m-0 text-fg-muted">Forma débil</p>
        <p className="m-0 text-body-lg font-medium text-fg">{entry.word}</p>
        <p className="ipa m-0 text-body text-fg-muted">
          fuerte /{entry.ipa_strong}/ · débil /{entry.ipa_weak}/
        </p>
      </div>

      <p className="m-0 max-w-[42ch] text-center text-body-lg text-fg">{phrase}</p>

      <ListenButton
        onPlay={() => speak(phrase, { rate: 0.95 })}
        label="Escuchar la forma débil"
      />

      <div className="flex gap-2">
        <PillButton variant="outline" size="sm" onClick={() => handleSelfGrade(false)}>
          Me costó
        </PillButton>
        <PillButton variant="primary" size="sm" onClick={() => handleSelfGrade(true)}>
          Lo dije bien
        </PillButton>
      </div>
    </div>
  )
}
