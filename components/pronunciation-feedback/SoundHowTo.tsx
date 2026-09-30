// components/pronunciation-feedback/SoundHowTo.tsx
'use client'

// Planned structure:
// <SoundHowTo>  — collapsible "Cómo se hace" block
//   <button> toggle trigger
//   <div> dark surface panel
//     <h4> hookEs title
//     <ol> numbered steps
//     <div> mint tip callout with sparkles icon

import { useState } from 'react'
import { ChevronDown, ChevronUp, Sparkles } from '@/components/icons'

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
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-fg-subtle hover:text-fg transition-colors cursor-pointer py-1"
      >
        <span>Cómo se hace</span>
        {open ? <ChevronUp size={14} aria-hidden /> : <ChevronDown size={14} aria-hidden />}
      </button>

      {open && (
        <div className="mt-2 flex flex-col gap-3 rounded-2xl bg-surface-sunken border border-border-subtle p-4 shadow-inner">
          <p className="m-0 text-sm font-bold text-fg">{hookEs ?? ipa}</p>

          {articulationEs.length > 0 && (
            <ol className="m-0 flex flex-col gap-2 p-0 list-none">
              {articulationEs.map((step, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-fg-muted leading-relaxed">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 font-bold text-[11px]">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          )}

          {spanishTip && (
            <div className="mt-1 flex items-start gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-800 dark:text-emerald-200">
              <Sparkles size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" aria-hidden />
              <p className="m-0 leading-normal">{spanishTip}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

