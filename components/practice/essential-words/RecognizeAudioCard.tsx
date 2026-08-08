'use client'

// Planned structure:
// <RecognizeAudioCard>
//   <PhaseLabel />
//   <Instruction />
//   <ListenButton />
//   <RecognizeOptionGrid />
//   <InlineFeedback />
//   <ContinueButton />
// </RecognizeAudioCard>

import { useEffect, useMemo, useRef, useState } from 'react'
import { ListenButton } from '@/components/ui/ListenButton'
import { speak } from '@/lib/phoneme-practice/tts'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { selectDistractors } from '@/lib/essential-words/distractors'
import { RecognizeOptionGrid } from './RecognizeOptionGrid'
import { ExercisePhaseLabel } from './ExercisePhaseLabel'
import { InlineFeedback } from '@/components/practice/session/InlineFeedback'
import { useEnterToContinue } from '@/hooks/useEnterToContinue'
import Button from '@/components/ui/Button'
import type { AttemptOutcome } from '@/lib/essential-words/attempt-grade'
import type { EssentialWord } from '@/lib/essential-words/types'

interface Props {
  entry: EssentialWord
  distractors: EssentialWord[]
  levelLabel?: string
  onAttempt: (outcome: AttemptOutcome) => Promise<void>
  /** Present once the choice has been graded — renders the internal
   * "Continuar" action that advances to the next exercise. */
  onContinue?: () => void
  onArchive?: () => void
  isContinuing?: boolean
}

const OPTION_COUNT = 4

export function RecognizeAudioCard({ entry, distractors, levelLabel, onAttempt, onContinue, onArchive, isContinuing = false }: Props) {
  const [chosen, setChosen] = useState<string | null>(null)
  const startedAtRef = useRef(Date.now())

  const play = () => speak(entry.word, { rate: 0.9 })

  useEffect(() => {
    speak(entry.word, { rate: 0.9 })
  }, [entry.word])

  const wrong = useMemo(
    () => selectDistractors(entry, distractors, [], OPTION_COUNT - 1),
    [entry, distractors],
  )
  const wrongKey = wrong.map((w) => w.word).join('|')

  // Keyed on word content (not array reference) so the shuffle stays stable
  // across parent re-renders that recompute `distractors` with a new
  // reference but the same words — otherwise the options jump after choosing.
  const options = useMemo(() => {
    const all = [entry.word, ...wrongKey.split('|').filter(Boolean)]
    return all.sort(() => Math.random() - 0.5)
  }, [entry.word, wrongKey])

  const handleChoose = (choice: string) => {
    if (chosen) return
    setChosen(choice)
    const isCorrect = choice.toLowerCase() === entry.word.toLowerCase()
    playUiCue(isCorrect ? 'correct' : 'wrong')
    void onAttempt({
      correct: isCorrect,
      hintsUsed: 0,
      rescued: false,
      typo: false,
      firstTryFailed: false,
      latencyMs: Date.now() - startedAtRef.current,
    })
  }

  useEnterToContinue(Boolean(onContinue && chosen && !isContinuing), onContinue)

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-lg border border-border-subtle bg-surface-raised layout-card-pad">
      <ExercisePhaseLabel label={levelLabel} onArchive={onArchive} />

      <p className="m-0 w-full text-center text-body text-fg">
        Elige la palabra que escuchaste
      </p>

      <ListenButton onPlay={play} label="Escuchar de nuevo" />

      <RecognizeOptionGrid
        options={options}
        chosen={chosen}
        correctWord={entry.word}
        onChoose={handleChoose}
      />

      {chosen && (
        <InlineFeedback isCorrect={chosen.toLowerCase() === entry.word.toLowerCase()} />
      )}

      {chosen && onContinue && (
        <Button type="button" variant="primary" size="lg" className="w-full" onClick={onContinue} disabled={isContinuing} isLoading={isContinuing}>
          Continuar
        </Button>
      )}
    </div>
  )
}
