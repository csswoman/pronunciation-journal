"use client";

// Planned structure:
// <HomeExploreGrid>
//   <HomeChunkOfDayCard /> (2 cols en desktop / carousel item en móvil)
//   <HomeWordOfDayCard /> (1 col en desktop / carousel item en móvil)
// </HomeExploreGrid>

import HomeChunkOfDayCard from "@/components/home/HomeChunkOfDayCard";
import HomeWordOfDayCard from "@/components/home/HomeWordOfDayCard";

interface HomeExploreGridProps {
  profileLevel?: string | null;
}

export default function HomeExploreGrid({ profileLevel = null }: HomeExploreGridProps) {
  return (
    <section aria-label="Explorar" className="flex flex-col gap-3">
      <h2 className="font-label text-sm text-fg-muted">Explorar</h2>

      {/* Grid bento en desktop (≥768px) / scroll horizontal en móvil (<768px) */}
      <div className="hidden md:grid md:grid-cols-3 md:gap-4 items-stretch">
        <div className="md:col-span-2 flex flex-col">
          <HomeChunkOfDayCard />
        </div>
        <div className="md:col-span-1 flex flex-col">
          <HomeWordOfDayCard profileLevel={profileLevel} />
        </div>
      </div>

      <div className="flex md:hidden overflow-x-auto gap-3.5 pb-2 -mx-4 px-4 snap-x snap-mandatory no-scrollbar">
        <div className="min-w-[85vw] sm:min-w-[340px] snap-center flex flex-col">
          <HomeChunkOfDayCard />
        </div>
        <div className="min-w-[85vw] sm:min-w-[340px] snap-center flex flex-col">
          <HomeWordOfDayCard profileLevel={profileLevel} />
        </div>
      </div>
    </section>
  );
}
