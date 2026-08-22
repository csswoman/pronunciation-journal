// Planned structure:
// <HomePageSkeleton>
//   <header pulse />
//   <main pulse blocks />
// </HomePageSkeleton>

export default function HomePageSkeleton() {
  return (
    <div
      className="home-layout home-layout-shell"
      aria-busy="true"
      aria-label="Cargando inicio"
    >
      <div className="home-layout-sections flex flex-col">
        <div className="flex flex-col gap-3">
          <div className="h-3 w-24 animate-pulse rounded bg-surface-sunken" />
          <div className="h-8 w-48 max-w-full animate-pulse rounded-lg bg-surface-sunken" />
          <div className="h-4 w-64 max-w-full animate-pulse rounded bg-surface-sunken" />
        </div>
        <div className="home-command-grid">
          <div className="home-command-main">
            <div className="h-20 animate-pulse rounded-xl border border-border-subtle bg-surface-raised" />
            <div className="h-44 animate-pulse rounded-xl border border-border-default bg-daily-card" />
            <div className="h-32 animate-pulse rounded-xl border border-border-subtle bg-surface-raised" />
          </div>
          <aside className="home-command-aside flex flex-col gap-4" aria-hidden>
            <div className="h-44 animate-pulse rounded-xl border border-border-subtle bg-surface-raised" />
            <div className="h-44 animate-pulse rounded-xl border border-border-subtle bg-surface-raised" />
            <div className="h-32 animate-pulse rounded-xl border border-border-subtle bg-surface-raised" />
          </aside>
        </div>
      </div>
    </div>
  );
}
