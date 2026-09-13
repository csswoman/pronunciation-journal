import Link from "next/link"
import { Sparkles, CalendarCheck, Radar } from "@/components/icons"
import Button from "@/components/ui/Button"

/**
 * Subcomponents:
 * - ProgressActivationBanner: Welcoming onboarding card for learners starting out
 */

interface Props {
  hasSessions: boolean
}

export function ProgressActivationBanner({ hasSessions }: Props) {
  if (hasSessions) return null

  return (
    <section
      aria-label="Activación de tu panel de progreso"
      className="flex flex-col gap-4 rounded-[var(--radius-md)] border border-primary/20 bg-primary-soft/40 p-4 sm:p-5"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-sm bg-primary text-on-primary mt-0.5">
            <Sparkles size={18} aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-kicker font-semibold text-primary">Activación de progreso</span>
            <h2 className="text-h4 font-semibold text-fg">Tus métricas se calibran con tu práctica</h2>
            <p className="text-body-sm text-fg-muted max-w-[620px]">
              Cada sesión en el plan diario, Sound Lab o cursos alimenta este panel. Completa tus
              primeras actividades para ver tu radar de 6 dimensiones y mapa de precisión en tiempo real.
            </p>
          </div>
        </div>

        <Link href="/daily" className="mt-2 shrink-0 sm:mt-0">
          <Button variant="primary" size="md">
            Comenzar primera sesión
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 pt-1 border-t border-border-subtle/40">
        <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-border-subtle bg-surface-raised px-3.5 py-2.5">
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-xs bg-surface-sunken text-fg-muted">
            <CalendarCheck size={15} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-body-sm font-semibold text-fg">1. Inicia tu racha</p>
            <p className="text-caption text-fg-muted">Un plan diario activa tu mapa de constancia mensual.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-border-subtle bg-surface-raised px-3.5 py-2.5">
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-xs bg-surface-sunken text-fg-muted">
            <Radar size={15} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-body-sm font-semibold text-fg">2. Desbloquea tu radar</p>
            <p className="text-caption text-fg-muted">Evalúa fonemas y vocabulario para proyectar tu perfil.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
