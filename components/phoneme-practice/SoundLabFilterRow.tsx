"use client";

import { Search } from "@/components/icons";
import { cn } from "@/lib/cn";

export type SoundLabChip = "all" | "easy" | "medium" | "hard";

interface Props {
  activeChip: SoundLabChip;
  search: string;
  onChipChange: (chip: SoundLabChip) => void;
  onSearchChange: (query: string) => void;
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
  onChipChange,
  onSearchChange,
}: Props) {
  return (
    <div className="sound-lab__toolbar">
      <div
        className="sound-lab__chip-row"
        role="group"
        aria-label="Filtrar sonidos por dificultad"
      >
        <span className="sr-only">Dificultad</span>
        {CHIPS.map((chip) => {
          const isOn = activeChip === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => onChipChange(chip.id)}
              className={cn(
                "sound-lab__chip sound-lab__chip--compact",
                isOn && "sound-lab__chip--on",
              )}
              aria-pressed={isOn}
            >
              <span className="sm:hidden">{chip.shortLabel}</span>
              <span className="hidden sm:inline">{chip.label}</span>
            </button>
          );
        })}
      </div>

      <label className="sound-lab__search sound-lab__search--compact">
        <Search className="sound-lab__search-icon h-4 w-4" aria-hidden />
        <span className="sr-only">Buscar sonidos y palabras de ejemplo</span>
        <input
          type="search"
          placeholder="Buscar un sonido o palabra…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Buscar sonidos y palabras de ejemplo"
        />
      </label>
    </div>
  );
}
