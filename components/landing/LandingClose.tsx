// Planned structure:
// <LandingClose>
//   <PastelCard tone="coral">
//     left copy column (H2 title, description, 3 check pills, CTA buttons)
//     right preview card ("TU PRIMERA SESIÓN", 3-step vertical timeline with solid colors & tight lines, guest notice)
//   <LandingFooter /> (copyright note + legal links)
import Link from "next/link";
import { Check } from "lucide-react";
import PastelCard from "@/components/layout/PastelCard";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function LandingClose() {
  return (
    <section aria-labelledby="close-title" className="w-full">
      <PastelCard
        tone="coral"
        className="relative flex flex-col justify-between gap-10 overflow-hidden p-8 sm:p-12 lg:flex-row lg:items-center lg:p-16 rounded-3xl"
      >
        {/* Left Copy Column */}
        <div className="flex flex-col items-start max-w-xl">
          <h2
            id="close-title"
            className="text-balance font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl lg:text-6xl lg:leading-[1.05]"
          >
            Tu voz. Tu nivel.
            <br />
            Tu diario.
          </h2>

          <p className="mt-6 max-w-[44ch] text-pretty text-base text-ink-secondary sm:text-lg sm:leading-relaxed">
            Empieza con una sesión de cinco minutos. No necesitas saber IPA, ni
            qué es un par mínimo, ni crear una cuenta.
          </p>

          {/* 3 Feature Check Pills */}
          <div className="mt-6 flex flex-wrap items-center gap-2.5 sm:mt-8">
            <div className="flex items-center gap-2 rounded-full bg-black/10 px-3.5 py-1.5 text-xs font-bold text-ink sm:text-sm">
              <span className="flex size-4 items-center justify-center rounded-full bg-ink text-white">
                <Check className="size-2.5" strokeWidth={3} />
              </span>
              5 minutos
            </div>
            <div className="flex items-center gap-2 rounded-full bg-black/10 px-3.5 py-1.5 text-xs font-bold text-ink sm:text-sm">
              <span className="flex size-4 items-center justify-center rounded-full bg-ink text-white">
                <Check className="size-2.5" strokeWidth={3} />
              </span>
              Sin cuenta
            </div>
            <div className="flex items-center gap-2 rounded-full bg-black/10 px-3.5 py-1.5 text-xs font-bold text-ink sm:text-sm">
              <span className="flex size-4 items-center justify-center rounded-full bg-ink text-white">
                <Check className="size-2.5" strokeWidth={3} />
              </span>
              Sin saber IPA
            </div>
          </div>

          {/* CTA Row */}
          <div className="mt-8 flex flex-wrap items-center gap-5 sm:mt-10">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 font-display text-sm font-bold text-white shadow-sm transition-all hover:bg-ink/90 active:scale-95 sm:text-base focus-ring"
            >
              Empezar ahora
              <span aria-hidden="true">→</span>
            </Link>

            <Link
              href="/login"
              className="font-display text-sm font-semibold text-ink underline underline-offset-4 transition-opacity hover:opacity-80 sm:text-base focus-ring"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>

        {/* Right Demo Card: TU PRIMERA SESIÓN */}
        <div className="w-full max-w-md shrink-0 rounded-3xl bg-white p-6 sm:p-8 shadow-sm text-ink border border-black/5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold tracking-widest text-[var(--text-tertiary)] uppercase">
              TU PRIMERA SESIÓN
            </span>
            <span className="rounded-full bg-[var(--butter)] px-3 py-1 font-display text-xs font-bold text-ink">
              5 min
            </span>
          </div>

          {/* Steps List with Solid Colors and Continuous Tight Lines */}
          <div className="mt-6 flex flex-col">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--sky)] font-display text-sm font-extrabold text-ink">
                  1
                </span>
                <span aria-hidden="true" className="w-0.5 grow bg-black/15 my-1" />
              </div>
              <div className="pb-5">
                <h3 className="font-display text-base font-bold text-ink leading-snug">
                  Escucha y repite
                </h3>
                <p className="mt-0.5 text-xs sm:text-sm text-ink-secondary leading-relaxed">
                  Frases cortas con audio nativo.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--coral)] font-display text-sm font-extrabold text-ink">
                  2
                </span>
                <span aria-hidden="true" className="w-0.5 grow bg-black/15 my-1" />
              </div>
              <div className="pb-5">
                <h3 className="font-display text-base font-bold text-ink leading-snug">
                  Compara tu onda
                </h3>
                <p className="mt-0.5 text-xs sm:text-sm text-ink-secondary leading-relaxed">
                  Tu grabación junto a la nativa.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--mint)] font-display text-sm font-extrabold text-ink">
                  3
                </span>
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-ink leading-snug">
                  Llévate tu plan
                </h3>
                <p className="mt-0.5 text-xs sm:text-sm text-ink-secondary leading-relaxed">
                  El sonido que vas a practicar mañana.
                </p>
              </div>
            </div>
          </div>

          {/* Guest Notice Box */}
          <div className="mt-6 rounded-2xl bg-[var(--mint-soft)] border border-black/5 p-4 text-xs sm:text-sm font-medium text-ink leading-relaxed">
            <strong className="font-bold">Entras como invitado.</strong> Si te sirve, guardas tu progreso después.
          </div>
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


