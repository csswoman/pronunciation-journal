'use client'

// Planned structure:
// <PhonemeMissBanner>
//   <MissIcon />
//   <MissText />        — "No exactamente" + correct answers
//   <MissActions />     — Seguir + Reintentar

import { X } from '@/components/icons'
import Button from '@/components/ui/Button'
import { playUiCue } from '@/lib/ui-sounds/cues'

interface Props {
  /** Labels of the correct options, shown as the one-line explanation. */
  correctLabels: string[]
  onRetry: () => void
  onContinue: () => void
}

/** Minimal failure feedback: one bar with the right answer and two actions. */
export function PhonemeMissBanner({ correctLabels, onRetry, onContinue }: Props) {
  const label = correctLabels.length === 1 ? 'Correcta' : 'Correctas'

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-2xl bg-error-soft p-4"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-error/20 text-error">
          <X size={16} aria-hidden />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-body-sm font-semibold text-error">No exactamente</span>
          {correctLabels.length > 0 && (
            <span className="text-caption text-fg-muted">
              {label}: <span className="font-semibold text-fg">{correctLabels.join(', ')}</span>
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="md"
          onClick={() => {
            playUiCue('soft')
            onContinue()
          }}
        >
          Seguir
        </Button>
        <Button variant="primary" size="md" onClick={onRetry}>
          Reintentar
        </Button>
      </div>
    </div>
  )
}
