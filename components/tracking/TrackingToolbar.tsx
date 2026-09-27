"use client";

// Planned structure:
// <TrackingToolbar>
//   <FilterPillsGroup />
//   <ControlsRightGroup: SearchInput + ViewModeToggle />
// </TrackingToolbar>

import { useCallback, type KeyboardEvent } from "react";
import { LayoutGrid, List, Search, X } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { TrackingFilter } from "@/lib/tracking/types";

export interface FilterCounts {
  all: number;
  word: number;
  phrase: number;
  lesson: number;
  coach: number;
}

export type SortMode = "due" | "recent" | "alpha";

export interface TrackingToolbarProps {
  filter: TrackingFilter;
  onFilterChange: (filter: TrackingFilter) => void;
  counts: FilterCounts;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortMode?: SortMode;
  onSortChange?: (mode: SortMode) => void;
  viewMode: "list" | "grid";
  onViewModeChange: (mode: "list" | "grid") => void;
}

export function TrackingToolbar({
  filter,
  onFilterChange,
  counts,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
}: TrackingToolbarProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape" && searchQuery) {
        e.preventDefault();
        onSearchChange("");
      }
    },
    [searchQuery, onSearchChange],
  );

  const filters: { id: TrackingFilter; label: string; count: number }[] = [
    { id: "all", label: "Todo", count: counts.all },
    { id: "word", label: "Palabras", count: counts.word },
    { id: "phrase", label: "Frases", count: counts.phrase },
    { id: "lesson", label: "Lecciones", count: counts.lesson },
    { id: "ai_coach", label: "Del coach", count: counts.coach },
  ];

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
      <div
        role="group"
        aria-label="Filtrar contenido guardado"
        className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
      >
        {filters.map(({ id, label, count }) => {
          const isActive = filter === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onFilterChange(id)}
              aria-pressed={isActive}
              className={cn(
                "focus-ring inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-body-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-on-primary font-semibold shadow-xs"
                  : "bg-surface-raised border border-border-subtle text-fg-muted hover:bg-surface-sunken hover:text-fg",
              )}
            >
              <span>{label}</span>
              <span
                className={cn(
                  "text-caption font-mono",
                  isActive ? "text-on-primary/90 font-bold" : "text-fg-subtle",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="relative min-w-[160px] sm:w-56 shrink-0">
          <Search
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Buscar en guardados"
            className="h-10 w-full rounded-full border border-border-subtle bg-surface-raised py-2 pl-9 pr-8 text-body-sm text-fg placeholder:text-fg-subtle outline-none transition-[border-color,box-shadow] focus:border-accent focus:shadow-xs"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Borrar búsqueda"
              className="focus-ring absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-fg-subtle hover:text-fg"
            >
              <X size={13} aria-hidden />
            </button>
          ) : null}
        </div>

        <div className="inline-flex h-10 shrink-0 items-center rounded-full border border-border-subtle bg-surface-sunken p-1 gap-1">
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            aria-pressed={viewMode === "list"}
            aria-label="Vista de lista"
            className={cn(
              "focus-ring inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-body-sm font-semibold transition-all",
              viewMode === "list"
                ? "bg-primary text-on-primary shadow-xs"
                : "text-fg-muted hover:text-fg",
            )}
          >
            <List size={15} aria-hidden />
            <span>Lista</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            aria-pressed={viewMode === "grid"}
            aria-label="Vista de cuadrícula"
            className={cn(
              "focus-ring inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-body-sm font-semibold transition-all",
              viewMode === "grid"
                ? "bg-primary text-on-primary shadow-xs"
                : "text-fg-muted hover:text-fg",
            )}
          >
            <LayoutGrid size={15} aria-hidden />
            <span>Cuadrícula</span>
          </button>
        </div>
      </div>
    </div>
  );
}
