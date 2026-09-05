"use client";

import HomeChunkOfDayCard from "@/components/home/HomeChunkOfDayCard";
import HomeWordOfDayCard from "@/components/home/HomeWordOfDayCard";
import HomeImmersionCard from "@/components/home/HomeImmersionCard";

interface HomeRightSidebarProps {
  profileLevel?: string | null;
  wordsDueCount?: number;
  soundsDueCount?: number;
  previewWords?: Array<{ text: string }>;
  showImmersionCard?: boolean;
}

export default function HomeRightSidebar({
  profileLevel = null,
  wordsDueCount = 0,
  soundsDueCount = 0,
  previewWords = [],
  showImmersionCard = false,
}: HomeRightSidebarProps) {
  const totalDue = wordsDueCount + soundsDueCount;
  const remainingChips = Math.max(0, totalDue - previewWords.length);
  const hasDueReviews = totalDue > 0 || previewWords.length > 0;

  return (
    <aside
      aria-label="Contenido diario y repasos"
      className="flex min-w-0 flex-col gap-8 self-start lg:sticky lg:top-[calc(var(--layout-page-block)+0.5rem)]"
    >
      {/* Frase del día */}
      <HomeChunkOfDayCard />

      {/* Palabra del día */}
      <HomeWordOfDayCard profileLevel={profileLevel} />

      {/* Registro de inmersión: hábito satélite en columna derecha */}
      {showImmersionCard ? <HomeImmersionCard /> : null}

      {/* Bloque Te tocan hoy: solo existe cuando hay repasos */}
      {hasDueReviews ? (
        <section className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface-raised p-5" aria-label="Te tocan hoy">
          <h3 className="font-label text-body-xs font-semibold text-fg-muted">
            Te tocan hoy
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            {previewWords.map((item) => (
              <span
                key={item.text}
                className="rounded-full border border-border-subtle bg-surface-sunken px-3 py-1 font-mono-code text-body-sm font-medium text-fg"
              >
                {item.text}
              </span>
            ))}
            {remainingChips > 0 ? (
              <span className="font-mono-code text-body-sm font-medium text-fg-muted">
                +{remainingChips}
              </span>
            ) : null}
          </div>
        </section>
      ) : null}
    </aside>
  );
}
