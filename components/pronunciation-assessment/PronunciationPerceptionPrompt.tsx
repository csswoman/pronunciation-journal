'use client'

import { useEffect, useRef } from 'react'
import Button from '@/components/ui/Button'
import { getLearnerTargetCopy } from '@/lib/pronunciation/assessment/learner-copy'
import type { PerceptionAnswer } from '@/lib/pronunciation/assessment/scoring'
import type { DiagnosticPromptSelection } from '@/lib/pronunciation/assessment/prompt-selection'

interface PronunciationPerceptionPromptProps {
  selection: DiagnosticPromptSelection
  onAnswer: (answer: PerceptionAnswer | null) => void
}

export function PronunciationPerceptionPrompt({ selection, onAnswer }: PronunciationPerceptionPromptProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const { title, ipaHint } = getLearnerTargetCopy(selection.targetId)

  useEffect(() => {
    headingRef.current?.focus()
  }, [selection.targetId])

  return (
    <fieldset className="flex min-w-0 flex-col gap-5">
      <legend className="sr-only">Pregunta de discriminación auditiva</legend>
      <div className="flex min-w-0 flex-col gap-2">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="min-w-0 text-pretty break-words text-h4 text-fg outline-none"
        >
          ¿Crees que distingues: {title}?
          {ipaHint ? (
            <>
              {' '}
              <span className="font-ipa font-normal text-fg-muted">({ipaHint})</span>
            </>
          ) : null}
        </h2>
        <p className="max-w-prose text-pretty font-body-sm text-fg-muted">
          Sin audio aún: responde según tu experiencia con este contraste. Si no estás seguro, dilo —
          eso también cuenta.
        </p>
      </div>
      <div className="flex w-full flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="secondary"
          fullWidth
          className="min-h-11"
          onClick={() => onAnswer({ correct: true })}
        >
          Sí, lo distingo
        </Button>
        <Button
          type="button"
          variant="ghost"
          fullWidth
          className="min-h-11"
          onClick={() => onAnswer({ correct: false })}
        >
          No estoy seguro
        </Button>
      </div>
      <Button type="button" variant="ghost" className="min-h-11" onClick={() => onAnswer(null)}>
        Saltar
      </Button>
    </fieldset>
  )
}
