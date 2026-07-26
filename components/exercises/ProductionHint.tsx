'use client'

// Planned structure:
// <ProductionHint>
//   <RevealButton />  — collapsed state
//   <ExampleSentence /> — revealed model sentence + reminder
// </ProductionHint>

import { useEffect, useState } from 'react'
import { Lightbulb } from '@/components/icons'
import { playUiCue } from '@/lib/ui-sounds/cues'

interface Props {
  /** Model sentence used as a hint — never auto-shown. */
  exampleSentence?: string
  /** Resets the collapsed state when the exercise changes. */
  exerciseId: string
}

export function ProductionHint({ exampleSentence, exerciseId }: Props) {
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    setRevealed(false)
  }, [exerciseId])

  if (!exampleSentence) return null

  if (!revealed) {
    return (
      <button
        type="button"
        onClick={() => {
          playUiCue('reveal')
          setRevealed(true)
        }}
        className="inline-flex min-h-11 items-center gap-1.5 self-start border-none bg-transparent px-1 text-body-sm font-medium text-fg-muted transition-colors hover:text-fg-secondary focus-ring cursor-pointer"
      >
        <Lightbulb size={14} aria-hidden />
        Ver un ejemplo
      </button>
    )
  }

  return (
    <div className="animate-message-in flex flex-col gap-1 rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken px-3 py-2.5">
      <p className="m-0 text-body-sm italic leading-relaxed text-fg-secondary">
        “{exampleSentence}”
      </p>
      <p className="m-0 text-caption text-fg-subtle">
        Úsala como referencia — escribe la tuya con tus propias palabras.
      </p>
    </div>
  )
}
