'use client'

// Planned structure:
// <RecallTranslationCard>
//   <SpanishPrompt />
//   <AnswerInput />
//   <HintButton />
//   <AnswerDiff | Reveal />
// </RecallTranslationCard>

import { useRef, useState } from 'react'
import { speak } from '@/lib/phoneme-practice/tts'
import { PillButton } from '@/components/ui/PillButton'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { selectSentence } from '@/lib/essential-words/sentence-variants'
import { buildHintLadder } from '@/lib/essential-words/hint-ladder'
import { isTypo } from '@/lib/essential-words/typo'
import { HintButton } from './HintButton'
import { AnswerDiff } from './AnswerDiff'
import type { AttemptOutcome } from '@/lib/essential-words/attempt-grade'
import type { EssentialWord } from '@/lib/essential-words/types'

interface Props {
  entry: EssentialWord
  /** SM-2 repetition count — rotates which example sentence is revealed as context. */
  repetitions?: number
  onAttempt: (outcome: AttemptOutcome) => Promise<void>
}

/** Compare ignoring case, surrounding space, and punctuation. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9']/g, '')
    .trim()
}

export function RecallTranslationCard({ entry, repetitions = 0, onAttempt }: Props) {
  const [answer, setAnswer] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [outcome, setOutcome] = useState<{ correct: boolean; typo: boolean } | null>(null)
  const hintsUsedRef = useRef(0)
  const firstTryFailedRef = useRef(false)
  const startedAtRef = useRef(Date.now())
  const { sentence } = selectSentence(entry, repetitions)
  const ladder = buildHintLadder(entry, 'recall_translation')

  const submitOutcome = (finalOutcome: AttemptOutcome) => {
    setOutcome({ correct: finalOutcome.correct, typo: finalOutcome.typo })
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
    setRevealed(false)
    setOutcome(null)
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
    <div className="flex w-full flex-col items-center gap-[var(--space-5)] rounded-lg border border-border-subtle bg-surface-raised layout-card-pad">
      <div className="flex max-w-[42ch] flex-col items-center gap-1 text-center">
        <p className="font-kicker m-0 text-fg-muted">¿Cómo se dice en inglés?</p>
        <p className="m-0 text-body-lg font-medium leading-relaxed text-balance text-fg">
          {entry.translation}
        </p>
      </div>

      <input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
        disabled={revealed}
        aria-label="Escribe la palabra en inglés"
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

      {revealed && outcome && !outcome.correct && firstTryFailedRef.current && !outcome.typo ? (
        <>
          <AnswerDiff written={answer || '(sin respuesta)'} expected={entry.word} isTypo={false} word={entry.word} />
          <PillButton type="button" variant="outline" size="sm" onClick={handleRepair}>
            Intentar de nuevo
          </PillButton>
        </>
      ) : revealed ? (
        <div className="flex max-w-[42ch] flex-col items-center gap-1 text-center">
          <p className="m-0 text-body-lg font-medium text-fg">{entry.word}</p>
          <p className="m-0 text-body text-fg-muted">{sentence}</p>
        </div>
      ) : (
        <PillButton type="button" variant="primary" onClick={handleCheck}>
          Comprobar
        </PillButton>
      )}
    </div>
  )
}
