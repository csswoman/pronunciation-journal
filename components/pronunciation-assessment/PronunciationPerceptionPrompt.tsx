'use client'

import { useEffect, useRef } from 'react'
import Button from '@/components/ui/Button'
import { getTarget } from '@/lib/pronunciation/targets/registry'
import type { PerceptionAnswer } from '@/lib/pronunciation/assessment/scoring'
import type { DiagnosticPromptSelection } from '@/lib/pronunciation/assessment/prompt-selection'

interface PronunciationPerceptionPromptProps {
  selection: DiagnosticPromptSelection
  onAnswer: (answer: PerceptionAnswer | null) => void
}

/**
 * Minimal forced-choice perception prompt: "which one did you hear" with a
 * correct/incorrect self-selection. Real audio-pair playback is out of
 * scope for this minimal prompt-taking UI (plan 067, step 7's verify
 * criteria targets the RESULTS experience, not prompt polish) — the learner
 * self-identifies whether they can tell the target sound apart, which is
 * recorded as a `PerceptionAnswer`.
 */
export function PronunciationPerceptionPrompt({ selection, onAnswer }: PronunciationPerceptionPromptProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const lookup = getTarget(selection.targetId)
  const label = lookup.ok ? lookup.target.label : selection.targetId

  useEffect(() => {
    headingRef.current?.focus()
  }, [selection.targetId])

  return (
    <fieldset className="flex flex-col gap-4 rounded-md border border-[var(--border-default)] bg-[var(--surface-raised)] p-4">
      <legend className="sr-only">Pregunta de discriminación auditiva</legend>
      <h2 ref={headingRef} tabIndex={-1} className="text-[15px] font-semibold text-[var(--text-primary)] outline-none">
        ¿Puedes distinguir: {label}?
      </h2>
      <p className="text-[13px] text-[var(--text-secondary)]">
        Escucha con atención en tu mente el contraste de sonido e indica si crees que podrías distinguirlo.
      </p>
      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={() => onAnswer({ correct: true })}>
          Sí, lo distingo
        </Button>
        <Button type="button" variant="ghost" onClick={() => onAnswer({ correct: false })}>
          No estoy seguro
        </Button>
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={() => onAnswer(null)}>
        Saltar
      </Button>
    </fieldset>
  )
}
