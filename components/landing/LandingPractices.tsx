// Planned structure:
// <LandingPractices>
//   <LandingSectionHeading />
//   <PracticeCard /> ×4      — one per way of practising
import { getIllustration } from "@/lib/illustrations/registry";
import { LandingSection, LandingSectionHeading } from "@/components/landing/LandingSection";
import { LANDING_PRACTICES, type LandingPractice } from "@/lib/landing/content";

export function LandingPractices() {
  return (
    <LandingSection id="practicas" tone="sunken">
      <LandingSectionHeading
        kicker="Qué incluye"
        title="Cuatro formas de practicar. Un solo perfil."
        lead="Cada una produce una señal distinta sobre cómo hablas. Todas alimentan la misma cola de repaso, así que nada se practica dos veces por accidente."
      />

      <div className="mt-[var(--space-10)] grid gap-[var(--space-4)] sm:grid-cols-2">
        {LANDING_PRACTICES.map((practice) => (
          <PracticeCard key={practice.title} practice={practice} />
        ))}
      </div>
    </LandingSection>
  );
}

function PracticeCard({ practice }: { practice: LandingPractice }) {
  const Illustration = getIllustration(practice.illustration);

  return (
    <article className="flex flex-col gap-[var(--space-3)] rounded-[var(--radius-2xl)] border border-[var(--border)] bg-[var(--surface-raised)] p-[var(--space-6)]">
      {/* Registry art is monochrome currentColor and has no intrinsic size:
          cap the box and let object-contain preserve each icon's own ratio. */}
      <Illustration
        aria-hidden
        className="h-14 w-14 object-contain object-left text-[var(--accent-1)]"
      />
      <h3 className="font-[var(--font-h3)] text-[var(--text-primary)]">
        {practice.title}
      </h3>
      <p className="font-[var(--font-body-sm)] text-[var(--text-secondary)] text-pretty">
        {practice.description}
      </p>
      <ul className="mt-auto flex flex-wrap gap-[var(--space-2)] pt-[var(--space-2)]">
        {practice.tags.map((tag) => (
          <li
            key={tag}
            className="rounded-[var(--radius-full)] bg-[var(--surface-sunken)] px-[var(--space-3)] py-[var(--space-1)] font-[var(--font-tiny)] text-[var(--text-tertiary)]"
          >
            {tag}
          </li>
        ))}
      </ul>
    </article>
  );
}
