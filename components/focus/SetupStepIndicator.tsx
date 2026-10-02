import { cn } from '@/lib/cn'

export type SetupStep = 'focus' | 'plan'

const STEPS: { id: SetupStep; label: string }[] = [
  { id: 'focus', label: 'Elige tus focos' },
  { id: 'plan', label: 'Duración y plan' },
]

interface SetupStepIndicatorProps {
  step: SetupStep
}

/** Indicador "Paso N de 2" del setup del sprint. */
export function SetupStepIndicator({ step }: SetupStepIndicatorProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === step)

  return (
    <ol className="mb-6 flex items-center gap-3" aria-label={`Paso ${currentIndex + 1} de ${STEPS.length}`}>
      {STEPS.map((s, index) => {
        const isCurrent = index === currentIndex
        const isDone = index < currentIndex
        return (
          <li key={s.id} className="flex items-center gap-2" aria-current={isCurrent ? 'step' : undefined}>
            <span
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full ts-row-number',
                isCurrent || isDone ? 'bg-cta-bg text-cta-fg' : 'border border-border-default text-fg-subtle',
              )}
            >
              {index + 1}
            </span>
            <span className={cn('ts-label-strong', isCurrent ? 'text-fg' : 'text-fg-subtle')}>
              {s.label}
            </span>
            {index < STEPS.length - 1 && <span className="h-px w-8 bg-border-default" aria-hidden="true" />}
          </li>
        )
      })}
    </ol>
  )
}
