"use client";

// Sub-components:
// <HomeRightSidebar>
//   <HomeChunkOfDayCard />
//   <HomeWordOfDayCard />
// </HomeRightSidebar>

import HomeChunkOfDayCard from "@/components/home/HomeChunkOfDayCard";
import HomeWordOfDayCard from "@/components/home/HomeWordOfDayCard";

interface HomeRightSidebarProps {
  profileLevel?: string | null;
}

export default function HomeRightSidebar({
  profileLevel = null,
}: HomeRightSidebarProps) {
  return (
    <aside
      aria-label="Contenido diario"
      className="flex min-w-0 flex-col gap-8 self-start lg:sticky lg:top-[calc(var(--layout-page-block)+0.5rem)]"
    >
      {/* Frase del día */}
      <HomeChunkOfDayCard />

      {/* Palabra del día */}
      <HomeWordOfDayCard profileLevel={profileLevel} />
    </aside>
  );
}
