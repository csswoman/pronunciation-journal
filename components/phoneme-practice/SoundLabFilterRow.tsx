"use client";

import { Search, X } from "@/components/icons";
import { cn } from "@/lib/cn";

export type SoundLabChip = "all" | "easy" | "medium" | "hard";

interface Props {
  activeChip: SoundLabChip;
  search: string;
  resultCount: number;
  onChipChange: (chip: SoundLabChip) => void;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
}

const CHIPS: { id: SoundLabChip; label: string; shortLabel: string }[] = [
  { id: "all", label: "Todos", shortLabel: "Todos" },
  { id: "easy", label: "Fácil", shortLabel: "Fácil" },
  { id: "medium", label: "Medio", shortLabel: "Medio" },
  { id: "hard", label: "Difícil", shortLabel: "Difícil" },
];

export function SoundLabFilterRow({
  activeChip,
  search,
  resultCount,
  onChipChange,
  onSearchChange,
  onClearFilters,
}: Props) {
  const hasActiveFilters = activeChip !== "all" || search.trim().length > 0;
  const resultLabel = `${resultCount} ${resultCount === 1 ? "sonido" : "sonidos"}`;

  return (
    <div
      className="sound-lab__toolbar"
      role="region"
      aria-label="Buscar y filtrar sonidos"
    >
      <div className="sound-lab__filter-controls">
        <div className="sound-lab__chip-row" role="group" aria-label="Dificultad">
          {CHIPS.map((chip) => {
            const isOn = activeChip === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => onChipChange(chip.id)}
                className={cn( "sound-lab__chip sound-lab__chip--compact", isOn && "sound-lab__chip--on", )}
                aria-pressed={isOn}
              >
                <span className="sm:hidden">{chip.shortLabel}</span>
                <span className="hidden sm:inline">{chip.label}</span>
              </button>
            );
          })}
        </div>
        <span
          className="sound-lab__result-count"
          aria-live="polite"
          aria-atomic="true"
        >
          {resultLabel}
        </span>
        {hasActiveFilters && (
          <button
            type="button"
            className="sound-lab__clear-filters"
            onClick={onClearFilters}
          >
            Limpiar
          </button>
        )}
      </div>

      <div className="sound-lab__search sound-lab__search--compact">
        <Search className="sound-lab__search-icon h-4 w-4" aria-hidden />
        <input
          type="search"
          placeholder="Buscar un sonido o palabra…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Buscar sonidos y palabras de ejemplo"
        />
        {search && (
          <button
            type="button"
            className="sound-lab__clear-search"
            onClick={() => onSearchChange("")}
            aria-label="Borrar búsqueda"
          >
            <X size={15} aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
