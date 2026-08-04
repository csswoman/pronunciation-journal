'use client'

// Planned structure:
// <RecallTranslationCard>
//   <SpanishPrompt />
//   <AnswerInput />
//   <Reveal />       — palabra + oración de contexto
// </RecallTranslationCard>

import { useState } from 'react'
import { PillButton } from '@/components/ui/PillButton'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { selectSentence } from '@/lib/essential-words/sentence-variants'
import type { EssentialWord } from '@/lib/essential-words/types'

interface Props {
  entry: EssentialWord
  /** SM-2 repetition count — rotates which example sentence is revealed as context. */
  repetitions?: number
  onGraded: (quality: number) => Promise<void>
}

/** Quality scores: a correct recall is a 5, a miss is a lapse (2). */
const CORRECT_QUALITY = 5
const WRONG_QUALITY = 2

/** Compare ignoring case, surrounding space, and punctuation. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9']/g, '')
    .trim()
}

export function RecallTranslationCard({ entry, repetitions = 0, onGraded }: Props) {
  const [answer, setAnswer] = useState('')
  const [revealed, setRevealed] = useState(false)
  const { sentence } = selectSentence(entry, repetitions)

  // selectMode only picks this mode when `translation` is present.
  if (!entry.translation) return null

  const handleCheck = () => {
    if (revealed || answer.trim() === '') return
    const isCorrect = normalize(answer) === normalize(entry.word)
    setRevealed(true)
    playUiCue(isCorrect ? 'correct' : 'wrong')
    void onGraded(isCorrect ? CORRECT_QUALITY : WRONG_QUALITY)
  }

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

      {revealed ? (
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
