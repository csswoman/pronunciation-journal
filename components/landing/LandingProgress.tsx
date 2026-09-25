// Planned structure:
// <LandingProgress>
//   asymmetric heading (kicker, Bricolage title left, description right)
//   signal cards ×4 (1: exposure, 2: intent, 3: evidence, 4: mastery) with Bricolage numbers
//   <PastelCard tone="lilac"> (check icon + milestone note left, 3-step timeline right)
import { Check } from "lucide-react";
import PastelCard from "@/components/layout/PastelCard";
import { LANDING_SIGNALS } from "@/lib/landing/content";

const NUMBER_STYLES = [
  "bg-[var(--sky-soft)] text-ink border-black/10",
  "bg-[var(--butter-soft)] text-ink border-black/10",
  "bg-[var(--coral-soft)] text-ink border-black/10",
  "bg-[var(--mint-soft)] text-ink border-black/10",
] as const;

export function LandingProgress() {
  return (
    <section aria-labelledby="progress-title" className="w-full">
      {/* Asymmetric Section Header */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-xs font-semibold tracking-widest text-[var(--text-tertiary)] uppercase">
            Progreso honesto
          </p>
          <h2
            id="progress-title"
            className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight text-[var(--text-strong)] sm:text-4xl lg:leading-[1.12]"
          >
            Una racha no demuestra
            <br />
            que hablas mejor.
          </h2>
        </div>

        <p className="max-w-[45ch] text-pretty text-sm text-[var(--text-secondary)] sm:text-base leading-relaxed">
          Casi todas las apps cuentan actividad y la llaman progreso. Aquí cada
          acción aporta solo la señal que puede sostener.
        </p>
      </div>

      {/* 4 Numbered Signal Cards */}
      <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 sm:mt-14 sm:gap-6">
        {LANDING_SIGNALS.map((signal, index) => (
          <li
            key={signal.title}
            className="flex flex-col justify-start rounded-3xl border border-black/5 bg-white p-7 shadow-xs dark:border-[var(--border)] dark:bg-[var(--surface-raised)] sm:p-8"
          >
            <span
              aria-hidden="true"
              className={`flex size-10 items-center justify-center rounded-full border font-display text-base font-extrabold tabular-nums shadow-2xs ${NUMBER_STYLES[index]}`}
            >
              {index + 1}
            </span>

            <h3 className="mt-5 font-display text-base font-bold text-[var(--text-strong)] leading-snug">
              {signal.title}
            </h3>

            <p className="mt-2 text-xs text-[var(--text-secondary)] sm:text-sm leading-relaxed text-pretty max-w-[32ch]">
              {signal.description}
            </p>
          </li>
        ))}
      </ol>

      {/* Lilac PastelCard Milestone Callout */}
      <PastelCard
        tone="lilac"
        className="mt-8 flex flex-col justify-between gap-6 p-6 sm:mt-10 sm:p-8 lg:flex-row lg:items-center rounded-3xl"
      >
        {/* Left Info */}
        <div className="flex items-center gap-4 text-sm font-medium text-ink sm:gap-5 sm:text-base leading-snug">
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-white shadow-xs"
          >
            <Check className="size-4" strokeWidth={2.5} />
          </span>
          <p className="max-w-[42ch]">
            Cuando tu perfil dice que mejoraste la{" "}
            <span className="inline-flex items-center justify-center rounded-lg bg-white px-2 py-0.5 font-ipa font-bold text-ink border border-black/10 shadow-2xs mx-0.5 text-base sm:text-lg">
              /θ/
            </span>
            , es porque lo{" "}
            <strong className="font-bold text-ink">demostraste en días distintos.</strong>
          </p>
        </div>

        {/* Right Step Flow Timeline */}
        <div className="flex items-start gap-2 sm:gap-3 shrink-0 self-start lg:self-auto pt-1 pb-1">
          <div className="flex flex-col items-center gap-1.5">
            <span className="flex size-7 items-center justify-center rounded-full bg-black/10 text-ink">
              <Check className="size-3.5" strokeWidth={2.5} />
            </span>
            <span className="font-mono text-[11px] font-semibold text-ink-secondary">Día 1</span>
          </div>

          <div className="flex h-7 items-center" aria-hidden="true">
            <span className="w-4 sm:w-8 border-t-2 border-dashed border-black/20" />
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <span className="flex size-7 items-center justify-center rounded-full bg-black/10 text-ink">
              <Check className="size-3.5" strokeWidth={2.5} />
            </span>
            <span className="font-mono text-[11px] font-semibold text-ink-secondary">Día 4</span>
          </div>

          <div className="flex h-7 items-center" aria-hidden="true">
            <span className="w-4 sm:w-8 border-t-2 border-dashed border-black/20" />
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <span className="flex size-7 items-center justify-center rounded-full bg-black/10 text-ink">
              <Check className="size-3.5" strokeWidth={2.5} />
            </span>
            <span className="font-mono text-[11px] font-semibold text-ink-secondary">Día 11</span>
          </div>

          <div className="flex h-7 items-center" aria-hidden="true">
            <span className="w-4 sm:w-8 border-t-2 border-dashed border-black/20" />
          </div>

          <div className="flex h-7 items-center">
            <div className="flex h-7 items-center gap-1.5 rounded-full bg-ink px-3.5 font-display text-xs font-bold text-white shadow-2xs whitespace-nowrap">
              <span className="font-ipa font-bold !text-white">/θ/</span>
              <span className="!text-white">dominada</span>
            </div>
          </div>
        </div>
      </PastelCard>
    </section>
  );
}

