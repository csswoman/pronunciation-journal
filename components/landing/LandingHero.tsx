// Planned structure:
// <LandingHero>
//   <LandingNav />          — logo + skip-to-app link
//   hero copy + CTAs
//   <LandingHeroCard />     — the "one word, examined" specimen card
import Link from "next/link";
import { LandingHeroCard } from "@/components/landing/LandingHeroCard";

export function LandingHero() {
  return (
    <header className="relative overflow-hidden px-[var(--space-5)] pb-[var(--space-16)] pt-[var(--space-8)] md:pb-[var(--space-20)]">
      {/* Soft hue wash: identity without a colored canvas. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_100%_at_50%_0%,var(--primary-50),transparent)]"
      />

      <nav className="relative mx-auto flex w-full max-w-5xl items-center justify-between">
        <span className="font-[var(--font-h4)] text-[var(--text-primary)]">
          English Journal
        </span>
        <Link
          href="/login"
          className="rounded-[var(--radius-full)] px-[var(--space-4)] py-[var(--space-2)] font-[var(--font-label)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        >
          Entrar
        </Link>
      </nav>

      <div className="relative mx-auto mt-[var(--space-16)] grid w-full max-w-5xl items-center gap-[var(--space-12)] md:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col gap-[var(--space-5)]">
          <p className="font-[var(--font-kicker)] uppercase tracking-[var(--text-tracking-kicker)] text-[var(--accent-1)]">
            Pronunciación · A1 a C2
          </p>

          <h1 className="text-[length:clamp(2.25rem,1.4rem+3.6vw,4rem)] font-[var(--text-weight-h1)] leading-[var(--text-leading-display)] tracking-[var(--text-tracking-h1)] text-[var(--text-primary)] text-balance">
            Entiendes el inglés escrito.
            <br />
            Ahora entrena el oído.
          </h1>

          <p className="max-w-xl text-[var(--text-size-body-lg)] leading-[var(--text-leading-body-lg)] text-[var(--text-secondary)] text-pretty">
            Un diario de pronunciación que escucha cómo hablas, te dice qué
            sonido se te escapa y decide qué practicar mañana. Sin mascotas, sin
            vidas, sin premios vacíos.
          </p>

          <div className="mt-[var(--space-2)] flex flex-wrap items-center gap-[var(--space-3)]">
            <Link
              href="/login"
              className="rounded-[var(--radius-full)] bg-[var(--cta-bg)] px-[var(--space-6)] py-[var(--space-3)] font-[var(--font-label)] text-[var(--cta-fg)] transition-transform hover:-translate-y-[1px]"
            >
              Probar sin cuenta
            </Link>
            <Link
              href="#practicas"
              className="rounded-[var(--radius-full)] border border-[var(--border)] px-[var(--space-6)] py-[var(--space-3)] font-[var(--font-label)] text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-raised)]"
            >
              Ver cómo funciona
            </Link>
          </div>

          <p className="font-[var(--font-caption)] text-[var(--text-tertiary)]">
            Entras como invitado. Puedes guardar tu progreso en una cuenta
            después.
          </p>
        </div>

        <LandingHeroCard />
      </div>
    </header>
  );
}
