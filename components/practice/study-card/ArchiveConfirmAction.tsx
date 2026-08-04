'use client'

// Shared low-emphasis "Ya la sé" → confirm-to-pause-90-days control. Used by
// both the study phase (StudyCard) and the speak phase (SpeakSkipActions) so
// the interaction stays a single source of truth across essential-words.

import { useState } from 'react'
import { PillButton } from '@/components/ui/PillButton'

interface Props {
  onArchive: () => void
  /** Copy for the resting-state trigger. Defaults to "Ya la sé". */
  label?: string
}

export function ArchiveConfirmAction({ onArchive, label = 'Ya la sé' }: Props) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="m-0 text-body-sm text-fg-muted">¿Pausar esta palabra 90 días?</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <PillButton variant="quiet" size="sm" onClick={onArchive}>
            Sí, pausar
          </PillButton>
          <PillButton variant="quiet" size="sm" onClick={() => setConfirming(false)}>
            Cancelar
          </PillButton>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="min-h-11 border-none bg-transparent px-3 py-1 text-caption text-fg-subtle underline-offset-2 transition-colors hover:text-fg-muted hover:underline focus-ring"
    >
      {label}
    </button>
  )
}
