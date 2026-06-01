"use client";

import { Search } from "lucide-react";

export type SoundLabChip = "all" | "easy" | "medium" | "hard";

interface Props {
  activeChip: SoundLabChip;
  search: string;
  onChipChange: (chip: SoundLabChip) => void;
  onSearchChange: (query: string) => void;
}

const CHIPS: { id: SoundLabChip; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "easy", label: "Fácil" },
  { id: "medium", label: "Medio" },
  { id: "hard", label: "Difícil" },
];

export function SoundLabFilterRow({
  activeChip,
  search,
  onChipChange,
  onSearchChange,
}: Props) {
  return (
    <div className="sound-lab__toolbar">
      <div className="sound-lab__chips">
        {CHIPS.map((chip) => {
          const isOn = activeChip === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => onChipChange(chip.id)}
              className={["sound-lab__chip", isOn && "sound-lab__chip--on"]
                .filter(Boolean)
                .join(" ")}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      <label className="sound-lab__search">
        <Search className="h-4 w-4 shrink-0" aria-hidden />
        <input
          type="search"
          placeholder="Buscar sonidos…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Buscar sonidos"
        />
      </label>
    </div>
  );
}
