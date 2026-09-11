// components/pronunciation-feedback/SoundHowTo.tsx
'use client'

// Planned structure:
// <SoundHowTo>  — collapsible "Cómo se hace" block
//   <button> toggle
//   <div> hookEs title + articulationEs <ul> + short spanishTip

import { useState } from 'react'
import { cn } from '@/lib/cn'

interface Props {
  /** IPA symbol with slashes, e.g. "/z/" — fallback title when hookEs is null. */
  ipa: string
  hookEs: string | null
  articulationEs: string[]
  spanishTip: string | null
  /** Start expanded (used when the score is low). */
  defaultOpen?: boolean
}

export function SoundHowTo({ ipa, hookEs, articulationEs, spanishTip, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  if (articulationEs.length === 0 && !spanishTip) return null

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 text-caption text-fg-subtle hover:text-fg-muted"
      >
        Cómo se hace {open ? '↓' : '→'}
      </button>

      {open && (
        <div className="mt-1.5 flex flex-col gap-1.5">
          <p className="m-0 text-caption font-semibold text-fg">{hookEs ?? ipa}</p>
          {articulationEs.length > 0 && (
            <ul className={cn('m-0 flex list-disc flex-col gap-1 pl-4')}>
              {articulationEs.map((step, i) => (
                <li key={i} className="text-caption text-fg-muted">{step}</li>
              ))}
            </ul>
          )}
          {spanishTip && <p className="m-0 text-caption text-fg-muted">{spanishTip}</p>}
        </div>
      )}
    </div>
  )
}
