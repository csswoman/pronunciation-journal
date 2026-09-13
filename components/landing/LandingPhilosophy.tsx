// Planned structure:
// <LandingPhilosophy>  — single pull-quote band, no card, no chrome
import { LandingSection } from "@/components/landing/LandingSection";

export function LandingPhilosophy() {
  return (
    <LandingSection>
      <figure className="mx-auto max-w-3xl text-center">
        <blockquote className="text-[length:clamp(1.375rem,1.05rem+1.5vw,2rem)] font-[var(--text-weight-h2)] leading-[var(--text-leading-h2)] tracking-[var(--text-tracking-h2)] text-[var(--text-primary)] text-balance">
          “Aprender a pronunciar no es repetir hasta que suene bien. Es notar la
          diferencia que antes no oías.”
        </blockquote>
        <figcaption className="mt-[var(--space-5)] font-[var(--font-caption)] text-[var(--text-tertiary)]">
          El principio que ordena toda la app: primero el oído, después la boca.
        </figcaption>
      </figure>
    </LandingSection>
  );
}
