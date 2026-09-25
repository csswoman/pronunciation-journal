// Planned structure:
// <LandingClose>
//   <PastelCard tone="coral">
//     left copy column (Bricolage display H2, description, CTA row)
//     right dashed circle illustration slot with KoboyoSlot "celebrating"
//   <LandingFooter /> (copyright note + legal links)
import Link from "next/link";
import PastelCard from "@/components/layout/PastelCard";
import { KoboyoSlot } from "@/components/illustrations/KoboyoSlot";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function LandingClose() {
  return (
    <section aria-labelledby="close-title" className="w-full">
      <PastelCard
        tone="coral"
        className="relative flex flex-col justify-between gap-10 overflow-hidden p-8 sm:p-12 lg:flex-row lg:items-center lg:p-16 rounded-3xl"
      >
        {/* Left Copy Column */}
        <div className="flex flex-col items-start">
          <h2
            id="close-title"
            className="text-balance font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl lg:leading-[1.08]"
          >
            Tu voz. Tu nivel.
            <br />
            Tu diario.
          </h2>

          <p className="mt-6 max-w-[48ch] text-pretty text-base text-ink-secondary sm:text-lg sm:leading-relaxed">
            Empieza con una sesión de cinco minutos. No necesitas saber IPA, ni
            qué es un par mínimo, ni crear una cuenta.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3.5 sm:mt-10">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-ink/90 active:scale-95 sm:text-base font-display focus-ring"
            >
              Empezar ahora
              <span aria-hidden="true">→</span>
            </Link>

            <Link
              href="/login"
              className="rounded-full border border-black/25 px-6 py-3.5 text-sm font-medium text-ink transition-colors hover:bg-black/5 active:scale-95 sm:text-base focus-ring"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>

        {/* Right Decorative Koboyo Illustration */}
        <div
          aria-hidden="true"
          className="mx-auto flex size-56 shrink-0 items-center justify-center rounded-3xl bg-black/5 p-6 text-center select-none sm:size-64 lg:mx-0"
        >
          <KoboyoSlot
            name="celebrating"
            variant="closing"
            className="h-32 w-auto text-ink"
          />
        </div>
      </PastelCard>

      <LandingFooter />
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="mt-16 border-t border-[var(--border)] pt-8 pb-16 sm:mt-24">
      <div className="flex flex-col items-center justify-between gap-6 text-xs text-[var(--text-tertiary)] sm:flex-row">
        <p>English Journal · proyecto personal de aprendizaje de inglés</p>
        <div className="flex items-center gap-6 sm:gap-8">
          <nav className="flex items-center gap-6 sm:gap-8">
            <Link
              href="/login"
              className="transition-colors hover:text-[var(--text-strong)]"
            >
              Entrar
            </Link>
            <Link
              href="/privacy"
              className="transition-colors hover:text-[var(--text-strong)]"
            >
              Privacidad
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-[var(--text-strong)]"
            >
              Términos
            </Link>
          </nav>
          <ThemeToggle variant="labeled" />
        </div>
      </div>
    </footer>
  );
}
