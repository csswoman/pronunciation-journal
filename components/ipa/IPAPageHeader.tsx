"use client";

// Planned structure:
// <IPAPageHeader>
//   <TitlesGroup>
//     <Kicker />
//     <Title />
//     <Subtitle />
//   </TitlesGroup>
//   <ControlsGroup>
//     <CategoryTabs />
//     <SearchInput />
//   </ControlsGroup>
// </IPAPageHeader>

import { Search } from "@/components/icons";
import { cn } from "@/lib/cn";

type MatrixCategory = "vowel" | "consonant" | "diphthong";

const TABS: { id: MatrixCategory; label: string }[] = [
  { id: "vowel", label: "Vocales" },
  { id: "consonant", label: "Consonantes" },
  { id: "diphthong", label: "Diptongos" },
];

interface IPAPageHeaderProps {
  activeCategory: MatrixCategory;
  onCategoryChange: (cat: MatrixCategory) => void;
  counts: Record<MatrixCategory, number>;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function IPAPageHeader({
  activeCategory,
  onCategoryChange,
  counts,
  searchQuery,
  onSearchChange,
}: IPAPageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between pb-6 border-b border-border-subtle">
      <div>
        <span className="ts-kicker text-fg-subtle">
          REFERENCIA · PRONUNCIACIÓN
        </span>
        <h1 className="ts-headline-xl text-fg mt-1">
          Tabla IPA del inglés
        </h1>
        <p className="ts-body-xl text-fg-muted mt-1">
          40 sonidos con audio, boca y ejemplos. Cada uno con su enlace propio.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-surface-sunken border border-border-subtle">
          {TABS.map((tab) => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onCategoryChange(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full ts-pill transition-all",
                  isActive
                    ? "bg-primary text-on-primary shadow-xs"
                    : "text-fg-muted hover:text-fg hover:bg-surface-raised"
                )}
              >
                <span>{tab.label}</span>
                <span className="ts-stat opacity-75">
                  {counts[tab.id]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[220px] flex-1 sm:flex-initial">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle"
            aria-hidden
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar sonido o palabra..."
            className="w-full rounded-full border border-border-subtle bg-surface-sunken pl-9 pr-4 py-2 ts-body text-fg placeholder:text-fg-subtle outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>
    </header>
  );
}
