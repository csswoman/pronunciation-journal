// Planned structure:
// <LandingAdaptive>
//   <LandingSectionHeading />
//   <StatGrid />      — real content counts
//   <ModeMarquee />   — the eight exercise modes the evaluator grades
import { LandingSection, LandingSectionHeading } from "@/components/landing/LandingSection";
import { LANDING_STATS, LANDING_EXERCISE_MODES } from "@/lib/landing/content";

export function LandingAdaptive() {
  return (
    <LandingSection id="adaptive">
      <LandingSectionHeading
        kicker="Cómo se adapta"
        title="Cuanto más hablas, mejor sabe qué te falta."
        lead="Cada respuesta evaluada actualiza un perfil por sonido, no un porcentaje global. Si confundes /ɪ/ con /iː/, mañana practicas eso, y no una lección que ya dominas."
      />

      <dl className="mt-[var(--space-10)] grid gap-[var(--space-4)] sm:grid-cols-2 lg:grid-cols-4">
        {LANDING_STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface-raised)] p-[var(--space-5)]"
          >
            <dt className="font-[var(--font-h2)] text-[var(--primary)]">
              {stat.value}
            </dt>
            <dd className="mt-[var(--space-2)] font-[var(--font-body-sm)] text-[var(--text-secondary)] text-pretty">
              {stat.label}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-[var(--space-8)] rounded-[var(--radius-xl)] bg-[var(--surface-sunken)] p-[var(--space-6)]">
        <p className="font-[var(--font-label)] text-[var(--text-primary)]">
          Ocho formatos de ejercicio, todos con calificación determinista
        </p>
        <p className="mt-[var(--space-2)] font-[var(--font-body-sm)] text-[var(--text-secondary)]">
          La IA explica los errores. No los califica. El resultado de un
          ejercicio no cambia según el humor del modelo.
        </p>
        <ul className="mt-[var(--space-4)] flex flex-wrap gap-[var(--space-2)]">
          {LANDING_EXERCISE_MODES.map((mode) => (
            <li
              key={mode}
              className="rounded-[var(--radius-full)] border border-[var(--border)] bg-[var(--surface-raised)] px-[var(--space-3)] py-[var(--space-1)] font-[var(--font-caption)] text-[var(--text-secondary)]"
            >
              {mode}
            </li>
          ))}
        </ul>
      </div>
    </LandingSection>
  );
}
