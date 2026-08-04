'use client'

// Planned structure:
// <DictationCard>
//   <ListenButton />
//   <AnswerInput />
//   <Reveal />
// </DictationCard>

import { useState } from 'react'
import { speak } from '@/lib/phoneme-practice/tts'
import { PillButton } from '@/components/ui/PillButton'
import { ListenButton } from '@/components/ui/ListenButton'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { selectSentence } from '@/lib/essential-words/sentence-variants'
import type { EssentialWord } from '@/lib/essential-words/types'

interface Props {
  entry: EssentialWord
  onGraded: (quality: number) => Promise<void>
  /** SM-2 repetition count — rotates which example sentence is dictated. */
  repetitions?: number
}

/** Quality scores: an exact match is a 5, a miss is a lapse (2). */
const CORRECT_QUALITY = 5
const WRONG_QUALITY = 2

/** Compare ignoring case, punctuation, and repeated whitespace. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function DictationCard({ entry, onGraded, repetitions = 0 }: Props) {
  const [answer, setAnswer] = useState('')
  const [revealed, setRevealed] = useState(false)
  const { sentence } = selectSentence(entry, repetitions)

  const handleCheck = () => {
    if (revealed || answer.trim() === '') return
    const isCorrect = normalize(answer) === normalize(sentence)
    setRevealed(true)
    playUiCue(isCorrect ? 'correct' : 'wrong')
    void onGraded(isCorrect ? CORRECT_QUALITY : WRONG_QUALITY)
  }

  return (
    <div className="flex w-full flex-col items-center gap-[var(--space-5)] rounded-lg border border-border-subtle bg-surface-raised layout-card-pad">
      <p className="font-kicker m-0 text-fg-muted">Escucha y escribe la oración</p>

      <ListenButton
        onPlay={() => speak(sentence, { rate: 0.95 })}
        label="Escuchar de nuevo"
      />

      <input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
        disabled={revealed}
        aria-label="Escribe lo que escuchaste"
        className="w-full max-w-sm rounded-md border border-border-subtle bg-surface px-3 py-2 text-body text-fg focus-ring"
      />

      {revealed ? (
        <p className="m-0 max-w-[42ch] text-center text-body-lg text-fg">
          {sentence}
        </p>
      ) : (
        <PillButton type="button" variant="primary" onClick={handleCheck}>
          Comprobar
        </PillButton>
      )}
    </div>
  )
}
