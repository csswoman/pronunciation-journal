'use client'

// Planned structure:
// <ClozeCard>
//   <Prompt />        — kicker + oración con hueco + pista (traducción)
//   <AnswerInput />
//   <Reveal />
// </ClozeCard>

import { useState } from 'react'
import { PillButton } from '@/components/ui/PillButton'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { clozeFor } from '@/lib/essential-words/cloze'
import { selectSentence } from '@/lib/essential-words/sentence-variants'
import type { EssentialWord } from '@/lib/essential-words/types'

interface Props {
  entry: EssentialWord
  onGraded: (quality: number) => Promise<void>
  /** SM-2 repetition count — rotates which example sentence is blanked. */
  repetitions?: number
}

/** Quality scores: a correct fill is a 5, a miss is a lapse (2). */
const CORRECT_QUALITY = 5
const WRONG_QUALITY = 2

/** Compare ignoring case and punctuation. */
function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9']/g, '').trim()
}

export function ClozeCard({ entry, onGraded, repetitions = 0 }: Props) {
  const [answer, setAnswer] = useState('')
  const [revealed, setRevealed] = useState(false)
  const { sentence } = selectSentence(entry, repetitions)

  // selectMode garantiza clozeFor(entry) !== null antes de elegir este modo;
  // el fallback existe solo para no romper el render si esa invariante falla.
  const cloze = clozeFor(entry, sentence)

  const handleCheck = () => {
    if (revealed || answer.trim() === '' || !cloze) return
    const given = normalize(answer)
    const isCorrect = given === normalize(cloze.answer) || given === normalize(entry.word)
    setRevealed(true)
    playUiCue(isCorrect ? 'correct' : 'wrong')
    void onGraded(isCorrect ? CORRECT_QUALITY : WRONG_QUALITY)
  }

  if (!cloze) return null

  return (
    <div className="flex w-full flex-col items-center gap-[var(--space-5)] rounded-lg border border-border-subtle bg-surface-raised layout-card-pad">
      <p className="font-kicker m-0 text-fg-muted">Completa la oración</p>

      <p className="m-0 max-w-[42ch] text-center text-body-lg text-fg">{cloze.blanked}</p>

      {entry.translation && (
        <p className="m-0 text-body text-fg-muted">Pista: {entry.translation}</p>
      )}

      <input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
        disabled={revealed}
        aria-label="Escribe la palabra que falta"
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
