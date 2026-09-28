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
  on_activate: { label: 'Se crea al activar', className: 'bg-primary text-white' },
  on_demand: { label: 'Lo generas en el sprint', className: 'bg-black/5 text-ink-secondary' },
  reuse: { label: 'Con lo que ya generaste', className: 'bg-black/5 text-ink-secondary' },
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
    <PastelCard tone="sky" className={cn('flex flex-col gap-5 rounded-3xl p-6 text-left shadow-xs', className)}>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-ink px-4 py-1 text-tiny font-extrabold uppercase tracking-wider text-white">
            Vista previa · {durationDays} días
          </span>
          <span className="text-tiny font-bold text-ink-secondary">
            Unos {plan.avgMinutes} min al día (aprox.)
          </span>
        </div>
        <h3 className="font-display text-h3 font-extrabold text-ink">Así se verá tu sprint</h3>
        <p className="text-body-sm text-ink-secondary">
          Cada día practicas <span className="font-semibold text-ink">{plan.focusLabel}</span> de una forma
          distinta. Al activar se escribe tu mini-historia; el resto lo generas desde tu sprint cuando quieras.
        </p>
      </div>

      {plan.example && (
        <div className="flex flex-col gap-1 rounded-2xl bg-white/60 px-4 py-3">
          <span className="text-tiny font-bold uppercase tracking-wider text-ink-muted">
            Error típico en hispanohablantes
          </span>
          <p className="text-body-sm text-ink-secondary">
            <span className="line-through">{plan.example.wrong}</span>
            <span aria-hidden="true"> → </span>
            <span className="font-semibold text-ink">{plan.example.right}</span>
          </p>
        </div>
      )}

      {plan.hasSoundFocus && (
        <p className="rounded-2xl bg-white/60 px-4 py-3 text-body-sm text-ink-secondary">
          <span className="font-semibold text-ink">Sobre tu foco de sonido:</span> el sprint lo trabaja con
          lectura, dictado y la canción grabada con tu voz, pero no califica cómo lo pronuncias. Para
          entrenar el oído a distinguirlo, combina el sprint con el laboratorio de sonidos.
        </p>
      )}

      <ul className="flex flex-wrap items-center gap-4 text-tiny font-bold text-ink" aria-label="Tipos de actividad">
        {presentKinds.map((kind) => (
          <li key={kind} className="flex items-center gap-1.5">
            <span className={cn('h-2.5 w-2.5 rounded-full', KIND_STYLE[kind].stripe)} aria-hidden="true" />
            {KIND_STYLE[kind].label}
          </li>
        ))}
      </ul>

      <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-7">
        {plan.days.map((day) => (
          <PlanDayCard key={day.day} day={day} />
        ))}
      </ol>

      <p className="text-tiny font-semibold text-ink-secondary">
        ¿Te saltaste un día? No pierdes nada: tu contenido queda guardado y sigues por donde ibas.
      </p>
    </PastelCard>
  )
}

function PlanDayCard({ day }: { day: SprintPlanDay }) {
  const availability = AVAILABILITY_LABEL[day.availability]

  return (
    <li className="relative flex min-h-40 flex-col justify-between gap-3 overflow-hidden rounded-2xl border border-black/10 bg-white p-4 shadow-xs">
      <div className={cn('absolute inset-x-0 top-0 h-1.5', KIND_STYLE[day.kind].stripe)} aria-hidden="true" />
      <div className="flex flex-col gap-1.5 pt-1">
        <span className="text-tiny font-extrabold uppercase tracking-wider text-ink-muted">Día {day.day}</span>
        <h4 className="font-display text-body font-extrabold leading-tight text-ink">{day.title}</h4>
        <p className="line-clamp-3 text-tiny font-medium text-ink-secondary">{day.detail}</p>
      </div>
      <div className="flex flex-col items-start gap-1.5 border-t border-black/5 pt-2">
        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-extrabold leading-tight', availability.className)}>
          {availability.label}
        </span>
        <span className="text-tiny font-bold text-ink-muted">~{day.minutes} min</span>
      </div>
    </li>
  )
}
