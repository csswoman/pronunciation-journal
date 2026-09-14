'use client'

// Planned structure:
// <ProductionHint>
//   <RevealButton />  — collapsed state (alwaysVisible: false)
//   <ExampleSentence /> — model sentence + reminder
// </ProductionHint>

import { useEffect, useState } from 'react'
import { Lightbulb } from '@/components/icons'
import { playUiCue } from '@/lib/ui-sounds/cues'

interface Props {
  /** Model sentence used as a hint. */
  exampleSentence?: string
  /** Resets the collapsed state when the exercise changes. */
  exerciseId: string
  /**
   * Shows the example open by default instead of behind a reveal button.
   * Beginners need the scaffold visible up front; exercises that would be
   * spoiled by it (e.g. rodeo_circumlocution, where the example usually
   * contains the secret word) should pass false to keep it hidden.
   */
  alwaysVisible?: boolean
}

export function ProductionHint({ exampleSentence, exerciseId, alwaysVisible = true }: Props) {
  const [revealed, setRevealed] = useState(alwaysVisible)

  useEffect(() => {
    setRevealed(alwaysVisible)
  }, [exerciseId, alwaysVisible])

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
      <div className="flex items-center gap-1.5 text-caption font-medium text-fg-subtle">
        <Lightbulb size={13} aria-hidden />
        Puedes ayudarte de este ejemplo
      </div>
      <p className="m-0 text-body-sm italic leading-relaxed text-fg-secondary">
        “{exampleSentence}”
      </p>
      <p className="m-0 text-caption text-fg-subtle">
        No la repitas igual — adáptala con tus propias palabras.
      </p>
    </div>
  )
}
