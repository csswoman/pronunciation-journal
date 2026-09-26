'use client'

// Planned structure:
// <SelfAssessPrompt>
//   <CanonicalComparison />
//   <ActionButtons />
// </SelfAssessPrompt>

import Button from '@/components/ui/Button'

interface SelfAssessPromptProps {
  canonicalAnswer: string
  userAnswer?: string
  promptTitle?: string
  onMistake: () => void
  onSelfApprove: () => void | Promise<void>
  disabled?: boolean
}

export function SelfAssessPrompt({
  canonicalAnswer,
  userAnswer,
  promptTitle = 'Compara tu respuesta con la esperada',
  onMistake,
  onSelfApprove,
  disabled = false,
}: SelfAssessPromptProps) {
  return (
    <div
      role="region"
      aria-label="Autoevaluación de respuesta"
      className="flex flex-col gap-4 rounded-xl border border-border-default bg-surface-sunken/60 p-4 sm:p-5"
    >
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-tiny font-bold uppercase tracking-wider text-fg-subtle">
          Respuesta esperada
        </span>
        <p className="text-body-md font-semibold text-fg">{canonicalAnswer}</p>
        {userAnswer ? (
          <p className="text-body-sm text-fg-muted">
            Tu respuesta: <span className="font-medium text-fg">{userAnswer}</span>
          </p>
        ) : null}
      </div>

      <p className="text-body-sm text-fg-muted">{promptTitle}</p>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={onMistake}
          disabled={disabled}
        >
          Me equivoqué
        </Button>
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={() => void onSelfApprove()}
          disabled={disabled}
        >
          Mi respuesta también es correcta
        </Button>
      </div>
    </div>
  )
}
