"use client";

import { ChevronDown, Search, X } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { SoundLabGrouping, SoundLabProgressFilter } from "./sound-lab-page-helpers";

// Structure:
// <SoundLabFilterRow>
//   <SearchField />
//   <GroupingPills />
//   <HardOnlyToggleSwitch />
//   <StateDropdown />
// </SoundLabFilterRow>

export type SoundLabCategoryFilter = "impact" | "vowel" | "consonant";

interface Props {
  groupBy: SoundLabGrouping;
  categoryFilter?: SoundLabCategoryFilter;
  progressFilter: SoundLabProgressFilter;
  onlyHard: boolean;
  search: string;
  onGroupByChange: (grouping: SoundLabGrouping) => void;
  onCategoryFilterChange?: (category: SoundLabCategoryFilter) => void;
  onProgressFilterChange: (filter: SoundLabProgressFilter) => void;
  onOnlyHardChange: (onlyHard: boolean) => void;
  onSearchChange: (query: string) => void;
  resumeAction?: React.ReactNode;
}

export function SoundLabFilterRow({
  groupBy,
  categoryFilter = "impact",
  progressFilter,
  onlyHard,
  search,
  onGroupByChange,
  onCategoryFilterChange,
  onProgressFilterChange,
  onOnlyHardChange,
  onSearchChange,
  resumeAction,
}: Props) {
  const activeCategory = categoryFilter || (groupBy === "impact" ? "impact" : "impact");

  const handleSelectCategory = (cat: SoundLabCategoryFilter) => {
    if (onCategoryFilterChange) {
      onCategoryFilterChange(cat);
    }
    if (cat === "impact") {
      onGroupByChange("impact");
    } else {
      onGroupByChange("type");
    }
  };

  return (
    <div
      className="sound-lab__toolbar flex flex-col lg:flex-row lg:items-center justify-between gap-3 w-full"
      role="region"
      aria-label="Buscar y filtrar sonidos"
    >
      {/* Zona 1: Buscador y Filtros de Categoría */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:flex-1 min-w-0">
        {/* Buscador */}
        <div className="relative w-full sm:w-72 shrink-0">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Buscar sonido o palabra..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && search) {
                e.preventDefault();
                onSearchChange("");
              }
            }}
            className="h-10 w-full rounded-full border border-border bg-surface-sunken py-2 pl-10 pr-9 ts-body text-fg placeholder:ts-body placeholder:text-fg-subtle shadow-2xs transition-all hover:border-border-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
            aria-label="Buscar sonidos y palabras de ejemplo"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full text-fg-muted hover:text-fg hover:bg-surface-raised transition-colors cursor-pointer"
              aria-label="Borrar texto de búsqueda (Escape)"
              title="Borrar búsqueda (Esc)"
            >
              <X size={14} aria-hidden />
            </button>
          )}
        </div>

        {/* Agrupador en Pills: Por impacto, Vocales, Consonantes */}
        <div className="flex items-center gap-1 p-1 rounded-full bg-surface-sunken border border-border w-full sm:w-auto overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => handleSelectCategory("impact")}
            className={cn(
              "px-4 py-1.5 ts-pill rounded-full transition-all cursor-pointer whitespace-nowrap select-none",
              activeCategory === "impact"
                ? "bg-primary text-on-primary shadow-xs"
                : "text-fg-muted hover:text-fg hover:bg-surface-raised",
            )}
          >
            Por impacto
          </button>
          <button
            type="button"
            onClick={() => handleSelectCategory("vowel")}
            className={cn(
              "px-4 py-1.5 ts-pill rounded-full transition-all cursor-pointer whitespace-nowrap select-none",
              activeCategory === "vowel"
                ? "bg-primary text-on-primary shadow-xs"
                : "text-fg-muted hover:text-fg hover:bg-surface-raised",
            )}
          >
            Vocales
          </button>
          <button
            type="button"
            onClick={() => handleSelectCategory("consonant")}
            className={cn(
              "px-4 py-1.5 ts-pill rounded-full transition-all cursor-pointer whitespace-nowrap select-none",
              activeCategory === "consonant"
                ? "bg-primary text-on-primary shadow-xs"
                : "text-fg-muted hover:text-fg hover:bg-surface-raised",
            )}
          >
            Consonantes
          </button>
        </div>
      </div>

      {/* Zona 2: Controles de Solo difíciles y Estado */}
      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
        {/* Toggle Solo difíciles estilo Switch */}
        <button
          type="button"
          role="switch"
          aria-checked={onlyHard}
          onClick={() => onOnlyHardChange(!onlyHard)}
          className="inline-flex items-center gap-2.5 ts-body text-fg cursor-pointer select-none"
        >
          <div
            className={cn(
              "w-10 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex items-center",
              onlyHard ? "bg-primary" : "bg-border-strong",
            )}
          >
            <div
              className={cn(
                "w-5 h-5 rounded-full bg-paper shadow-xs transition-transform duration-200 ease-in-out transform",
                onlyHard ? "translate-x-4" : "translate-x-0",
              )}
            />
          </div>
          <span className="ts-body text-fg">Solo difíciles</span>
        </button>

        {/* Selector de Estado en cápsula */}
        <div className="relative shrink-0">
          <select
            value={progressFilter}
            onChange={(e) => onProgressFilterChange(e.target.value as SoundLabProgressFilter)}
            className="h-10 appearance-none rounded-full border border-border bg-surface-sunken pl-4 pr-9 ts-body text-fg shadow-2xs transition-all hover:border-border-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] cursor-pointer"
            aria-label="Filtrar por estado de práctica"
          >
            <option value="all">Estado: todos</option>
            <option value="review">Estado: en curso</option>
            <option value="unpracticed">Estado: sin practicar</option>
            <option value="mastered">Estado: dominados</option>
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-fg-subtle"
            aria-hidden
          />
        </div>

        {resumeAction ? (
          <div className="shrink-0">{resumeAction}</div>
        ) : null}
      </div>
    </div>
  );
}
