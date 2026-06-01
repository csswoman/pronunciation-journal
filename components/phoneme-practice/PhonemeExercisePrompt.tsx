import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface Props {
  eyebrow: string
  title?: ReactNode
  hint?: string
  /** Center eyebrow + title (minimal pair, pronunciation hero). */
  centered?: boolean
  /** Extra space below the prompt before options. */
  spacious?: boolean
}

export function PhonemeExercisePrompt({ eyebrow, title, hint, centered, spacious }: Props) {
  return (
    <header
      className={cn(
        'phoneme-focus__prompt',
        centered && 'phoneme-focus__prompt--center',
        spacious && 'phoneme-focus__prompt--spacious',
      )}
    >
      <span className="phoneme-focus__eyebrow">{eyebrow}</span>
      {title && <h2 className="phoneme-focus__title">{title}</h2>}
      {hint && <p className="phoneme-focus__hint">{hint}</p>}
    </header>
  )
}
