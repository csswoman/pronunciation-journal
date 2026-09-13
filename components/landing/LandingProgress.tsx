// Planned structure:
// <LandingProgress>
//   <LandingSectionHeading />
//   <SignalLadder />  — what each action is allowed to prove
import { LandingSection, LandingSectionHeading } from "@/components/landing/LandingSection";
import { LANDING_SIGNALS } from "@/lib/landing/content";

export function LandingProgress() {
  return (
    <LandingSection id="progreso" tone="sunken">
      <LandingSectionHeading
        kicker="Progreso honesto"
        title="Una racha no demuestra que hablas mejor."
        lead="La mayoría de las apps cuentan actividad y la llaman progreso. Aquí cada acción aporta solo la señal que puede sostener honestamente."
      />

      <ol className="mt-[var(--space-10)] grid gap-[var(--space-4)] md:grid-cols-2">
        {LANDING_SIGNALS.map((signal, index) => (
          <li
            key={signal.title}
            className="flex gap-[var(--space-4)] rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface-raised)] p-[var(--space-5)]"
          >
            <span
              aria-hidden
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[var(--primary-soft)] font-[var(--font-label)] text-[var(--primary)]"
            >
              {index + 1}
            </span>
            <div>
              <h3 className="font-[var(--font-h4)] text-[var(--text-primary)]">
                {signal.title}
              </h3>
              <p className="mt-[var(--space-1)] font-[var(--font-body-sm)] text-[var(--text-secondary)] text-pretty">
                {signal.description}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-[var(--space-8)] font-[var(--font-body)] text-[var(--text-secondary)]">
        El resultado es un perfil que puedes creer. Cuando dice que mejoraste la{" "}
        <span className="font-ipa text-[var(--primary)]">/θ/</span>, es porque lo
        demostraste en días distintos.
      </p>
    </LandingSection>
  );
}
