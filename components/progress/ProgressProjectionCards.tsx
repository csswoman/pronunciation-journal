import type { ProgressProjections } from '@/lib/progress/projections'
import { ProgressBigNumber, ProgressCard, ProgressCardHeader } from './ProgressCard'

export function ProgressProjectionCards({ data }: { data: ProgressProjections }) {
  const minutes = Math.round(data.activity.durationMs / 60_000)

  return (
    <section className="flex flex-col gap-3" aria-labelledby="progress-signals-title">
      <div>
        <h2 id="progress-signals-title" className="text-base font-medium text-fg">Tus señales</h2>
        <p className="text-caption text-fg-muted">
          Practicar, completar contenido y demostrar aprendizaje se cuentan por separado.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <ProgressCard>
          <ProgressCardHeader icon={<span className="size-2 rounded-full bg-primary" />} eyebrow="Actividad" title="Lo que practicas" />
          <div className="flex gap-[var(--layout-stack-loose)]">
            <ProgressBigNumber value={data.activity.exercises} sub="ejercicios" />
            <ProgressBigNumber value={minutes} sub="minutos" />
          </div>
          <p className="text-caption text-fg-muted">
            {data.activity.sessions} sesiones · {data.activity.activeDays} días activos
          </p>
        </ProgressCard>

        <ProgressCard>
          <ProgressCardHeader icon={<span className="size-2 rounded-full bg-primary" />} eyebrow="Cobertura" title="Contenido recorrido" />
          <div className="flex gap-[var(--layout-stack-loose)]">
            <ProgressBigNumber value={data.coverage.encountered} sub="encontrados" />
            <ProgressBigNumber value={data.coverage.completed} sub="completados" />
          </div>
          <p className="text-caption text-fg-muted">Completar contenido no equivale a dominarlo.</p>
        </ProgressCard>

        <ProgressCard>
          <ProgressCardHeader icon={<span className="size-2 rounded-full bg-primary" />} eyebrow="Aprendizaje" title="Evidencia comprobada" />
          <div className="flex gap-[var(--layout-stack-loose)]">
            <ProgressBigNumber value={data.learning.evidencedTargets} sub="targets con evidencia" />
            <ProgressBigNumber
              value={data.learning.reviewTargets}
              sub="por repasar"
              tone={data.learning.reviewTargets > 0 ? 'warning' : 'primary'}
            />
          </div>
          <p className="text-caption text-fg-muted">
            {data.learning.transferTargets} targets usados en transferencia evaluada
          </p>
        </ProgressCard>
      </div>
    </section>
  )
}
