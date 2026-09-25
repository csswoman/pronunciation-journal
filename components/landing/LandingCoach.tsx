// Planned structure:
// <LandingCoach>
//   <PastelCard tone="mint">
//     decorative wave
//     copy column (kicker, Bricolage title, paragraph, button "Probar una conversación")
//     dialogue card (user bubble, coach bubble in mint, SRS add pill in butter)
import Link from "next/link";
import PastelCard from "@/components/layout/PastelCard";

export function LandingCoach() {
  return (
    <section id="como-funciona" aria-labelledby="coach-title" className="w-full">
      <PastelCard
        tone="mint"
        className="relative overflow-hidden p-8 sm:p-12 lg:p-16 rounded-3xl"
      >
        {/* Soft decorative sketch wave */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute -top-4 left-10 h-28 w-44 text-black/10"
          viewBox="0 0 160 80"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M 0 40 Q 40 10, 80 40 T 160 40" />
        </svg>

        <div className="relative z-10 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Copy Column */}
          <div className="flex flex-col items-start">
            <span className="inline-flex items-center rounded-full bg-black px-3.5 py-1 font-mono text-xs font-semibold tracking-widest uppercase text-white shadow-2xs">
              El coach
            </span>

            <h2
              id="coach-title"
              className="mt-5 text-balance font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl lg:leading-[1.08]"
            >
              Te corrige
              <br />
              y te dice
              <br />
              por qué.
            </h2>

            <p className="mt-6 max-w-[48ch] text-pretty text-base text-ink-secondary sm:text-lg sm:leading-relaxed">
              Habla contigo en español mientras practicas en inglés, porque una
              explicación que no entiendes no enseña nada. Cuando subes de nivel,
              cambia solo.
            </p>

            <Link
              href="/login"
              className="mt-8 inline-flex items-center rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-ink/90 active:scale-95 sm:mt-10 sm:text-base font-display focus-ring"
            >
              Probar una conversación
            </Link>
          </div>

          {/* Dialogue Specimen Card */}
          <article
            aria-label="Ejemplo de diálogo con el coach"
            className="flex w-full flex-col gap-4 rounded-3xl border border-black/10 bg-white/95 p-7 shadow-xl shadow-black/5 sm:p-8"
          >
            {/* User Bubble */}
            <div className="flex flex-col self-end max-w-[85%] rounded-2xl border border-black/10 bg-neutral-100/90 p-4 sm:p-5">
              <span className="font-mono text-[10px] font-bold tracking-widest text-ink-muted uppercase">
                Tú dijiste
              </span>
              <p className="mt-1 text-sm font-medium leading-snug text-ink sm:text-base">
                I want to <span className="font-ipa font-bold">/ji:t/</span> on
                the chair
              </p>
            </div>

            {/* Coach Bubble */}
            <div className="flex flex-col self-start max-w-[95%] rounded-2xl border border-black/10 bg-[var(--mint-soft)] p-4 sm:p-5">
              <span className="font-mono text-[10px] font-bold tracking-widest text-ink uppercase">
                Coach
              </span>
              <p className="mt-1 text-sm text-ink sm:text-base leading-relaxed">
                Casi. Dijiste <span className="font-ipa font-bold">/ji:t/</span>,
                con vocal larga. Para <strong>sit</strong> necesitas{" "}
                <span className="font-ipa font-bold">/sɪt/</span>: más corta y más
                relajada, con la lengua un poco más baja.
              </p>
            </div>

            {/* SRS Added Pill */}
            <div className="flex items-center gap-3.5 rounded-2xl border border-black/10 bg-[var(--butter-soft)] p-3.5 sm:p-4 text-xs font-medium text-ink sm:text-sm tabular-nums">
              <span
                aria-hidden="true"
                className="flex size-5 items-center justify-center rounded-full bg-ink font-bold text-xs text-white shrink-0 sm:size-6"
              >
                +
              </span>
              <p>
                Añadido a tu práctica de mañana:{" "}
                <strong className="font-ipa font-bold">/ɪ/</strong> frente a{" "}
                <strong className="font-ipa font-bold">/i:/</strong>
              </p>
            </div>
          </article>
        </div>
      </PastelCard>
    </section>
  );
}
