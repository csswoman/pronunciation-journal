"use client";

import { Search, LayoutGrid, List } from "@/components/icons";
import { cn } from "@/lib/cn";

export type StatusFilter = "all" | "learned" | "reviewing" | "new";
export type SortMode = "alpha" | "difficulty";
export type ViewMode = "grid" | "list";

export type StatusCounts = Record<StatusFilter, number>;

interface WordFiltersBarProps {
  variant?: "toolbar" | "sidebar";
  status: StatusFilter;
  sort: SortMode;
  view: ViewMode;
  search: string;
  counts?: StatusCounts;
  onStatusChange: (s: StatusFilter) => void;
  onSortChange: (s: SortMode) => void;
  onViewChange: (v: ViewMode) => void;
  onSearchChange: (q: string) => void;
}

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "learned", label: "Aprendidas" },
  { id: "reviewing", label: "En repaso" },
  { id: "new", label: "Nuevas" },
];

/**
 * WordFiltersBar - Barra de búsqueda, filtrado y ordenamiento de palabras.
 *
 * Sub-componentes:
 * - Search (Búsqueda por texto)
 * - StatusTabs (Filtro por estado: Todas, Aprendidas, En repaso, Nuevas)
 * - SortSelector (Ordenamiento por A-Z o Dificultad)
 * - ViewToggle (Cambio de vista Cuadrícula / Lista)
 */
export function WordFiltersBar({
  variant = "toolbar",
  status,
  sort,
  view,
  search,
  counts,
  onStatusChange,
  onSortChange,
  onViewChange,
  onSearchChange,
}: WordFiltersBarProps) {
  if (variant === "sidebar") {
    return (
      <div className="flex flex-col gap-4" role="search">
        <p className="font-mono text-tiny uppercase tracking-wider text-fg-subtle font-medium">Filtrar y buscar</p>

        {/* Campo de búsqueda */}
        <label className="flex items-center gap-2 px-3 py-2 bg-surface-sunken border border-border-default rounded-md text-fg-subtle focus-within:border-primary">
          <Search className="w-4 h-4 shrink-0" aria-hidden />
          <span className="sr-only">Buscar palabras</span>
          <input
            type="search"
            placeholder="Buscar palabra…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-transparent border-none text-body-sm text-fg outline-none placeholder:text-fg-disabled"
          />
        </label>

        {/* Pestañas de estado */}
        <div className="flex flex-col gap-1.5">
          <span className="text-caption font-medium text-fg-subtle">Estado</span>
          <div className="flex flex-col gap-1" role="tablist" aria-label="Filtrar por estado">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={status === tab.id}
                onClick={() => onStatusChange(tab.id)}
                className={cn(
                  "flex items-center justify-between px-3 py-2 text-caption font-medium rounded-md transition-colors text-left cursor-pointer",
                  status === tab.id
                    ? "bg-primary-soft text-primary font-semibold"
                    : "text-fg-muted hover:bg-surface-sunken hover:text-fg"
                )}
              >
                <span>{tab.label}</span>
                {counts ? (
                  <span className="text-tiny font-mono opacity-80 tabular-nums">
                    {counts[tab.id]}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {/* Ordenamiento y Vista */}
        <div className="flex flex-col gap-3 pt-3 border-t border-border-subtle">
          <div className="flex items-center justify-between gap-2">
            <span className="text-caption font-medium text-fg-subtle">Orden</span>
            <div className="inline-flex p-0.5 bg-surface-sunken rounded-full border border-border-subtle">
              <button
                type="button"
                onClick={() => onSortChange("alpha")}
                className={cn(
                  "px-3 py-1 text-tiny font-medium rounded-full transition-colors cursor-pointer",
                  sort === "alpha" ? "bg-surface-raised text-fg font-semibold shadow-xs" : "text-fg-muted hover:text-fg"
                )}
              >
                A–Z
              </button>
              <button
                type="button"
                onClick={() => onSortChange("difficulty")}
                className={cn(
                  "px-3 py-1 text-tiny font-medium rounded-full transition-colors cursor-pointer",
                  sort === "difficulty" ? "bg-surface-raised text-fg font-semibold shadow-xs" : "text-fg-muted hover:text-fg"
                )}
              >
                Dificultad
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-caption font-medium text-fg-subtle">Vista</span>
            <div className="inline-flex p-0.5 bg-surface-sunken rounded-md border border-border-subtle">
              <button
                type="button"
                onClick={() => onViewChange("grid")}
                className={cn(
                  "p-1.5 rounded-sm transition-colors cursor-pointer",
                  view === "grid" ? "bg-surface-raised text-fg shadow-xs" : "text-fg-subtle hover:text-fg"
                )}
                aria-label="Vista en cuadrícula"
                aria-pressed={view === "grid"}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onViewChange("list")}
                className={cn(
                  "p-1.5 rounded-sm transition-colors cursor-pointer",
                  view === "list" ? "bg-surface-raised text-fg shadow-xs" : "text-fg-subtle hover:text-fg"
                )}
                aria-label="Vista en lista"
                aria-pressed={view === "list"}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lexicon-area__filters lexicon-area__filters--toolbar" role="search">
      <div className="lexicon-area__toolbar-cluster">
        <div className="lexicon-area__ftabs" role="tablist" aria-label="Filtrar por estado">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={status === tab.id}
              onClick={() => onStatusChange(tab.id)}
              className={cn("lexicon-area__ftab", status === tab.id && "is-active")}
            >
              {tab.label}
              {counts ? (
                <span className="lexicon-area__ftab-count" aria-hidden>
                  {counts[tab.id]}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <span className="lexicon-area__toolbar-divider" aria-hidden />

        <div className="lexicon-area__sortgrp" role="group" aria-label="Ordenar palabras">
          <button
            type="button"
            onClick={() => onSortChange("alpha")}
            className={cn("lexicon-area__sortopt", sort === "alpha" && "is-active")}
          >
            A–Z
          </button>
          <button
            type="button"
            onClick={() => onSortChange("difficulty")}
            className={cn("lexicon-area__sortopt", sort === "difficulty" && "is-active")}
          >
            Dificultad
          </button>
        </div>
      </div>

      <div className="lexicon-area__toolbar-end">
        <label className="lexicon-area__find">
          <Search className="w-3.5 h-3.5 shrink-0" aria-hidden />
          <span className="sr-only">Buscar palabras</span>
          <input
            type="search"
            placeholder="Buscar palabra…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </label>

        <div className="lexicon-area__vtoggle" role="group" aria-label="Vista">
          <button
            type="button"
            onClick={() => onViewChange("grid")}
            className={cn("lexicon-area__vt", view === "grid" && "is-active")}
            aria-label="Vista en cuadrícula"
            aria-pressed={view === "grid"}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewChange("list")}
            className={cn("lexicon-area__vt", view === "list" && "is-active")}
            aria-label="Vista en lista"
            aria-pressed={view === "list"}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

