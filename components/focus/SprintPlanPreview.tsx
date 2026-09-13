import { useState } from 'react'
import { cn } from '@/lib/cn'
import { getIllustration } from '@/lib/illustrations/registry'
import type { IllustrationKey } from '@/lib/illustrations/registry'
import { ChevronDown, ChevronUp, CalendarCheck } from '@/components/icons'

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

const PLAN_STEPS: PlanStep[] = [
  { title: 'Mini-historia', detail: 'Texto contextual con repetición natural del patrón.', minutes: 6, illustration: 'domainReading' },
  { title: 'Drills de patrón', detail: 'Oraciones guiadas para fijar la estructura automáticamente.', minutes: 8, illustration: 'domainWriting' },
  { title: 'Diálogo', detail: 'Conversación interactiva donde el patrón cobra sentido.', minutes: 7, illustration: 'domainSpeaking' },
  { title: 'Caza del error', detail: 'Detección activa de errores frecuentes vs. usos correctos.', minutes: 5, illustration: 'domainTip' },
  { title: 'Canción o rima', detail: 'Cadencia auditiva para retención a largo plazo.', minutes: 5, illustration: 'domainListening' },
  { title: 'Repaso espaciado', detail: 'Refuerzo de ejercicios fallados en el momento justo.', minutes: 6, illustration: 'domainProgress' },
  { title: 'Evaluación y cierre', detail: 'Comparativa de precisión del día 1 vs. resultado final.', minutes: 5, illustration: 'stateTrophy' },
]

/**
 * Vista previa compacta y colapsable de la ruta de aprendizaje del sprint.
 *
 * Muestra un resumen inicial compacto y permite desplegar el desglose
 * día por día sin sobrecargar el scroll vertical.
 */
export function SprintPlanPreview({ durationDays, className }: SprintPlanPreviewProps) {
  const [isOpen, setIsOpen] = useState(false)
  const steps = Array.from({ length: durationDays }, (_, i) => PLAN_STEPS[i % PLAN_STEPS.length])
  const totalMinutes = steps.reduce((sum, s) => sum + s.minutes, 0)
  const avgMinutes = Math.round(totalMinutes / durationDays)

  const isMultiWeek = durationDays > 7

  const renderStepRow = (step: PlanStep, dayNumber: number) => {
    const Illustration = getIllustration(step.illustration)
    return (
      <div
        key={dayNumber}
        className="flex items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-surface-sunken"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-tiny font-semibold tabular-nums text-primary">
          {dayNumber}
        </span>
        <Illustration className="h-6 w-auto shrink-0 text-fg-subtle" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-body-sm font-medium text-fg">{step.title}</span>
            <span className="shrink-0 text-tiny text-fg-subtle">{step.minutes} min</span>
          </div>
          <p className="line-clamp-1 text-tiny text-fg-muted">{step.detail}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('rounded-xl border border-border-default bg-surface-raised shadow-xs', className)}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="focus-ring flex w-full items-center justify-between gap-3 p-4 text-left rounded-xl transition-colors hover:bg-surface-sunken"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <CalendarCheck className="h-4 w-4 text-primary" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <h3 className="text-body font-semibold text-fg">Plan de estudio: {durationDays} días</h3>
              <span className="text-tiny text-fg-subtle">~{avgMinutes} min/día · {totalMinutes} min totales</span>
            </div>
            <p className="truncate text-tiny text-fg-muted mt-0.5">
              {isOpen
                ? 'Ocultar desglose de actividades'
                : 'Historias, drills, diálogos y repaso espaciado'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-tiny font-medium text-primary shrink-0">
          <span>{isOpen ? 'Ocultar' : 'Ver desglose'}</span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-primary" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4 text-primary" aria-hidden="true" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-border-subtle p-3.5">
          {!isMultiWeek ? (
            <div className="flex flex-col divide-y divide-border-subtle rounded-lg border border-border-default bg-surface-base">
              {steps.map((step, index) => renderStepRow(step, index + 1))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-tiny font-semibold uppercase tracking-wider text-fg-subtle">
                  Semana 1: Adquisición y práctica guiada
                </span>
                <div className="flex flex-col divide-y divide-border-subtle rounded-lg border border-border-default bg-surface-base">
                  {steps.slice(0, 7).map((step, index) => renderStepRow(step, index + 1))}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-tiny font-semibold uppercase tracking-wider text-fg-subtle">
                  Semana 2: Afianzamiento y fluidez
                </span>
                <div className="flex flex-col divide-y divide-border-subtle rounded-lg border border-border-default bg-surface-base">
                  {steps.slice(7).map((step, index) => renderStepRow(step, index + 8))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

