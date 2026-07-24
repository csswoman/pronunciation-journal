'use client'

// Planned structure:
// <WritingHintsOverlay>            (mirrored div, same text/font as textarea)
//   text split into plain spans + <mark> spans for each hint match
//   <WritingHintTooltip />          (shown for the hovered/tapped mark)
// </WritingHintsOverlay>

import { useState } from 'react'
import { writingHintMessage } from '@/lib/journal/writing-hints/hint-labels'
import type { WritingHintMatch } from '@/lib/journal/writing-hints/types'
import { WritingHintTooltip } from './WritingHintTooltip'

interface WritingHintsOverlayProps {
  content: string
  matches: WritingHintMatch[]
}

interface ActiveTooltip {
  message: string
  x: number
  y: number
}

export function WritingHintsOverlay({ content, matches }: WritingHintsOverlayProps) {
  const [active, setActive] = useState<ActiveTooltip | null>(null)

  if (matches.length === 0) return null

  const segments: { text: string; match: WritingHintMatch | null }[] = []
  let cursor = 0
  for (const match of matches) {
    if (match.start > cursor) segments.push({ text: content.slice(cursor, match.start), match: null })
    segments.push({ text: content.slice(match.start, match.end), match })
    cursor = match.end
  }
  if (cursor < content.length) segments.push({ text: content.slice(cursor), match: null })

  function showTooltip(event: React.MouseEvent | React.FocusEvent, ruleId: WritingHintMatch['ruleId']) {
    const rect = (event.target as HTMLElement).getBoundingClientRect()
    const parentRect = (event.currentTarget as HTMLElement).closest('.writing-hints-root')?.getBoundingClientRect()
    setActive({
      message: writingHintMessage(ruleId),
      x: rect.left - (parentRect?.left ?? 0),
      y: rect.top - (parentRect?.top ?? 0),
    })
  }

  return (
    <div
      aria-hidden
      className="writing-hints-root pointer-events-none absolute inset-0 z-0 overflow-hidden whitespace-pre-wrap break-words p-4 text-base text-transparent"
    >
      {segments.map((segment, index) =>
        segment.match ? (
          <mark
            key={index}
            className="pointer-events-auto cursor-help rounded-none bg-transparent text-transparent underline decoration-warning decoration-2 underline-offset-4"
            onMouseEnter={(e) => showTooltip(e, segment.match!.ruleId)}
            onMouseLeave={() => setActive(null)}
            onFocus={(e) => showTooltip(e, segment.match!.ruleId)}
            onBlur={() => setActive(null)}
            tabIndex={0}
          >
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
      {active && (
        <WritingHintTooltip message={active.message} visible x={active.x} y={active.y} />
      )}
    </div>
  )
}
