import type { ProgressProjections } from '@/lib/progress/projections'
import { ProgressBigNumber, ProgressCard, ProgressCardHeader } from './ProgressCard'
import { Info } from "@/components/icons"

export function ProgressProjectionCards({ data }: { data: ProgressProjections }) {
  const minutes = Math.round(data.activity.durationMs / 60_000)

  return (
    <section className="flex flex-col gap-3" aria-labelledby="progress-signals-title">
      <div className="flex flex-col gap-0.5">
        <h2 id="progress-signals-title" className="text-base font-semibold text-fg">Práctica frente a dominio</h2>
        <p className="text-caption text-fg-muted">
          Practicar y recorrer contenido no es lo mismo que demostrar que lo aprendiste. Aquí van por separado.
        </p>
      </div>
      <div className="dashboard-grid-3">
        <ProgressCard>
          <ProgressCardHeader
            icon={<span className="size-2 rounded-full bg-primary" />}
            eyebrow="Actividad"
            title="Lo que practicas"
          />
          <div className="flex gap-[var(--layout-stack-loose)]">
            <ProgressBigNumber value={data.activity.exercises} sub="ejercicios" />
            <ProgressBigNumber value={minutes} sub="minutos" />
          </div>
          <p className="text-caption text-fg-muted">
            {data.activity.sessions} sesiones · {data.activity.activeDays} días activos
          </p>
        </ProgressCard>

        <ProgressCard>
          <ProgressCardHeader
            icon={<span className="size-2 rounded-full bg-primary" />}
            eyebrow="Cobertura"
            title="Contenido recorrido"
          />
          <div className="flex gap-[var(--layout-stack-loose)]">
            <ProgressBigNumber value={data.coverage.encountered} sub="encontrados" />
            <ProgressBigNumber value={data.coverage.completed} sub="completados" />
          </div>
          <div className="flex items-center gap-1 text-caption text-fg-muted">
            <Info size={13} className="shrink-0 text-fg-subtle" aria-hidden />
            <span>Completar contenido no equivale a dominarlo.</span>
          </div>
        </ProgressCard>

        <ProgressCard>
          <ProgressCardHeader
            icon={<span className="size-2 rounded-full bg-primary" />}
            eyebrow="Aprendizaje"
            title="Lo que ya demostraste"
          />
          <div className="flex gap-[var(--layout-stack-loose)]">
            <ProgressBigNumber value={data.learning.evidencedTargets} sub="cosas que ya demostraste" />
            <ProgressBigNumber
              value={data.learning.reviewTargets}
              sub="fallaste, toca repasar"
              tone={data.learning.reviewTargets > 0 ? 'warning' : 'primary'}
            />
          </div>
          <div className="flex items-center gap-1 text-caption text-fg-muted">
            <Info size={13} className="shrink-0 text-fg-subtle" aria-hidden />
            <span>{data.learning.transferTargets} usadas con éxito en un contexto nuevo</span>
          </div>
        </ProgressCard>
      </div>
    </section>
  )
}
