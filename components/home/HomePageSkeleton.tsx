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
      <div className="home-layout-sections flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="h-3 w-24 animate-pulse rounded bg-surface-sunken" />
          <div className="h-8 w-48 max-w-full animate-pulse rounded-lg bg-surface-sunken" />
          <div className="h-4 w-64 max-w-full animate-pulse rounded bg-surface-sunken" />
        </div>
        <div className="flex flex-col gap-4">
          <div className="h-24 animate-pulse rounded-2xl bg-surface-sunken" />
          <div className="h-40 animate-pulse rounded-2xl bg-surface-sunken" />
          <div className="h-28 animate-pulse rounded-2xl bg-surface-sunken" />
        </div>
      </div>
    </div>
  );
}
