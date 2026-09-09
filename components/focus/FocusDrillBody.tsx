'use client'

// Planned structure:
// <FocusDrillBody>
//   <DrillSentenceRow />   (xN)
// </FocusDrillBody>

import React from 'react'
import type { DrillBody } from '@/lib/focus/types'

interface FocusDrillBodyProps {
  body: DrillBody
}

/** Lista de oraciones del drill con su traducción y la forma objetivo resaltada. */
export function FocusDrillBody({ body }: FocusDrillBodyProps) {
  return (
    <ol className="space-y-3">
      {body.sentences.map((sentence, index) => (
        <li
          key={index}
          className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-default)]"
        >
          <p className="text-body text-[var(--text-primary)] leading-relaxed">
            {sentence.text}
          </p>
          <p className="text-body-sm text-[var(--text-secondary)] mt-1">
            {sentence.translation}
          </p>
          <span className="inline-block mt-2 text-tiny font-semibold px-2 py-0.5 rounded-md bg-[var(--primary-soft)] text-[var(--primary)]">
            {sentence.gapWord}
          </span>
        </li>
      ))}
    </ol>
  )
}
