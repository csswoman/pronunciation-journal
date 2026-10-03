// Planned structure:
// <SprintPlanPreview>
//   <PastelCard tone="sky">
//     <PlanHeader (vista previa + duración + minutos + en qué se basa)>
//     <TypicalMistakeExample />
//     <PlanLegend (solo formatos presentes)>
//     <PlanDayGrid>
//       <PlanDayCard /> × durationDays   (con etiqueta de origen del contenido)
//     </PlanDayGrid>
//     <PlanFootnote />
//   </PastelCard>
// </SprintPlanPreview>

import { cn } from '@/lib/cn'
import PastelCard from '@/components/layout/PastelCard'
import { PlanDayCarousel } from './PlanDayCarousel'
import {
  buildSprintPlan,
  type PlanDayAvailability,
  type PlanDayKind,
  type SprintPlanDay,
} from '@/lib/focus/sprint-plan'
import type { SprintGap } from '@/lib/focus/types'

interface SprintPlanPreviewProps {
  gaps: SprintGap[]
  /** Duración elegida, en días. */
  durationDays: number
  className?: string
}

/** Color por formato; coincide con los tonos de FocusWeekContentGrid. */
const KIND_STYLE: Record<PlanDayKind, { label: string; stripe: string }> = {
  story: { label: 'Historia', stripe: 'bg-sky-deep' },
  drill: { label: 'Drill', stripe: 'bg-butter-deep' },
  dialogue: { label: 'Diálogo', stripe: 'bg-mint-deep' },
  error_trap: { label: 'Trampa de errores', stripe: 'bg-coral-deep' },
  song: { label: 'Canción', stripe: 'bg-lilac-deep' },
  free: { label: 'Tú eliges', stripe: 'bg-primary' },
  closing: { label: 'Cierre', stripe: 'bg-ink' },
}

/** Qué le decimos al usuario sobre el origen del contenido de cada día. */
const AVAILABILITY_LABEL: Record<PlanDayAvailability, { label: string; className: string }> = {
  on_activate: { label: 'Al activar', className: 'bg-primary text-white' },
  on_demand: { label: 'Cuando quieras', className: 'bg-black/5 text-ink-secondary' },
  reuse: { label: 'Repaso', className: 'bg-black/5 text-ink-secondary' },
}

/**
 * Vista previa del sprint: estructura día a día calculada con los focos y la
 * duración elegidos. No es contenido real todavía ni se basa en tu historial;
 * cada día indica cuándo y a partir de qué se creará.
 */
export function SprintPlanPreview({ gaps, durationDays, className }: SprintPlanPreviewProps) {
  const plan = buildSprintPlan(gaps, durationDays)
  const presentKinds = [...new Set(plan.days.map((d) => d.kind))]

  if (plan.days.length === 0) return null

  return (
    <PastelCard tone="sky" className={cn('flex flex-col gap-4 rounded-3xl p-5 text-left sm:gap-5 sm:p-6 shadow-xs', className)}>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-ink px-4 py-1 ts-kicker text-white">
            Vista previa · {durationDays} días
          </span>
          <span className="ts-caption text-ink-secondary">
            Unos {plan.avgMinutes} min al día (aprox.)
          </span>
        </div>
        <h3 className="ts-card-title text-ink">Así se verá tu sprint</h3>
        <p className="hidden max-w-3xl ts-body text-ink-secondary sm:block">
          Cada día practicas <span className="ts-label-strong text-ink">{plan.focusLabel}</span> de una forma
          distinta. Solo la mini-historia se crea al activar; el resto lo generas tú cuando quieras.
        </p>
      </div>

      {plan.example && (
        <div className="flex flex-col gap-1 rounded-2xl bg-white/60 px-4 py-3">
          <span className="ts-kicker text-ink-muted">
            Error típico en hispanohablantes
          </span>
          <p className="ts-body text-ink-secondary">
            <span className="line-through">{plan.example.wrong}</span>
            <span aria-hidden="true"> → </span>
            <span className="ts-label-strong text-ink">{plan.example.right}</span>
          </p>
        </div>
      )}

      {plan.hasSoundFocus && (
        <p className="hidden rounded-2xl bg-white/60 px-4 py-3 ts-body text-ink-secondary sm:block">
          <span className="ts-label-strong text-ink">Sobre tu foco de sonido:</span> el sprint lo trabaja con
          lectura, dictado y canción, pero no evalúa tu pronunciación. Para entrenar el oído, combínalo con
          el laboratorio de sonidos.
        </p>
      )}

      <ul className="flex flex-wrap items-center gap-4 ts-chip text-ink" aria-label="Tipos de actividad">
        {presentKinds.map((kind) => (
          <li key={kind} className="flex items-center gap-1.5">
            <span className={cn('h-2.5 w-2.5 rounded-full', KIND_STYLE[kind].stripe)} aria-hidden="true" />
            {KIND_STYLE[kind].label}
          </li>
        ))}
      </ul>

      <PlanDayCarousel label="Días del sprint">
        {plan.days.map((day) => (
          <PlanDayCard key={day.day} day={day} />
        ))}
      </PlanDayCarousel>

      <p className="hidden ts-caption text-ink-secondary sm:block">
        ¿Te saltas un día? No pasa nada: tu contenido se guarda y retomas donde lo dejaste.
      </p>
    </PastelCard>
  )
}

function PlanDayCard({ day }: { day: SprintPlanDay }) {
  const availability = AVAILABILITY_LABEL[day.availability]

  return (
    <li className="relative flex w-56 shrink-0 snap-start flex-col justify-between gap-3 overflow-hidden rounded-2xl border border-black/10 bg-white p-4 shadow-xs">
      <div className={cn('absolute inset-x-0 top-0 h-1.5', KIND_STYLE[day.kind].stripe)} aria-hidden="true" />
      <div className="flex flex-col gap-1.5 pt-1">
        <span className="ts-kicker text-ink-muted">Día {day.day}</span>
        <h4 className="ts-row-title leading-tight text-ink">{day.title}</h4>
        <p className="ts-caption text-ink-secondary">{day.detail}</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-t border-black/5 pt-2.5">
        <span className={cn('rounded-md px-2 py-0.5 ts-badge leading-tight', availability.className)}>
          {availability.label}
        </span>
        <span className="ts-caption text-ink-muted tabular-nums">~{day.minutes} min</span>
      </div>
    </li>
  )
}
