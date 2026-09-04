"use client";

import { ChevronDown, Search, X } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { SoundLabProgressFilter } from "./sound-lab-page-helpers";

// Structure:
// <SoundLabFilterRow>
//   <SearchField />
//   <StateDropdown />
//   <HardOnlyToggle />
// </SoundLabFilterRow>

interface Props {
  progressFilter: SoundLabProgressFilter;
  onlyHard: boolean;
  search: string;
  onProgressFilterChange: (filter: SoundLabProgressFilter) => void;
  onOnlyHardChange: (onlyHard: boolean) => void;
  onSearchChange: (query: string) => void;
  resumeAction?: React.ReactNode;
}

export function SoundLabFilterRow({
  progressFilter,
  onlyHard,
  search,
  onProgressFilterChange,
  onOnlyHardChange,
  onSearchChange,
  resumeAction,
}: Props) {
  return (
    <div
      className="sound-lab__toolbar flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 w-full"
      role="region"
      aria-label="Buscar y filtrar sonidos"
    >
      {/* Zona 1: Buscador y acción rápida en móvil */}
      <div className="flex items-center gap-2 w-full sm:flex-1 min-w-0">
        <div className="relative flex-1 min-w-0">
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
            className="h-10 w-full rounded-xl border border-border-default bg-surface-sunken py-2 pl-10 pr-9 text-body-sm text-fg placeholder:text-fg-subtle shadow-xs transition-all hover:border-border-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
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

        {/* En mobile (<640px), el botón Continuar se muestra al lado del buscador */}
        {resumeAction ? (
          <div className="sm:hidden shrink-0">{resumeAction}</div>
        ) : null}
      </div>

      {/* Zona 2: Filtros de estado y dificultad */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-none py-0.5 sm:py-0 shrink-0">
        {/* Selector de Estado */}
        <div className="relative shrink-0">
          <select
            value={progressFilter}
            onChange={(e) => onProgressFilterChange(e.target.value as SoundLabProgressFilter)}
            className="h-10 appearance-none rounded-xl border border-border-default bg-surface-sunken pl-4 pr-9 text-body-sm font-medium text-fg shadow-xs transition-all hover:border-border-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] cursor-pointer"
            aria-label="Filtrar por estado de práctica"
          >
            <option value="all">Estado: todos</option>
            <option value="review">Estado: en curso</option>
            <option value="unpracticed">Estado: sin practicar</option>
            <option value="mastered">Estado: dominados</option>
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fg-subtle"
            aria-hidden
          />
        </div>

        {/* Toggle Solo difíciles con shade interactivo */}
        <button
          type="button"
          role="switch"
          aria-checked={onlyHard}
          onClick={() => onOnlyHardChange(!onlyHard)}
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-xl border px-3.5 text-body-sm font-medium transition-all duration-150 cursor-pointer select-none shrink-0 shadow-xs active:scale-95 focus-visible:outline-2 focus-visible:outline-primary whitespace-nowrap",
            onlyHard
              ? "border-badge-warning-border bg-badge-warning-bg text-warning font-semibold"
              : "border-border-default bg-surface-sunken text-fg-muted hover:border-border-strong hover:text-fg hover:bg-surface-raised",
          )}
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full transition-colors",
              onlyHard ? "bg-warning" : "bg-fg-subtle",
            )}
            aria-hidden
          />
          <span>Solo difíciles</span>
        </button>

        {/* En tablet y desktop (>=640px), el botón Continuar va al final de la barra */}
        {resumeAction ? (
          <div className="hidden sm:flex shrink-0 items-center">{resumeAction}</div>
        ) : null}
      </div>
    </div>
  );
}
