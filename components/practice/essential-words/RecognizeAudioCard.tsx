'use client'

// Planned structure:
// <RecognizeAudioCard>
//   <AudioPrompt />   — kicker + ListenButton (replay)
//   <OptionGrid />
// </RecognizeAudioCard>

import { useEffect, useMemo, useState } from 'react'
import { PillButton } from '@/components/ui/PillButton'
import { ListenButton } from '@/components/ui/ListenButton'
import { speak } from '@/lib/phoneme-practice/tts'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { cn } from '@/lib/cn'
import type { EssentialWord } from '@/lib/essential-words/types'

interface Props {
  entry: EssentialWord
  /** Other session words used as wrong answers. */
  distractors: EssentialWord[]
  onGraded: (quality: number) => Promise<void>
}

const OPTION_COUNT = 4

/** Quality scores: a clean recognition is a 5, a miss is a lapse (2). */
const CORRECT_QUALITY = 5
const WRONG_QUALITY = 2

export function RecognizeAudioCard({ entry, distractors, onGraded }: Props) {
  const [chosen, setChosen] = useState<string | null>(null)

  const play = () => speak(entry.word, { rate: 0.9 })

  // The prompt *is* the audio, so it plays once per word. Replay stays manual.
  useEffect(() => {
    speak(entry.word, { rate: 0.9 })
  }, [entry.word])

  // Dedupe by surface form so the answer never appears twice — same rule as
  // RecognizeCard.
  const options = useMemo(() => {
    const seen = new Set([entry.word.toLowerCase()])
    const wrong: EssentialWord[] = []
    for (const d of distractors) {
      const key = d.word.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      wrong.push(d)
      if (wrong.length === OPTION_COUNT - 1) break
    }
    const all = [entry, ...wrong].map((w) => w.word)
    return all.sort(() => Math.random() - 0.5)
  }, [entry, distractors])

  const handleChoose = (choice: string) => {
    if (chosen) return
    setChosen(choice)
    const isCorrect = choice.toLowerCase() === entry.word.toLowerCase()
    playUiCue(isCorrect ? 'correct' : 'wrong')
    void onGraded(isCorrect ? CORRECT_QUALITY : WRONG_QUALITY)
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
