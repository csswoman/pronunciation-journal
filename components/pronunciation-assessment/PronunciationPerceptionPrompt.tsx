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
  const { title, ipaHint, plainHint } = getLearnerTargetCopy(selection.targetId)

  useEffect(() => {
    headingRef.current?.focus()
  }, [selection.targetId])

  return (
    <fieldset className="flex min-w-0 flex-col gap-5">
      <legend className="sr-only">Autoinforme sobre este contraste</legend>
      <div className="flex min-w-0 flex-col gap-2">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="min-w-0 text-pretty break-words text-h4 text-fg outline-none"
        >
          ¿Qué tan cómodo te sientes con: {title}?
          {ipaHint ? (
            <>
              {' '}
              <span className="font-ipa font-normal text-fg-muted" aria-label={title}>
                ({ipaHint})
              </span>
            </>
          ) : null}
        </h2>
        {plainHint ? (
          <p className="max-w-prose text-pretty font-body-sm text-fg">{plainHint}</p>
        ) : null}
        <p className="max-w-prose text-pretty font-body-sm text-fg-muted">
          Aún no hay audio de ejemplo. Responde según tu experiencia — no es un examen.
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
          Me desenvuelvo bien
        </Button>
        <Button
          type="button"
          variant="outline"
          fullWidth
          className="min-h-11"
          onClick={() => onAnswer({ correct: false })}
        >
          Me cuesta
        </Button>
      </div>
      <Button
        type="button"
        variant="ghost"
        className="min-h-11 text-fg-subtle"
        onClick={() => onAnswer(null)}
      >
        Saltar
      </Button>
    </fieldset>
  )
}
