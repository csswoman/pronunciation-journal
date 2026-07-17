import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface Props {
  /** Optional soft label above the title (sentence case, not an AI eyebrow). */
  kicker?: string
  title?: ReactNode
  hint?: string
  centered?: boolean
  spacious?: boolean
}

/** Shared exercise prompt — one clear title, optional kicker/hint. */
export function PhonemeExercisePrompt({
  kicker,
  title,
  hint,
  centered,
  spacious,
}: Props) {
  return (
    <header
      className={cn(
        'phoneme-focus__prompt',
        centered && 'phoneme-focus__prompt--center',
        spacious && 'phoneme-focus__prompt--spacious',
      )}
    >
      {kicker && <p className="phoneme-focus__kicker">{kicker}</p>}
      {title && <h2 className="phoneme-focus__title">{title}</h2>}
      {hint && <p className="phoneme-focus__hint">{hint}</p>}
    </header>
  )
}
