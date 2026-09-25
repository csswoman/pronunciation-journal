// Planned structure:
// <LandingPractices>
//   asymmetric section heading (kicker, Bricolage title left, description right)
//   practice cards grid ×4 (PastelCard: Coral, Butter, Mint, Lilac) with Koboyo illustrations
//   horizontal exercise modes bar (8 modes in pills + determinism note)
import PastelCard from "@/components/layout/PastelCard";
import { KoboyoSlot } from "@/components/illustrations/KoboyoSlot";
import {
  LANDING_PRACTICES,
  LANDING_EXERCISE_MODES,
  type LandingPractice,
} from "@/lib/landing/content";

export function LandingPractices() {
  return (
    <section id="que-incluye" aria-labelledby="practices-title" className="w-full">
      {/* Asymmetric Section Header */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-xs font-semibold tracking-widest text-[var(--text-tertiary)] uppercase">
            Qué incluye
          </p>
          <h2
            id="practices-title"
            className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight text-[var(--text-strong)] sm:text-4xl lg:leading-[1.12]"
          >
            Cuatro formas de practicar.
            <br />
            Un solo perfil de tu voz.
          </h2>
        </div>

        <p className="max-w-[45ch] text-pretty text-sm text-[var(--text-secondary)] sm:text-base leading-relaxed">
          Cada una deja una señal distinta sobre cómo hablas. Todas alimentan la
          misma cola de repaso, así que nada se practica dos veces por
          accidente.
        </p>
      </div>

      {/* 4 Pastel Cards Grid with Koboyo Illustrations */}
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 sm:mt-14 sm:gap-6">
        {LANDING_PRACTICES.map((practice) => (
          <PracticeItem key={practice.title} practice={practice} />
        ))}
      </div>

      {/* 8 Exercise Modes Horizontal Bar */}
      <div className="mt-8 flex flex-col justify-between gap-6 rounded-3xl border border-black/5 bg-white p-6 shadow-xs dark:border-[var(--border)] dark:bg-[var(--surface-raised)] sm:mt-10 sm:p-8 lg:flex-row lg:items-center">
        <div>
          <h3 className="font-display text-base font-bold text-[var(--text-strong)]">
            Ocho formatos de ejercicio
          </h3>
          <p className="mt-1 text-xs text-[var(--text-secondary)] sm:text-sm leading-normal text-pretty">
            La IA explica los errores. No los califica: el resultado no depende
            del humor del modelo.
          </p>
        </div>

        <ul className="flex flex-wrap items-center gap-2">
          {LANDING_EXERCISE_MODES.map((mode) => (
            <li
              key={mode}
              className="rounded-full border border-neutral-200 bg-neutral-50 px-3.5 py-1 text-xs font-medium text-[var(--text-secondary)] dark:border-neutral-700 dark:bg-neutral-800"
            >
              {mode}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function PracticeItem({ practice }: { practice: LandingPractice }) {
  return (
    <PastelCard
      tone={practice.tone}
      className="flex flex-col justify-between rounded-3xl p-7 sm:p-8"
    >
      <div>
        {/* Top Koboyo Illustration Box */}
        <div
          aria-hidden="true"
          className="flex h-24 items-center justify-center rounded-2xl border border-black/10 bg-white/45 p-3 text-center dark:border-white/10 dark:bg-white/20 select-none"
        >
          <KoboyoSlot
            name={practice.label}
            variant="card"
            className="h-16 w-auto text-ink"
          />
        </div>

        <h3 className="mt-6 font-display text-2xl font-extrabold tracking-tight text-ink leading-snug">
          {practice.title}
        </h3>

        <p className="mt-2.5 text-sm text-ink-secondary leading-relaxed text-pretty max-w-[34ch]">
          {practice.description}
        </p>
      </div>

      {/* Tags Pill Row */}
      <ul className="mt-8 flex flex-wrap gap-2 pt-2">
        {practice.tags.map((tag) => (
          <li
            key={tag}
            className="rounded-full bg-white/45 px-3 py-1 text-xs font-medium text-ink leading-none"
          >
            {tag}
          </li>
        ))}
      </ul>
    </PastelCard>
  );
}
