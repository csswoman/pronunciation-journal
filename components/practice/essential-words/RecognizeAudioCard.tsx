'use client'

// Planned structure:
// <RecognizeAudioCard>
//   <AudioPrompt />   — kicker + ListenButton (replay)
//   <OptionGrid />
// </RecognizeAudioCard>

import { useEffect, useMemo, useRef, useState } from 'react'
import { PillButton } from '@/components/ui/PillButton'
import { ListenButton } from '@/components/ui/ListenButton'
import { speak } from '@/lib/phoneme-practice/tts'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { cn } from '@/lib/cn'
import { selectDistractors } from '@/lib/essential-words/distractors'
import type { AttemptOutcome } from '@/lib/essential-words/attempt-grade'
import type { EssentialWord } from '@/lib/essential-words/types'

interface Props {
  entry: EssentialWord
  /** Other session words used as wrong answers. */
  distractors: EssentialWord[]
  onAttempt: (outcome: AttemptOutcome) => Promise<void>
}

const OPTION_COUNT = 4

export function RecognizeAudioCard({ entry, distractors, onAttempt }: Props) {
  const [chosen, setChosen] = useState<string | null>(null)
  const startedAtRef = useRef(Date.now())

  const play = () => speak(entry.word, { rate: 0.9 })

  // The prompt *is* the audio, so it plays once per word. Replay stays manual.
  useEffect(() => {
    speak(entry.word, { rate: 0.9 })
  }, [entry.word])

  const options = useMemo(() => {
    const wrong = selectDistractors(entry, distractors, [], OPTION_COUNT - 1)
    const all = [entry, ...wrong].map((w) => w.word)
    return all.sort(() => Math.random() - 0.5)
  }, [entry, distractors])

  const handleChoose = (choice: string) => {
    if (chosen) return
    setChosen(choice)
    const isCorrect = choice.toLowerCase() === entry.word.toLowerCase()
    playUiCue(isCorrect ? 'correct' : 'wrong')
    void onAttempt({
      correct: isCorrect,
      hintsUsed: 0, // spec §2.3: multiple choice never offers hints
      rescued: false,
      typo: false,
      firstTryFailed: false,
      latencyMs: Date.now() - startedAtRef.current,
    })
  }

  return (
    <div className="flex w-full flex-col items-center gap-[var(--space-5)] rounded-lg border border-border-subtle bg-surface-raised layout-card-pad">
      <p className="font-kicker m-0 text-fg-muted">¿Qué palabra escuchaste?</p>

      <ListenButton onPlay={play} label="Escuchar de nuevo" />

      <div className="grid w-full max-w-sm grid-cols-2 gap-2">
        {options.map((option) => (
          <PillButton
            key={option}
            type="button"
            variant={chosen === option ? 'primary' : 'outline'}
            onClick={() => handleChoose(option)}
            disabled={Boolean(chosen)}
            className={cn(
              chosen &&
                option.toLowerCase() === entry.word.toLowerCase() &&
                'bg-success hover:bg-success',
            )}
          >
            {option}
          </PillButton>
        ))}
      </div>
    </div>
  )
}
