// Planned structure:
// <PhonemeExercisePrompt>
//   <Kicker />
//   <Title />
//   <Hint />
// </PhonemeExercisePrompt>

import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface Props {
  /** Optional soft label above the title (e.g. "SONIDO /iː/ · PARES MÍNIMOS"). */
  kicker?: string
  title?: ReactNode
  hint?: string
  centered?: boolean
  spacious?: boolean
}

/** Shared exercise prompt — strong hierarchy, clear title, optional kicker/hint matching Essential Words. */
export function PhonemeExercisePrompt({
  kicker,
  title,
  hint,
  centered = true,
  spacious,
}: Props) {
  return (
    <header
      className={cn(
        'flex flex-col gap-2',
        centered && 'items-center text-center',
        spacious ? 'mb-4' : 'mb-2',
      )}
    >
      {kicker && (
        <span className="font-mono text-tiny tracking-wider text-fg-subtle uppercase font-semibold">
          {kicker}
        </span>
      )}
      {title && (
        <h2 className="text-h3 font-bold text-fg leading-tight sm:text-h2">
          {title}
        </h2>
      )}
      {hint && (
        <p className="text-body-sm text-fg-muted text-pretty max-w-[48ch]">
          {hint}
        </p>
      )}
    </header>
  )
}
