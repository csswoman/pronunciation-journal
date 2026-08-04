'use client'

// Planned structure:
// <HintButton>
//   <Trigger />       — discrete "¿Pista?" button, hidden until eligible
//   <RevealedRungs />  — content of every rung taken so far, in order
// </HintButton>

import { useState } from 'react'
import { cn } from '@/lib/cn'
import type { HintRung } from '@/lib/essential-words/hint-ladder'

interface Props {
  ladder: HintRung[]
  /** True once the learner has failed at least one attempt on this exercise,
   * OR ~5s have passed with an empty input (spec §2.3 — the button doesn't
   * exist before either condition, so it's never pressed by reflex). */
  hasFailedOnce: boolean
  /** Milliseconds of empty-input idle time observed by the caller — passed
   * in rather than timed internally, since the caller (each card) already
   * owns the input's value and is best placed to measure idle time against it. */
  idleMs: number
  onAdvance: (rung: HintRung) => void
}

const IDLE_THRESHOLD_MS = 5000

export function HintButton({ ladder, hasFailedOnce, idleMs, onAdvance }: Props) {
  const [rungIndex, setRungIndex] = useState(0)

  if (ladder.length === 0) return null
  const eligible = hasFailedOnce || idleMs >= IDLE_THRESHOLD_MS
  if (!eligible && rungIndex === 0) return null

  const revealed = ladder.slice(0, rungIndex)
  const hasMore = rungIndex < ladder.length

  const handleClick = () => {
    if (!hasMore) return
    onAdvance(ladder[rungIndex])
    setRungIndex((i) => i + 1)
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {revealed.map((rung, i) => (
        <p key={i} className="m-0 text-caption text-fg-muted">
          {rung.content}
        </p>
      ))}
      {hasMore && (
        <button
          type="button"
          onClick={handleClick}
          className={cn(
            'min-h-11 min-w-11 cursor-pointer border-none bg-transparent px-3 py-2 font-[inherit]',
            'text-caption text-fg-subtle underline focus-ring',
          )}
        >
          ¿Pista?
        </button>
      )}
    </div>
  )
}
