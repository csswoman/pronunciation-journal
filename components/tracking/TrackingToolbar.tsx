"use client";

// Planned structure:
// <TrackingToolbar>
//   <TrackingSegmentedControl: FilterButtons />
//   <TrackingControlsGroup>
//     <TrackingSearchInput: SearchIcon + Input + ClearButton />
//     <TrackingReviewAction: ReviewButton />
//   </TrackingControlsGroup>
// </TrackingToolbar>

import { useCallback, type KeyboardEvent } from "react";
import { Play, Search, X } from "@/components/icons";
import Button from "@/components/ui/Button";
import type { TrackingFilter } from "@/lib/tracking/types";

const FILTERS: { id: TrackingFilter; label: string }[] = [
  { id: "all", label: "Todo" },
  { id: "word", label: "Palabras" },
  { id: "phrase", label: "Frases" },
  { id: "lesson", label: "Lecciones" },
  { id: "ai_coach", label: "Del coach" },
];

export interface TrackingToolbarProps {
  filter: TrackingFilter;
  onFilterChange: (filter: TrackingFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  canReview: boolean;
  availableReviewCount: number;
  startingReview: boolean;
  onStartReview: () => void;
}

export function TrackingToolbar({
  filter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  canReview,
  availableReviewCount,
  startingReview,
  onStartReview,
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

  return (
    <div className="tracking-toolbar">
      <div
        role="group"
        aria-label="Filtrar contenido guardado"
        className="tracking-segmented-control"
      >
        {FILTERS.map(({ id, label }) => {
          const isActive = filter === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onFilterChange(id)}
              aria-pressed={isActive}
              className={`tracking-segmented-control__item focus-ring ${
                isActive ? "tracking-segmented-control__item--active" : ""
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
        <div className="relative min-w-0 flex-1 sm:w-60">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Buscar en guardados…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Buscar en guardados"
            className="h-10 w-full rounded-[var(--radius-sm)] border border-border-subtle bg-surface-sunken py-2 pl-9 pr-9 text-body-sm text-fg placeholder:text-fg-subtle outline-none transition-[border-color,box-shadow] duration-150 focus:border-[var(--border-focus)] focus:shadow-[0_0_0_3px_var(--focus-color)]"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Borrar búsqueda"
              title="Borrar búsqueda"
              className="focus-ring absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-fg-subtle transition-colors hover:bg-surface-raised hover:text-fg active:scale-95"
            >
              <X size={14} aria-hidden />
            </button>
          ) : null}
        </div>
        {canReview ? (
          <Button
            onClick={onStartReview}
            disabled={startingReview}
            aria-busy={startingReview}
            icon={<Play size={15} aria-hidden />}
          >
            {startingReview
              ? "Preparando…"
              : availableReviewCount > 0
                ? `Repasar (${availableReviewCount})`
                : "Repasar"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
