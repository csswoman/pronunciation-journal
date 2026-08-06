'use client'

// Planned structure:
// <DictationCard>
//   <ListenButton />
//   <AnswerInput />
//   <HintButton />
//   <InlineFeedback />
//   <AnswerDiff | Reveal />
//   <ContinueButton />
// </DictationCard>

import { useRef, useState } from 'react'
import { speak, speakSequence } from '@/lib/phoneme-practice/tts'
import { PillButton } from '@/components/ui/PillButton'
import { ListenButton } from '@/components/ui/ListenButton'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { selectSentence } from '@/lib/essential-words/sentence-variants'
import { buildDictationFeedback, splitDictationIntoParts, type DictationFeedback } from '@/lib/essential-words/dictation-feedback'
import { isValidEnglishWord } from '@/lib/essential-words/english-word-validator'
import { displayEnglishText, displayEnglishWord } from '@/lib/essential-words/word-display'
import { AnswerDiff } from './AnswerDiff'
import { ExercisePhaseLabel } from './ExercisePhaseLabel'
import { InlineFeedback } from '@/components/practice/session/InlineFeedback'
import Button from '@/components/ui/Button'
import type { AttemptOutcome } from '@/lib/essential-words/attempt-grade'
import type { EssentialWord } from '@/lib/essential-words/types'

interface Props {
  entry: EssentialWord
  levelLabel?: string
  onAttempt: (outcome: AttemptOutcome) => Promise<void>
  onContinue?: () => void
  isContinuing?: boolean
  /** SM-2 repetition count — rotates which example sentence is dictated. */
  repetitions?: number
}

export function DictationCard({ entry, levelLabel, onAttempt, onContinue, isContinuing = false, repetitions = 0 }: Props) {
  const [answer, setAnswer] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [outcome, setOutcome] = useState<{ correct: boolean; typo: boolean; feedback: DictationFeedback } | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const hintsUsedRef = useRef(0)
  const slowAudioUsedRef = useRef(false)
  const segmentedAudioUsedRef = useRef(false)
  const startedAtRef = useRef(Date.now())
  const { sentence } = selectSentence(entry, repetitions)

  const submitOutcome = (finalOutcome: AttemptOutcome) => {
    void onAttempt(finalOutcome)
  }

  const handleCheck = async () => {
    if (revealed || answer.trim() === '' || isChecking) return
    setIsChecking(true)
    try {
      // Only load the dictionary for a word that first looks like a typing
      // edit. Clean matches and ordinary word substitutions stay immediate.
      const preliminary = buildDictationFeedback(answer, sentence, entry.word)
      const candidates = preliminary.words
        .filter((item) => item.status === 'typo' && item.written)
        .map((item) => item.written!)
      const validity = candidates.length > 0
        ? new Map(await Promise.all(
            candidates.map(async (candidate) => [candidate, await isValidEnglishWord(candidate)] as const),
          ))
        : new Map<string, boolean>()
      const feedback = buildDictationFeedback(answer, sentence, entry.word, (word) => validity.get(word) ?? false)
      const correct = feedback.targetCorrect
      const typo = feedback.hasTypos

      setRevealed(true)
      setOutcome({ correct, typo, feedback })
      playUiCue(correct ? 'correct' : 'wrong')
      submitOutcome({
        correct,
        hintsUsed: hintsUsedRef.current,
        rescued: false,
        typo,
        firstTryFailed: false,
        latencyMs: Date.now() - startedAtRef.current,
      })
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-space-5 rounded-lg border border-border-subtle bg-surface-raised layout-card-pad">
      <ExercisePhaseLabel label={levelLabel} />
      <p className="m-0 w-full text-center text-body text-fg">Escucha y escribe la oración</p>

      <div className="flex flex-wrap items-center justify-center gap-2" aria-label="Opciones de audio">
        <ListenButton onPlay={() => speak(sentence, { rate: 0.95 })} label="Escuchar" />
        <PillButton
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (!slowAudioUsedRef.current) {
              slowAudioUsedRef.current = true
              hintsUsedRef.current += 1
            }
            speak(sentence, { rate: 0.75 })
          }}
        >
          0.75x
        </PillButton>
        <PillButton
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (!segmentedAudioUsedRef.current) {
              segmentedAudioUsedRef.current = true
              hintsUsedRef.current += 1
            }
            speakSequence(splitDictationIntoParts(sentence), { rate: 0.95 })
          }}
        >
          Por partes
        </PillButton>
      </div>

      {!revealed && (
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void handleCheck()}
          aria-label="Escribe lo que escuchaste"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="w-full max-w-sm rounded-md border border-border-subtle bg-surface px-3 py-2 text-body text-fg focus-ring"
        />
      )}

      {revealed && outcome ? (
        <InlineFeedback isCorrect={outcome.correct} />
      ) : null}

      {revealed && outcome?.feedback?.hasDifferences ? (
        <AnswerDiff feedback={outcome.feedback} word={entry.word} />
      ) : revealed ? (
        <p className="m-0 max-w-[42ch] text-center text-body-lg text-fg">
          {displayEnglishText(sentence)}
        </p>
      ) : (
        <PillButton type="button" variant="primary" onClick={() => void handleCheck()} disabled={isChecking}>
          {isChecking ? 'Comprobando…' : 'Comprobar'}
        </PillButton>
      )}

      {revealed && onContinue && (
        <div className="w-full border-t border-line-divider pt-space-4">
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full"
            onClick={onContinue}
            disabled={isContinuing}
            isLoading={isContinuing}
          >
            Continuar
          </Button>
          {!outcome?.correct && (
            <p className="m-0 mt-space-3 text-center text-body-sm text-fg-muted">
              Volverás a ver {displayEnglishWord(entry.word, { pos: entry.pos })} en unos ejercicios
            </p>
          )}
        </div>
      )}
    </div>
  )
}
