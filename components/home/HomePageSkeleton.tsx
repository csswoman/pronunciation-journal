// Planned structure:
// <HomePageSkeleton>
//   <header pulse />
//   <main pulse blocks />
//   <aside pulse blocks />
// </HomePageSkeleton>

/**
 * Mirrors HomeCommandGrid's geometry exactly (same gaps, same two-column grid,
 * same block heights). Any divergence shows up as CLS when Suspense swaps this
 * for the real content, so both trees must stay structurally identical.
 */
export default function HomePageSkeleton() {
  return (
    <div
      className="flex flex-col gap-8"
      aria-busy="true"
      aria-label="Cargando inicio"
    >
      {/* Encabezado: espeja HomeHeader */}
      <div className="flex flex-col gap-3">
        <div className="h-3 w-24 animate-pulse rounded bg-surface-sunken" />
        <div className="h-8 w-48 max-w-full animate-pulse rounded-lg bg-surface-sunken" />
        <div className="h-4 w-64 max-w-full animate-pulse rounded bg-surface-sunken" />
      </div>

      {/* Misma cuadrícula que HomeCommandGrid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
        <div className="flex flex-col gap-8 min-w-0">
          <div className="h-44 animate-pulse rounded-xl border border-border-default bg-daily-card" />
          <div className="h-32 animate-pulse rounded-xl border border-border-subtle bg-surface-raised" />
        </div>
        <aside className="flex min-w-0 flex-col gap-8 self-start" aria-hidden>
          <div className="h-44 animate-pulse rounded-xl border border-border-subtle bg-surface-raised" />
          <div className="h-44 animate-pulse rounded-xl border border-border-subtle bg-surface-raised" />
        </aside>
      </div>
    </div>
  );
}
