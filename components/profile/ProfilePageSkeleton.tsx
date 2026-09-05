"use client";

// Planned structure:
// <ProfilePageSkeleton>
//   <SkeletonHeader />
//   <SkeletonGrid>
//     <SkeletonMainColumn />
//     <SkeletonAsideColumn />
//   </SkeletonGrid>
// </ProfilePageSkeleton>

export default function ProfilePageSkeleton() {
  return (
    <div
      className="flex w-full max-w-5xl flex-col gap-8 pb-24 md:pb-0"
      aria-busy="true"
      aria-label="Cargando perfil"
    >
      <div className="flex flex-col gap-2">
        <div className="h-3 w-20 animate-pulse rounded-md bg-surface-sunken" />
        <div className="h-8 w-40 animate-pulse rounded-lg bg-surface-sunken" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-surface-sunken" />
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="layout-stack-loose min-w-0">
          <div className="h-40 animate-pulse rounded-xl border border-border-subtle bg-surface-raised" />
          <div className="h-64 animate-pulse rounded-xl border border-border-subtle bg-surface-raised" />
        </div>
        <div className="h-56 animate-pulse rounded-xl border border-border-subtle bg-surface-raised" />
      </div>
    </div>
  );
}
