// Planned structure:
// <LandingProgress>
//   asymmetric heading (kicker, Bricolage title left, description right)
//   signal cards ×4 (1: exposure, 2: intent, 3: evidence, 4: mastery) with Bricolage numbers
//   callout banner (lilac-soft card with check icon + /θ/ milestone note)
import { Check } from "lucide-react";
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

      {/* Lilac Soft Milestone Callout Banner */}
      <div className="mt-8 flex items-center gap-4 rounded-2xl border border-[var(--lilac-deep)]/40 bg-[var(--lilac-soft)] p-5 text-sm font-medium text-ink sm:mt-10 sm:p-6 sm:text-base sm:gap-5 leading-snug">
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-black/10 text-ink"
        >
          <Check className="size-4" strokeWidth={2.5} />
        </span>
        <p>
          Cuando tu perfil dice que mejoraste la{" "}
          <strong className="font-ipa font-bold text-base sm:text-lg">/θ/</strong>, es porque lo
          demostraste en días distintos.
        </p>
      </div>
    </section>
  );
}
