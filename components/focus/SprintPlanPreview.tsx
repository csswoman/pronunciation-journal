// Planned structure:
// <SprintPlanPreview>
//   <day row />   (uno por día del sprint)

import { cn } from '@/lib/cn'
import { getIllustration } from '@/lib/illustrations/registry'
import type { IllustrationKey } from '@/lib/illustrations/registry'

interface SprintPlanPreviewProps {
  /** Duración elegida, en días. */
  durationDays: number
  className?: string
}

type PlanStep = {
  title: string
  detail: string
  minutes: number
  illustration: IllustrationKey
}

/**
 * Qué recibe el usuario cada día. Los cuatro primeros tipos se corresponden con
 * los generadores reales en app/api/gemini/focus/*; los días restantes repasan.
 */
const PLAN_STEPS: PlanStep[] = [
  { title: 'Mini-historia', detail: 'Un texto corto donde tu tema aparece una y otra vez, en contexto real.', minutes: 6, illustration: 'domainReading' },
  { title: 'Drills de patrón', detail: '8 a 10 oraciones para fijar la forma hasta que salga sola.', minutes: 8, illustration: 'domainWriting' },
  { title: 'Diálogo', detail: 'Una conversación donde el patrón aparece de forma natural.', minutes: 7, illustration: 'domainSpeaking' },
  { title: 'Caza del error', detail: 'Cinco oraciones: unas correctas y otras con el error típico. Tú decides cuáles.', minutes: 5, illustration: 'domainTip' },
  { title: 'Canción o rima', detail: 'El patrón con ritmo, que es como mejor se queda en la memoria.', minutes: 5, illustration: 'domainListening' },
  { title: 'Repaso espaciado', detail: 'Vuelven los ejercicios que fallaste, justo cuando estás por olvidarlos.', minutes: 6, illustration: 'domainProgress' },
  { title: 'Cierre del sprint', detail: 'Comparas tu precisión del día 1 contra la de hoy.', minutes: 5, illustration: 'stateTrophy' },
]

/**
 * Vista previa del plan antes de activarlo.
 *
 * La pantalla anterior prometía "Sprint de 7 días" sin decir nunca qué llegaba
 * dentro. Todo esto ya existía en el modelo de contenido y era invisible.
 */
export function SprintPlanPreview({ durationDays, className }: SprintPlanPreviewProps) {
  const steps = Array.from({ length: durationDays }, (_, i) => PLAN_STEPS[i % PLAN_STEPS.length])
  const totalMinutes = steps.reduce((sum, s) => sum + s.minutes, 0)

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-body font-semibold text-fg">Tu plan de {durationDays} días</h3>
        <span className="text-tiny text-fg-subtle">≈ {totalMinutes} min en total</span>
      </div>

      <ol className="flex flex-col gap-1.5">
        {steps.map((step, index) => {
          const Illustration = getIllustration(step.illustration)
          return (
            <li
              key={index}
              className="flex items-start gap-3 rounded-lg border border-[var(--border-subtle)] bg-surface-sunken p-2.5"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-tiny font-semibold tabular-nums text-[var(--primary)]">
                {index + 1}
              </span>
              <Illustration className="h-7 w-auto shrink-0 text-fg-subtle" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-body-sm font-medium text-fg">{step.title}</span>
                  <span className="shrink-0 text-tiny text-fg-subtle">{step.minutes} min</span>
                </span>
                <span className="mt-0.5 block text-tiny text-fg-muted">{step.detail}</span>
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
