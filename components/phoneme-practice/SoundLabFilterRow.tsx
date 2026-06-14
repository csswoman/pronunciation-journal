"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

export type SoundLabChip = "all" | "easy" | "medium" | "hard";

interface Props {
  activeChip: SoundLabChip;
  search: string;
  onChipChange: (chip: SoundLabChip) => void;
  onSearchChange: (query: string) => void;
}

const CHIPS: { id: SoundLabChip; label: string; shortLabel: string }[] = [
  { id: "all", label: "All levels", shortLabel: "All" },
  { id: "easy", label: "Easy", shortLabel: "Easy" },
  { id: "medium", label: "Medium", shortLabel: "Med" },
  { id: "hard", label: "Hard", shortLabel: "Hard" },
];

export function SoundLabFilterRow({
  activeChip,
  search,
  onChipChange,
  onSearchChange,
}: Props) {
  return (
    <div className="sound-lab__toolbar">
      <div className="sound-lab__toolbar-main">
        <span className="sound-lab__chrome-label sound-lab__chrome-label--section">Difficulty</span>
        <div className="sound-lab__chip-row" role="group" aria-label="Filter sounds by difficulty">
          {CHIPS.map((chip) => {
            const isOn = activeChip === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => onChipChange(chip.id)}
                className={cn("sound-lab__chip sound-lab__chip--compact", isOn && "sound-lab__chip--on")}
                aria-pressed={isOn}
              >
                <span className="sm:hidden">{chip.shortLabel}</span>
                <span className="hidden sm:inline">{chip.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <label className="sound-lab__search sound-lab__search--compact">
        <Search className="sound-lab__search-icon h-4 w-4" aria-hidden />
        <span className="sr-only">Find sounds and example words</span>
        <input
          type="search"
          placeholder="Find a sound or word…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Find sounds and example words"
        />
      </label>
    </div>
  );
}
