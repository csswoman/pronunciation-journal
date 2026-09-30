// Planned structure:
// <LandingProgress>
//   <LandingProgressHeader>
//     Copy column (kicker, Bricolage title, subtitle)
//     <LandingUnmovedWidget /> (top-right panel: "LO QUE NO MUEVE TU NIVEL", strikethrough pills)
//   </LandingProgressHeader>
//   <ol className="staircase-grid">
//     <LandingSignalCard /> ×4 (Cards 1-4 with badges, description, 4-segment progress bar & status kicker)
//   </ol>
//   <LandingMilestoneCallout /> (<PastelCard tone="lilac"> milestone callout with 3-step timeline)
// </LandingProgress>

import { Check } from "lucide-react";
import PastelCard from "@/components/layout/PastelCard";
import { LANDING_SIGNALS, type LandingSignal } from "@/lib/landing/content";

const UNMOVED_ITEMS = ["Rachas", "Clics", "Lecciones abiertas"] as const;

const BADGE_STYLES = [
  "bg-[var(--sky-soft)] text-ink border-black/10",
  "bg-[var(--butter)] text-ink border-black/10 font-extrabold",
  "bg-[var(--coral)] text-ink border-black/10 font-extrabold",
  "bg-black/10 text-ink border-black/10 font-extrabold",
] as const;

const STAIRCASE_OFFSETS = [
  "lg:translate-y-12",
  "lg:translate-y-8",
  "lg:translate-y-4",
  "lg:translate-y-0",
] as const;

function LandingUnmovedWidget() {
  return (
    <div className="w-full shrink-0 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-5 sm:p-6 lg:max-w-xs xl:max-w-sm">
      <p className="font-mono text-[11px] font-bold tracking-widest text-[var(--text-tertiary)] uppercase">
        Lo que no mueve tu nivel
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {UNMOVED_ITEMS.map((item) => (
          <span
            key={item}
            className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 font-display text-xs font-semibold text-[var(--text-muted)] line-through decoration-[var(--coral)] decoration-2"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function LandingSignalCard({
  signal,
  index,
}: {
  signal: LandingSignal;
  index: number;
}) {
  const isMint = signal.tone === "mint";

  const content = (
    <div className="flex h-full flex-col justify-between p-6 sm:p-7">
      <div>
        <span
          aria-hidden="true"
          className={`flex size-9 items-center justify-center rounded-full border font-display text-sm font-bold tabular-nums shadow-2xs ${BADGE_STYLES[index]}`}
        >
          {index + 1}
        </span>

        <h3
          className={`mt-5 font-display text-base font-bold leading-snug sm:text-lg ${
            isMint ? "text-ink" : "text-[var(--text-strong)]"
          }`}
        >
          {signal.title}
        </h3>

        <p
          className={`mt-2.5 text-xs leading-relaxed text-pretty sm:text-sm ${
            isMint ? "text-ink-secondary" : "text-[var(--text-secondary)]"
          }`}
        >
          {signal.description}
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {/* 4-segment progress bar */}
        <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
          {[0, 1, 2, 3].map((segIdx) => {
            let segColor = "bg-[var(--border)]/40 dark:bg-white/10";
            if (isMint) {
              segColor = "bg-black/15";
            }

            if (signal.progressLevel === 4) {
              segColor = "bg-ink";
            } else if (segIdx < signal.progressLevel) {
              if (signal.tone === "butter") segColor = "bg-[var(--butter)]";
              if (signal.tone === "coral") segColor = "bg-[var(--coral)]";
            } else if (segIdx === 0 && signal.progressLevel === 0) {
              segColor = "bg-[var(--border-strong)]";
            }

            return (
              <span
                key={segIdx}
                className={`h-1.5 rounded-full transition-colors ${segColor}`}
              />
            );
          })}
        </div>

        {/* Status kicker text */}
        <span
          className={`font-mono text-xs ${
            isMint
              ? "font-bold text-ink"
              : "font-semibold text-[var(--text-muted)]"
          }`}
        >
          {signal.statusKicker}
        </span>
      </div>
    </div>
  );

  return (
    <li
      className={`flex flex-col justify-between rounded-3xl transition-transform duration-300 ${STAIRCASE_OFFSETS[index]}`}
    >
      {isMint ? (
        <PastelCard tone="mint" className="h-full p-0 shadow-md">
          {content}
        </PastelCard>
      ) : (
        <div className="h-full rounded-3xl border border-[var(--border)] bg-[var(--surface-raised)] shadow-xs">
          {content}
        </div>
      )}
    </li>
  );
}

function LandingMilestoneCallout() {
  return (
    <PastelCard
      tone="lilac"
      className="mt-12 flex flex-col justify-between gap-6 p-6 sm:mt-16 sm:p-8 lg:flex-row lg:items-center rounded-3xl"
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
  );
}

export function LandingProgress() {
  return (
    <section aria-labelledby="progress-title" className="w-full lg:pb-6">
      {/* Asymmetric Header with Top-Right Unmoved Widget */}
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="font-mono text-xs font-semibold tracking-widest text-[var(--text-tertiary)] uppercase">
            Progreso honesto
          </p>
          <h2
            id="progress-title"
            className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight text-[var(--text-strong)] sm:text-4xl lg:text-5xl lg:leading-[1.08]"
          >
            Una racha no demuestra que hablas mejor.
          </h2>
          <p className="mt-4 max-w-[46ch] text-pretty text-sm text-[var(--text-secondary)] leading-relaxed sm:text-base">
            Casi todas las apps cuentan actividad y la llaman progreso. Aquí cada
            acción aporta solo la señal que puede sostener.
          </p>
        </div>

        <LandingUnmovedWidget />
      </div>

      {/* 4 Signal Cards in Horizontal Staircase */}
      <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {LANDING_SIGNALS.map((signal, index) => (
          <LandingSignalCard key={signal.title} signal={signal} index={index} />
        ))}
      </ol>

      {/* Lilac PastelCard Milestone Callout */}
      <LandingMilestoneCallout />
    </section>
  );
}
