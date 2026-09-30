// Planned structure:
// <LandingStatsRow>
//   stat cards ×4 with Bricolage numbers (2.800 words, 110 sounds, 66 mini-lessons, 276 grammar decks)
import { LANDING_STATS } from "@/lib/landing/content";

export function LandingStatsRow() {
  return (
    <section aria-label="Métricas del contenido" className="w-full">
      <dl className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        {LANDING_STATS.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col justify-center rounded-3xl border border-black/5 bg-white p-7 shadow-xs dark:border-[var(--border)] dark:bg-[var(--surface-raised)] sm:p-8"
          >
            <dt className="font-display text-4xl font-extrabold tracking-tight text-[var(--text-strong)] tabular-nums leading-none sm:text-5xl">
              {stat.value}
            </dt>
            <dd className="mt-2.5 text-xs text-[var(--text-secondary)] sm:text-sm leading-snug text-pretty">
              {stat.label}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
