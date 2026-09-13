import type { ProgressProjections } from '@/lib/progress/projections'
import { ProgressBigNumber, ProgressCard, ProgressCardHeader } from './ProgressCard'
import { Zap, Layers, CheckCircle2 } from "@/components/icons"

export function ProgressProjectionCards({ data }: { data: ProgressProjections }) {
  const minutes = Math.round(data.activity.durationMs / 60_000)

  return (
    <section className="flex flex-col gap-2.5" aria-labelledby="progress-signals-title">
      <div className="flex flex-col gap-0.5">
        <span className="font-kicker font-semibold text-fg-subtle">Señales clave</span>
        <h2 id="progress-signals-title" className="text-base font-semibold text-fg">Práctica frente a dominio</h2>
      </div>
      <div className="dashboard-grid-3">
        <ProgressCard className="gap-2.5 p-3.5 sm:p-4">
          <ProgressCardHeader
            icon={<Zap size={15} />}
            eyebrow="Actividad"
            title="Lo que practicas"
          />
          <div className="flex gap-[var(--layout-stack-loose)]">
            <ProgressBigNumber value={data.activity.exercises} sub="ejercicios" />
            <ProgressBigNumber value={minutes} sub="minutos" />
          </div>
          <p className="text-tiny text-fg-muted">
            {data.activity.sessions} sesiones · {data.activity.activeDays} días activos
          </p>
        </ProgressCard>

        <ProgressCard className="gap-2.5 p-3.5 sm:p-4">
          <ProgressCardHeader
            icon={<Layers size={15} />}
            eyebrow="Cobertura"
            title="Contenido recorrido"
          />
          <div className="flex gap-[var(--layout-stack-loose)]">
            <ProgressBigNumber value={data.coverage.encountered} sub="vistos" />
            <ProgressBigNumber value={data.coverage.completed} sub="completados" />
          </div>
          <p className="text-tiny text-fg-muted">
            {data.coverage.completed} lecciones completadas
          </p>
        </ProgressCard>

        <ProgressCard className="gap-2.5 p-3.5 sm:p-4">
          <ProgressCardHeader
            icon={<CheckCircle2 size={15} />}
            eyebrow="Aprendizaje"
            title="Lo que ya demostraste"
          />
          <div className="flex gap-[var(--layout-stack-loose)]">
            <ProgressBigNumber value={data.learning.evidencedTargets} sub="patrones demostrados" />
            <ProgressBigNumber
              value={data.learning.reviewTargets}
              sub="por afianzar"
              tone={data.learning.reviewTargets > 0 ? 'warning' : 'primary'}
            />
          </div>
          <p className="text-tiny text-fg-muted">
            {data.learning.transferTargets} transferencias exitosas
          </p>
        </ProgressCard>
      </div>
    </section>
  )
}
